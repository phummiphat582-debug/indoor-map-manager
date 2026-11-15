import type {
  ConnectionStatus,
  EquipmentPin,
  FloorPlan,
  OfflineMutation,
  RealtimeMessage,
  RealtimeProviderType,
} from '../../types';
import { getCurrentUser } from '../auth';
import {
  getSupabaseClient,
  mapEquipmentToSupabase,
  mapFloorPlanToSupabase,
  mapSupabaseToEquipment,
  mapSupabaseToFloorPlan,
} from '../supabaseClient';

const CLOUD_CONFIG_KEY = 'indoor_map_cloud_config_v1';
const OFFLINE_QUEUE_KEY = 'indoor_map_offline_queue_v1';

// Public demo API key สำหรับ PieSocket WebSocket relay (ไม่มีค่าใช้จ่าย ใช้งานร่วมกันแบบแยกห้องได้)
const PIESOCKET_API_KEY = 'VC3OtKQDmqqHGZXtdtvFtDqn61WFioAcXjhEco27';

export interface RealtimeEngineListener {
  onStatusChange?: (status: ConnectionStatus) => void;
  onLastSyncChange?: (date: Date) => void;
  onRemotePinUpsert?: (pin: EquipmentPin, senderName: string) => void;
  onRemotePinDelete?: (pinId: string, senderName: string) => void;
  onRemoteMapUpsert?: (map: FloorPlan, senderName: string) => void;
  onRemoteMapDelete?: (mapId: string, senderName: string) => void;
  onConflictNotice?: (message: string) => void;
  onOfflineQueueSynced?: (count: number) => void;
}

class RealtimeEngine {
  private status: ConnectionStatus = 'offline';
  private lastSyncAt: Date | null = null;
  private listeners: Set<RealtimeEngineListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private supabaseChannel: any = null;
  private reconnectTimer: any = null;
  private clientId: string = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  private provider: RealtimeProviderType = 'cloud-relay';
  private roomId: string = 'default-room';
  private offlineQueue: OfflineMutation[] = [];

  constructor() {
    this.loadConfig();
    this.loadOfflineQueue();
    this.initBroadcastChannel();
    this.initNetworkListeners();
  }

  public init() {
    if (navigator.onLine) {
      this.connect();
    } else {
      this.setStatus('offline');
    }
  }

  public subscribe(listener: RealtimeEngineListener): () => void {
    this.listeners.add(listener);
    if (listener.onStatusChange) listener.onStatusChange(this.status);
    if (listener.onLastSyncChange && this.lastSyncAt) listener.onLastSyncChange(this.lastSyncAt);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getLastSyncAt(): Date | null {
    return this.lastSyncAt;
  }

  public getOfflineQueueCount(): number {
    return this.offlineQueue.length;
  }

  public getProvider(): RealtimeProviderType {
    return this.provider;
  }

  public getRoomId(): string {
    return this.roomId;
  }

  public setProvider(provider: RealtimeProviderType, roomId?: string) {
    this.provider = provider;
    if (roomId) this.roomId = roomId;
    this.saveConfig();
    this.disconnect();
    this.connect();
  }

  public setRoomId(roomId: string) {
    this.roomId = roomId.trim() || 'default-room';
    this.saveConfig();
    this.disconnect();
    this.connect();
  }

  // ----------------------------------------------------
  // การเชื่อมต่อโครงข่าย (WebSocket & Supabase)
  // ----------------------------------------------------

  private connect() {
    this.setStatus('connecting');

    if (this.provider === 'supabase') {
      this.connectSupabase();
    } else {
      this.connectCloudRelay();
    }
  }

  private disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }

    if (this.supabaseChannel) {
      const client = getSupabaseClient();
      if (client) {
        client.removeChannel(this.supabaseChannel);
      }
      this.supabaseChannel = null;
    }
  }

  private connectCloudRelay() {
    try {
      const cleanRoom = encodeURIComponent(this.roomId || 'default-room');
      const wsUrl = `wss://demo.piesocket.com/v3/indoor_map_${cleanRoom}?api_key=${PIESOCKET_API_KEY}&notify_self=false`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.updateSyncTime();
        this.flushOfflineQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          this.handleIncomingMessage(message);
        } catch {
          // ignore non-json
        }
      };

      this.ws.onerror = () => {
        this.setStatus('error');
      };

      this.ws.onclose = () => {
        if (navigator.onLine) {
          this.setStatus('connecting');
          this.scheduleReconnect();
        } else {
          this.setStatus('offline');
        }
      };
    } catch (err) {
      console.warn('Failed to connect to Cloud Relay WebSocket:', err);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  private connectSupabase() {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase credentials not configured, falling back to Cloud Relay');
      this.provider = 'cloud-relay';
      this.connectCloudRelay();
      return;
    }

    try {
      this.supabaseChannel = client
        .channel(`indoor-map-room-${this.roomId}`)
        .on('broadcast', { event: 'realtime_event' }, (payload: any) => {
          this.handleIncomingMessage(payload.payload as RealtimeMessage);
        })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'indoor_equipment' },
          (payload: any) => {
            this.handleSupabaseEquipmentChange(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'indoor_floor_plans' },
          (payload: any) => {
            this.handleSupabaseMapChange(payload);
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            this.setStatus('connected');
            this.updateSyncTime();
            this.flushOfflineQueue();
          } else if (status === 'CHANNEL_ERROR') {
            this.setStatus('error');
            this.scheduleReconnect();
          } else if (status === 'CLOSED') {
            this.setStatus('offline');
          }
        });
    } catch (err) {
      console.error('Supabase subscription failed:', err);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (navigator.onLine) {
        this.connect();
      }
    }, 4000);
  }

  private initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('indoor_map_realtime_channel');
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }
  }

  private initNetworkListeners() {
    window.addEventListener('online', () => {
      this.connect();
    });

    window.addEventListener('offline', () => {
      this.setStatus('offline');
      this.disconnect();
    });
  }

  private setStatus(status: ConnectionStatus) {
    if (this.status === status) return;
    this.status = status;
    this.listeners.forEach((l) => l.onStatusChange?.(status));
  }

  private updateSyncTime() {
    this.lastSyncAt = new Date();
    this.listeners.forEach((l) => l.onLastSyncChange?.(this.lastSyncAt!));
  }

  // ----------------------------------------------------
  // ส่งข้อมูล Realtime (Broadcast & Supabase)
  // ----------------------------------------------------

  public async broadcastPinUpsert(pin: EquipmentPin) {
    const user = getCurrentUser();
    const updatedPin: EquipmentPin = {
      ...pin,
      updatedAt: new Date().toISOString(),
      updatedBy: `${user.name} (${user.role.toUpperCase()})`,
      version: (pin.version || 1) + 1,
    };

    const message: RealtimeMessage = {
      type: 'PIN_UPSERT',
      senderId: this.clientId,
      senderName: user.name,
      timestamp: new Date().toISOString(),
      payload: updatedPin,
    };

    this.send(message);

    // หากเปิดใช้งาน Supabase ให้บันทึกลง Table ด้วย
    if (this.provider === 'supabase') {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('indoor_equipment').upsert(mapEquipmentToSupabase(updatedPin));
        } catch (err) {
          console.warn('Supabase equipment upsert failed, queued for retry:', err);
          this.enqueueOfflineMutation('UPSERT_PIN', updatedPin);
        }
      }
    }

    if (this.status !== 'connected') {
      this.enqueueOfflineMutation('UPSERT_PIN', updatedPin);
    }

    return updatedPin;
  }

  public async broadcastPinDelete(pinId: string) {
    const user = getCurrentUser();
    const message: RealtimeMessage = {
      type: 'PIN_DELETE',
      senderId: this.clientId,
      senderName: user.name,
      timestamp: new Date().toISOString(),
      payload: { id: pinId },
    };

    this.send(message);

    if (this.provider === 'supabase') {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('indoor_equipment').delete().eq('id', pinId);
        } catch (err) {
          this.enqueueOfflineMutation('DELETE_PIN', { id: pinId });
        }
      }
    }

    if (this.status !== 'connected') {
      this.enqueueOfflineMutation('DELETE_PIN', { id: pinId });
    }
  }

  public async broadcastMapUpsert(map: FloorPlan) {
    const user = getCurrentUser();
    const updatedMap: FloorPlan = {
      ...map,
      updatedAt: new Date().toISOString(),
      updatedBy: `${user.name} (${user.role.toUpperCase()})`,
      version: (map.version || 1) + 1,
    };

    const message: RealtimeMessage = {
      type: 'MAP_UPSERT',
      senderId: this.clientId,
      senderName: user.name,
      timestamp: new Date().toISOString(),
      payload: updatedMap,
    };

    this.send(message);

    if (this.provider === 'supabase') {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('indoor_floor_plans').upsert(mapFloorPlanToSupabase(updatedMap));
        } catch (err) {
          this.enqueueOfflineMutation('UPSERT_MAP', updatedMap);
        }
      }
    }

    if (this.status !== 'connected') {
      this.enqueueOfflineMutation('UPSERT_MAP', updatedMap);
    }

    return updatedMap;
  }

  public async broadcastMapDelete(mapId: string) {
    const user = getCurrentUser();
    const message: RealtimeMessage = {
      type: 'MAP_DELETE',
      senderId: this.clientId,
      senderName: user.name,
      timestamp: new Date().toISOString(),
      payload: { id: mapId },
    };

    this.send(message);

    if (this.provider === 'supabase') {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('indoor_floor_plans').delete().eq('id', mapId);
        } catch (err) {
          this.enqueueOfflineMutation('DELETE_MAP', { id: mapId });
        }
      }
    }

    if (this.status !== 'connected') {
      this.enqueueOfflineMutation('DELETE_MAP', { id: mapId });
    }
  }

  private send(message: RealtimeMessage) {
    // 1. ส่งผ่าน BroadcastChannel ให้แท็บอื่นในเครื่องเดียวกัน
    try {
      this.broadcastChannel?.postMessage(message);
    } catch {
      // ignore
    }

    // 2. ส่งผ่าน WebSocket Cloud Relay
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        this.updateSyncTime();
      } catch (e) {
        console.warn('WebSocket send failed:', e);
      }
    }

    // 3. ส่งผ่าน Supabase Realtime Broadcast
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'realtime_event',
          payload: message,
        });
        this.updateSyncTime();
      } catch (e) {
        console.warn('Supabase broadcast send failed:', e);
      }
    }
  }

  // ----------------------------------------------------
  // รับข้อความจากอุปกรณ์อื่น (Incoming Messages)
  // ----------------------------------------------------

  private handleIncomingMessage(message: RealtimeMessage) {
    // ป้องกัน echo จากตัวส่งคนเดียวกัน
    if (message.senderId === this.clientId) return;

    this.updateSyncTime();

    switch (message.type) {
      case 'PIN_UPSERT':
        this.listeners.forEach((l) => l.onRemotePinUpsert?.(message.payload, message.senderName));
        break;
      case 'PIN_DELETE':
        this.listeners.forEach((l) => l.onRemotePinDelete?.(message.payload.id, message.senderName));
        break;
      case 'MAP_UPSERT':
        this.listeners.forEach((l) => l.onRemoteMapUpsert?.(message.payload, message.senderName));
        break;
      case 'MAP_DELETE':
        this.listeners.forEach((l) => l.onRemoteMapDelete?.(message.payload.id, message.senderName));
        break;
      default:
        break;
    }
  }

  private handleSupabaseEquipmentChange(payload: any) {
    this.updateSyncTime();
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const pin = mapSupabaseToEquipment(payload.new);
      this.listeners.forEach((l) => l.onRemotePinUpsert?.(pin, pin.updatedBy || 'ผู้ใช้ Supabase'));
    } else if (payload.eventType === 'DELETE') {
      this.listeners.forEach((l) => l.onRemotePinDelete?.(payload.old.id, 'ผู้ใช้ Supabase'));
    }
  }

  private handleSupabaseMapChange(payload: any) {
    this.updateSyncTime();
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const map = mapSupabaseToFloorPlan(payload.new);
      this.listeners.forEach((l) => l.onRemoteMapUpsert?.(map, map.updatedBy || 'ผู้ใช้ Supabase'));
    } else if (payload.eventType === 'DELETE') {
      this.listeners.forEach((l) => l.onRemoteMapDelete?.(payload.old.id, 'ผู้ใช้ Supabase'));
    }
  }

  // ----------------------------------------------------
  // จัดการคิวออฟไลน์ (Offline Sync Queue)
  // ----------------------------------------------------

  private enqueueOfflineMutation(
    action: OfflineMutation['action'],
    payload: any
  ) {
    const mutation: OfflineMutation = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    this.offlineQueue.push(mutation);
    this.saveOfflineQueue();
  }

  public async flushOfflineQueue() {
    if (this.offlineQueue.length === 0 || this.status !== 'connected') return;

    const count = this.offlineQueue.length;
    const queueToProcess = [...this.offlineQueue];
    this.offlineQueue = [];
    this.saveOfflineQueue();

    for (const item of queueToProcess) {
      try {
        if (item.action === 'UPSERT_PIN') {
          await this.broadcastPinUpsert(item.payload);
        } else if (item.action === 'DELETE_PIN') {
          await this.broadcastPinDelete(item.payload.id);
        } else if (item.action === 'UPSERT_MAP') {
          await this.broadcastMapUpsert(item.payload);
        } else if (item.action === 'DELETE_MAP') {
          await this.broadcastMapDelete(item.payload.id);
        }
      } catch (e) {
        console.warn('Failed to sync offline item, requeueing:', e);
        this.offlineQueue.push(item);
      }
    }

    this.saveOfflineQueue();
    if (count > 0) {
      this.listeners.forEach((l) => l.onOfflineQueueSynced?.(count));
    }
  }

  private loadOfflineQueue() {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      this.offlineQueue = raw ? JSON.parse(raw) : [];
    } catch {
      this.offlineQueue = [];
    }
  }

  private saveOfflineQueue() {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.offlineQueue));
    } catch {
      // ignore
    }
  }

  private loadConfig() {
    try {
      const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.provider) this.provider = parsed.provider;
        if (parsed.roomId) this.roomId = parsed.roomId;
      }
    } catch {
      // ignore
    }
  }

  private saveConfig() {
    try {
      localStorage.setItem(
        CLOUD_CONFIG_KEY,
        JSON.stringify({
          provider: this.provider,
          roomId: this.roomId,
        })
      );
    } catch {
      // ignore
    }
  }
}

export const realtimeEngine = new RealtimeEngine();

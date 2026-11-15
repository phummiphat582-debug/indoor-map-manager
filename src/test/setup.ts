import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Mock BroadcastChannel for JSDOM
if (typeof globalThis.BroadcastChannel === 'undefined') {
  class MockBroadcastChannel {
    name: string;
    onmessage: ((event: MessageEvent) => void) | null = null;
    constructor(name: string) {
      this.name = name;
    }
    postMessage(_data: unknown) {}
    close() {}
  }
  globalThis.BroadcastChannel = MockBroadcastChannel as any;
}

// Mock WebSocket for JSDOM to avoid real network attempts during unit tests
class MockWebSocket {
  url: string;
  readyState: number = 1; // OPEN
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  static OPEN = 1;
  static CLOSED = 3;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(_data: string | ArrayBufferLike | Blob | ArrayBufferView) {}
  close() {
    this.readyState = 3;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

globalThis.WebSocket = MockWebSocket as any;

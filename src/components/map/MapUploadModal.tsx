import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, AlertCircle, FileCheck, Check, Loader2 } from 'lucide-react';
import type { FloorPlan } from '../../types';
import { validateImageFile, readFileAsDataURL, getImageDimensions, formatFileSize } from '../../utils/fileHelpers';
import { MAX_FILE_SIZE_MB } from '../../constants/equipmentConfig';

interface MapUploadModalProps {
  isOpen: boolean;
  mapCount: number;
  onClose: () => void;
  onSaveFloorPlan: (floorPlan: FloorPlan) => void;
}

export const MapUploadModal: React.FC<MapUploadModalProps> = ({
  isOpen,
  mapCount,
  onClose,
  onSaveFloorPlan,
}) => {
  const [mapName, setMapName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMapName(`ชั้น ${mapCount + 1}`);
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileDimensions(null);
      setErrorMsg(null);
      setIsLoading(false);
    }
  }, [isOpen, mapCount]);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setErrorMsg(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'ไฟล์ไม่ถูกต้อง');
      return;
    }

    setIsLoading(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      const dims = await getImageDimensions(dataUrl);

      setSelectedFile(file);
      setPreviewUrl(dataUrl);
      setFileDimensions(dims);

      // ตั้งชื่อเริ่มต้นตามชื่อไฟล์ถ้ายังไม่ได้เปลี่ยน
      if (!mapName || mapName.startsWith('ชั้น ')) {
        const rawName = file.name.replace(/\.[^/.]+$/, '');
        setMapName(rawName.length > 20 ? rawName.substring(0, 20) : rawName);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการประมวลผลไฟล์ภาพ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleConfirm = () => {
    if (!selectedFile || !previewUrl || !fileDimensions) {
      setErrorMsg('กรุณาเลือกไฟล์ภาพแผนที่');
      return;
    }

    if (!mapName.trim()) {
      setErrorMsg('กรุณาระบุชื่อแผนที่');
      return;
    }

    const newFloorPlan: FloorPlan = {
      id: `map-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: mapName.trim(),
      dataUrl: previewUrl,
      mimeType: selectedFile.type || 'image/png',
      width: fileDimensions.width,
      height: fileDimensions.height,
      fileSize: selectedFile.size,
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveFloorPlan(newFloorPlan);
    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileDimensions(null);
    setErrorMsg(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={handleResetAndClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 my-6 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 id="upload-modal-title" className="text-lg font-bold text-slate-900">
              เพิ่มแผนที่ผังอาคารใหม่
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              รองรับไฟล์ PNG, JPG, JPEG และ SVG ขนาดไม่เกิน {MAX_FILE_SIZE_MB} MB
            </p>
          </div>
          <button
            onClick={handleResetAndClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ชื่อแผนที่ / ผังอาคาร <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="เช่น ชั้น 1, ชั้น 2, อาคาร A, ลานจอดรถ"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ไฟล์ภาพแผนที่ <span className="text-rose-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {!previewUrl ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                {isLoading ? (
                  <div className="py-6 flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="text-sm font-medium text-slate-700">กำลังประมวลผลไฟล์ภาพ...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      PNG, JPG, JPEG, SVG (สูงสุด {MAX_FILE_SIZE_MB}MB)
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center max-h-56">
                  <img
                    src={previewUrl}
                    alt="ตัวอย่างแผนที่"
                    className="max-h-56 w-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      setFileDimensions(null);
                    }}
                    className="min-h-[44px] min-w-[44px] absolute top-2 right-2 flex items-center justify-center rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white transition cursor-pointer"
                    aria-label="เลือกภาพอื่น"
                    title="เลือกภาพอื่น"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedFile && fileDimensions && (
                  <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl text-xs text-slate-700">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium truncate">{selectedFile.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-slate-500 font-mono">
                      <span>{fileDimensions.width} × {fileDimensions.height} px</span>
                      <span>{formatFileSize(selectedFile.size)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-medium transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={!previewUrl || isLoading}
            onClick={handleConfirm}
            className="min-h-[44px] flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition shadow-sm shadow-blue-600/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>เพิ่มแผนที่นี้</span>
          </button>
        </div>
      </div>
    </div>
  );
};

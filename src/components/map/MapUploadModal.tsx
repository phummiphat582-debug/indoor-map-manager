import React, { useState, useRef } from 'react';
import { UploadCloud, X, AlertCircle, FileCheck, Check, Loader2 } from 'lucide-react';
import type { FloorPlan } from '../../types';
import { validateImageFile, readFileAsDataURL, getImageDimensions, formatFileSize } from '../../utils/fileHelpers';
import { MAX_FILE_SIZE_MB } from '../../constants/equipmentConfig';

interface MapUploadModalProps {
  isOpen: boolean;
  hasExistingMap: boolean;
  onClose: () => void;
  onSaveFloorPlan: (floorPlan: FloorPlan) => void;
}

export const MapUploadModal: React.FC<MapUploadModalProps> = ({
  isOpen,
  hasExistingMap,
  onClose,
  onSaveFloorPlan,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!selectedFile || !previewUrl || !fileDimensions) return;

    const newFloorPlan: FloorPlan = {
      id: `fp-${Date.now()}`,
      name: selectedFile.name,
      dataUrl: previewUrl,
      mimeType: selectedFile.type || 'image/png',
      width: fileDimensions.width,
      height: fileDimensions.height,
      fileSize: selectedFile.size,
      uploadedAt: new Date().toISOString(),
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleResetAndClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 id="upload-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {hasExistingMap ? 'เปลี่ยนแผนที่ผังอาคาร' : 'อัปโหลดแผนที่ผังอาคาร'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              รองรับไฟล์ PNG, JPG, JPEG และ SVG ขนาดไม่เกิน {MAX_FILE_SIZE_MB} MB
            </p>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {hasExistingMap && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <span>
              การเปลี่ยนภาพแผนที่ใหม่ จุดติดตั้งอุปกรณ์เดิมจะยังคงอยู่และถูกปรับตำแหน่งสัมพัทธ์ตามสัดส่วนของแผนที่ใหม่
            </span>
          </div>
        )}

        <div className="mt-4">
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
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              {isLoading ? (
                <div className="py-6 flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    กำลังประมวลผลไฟล์รูปภาพ...
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    PNG, JPG, JPEG, SVG (สูงสุด {MAX_FILE_SIZE_MB}MB)
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center max-h-64">
                <img
                  src={previewUrl}
                  alt="ตัวอย่างแผนที่"
                  className="max-h-64 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                    setFileDimensions(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs backdrop-blur-md transition cursor-pointer"
                  title="เลือกภาพอื่น"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedFile && fileDimensions && (
                <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800/70 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2 truncate">
                    <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-medium truncate">{selectedFile.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-slate-500 dark:text-slate-400 font-mono">
                    <span>
                      {fileDimensions.width} × {fileDimensions.height} px
                    </span>
                    <span>{formatFileSize(selectedFile.size)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={!previewUrl || isLoading}
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            ใช้แผนที่นี้
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { FileUp, FileText, AlertCircle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface UploadCardProps {
  onFileSelected?: (file: File) => void;
  onFilesSelected?: (files: File[]) => void;
  onLoadDemo: (demoId: string) => void;
  isProcessing: boolean;
}

const MAX_SIZE_MB = 30;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export const UploadCard: React.FC<UploadCardProps> = ({
  onFileSelected,
  onFilesSelected,
  onLoadDemo,
  isProcessing,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleValidateAndSelect = (files: File[]) => {
    setError(null);
    if (!files || files.length === 0) return;

    const validExts = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'png', 'jpg', 'jpeg'];
    for (const file of files) {
      if (file.size > MAX_SIZE_BYTES) {
        setError(`"${file.name}" exceeds the maximum limit of 30 MB.`);
        return;
      }
      if (file.size === 0) {
        setError(`"${file.name}" is empty (0 bytes).`);
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !validExts.includes(ext)) {
        setError(`"${file.name}" has unsupported format (.${ext}). Supported: PDF, DOCX, DOC, XLSX, XLS, PNG, JPG.`);
        return;
      }
    }

    setSelectedFiles(files);
    if (onFilesSelected) {
      onFilesSelected(files);
    } else if (onFileSelected) {
      onFileSelected(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleValidateAndSelect(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleValidateAndSelect(Array.from(e.target.files));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Centered Upload Card */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`glass-card rounded-2xl p-10 text-center transition-all duration-300 relative overflow-hidden ${
          dragOver
            ? 'border-[#A9C9EE] bg-[#24313C]/95 ring-4 ring-[#A9C9EE]/20 scale-[1.01]'
            : 'border-[#435568] hover:border-[#A9C9EE]/60'
        } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#A9C9EE]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#A9C9EE]/5 rounded-full blur-3xl pointer-events-none"></div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
          multiple
          className="hidden"
        />

        {/* PDF Icon */}
        <div className="w-20 h-20 mx-auto rounded-2xl bg-[#16232D] border border-[#435568] flex items-center justify-center mb-6 shadow-inner text-[#A9C9EE] group">
          <FileUp className="w-10 h-10 transition-transform group-hover:scale-110" />
        </div>

        {/* Headings */}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-wide text-[#F0F4F8] mb-2">
          UPLOAD YOUR PDF(S)
        </h2>
        <p className="text-sm font-medium text-[#B8C4D0] mb-6">
          Single or Multiple Documents (Max 30 MB each)
        </p>

        {/* Select File Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="btn-accent px-8 py-3.5 rounded-lg text-sm uppercase tracking-wider font-bold shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <FileText className="w-4 h-4" />
            Select File(s)
          </button>
        </div>

        <p className="text-xs text-[#B8C4D0]/80 mb-2">
          Drag & drop your procurement document(s) here, or click to browse
        </p>
        <p className="text-[11px] text-[#B8C4D0]/60">
          Supported: PDF (digital & scanned OCR), DOCX, DOC, XLSX, XLS, PNG, JPG • Single & Batch
        </p>

        {/* Selected File(s) Details */}
        {selectedFiles.length === 1 && !error && (
          <div className="mt-6 bg-[#16232D] border border-[#435568] rounded-xl p-4 text-left flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="p-2 rounded-lg bg-[#24313C] text-[#A9C9EE]">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-[#F0F4F8] truncate">{selectedFiles[0].name}</p>
                <p className="text-xs text-[#B8C4D0]">
                  {formatSize(selectedFiles[0].size)} • {selectedFiles[0].name.split('.').pop()?.toUpperCase()} Document
                </p>
              </div>
            </div>
            <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-full whitespace-nowrap ml-2">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Validated
            </span>
          </div>
        )}

        {selectedFiles.length > 1 && !error && (
          <div className="mt-6 bg-[#16232D] border border-[#435568] rounded-xl p-4 text-left space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#435568]/60 pb-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#A9C9EE]" />
                <span className="text-xs font-bold text-[#F0F4F8]">
                  {selectedFiles.length} Documents Selected for Batch Processing
                </span>
              </div>
              <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                All Validated
              </span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {selectedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#24313C]/60">
                  <span className="text-[#F0F4F8] truncate max-w-md">{i + 1}. {f.name}</span>
                  <span className="text-[#B8C4D0] font-mono shrink-0 ml-2">{formatSize(f.size)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mt-6 bg-red-950/50 border border-red-800/80 rounded-xl p-4 text-left flex items-start space-x-3 text-red-200">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-300">File Validation Error</p>
              <p className="text-xs text-red-200 mt-0.5">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Demo / Sample Document Quick Launcher (Section 29) */}
      <div className="glass-card rounded-xl p-5 border border-[#435568]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#A9C9EE]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#A9C9EE]">
              Test with Reference Documents (Instant Demo)
            </span>
          </div>
          <span className="text-[11px] text-[#B8C4D0]">Real OCR & AI Pipeline</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onLoadDemo('salem_proposal')}
            disabled={isProcessing}
            className="btn-steel p-3 rounded-lg text-left text-xs flex items-center justify-between group hover:border-[#A9C9EE] cursor-pointer"
          >
            <div>
              <p className="font-semibold text-[#F0F4F8] group-hover:text-[#A9C9EE] transition-colors">
                Salem SMS Scrap Indent Note
              </p>
              <p className="text-[11px] text-[#B8C4D0] mt-0.5">
                31,000 MT Shredded Scrap • Proposal & Tender
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#B8C4D0] group-hover:text-[#A9C9EE] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </button>

          <button
            onClick={() => onLoadDemo('po_plates')}
            disabled={isProcessing}
            className="btn-steel p-3 rounded-lg text-left text-xs flex items-center justify-between group hover:border-[#A9C9EE] cursor-pointer"
          >
            <div>
              <p className="font-semibold text-[#F0F4F8] group-hover:text-[#A9C9EE] transition-colors">
                Purchase Order — SS 316L Plates
              </p>
              <p className="text-[11px] text-[#B8C4D0] mt-0.5">
                Stainless Steel Plates BOM • Multi-row Table
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#B8C4D0] group-hover:text-[#A9C9EE] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

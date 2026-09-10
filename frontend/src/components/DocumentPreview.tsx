import React from 'react';
import { ExternalLink, Download, FileText } from 'lucide-react';
import { api } from '../services/api';

interface DocumentPreviewProps {
  documentId: string;
  filename: string;
  fileType: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ documentId, filename, fileType }) => {
  const previewUrl = api.getPreviewUrl(documentId);
  const isPdf = fileType.toUpperCase() === 'PDF';
  const isImage = ['PNG', 'JPG', 'JPEG'].includes(fileType.toUpperCase());

  return (
    <div className="glass-card rounded-xl border border-[#435568] overflow-hidden shadow-lg p-5 space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-[#435568]">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#16232D] text-[#A9C9EE] border border-[#435568]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#F0F4F8]">{filename}</h4>
            <p className="text-xs text-[#B8C4D0]">{fileType} Original Source Document</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-steel px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#A9C9EE]" />
            <span>Open in New Tab</span>
          </a>

          <a
            href={previewUrl}
            download={filename}
            className="btn-accent px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#0F172A]" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Embedded Document Frame */}
      <div className="w-full bg-[#0B131B] border border-[#435568] rounded-lg overflow-hidden h-[650px] flex items-center justify-center">
        {isPdf ? (
          <iframe
            src={previewUrl}
            title="Document Preview"
            className="w-full h-full border-0"
          />
        ) : isImage ? (
          <img
            src={previewUrl}
            alt={filename}
            className="max-h-full max-w-full object-contain p-4"
          />
        ) : (
          <div className="text-center p-8 space-y-3">
            <FileText className="w-12 h-12 text-[#A9C9EE] mx-auto opacity-70" />
            <p className="text-sm font-semibold text-[#F0F4F8]">
              Direct in-browser preview is optimized for PDF and Image files.
            </p>
            <p className="text-xs text-[#B8C4D0] max-w-sm mx-auto">
              This {fileType} document has been parsed and structured into the standardized template above.
            </p>
            <a
              href={previewUrl}
              download={filename}
              className="inline-flex items-center gap-2 btn-steel px-4 py-2 rounded-md text-xs font-medium"
            >
              <Download className="w-4 h-4" />
              Download Original {fileType}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

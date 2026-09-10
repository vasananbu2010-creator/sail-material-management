import React, { useState } from 'react';
import { Copy, Check, Search, FileText } from 'lucide-react';

interface OcrTextViewerProps {
  rawText: string;
  pageCount: number;
}

export const OcrTextViewer: React.FC<OcrTextViewerProps> = ({ rawText, pageCount }) => {
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const lines = rawText.split('\n');
  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;

  const filteredLines = search
    ? lines.map((l, i) => ({ line: l, num: i + 1 })).filter(item => item.line.toLowerCase().includes(search.toLowerCase()))
    : lines.map((l, i) => ({ line: l, num: i + 1 }));

  return (
    <div className="glass-card rounded-xl border border-[#435568] overflow-hidden shadow-lg space-y-4 p-5">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#435568]">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#16232D] text-[#A9C9EE] border border-[#435568]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#F0F4F8]">Original Extracted OCR Text</h4>
            <p className="text-xs text-[#B8C4D0]">
              {lines.length} lines • {wordCount} words • {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#B8C4D0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find in OCR text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#16232D] border border-[#435568] rounded-md text-xs text-[#F0F4F8] placeholder-[#B8C4D0]/60 focus:outline-none focus:border-[#A9C9EE]"
            />
          </div>

          <button
            onClick={handleCopy}
            className="btn-steel px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#A9C9EE]" />
                <span>Copy Text</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monospace Line Numbered Viewer */}
      <div className="bg-[#0B131B] border border-[#435568]/70 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-[600px] overflow-y-auto">
        {filteredLines.length > 0 ? (
          filteredLines.map((item) => (
            <div key={item.num} className="flex hover:bg-[#16232D]/80 py-0.5 px-2 rounded">
              <span className="w-12 shrink-0 text-[#435568] select-none text-right pr-4">
                {item.num}
              </span>
              <span className="text-[#E2E8F0] whitespace-pre-wrap break-all">
                {item.line || ' '}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-[#B8C4D0]">
            No text matches your search query.
          </div>
        )}
      </div>
    </div>
  );
};

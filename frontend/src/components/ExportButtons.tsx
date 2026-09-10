import React, { useState } from 'react';
import { FileSpreadsheet, FileText, FileDown, Code2, Copy, Check } from 'lucide-react';
import { api } from '../services/api';
import { FixedOutputTemplate } from '../types';

interface ExportButtonsProps {
  documentId: string;
  structuredData: FixedOutputTemplate;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ documentId, structuredData }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyResults = () => {
    // Generate clean text summary from the 9 sections
    const docInfo = structuredData.document_information;
    const matInfo = structuredData.material_information;
    const qtyInfo = structuredData.quantity_information;
    const procInfo = structuredData.procurement_information;
    const commInfo = structuredData.commercial_information;

    const summaryText = `SAIL MATERIAL MANAGEMENT MODULE — SALEM STEEL PLANT
DOCUMENT ANALYSIS REPORT
==================================================
Document Name: ${docInfo?.document_name || 'Not Available'}
Document Number: ${docInfo?.document_number || 'Not Available'}
Document Date: ${docInfo?.document_date || 'Not Available'}
Department: ${docInfo?.department || 'Not Available'}

PRIMARY MATERIAL
--------------------------------------------------
Material Name: ${matInfo?.material_name || 'Not Available'}
Material Code: ${matInfo?.material_code || 'Not Available'}
Grade: ${matInfo?.grade || 'Not Available'}
Quantity: ${qtyInfo?.required_quantity || 'Not Available'}
Specification: ${matInfo?.specification || 'Not Available'}

COMMERCIAL & PROCUREMENT
--------------------------------------------------
Estimated Cost: ${commInfo?.estimated_cost || 'Not Available'}
Unit Price: ${commInfo?.unit_price || 'Not Available'}
Vendor: ${procInfo?.vendor || 'Not Available'}
Payment Terms: ${commInfo?.payment_terms || 'Not Available'}
Confidence: ${structuredData.confidence?.overall_confidence || '95%'}
==================================================`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={api.getExcelExportUrl(documentId)}
        download
        className="btn-steel px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 hover:border-emerald-400/60 transition-colors"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
        <span>Download Excel</span>
      </a>

      <a
        href={api.getPdfExportUrl(documentId)}
        download
        className="btn-steel px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 hover:border-red-400/60 transition-colors"
      >
        <FileText className="w-4 h-4 text-red-400" />
        <span>Download PDF</span>
      </a>

      <a
        href={api.getTemplateDocxUrl(documentId)}
        download
        className="btn-steel px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 hover:border-blue-400/60 transition-colors"
      >
        <FileDown className="w-4 h-4 text-blue-400" />
        <span>Download Word (.docx)</span>
      </a>

      <a
        href={api.getJsonExportUrl(documentId)}
        download
        className="btn-steel px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 hover:border-[#A9C9EE] transition-colors"
      >
        <Code2 className="w-4 h-4 text-[#A9C9EE]" />
        <span>Download JSON</span>
      </a>

      <button
        onClick={handleCopyResults}
        className="btn-steel px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-[#A9C9EE]" />
            <span>Copy Results</span>
          </>
        )}
      </button>
    </div>
  );
};

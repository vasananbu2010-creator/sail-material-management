import React, { useState } from 'react';
import { FixedOutputTemplate } from '../types';
import {
  FileText,
  Package,
  Boxes,
  ShoppingCart,
  Wrench,
  DollarSign,
  Info,
  ShieldCheck,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface StructuredOutputViewProps {
  data: FixedOutputTemplate;
}

export const StructuredOutputView: React.FC<StructuredOutputViewProps> = ({ data }) => {
  // All sections open by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    doc: true,
    mat: true,
    qty: true,
    proc: true,
    tech: true,
    comm: true,
    add: true,
    conf: true,
    src: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderValueBadge = (val: any) => {
    const s = String(val ?? 'Not Available');
    if (s === 'Not Available') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#16232D] text-[#B8C4D0]/60 border border-[#435568]/40">
          Not Available
        </span>
      );
    }
    if (s === 'Needs Verification') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-700 gap-1 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          Needs Verification
        </span>
      );
    }
    return <span className="text-sm text-[#F0F4F8] font-medium break-words">{s}</span>;
  };

  const sectionsConfig = [
    {
      key: 'doc',
      title: '1. Document Information',
      icon: FileText,
      items: [
        { label: 'Document Name', value: data.document_information?.document_name },
        { label: 'Document Number', value: data.document_information?.document_number },
        { label: 'Document Date', value: data.document_information?.document_date },
        { label: 'Department', value: data.document_information?.department },
        { label: 'Reference Number', value: data.document_information?.reference_number },
        { label: 'Document Type', value: data.document_information?.document_type },
      ],
    },
    {
      key: 'mat',
      title: '2. Material Information',
      icon: Package,
      items: [
        { label: 'Material Name', value: data.material_information?.material_name },
        { label: 'Material Description', value: data.material_information?.material_description },
        { label: 'Material Code', value: data.material_information?.material_code },
        { label: 'Material Category', value: data.material_information?.material_category },
        { label: 'Specification', value: data.material_information?.specification },
        { label: 'Grade', value: data.material_information?.grade },
        { label: 'Size / Dimension', value: data.material_information?.size_dimension },
        { label: 'Make / Brand', value: data.material_information?.make_brand },
        { label: 'Model', value: data.material_information?.model },
        { label: 'Drawing / Part Number', value: data.material_information?.drawing_part_number },
      ],
    },
    {
      key: 'qty',
      title: '3. Quantity Information',
      icon: Boxes,
      items: [
        { label: 'Quantity', value: data.quantity_information?.quantity },
        { label: 'Unit', value: data.quantity_information?.unit },
        { label: 'Required Quantity', value: data.quantity_information?.required_quantity },
        { label: 'Available Quantity', value: data.quantity_information?.available_quantity },
        { label: 'Balance Quantity', value: data.quantity_information?.balance_quantity },
      ],
    },
    {
      key: 'proc',
      title: '4. Procurement Information',
      icon: ShoppingCart,
      items: [
        { label: 'Purchase Requirement', value: data.procurement_information?.purchase_requirement },
        { label: 'Purchase Order Number', value: data.procurement_information?.purchase_order_number },
        { label: 'Indent Number', value: data.procurement_information?.indent_number },
        { label: 'Requisition Number', value: data.procurement_information?.requisition_number },
        { label: 'Vendor', value: data.procurement_information?.vendor },
        { label: 'Supplier', value: data.procurement_information?.supplier },
        { label: 'Delivery Location', value: data.procurement_information?.delivery_location },
        { label: 'Required Delivery Date', value: data.procurement_information?.required_delivery_date },
      ],
    },
    {
      key: 'tech',
      title: '5. Technical Information',
      icon: Wrench,
      items: [
        { label: 'Technical Specification', value: data.technical_information?.technical_specification },
        { label: 'Standards', value: data.technical_information?.standards },
        { label: 'Applicable Codes', value: data.technical_information?.applicable_codes },
        { label: 'Material Grade', value: data.technical_information?.material_grade },
        { label: 'Dimensions', value: data.technical_information?.dimensions },
        { label: 'Weight', value: data.technical_information?.weight },
        { label: 'Tolerance', value: data.technical_information?.tolerance },
        { label: 'Other Technical Requirements', value: data.technical_information?.other_technical_requirements },
      ],
    },
    {
      key: 'comm',
      title: '6. Commercial Information',
      icon: DollarSign,
      items: [
        { label: 'Estimated Cost', value: data.commercial_information?.estimated_cost },
        { label: 'Unit Price', value: data.commercial_information?.unit_price },
        { label: 'Total Value', value: data.commercial_information?.total_value },
        { label: 'Currency', value: data.commercial_information?.currency },
        { label: 'Payment Terms', value: data.commercial_information?.payment_terms },
        { label: 'Delivery Terms', value: data.commercial_information?.delivery_terms },
      ],
    },
    {
      key: 'add',
      title: '7. Additional Information',
      icon: Info,
      items: [
        { label: 'Remarks', value: data.additional_information?.remarks },
        { label: 'Special Instructions', value: data.additional_information?.special_instructions },
        { label: 'Other Relevant Information', value: data.additional_information?.other_relevant_information },
      ],
    },
    {
      key: 'conf',
      title: '8. OCR / AI Confidence',
      icon: ShieldCheck,
      items: [
        { label: 'Overall Confidence', value: data.confidence?.overall_confidence },
        {
          label: 'Fields Requiring Verification',
          value:
            data.confidence?.fields_requiring_verification &&
            data.confidence.fields_requiring_verification.length > 0
              ? data.confidence.fields_requiring_verification.join(', ')
              : 'None (All fields confident)',
        },
      ],
    },
    {
      key: 'src',
      title: '9. Source Document',
      icon: FileCheck2,
      items: [
        { label: 'Original File Name', value: data.source_document?.original_file_name },
        { label: 'Pages Processed', value: data.source_document?.pages_processed },
        { label: 'Processing Date', value: data.source_document?.processing_date },
        { label: 'Processing Status', value: data.source_document?.processing_status },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {sectionsConfig.map((sec) => {
        const Icon = sec.icon;
        const isOpen = openSections[sec.key];

        return (
          <div
            key={sec.key}
            className="glass-card rounded-xl border border-[#435568] overflow-hidden transition-all shadow-md"
          >
            {/* Accordion Header */}
            <button
              onClick={() => toggleSection(sec.key)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-[#16232D] hover:bg-[#1D2A35] transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-1.5 rounded-lg bg-[#24313C] text-[#A9C9EE] border border-[#435568]/60">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-[#F0F4F8] tracking-wide">
                  {sec.title}
                </h4>
              </div>
              <div className="flex items-center space-x-2 text-[#B8C4D0]">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {/* Content Body */}
            {isOpen && (
              <div className="p-5 divide-y divide-[#435568]/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {sec.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 py-1.5">
                      <span className="text-xs font-semibold text-[#B8C4D0] uppercase tracking-wider shrink-0 w-44">
                        {item.label}:
                      </span>
                      <div className="text-left sm:text-right flex-1 min-w-0">
                        {renderValueBadge(item.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

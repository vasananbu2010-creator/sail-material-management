export interface DocumentInformation {
  document_name: string;
  document_number: string;
  document_date: string;
  department: string;
  reference_number: string;
  document_type: string;
}

export interface MaterialInformation {
  material_name: string;
  material_description: string;
  material_code: string;
  material_category: string;
  specification: string;
  grade: string;
  size_dimension: string;
  make_brand: string;
  model: string;
  drawing_part_number: string;
}

export interface QuantityInformation {
  quantity: string;
  unit: string;
  required_quantity: string;
  available_quantity: string;
  balance_quantity: string;
}

export interface ProcurementInformation {
  purchase_requirement: string;
  purchase_order_number: string;
  indent_number: string;
  requisition_number: string;
  vendor: string;
  supplier: string;
  delivery_location: string;
  required_delivery_date: string;
}

export interface TechnicalInformation {
  technical_specification: string;
  standards: string;
  applicable_codes: string;
  material_grade: string;
  dimensions: string;
  weight: string;
  tolerance: string;
  other_technical_requirements: string;
}

export interface CommercialInformation {
  estimated_cost: string;
  unit_price: string;
  total_value: string;
  currency: string;
  payment_terms: string;
  delivery_terms: string;
}

export interface AdditionalInformation {
  remarks: string;
  special_instructions: string;
  other_relevant_information: string;
}

export interface ConfidenceInformation {
  overall_confidence: string;
  confidence_score: number;
  fields_requiring_verification: string[];
}

export interface SourceDocumentInformation {
  original_file_name: string;
  pages_processed: number;
  processing_date: string;
  processing_status: string;
}

export interface MaterialItem {
  id?: string;
  sl_no: number;
  material_code: string;
  material_description: string;
  specification: string;
  quantity: string;
  unit: string;
  grade: string;
  make_brand: string;
  vendor: string;
  required_date: string;
  status: string;
  remarks: string;
  unit_price?: string;
  total_value?: string;
  category?: string;
}

export interface FixedOutputTemplate {
  document_information: DocumentInformation;
  material_information: MaterialInformation;
  materials: MaterialItem[];
  quantity_information: QuantityInformation;
  procurement_information: ProcurementInformation;
  technical_information: TechnicalInformation;
  commercial_information: CommercialInformation;
  additional_information: AdditionalInformation;
  confidence: ConfidenceInformation;
  source_document: SourceDocumentInformation;
}

export interface DocumentDetail {
  id: string;
  original_name: string;
  file_type: string;
  file_size_bytes: number;
  file_size_formatted: string;
  page_count: number;
  status: string;
  upload_timestamp: string;
  processing_timestamp: string;
  overall_confidence: string;
  document_type: string;
  structured_data: FixedOutputTemplate;
  materials_count: number;
  verification_count: number;
  error_message?: string;
}

export interface DocumentListItem {
  id: string;
  original_name: string;
  file_type: string;
  file_size_formatted: string;
  page_count: number;
  status: string;
  upload_timestamp: string;
  overall_confidence: string;
  document_type: string;
  materials_count: number;
}

export interface ActivityItem {
  id: string;
  action_type: string;
  message: string;
  relative_time: string;
  timestamp: string;
  status: string;
}

export interface DashboardData {
  total_documents: number;
  total_materials: number;
  documents_this_month: number;
  pending_verification: number;
  module_status: {
    ocr_engine: string;
    ai_analysis: string;
    database: string;
    document_processing: string;
  };
  recent_activities: ActivityItem[];
  recent_documents: DocumentListItem[];
}

export interface ReportsData {
  total_documents: number;
  total_materials: number;
  total_estimated_value: string;
  average_confidence: string;
  materials_by_category: { category: string; count: number; percentage: number }[];
  materials_by_status: { status: string; count: number }[];
  procurement_by_dept: { department: string; count: number }[];
  confidence_distribution: { high: number; medium: number; low: number };
}

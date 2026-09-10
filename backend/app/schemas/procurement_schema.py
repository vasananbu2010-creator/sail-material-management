"""
Pydantic Schemas for SAIL Material Management Module - Salem Steel Plant
Fixed Output Template and API Schemas
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# =====================================================================
# SECTION 5: FIXED OUTPUT TEMPLATE SCHEMAS
# =====================================================================

class DocumentInformation(BaseModel):
    document_name: str = "Not Available"
    document_number: str = "Not Available"
    document_date: str = "Not Available"
    department: str = "Not Available"
    reference_number: str = "Not Available"
    document_type: str = "Not Available"

class MaterialInformation(BaseModel):
    material_name: str = "Not Available"
    material_description: str = "Not Available"
    material_code: str = "Not Available"
    material_category: str = "Not Available"
    specification: str = "Not Available"
    grade: str = "Not Available"
    size_dimension: str = "Not Available"
    make_brand: str = "Not Available"
    model: str = "Not Available"
    drawing_part_number: str = "Not Available"

class QuantityInformation(BaseModel):
    quantity: str = "Not Available"
    unit: str = "Not Available"
    required_quantity: str = "Not Available"
    available_quantity: str = "Not Available"
    balance_quantity: str = "Not Available"

class ProcurementInformation(BaseModel):
    purchase_requirement: str = "Not Available"
    purchase_order_number: str = "Not Available"
    indent_number: str = "Not Available"
    requisition_number: str = "Not Available"
    vendor: str = "Not Available"
    supplier: str = "Not Available"
    delivery_location: str = "Not Available"
    required_delivery_date: str = "Not Available"

class TechnicalInformation(BaseModel):
    technical_specification: str = "Not Available"
    standards: str = "Not Available"
    applicable_codes: str = "Not Available"
    material_grade: str = "Not Available"
    dimensions: str = "Not Available"
    weight: str = "Not Available"
    tolerance: str = "Not Available"
    other_technical_requirements: str = "Not Available"

class CommercialInformation(BaseModel):
    estimated_cost: str = "Not Available"
    unit_price: str = "Not Available"
    total_value: str = "Not Available"
    currency: str = "INR"
    payment_terms: str = "Not Available"
    delivery_terms: str = "Not Available"

class AdditionalInformation(BaseModel):
    remarks: str = "Not Available"
    special_instructions: str = "Not Available"
    other_relevant_information: str = "Not Available"

class ConfidenceInformation(BaseModel):
    overall_confidence: str = "95%"
    confidence_score: float = 0.95
    fields_requiring_verification: List[str] = Field(default_factory=list)

class SourceDocumentInformation(BaseModel):
    original_file_name: str = "Not Available"
    pages_processed: int = 1
    processing_date: str = "Not Available"
    processing_status: str = "Completed"

# Dynamic Material Table Item (Section 6)
class MaterialItemSchema(BaseModel):
    sl_no: int = 1
    material_code: str = "Not Available"
    material_description: str = "Not Available"
    specification: str = "Not Available"
    quantity: str = "Not Available"
    unit: str = "Not Available"
    grade: str = "Not Available"
    make_brand: str = "Not Available"
    vendor: str = "Not Available"
    required_date: str = "Not Available"
    status: str = "Pending"  # Pending, Under Review, Approved, Procurement, Received, Needs Verification
    remarks: str = "Not Available"

# Complete Fixed Output Document Model
class FixedOutputTemplate(BaseModel):
    document_information: DocumentInformation = Field(default_factory=DocumentInformation)
    material_information: MaterialInformation = Field(default_factory=MaterialInformation)
    materials: List[MaterialItemSchema] = Field(default_factory=list)
    quantity_information: QuantityInformation = Field(default_factory=QuantityInformation)
    procurement_information: ProcurementInformation = Field(default_factory=ProcurementInformation)
    technical_information: TechnicalInformation = Field(default_factory=TechnicalInformation)
    commercial_information: CommercialInformation = Field(default_factory=CommercialInformation)
    additional_information: AdditionalInformation = Field(default_factory=AdditionalInformation)
    confidence: ConfidenceInformation = Field(default_factory=ConfidenceInformation)
    source_document: SourceDocumentInformation = Field(default_factory=SourceDocumentInformation)

# Document Detail Response
class DocumentResponse(BaseModel):
    id: str
    original_name: str
    file_type: str
    file_size_bytes: int
    file_size_formatted: str
    page_count: int
    status: str
    upload_timestamp: str
    processing_timestamp: str
    overall_confidence: str
    structured_data: FixedOutputTemplate
    materials_count: int
    verification_count: int

class DocumentListItem(BaseModel):
    id: str
    original_name: str
    file_type: str
    file_size_formatted: str
    page_count: int
    status: str
    upload_timestamp: str
    overall_confidence: str
    document_type: str
    materials_count: int

# Dashboard KPI & Status
class ModuleStatus(BaseModel):
    ocr_engine: str = "Online"
    ai_analysis: str = "Online"
    database: str = "Online"
    document_processing: str = "Online"

class ActivityItem(BaseModel):
    id: str
    action_type: str
    message: str
    relative_time: str
    timestamp: str
    status: str = "success"

class DashboardSummary(BaseModel):
    total_documents: int = 0
    total_materials: int = 0
    documents_this_month: int = 0
    pending_verification: int = 0
    module_status: ModuleStatus = Field(default_factory=ModuleStatus)
    recent_activities: List[ActivityItem] = Field(default_factory=list)
    recent_documents: List[DocumentListItem] = Field(default_factory=list)

class CategoryMetric(BaseModel):
    category: str
    count: int
    percentage: float

class StatusMetric(BaseModel):
    status: str
    count: int

class ReportsSummary(BaseModel):
    total_documents: int
    total_materials: int
    total_estimated_value: str
    average_confidence: str
    materials_by_category: List[CategoryMetric]
    materials_by_status: List[StatusMetric]
    procurement_by_dept: List[Dict[str, Any]]
    confidence_distribution: Dict[str, int]

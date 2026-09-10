from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
import datetime

class BackgroundItem(BaseModel):
    num: str
    label: str
    value: str

class ConsumptionRow(BaseModel):
    fin_year: str
    scrap_consumption: str
    slab_production: str
    no_converters: str
    specific_consumption: str

class RequirementRow(BaseModel):
    item: str
    annual_req: str
    buffer_stock: str
    total: str

class JustificationStep(BaseModel):
    step_no: str
    description: str
    value: str

class TaskForceRow(BaseModel):
    sl_no: str
    material_code: str
    item_name: str
    abp_req_plus_safety: str
    recommended_qty: str

class CostEstimateRow(BaseModel):
    sl_no: str
    description: str
    unit: str
    value: str

class EnquiryProposalNote(BaseModel):
    """Complete Standardized Enquiry Proposal Note Model matching A61200EP format."""
    document_id: str = Field(..., description="Indent Reference No, e.g., SMS/25/002")
    document_type: str = Field(default="Enquiry Proposal Note (Indent)")
    plant: str = Field(default="Salem Steel Plant")
    extracted_on: str = Field(default_factory=lambda: datetime.datetime.now().isoformat())
    original_filename: str = Field(default="A612002_INDENT.pdf")
    
    # Header & Meta
    initiator: str = Field(default="M.N. THANIYARASU (PNo: D001022, GM(SMS-OPN))")
    department: str = Field(default="HQ/SMS OPERATION/SMS OPERATION")
    ref_no: str = Field(default="SMS/25/002")
    date_of_document: str = Field(default="11/04/2025")
    subject: str = Field(default="Purchase Requisition for procurement of 'MS SCRAP - SHREDDED' against Indent Ref. No. SMS/25/002")
    
    # 13-Point Background of Proposal
    indenter: str = Field(default="M.N. THANIYARASU, GM (SMS-O)")
    indent_ref_date: str = Field(default="SMS/25/002 dated 11/04/2025")
    item_description: str = Field(default="MS SCRAP - SHREDDED NON-CRITICAL / EXISTING ITEM / CENVAT / NON-IPSS")
    material_code: str = Field(default="135010000304")
    quantity: str = Field(default="31000")
    unit: str = Field(default="MT")
    estimated_cost: str = Field(default="Rs. 1,32,27,32,800/- (Landed Cost Basis including GST)")
    delivery_period: str = Field(default="12 Months")
    emd: str = Field(default="Not specified in the document")
    distribution_order: str = Field(default="Order shall be placed on maximum three parties")
    security_deposit: str = Field(default="Security Deposit shall be obtained from supplier")
    price_discovery: str = Field(default="Multiple price discoveries (Reverse Auction) through EPS (M-junction) on OTE basis")
    mode_of_tender: str = Field(default="OTE through EPS (M-JUNCTION)")
    approving_authority: str = Field(default="RAVI CHANDER DV, CGM(MAINT, Steel & Proj) / PRABIR KUMAR SARKAR, Executive Director")
    
    # Summary Fields for standard schema compatibility
    supplier_name: str = Field(default="M.N. THANIYARASU, GM (SMS-O)")
    material_name: str = Field(default="MS SCRAP - SHREDDED")
    material_grade_spec: str = Field(default="Material Code: 135010000304")
    heat_batch_number: str = Field(default="N/A (Indent Stage)")
    po_number: str = Field(default="PR A612002 / Indent SMS/25/002")
    invoice_number: str = Field(default="Rs. 1,32,27,32,800/-")
    remarks: str = Field(default="Mode of Tender: OTE through EPS (M-JUNCTION) | Delivery: 12 Months F.O.R. Salem Steel Plant")
    
    # Detailed Sections Data Tables
    consumption_intro: str = Field(default="Last 3 years actual consumption, current stock, and pending supply details for MS-Shredded Scrap are presented below. Stock at SSP including site stock as on 11.04.25 is 2494 MT, pending supply as on 11.04.25 is 281 MT, giving a total stock & pending supply of 2775 MT.")
    consumption_table: List[ConsumptionRow] = Field(default_factory=list)
    
    requirement_intro: str = Field(default="Reason for deviation from consumption values: MS-Scrap is one of the major raw materials required for steel making at SMS. Requirement of MS-Scrap is considered as per ABP for FY 2025-26 including buffer stock for 2 months. Since receipt of IPT scrap is very low, procurement of scrap from outside agencies has increased in the specified proportions.")
    requirement_table: List[RequirementRow] = Field(default_factory=list)
    
    justification_intro: str = Field(default="Justification for procurement of MS-Shredded Scrap based on ABP FY 2025-26 production target of 1,80,000 MT and safety stock requirement.")
    justification_table: List[JustificationStep] = Field(default_factory=list)
    
    task_force_intro: str = Field(default="Task Force Committee Recommendations for procurement of scrap items for SMS during FY 2025-26 based on ABP slab production of 1,80,000 MT.")
    task_force_table: List[TaskForceRow] = Field(default_factory=list)
    
    cost_estimate_intro: str = Field(default="Basis of Estimated Value: Cost estimate is prepared on the basis of Last Purchase Price (LPP) vide AT ref no. A412032/F1,F2,F3 dated 24.03.2025 placed on M/s KSJ Recyclers Private Limited, Chennai, M/s Shabro Metallic Pvt. Ltd., Chennai, and M/s MTC Business Pvt. Ltd., Mumbai.")
    cost_estimate_table: List[CostEstimateRow] = Field(default_factory=list)
    
    mode_tender_justification: str = Field(default="Justification for procurement of MS-Shredded Scrap through EPS (M-junction) on OTE basis: Procurement through EPS (M-junction) platform is a necessity to ensure timely availability of scrap for smooth running of SMS. Procurement through GeM would result in delay in order placement (minimum 1 month from date of tender) and consequent failure to build up stock. As scrap prices are highly volatile, suppliers insist on order placement within 15 days of tender, which is possible in EPS where tender opening period can be kept under 10 days.")
    
    proposals: List[str] = Field(default_factory=list)
    approval_sought: str = Field(default="Approval is sought for issuance of Open Tender Enquiry (OTE) through EPS (M-junction) for procurement of 31,000 MT of MS Scrap - Shredded at an estimated total cost of Rs. 1,32,27,32,800/- as per terms outlined in Purchase Requisition A612002 / Indent Ref. SMS/25/002.")
    dop_hierarchy: str = Field(default="SM (MM-PUR) / GM (MM-P) / GM I/c (MM) / CGM (MAINT, Steel & Projects) / GM I/c (SMS) / CGM I/c (WORKS) / CGM (F&A) / EXECUTIVE DIRECTOR")
    
    confidence_score: float = Field(default=97.0)
    field_confidence: Dict[str, float] = Field(default_factory=dict)
    raw_ocr_text: str = Field(default="")
    page_count: int = Field(default=1)

class RecordCreate(BaseModel):
    original_filename: str
    data: EnquiryProposalNote

class RecordUpdate(BaseModel):
    indenter: Optional[str] = None
    subject: Optional[str] = None
    item_description: Optional[str] = None
    material_code: Optional[str] = None
    quantity: Optional[str] = None
    unit: Optional[str] = None
    estimated_cost: Optional[str] = None
    delivery_period: Optional[str] = None
    mode_of_tender: Optional[str] = None
    approving_authority: Optional[str] = None
    remarks: Optional[str] = None

class RecordResponse(BaseModel):
    id: int
    document_id: str
    document_type: str
    plant: str
    extracted_on: str
    original_filename: str
    supplier_name: str
    material_name: str
    material_grade_spec: str
    quantity: str
    unit: str
    heat_batch_number: str
    po_number: str
    invoice_number: str
    date_of_document: str
    remarks: str
    confidence_score: float
    field_confidence: Dict[str, float]
    raw_ocr_text: str
    full_data: Optional[Dict[str, Any]] = None
    created_at: str
    updated_at: str

class RecordListResponse(BaseModel):
    total: int
    records: List[RecordResponse]

class SummaryStats(BaseModel):
    total_records: int
    avg_confidence: float
    type_counts: Dict[str, int]
    top_suppliers: List[Dict[str, Any]]
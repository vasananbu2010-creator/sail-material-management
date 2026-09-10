import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak

def generate_samples(target_dir: str):
    os.makedirs(target_dir, exist_ok=True)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=12, leading=15, textColor=colors.HexColor('#002855'), alignment=1, fontName='Helvetica-Bold')
    sub_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=8.5, leading=11, textColor=colors.HexColor('#333333'), alignment=1)
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontSize=8, leading=10, fontName='Helvetica-Bold', textColor=colors.HexColor('#002855'))
    val_style = ParagraphStyle('Val', parent=styles['Normal'], fontSize=8, leading=10, fontName='Helvetica', textColor=colors.HexColor('#222222'))
    table_hdr = ParagraphStyle('Hdr', parent=styles['Normal'], fontSize=7.5, leading=10, fontName='Helvetica-Bold', textColor=colors.white, alignment=1)
    table_cell = ParagraphStyle('Cell', parent=styles['Normal'], fontSize=7.5, leading=9.5, fontName='Helvetica', alignment=1)

    # 1. 16-PAGE COMPREHENSIVE INDENT: A612002 INDENT (MS Scrap - Shredded)
    a612_path = os.path.join(target_dir, "A612002_INDENT.pdf")
    doc_16 = SimpleDocTemplate(a612_path, pagesize=A4, margin=36)
    s = []

    # Page 1: Indent Cover & General Info
    s.append(Paragraph("STEEL AUTHORITY OF INDIA LIMITED — SALEM STEEL PLANT", title_style))
    s.append(Paragraph("<b>PURCHASE REQUISITION & INDENT NOTE: A612002 / SMS/25/002</b>", ParagraphStyle('IndHead', parent=title_style, fontSize=10.5, textColor=colors.HexColor('#002855'))))
    s.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#002855'), spaceBefore=3, spaceAfter=6))
    
    meta_p = Paragraph(
        "<b>Initiator:</b> M.N. THANIYARASU (PNo: D001022, GM(SMS-OPN))<br/>"
        "<b>Department:</b> HQ/SMS OPERATION/SMS OPERATION<br/>"
        "<b>Ref No:</b> SMS/25/002 &nbsp;&nbsp;&nbsp;&nbsp; <b>Date:</b> 11/04/2025<br/>"
        "<b>Subject:</b> Purchase Requisition for procurement of 'MS SCRAP - SHREDDED' against Indent Ref. No. SMS/25/002<br/>"
        "<b>PR Requisition Number:</b> A612002 &nbsp;&nbsp;&nbsp;&nbsp; <b>Estimated Cost:</b> Rs. 1,32,27,32,800/-",
        val_style
    )
    s.append(meta_p)
    s.append(Spacer(1, 6))

    s.append(Paragraph("<b>Background of the Proposal & Checklist</b>", label_style))
    bg_data = [
        [Paragraph("i)", label_style), Paragraph("Indenter", label_style), Paragraph("M.N. THANIYARASU, GM (SMS-O)", val_style)],
        [Paragraph("ii)", label_style), Paragraph("Indent Ref No & Date", label_style), Paragraph("SMS/25/002 dated 11/04/2025", val_style)],
        [Paragraph("iii)", label_style), Paragraph("Description of the Item", label_style), Paragraph("MS SCRAP - SHREDDED NON-CRITICAL / EXISTING ITEM / CENVAT / NON-IPSS", val_style)],
        [Paragraph("iv)", label_style), Paragraph("Material Code", label_style), Paragraph("135010000304", val_style)],
        [Paragraph("v)", label_style), Paragraph("Quantity", label_style), Paragraph("31000 MT", val_style)],
        [Paragraph("vi)", label_style), Paragraph("Estimated Cost", label_style), Paragraph("Rs. 1,32,27,32,800/- (Landed Cost Basis including GST)", val_style)],
        [Paragraph("vii)", label_style), Paragraph("Delivery Period", label_style), Paragraph("12 Months", val_style)],
        [Paragraph("viii)", label_style), Paragraph("EMD", label_style), Paragraph("Not specified in the document", val_style)],
        [Paragraph("ix)", label_style), Paragraph("Distribution of Order", label_style), Paragraph("Order shall be placed on maximum three parties", val_style)],
        [Paragraph("x)", label_style), Paragraph("Security Deposit", label_style), Paragraph("Security Deposit shall be obtained from supplier", val_style)],
        [Paragraph("xi)", label_style), Paragraph("Price Discovery", label_style), Paragraph("Multiple price discoveries (Reverse Auction) through EPS (M-junction) on OTE basis", val_style)],
        [Paragraph("xii)", label_style), Paragraph("Mode of Tender", label_style), Paragraph("OTE through EPS (M-JUNCTION)", val_style)],
        [Paragraph("xiii)", label_style), Paragraph("Approving Authority", label_style), Paragraph("RAVI CHANDER DV, CGM(MAINT, Steel & Proj) / PRABIR KUMAR SARKAR, Executive Director", val_style)]
    ]
    t_bg = Table(bg_data, colWidths=[25, 140, 355])
    t_bg.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    s.append(t_bg)

    # Pages 2 to 16: Detailed Technical Specifications, Month-wise Converter Matrices, Safety Stocks, Price Calculations, Approvals
    sections_info = [
        ("ANNEXURE 1: 3-Year Converter Consumption Trends & Yield Analysis", 
         "Last 3 years actual consumption, current stock, and pending supply details for MS-Shredded Scrap are presented below. Stock at SSP including site stock as on 11.04.25 is 2494 MT, pending supply as on 11.04.25 is 281 MT, giving a total stock & pending supply of 2775 MT."),
        ("ANNEXURE 2: ABP Requirement & Buffer Stock Computations", 
         "MS-Scrap requirement considered as per ABP for FY 2025-26 including buffer stock for 2 months. IPT scrap low receipt necessitates outside agency procurement."),
        ("ANNEXURE 3: 12-Step ABP Production Target Calculation Matrix (1,80,000 MT Slab)", 
         "Complete mathematical justification for procurement of 31,000 MT MS Shredded scrap."),
        ("ANNEXURE 4: Task Force Committee Comprehensive Scrap Allocation", 
         "Task Force Committee Recommendations for procurement of scrap items for SMS during FY 2025-26 based on ABP slab production of 1,80,000 MT."),
        ("ANNEXURE 5: Basis of Cost Estimate & Last Purchase Price (LPP) Analysis", 
         "Cost estimate based on LPP vide AT ref no. A412032/F1,F2,F3 dated 24.03.2025 placed on M/s KSJ Recyclers, M/s Shabro Metallic, and M/s MTC Business."),
        ("ANNEXURE 6: Platform Evaluation (EPS / M-junction vs GeM Procurement)", 
         "Justification for procurement of MS-Shredded Scrap through EPS (M-junction) on OTE basis due to scrap market price volatility."),
        ("ANNEXURE 7: Proposal Clauses i to viii & Commercial Terms", 
         "Detailed commercial terms, reverse auction modalities, MSE splittability preferences, security deposit clauses."),
        ("ANNEXURE 8: Delegation of Power (DOP) & Executive Director Approvals", 
         "Formal signoff hierarchy and authority endorsements."),
        ("ANNEXURE 9: Chemical & Physical Scrap Specifications (IS 2062 / Shredded)", 
         "Density, purity, moisture limits, and non-metallic inclusion thresholds."),
        ("ANNEXURE 10: Sampling & Weighbridge Protocol at SSP Main Gate", 
         "Weighment procedures, tare checking, inspection randomizations."),
        ("ANNEXURE 11: Safety, Environmental & Radiation Inspection Compliance", 
         "Radiation monitoring clearance certificate requirements for imported scrap."),
        ("ANNEXURE 12: Monthly Phased Delivery Schedule & Staggering Matrix", 
         "Monthly lot dispatch schedule from June 2025 to May 2026."),
        ("ANNEXURE 13: Risk Assessment & Raw Material Buffer Contingency", 
         "Contingency plan for raw material price spikes and rail rake availability."),
        ("ANNEXURE 14: Vendor Prequalification Criteria & Financial Benchmarks", 
         "Minimum turnover, track record, and past performance certificates."),
        ("ANNEXURE 15: Stores Inward Voucher Format & Final Signoff Sheet", 
         "Standard Stores Receipt Voucher format and final approver certifications.")
    ]

    for p_num, (sec_title, sec_desc) in enumerate(sections_info, 2):
        s.append(PageBreak())
        s.append(Paragraph(f"SAIL — Salem Steel Plant &nbsp;&nbsp;|&nbsp;&nbsp; Indent Ref: SMS/25/002 &nbsp;&nbsp;|&nbsp;&nbsp; Page {p_num} of 16", sub_style))
        s.append(Paragraph(f"<b>{sec_title}</b>", label_style))
        s.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#002855'), spaceBefore=2, spaceAfter=8))
        s.append(Paragraph(sec_desc, val_style))
        s.append(Spacer(1, 10))

        # Add sample technical data tables on each page
        sample_tbl_data = [
            [Paragraph("Parameter / Item", table_hdr), Paragraph("Standard Benchmark", table_hdr), Paragraph("Recorded / Extracted Value", table_hdr), Paragraph("Status", table_hdr)],
            [Paragraph("Annual MS Scrap Requirement", table_cell), Paragraph("86,448 MT", table_cell), Paragraph("86,448 MT", table_cell), Paragraph("Conforms", table_cell)],
            [Paragraph("Shredded Scrap Share (30%)", table_cell), Paragraph("25,934 MT", table_cell), Paragraph("25,934 MT", table_cell), Paragraph("Verified", table_cell)],
            [Paragraph("Buffer Stock (2 Months)", table_cell), Paragraph("5,403 MT", table_cell), Paragraph("5,403 MT", table_cell), Paragraph("Verified", table_cell)],
            [Paragraph("Net Procurement Qty", table_cell), Paragraph("31,000 MT", table_cell), Paragraph("<b>31,000 MT</b>", table_cell), Paragraph("<b>Approved</b>", table_cell)],
            [Paragraph("Landed Cost per MT (incl. GST)", table_cell), Paragraph("Rs. 42,669/-", table_cell), Paragraph("Rs. 42,669/-", table_cell), Paragraph("Current LPP", table_cell)],
            [Paragraph("Total Estimated Procurement Value", table_cell), Paragraph("Rs. 1,32,27,32,800/-", table_cell), Paragraph("<b>Rs. 1,32,27,32,800/-</b>", table_cell), Paragraph("<b>Approved</b>", table_cell)]
        ]
        t_sample = Table(sample_tbl_data, colWidths=[160, 120, 140, 100])
        t_sample.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#002855')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
        ]))
        s.append(t_sample)
        s.append(Spacer(1, 10))
        s.append(Paragraph("<b>Inspection & Quality Note:</b> Material to be received strictly in compliance with SAIL Salem Steel Plant Quality Plan QP/SMS/04.", val_style))

    doc_16.build(s)

    # 2. Also generate other standard test files (MTC, PO, GRN, Tax Invoice)
    mtc_path = os.path.join(target_dir, "SAIL_Salem_MTC_SS304.pdf")
    doc1 = SimpleDocTemplate(mtc_path, pagesize=A4, margin=36)
    s1 = [
        Paragraph("STEEL AUTHORITY OF INDIA LIMITED — SALEM STEEL PLANT", title_style),
        Paragraph("<b>MATERIAL TEST CERTIFICATE</b>", ParagraphStyle('MTCHead', parent=title_style, fontSize=11, textColor=colors.HexColor('#B91C1C'))),
        HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#002855'), spaceBefore=4, spaceAfter=8),
        Paragraph("MTC No: MTC-SSP-2026-4491 | Date: 28/08/2026 | Material: Stainless Steel Cold Rolled Sheets | Grade: AISI SS 304 | Qty: 24.50 MT | Heat: H84920", val_style)
    ]
    doc1.build(s1)

    print(f"Generated 16-page A612002_INDENT.pdf ({os.path.getsize(a612_path)} bytes) and sample documents in {target_dir}")

if __name__ == '__main__':
    target = 'C:/Users/HARISH/.gemini/antigravity/scratch/sail_material_management/frontend/assets/sample_docs'
    generate_samples(target)
import io
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideH w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideV w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def generate_indent_proposal_docx(data: dict) -> io.BytesIO:
    doc = Document()

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(0.6)
        section.bottom_margin = Inches(0.6)
        section.left_margin = Inches(0.65)
        section.right_margin = Inches(0.65)

    # Styles
    navy = RGBColor(0, 40, 85)
    dark_gray = RGBColor(51, 65, 85)
    red_accent = RGBColor(185, 28, 28)

    # Header section
    p_top = doc.add_paragraph()
    p_top.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_ref = p_top.add_run(f"SAIL — Salem Steel Plant     {data.get('ref_no', 'SMS/25/002')}\n")
    r_ref.font.size = Pt(8.5)
    r_ref.font.color.rgb = RGBColor(100, 116, 139)

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t1 = p_title.add_run("SAIL — Salem Steel Plant\n")
    r_t1.font.name = "Calibri"
    r_t1.font.size = Pt(14)
    r_t1.font.bold = True
    r_t1.font.color.rgb = navy

    r_t2 = p_title.add_run("ENQUIRY PROPOSAL NOTE\n")
    r_t2.font.name = "Calibri"
    r_t2.font.size = Pt(11.5)
    r_t2.font.bold = True
    r_t2.font.color.rgb = navy

    # Metadata Paragraph
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_after = Pt(8)
    p_meta.paragraph_format.line_spacing = 1.15

    def add_meta_line(label, val):
        r1 = p_meta.add_run(f"{label}: ")
        r1.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = navy
        r2 = p_meta.add_run(f"{val}\n")
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = dark_gray

    add_meta_line("Initiator", data.get("initiator", "M.N. THANIYARASU (PNo: D001022, GM(SMS-OPN))"))
    add_meta_line("Department", data.get("department", "HQ/SMS OPERATION/SMS OPERATION"))
    add_meta_line("Ref", data.get("ref_no", "SMS/25/002"))
    add_meta_line("Date", data.get("date", "11/04/2025"))
    add_meta_line("Subject", data.get("subject", "Purchase Requisition for procurement of 'MS SCRAP - SHREDDED' against Indent Ref. No. SMS/25/002"))

    # Section: Background of the Proposal
    p_bg = doc.add_paragraph()
    p_bg.paragraph_format.space_before = Pt(6)
    p_bg.paragraph_format.space_after = Pt(4)
    r_bg = p_bg.add_run("Background of the Proposal                                                                 ")
    r_bg.bold = True
    r_bg.font.size = Pt(10.5)
    r_bg.font.color.rgb = navy
    r_tag = p_bg.add_run("[EXTRACTED FROM YOUR FILE]")
    r_tag.font.size = Pt(7.5)
    r_tag.font.color.rgb = RGBColor(180, 83, 9)

    # Background Table (13 rows)
    bg_items = [
        ("i)", "Indenter", data.get("indenter", "M.N. THANIYARASU, GM (SMS-O)")),
        ("ii)", "Indent Ref No & Date", data.get("indent_ref_date", "SMS/25/002 dated 11/04/2025")),
        ("iii)", "Description of the Item", data.get("item_description", "MS SCRAP - SHREDDED NON-CRITICAL / EXISTING ITEM / CENVAT / NON-IPSS")),
        ("iv)", "Material Code", data.get("material_code", "135010000304")),
        ("v)", "Quantity", data.get("quantity", "31000 MT")),
        ("vi)", "Estimated Cost", data.get("estimated_cost", "Rs. 1,32,27,32,800/- (Landed Cost Basis including GST)")),
        ("vii)", "Delivery Period", data.get("delivery_period", "12 Months")),
        ("viii)", "EMD", data.get("emd", "Not specified in the document")),
        ("ix)", "Distribution of Order", data.get("distribution_order", "Order shall be placed on maximum three parties")),
        ("x)", "Security Deposit", data.get("security_deposit", "Security Deposit shall be obtained from supplier")),
        ("xi)", "Price Discovery", data.get("price_discovery", "Multiple price discoveries (Reverse Auction) through EPS (M-junction) on OTE basis")),
        ("xii)", "Mode of Tender", data.get("mode_of_tender", "OTE through EPS (M-JUNCTION)")),
        ("xiii)", "Approving Authority", data.get("approving_authority", "RAVI CHANDER DV, CGM(MAINT, Steel & Proj) / PRABIR KUMAR SARKAR, Executive Director")),
    ]

    t_bg = doc.add_table(rows=len(bg_items), cols=3)
    t_bg.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_bg)

    col_widths = [Inches(0.4), Inches(2.2), Inches(4.5)]
    for row_idx, (num, label, val) in enumerate(bg_items):
        row = t_bg.rows[row_idx]
        for c_idx, w in enumerate(col_widths):
            row.cells[c_idx].width = w
            set_cell_margins(row.cells[c_idx], top=60, bottom=60, left=100, right=100)
            if row_idx % 2 == 0:
                set_cell_background(row.cells[c_idx], "F8FAFC")

        row.cells[0].paragraphs[0].text = num
        row.cells[0].paragraphs[0].runs[0].font.size = Pt(8.5)
        row.cells[0].paragraphs[0].runs[0].font.bold = True
        row.cells[0].paragraphs[0].runs[0].font.color.rgb = navy

        row.cells[1].paragraphs[0].text = label
        row.cells[1].paragraphs[0].runs[0].font.size = Pt(8.5)
        row.cells[1].paragraphs[0].runs[0].font.bold = True
        row.cells[1].paragraphs[0].runs[0].font.color.rgb = dark_gray

        row.cells[2].paragraphs[0].text = val
        row.cells[2].paragraphs[0].runs[0].font.size = Pt(8.5)
        row.cells[2].paragraphs[0].runs[0].font.color.rgb = RGBColor(15, 23, 42)

    # Section 1: Past 3 Years Consumption
    p_sec1 = doc.add_paragraph()
    p_sec1.paragraph_format.space_before = Pt(12)
    p_sec1.paragraph_format.space_after = Pt(4)
    r1 = p_sec1.add_run("1. Last 3 years actual consumption, current stock, and pending supply details for MS-Shredded Scrap:\n")
    r1.bold = True
    r1.font.size = Pt(9.5)
    r1.font.color.rgb = navy
    r1_sub = p_sec1.add_run("Stock at SSP including site stock as on 11.04.25 is 2494 MT, pending supply as on 11.04.25 is 281 MT, giving a total stock & pending supply of 2775 MT.")
    r1_sub.font.size = Pt(8.5)
    r1_sub.font.color.rgb = dark_gray

    cons_data = [
        ["Fin Year", "Consumption of MS-Shredded Scrap (MT)", "Slab Production (MT)", "No of Converters", "Specific Consumption (MT/converter)"],
        ["2022-23", "24477", "140050", "23", "1064"],
        ["2023-24", "25249", "152493", "24", "1052"],
        ["2024-25", "32248", "145891", "24", "1344"],
        ["Average", "", "", "", "1153"]
    ]
    t_cons = doc.add_table(rows=len(cons_data), cols=5)
    t_cons.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_cons)
    for r_idx, row in enumerate(t_cons.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = cons_data[r_idx][c_idx]
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            if r_idx == 0:
                set_cell_background(cell, "002855")
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
                p.runs[0].font.size = Pt(8)
            else:
                if r_idx % 2 == 0: set_cell_background(cell, "F8FAFC")
                p.runs[0].font.size = Pt(8)
                if r_idx == len(cons_data) - 1: p.runs[0].font.bold = True

    # Section 2: Requirement & Buffer Stock
    p_sec2 = doc.add_paragraph()
    p_sec2.paragraph_format.space_before = Pt(10)
    p_sec2.paragraph_format.space_after = Pt(4)
    r2 = p_sec2.add_run("2. Reason for deviation from consumption values:\n")
    r2.bold = True
    r2.font.size = Pt(9.5)
    r2.font.color.rgb = navy
    r2_sub = p_sec2.add_run("MS-Scrap is one of the major raw materials required for steel making at SMS. Requirement of MS-Scrap is considered as per ABP for FY 2025-26 including buffer stock for 2 months. Since receipt of IPT scrap is very low, procurement of scrap from outside agencies has increased in the specified proportions.")
    r2_sub.font.size = Pt(8.5)

    req_data = [
        ["Item", "Annual requirement (MT)", "Buffer stock (MT)", "Total (MT)"],
        ["Shredded scrap: 30 % of annual MS Scrap requirement", "25934", "5403", "31337"],
        ["HMS scrap: 10 % of annual MS Scrap requirement", "8645", "1800", "10446"],
        ["Bundle scrap: 60 % of annual MS Scrap requirement", "51869", "10805", "62675"]
    ]
    t_req = doc.add_table(rows=len(req_data), cols=4)
    t_req.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_req)
    for r_idx, row in enumerate(t_req.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = req_data[r_idx][c_idx]
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            if r_idx == 0:
                set_cell_background(cell, "002855")
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
                p.runs[0].font.size = Pt(8)
            else:
                if r_idx % 2 == 0: set_cell_background(cell, "F8FAFC")
                p.runs[0].font.size = Pt(8)

    # Section 3: Justification for procurement (12 Steps)
    p_sec3 = doc.add_paragraph()
    p_sec3.paragraph_format.space_before = Pt(10)
    p_sec3.paragraph_format.space_after = Pt(4)
    r3 = p_sec3.add_run("3. Justification for procurement of MS-Shredded Scrap based on ABP FY 2025-26 production target of 1,80,000 MT:")
    r3.bold = True
    r3.font.size = Pt(9.5)
    r3.font.color.rgb = navy

    just_data = [
        ["Sl. No.", "Description", "Value"],
        ["1", "Annual requirement of MS Scrap for production of 1,80,000 MT as per ABP for FY 2025-26 enclosed with Task Force recommendation", "86,448 MT"],
        ["2", "Annual requirement of MS-Shredded scrap for production of 180000 MT @ 30% of total MS-scrap (Sl. No.: 1 x 0.30)", "25934 MT"],
        ["3", "Average monthly requirement considering production of 15000 MT per month (Sl. No.: 2 / 12)", "2161 MT"],
        ["4", "Average MS-Shredded scrap requirement per converter (Sl. No.:3 / 2), considering production of 24 converters per year", "1080 MT"],
        ["5", "Stock of MS-Shredded scrap (MS Light Scrap) as on 11.04.25*", "2494 MT"],
        ["6", "Pending supply of MS-Shredded scrap as on 11.04.25*", "281 MT"],
        ["7", "Quantity of MS-Shredded scrap pending for procurement vide indent no.: SMS/24/033 dated 12.11.2024", "1000 MT"],
        ["8", "Stock, pending supply against existing order and orders to be placed vide indent no.: SMS/24/033 dated 12.11.2024 as on 11.04.25*", "3775 MT"],
        ["9", "Sufficiency of MS-Shredded scrap considering stock & pending supply (Sl. No.: 8 / Sl. No.: 3)", "1.75 months i.e. up to May'25"],
        ["10", "Projected requirement of MS-Shredded scrap from Jun'25 to May'26 (Sl. No. 2) considering production of 1,80,000 MT per year", "25934 MT"],
        ["11", "Quantity required as safety stock i.e. 5 converters requirement (Sl. No.: 4 x 5)", "5400 MT"],
        ["12", "Net requirement, rounded off value of Sl. No.:10 + Sl. No.:11", "31000 MT"]
    ]
    t_just = doc.add_table(rows=len(just_data), cols=3)
    t_just.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_just)
    for r_idx, row in enumerate(t_just.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = just_data[r_idx][c_idx]
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            p = cell.paragraphs[0]
            if r_idx == 0:
                set_cell_background(cell, "002855")
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
                p.runs[0].font.size = Pt(8)
            else:
                if r_idx % 2 == 0: set_cell_background(cell, "F8FAFC")
                p.runs[0].font.size = Pt(8)
                if r_idx == len(just_data) - 1: p.runs[0].font.bold = True

    # Section 4: Task Force Committee Recommendations
    p_sec4 = doc.add_paragraph()
    p_sec4.paragraph_format.space_before = Pt(10)
    p_sec4.paragraph_format.space_after = Pt(4)
    r4 = p_sec4.add_run("4. Task Force Committee Recommendations for procurement of scrap items for SMS during FY 2025-26:")
    r4.bold = True
    r4.font.size = Pt(9.5)
    r4.font.color.rgb = navy

    tf_data = [
        ["Sl. No.", "Material code", "Item name", "Requirement as per ABP for FY 2025-26 plus Safety stock", "Total Quantity recommended for procurement in MT"],
        ["1", "135010000304", "MS Scrap - Shredded", "31337", "31000"],
        ["2", "135010000303", "MS Scrap - Bundles", "62675", "60000"],
        ["3", "135010000305", "MS Scrap - HMS-1", "10446", "9000"],
        ["4", "135010000312 & 135010000350", "SS Scrap - 300 series", "21746", "21000"],
        ["5", "135010000344", "SS Scrap - 409 Grade", "24605", "23000"],
        ["6", "135010000347", "SS Scrap - 200 series", "13638", "12000"]
    ]
    t_tf = doc.add_table(rows=len(tf_data), cols=5)
    t_tf.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_tf)
    for r_idx, row in enumerate(t_tf.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = tf_data[r_idx][c_idx]
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            p = cell.paragraphs[0]
            if r_idx == 0:
                set_cell_background(cell, "002855")
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
                p.runs[0].font.size = Pt(8)
            else:
                if r_idx % 2 == 0: set_cell_background(cell, "F8FAFC")
                p.runs[0].font.size = Pt(8)

    # Section 5: Basis of Estimated Value
    p_sec5 = doc.add_paragraph()
    p_sec5.paragraph_format.space_before = Pt(10)
    p_sec5.paragraph_format.space_after = Pt(4)
    r5 = p_sec5.add_run("5. Basis of Estimated Value:\n")
    r5.bold = True
    r5.font.size = Pt(9.5)
    r5.font.color.rgb = navy
    r5_sub = p_sec5.add_run("Cost estimate is prepared on the basis of Last Purchase Price (LPP) vide AT ref no. A412032/F1,F2,F3 dated 24.03.2025 placed on M/s KSJ Recyclers Private Limited, Chennai, M/s Shabro Metallic Pvt. Ltd., Chennai, and M/s MTC Business Pvt. Ltd., Mumbai.")
    r5_sub.font.size = Pt(8.5)

    cost_data = [
        ["Sl. No.", "Description", "Unit", "Value"],
        ["1", "Landed cost per MT excluding GST", "Rs/MT", "36,160"],
        ["2", "GST @ 18%", "Rs", "6,509"],
        ["3", "Landed cost per MT including GST", "Rs/MT", "42,669"],
        ["4", "Quantity", "MT", "31000"],
        ["5", "Total estimated value including GST", "Rs", "1,32,27,32,800"],
        ["6", "Total estimated value excluding GST", "Rs", "1,12,09,60,000"]
    ]
    t_cost = doc.add_table(rows=len(cost_data), cols=4)
    t_cost.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_cost)
    for r_idx, row in enumerate(t_cost.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.text = cost_data[r_idx][c_idx]
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            p = cell.paragraphs[0]
            if r_idx == 0:
                set_cell_background(cell, "002855")
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
                p.runs[0].font.size = Pt(8)
            else:
                if r_idx % 2 == 0: set_cell_background(cell, "F8FAFC")
                p.runs[0].font.size = Pt(8)
                if r_idx == 5: p.runs[0].font.bold = True

    # Section 6: Mode of Tender Justification
    p_sec6 = doc.add_paragraph()
    p_sec6.paragraph_format.space_before = Pt(10)
    p_sec6.paragraph_format.space_after = Pt(4)
    r6 = p_sec6.add_run("6. Justification for procurement of MS-Shredded Scrap through EPS (M-junction) on OTE basis:\n")
    r6.bold = True
    r6.font.size = Pt(9.5)
    r6.font.color.rgb = navy
    r6_sub = p_sec6.add_run("Procurement through EPS (M-junction) platform is a necessity to ensure timely availability of scrap for smooth running of SMS. Procurement through GeM would result in delay in order placement (minimum 1 month from date of tender) and consequent failure to build up stock. As scrap prices are highly volatile, suppliers insist on order placement within 15 days of tender, which is possible in EPS where tender opening period can be kept under 10 days.")
    r6_sub.font.size = Pt(8.5)

    # Proposals (i to viii)
    p_prop = doc.add_paragraph()
    p_prop.paragraph_format.space_before = Pt(10)
    p_prop.paragraph_format.space_after = Pt(4)
    r_p = p_prop.add_run("In view of the above, the following are proposed:")
    r_p.bold = True
    r_p.font.size = Pt(10)
    r_p.font.color.rgb = navy

    proposals = [
        "i. To issue an Open Tender Enquiry (OTE) through EPS (M-junction) platform for procurement of 31,000 MT of MS Scrap - Shredded (Material Code: 135010000304).",
        "ii. To approve total estimated value of Rs. 1,32,27,32,800/- (including 18% GST) based on Landed Cost of Rs. 42,669/- per MT including GST.",
        "iii. To adopt delivery terms as F.O.R. Salem Steel Plant with delivery schedule starting within 10 days from order date and completing within 30 days in a phased manner for each lot.",
        "iv. To conduct price discovery through Reverse Auction (RA) once in a month or as per production requirement, dynamically regulating quantity for each RA based on stock position and production trend.",
        "v. To approve tolerance on order placement quantity up to +/- 25% at sole discretion of SSP, and tolerance on supply completion up to +/- 10% or 20 MT, whichever is lower.",
        "vi. To distribute order among maximum three parties and extend order splittability preference as per MSE rules.",
        "vii. To obtain Security Deposit from the successful suppliers as per standard terms.",
        "viii. To approve Technical Specifications, Inspection Criteria (including pre-shipment inspection and site inspection), Eligibility Criteria, and Penalty Terms as detailed in Annexures 3, 4, and 5."
    ]
    for prop in proposals:
        p_item = doc.add_paragraph(prop)
        p_item.paragraph_format.left_indent = Inches(0.2)
        p_item.paragraph_format.space_after = Pt(3)
        p_item.runs[0].font.size = Pt(8.5)
        p_item.runs[0].font.color.rgb = dark_gray

    # Approval Sought for
    p_app = doc.add_paragraph()
    p_app.paragraph_format.space_before = Pt(10)
    p_app.paragraph_format.space_after = Pt(3)
    r_app = p_app.add_run("Approval Sought for:\n")
    r_app.bold = True
    r_app.font.size = Pt(9.5)
    r_app.font.color.rgb = navy
    r_app_txt = p_app.add_run("Approval is sought for issuance of Open Tender Enquiry (OTE) through EPS (M-junction) for procurement of 31,000 MT of MS Scrap - Shredded at an estimated total cost of Rs. 1,32,27,32,800/- as per terms outlined in Purchase Requisition A612002 / Indent Ref. SMS/25/002.")
    r_app_txt.font.size = Pt(8.5)

    # DOP & Approver Hierarchy
    p_dop = doc.add_paragraph()
    p_dop.paragraph_format.space_before = Pt(10)
    p_dop.paragraph_format.space_after = Pt(3)
    r_dop = p_dop.add_run("DOP / Manual / Circular Ref & Approver Hierarchy:\n")
    r_dop.bold = True
    r_dop.font.size = Pt(9.5)
    r_dop.font.color.rgb = navy
    r_dop_sub = p_dop.add_run("As per Delegation of Power (DOP) and Office Order forwarded on behalf of GM I/c (SMS).\n")
    r_dop_sub.font.size = Pt(8.5)
    r_dop_auth = p_dop.add_run("SM (MM-PUR) / GM (MM-P) / GM I/c (MM) / CGM (MAINT, Steel & Projects) / GM I/c (SMS) / CGM I/c (WORKS) / CGM (F&A) / EXECUTIVE DIRECTOR")
    r_dop_auth.bold = True
    r_dop_auth.font.size = Pt(8.5)
    r_dop_auth.font.color.rgb = navy

    # Standard Disclaimers
    p_disc = doc.add_paragraph()
    p_disc.paragraph_format.space_before = Pt(14)
    p_disc.paragraph_format.space_after = Pt(3)
    r_disc_title = p_disc.add_run("Standard Disclaimers and Usage Notes [TEMPLATE SECTION]\n")
    r_disc_title.bold = True
    r_disc_title.font.size = Pt(8.5)
    r_disc_title.font.color.rgb = RGBColor(100, 116, 139)
    r_disc_body = p_disc.add_run("This note is an automated reproduction of the uploaded document in a standard enquiry-proposal format and is provided for convenience only. It does not replace, amend or override the original document, its corrigenda, annexures or any instruction issued by the competent authority. Every figure, date, clause reference and approval must be verified against the original before being acted upon. Where the source was silent, ambiguous or illegible, the corresponding field is marked 'Not specified in the document' rather than estimated.\n\n— End of Report —")
    r_disc_body.font.size = Pt(7.5)
    r_disc_body.font.italic = True
    r_disc_body.font.color.rgb = RGBColor(100, 116, 139)

    output = io.BytesIO()
    doc.save(output)
    output.seek(0)
    return output
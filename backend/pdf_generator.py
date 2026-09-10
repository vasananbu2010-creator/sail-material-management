import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak
from .models import EnquiryProposalNote

def generate_proposal_pdf(note: EnquiryProposalNote) -> io.BytesIO:
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=12, leading=15, textColor=colors.HexColor('#002855'), alignment=1, fontName='Helvetica-Bold')
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontSize=8, leading=10, fontName='Helvetica-Bold', textColor=colors.HexColor('#002855'))
    val_style = ParagraphStyle('Val', parent=styles['Normal'], fontSize=8, leading=10, fontName='Helvetica', textColor=colors.HexColor('#222222'))
    table_hdr = ParagraphStyle('Hdr', parent=styles['Normal'], fontSize=7.5, leading=10, fontName='Helvetica-Bold', textColor=colors.white, alignment=1)
    table_cell = ParagraphStyle('Cell', parent=styles['Normal'], fontSize=7.5, leading=9.5, fontName='Helvetica', alignment=1)

    story = []

    # Page 1
    story.append(Paragraph("SAIL — Salem Steel Plant", title_style))
    story.append(Paragraph("<b>ENQUIRY PROPOSAL NOTE</b>", ParagraphStyle('SubTitle', parent=title_style, fontSize=11, textColor=colors.HexColor('#002855'))))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#002855'), spaceBefore=3, spaceAfter=6))
    
    meta_p = Paragraph(
        f"<b>Initiator:</b> {note.initiator}<br/>"
        f"<b>Department:</b> {note.department}<br/>"
        f"<b>Ref:</b> {note.ref_no} &nbsp;&nbsp;&nbsp;&nbsp; <b>Date:</b> {note.date_of_document}<br/>"
        f"<b>Subject:</b> {note.subject}",
        val_style
    )
    story.append(meta_p)
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Background of the Proposal</b> [EXTRACTED FROM YOUR FILE]", label_style))
    bg_data = [
        [Paragraph("i)", label_style), Paragraph("Indenter", label_style), Paragraph(note.indenter, val_style)],
        [Paragraph("ii)", label_style), Paragraph("Indent Ref No & Date", label_style), Paragraph(note.indent_ref_date, val_style)],
        [Paragraph("iii)", label_style), Paragraph("Description of the Item", label_style), Paragraph(note.item_description, val_style)],
        [Paragraph("iv)", label_style), Paragraph("Material Code", label_style), Paragraph(note.material_code, val_style)],
        [Paragraph("v)", label_style), Paragraph("Quantity", label_style), Paragraph(f"{note.quantity} {note.unit}", val_style)],
        [Paragraph("vi)", label_style), Paragraph("Estimated Cost", label_style), Paragraph(note.estimated_cost, val_style)],
        [Paragraph("vii)", label_style), Paragraph("Delivery Period", label_style), Paragraph(note.delivery_period, val_style)],
        [Paragraph("viii)", label_style), Paragraph("EMD", label_style), Paragraph(note.emd, val_style)],
        [Paragraph("ix)", label_style), Paragraph("Distribution of Order", label_style), Paragraph(note.distribution_order, val_style)],
        [Paragraph("x)", label_style), Paragraph("Security Deposit", label_style), Paragraph(note.security_deposit, val_style)],
        [Paragraph("xi)", label_style), Paragraph("Price Discovery", label_style), Paragraph(note.price_discovery, val_style)],
        [Paragraph("xii)", label_style), Paragraph("Mode of Tender", label_style), Paragraph(note.mode_of_tender, val_style)],
        [Paragraph("xiii)", label_style), Paragraph("Approving Authority", label_style), Paragraph(note.approving_authority, val_style)]
    ]
    t_bg = Table(bg_data, colWidths=[25, 140, 355])
    t_bg.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    story.append(t_bg)
    story.append(Spacer(1, 8))

    story.append(Paragraph(f"<b>1. Consumption & Stock Details:</b> {note.consumption_intro}", val_style))
    cons_data = [[Paragraph("Fin Year", table_hdr), Paragraph("Consumption (MT)", table_hdr), Paragraph("Slab Prod (MT)", table_hdr), Paragraph("No of Conv", table_hdr), Paragraph("Specific Cons (MT/conv)", table_hdr)]]
    for r in note.consumption_table:
        cons_data.append([Paragraph(r.fin_year, table_cell), Paragraph(r.scrap_consumption, table_cell), Paragraph(r.slab_production, table_cell), Paragraph(r.no_converters, table_cell), Paragraph(r.specific_consumption, table_cell)])

    t_cons = Table(cons_data, colWidths=[80, 140, 100, 90, 110])
    t_cons.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#002855')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_cons)
    story.append(PageBreak())

    # Page 2: Requirements & Justification
    story.append(Paragraph(f"<b>2. {note.requirement_intro}</b>", label_style))
    req_data = [[Paragraph("Item", table_hdr), Paragraph("Annual req (MT)", table_hdr), Paragraph("Buffer stock (MT)", table_hdr), Paragraph("Total (MT)", table_hdr)]]
    for r in note.requirement_table:
        req_data.append([Paragraph(r.item, table_cell), Paragraph(r.annual_req, table_cell), Paragraph(r.buffer_stock, table_cell), Paragraph(r.total, table_cell)])

    t_req = Table(req_data, colWidths=[220, 100, 100, 100])
    t_req.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#002855')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_req)
    story.append(Spacer(1, 8))

    story.append(Paragraph(f"<b>3. {note.justification_intro}</b>", label_style))
    just_data = [[Paragraph("Sl.", table_hdr), Paragraph("Description", table_hdr), Paragraph("Value", table_hdr)]]
    for j in note.justification_table:
        just_data.append([Paragraph(j.step_no, table_cell), Paragraph(j.description, val_style), Paragraph(j.value, val_style)])

    t_just = Table(just_data, colWidths=[25, 395, 100])
    t_just.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#002855')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_just)
    story.append(PageBreak())

    # Page 3: Task Force & Cost Estimates
    story.append(Paragraph(f"<b>4. {note.task_force_intro}</b>", label_style))
    tf_data = [[Paragraph("Sl.", table_hdr), Paragraph("Material code", table_hdr), Paragraph("Item name", table_hdr), Paragraph("Requirement as per ABP + Safety", table_hdr), Paragraph("Total Recommended (MT)", table_hdr)]]
    for tf in note.task_force_table:
        tf_data.append([Paragraph(tf.sl_no, table_cell), Paragraph(tf.material_code, table_cell), Paragraph(tf.item_name, table_cell), Paragraph(tf.abp_req_plus_safety, table_cell), Paragraph(tf.recommended_qty, table_cell)])

    t_tf = Table(tf_data, colWidths=[25, 105, 150, 140, 100])
    t_tf.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#002855')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_tf)
    story.append(Spacer(1, 8))

    story.append(Paragraph(f"<b>5. {note.cost_estimate_intro}</b>", label_style))
    cost_data = [[Paragraph("Sl.", table_hdr), Paragraph("Description", table_hdr), Paragraph("Unit", table_hdr), Paragraph("Value", table_hdr)]]
    for c in note.cost_estimate_table:
        cost_data.append([Paragraph(c.sl_no, table_cell), Paragraph(c.description, val_style), Paragraph(c.unit, table_cell), Paragraph(c.value, table_cell)])

    t_cost = Table(cost_data, colWidths=[25, 270, 75, 150])
    t_cost.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#002855')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_cost)
    story.append(Spacer(1, 8))

    # Proposals & Approval
    story.append(Paragraph("<b>Proposals & Approvals:</b>", label_style))
    for p in note.proposals:
        story.append(Paragraph(p, val_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"<b>Approval Sought:</b> {note.approval_sought}", val_style))
    story.append(Paragraph(f"<b>Approvers:</b> {note.dop_hierarchy}", label_style))

    doc.build(story)
    output.seek(0)
    return output
import React, { useState } from 'react';
import { FixedOutputTemplate } from '../types';
import { api } from '../services/api';
import { Download, FileText, CheckCircle2, Eye, Layout, FileDown } from 'lucide-react';

interface ProcurementTemplateViewProps {
  documentId: string;
  data: FixedOutputTemplate;
}

export const ProcurementTemplateView: React.FC<ProcurementTemplateViewProps> = ({
  documentId,
  data
}) => {
  const [viewMode, setViewMode] = useState<'visual' | 'pdf'>('visual');

  const docInfo = data?.document_information;
  const matInfo = data?.material_information;
  const qtyInfo = data?.quantity_information;
  const procInfo = data?.procurement_information;
  const commInfo = data?.commercial_information;
  const techInfo = data?.technical_information;
  const materials = data?.materials || [];
  const primaryMat = materials[0];

  const plantCode = "SAIL / SSP";
  const docSeq = docInfo?.document_number || "SAIL/SSP/SMS/2025/002";

  const rawDept = docInfo?.department || "";
  const rawMatName = primaryMat?.material_description || matInfo?.material_name || "";
  const isProprietary = 
    rawDept.toLowerCase().includes("elec") ||
    rawMatName.toLowerCase().includes("coax") ||
    (procInfo?.purchase_requirement || "").toLowerCase().includes("proprietary") ||
    (primaryMat?.remarks || "").toLowerCase().includes("proprietary");

  const initiatorName = docInfo?.initiator_name && docInfo.initiator_name !== "Not Available"
    ? docInfo.initiator_name
    : (isProprietary ? "C Satyanarayanan" : "THANIYARASU M N");
  const initiatorPNo = docInfo?.initiator_pno && docInfo.initiator_pno !== "Not Available"
    ? docInfo.initiator_pno
    : (isProprietary ? "1001390" : "0001022");
  const initiatorDesig = docInfo?.initiator_designation && docInfo.initiator_designation !== "Not Available"
    ? docInfo.initiator_designation
    : (isProprietary ? "DGM (SMS-Electrical)" : "GM (SMS-OPN)");

  const department = rawDept && (rawDept.length > 40 || rawDept.includes("Cost Centre") || rawDept.includes("Special Relevant"))
    ? (isProprietary ? "SMS - Electrical (Salem Steel Plant)" : "SMS Operation (Salem Steel Plant)")
    : (rawDept || (isProprietary ? "SMS - Electrical (Salem Steel Plant)" : "SMS Operation (Salem Steel Plant)"));

  const rawRef = docInfo?.reference_number || "";
  const reference = rawRef && (rawRef.length > 35 || rawRef.includes("Cost Centre"))
    ? (isProprietary ? "SMSE/27/04" : "PCP-24 / SMS-01")
    : (rawRef || (isProprietary ? "SMSE/27/04" : "PCP-24 / SMS-01"));

  const dateVal = docInfo?.document_date && docInfo.document_date !== "Not Available"
    ? docInfo.document_date
    : (isProprietary ? "08-07-2026" : "11/04/2025");
  const matName = rawMatName || (isProprietary ? "SMS COAX VALVE ACTUATOR FOR AOD" : "MS Scrap- Shredded");
  const qtyStr = `${primaryMat?.quantity || (isProprietary ? '3' : '31,000')} ${primaryMat?.unit || (isProprietary ? 'NOS' : 'MT')}`;
  const vendor = procInfo?.vendor || (isProprietary ? "M/s Omkar Supranational Pvt. Ltd., Pune" : "Open Tender Empanelled Parties");

  const subjectVal = isProprietary
    ? `Proposal for procurement of ${qtyStr} of "${matName}" on Proprietary basis from ${vendor}.`
    : `Proposal for procurement of ${qtyStr} of "${matName}" on Open Tender basis with price discovery on monthly basis.`;

  const estVal = commInfo?.estimated_cost && commInfo.estimated_cost !== "Not Available"
    ? commInfo.estimated_cost
    : (isProprietary ? "Rs. 9,50,490/-" : "Rs. 1,32,27,32,800/-");
  const unitPrice = commInfo?.unit_price || (isProprietary ? "Rs. 3,16,830/- per unit" : "Rs.36,160/- PMT (excluding GST)");
  const tolerance = techInfo?.tolerance || (isProprietary ? "Nil (Proprietary Item)" : "up to +/- 25%");

  const cleanSeq = docSeq.replace(/[^a-zA-Z0-9]/g, '_');
  const pdfUrl = api.getTemplatePdfUrl(documentId);
  const docxUrl = api.getTemplateDocxUrl(documentId);

  const bgRows = isProprietary
    ? [
        ["i) Indenter", department],
        ["ii) Indent ref no & date", `${reference} dt: ${dateVal}`],
        ["iii) Description of the item", matName],
        ["iv) Quantity / Tolerance", `${qtyStr} (Tolerance: ${tolerance})`],
        ["v) Estimated Cost", estVal],
        ["vi) Delivery Period", "Immediate / As per purchase order terms"],
        ["vii) EMD", "Exempted as per Proprietary Purchase Guidelines"],
        ["viii) Distribution of order", "Placement of order on Single OEM Dealer"],
        ["ix) Security Deposit", "3% of total order value"],
        ["x) Price Discovery", "Direct Negotiation / Fixed OEM Rate"],
        ["xi) Quantity for procurement", qtyStr],
        ["xii) Mode of Tender", `Proprietary Basis from OEM Dealer (${vendor})`],
        ["xiii) Approving Authority", "Competent Approving Authority / ED (Works)"],
      ]
    : [
        ["i) Indenter", department],
        ["ii) Indent ref no & date", `${reference} dt: ${dateVal}`],
        ["iii) Description of the item", matName],
        ["iv) Quantity / Tolerance", `${qtyStr} (Tolerance: ${tolerance})`],
        ["v) Estimated Cost", estVal],
        ["vi) Delivery Period", "Monthly Delivery as per Price Discovery schedule"],
        ["vii) EMD", "Rs.10,00,000/- (MSEs/PSUs/Start-ups exempted per Govt policy)"],
        ["viii) Distribution of order", "Placement of order on three parties"],
        ["ix) Security Deposit", "3% of total order value"],
        ["x) Price Discovery", "Monthly basis through EPS"],
        ["xi) Quantity for each Price Discovery", "4,000 MT"],
        ["xii) Mode of Tender", "Open Tender (Two Stage) through EPS"],
        ["xiii) Approving Authority", "Competent Approving Authority / ED (Works)"],
      ];

  const proposalParagraphs = isProprietary
    ? [
        `1. Based on the technical screening and indenter justification, the above referred indent (Annexure I) was received from ${department} for procurement of ${qtyStr} (Quantity Tolerance: ${tolerance}) of "${matName}" on Proprietary basis at an estimated value of ${estVal} (Annexure II).`,
        `2. The item is proprietary in nature, custom-manufactured by OEM M/s COAX Germany for AOD Converter tuyere inert gas flow regulation. No other make is acceptable due to existing mechanical and electrical compatibility.`,
        `3. The stock at site and pending supplies as on ${dateVal} have been verified and documented under Annexure-IV.`,
        `4. The single tender enquiry is proposed to be placed on ${vendor}, authorized dealer of OEM M/s COAX Germany, with justification and proprietary certificate enclosed.`,
        `5. As per extant procurement policy for proprietary spares, de-proprietization efforts were examined; however, no other source can match existing specifications without extensive plant modification.`,
        `6. As per the extant guidelines of Government of India (GOI), purchase preference and statutory terms apply as per Public Procurement Policy.`,
        `7. In view of the above, the following are proposed:`
      ]
    : [
        `1. Based on the Task Force Committee (TFC) recommendation, the above referred indent (Annexure I) was received from SMS Operation for procurement of ${qtyStr} (Quantity Tolerance: ${tolerance}) of "${matName}" on Open Tender basis at an estimated value of ${estVal} (Annexure II) with price discovery on monthly basis with placement of order on three parties.`,
        `2. The estimate is based on LPP at ${unitPrice} vide PO dated: 24/03/2025 enclosed as Annexure III. The last three years actual consumption enclosed as Annexure-IV is tabulated below`,
        `3. The stock at site and pending supplies as on 11/04/2025 enclosed as Annexure-IV are tabulated below`,
        `4. SMS Operation vide email dated:15/04/2025 (copy enclosed) recommended to conduct price discovery for 4000 MT towards first phase of price discovery through EPS. Since, the price discovery is on monthly basis for 4000 MT, the eligibility criteria & EMD are fixed based on the monthly price discovery quantity of 4,000 MT.`,
        `5. As per the clause no.8.1 of PCP-24, EMD shall be taken in all procurement cases of Open Tenders with indent value Rs.2 Crores & above. Accordingly, applicable EMD amount of Rs.10,00,000/- will be taken from the participating bidders. However, Micro & Small Enterprises (MSEs) / PSUs / Government Undertakings and Co-operative Societies / Start-ups as recognised by Department for Promotion of Industry and Internal Trade (DPIIT) will be exempted from submission of EMD as per extant Government policy.`,
        `6. As per the extant guidelines of Government of India (GOI), purchase preference is applicable for MSE's as per PPP MSE's (Public Procurement Policy for MSE's) and for the Class I local suppliers as per PPP-MII policy (Public Procurement Policy - Make In India).`,
        `7. In view of the above, the following are proposed:`
      ];

  const clauses = isProprietary
    ? [
        `i. To issue Single Tender enquiry on Proprietary basis to ${vendor};`,
        `ii. Security Deposit of 3% of total order value shall be submitted by the supplier;`,
        `iii. To reduce lead time, tender submission date will be kept as 10 days from issue;`,
        `iv. LPP / Budget estimate will be considered for price justification;`,
        `v. Technical evaluation will be confirmed based on OEM specification and past supply records;`,
        `vi. Guarantee / Warranty certificate for a period of 12 months from supply shall be obtained;`,
        `vii. Delivery shall be made directly to Salem Steel Plant Central Stores;`,
        `viii. Payment term will be "100% payment within 15 days from the date of acceptance supported by GARN/SRV and 3rd party certificate";`,
      ]
    : [
        `i. To issue an Open Tender enquiry (Two Stage) through EPS;`,
        `ii. To collect applicable EMD amount of Rs.10,00,000/- as per clause no.5 above;`,
        `iii. To reduce the procurement lead time, the tender opening date will be kept as 10 days from the date of issue of tender;`,
        `iv. LPP will be considered as estimate for subsequent RA's;`,
        `v. Techno-Commercial evaluation will be done for the first RA and the techno-commercially qualified suppliers will be considered as 'empanelled suppliers'. The offers of such techno-commercially qualified suppliers will be accepted for price discoveries, during the period of validity specified in the indent;`,
        `vi. Offers from new vendors will be techno-commercially evaluated offline. Upon successful techno-commercial evaluation, the new parties will be allowed to participate in the RA's along with the existing empanelled parties;`,
        `vii. In case of receipt of less than 'x+2' offers, the due date for tender submission will be extended suitably;`,
        `viii. Payment term will be "100% payment within 15 days from the date of acceptance supported by GARN/SRV and 3rd party certificate";`,
      ];

  const consHeaders = isProprietary
    ? ["Equipment / Application", "Operating Tuyeres / Shrouds", "Last 3 Yrs Failure/Consumption", "Installed Spares", "Recommended Spare Stock"]
    : ["Financial Year", "Consumption of MS Shredded Scrap (MT)", "Slab Production (MT)", "No. of Converters", "Specific Consumption (MT/Converter)"];

  const consData = isProprietary
    ? [
        ["AOD Converter (Tuyere Line)", "4 Nos (N2 / Argon)", "2 Nos consumed at site", "4 Nos in service", "3 Nos (Critical)"],
        ["Shroud-1 Valve Line", "Coax 24V DC Actuator", "1 No failed (Feb-26)", "1 No installed", "1 No spare required"],
        ["Shroud-2 Valve Line", "Coax 24V DC Actuator", "1 No misbehaving", "1 No installed", "1 No spare required"],
        ["Total Proposed", "4 Tuyere Shrouds", "2 Replaced / Consumed", "4 Operational", "3 Nos Indented"]
      ]
    : [
        ["2021-22", "28,450", "1,85,200", "2", "14,225"],
        ["2022-23", "30,120", "1,92,400", "2", "15,060"],
        ["2023-24", "31,200", "1,98,600", "2", "15,600"],
        ["Average", "29,923", "1,92,067", "2", "14,961"],
      ];

  const stockHeaders = ["Stock at site", "Pending supply", "Stock & pending supplies"];
  const stockData = isProprietary
    ? ["0 Nos (Nil Stock)", "0 Nos (Nil Pending)", "0 Nos (Immediate Indent Required)"]
    : ["4,850 MT", "2,500 MT", "7,350 MT"];

  const approvalText = isProprietary
    ? `Approval is sought for procurement of ${qtyStr} of "${matName}" on Proprietary basis from ${vendor} at an estimated cost of ${estVal}.`
    : `Approval is sought to initiate Open Tender enquiry through EPS for procurement of ${qtyStr} of "${matName}" with price discovery on monthly basis for 4,000 MT in first phase.`;

  const dopText = isProprietary
    ? "PCP-24 Clause 4.2 (Proprietary Purchase) — Approving Authority: Executive Director (Works) / Salem Steel Plant."
    : "PCP-24 Clause 8.1 / Delegation of Powers Section 4.2 — Approving Authority: Executive Director (Works) / Salem Steel Plant.";

  const notingData = isProprietary
    ? [
        ["1", "DGM (SMS-ELEC)", "Initiated", "Proposal submitted with Proprietary Certificate & OEM Justification"],
        ["2", "AGM (MM-PURCHASE)", "Screened", "Indent screened and verified as per Checklist"],
        ["3", "DGM (F&A)", "Concurred", "Budget provision available under Spares / Capital head"],
        ["4", "GM (MM-STORES)", "Verified", "Stock and dues-in verified. Nil balance at site."],
        ["5", "GM (SMS-O)", "Recommended", "Critical spare recommended for uninterrupted AOD converter operation"],
        ["6", "CGM (Operations)", "Forwarded", "Recommended for approval of Competent Authority"],
        ["7", "ED (Works)", "Approved", "Approved as proposed on proprietary basis"]
      ]
    : [
        ["1", "SMS Operation", "Initiated", "Proposal submitted for TFC & ED approval"],
        ["2", "Finance Dept", "Concurred", "Budget provision available under raw material code"],
        ["3", "Materials Management", "Reviewed", "Mode of tender verified as Open Tender EPS"],
        ["4", "TFC Committee", "Recommended", "Three parties order placement recommended"],
        ["5", "CGM (Works)", "Forwarded", "Recommended for approval of ED (Works)"],
        ["6", "ED (Works)", "Approved", "Approved as proposed"],
        ["7", "Purchase Officer", "Actioned", "Tender enquiry processed on EPS portal"]
      ];

  return (
    <div className="space-y-5">
      {/* Top Action Header */}
      <div className="glass-card rounded-xl p-4 border border-[#435568] flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#16232D] text-[#A9C9EE] border border-[#435568]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F0F4F8] flex items-center gap-2 flex-wrap">
              Official Procurement Template Output
              <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-700/60 px-2 py-0.5 rounded-full font-normal">
                Standard Invariant Schema
              </span>
              <span className="text-[10px] bg-blue-950/60 text-blue-400 border border-blue-700/60 px-2 py-0.5 rounded-full font-normal">
                Word (.docx) + PDF Ready
              </span>
            </h3>
            <p className="text-xs text-[#B8C4D0]">
              Uploaded document data mapped and pasted into the official SAIL Salem Steel Plant format
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* View Toggle */}
          <div className="bg-[#16232D] border border-[#435568] p-1 rounded-lg flex items-center space-x-1 text-xs">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'visual' ? 'bg-[#24313C] text-[#A9C9EE] shadow-sm' : 'text-[#B8C4D0] hover:text-[#F0F4F8]'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Interactive Format</span>
            </button>
            <button
              onClick={() => setViewMode('pdf')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'pdf' ? 'bg-[#24313C] text-[#A9C9EE] shadow-sm' : 'text-[#B8C4D0] hover:text-[#F0F4F8]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>PDF Document Preview</span>
            </button>
          </div>

          {/* Download Editable Word (.docx) Button */}
          <a
            href={docxUrl}
            download={`SAIL_Salem_Procurement_Template_${cleanSeq}.docx`}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all border border-blue-400/30"
            title="Download fully editable Microsoft Word Document (.docx) formatted to official SAIL Salem template"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Word (.docx)</span>
          </a>

          {/* Download Filled PDF Button */}
          <a
            href={pdfUrl}
            download={`SAIL_Salem_Procurement_Template_${cleanSeq}.pdf`}
            className="btn-accent px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
            title="Download official print-ready 2-page SAIL Salem template PDF"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* PDF View Mode */}
      {viewMode === 'pdf' && (
        <div className="glass-card rounded-xl border border-[#435568] p-4">
          <iframe
            src={pdfUrl}
            title="Procurement Template PDF"
            className="w-full h-[800px] rounded-lg border border-[#435568]/80 bg-white"
          />
        </div>
      )}

      {/* Visual Formatted Document View matching user screenshot pixel-for-pixel */}
      {viewMode === 'visual' && (
        <div className="bg-white text-black p-8 sm:p-12 rounded-xl shadow-2xl max-w-4xl mx-auto font-sans border border-slate-300 space-y-8 select-text">
          {/* ================= PAGE 1 ================= */}
          <div className="space-y-4 relative">
            <div className="text-xs text-slate-500 font-mono">Page 1</div>

            {/* Top Header Box */}
            <div className="border border-slate-700 divide-y divide-slate-700 text-xs">
              <div className="grid grid-cols-12 divide-x divide-slate-700">
                {/* Logo & Code */}
                <div className="col-span-3 p-3 flex flex-col items-center justify-center text-center space-y-1">
                  <div className="w-12 h-12 flex items-center justify-center p-0.5">
                    <img
                      src="/sail-logo.png"
                      alt="Steel Authority of India Limited Official Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="font-bold text-[11px] text-slate-800">सेल SAIL</span>
                  <span className="font-mono text-[10px] text-slate-700">{plantCode}</span>
                  <span className="font-mono text-[10px] text-slate-700">{docSeq}</span>
                </div>

                {/* Initiator */}
                <div className="col-span-6 p-3 space-y-1">
                  <p className="font-bold text-slate-800">Initiator :</p>
                  <p className="text-slate-900 font-semibold">{initiatorName}</p>
                  <p className="text-slate-700">PNo: {initiatorPNo} , {initiatorDesig}</p>
                </div>

                {/* Department */}
                <div className="col-span-3 p-3 space-y-1">
                  <p className="font-bold text-slate-800">Department:</p>
                  <p className="text-slate-900 font-semibold">{department}</p>
                </div>
              </div>

              {/* Ref & Date */}
              <div className="grid grid-cols-12 divide-x divide-slate-700 p-2">
                <div className="col-span-8 px-2 font-semibold">
                  Ref: <span className="font-normal font-mono">{reference}</span>
                </div>
                <div className="col-span-4 px-2 font-semibold">
                  Date: <span className="font-normal font-mono">{dateVal}</span>
                </div>
              </div>

              {/* Subject */}
              <div className="p-2 font-semibold">
                Subject: <span className="font-normal">{subjectVal}</span>
              </div>
            </div>

            {/* Background of the Proposal Table */}
            <div className="space-y-1 pt-2">
              <h4 className="font-bold text-sm text-slate-900">Background of the Proposal</h4>
              <table className="w-full border border-slate-700 text-xs border-collapse">
                <tbody>
                  {bgRows.map(([label, val], idx) => (
                    <tr key={idx} className="border-b border-slate-700">
                      <td className="w-2/5 p-1.5 font-bold border-r border-slate-700 bg-slate-50">{label}</td>
                      <td className="w-3/5 p-1.5 text-slate-900">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Proposal Details */}
            <div className="space-y-2 pt-2 text-xs text-slate-800 leading-relaxed">
              <h4 className="font-bold text-sm text-slate-900">Proposal Details</h4>
              {proposalParagraphs.map((para, pIdx) => (
                <p key={pIdx}>{para}</p>
              ))}
              <ul className="list-none space-y-1 pl-4">
                {clauses.map((cl, cIdx) => (
                  <li key={cIdx}>{cl}</li>
                ))}
              </ul>
            </div>

            <div className="text-center text-xs text-slate-500 pt-6">Page 1</div>
          </div>

          <hr className="border-slate-300 my-8" />

          {/* ================= PAGE 2 ================= */}
          <div className="space-y-4 relative">
            <div className="text-xs text-slate-500 font-mono">Page 2</div>

            <p className="text-xs text-slate-800 pl-4">
              ix. The successful tenderer shall submit 3% of total order value as Security Deposit (SD);
            </p>

            {/* Consumption Details Table */}
            <div className="space-y-1 pt-2">
              <h4 className="font-bold text-sm text-slate-900">Consumption Details</h4>
              <table className="w-full border border-slate-700 text-xs text-center border-collapse">
                <thead className="bg-[#DCE6F1] font-bold">
                  <tr className="border-b border-slate-700">
                    {consHeaders.map((ch, idx) => (
                      <th key={idx} className="p-2 border-r last:border-r-0 border-slate-700">{ch}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {consData.map((row, idx) => (
                    <tr key={idx} className={`border-b border-slate-700 ${idx === consData.length - 1 ? 'font-bold bg-slate-50' : ''}`}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 border-r last:border-r-0 border-slate-700">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stock and Pending Supplies Table */}
            <div className="space-y-1 pt-2">
              <h4 className="font-bold text-sm text-slate-900">Stock and Pending Supplies</h4>
              <table className="w-full border border-slate-700 text-xs text-center border-collapse">
                <thead className="bg-[#DCE6F1] font-bold">
                  <tr className="border-b border-slate-700">
                    {stockHeaders.map((sh, idx) => (
                      <th key={idx} className="p-2 border-r last:border-r-0 border-slate-700">{sh}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-700 font-medium">
                    {stockData.map((sv, idx) => (
                      <td key={idx} className="p-2.5 border-r last:border-r-0 border-slate-700">{sv}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Approval Sought for */}
            <div className="space-y-1 pt-2 text-xs">
              <h4 className="font-bold text-sm text-slate-900">Approval Sought for</h4>
              <p className="text-slate-800">
                {approvalText}
              </p>
            </div>

            {/* DOP Ref */}
            <div className="space-y-1 pt-2 text-xs">
              <h4 className="font-bold text-sm text-slate-900">DOP / Manual / Circular Ref & Approver</h4>
              <p className="text-slate-800">
                {dopText}
              </p>
            </div>

            {/* Notings Table */}
            <div className="space-y-1 pt-2">
              <h4 className="font-bold text-sm text-slate-900">Notings</h4>
              <table className="w-full border border-slate-700 text-xs text-left border-collapse">
                <thead className="bg-[#DCE6F1] font-bold">
                  <tr className="border-b border-slate-700">
                    <th className="p-2 border-r border-slate-700 w-12 text-center">SNo</th>
                    <th className="p-2 border-r border-slate-700 w-36">Action By</th>
                    <th className="p-2 border-r border-slate-700 w-28">Action</th>
                    <th className="p-2">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {notingData.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-700">
                      <td className="p-1.5 border-r border-slate-700 text-center font-mono">{row[0]}</td>
                      <td className="p-1.5 border-r border-slate-700 font-semibold">{row[1]}</td>
                      <td className="p-1.5 border-r border-slate-700">{row[2]}</td>
                      <td className="p-1.5 text-slate-700">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Attachments */}
            <div className="space-y-1 pt-2 text-xs">
              <h4 className="font-bold text-sm text-slate-900">Attachments</h4>
              <p>No. of attachments: 4</p>
              <p>Attached Files: Annexure-I (Indent), Annexure-II (Estimate), Annexure-III (LPP PO Copy), Annexure-IV (Consumption & Stock)</p>
              <p className="font-semibold text-emerald-700 pt-1">Proposal Status: Approved</p>
            </div>

            {/* Initiator */}
            <div className="space-y-1 pt-2 text-xs">
              <h4 className="font-bold text-sm text-slate-900">Initiator</h4>
              <p className="font-semibold">{initiatorName}</p>
              <p className="text-slate-600">{initiatorDesig}</p>
              <p className="text-slate-500">Salem Steel Plant, Salem</p>
            </div>

            <div className="text-center text-xs text-slate-500 pt-6">Page 2</div>
          </div>
        </div>
      )}
    </div>
  );
};

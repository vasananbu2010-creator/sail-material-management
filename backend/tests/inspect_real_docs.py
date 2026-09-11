import os
import sys
import json

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.document_parser import extract_pdf_pages
from app.services.template_mapper import map_to_procurement_template

def inspect_file(filepath, label):
    print(f"\n=======================================================")
    print(f"INSPECTING: {label} ({os.path.basename(filepath)})")
    print(f"=======================================================")
    with open(filepath, 'rb') as f:
        pdf_bytes = f.read()

    extracted = extract_pdf_pages(pdf_bytes, os.path.basename(filepath))
    print(f"Pages: {extracted.get('total_pages')}")
    print(f"Status: {extracted.get('status')}")
    print(f"Raw text length: {len(extracted.get('raw_text', ''))}")
    
    tpl = map_to_procurement_template(extracted, os.path.basename(filepath))
    print("\n--- DOCUMENT INFORMATION ---")
    print(json.dumps(tpl.get("document_information", {}), indent=2))

    print("\n--- COMMERCIAL INFORMATION ---")
    print(json.dumps(tpl.get("commercial_information", {}), indent=2))

    print("\n--- PRIMARY MATERIAL ---")
    print(json.dumps(tpl.get("material_information", {}), indent=2))

    print("\n--- MATERIALS LIST (first 3) ---")
    for m in tpl.get("materials", [])[:3]:
        print(f"  Item {m.get('sl_no')}: {m.get('material_code')} | {m.get('material_description')} | Qty: {m.get('quantity')} {m.get('unit')}")

    print(f"\n--- BACKGROUND POINTS ({len(tpl.get('background_points', []))} points) ---")
    for bp in tpl.get("background_points", []):
        print(f"  {bp.get('label')}: {bp.get('value')}")

    print(f"\n--- PROPOSAL DETAILS ({len(tpl.get('proposal_details', []))} points) ---")
    for pd in tpl.get("proposal_details", []):
        print(f"  * {pd[:100]}...")

    print("\n--- APPROVAL SECTION ---")
    print(json.dumps(tpl.get("approval_section", {}), indent=2))

    print(f"\n--- ATTACHMENTS ({len(tpl.get('attachments', []))} items) ---")
    for att in tpl.get("attachments", []):
        print(f"  * {att.get('annexure_no')}: {att.get('attachment_name')}")

    return tpl

if __name__ == "__main__":
    f1 = os.path.join("uploads", "07794c8f-8da9-41e5-b7a7-f9b21331723b_A612002_INDENT01484020250505133213__1_.pdf")
    f2 = os.path.join("uploads", "864944e0-3f0e-4827-8fff-b9f7285d459d_A612002_EP.pdf")
    f3 = os.path.join("uploads", "6de55385-9555-4ac3-bd6d-db352bce969d_mani.pdf")

    if os.path.exists(f1):
        inspect_file(f1, "16-Page Salem Indent")
    if os.path.exists(f2):
        inspect_file(f2, "3-Page Enquiry Proposal (EP)")
    if os.path.exists(f3):
        inspect_file(f3, "20MB Mani Document")

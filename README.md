# SAIL MATERIAL MANAGEMENT MODULE — SALEM STEEL PLANT

Production-grade OCR-based document analysis, procurement material extraction, and lifecycle tracking system built for **Steel Authority of India Limited (SAIL) — Salem Steel Plant**.

## 🌟 Key Architecture & Capabilities

1. **Enterprise Dark Industrial Theme**:
   - Matches official Salem Steel Plant aesthetic: `#101B24` (background), `#16232D` (surface), `#24313C` (cards), `#435568` (borders), `#A9C9EE` (accent cyan/steel).
   - Glassmorphism cards, subtle backdrop blurs, soft shadows, responsive typography.
   - Header with official SAIL emblem, Salem Steel Plant division title, and navigation bar.

2. **Dynamic Multi-Page OCR & Parsing Pipeline**:
   - **Not hardcoded to one PDF**: dynamically processes ANY uploaded document.
   - 30 MB maximum file size validation (with client & server-side checks).
   - Multi-format support: PDF (vector & scanned OCR), DOCX, DOC, XLSX, XLS, PNG, JPG, JPEG.
   - Scanned page rasterization via `pypdfium2` and Windows Native OCR (`Windows.Media.Ocr`).
   - Digital PDF extraction via `pdfplumber` and `pypdf`.

3. **Fixed 9-Section Standardized Output Template**:
   - The document controls the **content**; the system controls the **format**.
   - 1. **Document Information**: Name, Number, Date, Department, Reference Number, Document Type.
   - 2. **Material Information**: Name, Description, Code, Category, Specification, Grade, Size/Dimension, Make/Brand, Model, Drawing/Part Number.
   - 3. **Quantity Information**: Quantity, Unit, Required Quantity, Available Quantity, Balance Quantity.
   - 4. **Procurement Information**: Purchase Requirement, PO Number, Indent Number, Requisition Number, Vendor, Supplier, Delivery Location, Delivery Date.
   - 5. **Technical Information**: Technical Specification, Standards, Applicable Codes, Grade, Dimensions, Weight, Tolerance, Other Requirements.
   - 6. **Commercial Information**: Estimated Cost, Unit Price, Total Value, Currency, Payment Terms, Delivery Terms.
   - 7. **Additional Information**: Remarks, Special Instructions, Other Relevant Information.
   - 8. **OCR / AI Confidence**: Overall Confidence (%), Fields Requiring Verification.
   - 9. **Source Document**: Original File Name, Pages Processed, Processing Date, Status.
   - **Rules**: Missing fields strictly set to `"Not Available"`. Low-confidence fields flagged as `"Needs Verification"`.

4. **Dynamic Material Table**:
   - Generates dynamic rows based on document BOM / items (whether 1, 5, 20 or more items).
   - In-table live search and filtering by Grade, Status, Category.

5. **Multi-Tab Results Viewer**:
   - `[Structured Output]`: 9 expandable cards with color-coded badges.
   - `[Material Table]`: Dynamic searchable table.
   - `[Original OCR Text]`: Raw text viewer with line numbers, search, and copy.
   - `[Source Preview]`: In-browser document preview frame.

6. **Multi-Format Export Engine**:
   - **Excel (.xlsx)**: Formatted workbook with two styled sheets (Procurement Summary + Extracted Materials).
   - **PDF (.pdf)**: ReportLab formatted enterprise document analysis report with official header.
   - **JSON (.json)**: Full structured schema matching Section 10.
   - **Copy Results**: One-click clipboard export.

7. **Operational Modules**:
   - **Dashboard**: Real-time KPIs, Module Status indicators (OCR Engine, AI Analysis, Database, Document Processing), live Activity Feed, and recent documents.
   - **Material Tracking**: Filterable procurement table with status lifecycle management (`Pending`, `Under Review`, `Approved`, `Procurement`, `Received`, `Needs Verification`).
   - **Reports**: Spend and category distributions, department indents, and OCR confidence breakdown.
   - **User Profile**: Salem Steel Plant operator credentials, department details, and password management.

---

## 🚀 Quick Start Instructions

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js v18+ (tested on Node v24)

### Running the Application

1. **Single-command launcher (Windows)**:
   Double-click `run.bat` or run in PowerShell:
   ```powershell
   .\run.ps1
   ```

2. **Manual Startup**:
   ```bash
   cd backend
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

3. Open your browser at:
   `http://127.0.0.1:8000`

---

## 🧪 Testing with Reference Documents
- Click **"Test with Reference Documents (Instant Demo)"** on the Home page to immediately test the full pipeline with the Salem Steel Plant SMS Scrap Indent proposal note or PO files.
- Or click **"Select File"** / Drag & Drop any PDF up to 30 MB.

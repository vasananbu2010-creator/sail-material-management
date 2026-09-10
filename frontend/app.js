// SAIL Salem Steel Plant - Material Management Module Frontend Controller

let currentDoc = null;
let currentOriginalFilename = "document.pdf";
let currentSearch = "";
let currentTypeFilter = "All";

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initUpload();
  initFormActions();
  initHistoryControls();
  initModals();

  fetchStats();
  fetchRecords();
});

// Tab Switching
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      if (target === 'extract') {
        document.getElementById('tabExtract').classList.add('active');
      } else if (target === 'records') {
        document.getElementById('tabRecords').classList.add('active');
        fetchStats();
        fetchRecords();
      }
    });
  });
}

// Upload & Drag-and-Drop Handler
function initUpload() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');

  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      processFileUpload(e.target.files[0]);
    }
  });

  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileUpload(e.dataTransfer.files[0]);
    }
  });
}

// Upload File to Backend
async function processFileUpload(file) {
  currentOriginalFilename = file.name;
  showProgress("Ingesting document and running OCR layout engine...", 25);

  const formData = new FormData();
  formData.append('file', file);

  try {
    showProgress("Detecting tables, text blocks and keyword anchors...", 65);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Document processing failed');
    }

    showProgress("Standardizing schema and calculating confidence scores...", 90);
    const data = await response.json();

    setTimeout(() => {
      hideProgress();
      currentDoc = data;
      populateStandardizedForm(data);
      showToast(`Successfully extracted ${file.name} (Confidence: ${data.confidence_score}%)`, 'success');
    }, 400);

  } catch (error) {
    hideProgress();
    showToast(`Error processing file: ${error.message}`, 'error');
    console.error(error);
  }
}

// Preset Sample Loader
async function loadSample(filename) {
  currentOriginalFilename = filename;
  showProgress(`Loading document: ${filename}...`, 30);

  try {
    showProgress("Running PyMuPDF & Layout normalization...", 70);
    const response = await fetch(`/api/samples/process/${filename}`, {
      method: 'POST'
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Sample load failed');
    }

    showProgress("Mapping extracted fields to standardized schema...", 95);
    const data = await response.json();

    setTimeout(() => {
      hideProgress();
      currentDoc = data;
      populateStandardizedForm(data);
      showToast(`Document ${filename} parsed with ${data.confidence_score}% confidence!`, 'success');
    }, 400);

  } catch (error) {
    hideProgress();
    showToast(`Failed to load document: ${error.message}`, 'error');
    console.error(error);
  }
}

function showProgress(status, pct) {
  const box = document.getElementById('progressBox');
  const statusEl = document.getElementById('progressStatus');
  const pctEl = document.getElementById('progressPercent');
  const fillEl = document.getElementById('progressFill');

  box.style.display = 'block';
  statusEl.textContent = status;
  pctEl.textContent = `${pct}%`;
  fillEl.style.width = `${pct}%`;
}

function hideProgress() {
  const box = document.getElementById('progressBox');
  box.style.display = 'none';
}

function populateStandardizedForm(doc) {
  document.getElementById('field_document_id').value = doc.document_id || '';
  document.getElementById('field_document_type').value = doc.document_type || 'Enquiry Proposal Note (Indent)';
  document.getElementById('field_plant').value = doc.plant || 'Salem Steel Plant';
  document.getElementById('field_extracted_on').value = doc.extracted_on ? doc.extracted_on.replace('T', ' ').substring(0, 19) : new Date().toLocaleString();
  
  document.getElementById('field_supplier_name').value = doc.supplier_name || '';
  document.getElementById('field_po_number').value = doc.po_number || '';
  document.getElementById('field_invoice_number').value = doc.invoice_number || '';
  document.getElementById('field_date_of_document').value = doc.date_of_document || '';
  
  document.getElementById('field_material_name').value = doc.material_name || '';
  document.getElementById('field_material_grade_spec').value = doc.material_grade_spec || '';
  document.getElementById('field_quantity').value = doc.quantity || '';
  document.getElementById('field_unit').value = (doc.unit || 'MT').toUpperCase();
  document.getElementById('field_heat_batch_number').value = doc.heat_batch_number || '';
  document.getElementById('field_remarks').value = doc.remarks || '';

  const overallBadge = document.getElementById('overallConfBadge');
  const conf = doc.confidence_score || 0;
  overallBadge.textContent = `${conf.toFixed(1)}%`;
  overallBadge.className = 'conf-badge ' + getConfClass(conf);

  const fc = doc.field_confidence || {};
  setFieldConf('document_id', fc.document_id);
  setFieldConf('document_type', fc.document_type);
  setFieldConf('plant', fc.plant);
  setFieldConf('supplier_name', fc.supplier_name);
  setFieldConf('po_number', fc.po_number);
  setFieldConf('invoice_number', fc.invoice_number);
  setFieldConf('date_of_document', fc.date_of_document);
  setFieldConf('material_name', fc.material_name);
  setFieldConf('material_grade_spec', fc.material_grade_spec);
  setFieldConf('quantity', fc.quantity);
  setFieldConf('unit', fc.unit);
  setFieldConf('heat_batch_number', fc.heat_batch_number);
  setFieldConf('remarks', fc.remarks);
}

function setFieldConf(fieldKey, score) {
  const badge = document.getElementById(`conf_${fieldKey}`);
  if (!badge) return;
  const s = score !== undefined ? score : 85;
  badge.textContent = `${Math.round(s)}%`;
  badge.className = 'conf-badge ' + getConfClass(s);
}

function getConfClass(score) {
  if (score >= 85) return 'conf-high';
  if (score >= 60) return 'conf-med';
  return 'conf-low';
}

function initFormActions() {
  const saveBtn = document.getElementById('saveToDbBtn');
  saveBtn.addEventListener('click', async () => {
    if (!currentDoc) {
      showToast('No document extracted yet. Please upload or load a sample document.', 'error');
      return;
    }

    const updatedData = {
      ...currentDoc,
      document_id: document.getElementById('field_document_id').value,
      document_type: document.getElementById('field_document_type').value,
      plant: document.getElementById('field_plant').value,
      supplier_name: document.getElementById('field_supplier_name').value,
      po_number: document.getElementById('field_po_number').value,
      invoice_number: document.getElementById('field_invoice_number').value,
      date_of_document: document.getElementById('field_date_of_document').value,
      material_name: document.getElementById('field_material_name').value,
      material_grade_spec: document.getElementById('field_material_grade_spec').value,
      quantity: document.getElementById('field_quantity').value,
      unit: document.getElementById('field_unit').value,
      heat_batch_number: document.getElementById('field_heat_batch_number').value,
      remarks: document.getElementById('field_remarks').value,
    };

    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_filename: currentOriginalFilename,
          data: updatedData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save record to database');
      }

      const saved = await response.json();
      showToast(`Record ${saved.document_id} saved to database!`, 'success');
      fetchStats();
      fetchRecords();

    } catch (error) {
      showToast(`Save failed: ${error.message}`, 'error');
      console.error(error);
    }
  });

  const inspectBtn = document.getElementById('inspectRawBtn');
  inspectBtn.addEventListener('click', () => {
    if (!currentDoc) {
      showToast('Extract a document first to inspect raw text and JSON schema.', 'error');
      return;
    }
    document.getElementById('rawJsonDisplay').textContent = JSON.stringify(currentDoc, null, 2);
    document.getElementById('rawTextDisplay').textContent = currentDoc.raw_ocr_text || '(No raw text available)';
    document.getElementById('rawModal').classList.add('active');
  });

  // Download Word (.docx) directly
  const downloadDocxBtn = document.getElementById('downloadDocxBtn');
  if (downloadDocxBtn) {
    downloadDocxBtn.addEventListener('click', async () => {
      if (!currentDoc) {
        showToast('Extract a document first before exporting to Word.', 'error');
        return;
      }
      
      // Auto-save temporary record or download directly
      const updatedData = {
        ...currentDoc,
        document_id: document.getElementById('field_document_id').value,
        document_type: document.getElementById('field_document_type').value,
        plant: document.getElementById('field_plant').value,
        supplier_name: document.getElementById('field_supplier_name').value,
        po_number: document.getElementById('field_po_number').value,
        invoice_number: document.getElementById('field_invoice_number').value,
        date_of_document: document.getElementById('field_date_of_document').value,
        material_name: document.getElementById('field_material_name').value,
        material_grade_spec: document.getElementById('field_material_grade_spec').value,
        quantity: document.getElementById('field_quantity').value,
        unit: document.getElementById('field_unit').value,
        heat_batch_number: document.getElementById('field_heat_batch_number').value,
        remarks: document.getElementById('field_remarks').value,
      };

      try {
        const response = await fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            original_filename: currentOriginalFilename,
            data: updatedData
          })
        });
        const saved = await response.json();
        window.open(`/api/export/docx/${saved.id}`, '_blank');
        showToast(`Generating Word document for ${saved.document_id}...`, 'success');
        fetchStats();
        fetchRecords();
      } catch (e) {
        showToast(`Failed to generate Word doc: ${e.message}`, 'error');
      }
    });
  }
}

function initHistoryControls() {
  const searchInput = document.getElementById('searchRecordsInput');
  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentSearch = e.target.value;
      fetchRecords();
    }, 300);
  });

  const chips = document.querySelectorAll('.chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentTypeFilter = chip.dataset.type;
      fetchRecords();
    });
  });
}

async function fetchRecords() {
  try {
    const params = new URLSearchParams();
    if (currentSearch) params.append('search', currentSearch);
    if (currentTypeFilter && currentTypeFilter !== 'All') params.append('doc_type', currentTypeFilter);

    const response = await fetch(`/api/records?${params.toString()}`);
    const data = await response.json();

    const tbody = document.getElementById('recordsTableBody');
    document.getElementById('totalRecordsBadge').textContent = data.total;

    if (!data.records || data.records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="empty-state"><div class="empty-icon">🗂️</div><p>No material records found in database.</p></td></tr>`;
      return;
    }

    tbody.innerHTML = data.records.map(r => {
      const typeClass = getTypeBadgeClass(r.document_type);
      const confClass = getConfClass(r.confidence_score);
      return `
        <tr>
          <td><strong>#${r.id}</strong></td>
          <td><span class="type-badge ${typeClass}">${r.document_type}</span></td>
          <td><strong>${escapeHtml(r.document_id)}</strong></td>
          <td>${escapeHtml(r.supplier_name || '-')}</td>
          <td>
            <div><strong>${escapeHtml(r.material_name || '-')}</strong></div>
            <div style="font-size:0.75rem; color:#64748b;">${escapeHtml(r.material_grade_spec || '')}</div>
          </td>
          <td><strong>${escapeHtml(r.quantity)} ${escapeHtml(r.unit)}</strong></td>
          <td><code>${escapeHtml(r.heat_batch_number || r.invoice_number || '-')}</code></td>
          <td>${escapeHtml(r.date_of_document || '-')}</td>
          <td><span class="conf-badge ${confClass}">${r.confidence_score.toFixed(1)}%</span></td>
          <td>
            <div class="actions-cell">
              <a href="/api/export/docx/${r.id}" class="btn-sm" title="Download Word (.docx)" target="_blank" style="background:#e0f2fe; color:#0369a1; font-weight:bold;">📥 Word</a>
              <a href="/api/export/pdf/${r.id}" class="btn-sm" title="Download PDF" target="_blank">📄 PDF</a>
              <button class="btn-sm" title="Edit Record" onclick="openEditModal(${r.id})">✏️</button>
              <button class="btn-sm" title="Delete" style="color:#dc2626;" onclick="deleteRecordItem(${r.id})">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error("Error fetching records:", error);
  }
}

async function fetchStats() {
  try {
    const response = await fetch('/api/stats');
    const stats = await response.json();

    document.getElementById('statTotalDocs').textContent = stats.total_records || 0;
    document.getElementById('statAvgAcc').textContent = `${(stats.avg_confidence || 0).toFixed(1)}%`;
    
    const mtcCount = stats.type_counts ? (stats.type_counts['Material Test Certificate (MTC)'] || stats.type_counts['Enquiry Proposal Note (Indent)'] || 0) : 0;
    document.getElementById('statMtcCount').textContent = mtcCount;
    document.getElementById('statSuppliersCount').textContent = stats.top_suppliers ? stats.top_suppliers.length : 0;

  } catch (error) {
    console.error("Error fetching stats:", error);
  }
}

function getTypeBadgeClass(docType) {
  if (!docType) return 'type-other';
  if (docType.includes('Indent') || docType.includes('Proposal')) return 'type-po';
  if (docType.includes('Certificate') || docType.includes('MTC')) return 'type-mtc';
  if (docType.includes('Purchase Order') || docType.includes('PO')) return 'type-po';
  if (docType.includes('Goods Receipt') || docType.includes('GRN')) return 'type-grn';
  if (docType.includes('Invoice')) return 'type-inv';
  return 'type-other';
}

function initModals() {
  document.getElementById('rawModalClose').addEventListener('click', () => {
    document.getElementById('rawModal').classList.remove('active');
  });

  document.getElementById('editModalClose').addEventListener('click', () => {
    document.getElementById('editModal').classList.remove('active');
  });

  document.getElementById('editModalCancel').addEventListener('click', () => {
    document.getElementById('editModal').classList.remove('active');
  });

  document.getElementById('editRecordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit_id').value;
    const updates = {
      supplier_name: document.getElementById('edit_supplier').value,
      material_name: document.getElementById('edit_material').value,
      material_grade_spec: document.getElementById('edit_grade').value,
      quantity: document.getElementById('edit_quantity').value,
      unit: document.getElementById('edit_unit').value,
      heat_batch_number: document.getElementById('edit_heat').value,
      po_number: document.getElementById('edit_po').value,
      invoice_number: document.getElementById('edit_inv').value,
      remarks: document.getElementById('edit_remarks').value,
    };

    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update record');

      document.getElementById('editModal').classList.remove('active');
      showToast(`Record #${id} updated successfully!`, 'success');
      fetchRecords();
    } catch (error) {
      showToast(`Update error: ${error.message}`, 'error');
    }
  });
}

async function openEditModal(recordId) {
  try {
    const response = await fetch(`/api/records/${recordId}`);
    if (!response.ok) throw new Error('Could not fetch record details');
    const record = await response.json();

    document.getElementById('edit_id').value = record.id;
    document.getElementById('edit_doc_id').value = record.document_id;
    document.getElementById('edit_supplier').value = record.supplier_name || '';
    document.getElementById('edit_material').value = record.material_name || '';
    document.getElementById('edit_grade').value = record.material_grade_spec || '';
    document.getElementById('edit_quantity').value = record.quantity || '';
    document.getElementById('edit_unit').value = record.unit || 'MT';
    document.getElementById('edit_heat').value = record.heat_batch_number || '';
    document.getElementById('edit_po').value = record.po_number || '';
    document.getElementById('edit_inv').value = record.invoice_number || '';
    document.getElementById('edit_remarks').value = record.remarks || '';

    document.getElementById('editModal').classList.add('active');
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  }
}

async function deleteRecordItem(recordId) {
  if (!confirm(`Are you sure you want to delete material record #${recordId}?`)) return;

  try {
    const response = await fetch(`/api/records/${recordId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete record');
    showToast(`Record #${recordId} deleted.`, 'success');
    fetchStats();
    fetchRecords();
  } catch (error) {
    showToast(`Delete failed: ${error.message}`, 'error');
  }
}

function showToast(msg, type = 'success') {
  const box = document.getElementById('toastBox');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  box.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
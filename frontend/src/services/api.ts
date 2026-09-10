import {
  DocumentDetail,
  DashboardData,
  ReportsData,
  MaterialItem
} from '../types';

const API_BASE = (((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/+$/, '') || '') + '/api';

export const api = {
  async uploadDocument(file: File): Promise<{ document_id: string; filename: string; file_size: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Failed to upload document');
    }
    return res.json();
  },

  async processDocument(docId: string): Promise<{ document_id: string; status: string; structured_data: any }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 85000);

    try {
      const res = await fetch(`${API_BASE}/documents/${docId}/process`, {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        let detail = `Server error (${res.status}): Processing failed`;
        try {
          const err = await res.json();
          if (err.detail) detail = err.detail;
        } catch {
          if (res.status === 504) {
            detail = 'Cloud proxy timeout (504): Multi-page document is being processed in the background. Please click "Retry Processing" to retrieve the results.';
          }
        }
        throw new Error(detail);
      }
      return res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(
          'Processing timeout: The multi-page document is taking longer to scan on the server. Please click "Retry Processing" to fetch results.'
        );
      }
      throw err;
    }
  },

  async getDocument(docId: string): Promise<DocumentDetail> {
    const res = await fetch(`${API_BASE}/documents/${docId}`);
    if (!res.ok) throw new Error('Failed to fetch document details');
    return res.json();
  },

  async getDocumentOcr(docId: string): Promise<{ raw_ocr_text: string; page_count: number }> {
    const res = await fetch(`${API_BASE}/documents/${docId}/ocr`);
    if (!res.ok) throw new Error('Failed to fetch OCR text');
    return res.json();
  },

  async getMaterials(params?: {
    search?: string;
    code?: string;
    category?: string;
    vendor?: string;
    grade?: string;
    status?: string;
    document_id?: string;
  }): Promise<{ count: number; materials: MaterialItem[] }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v && v !== 'all') searchParams.append(k, v);
      });
    }
    const res = await fetch(`${API_BASE}/materials?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch materials');
    return res.json();
  },

  async updateMaterial(matId: string, payload: Partial<MaterialItem>): Promise<any> {
    const res = await fetch(`${API_BASE}/materials/${matId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update material');
    return res.json();
  },

  async getDashboard(): Promise<DashboardData> {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
  },

  async getReports(): Promise<ReportsData> {
    const res = await fetch(`${API_BASE}/reports`);
    if (!res.ok) throw new Error('Failed to fetch reports data');
    return res.json();
  },

  async loadDemoDocument(demoId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/demo/${demoId}`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Demo load failed' }));
      throw new Error(err.detail || 'Failed to load demo document');
    }
    return res.json();
  },

  getExcelExportUrl(docId: string): string {
    return `${API_BASE}/documents/${docId}/export/excel`;
  },

  getPdfExportUrl(docId: string): string {
    return `${API_BASE}/documents/${docId}/export/pdf`;
  },

  getTemplatePdfUrl(docId: string): string {
    return `${API_BASE}/documents/${docId}/template-pdf`;
  },

  getTemplateDocxUrl(docId: string): string {
    return `${API_BASE}/documents/${docId}/template-docx`;
  },

  getDocxExportUrl(docId: string): string {
    return `${API_BASE}/documents/${docId}/export/docx`;
  },

  getJsonExportUrl(docId: string): string {
    return `${API_BASE}/documents/${docId}/export/json`;
  },

  getPreviewUrl(docId: string): string {
    return `${API_BASE}/documents/${docId}/preview`;
  },
};

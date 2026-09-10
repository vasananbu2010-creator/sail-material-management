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

  async processDocument(
    docId: string,
    onProgress?: (progress: { current_step: number; step_label: string; step_detail: string; progress_percent: number }) => void
  ): Promise<{ document_id: string; status: string; structured_data: any }> {
    // 1. Initiate processing on backend
    const initRes = await fetch(`${API_BASE}/documents/${docId}/process`, {
      method: 'POST',
    });
    if (!initRes.ok) {
      const err = await initRes.json().catch(() => ({ detail: 'Failed to start processing' }));
      throw new Error(err.detail || 'Failed to start document processing');
    }
    const initData = await initRes.json();
    if (initData.status === 'COMPLETED' && initData.structured_data) {
      return initData;
    }

    // 2. Poll /status every 900ms (eliminates Render 100s proxy timeout)
    const pollInterval = 900;
    const maxWaitTimeMs = 600000; // 10 minutes max for massive multi-page scanned documents
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTimeMs) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      try {
        const statusRes = await fetch(`${API_BASE}/documents/${docId}/status`);
        if (!statusRes.ok) continue;

        const statusData = await statusRes.json();
        if (onProgress && statusData.current_step) {
          onProgress({
            current_step: statusData.current_step,
            step_label: statusData.step_label || 'Processing...',
            step_detail: statusData.step_detail || '',
            progress_percent: statusData.progress_percent || Math.round((statusData.current_step / 7) * 100),
          });
        }

        if (statusData.status === 'COMPLETED') {
          return {
            document_id: docId,
            status: 'COMPLETED',
            structured_data: statusData.structured_data,
          };
        }

        if (statusData.status === 'FAILED') {
          throw new Error(statusData.error || 'Server error: Processing failed for this document.');
        }
      } catch (pollErr: any) {
        if (pollErr.message && pollErr.message.includes('Server error: Processing failed')) {
          throw pollErr;
        }
      }
    }

    throw new Error(
      'Processing timeout: The multi-page document is taking longer to scan on the server. Please click "Retry Processing" to continue.'
    );
  },

  async getDocumentStatus(docId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${docId}/status`);
    if (!res.ok) throw new Error('Failed to fetch processing status');
    return res.json();
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

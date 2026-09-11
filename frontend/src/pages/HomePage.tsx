import React, { useState } from 'react';
import { UploadCard } from '../components/UploadCard';
import { ProcessingProgress } from '../components/ProcessingProgress';
import { StructuredOutputView } from '../components/StructuredOutputView';
import { MaterialTableView } from '../components/MaterialTableView';
import { OcrTextViewer } from '../components/OcrTextViewer';
import { DocumentPreview } from '../components/DocumentPreview';
import { ExportButtons } from '../components/ExportButtons';
import { RecentActivityPanel } from '../components/RecentActivityPanel';
import { ModuleStatusCard } from '../components/ModuleStatusCard';
import { ProcurementTemplateView } from '../components/ProcurementTemplateView';
import { api } from '../services/api';
import { DocumentDetail, DashboardData } from '../types';
import {
  FileCheck2,
  Table as TableIcon,
  FileCode2,
  Eye,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  FileSpreadsheet,
  FileSignature,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface HomePageProps {
  dashboardData: DashboardData | null;
  onRefreshDashboard: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ dashboardData, onRefreshDashboard }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepDetail, setStepDetail] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [processingFileName, setProcessingFileName] = useState('');
  const [documents, setDocuments] = useState<DocumentDetail[]>([]);
  const [activeDocIndex, setActiveDocIndex] = useState<number>(0);
  const [activeDocument, setActiveDocument] = useState<DocumentDetail | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [batchOcrTexts, setBatchOcrTexts] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'template' | 'structured' | 'table' | 'ocr' | 'preview'>('template');
  const [error, setError] = useState<string | null>(null);
  const [lastDocId, setLastDocId] = useState<string | null>(null);

  const simulateProcessingSteps = async (docId: string, filename: string) => {
    setIsProcessing(true);
    setProcessingFileName(filename);
    setLastDocId(docId);
    setError(null);
    setCurrentStep(1);
    setStepDetail('Validating file integrity & size limit');
    setProgressPercent(10);

    try {
      // Connect directly to live backend progress polling
      await api.processDocument(docId, (info) => {
        setCurrentStep(info.current_step);
        setStepDetail(info.step_detail);
        setProgressPercent(info.progress_percent);
      });

      setCurrentStep(7);
      setProgressPercent(100);
      setStepDetail('Analysis ready for review');

      // Fetch complete details & OCR text
      const docDetails = await api.getDocument(docId);
      const ocrRes = await api.getDocumentOcr(docId);

      setDocuments([docDetails]);
      setActiveDocIndex(0);
      setActiveDocument(docDetails);
      setOcrText(ocrRes.raw_ocr_text);
      setBatchOcrTexts({ [docDetails.id]: ocrRes.raw_ocr_text });
      setError(null);
      onRefreshDashboard();
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Failed to process document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelected = async (file: File) => {
    setError(null);
    try {
      setIsProcessing(true);
      setProcessingFileName(file.name);
      setCurrentStep(1);

      // Upload file to server
      const uploadRes = await api.uploadDocument(file);

      // Process through pipeline
      await simulateProcessingSteps(uploadRes.document_id, file.name);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
      setIsProcessing(false);
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 1) {
      await handleFileSelected(files[0]);
      return;
    }
    setError(null);
    try {
      setIsProcessing(true);
      setProcessingFileName(`Uploading ${files.length} documents...`);
      setCurrentStep(1);
      setProgressPercent(10);
      setStepDetail('Uploading batch to server');

      const batchRes = await api.uploadDocuments(files);
      const processedDocs: DocumentDetail[] = [];
      const ocrMap: Record<string, string> = {};

      for (let i = 0; i < batchRes.documents.length; i++) {
        const item = batchRes.documents[i];
        setProcessingFileName(`[Doc ${i + 1}/${batchRes.documents.length}] ${item.filename}`);
        setCurrentStep(2);
        setStepDetail(`Processing document ${i + 1} of ${batchRes.documents.length}`);
        setProgressPercent(Math.round((i / batchRes.documents.length) * 100) + 5);

        try {
          await api.processDocument(item.document_id, (info) => {
            setCurrentStep(info.current_step);
            setStepDetail(`[Doc ${i + 1}/${batchRes.documents.length}] ${info.step_detail}`);
            const basePct = Math.round((i / batchRes.documents.length) * 100);
            const docPct = Math.round((info.progress_percent / batchRes.documents.length));
            setProgressPercent(Math.min(99, basePct + docPct));
          });

          const docDetails = await api.getDocument(item.document_id);
          const ocrRes = await api.getDocumentOcr(item.document_id);
          processedDocs.push(docDetails);
          ocrMap[docDetails.id] = ocrRes.raw_ocr_text;
        } catch (itemErr: any) {
          console.error(`Failed to process ${item.filename}:`, itemErr);
        }
      }

      if (processedDocs.length === 0) {
        throw new Error('All documents in the batch failed to process.');
      }

      setDocuments(processedDocs);
      setActiveDocIndex(0);
      setActiveDocument(processedDocs[0]);
      setOcrText(ocrMap[processedDocs[0].id] || '');
      setBatchOcrTexts(ocrMap);
      setCurrentStep(7);
      setProgressPercent(100);
      setStepDetail('Batch processing complete');
      onRefreshDashboard();
    } catch (err: any) {
      setError(err.message || 'Batch processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadDemo = async (demoId: string) => {
    setError(null);
    try {
      setIsProcessing(true);
      const demoName = demoId === 'salem_proposal'
        ? 'procurement_template_format_updated (2) (1).pdf'
        : 'Purchase_Order_SS316L.pdf';
      setProcessingFileName(demoName);
      setCurrentStep(1);

      // Load and process demo via backend
      const res = await api.loadDemoDocument(demoId);
      await simulateProcessingSteps(res.document_id, demoName);
    } catch (err: any) {
      setError(err.message || 'Failed to load demo document.');
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setDocuments([]);
    setActiveDocIndex(0);
    setActiveDocument(null);
    setOcrText('');
    setBatchOcrTexts({});
    setError(null);
    setLastDocId(null);
    setCurrentStep(1);
    setStepDetail('');
    setProgressPercent(0);
    setActiveTab('template');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Error / Retry Alert Banner (Section 28) */}
      {error && !isProcessing && (
        <div className="glass-card rounded-2xl p-6 border border-red-500/50 bg-red-950/30 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-900/40 border border-red-500/40 text-red-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="text-base font-bold text-red-200">
                Document Processing Notice
              </h4>
              <p className="text-sm text-[#B8C4D0] leading-relaxed">
                {error}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-red-900/40">
            {lastDocId && (
              <button
                onClick={() => simulateProcessingSteps(lastDocId, processingFileName)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#7CA7DB] text-[#0E1720] hover:bg-[#A9C9EE] transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Processing</span>
              </button>
            )}
            <button
              onClick={() => {
                setError(null);
                setLastDocId(null);
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#16232D] text-[#B8C4D0] hover:text-[#F0F4F8] border border-[#435568] transition-all cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* If No Document is Active: Show Hero & Upload Area */}
      {!activeDocument && !isProcessing && (
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16232D] border border-[#435568] text-xs font-semibold text-[#A9C9EE] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#A9C9EE]" />
              Enterprise Document Extraction & OCR Engine
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F0F4F8] tracking-tight">
              Salem Steel Plant Material Management
            </h1>
            <p className="text-sm sm:text-base text-[#B8C4D0] max-w-2xl mx-auto">
              Automated multi-page OCR, procurement analysis, and standardized schema mapping for tender notes, purchase orders, indents, and material inspection certificates.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Centered Large Upload Card */}
            <div className="lg:col-span-8">
              <UploadCard
                onFileSelected={handleFileSelected}
                onFilesSelected={handleFilesSelected}
                onLoadDemo={handleLoadDemo}
                isProcessing={isProcessing}
              />
            </div>

            {/* Right Side Widgets: Status & Recent Activity (Sections 11 & 15) */}
            <div className="lg:col-span-4 space-y-6">
              {dashboardData?.module_status && (
                <ModuleStatusCard status={dashboardData.module_status} />
              )}

              {dashboardData?.recent_activities && (
                <RecentActivityPanel activities={dashboardData.recent_activities} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processing Animation Screen (Section 23) */}
      {isProcessing && (
        <div className="py-12">
          <ProcessingProgress
            currentStep={currentStep}
            filename={processingFileName}
            stepDetail={stepDetail}
            progressPercent={progressPercent}
          />
        </div>
      )}

      {/* Results Page (Sections 5, 7, 8, 9, 10, 28) */}
      {activeDocument && !isProcessing && (
        <div className="space-y-6 animate-fadeIn">
          {/* Multi-Document Selector Bar for Batches */}
          {documents.length > 1 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#16232D] border border-[#435568] p-3 rounded-xl gap-3 shadow-lg">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <span className="text-xs font-bold text-[#A9C9EE] px-1 whitespace-nowrap">
                  Batch ({documents.length} Docs):
                </span>
                {documents.map((doc, idx) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setActiveDocIndex(idx);
                      setActiveDocument(doc);
                      setOcrText(batchOcrTexts[doc.id] || '');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      activeDocIndex === idx
                        ? 'bg-[#24313C] text-[#A9C9EE] border border-[#A9C9EE]/60 shadow-sm'
                        : 'text-[#B8C4D0] hover:text-[#F0F4F8] hover:bg-[#24313C]/40 border border-transparent'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[150px]">{idx + 1}. {doc.original_name}</span>
                    <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-700/60 px-1.5 py-0.2 rounded-full">
                      {doc.overall_confidence || 'High'}
                    </span>
                  </button>
                ))}
              </div>

              <a
                href={api.getBatchExportZipUrl(documents.map(d => d.id))}
                download="SAIL_Batch_Export.zip"
                className="btn-accent px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0 whitespace-nowrap ml-auto cursor-pointer"
                title="Download consolidated ZIP archive of all documents"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Export Batch (ZIP)</span>
              </a>
            </div>
          )}

          {/* Analysis Complete Banner */}
          <div className="glass-card rounded-2xl p-6 border border-[#435568] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Document Analysis Complete
                </span>
                <span className="text-xs text-[#B8C4D0] hidden sm:inline">•</span>
                <span className="text-xs text-[#A9C9EE] font-mono">
                  {activeDocument.overall_confidence} Overall Confidence
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#F0F4F8] truncate max-w-xl">
                File: {activeDocument.original_name}
              </h2>
              <p className="text-xs text-[#B8C4D0]">
                Processing: <span className="text-emerald-400 font-semibold">OCR Completed</span> •{' '}
                <span className="text-[#A9C9EE] font-semibold">AI Analysis Completed</span> •{' '}
                {activeDocument.page_count} Pages Processed • {activeDocument.materials_count} Materials Extracted
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              <ExportButtons
                documentId={activeDocument.id}
                structuredData={activeDocument.structured_data}
              />

              <button
                onClick={handleReset}
                className="btn-steel px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-[#B8C4D0] hover:text-[#F0F4F8]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Upload Another</span>
              </button>
            </div>
          </div>

          {/* Results Navigation Tabs */}
          <div className="flex items-center border-b border-[#435568] space-x-2 sm:space-x-4 overflow-x-auto select-none">
            <button
              onClick={() => setActiveTab('template')}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'template'
                  ? 'border-[#A9C9EE] text-[#A9C9EE] bg-[#16232D]'
                  : 'border-transparent text-[#B8C4D0] hover:text-[#F0F4F8] hover:bg-[#16232D]/40'
              }`}
            >
              <FileSignature className="w-4 h-4 text-emerald-400" />
              <span>Procurement Template Format</span>
            </button>

            <button
              onClick={() => setActiveTab('structured')}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'structured'
                  ? 'border-[#A9C9EE] text-[#A9C9EE] bg-[#16232D]'
                  : 'border-transparent text-[#B8C4D0] hover:text-[#F0F4F8] hover:bg-[#16232D]/40'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Structured Data Cards</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'table'
                  ? 'border-[#A9C9EE] text-[#A9C9EE] bg-[#16232D]'
                  : 'border-transparent text-[#B8C4D0] hover:text-[#F0F4F8] hover:bg-[#16232D]/40'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Material Table ({activeDocument.materials_count})</span>
            </button>

            <button
              onClick={() => setActiveTab('ocr')}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ocr'
                  ? 'border-[#A9C9EE] text-[#A9C9EE] bg-[#16232D]'
                  : 'border-transparent text-[#B8C4D0] hover:text-[#F0F4F8] hover:bg-[#16232D]/40'
              }`}
            >
              <FileCode2 className="w-4 h-4" />
              <span>Original OCR Text</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'preview'
                  ? 'border-[#A9C9EE] text-[#A9C9EE] bg-[#16232D]'
                  : 'border-transparent text-[#B8C4D0] hover:text-[#F0F4F8] hover:bg-[#16232D]/40'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Source Preview</span>
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="pt-2">
            {activeTab === 'template' && (
              <ProcurementTemplateView
                documentId={activeDocument.id}
                data={activeDocument.structured_data}
              />
            )}

            {activeTab === 'structured' && (
              <StructuredOutputView data={activeDocument.structured_data} />
            )}

            {activeTab === 'table' && (
              <MaterialTableView materials={activeDocument.structured_data.materials || []} />
            )}

            {activeTab === 'ocr' && (
              <OcrTextViewer
                rawText={ocrText}
                pageCount={activeDocument.page_count}
              />
            )}

            {activeTab === 'preview' && (
              <DocumentPreview
                documentId={activeDocument.id}
                filename={activeDocument.original_name}
                fileType={activeDocument.file_type}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

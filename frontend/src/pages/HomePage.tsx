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
  AlertTriangle
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
  const [activeDocument, setActiveDocument] = useState<DocumentDetail | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
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

      setActiveDocument(docDetails);
      setOcrText(ocrRes.raw_ocr_text);
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
    setActiveDocument(null);
    setOcrText('');
    setError(null);
    setLastDocId(null);
    setCurrentStep(1);
    setStepDetail('');
    setProgressPercent(0);
    setActiveTab('structured');
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

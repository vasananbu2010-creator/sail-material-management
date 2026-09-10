import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, FileText, Cpu, Layers } from 'lucide-react';

interface ProcessingProgressProps {
  currentStep: number; // 1 to 7
  filename: string;
  stepDetail?: string;
  progressPercent?: number;
}

const STEPS = [
  { id: 1, label: 'Uploading Document...', detail: 'Validating file integrity & size limit' },
  { id: 2, label: 'Extracting PDF Text...', detail: 'Reading vector text, font layouts & tables' },
  { id: 3, label: 'OCR Processing...', detail: 'Scanned page rasterization & character recognition' },
  { id: 4, label: 'Analyzing Document...', detail: 'Detecting procurement proposal semantics & context' },
  { id: 5, label: 'Extracting Materials...', detail: 'Parsing BOM items, grades, quantities & vendors' },
  { id: 6, label: 'Creating Structured Output...', detail: 'Enforcing fixed 9-section enterprise schema' },
  { id: 7, label: 'Completed', detail: 'Analysis ready for review and multi-format export' },
];

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  currentStep,
  filename,
  stepDetail,
  progressPercent
}) => {
  const displayPercent = Math.min(100, Math.max(0, progressPercent ?? Math.round((currentStep / 7) * 100)));

  return (
    <div className="w-full max-w-2xl mx-auto glass-card rounded-2xl p-8 border border-[#435568] shadow-2xl relative overflow-hidden">
      {/* Background glow animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#A9C9EE]/5 to-transparent animate-pulse pointer-events-none"></div>

      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-[#16232D] border border-[#435568] text-[#A9C9EE] mb-3 shadow-inner">
          <Cpu className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <h3 className="text-xl font-bold text-[#F0F4F8] tracking-wide">
          Processing Document Pipeline
        </h3>
        <p className="text-xs text-[#B8C4D0] mt-1 truncate max-w-md mx-auto">
          {filename}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs font-semibold text-[#B8C4D0] mb-2">
          <span>Overall Progress</span>
          <span className="text-[#A9C9EE]">{displayPercent}%</span>
        </div>
        <div className="w-full bg-[#16232D] h-2.5 rounded-full overflow-hidden border border-[#435568]/60">
          <div
            className="bg-gradient-to-r from-[#7CA7DB] to-[#A9C9EE] h-full rounded-full transition-all duration-500 ease-out shadow-lg"
            style={{ width: `${displayPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Step by Step List */}
      <div className="space-y-3.5">
        {STEPS.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isPending = currentStep < step.id;

          return (
            <div
              key={step.id}
              className={`flex items-start space-x-3.5 p-2.5 rounded-lg transition-colors ${
                isCurrent ? 'bg-[#16232D] border border-[#A9C9EE]/50 shadow-sm' : ''
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-[#A9C9EE] animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#435568] flex items-center justify-center text-[10px] text-[#B8C4D0]">
                    {step.id}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm font-medium ${
                      isDone
                        ? 'text-[#F0F4F8]'
                        : isCurrent
                        ? 'text-[#A9C9EE] font-semibold'
                        : 'text-[#B8C4D0]/60'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isDone && <span className="text-xs text-emerald-400 font-bold">✓</span>}
                  {isCurrent && (
                    <span className="text-xs text-[#A9C9EE] animate-pulse font-mono">●</span>
                  )}
                </div>
                <p className="text-[11px] text-[#B8C4D0]/70 truncate mt-0.5">
                  {isCurrent && stepDetail ? stepDetail : step.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

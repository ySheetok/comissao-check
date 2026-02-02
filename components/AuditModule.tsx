
import React, { useState } from 'react';
import { UploadStep } from './UploadStep';
import { PreviewStep } from './PreviewStep';
import { UploadedFile, MatchResult, ProcessingStats, MasterRow } from '../types';
import { processFile } from '../services/processingService';
import { runMatching } from '../services/matchingService';
import { Layers, ChevronRight, Settings } from 'lucide-react';

export const AuditModule = () => {
  const [step, setStep] = useState<'UPLOAD' | 'PREVIEW'>('UPLOAD');
  const [masterFiles, setMasterFiles] = useState<UploadedFile[]>([]);
  const [promoterFiles, setPromoterFiles] = useState<UploadedFile[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [stats, setStats] = useState<ProcessingStats>({ totalRows: 0, matchedCpf: 0, matchedNameExact: 0, matchedNameFuzzy: 0, unmatched: 0 });
  
  const [fuzzyThreshold, setFuzzyThreshold] = useState(0.85);
  const [showSettings, setShowSettings] = useState(false);

  const handleFilesUploaded = (masters: UploadedFile[], promoters: UploadedFile[]) => {
    setMasterFiles(masters);
    setPromoterFiles(promoters);
  };

  const handleRunComparison = () => {
    if (masterFiles.length === 0 || promoterFiles.length === 0) return;

    // 1. Prepare Master Rows (Aggregate from all master files and inject filename)
    const masterRows = masterFiles.flatMap(file => 
      file.data.map(row => ({ ...row, fileName: file.name } as MasterRow))
    );

    // 2. Process all Promoter Files
    const allProcessedRows = promoterFiles.flatMap(file => processFile(file));

    // 3. Run Matching
    const { results: matchResults, stats: matchStats } = runMatching(allProcessedRows, masterRows, fuzzyThreshold);

    setResults(matchResults);
    setStats(matchStats);
    setStep('PREVIEW');
  };

  const reset = () => {
    setStep('UPLOAD');
    setResults([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Module Header / Toolbar */}
      <div className="flex items-center justify-between mb-6 shrink-0">
         {/* Progress Steps */}
         <div className="flex items-center gap-4 text-sm font-medium">
          <div className={`flex items-center gap-2 ${step === 'UPLOAD' ? 'text-blue-600' : 'text-slate-500'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'UPLOAD' ? 'bg-blue-100' : 'bg-slate-100'}`}>1</span>
            Upload
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <div className={`flex items-center gap-2 ${step === 'PREVIEW' ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'PREVIEW' ? 'bg-blue-100' : 'bg-slate-100'}`}>2</span>
            Resultados
          </div>
        </div>

        <div className="relative">
             <button 
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors text-sm"
             >
               <Settings className="w-4 h-4" />
               <span className="hidden sm:inline">Configurar Fuzzy</span>
             </button>
             
            {showSettings && (
              <div className="absolute right-0 top-10 bg-white border border-slate-200 shadow-xl rounded-lg p-4 w-72 z-40 animate-in slide-in-from-top-2">
                <h4 className="font-semibold text-slate-800 mb-3 text-sm">Configurações</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Sensibilidade Fuzzy Match ({Math.round(fuzzyThreshold * 100)}%)
                    </label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="1.0" 
                      step="0.05" 
                      value={fuzzyThreshold} 
                      onChange={(e) => setFuzzyThreshold(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Mais Rígido (1.0)</span>
                      <span>Mais Flexível (0.5)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {step === 'UPLOAD' && (
        <div className="flex flex-col gap-6 flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <UploadStep 
              onFilesUploaded={handleFilesUploaded} 
              masterFiles={masterFiles} 
              promoterFiles={promoterFiles} 
            />
          </div>
          
          <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-slate-50/90 backdrop-blur border-t border-slate-200 mt-auto flex justify-end z-20">
            <button
              onClick={handleRunComparison}
              disabled={masterFiles.length === 0 || promoterFiles.length === 0}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white shadow-md transition-all
                ${masterFiles.length === 0 || promoterFiles.length === 0 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'}`}
            >
              <Layers className="w-5 h-5" />
              Processar Comparação
            </button>
          </div>
        </div>
      )}

      {step === 'PREVIEW' && (
        <PreviewStep results={results} stats={stats} onBack={reset} />
      )}
    </div>
  );
};

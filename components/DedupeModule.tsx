import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, Trash2, Download, ArrowRight, RefreshCw, X } from 'lucide-react';
import { readExcelFile, exportGeneric } from '../services/excelService';
import { normalizeName } from '../utils/normalization';
import { format } from 'date-fns';

export const DedupeModule = () => {
  const [file, setFile] = useState<{name: string, data: any[]} | null>(null);
  const [step, setStep] = useState<'UPLOAD' | 'SELECT' | 'PREVIEW'>('UPLOAD');
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  
  const [processedData, setProcessedData] = useState<{unique: any[], duplicates: any[], stats: any} | null>(null);
  const [showRemoved, setShowRemoved] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      try {
        const data = await readExcelFile(f);
        if (data.length > 0) {
          const cols = Object.keys(data[0]);
          setFile({ name: f.name, data });
          setColumns(cols);
          // Auto-select column if Name/Nome is found
          const likelyName = cols.find(c => ['nome', 'name', 'cliente', 'participante'].includes(c.toLowerCase()));
          if (likelyName) setSelectedColumn(likelyName);
          else setSelectedColumn(cols[0]);
          
          setStep('SELECT');
        } else {
          alert('Arquivo vazio ou inválido.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao ler arquivo.');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] }
  });

  const handleProcess = () => {
    if (!file || !selectedColumn) return;

    const seen = new Set<string>();
    const unique: any[] = [];
    const duplicates: any[] = [];

    file.data.forEach((row, idx) => {
      const rawVal = row[selectedColumn];
      // If value is empty, we consider it "empty name". 
      // All subsequent empty names are duplicates of the first empty name.
      const norm = normalizeName(rawVal);
      
      if (seen.has(norm)) {
        duplicates.push({ ...row, _originalIndex: idx + 1 });
      } else {
        seen.add(norm);
        unique.push({ ...row, _originalIndex: idx + 1 });
      }
    });

    setProcessedData({
      unique,
      duplicates,
      stats: {
        total: file.data.length,
        unique: unique.length,
        removed: duplicates.length
      }
    });
    setStep('PREVIEW');
  };

  const handleExport = () => {
    if (!processedData || !file) return;
    // Export only the original fields (remove internal _originalIndex)
    const cleanData = processedData.unique.map(({ _originalIndex, ...rest }) => rest);
    const fileName = `Limpo_${file.name.replace('.xlsx', '').replace('.csv', '')}_${format(new Date(), 'HH-mm')}.xlsx`;
    exportGeneric(cleanData, fileName, "Dados Únicos");
  };

  const reset = () => {
    setFile(null);
    setProcessedData(null);
    setStep('UPLOAD');
    setSelectedColumn('');
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      
      {/* Upload Step */}
      {step === 'UPLOAD' && (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[400px]">
          <div className="max-w-xl w-full space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">Remover Duplicatas</h2>
              <p className="text-slate-500">Faça upload de uma planilha para remover nomes duplicados.</p>
            </div>
            
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'}`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4 text-slate-500">
                <div className="p-4 bg-purple-100 text-purple-600 rounded-full">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 text-lg">Clique ou arraste o arquivo aqui</p>
                  <p className="text-sm mt-1">Excel (.xlsx) ou CSV</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Select Column Step */}
      {step === 'SELECT' && file && (
        <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pt-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500">{file.data.length} linhas encontradas</p>
                </div>
             </div>
             <button onClick={reset} className="text-slate-400 hover:text-red-500">
               <X className="w-5 h-5" />
             </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Qual coluna contém o NOME para verificar duplicatas?
              </label>
              <select 
                value={selectedColumn} 
                onChange={(e) => setSelectedColumn(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-2">
                A verificação irá ignorar maiúsculas/minúsculas, acentos e espaços extras.
              </p>
            </div>

            <div className="border rounded-lg overflow-hidden">
               <div className="bg-slate-50 px-4 py-2 border-b text-xs font-semibold text-slate-500">
                 Pré-visualização (primeiras 5 linhas)
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-white text-slate-500 border-b">
                     <tr>
                       {columns.slice(0, 5).map(c => (
                         <th key={c} className={`px-4 py-2 whitespace-nowrap ${c === selectedColumn ? 'bg-purple-50 text-purple-700' : ''}`}>
                           {c}
                         </th>
                       ))}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {file.data.slice(0, 5).map((row, i) => (
                       <tr key={i}>
                         {columns.slice(0, 5).map(c => (
                           <td key={c} className={`px-4 py-2 whitespace-nowrap text-slate-600 ${c === selectedColumn ? 'bg-purple-50 font-medium' : ''}`}>
                             {row[c]}
                           </td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={handleProcess}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all transform hover:-translate-y-0.5"
              >
                <RefreshCw className="w-5 h-5" />
                Remover Duplicatas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview & Export Step */}
      {step === 'PREVIEW' && processedData && (
        <div className="flex flex-col h-full space-y-4">
          <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Total Original</p>
              <p className="text-2xl font-bold text-slate-800">{processedData.stats.total}</p>
            </div>
            <div>
              <p className="text-xs text-green-600 uppercase font-bold">Únicos (Mantidos)</p>
              <p className="text-2xl font-bold text-green-600">{processedData.stats.unique}</p>
            </div>
            <div>
              <p className="text-xs text-red-500 uppercase font-bold">Duplicados (Removidos)</p>
              <p className="text-2xl font-bold text-red-500">{processedData.stats.removed}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-2 rounded-lg shrink-0">
            <div className="flex gap-2">
              <button 
                onClick={() => setShowRemoved(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!showRemoved ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Ver Mantidos
              </button>
              <button 
                onClick={() => setShowRemoved(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showRemoved ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Ver Removidos
              </button>
            </div>
            
            <div className="flex gap-2">
              <button onClick={reset} className="text-slate-500 hover:text-slate-800 px-4 py-2 text-sm font-medium">
                Começar de novo
              </button>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm"
              >
                <Download className="w-4 h-4" />
                Exportar Limpo
              </button>
            </div>
          </div>

          <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-y-auto overflow-x-auto max-h-[60vh] w-full">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-20">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">Linha</th>
                    {columns.map(c => (
                      <th key={c} className={`px-4 py-3 whitespace-nowrap ${c === selectedColumn ? 'text-purple-700 bg-purple-50' : ''}`}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(showRemoved ? processedData.duplicates : processedData.unique).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-center text-xs text-slate-400 font-mono">
                        {row._originalIndex}
                      </td>
                      {columns.map(c => (
                        <td key={c} className={`px-4 py-2 whitespace-nowrap text-slate-700 ${c === selectedColumn ? 'font-medium bg-purple-50/30' : ''}`}>
                          {row[c]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {(showRemoved ? processedData.duplicates : processedData.unique).length === 0 && (
                    <tr>
                      <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-slate-400">
                        Nenhum registro nesta categoria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

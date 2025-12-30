import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, X, CheckCircle } from 'lucide-react';
import { UploadedFile, PromoterType } from '../types';
import { readExcelFile } from '../services/excelService';
import { detectPromoterType } from '../utils/normalization';

interface UploadStepProps {
  onFilesUploaded: (master: UploadedFile | null, promoters: UploadedFile[]) => void;
  masterFile: UploadedFile | null;
  promoterFiles: UploadedFile[];
}

export const UploadStep: React.FC<UploadStepProps> = ({ onFilesUploaded, masterFile, promoterFiles }) => {
  const onDrop = useCallback(async (acceptedFiles: File[], isMaster: boolean) => {
    const processedFiles: UploadedFile[] = [];

    for (const file of acceptedFiles) {
      try {
        const jsonData = await readExcelFile(file);
        const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
        const detectedType = isMaster ? undefined : detectPromoterType(headers);
        
        processedFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: isMaster ? 'MASTER' : 'PROMOTER',
          data: jsonData,
          promoterType: detectedType
        });
      } catch (error) {
        console.error("Error reading file", file.name, error);
        alert(`Erro ao ler arquivo ${file.name}`);
      }
    }

    if (isMaster) {
      onFilesUploaded(processedFiles[0] || null, promoterFiles);
    } else {
      onFilesUploaded(masterFile, [...promoterFiles, ...processedFiles]);
    }
  }, [masterFile, promoterFiles, onFilesUploaded]);

  const { getRootProps: getMasterProps, getInputProps: getMasterInputProps, isDragActive: isMasterActive } = useDropzone({
    onDrop: (files) => onDrop(files, true),
    maxFiles: 1,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] }
  });

  const { getRootProps: getPromoterProps, getInputProps: getPromoterInputProps, isDragActive: isPromoterActive } = useDropzone({
    onDrop: (files) => onDrop(files, false),
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] }
  });

  const removeFile = (id: string, isMaster: boolean) => {
    if (isMaster) {
      onFilesUploaded(null, promoterFiles);
    } else {
      onFilesUploaded(masterFile, promoterFiles.filter(f => f.id !== id));
    }
  };

  const updatePromoterType = (id: string, newType: PromoterType) => {
    const updated = promoterFiles.map(f => f.id === id ? { ...f, promoterType: newType } : f);
    onFilesUploaded(masterFile, updated);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Master File Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
            Arquivo Mestre
          </h3>
          
          {!masterFile ? (
            <div 
              {...getMasterProps()} 
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                ${isMasterActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
            >
              <input {...getMasterInputProps()} />
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Upload className="w-10 h-10 mb-2 text-slate-400" />
                <p className="font-medium text-slate-700">Arraste a planilha mestre</p>
                <p className="text-xs">Requer colunas: VENDEDOR, NOME, CPF</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">{masterFile.name}</p>
                  <p className="text-xs text-slate-500">{masterFile.data.length} linhas</p>
                </div>
              </div>
              <button onClick={() => removeFile(masterFile.id, true)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Promoter Files Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
            Arquivos das Promotoras
          </h3>
          
          <div 
            {...getPromoterProps()} 
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-4
              ${isPromoterActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
          >
            <input {...getPromoterInputProps()} />
            <div className="flex flex-col items-center gap-1 text-slate-500">
              <Upload className="w-8 h-8 mb-1 text-slate-400" />
              <p className="font-medium text-slate-700 text-sm">Adicionar arquivos</p>
              <p className="text-xs">Port, CredForYou, Cia do Crédito...</p>
            </div>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {promoterFiles.map(file => (
              <div key={file.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{file.data.length} linhas</p>
                    </div>
                  </div>
                  <button onClick={() => removeFile(file.id, false)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0 ml-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded text-xs">
                  <span className="text-slate-500 shrink-0">Layout:</span>
                  <select 
                    value={file.promoterType} 
                    onChange={(e) => updatePromoterType(file.id, e.target.value as PromoterType)}
                    className="bg-white border border-slate-300 rounded px-2 py-1 flex-1 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {Object.values(PromoterType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {promoterFiles.length === 0 && (
              <div className="text-center p-4 text-slate-400 text-sm italic bg-slate-50 rounded-lg">
                Nenhum arquivo de promotora adicionado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

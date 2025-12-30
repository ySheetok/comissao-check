import React, { useState } from 'react';
import { MatchResult, ProcessingStats } from '../types';
import { exportToExcel } from '../services/excelService';
import { Download, AlertCircle, CheckCircle, SearchX, Filter } from 'lucide-react';

interface PreviewStepProps {
  results: MatchResult[];
  stats: ProcessingStats;
  onBack: () => void;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({ results, stats, onBack }) => {
  const [activeTab, setActiveTab] = useState<'FOUND' | 'PENDING'>('FOUND');
  const [filterText, setFilterText] = useState('');

  const filteredResults = results.filter(r => {
    const isFound = r.matchType !== 'NONE';
    if (activeTab === 'FOUND' && !isFound) return false;
    if (activeTab === 'PENDING' && isFound) return false;
    
    if (filterText) {
      const searchStr = filterText.toLowerCase();
      return (
        r.row.cliente.toLowerCase().includes(searchStr) ||
        r.row.cpfNormalized.includes(searchStr) ||
        (r.masterData?.NOME || '').toLowerCase().includes(searchStr)
      );
    }
    return true;
  });

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-right duration-500">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 uppercase font-semibold">Total Processado</span>
          <span className="text-2xl font-bold text-slate-800">{stats.totalRows}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-green-600 uppercase font-semibold">Encontrados (Total)</span>
          <span className="text-2xl font-bold text-green-600">
            {stats.matchedCpf + stats.matchedNameExact + stats.matchedNameFuzzy}
          </span>
          <span className="text-xs text-slate-400">
            {stats.matchedCpf} CPF • {stats.matchedNameExact + stats.matchedNameFuzzy} Nome
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-amber-600 uppercase font-semibold">Fuzzy Match</span>
          <span className="text-2xl font-bold text-amber-600">{stats.matchedNameFuzzy}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-red-600 uppercase font-semibold">Pendências</span>
          <span className="text-2xl font-bold text-red-600">{stats.unmatched}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-100 p-2 rounded-lg">
        <div className="flex items-center bg-slate-200 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('FOUND')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'FOUND' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Encontrados ({stats.matchedCpf + stats.matchedNameExact + stats.matchedNameFuzzy})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'PENDING' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendências ({stats.unmatched})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar por nome ou CPF..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => exportToExcel(results)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Added overflow-x-auto, max-h-[60vh] and overflow-y-auto as requested for better scrolling */}
        <div className="overflow-y-auto overflow-x-auto max-h-[60vh] w-full">
          <table className="w-full text-sm text-left">
            {/* Added sticky header z-index to ensure it stays on top */}
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-20 shadow-sm">
              <tr>
                {activeTab === 'FOUND' ? (
                  <>
                    <th className="px-4 py-3 font-semibold min-w-[120px]">Promotora</th>
                    <th className="px-4 py-3 font-semibold min-w-[200px]">Cliente (Promotora)</th>
                    <th className="px-4 py-3 font-semibold min-w-[200px]">Vendedor (Mestre)</th>
                    <th className="px-4 py-3 font-semibold min-w-[120px]">CPF</th>
                    <th className="px-4 py-3 font-semibold min-w-[100px]">Match</th>
                    <th className="px-4 py-3 font-semibold min-w-[100px]">Comissão</th>
                    <th className="px-4 py-3 font-semibold min-w-[120px]">Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 font-semibold min-w-[120px]">Promotora</th>
                    <th className="px-4 py-3 font-semibold min-w-[200px]">Cliente</th>
                    <th className="px-4 py-3 font-semibold min-w-[120px]">CPF</th>
                    <th className="px-4 py-3 font-semibold min-w-[120px]">Banco</th>
                    <th className="px-4 py-3 font-semibold min-w-[150px]">Produto</th>
                    <th className="px-4 py-3 font-semibold min-w-[120px]">Usuário</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <SearchX className="w-8 h-8 opacity-50" />
                      <p>Nenhum resultado encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredResults.map((res, idx) => (
                  <tr key={`${res.row.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                    {activeTab === 'FOUND' ? (
                      <>
                        <td className="px-4 py-3 text-slate-600">{res.row.promoterType}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{res.row.cliente}</td>
                        <td className="px-4 py-3 text-blue-700">{res.masterData?.VENDEDOR}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{res.row.cpfNormalized}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                            ${res.matchType === 'CPF_EXACT' ? 'bg-green-50 text-green-700 border-green-200' : 
                              res.matchType === 'NAME_EXACT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {res.matchType === 'CPF_EXACT' ? 'CPF' : res.matchType === 'NAME_EXACT' ? 'Nome Exato' : 'Nome Aprox.'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800 font-medium">
                          {formatMoney(res.row.comissao)}
                        </td>
                        <td className="px-4 py-3">
                          {res.status === 'LIBERADO' ? (
                            <span className="text-green-600 flex items-center gap-1 text-xs font-bold">
                              <CheckCircle className="w-3 h-3" /> LIBERADO
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1 text-xs font-bold">
                              <AlertCircle className="w-3 h-3" /> SEM COMISSÃO
                            </span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-slate-600">{res.row.promoterType}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{res.row.cliente}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{res.row.cpfNormalized}</td>
                        <td className="px-4 py-3 text-slate-600">{res.row.banco}</td>
                        <td className="px-4 py-3 text-slate-600">{res.row.produto}</td>
                        <td className="px-4 py-3 text-slate-500 italic">{res.row.usuario}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-start pt-2">
         <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm underline">
            Voltar para upload
         </button>
      </div>
    </div>
  );
};
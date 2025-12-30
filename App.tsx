import React, { useState } from 'react';
import { Calculator, RefreshCw } from 'lucide-react';
import { AuditModule } from './components/AuditModule';
import { DedupeModule } from './components/DedupeModule';

type Module = 'AUDIT' | 'DEDUPE';

function App() {
  const [activeModule, setActiveModule] = useState<Module>('AUDIT');

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans">
      {/* App Header */}
      <header className="bg-white border-b border-slate-200 shrink-0 z-30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 p-2 rounded-lg text-white shadow-sm">
                <Calculator className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">ComissãoCheck</h1>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveModule('AUDIT')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeModule === 'AUDIT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Auditoria de Comissões
              </button>
              <button 
                onClick={() => setActiveModule('DEDUPE')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeModule === 'DEDUPE' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Remover Duplicatas
              </button>
            </nav>
          </div>
        </div>

        {/* Mobile Nav (if screen is small, show below header) */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 bg-slate-50 flex gap-2 overflow-x-auto">
           <button 
              onClick={() => setActiveModule('AUDIT')}
              className={`flex-1 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium border ${activeModule === 'AUDIT' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              Auditoria
            </button>
            <button 
              onClick={() => setActiveModule('DEDUPE')}
              className={`flex-1 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium border ${activeModule === 'DEDUPE' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              Duplicatas
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-full">
          {activeModule === 'AUDIT' ? <AuditModule /> : <DedupeModule />}
        </div>
      </main>
    </div>
  );
}

export default App;

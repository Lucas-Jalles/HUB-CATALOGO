import React, { useState } from 'react';
import { LogOut, Settings as SettingsIcon, Folder, FileCode, Zap, ChevronDown, ChevronRight, ListFilter, Map, Link2, FileEdit, Repeat, Send } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useOperadoras } from './useOperadoras';

export default function Sidebar() {
  const { logout, user, isAdmin } = useAuth();
  const location = useLocation();
  const [isAutomationsOpen, setIsAutomationsOpen] = useState(location.pathname === '/automation');

  const { data: operadoras = [] } = useOperadoras();

  const currentParams = new URLSearchParams(location.search);
  const activeOp = currentParams.get('operadora');
  const activeTool = currentParams.get('tool') || 'separator';

  return (
    <aside className="w-64 bg-gray-950 p-4 flex flex-col h-full">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Catalog Hub
        </h1>
        <p className="text-xs text-gray-500 mt-1 truncate">{user?.email}</p>
      </div>
      
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
        <div className="pt-2 pb-1">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3">Pastas (Projetos)</p>
        </div>

        {operadoras.map(op => (
          <Link key={op.id} to={`/?operadora=${op.id}`} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm ${activeOp === op.id ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Folder size={16} />
            <span className="truncate">{op.nome}</span>
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3">Ferramentas</p>
            </div>
            <Link to="/json" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm ${location.pathname === '/json' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FileCode size={18} />
              Formatador JSON
            </Link>
            
            <button onClick={() => setIsAutomationsOpen(!isAutomationsOpen)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors font-medium text-sm ${location.pathname === '/automation' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <Zap size={18} />
                Automações
              </div>
              {isAutomationsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isAutomationsOpen && (
              <div className="pl-6 pr-2 py-1 space-y-1">
                <Link to="/automation?tool=separator" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-xs ${location.pathname === '/automation' && activeTool === 'separator' ? 'bg-yellow-500/10 text-yellow-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  <ListFilter size={14} /> Separador de Listas
                </Link>
                <Link to="/automation?tool=regionalization" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-xs ${location.pathname === '/automation' && activeTool === 'regionalization' ? 'bg-yellow-500/10 text-yellow-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  <Map size={14} /> Regionalização
                </Link>
                <Link to="/automation?tool=links" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-xs ${location.pathname === '/automation' && activeTool === 'links' ? 'bg-yellow-500/10 text-yellow-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  <Link2 size={14} /> Links de Regulamentos
                </Link>
                <Link to="/automation?tool=offerEditor" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-xs ${location.pathname === '/automation' && activeTool === 'offerEditor' ? 'bg-yellow-500/10 text-yellow-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  <FileEdit size={14} /> Editor de Ofertas JSON
                </Link>
                <Link to="/automation?tool=multiReplace" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-xs ${location.pathname === '/automation' && activeTool === 'multiReplace' ? 'bg-yellow-500/10 text-yellow-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  <Repeat size={14} /> Substituição em Massa
                </Link>
                <Link to="/automation?tool=apiRunner" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-xs ${location.pathname === '/automation' && activeTool === 'apiRunner' ? 'bg-yellow-500/10 text-yellow-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  <Send size={14} /> API Runner & Lote
                </Link>
              </div>
            )}
          </>
        )}

        <div className="pt-4 pb-1">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3">Sistema</p>
        </div>
        <Link to="/settings" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm ${location.pathname === '/settings' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
          <SettingsIcon size={18} />
          Configurações
        </Link>
      </nav>

      <button onClick={logout} className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors mt-auto px-3 py-2 w-full">
        <LogOut size={18} /> Sair
      </button>
    </aside>
  );
}
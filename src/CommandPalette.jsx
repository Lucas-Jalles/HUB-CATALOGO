import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Link as LinkIcon, Folder, FolderKanban, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';
import { useQuery } from '@tanstack/react-query';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const { data: urls = [] } = useQuery({
    queryKey: ['urls'],
    queryFn: async () => (await api.get('', { params: { action: 'get_urls' } })).data.data || [],
    enabled: isOpen, // Só busca (do cache ou da rede) quando o painel está aberto
  });
  const { data: operadoras = [] } = useQuery({
    queryKey: ['operadoras'],
    queryFn: async () => (await api.get('', { params: { action: 'get_operadoras' } })).data.data || [],
    enabled: isOpen,
  });
  const { data: rawPastas = [] } = useQuery({
    queryKey: ['pastas'],
    queryFn: async () => (await api.get('', { params: { action: 'get_pastas' } })).data.data || [],
    enabled: isOpen,
  });

  const pastas = useMemo(() => {
    const unique = [];
    const seen = new Set();
    rawPastas.forEach(p => {
      const name = (p.nome || '').trim().toLowerCase();
      if (!seen.has(name)) { seen.add(name); unique.push(p); }
    });
    return unique;
  }, [rawPastas]);

  if (!isOpen) return null;

  const filteredUrls = urls.filter(u => String(u.nome || '').toLowerCase().includes(query.toLowerCase()));
  const filteredPastas = pastas.filter(p => String(p.nome || '').toLowerCase().includes(query.toLowerCase()));
  const filteredOps = operadoras.filter(o => String(o.nome || '').toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (type, item) => {
    setIsOpen(false);
    if (type === 'url') window.open(item.url, '_blank');
    if (type === 'pasta') navigate(`/?operadora=${item.operadora_id}&pasta=${item.id}`);
    if (type === 'operadora') navigate(`/?operadora=${item.id}`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-start justify-center pt-[10vh] p-4" onClick={() => setIsOpen(false)}>
      <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center px-5 py-4 border-b border-gray-800 bg-gray-950/50">
          <Search className="text-blue-500 mr-3" size={22} />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Busque por URLs, Pastas ou Operadoras... (CTRL+K)" className="flex-1 bg-transparent text-white outline-none text-lg placeholder-gray-600" />
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 p-1.5 rounded-lg transition-colors"><X size={18} /></button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {query && (
            <div className="space-y-1">
              {filteredUrls.map(u => <div key={u.id} onClick={() => handleSelect('url', u)} className="px-4 py-3 hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-3 text-white transition-colors"><LinkIcon size={16} className="text-blue-400"/> {u.nome}</div>)}
              {filteredPastas.map(p => <div key={p.id} onClick={() => handleSelect('pasta', p)} className="px-4 py-3 hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-3 text-white transition-colors"><Folder size={16} className="text-yellow-400"/> {p.nome}</div>)}
              {filteredOps.map(o => <div key={o.id} onClick={() => handleSelect('operadora', o)} className="px-4 py-3 hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-3 text-white transition-colors"><FolderKanban size={16} className="text-purple-400"/> {o.nome}</div>)}
            </div>
          )}
          {!query && <div className="text-center py-10 text-gray-500 text-sm">Digite algo para pesquisar globalmente...</div>}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { Play, Layers, Trash2, Copy, Star, ExternalLink, Edit2, Globe, X } from 'lucide-react';
import { api } from './api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

export default function UrlExecutor({ urlData, onDelete, onEdit, globalTags = [] }) {
  const [inputValues, setInputValues] = useState('');
  const [delay, setDelay] = useState(300);
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { user, isAdmin } = useAuth();
  const isFavorite = urlData.favorito === 'true';

  const variables = useMemo(() => {
    const regex = /{(.*?)}/g;
    const matches = [...String(urlData.url || '').matchAll(regex)];
    return matches.map(match => match[1]);
  }, [urlData.url]);
  
  const hasVariables = variables.length > 0;

  const generatedUrls = useMemo(() => {
    const lines = inputValues.split('\n').filter(line => line.trim() !== '');
    return lines.map(line => {
      let finalUrl = String(urlData.url || '');
      const values = line.split(',');
      variables.forEach((variable, i) => {
        finalUrl = finalUrl.replace(`{${variable}}`, values[i] ? values[i].trim() : '');
      });
      return finalUrl;
    });
  }, [inputValues, urlData.url, variables]);

  const domain = useMemo(() => {
    try {
      if (!urlData.url) return '';
      const urlObj = new URL(urlData.url.replace(/{.*?}/g, 'var'));
      return urlObj.hostname;
    } catch (e) {
      return urlData.url.split('/')[0] || 'Link';
    }
  }, [urlData.url]);

  // SEGURANÇA: Validação de URL para evitar XSS baseado em DOM via 'javascript:'
  const isSafeUrl = (urlStr) => {
    try {
      const urlObj = new URL(urlStr);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
      return false; // URL inválida
    }
  };

  const handleExecute = async () => {
    if (!urlData.url) return;

    if (!hasVariables) {
      if (isSafeUrl(urlData.url)) window.open(urlData.url, '_blank', 'noopener,noreferrer');
      else alert("Erro de segurança: A URL não é um link HTTP/HTTPS válido.");
      return;
    }

    let blocked = false;
    generatedUrls.forEach((finalUrl, index) => {
      setTimeout(() => {
        // Proteção contra payload injetado nas variáveis
        if (isSafeUrl(finalUrl)) {
          const newWindow = window.open(finalUrl, '_blank', 'noopener,noreferrer');
          // Se retornar null, o navegador bloqueou
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            blocked = true;
          }
        }
      }, index * delay);
    });
    
    setTimeout(() => {
      if (blocked) alert("⚠️ Seu navegador bloqueou a abertura de algumas abas. Permita pop-ups para este site na barra de endereços para executar as ações em lote corretamente.");
    }, generatedUrls.length * delay + 100);

    try {
      await api.post('', {
        action: 'registrar_execucao',
        data: { url_id: urlData.id, parametros: inputValues }
      });
    } catch (e) {
      console.error('Erro ao salvar histórico', e);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(urlData.url);
    alert("URL copiada para a área de transferência!");
  };

  const { mutate: toggleFavoriteMutate } = useMutation({
    mutationFn: (newState) => api.post('', { action: 'update_url', data: { id: urlData.id, favorito: newState.toString() } }),
    onMutate: async (newState) => {
      await queryClient.cancelQueries({ queryKey: ['urls'] });
      const previousUrls = queryClient.getQueryData(['urls']);
      queryClient.setQueryData(['urls'], old => old.map(u => u.id === urlData.id ? { ...u, favorito: newState.toString() } : u));
      return { previousUrls };
    },
    onError: (err, newState, context) => {
      queryClient.setQueryData(['urls'], context.previousUrls);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['urls'] }),
  });

  const toggleFavorite = () => {
    toggleFavoriteMutate(!isFavorite);
  };

  let tagsList = [];
  tagsList = String(urlData.tags || '').split(',').map(t => {
    const clean = t.trim();
    const found = globalTags.find(g => g.nome === clean);
    return { nome: clean, cor: found ? found.cor : '#3b82f6' };
  }).filter(t => t.nome);

  return (
    <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 shadow-sm hover:border-gray-600 transition-all flex flex-col group relative">
      
      {/* Ações Ocultas (Hover) */}
      <div className={`absolute top-2 right-2 flex items-center gap-1 z-10 transition-all p-1 rounded-lg bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 shadow-lg ${isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
        <button onClick={toggleFavorite} className={`p-1.5 rounded transition ${isFavorite ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`} title={isFavorite ? "Remover dos Favoritos" : "Favoritar"}>
          <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        {isAdmin && (
          <div className={`flex items-center gap-1 overflow-hidden transition-all ${isFavorite ? 'w-0 opacity-0 group-hover:w-auto group-hover:opacity-100' : 'w-auto opacity-100'}`}>
            <button onClick={() => onEdit(urlData)} className="text-gray-400 hover:text-blue-400 p-1.5 hover:bg-gray-700 rounded transition" title="Editar">
              <Edit2 size={14} />
            </button>
            <button onClick={() => onDelete(urlData.id)} className="text-gray-400 hover:text-red-400 p-1.5 hover:bg-gray-700 rounded transition" title="Excluir">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 mb-2 pr-16">
        <div className="p-2 bg-gray-900/50 rounded-lg border border-gray-700/50 text-blue-400 shrink-0">
          <Layers size={16} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-[15px] font-bold text-gray-100 leading-tight truncate">{urlData.nome}</h3>
        </div>
      </div>

      {tagsList.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tagsList.map((tag, idx) => (
            <span key={idx} style={{ backgroundColor: `${tag.cor}20`, color: tag.cor, borderColor: `${tag.cor}30` }} className="border px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">
              {tag.nome}
            </span>
          ))}
        </div>
      )}

      {urlData.descricao && (
        <p className="text-gray-400 text-[11px] mb-2 truncate" title={urlData.descricao}>{urlData.descricao}</p>
      )}

      <div className="flex items-center gap-1.5 min-w-0 text-gray-500 hover:text-gray-300 transition-colors cursor-help mb-3 mt-auto" title={urlData.url}>
        <Globe size={12} className="shrink-0" />
        <span className="text-[11px] font-medium truncate">{domain}</span>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-700/30">
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleCopy} className="text-xs font-medium text-gray-400 hover:text-gray-200 bg-gray-700/50 hover:bg-gray-700 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
            <Copy size={12} /> Copiar
          </button>

          {hasVariables ? (
            <button onClick={() => setIsExpanded(!isExpanded)} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${isExpanded ? 'bg-gray-700 text-white' : 'text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20'}`}>
              {isExpanded ? <X size={12} /> : <Play size={12} fill="currentColor" />} {isExpanded ? 'Fechar' : 'Executar'}
            </button>
          ) : (
            <button onClick={handleExecute} className="text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
              <ExternalLink size={12} /> Abrir
            </button>
          )}
        </div>
      </div>

      {isExpanded && hasVariables && (
        <div className="mt-3 pt-3 border-t border-gray-700/50 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-gray-400 font-mono truncate">Vars: <span className="text-blue-400">{variables.map(v => `{${v}}`).join(', ')}</span></label>
            <label className="text-[9px] text-gray-500 flex items-center gap-1" title="Atraso entre abas">
              Delay (ms): <input type="number" value={delay} onChange={e=>setDelay(e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-1.5 w-12 py-0.5 text-white outline-none focus:border-blue-500 transition-colors"/>
            </label>
          </div>
          <textarea
            className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2 text-xs focus:border-blue-500 outline-none transition-all resize-none h-16 custom-scrollbar placeholder-gray-600"
            placeholder={`Valores separados por vírgula\n(um conjunto por linha)...`}
            value={inputValues}
            onChange={(e) => setInputValues(e.target.value)}
          ></textarea>
          <button onClick={handleExecute} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-xs shadow-md mt-1">
            <Play size={14} fill="currentColor" /> Executar em Lote
          </button>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import UrlExecutor from './UrlExecutor';
import UrlModal from './UrlModal';
import { api } from './api';
import { Plus, Search, FolderPlus, Tag, X, ChevronDown, ChevronRight, Star } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [collapsedTopics, setCollapsedTopics] = useState({});
  const [editingUrl, setEditingUrl] = useState(null);
  const [topicName, setTopicName] = useState('');
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  
  const activeOperadoraId = searchParams.get('operadora');
  const urlPastaId = searchParams.get('pasta');

  const { data: rawPastas = [], isLoading: isLoadingPastas } = useQuery({
    queryKey: ['pastas'],
    queryFn: async () => {
      const res = await api.get('', { params: { action: 'get_pastas' } });
      return res.data.status === 'success' ? res.data.data || [] : [];
    }
  });

  // Deduplica pastas com o mesmo nome (Tópicos Globais) e cria um mapa de migração
  const pastas = useMemo(() => {
    const unique = [];
    const seen = new Set();
    rawPastas.forEach(p => {
      const name = (p.nome || '').trim().toLowerCase();
      if (!seen.has(name)) { seen.add(name); unique.push(p); }
    });
    return unique;
  }, [rawPastas]);

  const pastaIdMap = useMemo(() => {
    const map = {};
    const nameToCanonical = {};
    pastas.forEach(p => { nameToCanonical[(p.nome || '').trim().toLowerCase()] = p.id; });
    rawPastas.forEach(p => { map[p.id] = nameToCanonical[(p.nome || '').trim().toLowerCase()]; });
    return map;
  }, [rawPastas, pastas]);

  const activePastaId = urlPastaId ? (pastaIdMap[urlPastaId] || urlPastaId) : null;

  const { data: urls = [] } = useQuery({
    queryKey: ['urls'],
    queryFn: async () => {
      const res = await api.get('', { params: { action: 'get_urls' } });
      return res.data.status === 'success' ? res.data.data || [] : [];
    }
  });

  const { data: operadoras = [] } = useQuery({
    queryKey: ['operadoras'],
    queryFn: async () => {
      const res = await api.get('', { params: { action: 'get_operadoras' } });
      if (res.data.status === 'success') {
        let ops = res.data.data || [];
        const savedOrder = JSON.parse(localStorage.getItem('operadorasOrder') || '[]');
        if (Array.isArray(savedOrder) && savedOrder.length > 0) {
          ops.sort((a, b) => {
            let idxA = savedOrder.indexOf(a.id);
            let idxB = savedOrder.indexOf(b.id);
            if (idxA === -1) idxA = 999;
            if (idxB === -1) idxB = 999;
            return idxA - idxB;
          });
        }
        return ops;
      }
      return [];
    }
  });

  const { data: globalTags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await api.get('', { params: { action: 'get_tags' } });
      return res.data.status === 'success' ? res.data.data || [] : [];
    }
  });

  const { isPending: isSavingUrl, mutate: saveUrl } = useMutation({
    mutationFn: (formData) => api.post('', {
      action: formData.id ? 'update_url' : 'create_url',
      data: formData
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['urls'] }),
    onError: (error) => console.error("Erro ao salvar URL", error),
  });

  const handleSaveUrl = (formData) => {
    setIsModalOpen(false);
    setEditingUrl(null);
    saveUrl(formData);
  };

  const { mutate: deleteUrl } = useMutation({
    mutationFn: (id) => api.post('', { action: 'delete_url', data: { id } }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['urls'] });
      const previousUrls = queryClient.getQueryData(['urls']);
      queryClient.setQueryData(['urls'], (old) => old.filter(url => url.id !== id));
      return { previousUrls };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['urls'], context.previousUrls);
      console.error("Erro ao deletar", err);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['urls'] }),
  });

  const handleDeleteUrl = (id) => {
    if(!window.confirm('Tem certeza que deseja excluir esta ação?')) return;
    deleteUrl(id);
  };

  const { isPending: isCreatingTopic, mutate: createTopics } = useMutation({
    mutationFn: (nomes) => Promise.all(nomes.map(nome => api.post('', { action: 'create_pasta', data: { nome, operadora_id: 'global', parent_id: activePastaId || '' } }))),
    onSuccess: () => {
      setTopicName('');
      setIsTopicModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['pastas'] });
      // O Sidebar agora usa useQuery, então a atualização é automática ao invalidar a query de 'operadoras' em Settings
    },
    onError: (error) => {
      console.error("Erro ao criar tópico", error);
      alert('Erro ao criar tópico. Tente novamente.');
    }
  });

  const handleCreateTopicSubmit = (e) => {
    e.preventDefault();
    if (!topicName.trim()) return;
    // Separa os nomes por vírgula e remove espaços vazios para criar em massa
    const nomes = topicName.split(',').map(n => n.trim()).filter(Boolean);
    createTopics(nomes);
  };

  const loading = isLoadingPastas || isLoadingTags;

  const toggleTopic = (id) => {
    setCollapsedTopics(prev => ({ ...prev, [id]: prev[id] === false ? true : false }));
  };

  const expandAll = () => {
    const allIds = { geral: false };
    pastas.forEach(p => allIds[p.id] = false);
    setCollapsedTopics(allIds);
  };

  const collapseAll = () => {
    setCollapsedTopics({});
  };

  // Extrair todas as tags únicas disponíveis na visualização atual
  const urlsInCurrentView = activeOperadoraId ? urls.filter(u => u.operadora_id === activeOperadoraId) : urls;
  const urlsAfterPastaFilter = activePastaId ? urlsInCurrentView.filter(u => pastaIdMap[u.pasta_id] === activePastaId) : urlsInCurrentView;
  const allTags = useMemo(() => {
    return Array.from(new Set(
      urlsAfterPastaFilter.flatMap(u => String(u.tags || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean))
    )).sort();
  }, [urlsAfterPastaFilter]);

  // Filtrar e Agrupar
  const filteredUrls = useMemo(() => {
    return urlsAfterPastaFilter.filter(u => {
      const matchSearch = (String(u.nome || '') + ' ' + String(u.url || '') + ' ' + String(u.descricao || '')).toLowerCase().includes(searchTerm.toLowerCase());
      const urlTags = String(u.tags || '').toLowerCase().split(',').map(t => t.trim());
      const matchTag = selectedTag ? urlTags.includes(selectedTag.toLowerCase()) : true;
      const matchFavorite = showFavoritesOnly ? u.favorito === 'true' : true;
      
      return matchSearch && matchTag && matchFavorite;
    });
  }, [urlsAfterPastaFilter, searchTerm, selectedTag, showFavoritesOnly]);

  const activeOpName = operadoras.find(op => op.id === activeOperadoraId)?.nome || 'Todas as Ações';
  
  // Cria o Breadcrumb do Título (Ex: Operadora > Pasta > Subpasta)
  let displayTitle = activeOpName;
  if (activePastaId) {
    const getPastaPath = (id) => {
      const p = pastas.find(x => x.id === id);
      if (!p) return [];
      return [...getPastaPath(p.parent_id), p.nome];
    };
    const pathNames = getPastaPath(activePastaId);
    displayTitle = `${activeOpName} > ${pathNames.join(' > ')}`;
  }
  
  const groupedUrls = useMemo(() => {
    return filteredUrls.reduce((acc, url) => {
      const mappedId = url.pasta_id ? pastaIdMap[url.pasta_id] : null;
      const pastaId = mappedId || 'geral';
      if (!acc[pastaId]) acc[pastaId] = [];
      acc[pastaId].push(url);
      return acc;
    }, {});
  }, [filteredUrls, pastaIdMap]);

  return (
    <>
      <main className="flex-1 flex flex-col overflow-hidden p-8 relative bg-gray-900 border-l border-gray-800">
        <header className="mb-8 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{displayTitle}</h2>
            <p className="text-gray-400 text-sm mt-1">Gerencie e execute as ações desta pasta.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isAdmin && activeOperadoraId && (
              <button onClick={() => setIsTopicModalOpen(true)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 border border-gray-700 shadow-sm">
                <FolderPlus size={18} /> {activePastaId ? 'Nova Subpasta' : 'Novo Tópico'}
              </button>
            )}
            {isAdmin && (
              <button onClick={() => { setEditingUrl(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
                <Plus size={18} /> Nova Ação
              </button>
            )}
          </div>
        </header>

        {/* Barra de Pesquisa, Filtros e Ações de Lista */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
            <input 
              type="text" placeholder="Buscar por nome, URL ou descrição..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl pl-11 pr-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner placeholder-gray-500"
            />
          </div>
          <div className="relative min-w-[220px]">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
            <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl pl-11 pr-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner appearance-none cursor-pointer">
              <option value="">Todas as Tags</option>
              {allTags.map(tag => <option key={tag} value={tag}>{tag.charAt(0).toUpperCase() + tag.slice(1)}</option>)}
            </select>
          </div>
          <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`px-4 py-3 rounded-xl border flex items-center gap-2 font-medium transition-all ${showFavoritesOnly ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-400' : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'}`}>
            <Star size={16} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
            <span className="hidden sm:inline">Favoritos</span>
          </button>
        </div>

        {!activeOperadoraId && (
          <div className="flex justify-end gap-4 mb-6 shrink-0">
            <button onClick={expandAll} className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">Expandir tudo</button>
            <button onClick={collapseAll} className="text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors">Recolher tudo</button>
          </div>
        )}

        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">Carregando dados da planilha...</div>
          ) : (
            <div className={activeOperadoraId ? "flex gap-6 h-full items-start pb-4" : "h-full overflow-y-auto pr-2 custom-scrollbar"}>
              {activeOperadoraId ? (
                <>
                  {pastas.filter(p => (!activePastaId || p.id === activePastaId)).map(pasta => {
                    const urlsInPasta = groupedUrls[pasta.id] || [];
                    if (urlsInPasta.length === 0 && (searchTerm || selectedTag)) return null; // Esconde tópicos vazios se estiver pesquisando
                    return (
                      <div key={pasta.id} className="min-w-[340px] w-[340px] bg-gray-800/30 border border-gray-800 rounded-xl flex flex-col h-full overflow-hidden shrink-0 shadow-sm">
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                          <h3 className="font-bold text-gray-300 flex items-center gap-2 truncate pr-2">
                            <FolderPlus size={18} className="text-blue-500 shrink-0" /> <span className="truncate">{pasta.nome}</span>
                          </h3>
                          <span className="bg-gray-800 border border-gray-700/50 text-gray-400 text-[11px] py-0.5 px-2.5 rounded-full font-medium">{urlsInPasta.length}</span>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                          {urlsInPasta.length > 0 ? (
                            urlsInPasta.map(url => <UrlExecutor key={url.id} urlData={url} globalTags={globalTags} onDelete={handleDeleteUrl} onEdit={(data) => { setEditingUrl({ ...data, pasta_id: data.pasta_id ? pastaIdMap[data.pasta_id] || '' : '' }); setIsModalOpen(true); }} />)
                          ) : (
                            <div className="p-6 border border-dashed border-gray-700/50 rounded-xl text-center text-gray-500 text-sm bg-gray-900/20">
                              Nenhuma ação neste tópico.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {(!activePastaId) && (groupedUrls['geral'] || pastas.length === 0) && (
                    <div key="geral" className="min-w-[340px] w-[340px] bg-gray-800/30 border border-gray-800 rounded-xl flex flex-col h-full overflow-hidden shrink-0 shadow-sm">
                      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                        <h3 className="font-bold text-gray-300 flex items-center gap-2">
                          Ações Gerais
                        </h3>
                        <span className="bg-gray-800 border border-gray-700/50 text-gray-400 text-[11px] py-0.5 px-2.5 rounded-full font-medium">{groupedUrls['geral']?.length || 0}</span>
                      </div>
                      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                        {groupedUrls['geral']?.length > 0 ? (
                          groupedUrls['geral'].map(url => <UrlExecutor key={url.id} urlData={url} globalTags={globalTags} onDelete={handleDeleteUrl} onEdit={(data) => { setEditingUrl({ ...data, pasta_id: data.pasta_id ? pastaIdMap[data.pasta_id] || '' : '' }); setIsModalOpen(true); }} />)
                        ) : (
                          <div className="p-6 border border-dashed border-gray-700/50 rounded-xl text-center text-gray-500 text-sm bg-gray-900/20">
                            Nenhuma ação encontrada.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
              Object.keys(groupedUrls).length === 0 ? (
                <div className="text-center py-20 bg-gray-800/50 border border-gray-800 rounded-xl text-gray-400">
                  Nenhuma ação encontrada.
                </div>
              ) : (
                Object.keys(groupedUrls).map(pastaId => {
                  const pastaName = pastaId === 'geral' ? 'Ações Gerais' : pastas.find(p => p.id === pastaId)?.nome || 'Outros';
                  const isCollapsed = collapsedTopics[pastaId] !== false;
                  return (
                    <div key={pastaId} className="mb-10">
                      <h3 onClick={() => toggleTopic(pastaId)} className="text-lg font-bold text-gray-300 mb-4 border-b border-gray-800 pb-2 flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none">
                        {isCollapsed ? <ChevronRight size={18} className="text-gray-600" /> : <ChevronDown size={18} className="text-gray-600" />} {pastaName}
                      </h3>
                      {!isCollapsed && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                          {groupedUrls[pastaId].map(url => <UrlExecutor key={url.id} urlData={url} globalTags={globalTags} onDelete={handleDeleteUrl} onEdit={(data) => { setEditingUrl({ ...data, pasta_id: data.pasta_id ? pastaIdMap[data.pasta_id] || '' : '' }); setIsModalOpen(true); }} />)}
                        </div>
                      )}
                    </div>
                  )
                })
              )
              )}
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <UrlModal onClose={() => setIsModalOpen(false)} onSave={handleSaveUrl} operadoras={operadoras} pastas={pastas} globalTags={globalTags} preSelectedOp={activeOperadoraId} preSelectedPasta={activePastaId} urlToEdit={editingUrl} />
      )}

      {isTopicModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{activePastaId ? 'Nova Subpasta' : 'Novo Tópico (Pasta)'}</h2>
              <button onClick={() => setIsTopicModalOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateTopicSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">{activePastaId ? 'Nome da(s) Subpasta(s)' : 'Nome do(s) Tópico(s)'}</label>
                <input required type="text" placeholder={activePastaId ? "Ex: Interno, Produção..." : "Ex: Banco de Dados, Cache..."} autoFocus
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={topicName} onChange={(e) => setTopicName(e.target.value)} />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] text-gray-500">Dica: Separe por vírgula para criar vários.</span>
                  <button type="button" onClick={() => setTopicName('Catalogo, Carrinho, CDN, Ferramentas, Documentação')} className="text-[10px] text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    + Preencher Padrão
                  </button>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsTopicModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium">Cancelar</button>
                <button type="submit" disabled={isCreatingTopic} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">
                  {isCreatingTopic ? 'Salvando...' : (activePastaId ? 'Criar Subpasta' : 'Criar Tópico')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
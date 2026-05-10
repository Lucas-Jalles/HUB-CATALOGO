import React, { useState, useEffect, useMemo } from 'react';
import { api } from './api';
import { Plus, FolderKanban, Tags, User, Settings as SettingsIcon, Trash2, LogOut, Edit2, Check, X, ArrowUp, ArrowDown, Shield, Key, FolderPlus, Palette } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Settings() {
  const { user, logout, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('operadoras');
  
  // Estados do formulário
  const [newNome, setNewNome] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCatNome, setNewCatNome] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSenha, setNewSenha] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [editingOpId, setEditingOpId] = useState(null);
  const [editNome, setEditNome] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editingCatOriginalNome, setEditingCatOriginalNome] = useState(null);
  const [editingCatNome, setEditingCatNome] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserSenha, setEditUserSenha] = useState('');
  const [editUserRole, setEditUserRole] = useState('user');
  const [myNewPassword, setMyNewPassword] = useState('');

  const { data: operadoras = [], isLoading: loadingOperadoras } = useQuery({
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

  const { data: rawPastas = [], isLoading: loadingPastas } = useQuery({
    queryKey: ['pastas'],
    queryFn: async () => (await api.get('', { params: { action: 'get_pastas' } })).data.data || []
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

  const { data: tagsGlobais = [], isLoading: loadingTags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await api.get('', { params: { action: 'get_tags' } })).data.data || []
  });

  const { data: usuarios = [], isLoading: loadingUsuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => (await api.get('', { params: { action: 'get_usuarios' } })).data.data || [],
    enabled: isAdmin
  });

  const loading = loadingOperadoras || loadingPastas || loadingTags || (isAdmin && loadingUsuarios);

  const { mutate: createOperadora, isPending: isCreatingOp } = useMutation({
    mutationFn: (newData) => api.post('', { action: 'create_operadora', data: newData }),
    onSuccess: () => {
      setNewNome('');
      setNewDesc('');
      alert("✅ Pasta salva com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['operadoras'] });
    },
    onError: (e) => {
      console.error("Erro ao criar", e);
      alert("❌ Falha na conexão. Verifique o console.");
    }
  });

  const handleCreateOperadora = (e) => {
    e.preventDefault();
    createOperadora({ nome: newNome, descricao: newDesc });
  };

  const { mutate: deleteOperadora } = useMutation({
    mutationFn: (id) => api.post('', { action: 'delete_operadora', data: { id } }),
    onSuccess: () => {
      alert('✅ Pasta apagada!');
      queryClient.invalidateQueries({ queryKey: ['operadoras'] });
    },
    onError: () => alert('❌ Falha na conexão.'),
  });

  const handleDeleteOperadora = (id) => {
    if (!window.confirm('Tem certeza que deseja apagar esta pasta? Todas as URLs dentro dela ficarão "sem pasta".')) return;
    deleteOperadora(id);
  };

  const handleStartEdit = (op) => {
    setEditingOpId(op.id);
    setEditNome(op.nome);
    setEditDesc(op.descricao);
  };

  const { mutate: saveEdit } = useMutation({
    mutationFn: (data) => api.post('', { action: 'update_operadora', data }),
    onSuccess: () => {
      setEditingOpId(null);
      queryClient.invalidateQueries({ queryKey: ['operadoras'] });
    },
    onError: () => alert('❌ Falha na conexão.'),
  });

  const handleSaveEdit = (id) => {
    saveEdit({ id, nome: editNome, descricao: editDesc });
  };

  const handleMove = (index, direction) => {
    const newOps = [...operadoras];
    if (direction === 'up' && index > 0) {
      [newOps[index - 1], newOps[index]] = [newOps[index], newOps[index - 1]];
    } else if (direction === 'down' && index < newOps.length - 1) {
      [newOps[index + 1], newOps[index]] = [newOps[index], newOps[index + 1]];
    }
    queryClient.setQueryData(['operadoras'], newOps);
    localStorage.setItem('operadorasOrder', JSON.stringify(newOps.map(o => o.id)));
    queryClient.invalidateQueries({ queryKey: ['operadoras'] });
  };

  const { mutate: createCategoria, isPending: isCreatingCat } = useMutation({
    mutationFn: (data) => api.post('', { action: 'create_pasta', data }),
    onSuccess: () => {
      setNewCatNome('');
      alert("✅ Categoria salva com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['pastas'] });
    },
    onError: (e) => {
      console.error("Erro ao criar categoria", e);
      alert("❌ Falha na conexão. Verifique o console.");
    }
  });

  const handleCreateCategoria = (e) => {
    e.preventDefault();
    createCategoria({ nome: newCatNome, operadora_id: 'global' });
  };

  const { mutate: deleteCategoria } = useMutation({
    mutationFn: (nome) => {
      const idsToDelete = rawPastas.filter(p => (p.nome || '').trim().toLowerCase() === nome.toLowerCase()).map(p => p.id);
      return Promise.all(idsToDelete.map(id => api.post('', { action: 'delete_pasta', data: { id } })));
    },
    onSuccess: () => {
      alert('✅ Tópico apagado!');
      queryClient.invalidateQueries({ queryKey: ['pastas'] });
    },
    onError: () => alert('❌ Falha na conexão.'),
  });

  const handleDeleteCategoria = (cat) => {
    if (!window.confirm(`Tem certeza que deseja apagar o tópico "${cat.nome}"? Todas as ações dentro dele ficarão "sem tópico".`)) return;
    deleteCategoria(cat.nome);
  };

  const handleStartEditCat = (cat) => {
    setEditingCatOriginalNome((cat.nome || '').trim().toLowerCase());
    setEditingCatNome(cat.nome);
  };

  const { mutate: saveEditCat } = useMutation({
    mutationFn: ({ originalNome, newNome }) => {
      const idsToUpdate = rawPastas.filter(p => (p.nome || '').trim().toLowerCase() === originalNome).map(p => p.id);
      return Promise.all(idsToUpdate.map(id => api.post('', { action: 'update_pasta', data: { id, nome: newNome } })));
    },
    onSuccess: () => {
      setEditingCatOriginalNome(null);
      queryClient.invalidateQueries({ queryKey: ['pastas'] });
    },
    onError: () => alert('❌ Falha na conexão.'),
  });

  const handleSaveEditCat = () => {
    if (!editingCatNome.trim()) return;
    saveEditCat({ originalNome: editingCatOriginalNome, newNome: editingCatNome });
  };

  const { mutate: createTag, isPending: isCreatingTag } = useMutation({
    mutationFn: (data) => api.post('', { action: 'create_tag', data }),
    onSuccess: () => {
      setNewTagName('');
      setNewTagColor('#3b82f6');
      alert("✅ Tag salva com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: () => alert("❌ Falha na conexão."),
  });

  const handleCreateTag = (e) => {
    e.preventDefault();
    createTag({ nome: newTagName, cor: newTagColor });
  };

  const { mutate: deleteTag } = useMutation({
    mutationFn: (id) => api.post('', { action: 'delete_tag', data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
    onError: () => alert('❌ Falha na conexão.'),
  });

  const handleDeleteTag = (id) => {
    if (!window.confirm('Tem certeza que deseja apagar esta tag? As URLs que a possuem perderão a cor.')) return;
    deleteTag(id);
  };

  const { mutate: createUsuario, isPending: isCreatingUser } = useMutation({
    mutationFn: (data) => api.post('', { action: 'create_usuario', data }),
    onSuccess: () => {
      setNewEmail('');
      setNewSenha('');
      setNewRole('user');
      alert("✅ Usuário criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: () => alert("❌ Falha na conexão."),
  });

  const handleCreateUsuario = (e) => {
    e.preventDefault();
    createUsuario({ email: newEmail.toLowerCase(), senha: newSenha, role: newRole });
  };

  const { mutate: deleteUsuario } = useMutation({
    mutationFn: (id) => api.post('', { action: 'delete_usuario', data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
    onError: () => alert('❌ Falha na conexão.'),
  });

  const handleDeleteUsuario = (id, email) => {
    if (!window.confirm(`Tem certeza que deseja remover o acesso do usuário ${email}?`)) return;
    deleteUsuario(id);
  };

  const { mutate: updateUsuario, isPending: isUpdatingUser } = useMutation({
    mutationFn: (data) => api.post('', { action: 'update_usuario', data }),
    onSuccess: () => {
      setEditingUserId(null);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: () => alert('❌ Falha na conexão.'),
  });

  const handleStartEditUser = (user) => {
    setEditingUserId(user.id);
    setEditUserRole(user.role || 'user');
    setEditUserSenha('');
  };

  const handleCancelEditUser = () => {
    setEditingUserId(null);
  };

  const handleSaveUserEdit = (id) => {
    const dataToUpdate = { id, role: editUserRole };
    if (editUserSenha.trim()) {
      dataToUpdate.senha = editUserSenha.trim();
    }
    updateUsuario(dataToUpdate);
  };

  const { mutate: changeMyPassword, isPending: isChangingMyPassword } = useMutation({
    mutationFn: (senha) => api.post('', { action: 'update_usuario', data: { id: user.id, senha } }),
    onSuccess: () => {
      setMyNewPassword('');
      alert("✅ Senha alterada com sucesso!");
    },
    onError: () => alert("❌ Falha ao alterar senha."),
  });

  const handleChangeMyPassword = (e) => {
    e.preventDefault();
    if (!user?.id) return alert("⚠️ Por segurança, você precisa encerrar a sessão e fazer login novamente para poder alterar sua senha agora.");
    changeMyPassword(myNewPassword);
  };

  return (
      <div className="flex-1 flex overflow-hidden bg-gray-900 border-l border-gray-800">
        
        {/* Sidebar Interna (Estilo Zoho CRM / Configurações) */}
        <div className="w-64 border-r border-gray-800 bg-gray-950/50 p-6 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <SettingsIcon size={20} className="text-blue-400" /> Ajustes
          </h2>
          <nav className="space-y-1.5">
            <button onClick={() => setActiveTab('operadoras')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeTab === 'operadoras' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FolderKanban size={18} /> Pastas / Projetos
            </button>
            <button onClick={() => setActiveTab('pastas')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeTab === 'pastas' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <FolderPlus size={18} /> Tópicos (Subpastas)
            </button>
            <button onClick={() => setActiveTab('tags')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeTab === 'tags' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Tags size={18} /> Etiquetas (Tags Globais)
            </button>
            <button onClick={() => setActiveTab('conta')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeTab === 'conta' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <User size={18} /> Meu Perfil
            </button>
            {isAdmin && (
              <button onClick={() => setActiveTab('usuarios')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeTab === 'usuarios' ? 'bg-red-500/10 text-red-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <Shield size={18} /> Gerenciar Acessos
              </button>
            )}
          </nav>
        </div>
        
        {/* Área de Conteúdo Principal */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'operadoras' && (
            <div className="max-w-4xl">
              <h3 className="text-2xl font-bold text-white mb-1">Pastas e Operadoras</h3>
              <p className="text-gray-400 text-sm mb-8">Crie e gerencie as pastas onde suas URLs serão organizadas.</p>
              
              {/* Formulário de Criação */}
              {isAdmin && (
                <form onSubmit={handleCreateOperadora} className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl mb-8 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Nome da Operadora</label>
                      <input required value={newNome} onChange={e => setNewNome(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors" placeholder="Ex: Operadora X" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                      <input value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors" placeholder="Detalhes do projeto..." />
                    </div>
                  </div>
                  <button type="submit" disabled={isCreatingOp} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                    {isCreatingOp ? 'Salvando...' : <><Plus size={18} /> Adicionar Operadora</>}
                  </button>
                </form>
              )}

              {/* Lista de Operadoras */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-900/50 border-b border-gray-700 text-gray-400 text-sm">
                      <th className="p-4 font-medium">Nome</th>
                      <th className="p-4 font-medium hidden sm:table-cell">Descrição</th>
                      <th className="p-4 font-medium text-right w-44">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="3" className="p-4 text-center text-gray-500">Carregando...</td></tr>
                    ) : operadoras.length === 0 ? (
                      <tr><td colSpan="3" className="p-4 text-center text-gray-500">Nenhuma operadora cadastrada.</td></tr>
                    ) : (
                      operadoras.map((op, index) => (
                        <tr key={op.id} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                          {editingOpId === op.id ? (
                            <>
                              <td className="p-3"><input value={editNome} onChange={e => setEditNome(e.target.value)} className="w-full bg-gray-950 border border-gray-600 text-white rounded-lg p-2 outline-none text-sm focus:border-blue-500" /></td>
                              <td className="p-3"><input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full bg-gray-950 border border-gray-600 text-white rounded-lg p-2 outline-none text-sm focus:border-blue-500" /></td>
                              <td className="p-3 text-right flex items-center justify-end gap-1 mt-1">
                                <button onClick={() => handleSaveEdit(op.id)} className="text-green-400 hover:bg-green-400/10 p-1.5 rounded transition-colors" title="Salvar"><Check size={18} /></button>
                                <button onClick={() => setEditingOpId(null)} className="text-gray-500 hover:bg-gray-800 hover:text-red-400 p-1.5 rounded transition-colors" title="Cancelar"><X size={18} /></button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-4 text-white font-medium flex items-center gap-2">
                                <FolderKanban size={16} className="text-gray-500" /> {op.nome}
                              </td>
                              <td className="p-4 text-gray-400 text-sm hidden sm:table-cell">{op.descricao}</td>
                              {isAdmin && (
                                <td className="p-4 text-right flex items-center justify-end gap-1">
                                  <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="text-gray-500 hover:text-white disabled:opacity-30 p-1.5 hover:bg-gray-800 rounded transition-colors" title="Subir Pasta"><ArrowUp size={16} /></button>
                                  <button onClick={() => handleMove(index, 'down')} disabled={index === operadoras.length - 1} className="text-gray-500 hover:text-white disabled:opacity-30 p-1.5 hover:bg-gray-800 rounded transition-colors" title="Descer Pasta"><ArrowDown size={16} /></button>
                                  <button onClick={() => handleStartEdit(op)} className="text-blue-400 hover:bg-blue-400/10 p-1.5 ml-2 rounded transition-colors" title="Editar"><Edit2 size={16} /></button>
                                  <button onClick={() => handleDeleteOperadora(op.id)} className="text-red-400 hover:bg-red-400/10 p-1.5 rounded transition-colors" title="Excluir"><Trash2 size={16} /></button>
                                </td>
                              )}
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'pastas' && (
            <div className="max-w-4xl">
              <h3 className="text-2xl font-bold text-white mb-2">Tópicos e Subpastas</h3>
              <p className="text-gray-400 text-sm mb-8">Gerencie os tópicos internos criados nas suas Pastas (Operadoras).</p>
              
              {/* Formulário de Criação de Categoria */}
              {isAdmin && (
                <form onSubmit={handleCreateCategoria} className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl mb-8 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Nome da Categoria/Tag</label>
                      <input required value={newCatNome} onChange={e => setNewCatNome(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors" placeholder="Ex: Cache, Relatórios, Config..." />
                    </div>
                  </div>
                  <button type="submit" disabled={isCreatingCat} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                    {isCreatingCat ? 'Salvando...' : <><Plus size={18} /> Criar Categoria</>}
                  </button>
                </form>
              )}

              {/* Lista de Categorias */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  <p className="text-gray-500 p-4">Carregando...</p>
              ) : pastas.length === 0 ? (
                <p className="text-gray-500 p-4">Nenhuma pasta cadastrada.</p>
                ) : (
                pastas.map(cat => (
                    <div key={cat.id} className="bg-gray-800/80 border border-gray-700 p-4 rounded-xl flex items-start gap-3">
                      <FolderPlus className="text-blue-400 shrink-0 mt-0.5" size={18} />
                      <div className="flex-1 w-full overflow-hidden">
                        {editingCatOriginalNome === (cat.nome || '').trim().toLowerCase() ? (
                          <div className="flex items-center gap-2 w-full mt-0.5">
                            <input value={editingCatNome} onChange={e => setEditingCatNome(e.target.value)} className="w-full bg-gray-950 border border-gray-600 text-white rounded-lg p-1.5 outline-none text-sm focus:border-blue-500" autoFocus />
                            <button onClick={handleSaveEditCat} className="text-green-400 hover:bg-green-400/10 p-1 rounded transition-colors" title="Salvar"><Check size={16} /></button>
                            <button onClick={() => setEditingCatOriginalNome(null)} className="text-gray-500 hover:bg-gray-800 hover:text-red-400 p-1 rounded transition-colors" title="Cancelar"><X size={16} /></button>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start w-full">
                              <h4 className="text-white font-medium truncate pr-2">{cat.nome}</h4>
                              {isAdmin && (
                                <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity shrink-0">
                                  <button onClick={() => handleStartEditCat(cat)} className="text-blue-400 hover:bg-blue-400/10 p-1 rounded transition-colors" title="Editar"><Edit2 size={14} /></button>
                                  <button onClick={() => handleDeleteCategoria(cat)} className="text-red-400 hover:bg-red-400/10 p-1 rounded transition-colors" title="Excluir"><Trash2 size={14} /></button>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">Tópico Global</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="max-w-4xl">
              <h3 className="text-2xl font-bold text-white mb-2">Etiquetas Globais (Tags)</h3>
              <p className="text-gray-400 text-sm mb-8">Crie etiquetas coloridas para classificar e visualizar as URLs facilmente.</p>
              
              {isAdmin && (
                <form onSubmit={handleCreateTag} className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl mb-8 shadow-sm flex flex-col md:flex-row items-end gap-4">
                  <div className="flex-1 w-full">
                    <label className="block text-sm text-gray-400 mb-1">Nome da Tag</label>
                    <input required value={newTagName} onChange={e => setNewTagName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500" placeholder="Ex: Urgente, Cache, Relatório..." />
                  </div>
                  <div className="w-full md:w-32">
                    <label className="block text-sm text-gray-400 mb-1">Cor</label>
                    <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} className="w-full h-[42px] bg-gray-900 border border-gray-700 rounded-lg cursor-pointer" />
                  </div>
                  <button type="submit" disabled={isCreatingTag} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 h-[42px]">
                    {isCreatingTag ? 'Salvando...' : <><Plus size={18} /> Adicionar</>}
                  </button>
                </form>
              )}

              <div className="flex flex-wrap gap-3">
                {loading ? <p className="text-gray-500">Carregando...</p> : tagsGlobais.length === 0 ? <p className="text-gray-500">Nenhuma tag cadastrada.</p> : (
                  tagsGlobais.map(tag => (
                    <div key={tag.id} style={{ backgroundColor: `${tag.cor}20`, borderColor: tag.cor }} className="flex items-center gap-2 border px-3 py-1.5 rounded-lg">
                      <Palette size={14} style={{ color: tag.cor }} />
                      <span style={{ color: tag.cor }} className="text-sm font-bold uppercase tracking-wider">{tag.nome}</span>
                      {isAdmin && (
                        <button onClick={() => handleDeleteTag(tag.id)} className="ml-2 text-gray-500 hover:text-red-400 transition-colors"><X size={14} /></button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'conta' && (
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold text-white mb-2">Perfil</h3>
              <p className="text-gray-400 text-sm mb-8">Informações da sua sessão atual.</p>
              
              <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl mb-8 flex items-center gap-6">
                <div className="h-20 w-20 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-3xl font-bold border border-blue-500/30">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{user?.email}</h4>
                  <p className="text-gray-400 text-sm mt-1">{user?.role === 'admin' ? 'Administrador do Sistema' : 'Usuário Padrão'}</p>
                </div>
              </div>

              {isAdmin && (
                <form onSubmit={handleChangeMyPassword} className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl mb-8">
                  <h4 className="text-lg font-bold text-white mb-4">Alterar Minha Senha</h4>
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-sm text-gray-400 mb-1">Nova Senha</label>
                      <input required type="password" value={myNewPassword} onChange={e => setMyNewPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors" placeholder="Digite a nova senha..." />
                    </div>
                    <button type="submit" disabled={isChangingMyPassword} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                      {isChangingMyPassword ? 'Salvando...' : <><Key size={18} /> Atualizar Senha</>}
                    </button>
                  </div>
                </form>
              )}

              <button onClick={logout} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                <LogOut size={18} /> Encerrar Sessão
              </button>
            </div>
          )}

          {activeTab === 'usuarios' && isAdmin && (
            <div className="max-w-4xl">
              <h3 className="text-2xl font-bold text-white mb-1">Gerenciar Acessos (Admin)</h3>
              <p className="text-gray-400 text-sm mb-8">Crie novos usuários com acesso liberado à plataforma.</p>
              
              <form onSubmit={handleCreateUsuario} className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl mb-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email do Novo Usuário</label>
                    <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors" placeholder="Ex: joao@empresa.com" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Senha Provisória</label>
                    <input required type="password" value={newSenha} onChange={e => setNewSenha(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors" placeholder="Digite uma senha forte..." />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Função (Permissão)</label>
                    <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors">
                      <option value="user">Usuário Comum</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={isCreatingUser} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                  {isCreatingUser ? 'Salvando...' : <><Key size={18} /> Criar Usuário</>}
                </button>
              </form>

              <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-900/50 border-b border-gray-700 text-gray-400 text-sm">
                      <th className="p-4 font-medium">Usuário</th>
                      <th className="p-4 font-medium">Função</th>
                      <th className="p-4 font-medium">Cadastrado em</th>
                      <th className="p-4 font-medium text-right w-24">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="3" className="p-4 text-center text-gray-500">Carregando...</td></tr>
                    ) : (
                      usuarios.map((usr) => (
                        <tr key={usr.id} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors h-[69px]">
                          {editingUserId === usr.id ? (
                            <>
                              <td className="p-3 text-white font-medium flex items-center gap-2"><User size={16} className="text-gray-500" /> {usr.email}</td>
                              <td className="p-3">
                                <select value={editUserRole} onChange={e => setEditUserRole(e.target.value)} className="w-full bg-gray-950 border border-gray-600 text-white rounded-lg p-2 outline-none text-sm focus:border-blue-500">
                                  <option value="user">Usuário Comum</option>
                                  <option value="admin">Administrador</option>
                                </select>
                              </td>
                              <td className="p-3"><input type="password" value={editUserSenha} onChange={e => setEditUserSenha(e.target.value)} placeholder="Nova senha (deixe em branco)" className="w-full bg-gray-950 border border-gray-600 text-white rounded-lg p-2 outline-none text-sm focus:border-blue-500" /></td>
                              <td className="p-3 text-right flex items-center justify-end gap-1">
                                <button onClick={() => handleSaveUserEdit(usr.id)} disabled={isUpdatingUser} className="text-green-400 hover:bg-green-400/10 p-1.5 rounded transition-colors" title="Salvar"><Check size={18} /></button>
                                <button onClick={handleCancelEditUser} className="text-gray-500 hover:bg-gray-800 hover:text-red-400 p-1.5 rounded transition-colors" title="Cancelar"><X size={18} /></button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-4 text-white font-medium flex items-center gap-2"><User size={16} className="text-gray-500" /> {usr.email}</td>
                              <td className="p-4 text-gray-400 text-sm">{usr.role === 'admin' ? 'Administrador' : 'Usuário'}</td>
                              <td className="p-4 text-gray-400 text-sm">{new Date(usr.criado_em).toLocaleDateString('pt-BR')}</td>
                              <td className="p-4 text-right flex items-center justify-end gap-1">
                                <button onClick={() => handleStartEditUser(usr)} className="text-blue-400 hover:bg-blue-400/10 p-1.5 rounded transition-colors" title="Editar"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteUsuario(usr.id, usr.email)} className="text-red-400 hover:bg-red-400/10 p-1.5 rounded transition-colors" title="Remover Acesso"><Trash2 size={16} /></button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
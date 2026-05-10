import React, { useState, useEffect } from 'react';
import { Copy, Trash2, Check, Zap, ListFilter, ArrowRight, Plus, X, Type, Code, Map, Search, Globe, CheckSquare, Link2, FileEdit, Repeat, Send, PlayCircle, Save, Folder, History, Shield, Play } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLocalStorage } from './useLocalStorage';
import ApiRunnerTool from './ApiRunnerTool';

function ListSeparatorTool() {
  const [tabs, setTabs] = useLocalStorage('automation_separator_tabs', [{
      id: Date.now(),
      name: 'Lista 1',
      input: '',
      mode: 'list',
      separator: ', ',
      itemWrapper: 'none',
      listWrapper: 'none',
      removeDuplicates: true,
  }]);
  
  const [activeTabId, setActiveTabId] = useState(() => {
    const saved = localStorage.getItem('automation_separator_activeTab');
    const parsedId = saved ? parseInt(saved, 10) : null;
    if (parsedId && tabs.find(t => t.id === parsedId)) return parsedId;
    return tabs[0].id;
  });
  const [copied, setCopied] = useState(false);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const updateActiveTab = (updates) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t));
  };

  const processList = () => {
    if (!activeTab.input) return { output: '', count: 0 };
    
    // Limpa espaços vazios e ignora linhas em branco
    let lines = activeTab.input.split('\n').map(line => line.trim()).filter(line => line !== '');
    
    if (activeTab.mode === 'key_value') {
      const pairs = [];
      for (let i = 0; i < lines.length; i += 2) {
        const key = lines[i];
        const val = lines[i+1] !== undefined ? lines[i+1] : '';
        let fKey = key;
        let fVal = val;
        if (activeTab.itemWrapper === 'quotes') { fKey = `"${key}"`; fVal = `"${val}"`; }
        else if (activeTab.itemWrapper === 'single_quotes') { fKey = `'${key}'`; fVal = `'${val}'`; }
        pairs.push(`${fKey}: ${fVal}`);
      }
      lines = pairs;
    } else {
      // Adiciona o caractere de envolvimento item a item
      if (activeTab.itemWrapper === 'quotes') lines = lines.map(l => `"${l}"`);
      else if (activeTab.itemWrapper === 'single_quotes') lines = lines.map(l => `'${l}'`);
    }

    if (activeTab.removeDuplicates) {
      lines = [...new Set(lines)];
    }
    
    // Permite que o usuário digite \n na caixinha para forçar quebra de linha
    const realSeparator = activeTab.separator.replace(/\\n/g, '\n');
    
    let joinedOutput = lines.join(realSeparator);

    // Envolve a lista inteira (Array / Objeto)
    if (activeTab.listWrapper === 'brackets') joinedOutput = `[${joinedOutput}]`;
    else if (activeTab.listWrapper === 'braces') joinedOutput = `{${joinedOutput}}`;
    
    return { output: joinedOutput, count: lines.length };
  };

  // Calculamos o resultado de forma dinâmica e instantânea (não precisa salvar no estado)
  const { output, count: resultCount } = processList();

  const addNewTab = () => {
    const newId = Date.now();
    setTabs(prev => [...prev, {
      id: newId,
      name: `Lista ${prev.length + 1}`,
      input: '',
      mode: 'list',
      separator: ', ',
      itemWrapper: 'none',
      listWrapper: 'none',
      removeDuplicates: true,
    }]);
    setActiveTabId(newId);
  };

  const closeTab = (e, id) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
  };

  const handleRenameTab = (e, tab) => {
    e.stopPropagation();
    const newName = prompt('Renomear lista:', tab.name);
    if (newName && newName.trim()) {
      setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, name: newName.trim() } : t));
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-900 h-full">
      <header className="shrink-0 border-b border-gray-800 p-4 bg-gray-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <Zap size={20} className="text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Automações</h2>
              <p className="text-xs text-gray-400">Tratamento e formatação de listas de dados</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => updateActiveTab({ input: '' })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-gray-800/80 text-red-400 border border-gray-700/50 hover:bg-red-500/10 hover:border-red-500/30">
              <Trash2 size={14} /> Limpar Aba Atual
            </button>
            <button onClick={handleCopy} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${copied ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30'}`}>
              {copied ? <Check size={14} /> : <Copy size={14} />} Copiar Resultado
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-2 bg-gray-900/50 border-b border-gray-800 overflow-x-auto custom-scrollbar shrink-0">
          {tabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              onDoubleClick={(e) => handleRenameTab(e, tab)}
              className={`group flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm cursor-pointer border-b-2 transition-colors shrink-0 select-none
                ${activeTabId === tab.id ? 'bg-gray-800 text-blue-400 border-blue-500' : 'text-gray-400 border-transparent hover:bg-gray-800/50 hover:text-gray-300'}
              `}
              title="Dê um duplo clique para renomear"
            >
              <ListFilter size={14} className={activeTabId === tab.id ? "text-blue-500" : "text-gray-500"} />
              {tab.name}
              {tabs.length > 1 && (
                <button 
                  onClick={(e) => closeTab(e, tab.id)} 
                  className={`p-0.5 rounded-md hover:bg-gray-700 transition-colors ${activeTabId === tab.id ? 'text-gray-400 hover:text-white' : 'opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300'}`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addNewTab} className="p-1.5 ml-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors mb-1 shrink-0" title="Nova Aba de Automação">
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Painel Esquerdo: Input */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-950/50">
            <div className="p-3 bg-gray-900 border-b border-gray-800 flex items-center gap-2 shrink-0">
              <ListFilter size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-300">Lista Original (Cole aqui)</span>
              <span className="ml-auto text-xs text-gray-500">{activeTab.input.split('\n').filter(l => l.trim() !== '').length} linhas originais</span>
            </div>
            <textarea
              value={activeTab.input}
              onChange={(e) => updateActiveTab({ input: e.target.value })}
              placeholder={`Exemplo:\nTIM LIVE 300 MEGA\nTIM LIVE 300 MEGA\nTIM LIVE 400 MEGA\n\nOu cole seus números/CPFs aqui...`}
              className="flex-1 w-full bg-transparent p-4 text-gray-300 font-mono text-sm outline-none resize-none custom-scrollbar"
              spellCheck="false"
            />
          </div>

          {/* Painel Direito: Configurações e Output */}
          <div className="flex-1 flex flex-col bg-gray-950">
            <div className="p-4 bg-gray-900 border-b border-gray-800 shrink-0">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <ArrowRight size={16} className="text-gray-500" /> Configurações do Separador
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Modo:</label>
                  <select value={activeTab.mode || 'list'} onChange={(e) => updateActiveTab({ mode: e.target.value })} className="bg-gray-950 border border-gray-700 text-white rounded px-2 py-1 text-sm outline-none focus:border-blue-500 transition-colors font-mono cursor-pointer">
                    <option value="list">Lista Simples</option>
                    <option value="key_value">Chave-Valor (Pares)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Separar por:</label>
                  <input type="text" value={activeTab.separator} onChange={(e) => updateActiveTab({ separator: e.target.value })} placeholder="Ex: , ou \n" className="w-20 bg-gray-950 border border-gray-700 text-white rounded px-2 py-1 text-sm outline-none focus:border-blue-500 transition-colors font-mono" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Itens em:</label>
                  <select value={activeTab.itemWrapper || 'none'} onChange={(e) => updateActiveTab({ itemWrapper: e.target.value })} className="bg-gray-950 border border-gray-700 text-white rounded px-2 py-1 text-sm outline-none focus:border-blue-500 transition-colors font-mono cursor-pointer">
                    <option value="none">Nenhum</option>
                    <option value="quotes">Aspas ("")</option>
                    <option value="single_quotes">Aspas Simples ('')</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Lista em:</label>
                  <select value={activeTab.listWrapper || 'none'} onChange={(e) => updateActiveTab({ listWrapper: e.target.value })} className="bg-gray-950 border border-gray-700 text-white rounded px-2 py-1 text-sm outline-none focus:border-blue-500 transition-colors font-mono cursor-pointer">
                    <option value="none">Nenhum</option>
                    <option value="brackets">Colchetes ([])</option>
                    <option value="braces">Chaves ({})</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none hover:text-white transition-colors">
                  <input type="checkbox" checked={activeTab.removeDuplicates} onChange={(e) => updateActiveTab({ removeDuplicates: e.target.checked })} className="rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500" />
                  Remover Duplicatas
                </label>
              </div>
            </div>
            
            <div className="flex-1 relative flex flex-col">
              <div className="p-2 bg-gray-900/50 border-b border-gray-800 flex justify-between items-center shrink-0">
                <span className="text-xs font-medium text-gray-400 px-2">Resultado Final</span>
                <span className="text-xs text-gray-500 px-2">{resultCount} itens</span>
              </div>
              <textarea readOnly value={output} placeholder="O resultado aparecerá aqui..." className="flex-1 w-full bg-transparent p-4 text-green-400 font-mono text-sm outline-none resize-none custom-scrollbar" />
            </div>
          </div>
        </div>
    </div>
  );
}

const fetchUFs = async () => {
  const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
  if (!res.ok) throw new Error('Falha ao buscar estados (UFs) do IBGE.');
  return res.json();
};

const fetchMunicipios = async (uf) => {
  if (!uf) return [];
  const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
  if (!res.ok) throw new Error('Falha ao buscar municípios do IBGE.');
  return res.json();
};

function RegionalizationTool() {
  const [finalList, setFinalList] = useLocalStorage('automation_reg_finalList', []);
  const [searchQuery, setSearchQuery] = useLocalStorage('automation_reg_search', '');
  const [copied, setCopied] = useState(false);
  const [selectedCities, setSelectedCities] = useState(() => {
    const saved = localStorage.getItem('automation_reg_selectedCities');
    if (saved) {
      try { return new Set(JSON.parse(saved)); } catch (e) {}
    }
    return new Set();
  });

  // Input States
  const [selectedUF, setSelectedUF] = useLocalStorage('automation_reg_uf', '');
  const [isFetchingCities, setIsFetchingCities] = useState(false);
  const [manualInput, setManualInput] = useLocalStorage('automation_reg_manualInput', '');

  const { data: ufs = [], isLoading: isLoadingUFs } = useQuery({ queryKey: ['ufs_ibge'], queryFn: fetchUFs });

  useEffect(() => { localStorage.setItem('automation_reg_selectedCities', JSON.stringify([...selectedCities])); }, [selectedCities]);

  const handleAddState = async () => {
    if (!selectedUF) return;
    setIsFetchingCities(true);
    try {
      const cities = await fetchMunicipios(selectedUF);
      const newItems = cities.map(c => `${c.nome.toUpperCase()}-${selectedUF.toUpperCase()}`);
      setFinalList(prev => [...new Set([...prev, ...newItems])].sort());
      setSelectedUF('');
    } catch (e) {
      alert('Erro ao buscar municípios do IBGE.');
    }
    setIsFetchingCities(false);
  };

  const handleAddText = () => {
    if (!manualInput.trim()) return;
    const lines = manualInput.split('\n').map(l => l.trim().toUpperCase()).filter(Boolean);
    const newItems = [];
    for (let i = 0; i < lines.length; i += 2) {
      const uf = lines[i];
      const municipio = lines[i + 1];
      if (uf && municipio) {
        newItems.push(`${municipio}-${uf}`);
      }
    }
    setFinalList(prev => [...new Set([...prev, ...newItems])].sort());
    setManualInput('');
  };

  const handleRemove = (itemToRemove) => {
    setFinalList(prev => prev.filter(item => item !== itemToRemove));
    setSelectedCities(prev => {
      const next = new Set(prev);
      next.delete(itemToRemove);
      return next;
    });
  };

  const toggleCitySelection = (city) => {
    setSelectedCities(prev => {
      const next = new Set(prev);
      if (next.has(city)) next.delete(city);
      else next.add(city);
      return next;
    });
  };

  const handleRemoveSelected = () => {
    setFinalList(prev => prev.filter(c => !selectedCities.has(c)));
    setSelectedCities(new Set());
  };

  const filteredList = finalList.filter(item => item.includes(searchQuery.toUpperCase()));

  const handleSelectAllFiltered = () => {
    const allFilteredSelected = filteredList.length > 0 && filteredList.every(item => selectedCities.has(item));
    setSelectedCities(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredList.forEach(item => next.delete(item));
      } else {
        filteredList.forEach(item => next.add(item));
      }
      return next;
    });
  };

  const handleCopy = () => {
    const text = JSON.stringify(finalList);
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-900 h-full">
      {/* LEFT PANEL: Inserção de Dados */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-950/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <Map size={18} className="text-blue-400" />
          <h3 className="font-bold text-white">Importar Regiões</h3>
        </div>
        <div className="p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          
          {/* Section 1: By State */}
          <div className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-xl">
            <label className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2"><Globe size={16} className="text-gray-500"/> Buscar do IBGE</label>
            <select value={selectedUF} onChange={e => setSelectedUF(e.target.value)} disabled={isLoadingUFs} className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors mb-3 text-sm cursor-pointer">
              <option value="">{isLoadingUFs ? 'Carregando UFs...' : 'Selecione um Estado (UF)'}</option>
              {ufs.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.nome} ({uf.sigla})</option>)}
            </select>
            <button onClick={handleAddState} disabled={!selectedUF || isFetchingCities} className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              {isFetchingCities ? 'Baixando...' : <><Plus size={16}/> Adicionar Municípios</>}
            </button>
          </div>

          {/* Section 2: By Text */}
          <div className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-xl flex-1 flex flex-col min-h-[250px]">
            <label className="text-sm font-medium text-gray-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2"><Type size={16} className="text-gray-500"/> Colar Lista</span>
            </label>
            <p className="text-[10px] text-gray-500 mb-3 leading-tight">Cole alternando as linhas: <br/>Linha 1 = UF, Linha 2 = Município.</p>
            <textarea value={manualInput} onChange={e => setManualInput(e.target.value)} placeholder="CE&#10;Iguatu&#10;CE&#10;Juazeiro do Norte" className="flex-1 w-full bg-gray-950 border border-gray-700 text-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors text-xs font-mono custom-scrollbar resize-none mb-3" spellCheck="false" />
            <button onClick={handleAddText} disabled={!manualInput.trim()} className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-auto">
              <Plus size={16}/> Processar Texto
            </button>
          </div>

        </div>
      </div>

      {/* RIGHT PANEL: Gerenciamento e Resultado */}
      <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 bg-gray-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="relative w-full sm:max-w-xs flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Pesquisar cidade..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors" />
            </div>
            {filteredList.length > 0 && (
              <button onClick={handleSelectAllFiltered} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded-lg transition-colors flex items-center justify-center shrink-0" title="Selecionar/Desmarcar todos os visíveis">
                <CheckSquare size={16} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-sm font-medium text-gray-400 mr-1">{filteredList.length} cidades</span>
            <div className="flex gap-2">
              {selectedCities.size > 0 && (
                <button onClick={handleRemoveSelected} className="text-sm text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 px-3 py-2 rounded-lg transition-colors flex items-center gap-2">
                  <Trash2 size={14}/> Remover ({selectedCities.size})
                </button>
              )}
              <button onClick={() => { setFinalList([]); setSelectedCities(new Set()); }} disabled={finalList.length===0} className="text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:hover:text-gray-400 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors flex items-center gap-2">
                <X size={14}/> Limpar Tudo
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-950">
          {filteredList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <Map size={48} className="mb-4 opacity-20" />
              <p className="text-gray-400 font-medium">Nenhuma cidade na lista.</p>
              <p className="text-sm mt-1">Importe utilizando o menu lateral.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 content-start">
              {filteredList.map(item => {
                const isSelected = selectedCities.has(item);
                return (
                  <div key={item} onClick={() => toggleCitySelection(item)} className={`group flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer transition-colors ${isSelected ? 'bg-red-500/10 border-red-500/50' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <input type="checkbox" checked={isSelected} readOnly className="rounded border-gray-600 bg-gray-900 text-red-500 focus:ring-red-500 cursor-pointer pointer-events-none shrink-0" />
                      <span className={`text-xs font-mono truncate ${isSelected ? 'text-red-400' : 'text-gray-300'}`} title={item}>{item}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleRemove(item); }} className={`opacity-50 group-hover:opacity-100 transition-all focus:opacity-100 outline-none shrink-0 ml-2 ${isSelected ? 'text-red-400 hover:text-red-300' : 'text-gray-500 hover:text-red-400'}`} title="Remover">
                      <X size={14}/>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Output */}
        <div className="p-4 border-t border-gray-800 bg-gray-900 shrink-0">
          <label className="text-xs font-medium text-gray-400 mb-2 block">Resultado JSON</label>
          <div className="flex gap-2">
            <input readOnly value={JSON.stringify(finalList)} className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-green-400 font-mono text-sm outline-none cursor-default" />
            <button onClick={handleCopy} className={`px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors border ${copied ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-lg shadow-blue-500/20'}`}>
              {copied ? <Check size={16}/> : <Copy size={16}/>} Copiar JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegulationLinkerTool() {
  const [rawInput, setRawInput] = useLocalStorage('automation_linker_rawInput', '');
  const [items, setItems] = useLocalStorage('automation_linker_items', []);
  const [copiedResult, setCopiedResult] = useState(false);
  const [copiedUrlId, setCopiedUrlId] = useState(null);

  const processUrls = () => {
    if (!rawInput.trim()) return;
    const lines = rawInput.split('\n').map(l => l.trim()).filter(Boolean);
    const newItems = lines.map((url, idx) => {
      let sku = '';
      try {
        const decoded = decodeURIComponent(url);
        // Pega o nome do arquivo, remove .pdf e pega o que vier antes do primeiro espaço ou underline
        const filename = decoded.split('/').pop().replace(/\.pdf$/i, '');
        sku = filename.split(/_|\s/)[0]; 
      } catch (e) {
        sku = 'ERRO';
      }
      return {
        id: Date.now() + idx,
        originalUrl: url,
        sku: sku,
        shortUrl: ''
      };
    });
    setItems(newItems);
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlId(id);
    setTimeout(() => setCopiedUrlId(null), 2000);
  };

  const finalResult = items.map(item => `SKU - ${item.sku} || CDN - ${item.originalUrl} || Encurtador de URL - ${item.shortUrl || '...'}`).join('\n');

  const handleCopyResult = () => {
    if (!finalResult) return;
    navigator.clipboard.writeText(finalResult);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-900 h-full">
      {/* Painel Esquerdo: Input das URLs */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-950/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <Link2 size={18} className="text-blue-400" />
          <h3 className="font-bold text-white">Gerenciador de Links</h3>
        </div>
        <div className="p-4 flex flex-col flex-1 overflow-hidden">
          <label className="text-sm font-medium text-gray-300 mb-2">1. Cole as URLs da CDN</label>
          <textarea value={rawInput} onChange={(e) => setRawInput(e.target.value)} placeholder="https://automatuslab.blob.core.../TLBL0001.pdf" className="flex-1 w-full bg-gray-950 border border-gray-700 text-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors text-xs font-mono custom-scrollbar resize-none mb-3" spellCheck="false" />
          <button onClick={processUrls} disabled={!rawInput.trim()} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0">
            <Zap size={16} /> Extrair SKUs
          </button>
        </div>
      </div>

      {/* Painel Direito: Cartões e Resultado */}
      <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gray-900/80 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-white">2. Processamento ({items.length} itens)</h3>
          <button onClick={() => setItems([])} className="text-sm text-red-400 hover:text-red-300 transition-colors">Limpar Tudo</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <Link2 size={48} className="mb-4 opacity-20" />
              <p className="text-gray-400 font-medium">Nenhum link processado.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="w-full sm:w-1/3">
                    <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1 block">SKU Extraído</label>
                    <input value={item.sku} onChange={(e) => updateItem(item.id, 'sku', e.target.value)} className="w-full bg-gray-950 border border-gray-600 text-white rounded-lg p-2 text-sm focus:border-blue-500 outline-none transition-colors" />
                  </div>
                  <div className="w-full sm:w-2/3">
                    <label className="text-[11px] font-bold text-green-400 uppercase tracking-wider mb-1 block">URL Curta (Bitly)</label>
                    <input value={item.shortUrl} onChange={(e) => updateItem(item.id, 'shortUrl', e.target.value)} placeholder="Cole o link curto aqui..." className="w-full bg-gray-950 border border-green-500/30 text-green-400 rounded-lg p-2 text-sm focus:border-green-500 outline-none transition-colors placeholder-gray-600" />
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800">
                  <span className="text-xs text-gray-500 truncate flex-1 font-mono" title={item.originalUrl}>{item.originalUrl}</span>
                  <button onClick={() => handleCopyUrl(item.originalUrl, item.id)} className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md text-xs transition-colors shrink-0">
                    {copiedUrlId === item.id ? <Check size={14} className="text-green-400"/> : <Copy size={14}/>} Copiar CDN
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-950 shrink-0">
          <label className="text-sm font-medium text-gray-300 mb-2 block">3. Resultado Formatado</label>
          <div className="flex gap-2 h-24">
            <textarea readOnly value={finalResult} placeholder="SKU - [SKU] || CDN - [URL] || Encurtador de URL - [URL CURTA]" className="flex-1 w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-blue-400 font-mono text-xs outline-none resize-none custom-scrollbar cursor-default" />
            <button onClick={handleCopyResult} className={`px-4 rounded-lg font-medium text-sm flex flex-col items-center justify-center gap-2 transition-colors border ${copiedResult ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-lg shadow-blue-500/20'}`}>
              {copiedResult ? <Check size={20}/> : <Copy size={20}/>} Copiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function JsonOfferEditorTool() {
  const [rawInput, setRawInput] = useLocalStorage('automation_offer_rawInput', '');
  const [offerData, setOfferData] = useLocalStorage('automation_offer_data', []);
  const [copied, setCopied] = useState(false);

  const loadJson = () => {
    try {
      const parsed = JSON.parse(rawInput);
      if (Array.isArray(parsed)) {
        setOfferData(parsed);
      } else {
        alert('O JSON fornecido deve ser uma lista (Array). Começando com [ e terminando com ]');
      }
    } catch (e) {
      alert('JSON Inválido. Verifique a sintaxe.');
    }
  };

  const updateBlockLabel = (blockIdx, val) => {
    const newData = [...offerData];
    newData[blockIdx].label = val;
    setOfferData(newData);
  };

  const updateStringContent = (blockIdx, contentIdx, val) => {
    const newData = [...offerData];
    newData[blockIdx].content[contentIdx] = val;
    setOfferData(newData);
  };

  const updateObjectContent = (blockIdx, contentIdx, field, val) => {
    const newData = [...offerData];
    newData[blockIdx].content[contentIdx][field] = val;
    setOfferData(newData);
  };

  const addContent = (blockIdx, isObject) => {
    const newData = [...offerData];
    if (isObject) {
      newData[blockIdx].content.push({ image: "", label: "" });
    } else {
      newData[blockIdx].content.push("");
    }
    setOfferData(newData);
  };

  const removeContent = (blockIdx, contentIdx) => {
    const newData = [...offerData];
    newData[blockIdx].content.splice(contentIdx, 1);
    setOfferData(newData);
  };

  const handleCopy = () => {
    const text = JSON.stringify(offerData);
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-900 h-full">
      {/* Painel Esquerdo: Input / Output */}
      <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-950/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <FileEdit size={18} className="text-blue-400" />
          <h3 className="font-bold text-white">Editor de Ofertas JSON</h3>
        </div>
        
        <div className="p-4 flex flex-col gap-4 border-b border-gray-800 flex-1">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">1. Cole o JSON Bruto</label>
          <textarea value={rawInput} onChange={e => setRawInput(e.target.value)} placeholder='[{"type":"codeOffer"...}]' className="flex-1 w-full bg-gray-950 border border-gray-700 text-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors text-xs font-mono custom-scrollbar resize-none" spellCheck="false" />
        <button onClick={loadJson} disabled={!(rawInput || '').trim()} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            <Zap size={16}/> Carregar Formulário
          </button>
        </div>

        <div className="p-4 flex flex-col h-48 bg-gray-900 shrink-0">
          <label className="text-sm font-medium text-gray-300 mb-2 block">3. JSON Atualizado</label>
          <div className="flex gap-2 h-full">
          <textarea readOnly value={JSON.stringify(Array.isArray(offerData) ? offerData : [])} className="flex-1 w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-green-400 font-mono text-xs outline-none resize-none custom-scrollbar cursor-default" />
          <button onClick={handleCopy} disabled={!Array.isArray(offerData) || offerData.length === 0} className={`px-4 rounded-lg font-medium text-sm flex flex-col items-center justify-center gap-2 transition-colors border disabled:opacity-50 ${copied ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'}`}>
              {copied ? <Check size={20}/> : <Copy size={20}/>} Copiar
            </button>
          </div>
        </div>
      </div>

      {/* Painel Direito: Formulário Visual */}
      <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gray-900/80 shrink-0">
          <h3 className="font-bold text-white">2. Editar Valores</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        {!Array.isArray(offerData) || offerData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <FileEdit size={48} className="mb-4 opacity-20" />
              <p className="text-gray-400 font-medium">Nenhum JSON carregado.</p>
            </div>
          ) : (
            offerData.map((block, blockIdx) => {
              const isObjectList = ['imageList', 'crossell'].includes(block.type);
              return (
                <div key={blockIdx} className="bg-gray-800/40 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4 border-b border-gray-700/50 pb-3">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider border border-blue-500/30">
                      {block.type}
                    </span>
                    {block.label !== null && block.label !== undefined && (
                      <input value={block.label} onChange={(e) => updateBlockLabel(blockIdx, e.target.value)} placeholder="Label do bloco..." className="bg-gray-950 border border-gray-600 text-white rounded p-1 text-xs w-1/2 outline-none focus:border-blue-500 ml-4" />
                    )}
                  </div>

                  <div className="space-y-2">
                    {block.content && block.content.map((contentItem, contentIdx) => (
                      <div key={contentIdx} className="flex gap-2 items-start bg-gray-950/50 p-2 rounded-lg border border-gray-800/80">
                        {isObjectList ? (
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input value={contentItem.image || ''} onChange={(e) => updateObjectContent(blockIdx, contentIdx, 'image', e.target.value)} placeholder="Nome da imagem (ex: LOGO.png)" className="bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs outline-none focus:border-blue-500 w-full" />
                            <input value={contentItem.label || ''} onChange={(e) => updateObjectContent(blockIdx, contentIdx, 'label', e.target.value)} placeholder="Label/Texto" className="bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs outline-none focus:border-blue-500 w-full" />
                          </div>
                        ) : (
                          <textarea value={contentItem} onChange={(e) => updateStringContent(blockIdx, contentIdx, e.target.value)} className="flex-1 bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs outline-none focus:border-blue-500 resize-none h-10 custom-scrollbar" />
                        )}
                        <button onClick={() => removeContent(blockIdx, contentIdx)} className="text-gray-500 hover:text-red-400 p-2 rounded hover:bg-gray-800 transition-colors shrink-0"><Trash2 size={14}/></button>
                      </div>
                    ))}
                    <button onClick={() => addContent(blockIdx, isObjectList)} className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 mt-3 px-2 py-1 hover:bg-gray-800 rounded transition-colors">
                      <Plus size={14}/> Adicionar Item
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function MultiReplaceTool() {
  const [input, setInput] = useLocalStorage('automation_replace_input', '');
  const [rules, setRules] = useLocalStorage('automation_replace_rules', [{ id: Date.now(), from: '', to: '' }]);
  const [copied, setCopied] = useState(false);

  const addRule = () => setRules([...rules, { id: Date.now(), from: '', to: '' }]);
  const removeRule = (id) => setRules(rules.filter(r => r.id !== id));
  const updateRule = (id, field, val) => setRules(rules.map(r => r.id === id ? { ...r, [field]: val } : r));

  // Processamento em tempo real
  const output = React.useMemo(() => {
    let res = input;
    rules.forEach(r => {
      if (r.from) {
        // split e join funciona como replaceAll sem quebrar com caracteres especiais
        res = res.split(r.from).join(r.to);
      }
    });
    return res;
  }, [input, rules]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-900 h-full">
      {/* Coluna 1: Input */}
      <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-950/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Repeat size={18} className="text-blue-400" />
            <h3 className="font-bold text-white">Substituição Múltipla</h3>
          </div>
          <button onClick={() => setInput('')} className="text-xs text-red-400 hover:text-red-300">Limpar Texto</button>
        </div>
        <div className="p-4 flex flex-col flex-1 overflow-hidden">
          <label className="text-sm font-medium text-gray-300 mb-2 block">1. Cole o Texto ou Múltiplos JSONs</label>
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Cole aqui todo o seu código..." className="flex-1 w-full bg-gray-950 border border-gray-700 text-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors text-xs font-mono custom-scrollbar resize-none" spellCheck="false" />
        </div>
      </div>

      {/* Coluna 2: Regras */}
      <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-900 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800 bg-gray-900/80 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-white">2. Regras de Troca</h3>
          <button onClick={() => setRules([{ id: Date.now(), from: '', to: '' }])} className="text-xs text-red-400 hover:text-red-300">Zerar Regras</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
          {rules.map((rule, idx) => (
            <div key={rule.id} className="bg-gray-800/40 border border-gray-700 rounded-xl p-3 flex flex-col gap-2 relative group">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Regra {idx + 1}</span>
                <button onClick={() => removeRule(rule.id)} className="text-gray-500 hover:text-red-400 opacity-50 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
              </div>
              <div>
                <input value={rule.from} onChange={e => updateRule(rule.id, 'from', e.target.value)} placeholder="Procurar por... (Ex: LOGO ASAAS.png)" className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-2 text-sm focus:border-red-500/50 outline-none transition-colors font-mono mb-2" />
                <input value={rule.to} onChange={e => updateRule(rule.id, 'to', e.target.value)} placeholder="Substituir por... (Ex: logohbo.png)" className="w-full bg-gray-950 border border-gray-700 text-green-400 rounded-lg p-2 text-sm focus:border-green-500/50 outline-none transition-colors font-mono" />
              </div>
            </div>
          ))}
          <button onClick={addRule} className="w-full bg-gray-800 hover:bg-gray-700 text-blue-400 text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-700 border-dashed">
            <Plus size={16}/> Adicionar Nova Regra
          </button>
        </div>
      </div>

      {/* Coluna 3: Resultado */}
      <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gray-900/80 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-white">3. Resultado Final</h3>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          <textarea readOnly value={output} className="w-full h-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-green-400 font-mono text-xs outline-none resize-none custom-scrollbar cursor-default" placeholder="O texto processado aparecerá aqui..." />
        </div>
        <div className="p-4 border-t border-gray-800 bg-gray-900 shrink-0">
          <button onClick={handleCopy} disabled={!output} className={`w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors border disabled:opacity-50 ${copied ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-lg shadow-blue-500/20'}`}>
            {copied ? <Check size={18}/> : <Copy size={18}/>} Copiar Tudo
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Automation() {
  const [searchParams] = useSearchParams();
  const activeTool = searchParams.get('tool') || 'separator';

  return (
      <div className="flex-1 flex overflow-hidden bg-gray-900 border-l border-gray-800">

        {/* Área da Ferramenta */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-900">
          {activeTool === 'separator' && <ListSeparatorTool />}
          
          {activeTool === 'regionalization' && <RegionalizationTool />}

          {activeTool === 'links' && <RegulationLinkerTool />}

          {activeTool === 'offerEditor' && <JsonOfferEditorTool />}

          {activeTool === 'multiReplace' && <MultiReplaceTool />}

          {activeTool === 'apiRunner' && <ApiRunnerTool />}
        </div>
      </div>
  );
}
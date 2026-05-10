import React, { useState, useEffect, useRef } from 'react';
import { Copy, Trash2, Check, FileCode, Upload, Globe, Download, AlignLeft, AlignJustify, CheckCircle, ArrowDownAZ, ChevronRight, ChevronDown, List, Plus, X } from 'lucide-react';

const ToolBtn = ({ onClick, icon: Icon, children, isActive, className = "", title }) => (
  <button 
    onClick={onClick} 
    title={title}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 border border-transparent
    ${isActive ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-gray-800/80 text-gray-300 border-gray-700/50 hover:bg-gray-700 hover:text-white hover:border-gray-600'} ${className}`}
  >
    {Icon && <Icon size={14} />} <span>{children}</span>
  </button>
);

const JsonTree = ({ data, name = 'root', level = 0, isLast = true }) => {
  const [expanded, setExpanded] = useState(level < 2);
  const isArray = Array.isArray(data);
  const isObject = data !== null && typeof data === 'object';
  
  if (!isObject) {
    let color = 'text-green-400';
    if (typeof data === 'number') color = 'text-orange-400';
    else if (typeof data === 'boolean') color = 'text-purple-400';
    else if (data === null) color = 'text-gray-500';

    return (
      <div className="pl-6 py-0.5 leading-snug">
        {name !== 'root' && (
          <>
            <span className="text-blue-300 font-medium">"{name}"</span>
            <span className="text-gray-400 mr-1">:</span>
          </>
        )}
        <span className={color}>{JSON.stringify(data)}</span>
        {!isLast && <span className="text-gray-400">,</span>}
      </div>
    );
  }

  const keys = Object.keys(data);
  const brackets = isArray ? ['[', ']'] : ['{', '}'];

  if (keys.length === 0) {
    return (
      <div className="pl-6 py-0.5 leading-snug">
        {name !== 'root' && (
          <>
            <span className="text-blue-300 font-medium">"{name}"</span>
            <span className="text-gray-400 mr-1">:</span>
          </>
        )}
        <span className="text-gray-400">{brackets[0]}{brackets[1]}</span>
        {!isLast && <span className="text-gray-400">,</span>}
      </div>
    );
  }

  return (
    <div className="pl-2 font-mono text-sm py-0.5 leading-snug">
      <div className="flex items-center cursor-pointer hover:bg-gray-800/50 rounded group w-fit pr-2 select-none" onClick={() => setExpanded(!expanded)}>
        <span className="w-4 flex justify-center text-gray-500 group-hover:text-gray-300">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        {name !== 'root' && (
          <>
            <span className="text-blue-300 font-medium">"{name}"</span>
            <span className="text-gray-400 mr-1">:</span>
          </>
        )}
        <span className="text-gray-400">{brackets[0]}</span>
        {!expanded && <span className="text-gray-500 mx-2 text-xs italic">{keys.length} items</span>}
        {!expanded && <span className="text-gray-400">{brackets[1]}{!isLast ? ',' : ''}</span>}
      </div>
      
      {expanded && (
        <div className="border-l border-gray-700/50 ml-2">
          {keys.map((key, index) => (
            <JsonTree key={key} name={key} data={data[key]} level={level + 1} isLast={index === keys.length - 1} />
          ))}
          <div className="pl-2 text-gray-400">{brackets[1]}{!isLast ? ',' : ''}</div>
        </div>
      )}
    </div>
  );
};

const highlightJson = (jsonStr) => {
  if (!jsonStr) return '';
  const escaped = jsonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
    let cls = 'text-green-400'; // string
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'text-blue-300 font-medium'; // key
      }
    } else if (/true|false/.test(match)) {
      cls = 'text-purple-400'; // boolean
    } else if (/null/.test(match)) {
      cls = 'text-gray-500'; // null
    } else {
      cls = 'text-orange-400'; // number
    }
    return `<span class="${cls}">${match}</span>`;
  });
};

export default function JsonFormatter() {
  const [tabs, setTabs] = useState([
    {
      id: Date.now(),
      name: 'documento1.json',
      input: '',
      parsedData: null,
      outputView: 'tree',
      outputStr: '',
      error: '',
      autoUpdate: true,
    }
  ]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);
  const preRef = useRef(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const updateActiveTab = (updates) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t));
  };

  const input = activeTab.input;
  const parsedData = activeTab.parsedData;
  const outputView = activeTab.outputView;
  const outputStr = activeTab.outputStr;
  const error = activeTab.error;
  const autoUpdate = activeTab.autoUpdate;

  const setInput = (val) => updateActiveTab({ input: val });
  const setOutputView = (val) => updateActiveTab({ outputView: val });
  const setAutoUpdate = (val) => updateActiveTab({ autoUpdate: val });
  const setError = (val) => updateActiveTab({ error: val });

  const handleScroll = (e) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  useEffect(() => {
    if (autoUpdate && input.trim()) {
      try {
        const data = JSON.parse(input);
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, parsedData: data, error: '' } : t));
      } catch (err) {
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, error: 'JSON inválido: ' + err.message } : t));
      }
    } else if (!input.trim()) {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, parsedData: null, error: '' } : t));
    }
  }, [input, autoUpdate, activeTabId]);

  const beautify = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      updateActiveTab({
        input: JSON.stringify(parsed, null, 2),
        parsedData: parsed,
        error: ''
      });
    } catch (err) {
      setError('JSON inválido: ' + err.message);
    }
  };

  const minify = () => {
    if (!input.trim()) return;
    try {
      const data = JSON.parse(input);
      updateActiveTab({
        input: JSON.stringify(data),
        parsedData: data,
        error: ''
      });
    } catch (err) {
      setError('JSON inválido: ' + err.message);
    }
  };

  const validate = () => {
    if (!input.trim()) return;
    try {
      JSON.parse(input);
      setError('');
      alert('✅ JSON Válido!');
    } catch (err) {
      setError('JSON inválido: ' + err.message);
      alert('❌ JSON Inválido:\n\n' + err.message);
    }
  };

  const sortJson = (obj) => {
    if (Array.isArray(obj)) return obj.map(sortJson);
    else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = sortJson(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  };

  const handleSort = () => {
    if (!input.trim()) return;
    try {
      const data = JSON.parse(input);
      const sorted = sortJson(data);
      updateActiveTab({
        input: JSON.stringify(sorted, null, 2),
        parsedData: sorted,
        error: ''
      });
    } catch (err) {
      setError('JSON inválido: ' + err.message);
    }
  };

  const jsonToXml = (obj, rootName = 'root') => {
    let xml = '';
    const escapeXml = (unsafe) => {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe.replace(/[<>&'"]/g, c => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    };

    if (Array.isArray(obj)) {
      obj.forEach(item => {
        xml += `<item>${jsonToXml(item)}</item>`;
      });
    } else if (obj !== null && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        const validKey = key.replace(/[^a-zA-Z0-9_.-]/g, '_');
        xml += `<${validKey}>${jsonToXml(obj[key])}</${validKey}>`;
      });
    } else {
      xml += escapeXml(obj);
    }
    return xml;
  };

  const convertToXml = () => {
    if (!parsedData) return;
    const xml = `<?xml version="1.0" encoding="UTF-8" ?>\n<root>\n${jsonToXml(parsedData)}\n</root>`;
    updateActiveTab({ outputStr: xml, outputView: 'xml' });
  };

  const jsonToCsv = (obj) => {
    let arr = obj;
    if (!Array.isArray(obj)) arr = [obj];
    if (arr.length === 0) return '';

    const flatten = (data, prefix = '') => {
      let result = {};
      for (let i in data) {
        if (typeof data[i] === 'object' && data[i] !== null && !Array.isArray(data[i])) {
          Object.assign(result, flatten(data[i], prefix + i + '.'));
        } else {
          result[prefix + i] = typeof data[i] === 'object' ? JSON.stringify(data[i]) : data[i];
        }
      }
      return result;
    };

    const flatArray = arr.map(item => flatten(item));
    const headers = Array.from(new Set(flatArray.flatMap(item => Object.keys(item))));
    let csv = headers.join(',') + '\n';
    
    flatArray.forEach(item => {
      csv += headers.map(h => {
        let val = item[h] !== undefined && item[h] !== null ? String(item[h]) : '';
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',') + '\n';
    });
    return csv;
  };

  const convertToCsv = () => {
    if (!parsedData) return;
    updateActiveTab({ outputStr: jsonToCsv(parsedData), outputView: 'csv' });
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let content = input;
    let filename = activeTab.name;
    let type = 'application/json';

    if (outputView === 'xml') {
      content = outputStr;
      filename = filename.replace('.json', '.xml');
      if (!filename.endsWith('.xml')) filename += '.xml';
      type = 'application/xml';
    } else if (outputView === 'csv') {
      content = outputStr;
      filename = filename.replace('.json', '.csv');
      if (!filename.endsWith('.csv')) filename += '.csv';
      type = 'text/csv';
    }

    if (!content) return;
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadUrl = async () => {
    const url = prompt("Digite a URL do JSON/API (Ex: https://api.exemplo.com/dados):");
    if (!url) return;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const urlObj = new URL(url);
      let filename = urlObj.pathname.split('/').pop() || urlObj.hostname;
      if (!filename.endsWith('.json')) filename += '.json';
      
      updateActiveTab({
        name: filename,
        input: JSON.stringify(data, null, 2),
        parsedData: data,
        error: ''
      });
    } catch (err) {
      alert("Erro ao carregar URL: " + err.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        JSON.parse(text); // Valida se é JSON antes
        updateActiveTab({
          name: file.name,
          input: text,
          error: ''
        });
      } catch (err) {
        alert("O arquivo selecionado não contém um JSON válido.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reseta input file
  };

  const clearAll = () => {
    updateActiveTab({
      input: '',
      parsedData: null,
      outputStr: '',
      error: ''
    });
  };

  const addNewTab = () => {
    const newId = Date.now();
    setTabs(prev => [...prev, {
      id: newId,
      name: `documento${prev.length + 1}.json`,
      input: '',
      parsedData: null,
      outputView: 'tree',
      outputStr: '',
      error: '',
      autoUpdate: true
    }]);
    setActiveTabId(newId);
  };

  const closeTab = (e, id) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const handleRenameTab = (e, tab) => {
    e.stopPropagation();
    const newName = prompt('Renomear aba:', tab.name);
    if (newName && newName.trim()) {
      setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, name: newName.trim() } : t));
    }
  };

  return (
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-900 border-l border-gray-800">
        {/* Cabeçalho / Ferramentas Globais */}
        <header className="shrink-0 border-b border-gray-800 p-4 bg-gray-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <FileCode size={20} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Formatador JSON Avançado</h2>
              <p className="text-xs text-gray-400">Valide, edite, converta e analise</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept=".json,application/json" />
            <ToolBtn onClick={() => fileInputRef.current.click()} icon={Upload} title="Abrir Arquivo local">Abrir</ToolBtn>
            <ToolBtn onClick={loadUrl} icon={Globe} title="Carregar de uma API">URL</ToolBtn>
            <div className="w-px h-5 bg-gray-700 mx-1"></div>
            <ToolBtn onClick={handleDownload} icon={Download} title="Baixar arquivo">Salvar</ToolBtn>
            <ToolBtn onClick={() => handleCopy(input)} icon={copied ? Check : Copy} className={copied ? "text-green-400" : ""}>Copiar</ToolBtn>
            <ToolBtn onClick={clearAll} icon={Trash2} className="text-red-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30">Limpar</ToolBtn>
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
              <FileCode size={14} className={activeTabId === tab.id ? "text-blue-500" : "text-gray-500"} />
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
          <button onClick={addNewTab} className="p-1.5 ml-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors mb-1 shrink-0" title="Nova Aba">
            <Plus size={18} />
          </button>
        </div>

        {/* Área de Trabalho Dividida */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Painel Esquerdo: Editor JSON */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-950/50">
            <div className="flex items-center gap-2 p-2 bg-gray-900 border-b border-gray-800 overflow-x-auto shrink-0">
              <ToolBtn onClick={beautify} icon={AlignLeft}>Beautify</ToolBtn>
              <ToolBtn onClick={minify} icon={AlignJustify}>Minify</ToolBtn>
              <ToolBtn onClick={validate} icon={CheckCircle}>Validate</ToolBtn>
              <ToolBtn onClick={handleSort} icon={ArrowDownAZ}>Sorter</ToolBtn>
              
              <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-gray-400 ml-auto cursor-pointer pr-2 select-none hover:text-gray-300">
                <input type="checkbox" checked={autoUpdate} onChange={e=>setAutoUpdate(e.target.checked)} className="rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500" />
                Auto Update
              </label>
            </div>
            
            <div className="flex-1 relative flex flex-col overflow-hidden">
              <div className="flex-1 relative">
                <div 
                  ref={preRef}
                  className="absolute inset-0 pointer-events-none p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto custom-scrollbar text-gray-300"
                  aria-hidden="true"
                >
                  <code dangerouslySetInnerHTML={{ __html: highlightJson(input) + (input.endsWith('\n') ? ' ' : '') }} />
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onScroll={handleScroll}
                  placeholder="Cole seu código JSON aqui..."
                  className="absolute inset-0 w-full h-full bg-transparent p-4 text-transparent caret-white font-mono text-sm outline-none resize-none overflow-auto custom-scrollbar selection:bg-blue-500/30 selection:text-white placeholder:text-gray-500"
                  spellCheck="false"
                />
              </div>
              {error && (
                <div className="bg-red-500/10 border-t border-red-500/30 text-red-400 px-4 py-3 text-xs font-mono shadow-[0_-10px_30px_rgba(239,68,68,0.1)] shrink-0">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Painel Direito: Viewer / Ferramentas */}
          <div className="flex-1 flex flex-col bg-gray-950">
            <div className="flex items-center gap-2 p-2 bg-gray-900 border-b border-gray-800 shrink-0">
              <ToolBtn onClick={() => setOutputView('tree')} icon={List} isActive={outputView === 'tree'}>Tree Viewer</ToolBtn>
              <ToolBtn onClick={convertToXml} icon={FileCode} isActive={outputView === 'xml'}>to XML</ToolBtn>
              <ToolBtn onClick={convertToCsv} isActive={outputView === 'csv'}>to CSV</ToolBtn>
              
              {outputView !== 'tree' && (
                <button onClick={() => handleCopy(outputStr)} className="ml-auto text-xs text-gray-400 hover:text-white px-2 transition-colors">
                  Copiar Resultado
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
              {outputView === 'tree' ? (
                parsedData !== null ? (
                  <JsonTree data={parsedData} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-600 text-sm font-medium">
                    {input ? 'Corrija os erros no JSON para visualizar a árvore.' : 'O visualizador hierárquico aparecerá aqui.'}
                  </div>
                )
              ) : (
                <textarea
                  readOnly
                  value={outputStr}
                  className="w-full h-full bg-transparent text-gray-300 font-mono text-sm outline-none resize-none custom-scrollbar"
                />
              )}
            </div>
          </div>

        </div>
      </main>
  );
}
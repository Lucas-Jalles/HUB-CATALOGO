import React, { useState } from 'react';
import { Trash2, Globe, Save, Send, Copy } from 'lucide-react';
import { useLocalStorage } from './useLocalStorage';

const highlightJson = (jsonStr) => {
  if (!jsonStr) return '';
  const escaped = jsonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
    let cls = 'text-green-400';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) cls = 'text-blue-300 font-medium';
    } else if (/true|false/.test(match)) cls = 'text-purple-400';
    else if (/null/.test(match)) cls = 'text-gray-500';
    else cls = 'text-orange-400';
    return `<span class="${cls}">${match}</span>`;
  });
};

const KeyValueEditor = ({ items, onChange, placeholderKey }) => {
  const handleChange = (i, field, val) => {
    const newItems = [...items];
    newItems[i][field] = val;
    if (i === newItems.length - 1 && val !== '') newItems.push({ key: '', value: '', active: true });
    onChange(newItems);
  };
  const toggleActive = (i) => {
    const newItems = [...items];
    newItems[i].active = !newItems[i].active;
    onChange(newItems);
  };
  const remove = (i) => {
    const newItems = items.filter((_, idx) => idx !== i);
    if (newItems.length === 0) newItems.push({ key: '', value: '', active: true });
    onChange(newItems);
  };
  return (
    <div className="border border-gray-800 rounded-md overflow-hidden bg-gray-950">
      {items.map((item, i) => (
        <div key={i} className="flex items-center border-b border-gray-800 group">
          <div className="w-8 flex justify-center border-r border-gray-800 p-2"><input type="checkbox" checked={item.active} onChange={()=>toggleActive(i)} className="accent-blue-500" /></div>
          <input value={item.key} onChange={e=>handleChange(i, 'key', e.target.value)} placeholder={placeholderKey} className={`flex-1 bg-transparent border-r border-gray-800 p-2 outline-none font-mono text-xs focus:bg-gray-900 ${!item.active ? 'text-gray-600 line-through' : 'text-gray-300'}`} />
          <input value={item.value} onChange={e=>handleChange(i, 'value', e.target.value)} placeholder="Value" className={`flex-1 bg-transparent border-r border-gray-800 p-2 outline-none font-mono text-xs focus:bg-gray-900 ${!item.active ? 'text-gray-600 line-through' : 'text-gray-300'}`} />
          <div className="w-8 flex justify-center p-2"><button onClick={()=>remove(i)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button></div>
        </div>
      ))}
    </div>
  );
};

export default function ApiRunnerTool() {
  const [savedRequests, setSavedRequests] = useLocalStorage('postman_saved', []);
  const [reqHistory, setReqHistory] = useLocalStorage('postman_history', []);

  const [req, setReq] = useLocalStorage('postman_draft', {
    name: 'Untitled Request',
    method: 'GET',
    url: '',
    params: [{key: '', value: '', active: true}],
    headers: [{key: '', value: '', active: true}],
    auth: { type: 'none', token: '', username: '', password: '' },
    bodyType: 'none',
    body: '',
    batchMode: false,
    batchItems: ''
  });

  const [activeConfigTab, setActiveConfigTab] = useState('Params');
  const [activeResTab, setActiveResTab] = useState('Body');
  const [sidebarTab, setSidebarTab] = useState('collections');
  const [response, setResponse] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showCurlImport, setShowCurlImport] = useState(false);
  const [curlText, setCurlText] = useState('');

  const getMethodColor = (m) => {
    switch(m) {
      case 'GET': return 'text-green-500';
      case 'POST': return 'text-yellow-500';
      case 'PUT': return 'text-blue-500';
      case 'DELETE': return 'text-red-500';
      case 'PATCH': return 'text-purple-500';
      default: return 'text-gray-400';
    }
  };

  const parseCurlCommand = (curlStr) => {
    let pUrl = '', pMethod = 'GET', pHeaders = [], pBody = '';
    const cleanStr = curlStr.replace(/\\\r?\n/g, ' ');
    const args = cleanStr.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    for (let i = 0; i < args.length; i++) {
      let cleanArg = args[i].replace(/^['"]|['"]$/g, '');
      if (cleanArg === 'curl' || cleanArg === '--location' || cleanArg === '-L' || cleanArg === '--compressed' || cleanArg === '--silent') continue;
      if (cleanArg === '-X' || cleanArg === '--request') {
        if (args[i+1]) pMethod = args[++i].replace(/^['"]|['"]$/g, '').toUpperCase();
      } else if (cleanArg === '-H' || cleanArg === '--header') {
        if (args[i+1]) {
          let hLine = args[++i].replace(/^['"]|['"]$/g, '');
          let sIdx = hLine.indexOf(':');
          if (sIdx > 0) pHeaders.push({ key: hLine.substring(0, sIdx).trim(), value: hLine.substring(sIdx+1).trim(), active: true });
        }
      } else if (cleanArg === '-d' || cleanArg === '--data' || cleanArg === '--data-raw' || cleanArg === '--data-binary' || cleanArg === '--data-urlencode') {
        if (args[i+1]) { pBody = args[++i].replace(/^['"]|['"]$/g, ''); if (pMethod === 'GET') pMethod = 'POST'; }
      } else if (cleanArg.startsWith('http')) { pUrl = cleanArg; }
    }
    return { pUrl, pMethod, pHeaders, pBody };
  };

  const handleUrlChange = (e) => {
    const val = e.target.value;
    if (val.trim().startsWith('curl ')) {
      const { pUrl, pMethod, pHeaders, pBody } = parseCurlCommand(val);
      setReq(prev => ({
        ...prev,
        url: pUrl || prev.url,
        method: pMethod,
        headers: pHeaders.length ? [...pHeaders, {key:'', value:'', active: true}] : [{key:'', value:'', active: true}],
        body: pBody,
        bodyType: pBody ? (pBody.startsWith('{') ? 'json' : 'raw') : 'none'
      }));
    } else {
      setReq(prev => ({ ...prev, url: val }));
    }
  };

  const handleSaveApi = () => {
    const name = prompt("Nome da requisição (ex: Limpar Cache B2B):");
    if (!name) return;
    const newReq = { id: Date.now(), name, req };
    setSavedRequests([...savedRequests, newReq]);
  };

  const loadSavedReq = (saved) => {
    if (saved.req) {
      setReq(saved.req);
    } else {
      setReq(prev => ({ 
        ...prev, 
        name: saved.name || 'Requisição Salva',
        url: saved.url || '', 
        method: saved.method || 'GET', 
        headers: saved.headers || [{key:'', value:'', active: true}], 
        body: saved.body || '', 
        batchMode: saved.batchMode || false, 
        batchItems: saved.batchItems || '' 
      }));
    }
  };

  const deleteSavedReq = (id, e) => { e.stopPropagation(); setSavedRequests(savedRequests.filter(r => r.id !== id)); };

  const runRequest = async (requestUrl, requestMethod, requestBody, requestHeadersList) => {
    const fetchHeaders = {};
    requestHeadersList.forEach(h => {
      if (h.key.trim() && h.value.trim() && h.active !== false) fetchHeaders[h.key.trim()] = h.value.trim();
    });
    
    if (req.auth?.type === 'bearer' && req.auth.token) {
        fetchHeaders['Authorization'] = `Bearer ${req.auth.token}`;
    } else if (req.auth?.type === 'basic' && req.auth.username) {
        fetchHeaders['Authorization'] = `Basic ${btoa(req.auth.username + ':' + req.auth.password)}`;
    }

    const options = {
      method: requestMethod,
      headers: fetchHeaders,
    };

    if (requestMethod !== 'GET' && requestMethod !== 'HEAD' && requestBody) {
      options.body = requestBody;
    }

    const startTime = Date.now();
    try {
      const finalUrl = `https://corsproxy.io/?${encodeURIComponent(requestUrl)}`;
      const res = await fetch(finalUrl, options);
      const time = Date.now() - startTime;
      const data = await res.text();
      let parsedData = data;
      try { parsedData = JSON.parse(data); } catch(e) {}
      
      const sizeBytes = new Blob([data]).size;
      const sizeStr = sizeBytes > 1024 ? (sizeBytes / 1024).toFixed(2) + ' KB' : sizeBytes + ' B';

      const resHeaders = {};
      res.headers.forEach((val, key) => resHeaders[key] = val);

      return { url: requestUrl, method: requestMethod, status: res.status, statusText: res.statusText, time, size: sizeStr, data: parsedData, headers: resHeaders, success: res.ok };
    } catch (error) {
      return { url: requestUrl, method: requestMethod, status: 'CORS/Error', statusText: '', time: Date.now() - startTime, size: '0 B', data: error.message, headers: {}, success: false };
    }
  };

  const handleExecute = async () => {
    if (!req.url) return;
    setIsRunning(true);
    setResponse(null);
    
    let finalUrl = req.url;
    const activeParams = req.params ? req.params.filter(p => p.key.trim() && p.active) : [];
    if (activeParams.length > 0) {
      try {
        const urlObj = new URL(finalUrl);
        activeParams.forEach(p => urlObj.searchParams.append(p.key, p.value));
        finalUrl = urlObj.toString();
      } catch(e) {
        const qs = activeParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + qs;
      }
    }

    if (req.batchMode) {
      const items = (req.batchItems || '').split('\n').map(i => i.trim()).filter(Boolean);
      if (items.length === 0) {
        alert("Adicione itens na lista para executar em lote.");
        setIsRunning(false);
        return;
      }
      
      const batchResults = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const rUrl = finalUrl.replace(/{{item}}/g, item);
        const rBody = req.body ? req.body.replace(/{{item}}/g, item) : req.body;
        const rHeaders = (req.headers || []).map(h => ({ ...h, key: h.key.replace(/{{item}}/g, item), value: h.value.replace(/{{item}}/g, item) }));
        
        const res = await runRequest(rUrl, req.method, rBody, rHeaders);
        batchResults.unshift({ item, ...res });
        setResponse([...batchResults]);
        await new Promise(r => setTimeout(r, 300));
      }
      setReqHistory(prev => [{ id: Date.now(), name: req.name || req.url, url: req.url, method: req.method, time: new Date().toLocaleTimeString(), batch: true }, ...prev].slice(0, 50));
    } else {
      const res = await runRequest(finalUrl, req.method, req.body, req.headers || []);
      setResponse(res);
      setReqHistory(prev => [{ id: Date.now(), name: req.name || req.url, url: finalUrl, method: req.method, time: new Date().toLocaleTimeString(), status: res.status }, ...prev].slice(0, 50));
    }
    
    setIsRunning(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0d1117] font-sans text-sm h-full">
      
      {/* SIDEBAR: Collections & History */}
      <div className="w-64 border-r border-gray-800 bg-[#161b22] flex flex-col shrink-0">
        <div className="flex p-3 border-b border-gray-800 gap-4 text-xs font-medium">
          <button onClick={() => setSidebarTab('collections')} className={`pb-1 ${sidebarTab==='collections'?'text-blue-400 border-b border-blue-400':'text-gray-500 hover:text-gray-300'}`}>Collections</button>
          <button onClick={() => setSidebarTab('history')} className={`pb-1 ${sidebarTab==='history'?'text-blue-400 border-b border-blue-400':'text-gray-500 hover:text-gray-300'}`}>History</button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {sidebarTab === 'collections' ? (
            savedRequests.length === 0 ? <p className="text-gray-600 text-xs p-2 text-center">Nenhuma API salva.</p> : 
            savedRequests.map(r => (
               <div key={r.id} className="flex flex-col p-2 hover:bg-gray-800 rounded-lg cursor-pointer group" onClick={() => loadSavedReq(r)}>
                 <span className="text-gray-300 font-medium truncate">{r.name}</span>
                 <div className="flex items-center gap-1.5 mt-1">
                   <span className={`text-[9px] font-bold ${getMethodColor(r.req.method)}`}>{r.req.method}</span>
                   <span className="text-[10px] text-gray-500 truncate">{r.req.url}</span>
                 </div>
                 <button onClick={(e) => deleteSavedReq(r.id, e)} className="text-red-400 absolute right-4 opacity-0 group-hover:opacity-100 p-1 bg-gray-800 rounded"><Trash2 size={12}/></button>
               </div>
            ))
          ) : (
            reqHistory.length === 0 ? <p className="text-gray-600 text-xs p-2 text-center">Nenhum histórico.</p> :
            reqHistory.map(h => (
               <div key={h.id} className="flex flex-col p-2 hover:bg-gray-800 rounded-lg cursor-pointer" onClick={() => setReq(prev=>({...prev, url: h.url, method: h.method}))}>
                 <div className="flex items-center gap-1.5">
                   <span className={`text-[9px] font-bold ${getMethodColor(h.method)}`}>{h.method}</span>
                   <span className="text-[10px] text-gray-400 truncate flex-1">{h.url}</span>
                   {h.status && <span className={`text-[9px] ${h.status >= 200 && h.status < 300 ? 'text-green-400' : 'text-red-400'}`}>{h.status}</span>}
                 </div>
                 <span className="text-[9px] text-gray-600 mt-1">{h.time} {h.batch ? '(Lote)' : ''}</span>
               </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Simulated Topbar Tabs */}
        <div className="h-10 border-b border-gray-800 flex items-center bg-[#0d1117] px-2 shrink-0">
          <div className="flex items-center h-full px-4 border-r border-gray-800 bg-[#161b22] border-t-2 border-t-orange-500 gap-3 min-w-[200px]">
             <span className={`text-[10px] font-bold ${getMethodColor(req.method)}`}>{req.method}</span>
             <span className="text-xs text-gray-300 font-medium truncate italic">{req.name}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 pr-2">
             <button onClick={()=>setShowCurlImport(true)} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 hover:bg-gray-800 px-2 py-1 rounded"><Globe size={14}/> Import cURL</button>
             <button onClick={handleSaveApi} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 hover:bg-gray-800 px-2 py-1 rounded"><Save size={14}/> Save</button>
          </div>
        </div>
        
        {/* Request Action Bar */}
        <div className="p-3 bg-[#161b22] flex gap-2 items-center shrink-0 border-b border-gray-800">
          <div className="flex border border-gray-700 rounded-md overflow-hidden flex-1 bg-gray-950 focus-within:border-gray-500 transition-all">
            <select value={req.method} onChange={e=>setReq({...req, method: e.target.value})} className={`bg-[#161b22] border-r border-gray-700 font-bold text-xs px-3 py-2 outline-none cursor-pointer hover:bg-gray-800 ${getMethodColor(req.method)}`}>
              <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option>
            </select>
            <input value={req.url} onChange={handleUrlChange} placeholder="Enter request URL or paste cURL here" className="flex-1 bg-transparent px-3 py-2 text-sm text-white font-mono outline-none placeholder-gray-600" />
          </div>
          <button onClick={handleExecute} disabled={isRunning} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm px-6 py-2 rounded-md flex items-center gap-2 transition-colors shrink-0">
            {isRunning ? 'Sending...' : <><Send size={14}/> Send</>}
          </button>
        </div>

        {/* Split Container for Config and Response */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Config Pane (Left/Top) */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-800 overflow-hidden bg-[#0d1117]">
            <div className="flex gap-6 px-4 pt-3 border-b border-gray-800 text-xs font-medium text-gray-400 shrink-0">
              {['Params', 'Authorization', 'Headers', 'Body', 'Batch'].map(tab => (
                <button key={tab} onClick={()=>setActiveConfigTab(tab)} className={`pb-2 border-b-2 transition-colors ${activeConfigTab===tab ? 'border-orange-500 text-gray-100' : 'border-transparent hover:text-gray-300'}`}>
                  {tab} {tab === 'Batch' && req.batchMode ? <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block ml-1"></span> : null}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {activeConfigTab === 'Params' && <KeyValueEditor items={req.params} onChange={val => setReq({...req, params: val})} placeholderKey="Query Param" />}
              {activeConfigTab === 'Headers' && <KeyValueEditor items={req.headers} onChange={val => setReq({...req, headers: val})} placeholderKey="Header" />}
              
              {activeConfigTab === 'Authorization' && (
                <div className="max-w-md">
                   <label className="block text-xs text-gray-400 mb-2">Auth Type</label>
                   <select value={req.auth.type} onChange={e=>setReq({...req, auth: {...req.auth, type: e.target.value}})} className="bg-[#161b22] border border-gray-800 text-white text-sm rounded p-2 outline-none focus:border-blue-500 w-full mb-4">
                     <option value="none">No Auth</option>
                     <option value="bearer">Bearer Token</option>
                     <option value="basic">Basic Auth</option>
                   </select>
                   {req.auth.type === 'bearer' && (
                     <div>
                       <label className="block text-xs text-gray-400 mb-1">Token</label>
                       <input value={req.auth.token} onChange={e=>setReq({...req, auth: {...req.auth, token: e.target.value}})} placeholder="Token" className="bg-gray-950 border border-gray-800 text-white font-mono text-sm rounded p-2 outline-none focus:border-blue-500 w-full" />
                     </div>
                   )}
                   {req.auth.type === 'basic' && (
                     <div className="space-y-3">
                       <div><label className="block text-xs text-gray-400 mb-1">Username</label><input value={req.auth.username} onChange={e=>setReq({...req, auth: {...req.auth, username: e.target.value}})} className="bg-gray-950 border border-gray-800 text-white font-mono text-sm rounded p-2 outline-none focus:border-blue-500 w-full" /></div>
                       <div><label className="block text-xs text-gray-400 mb-1">Password</label><input type="password" value={req.auth.password} onChange={e=>setReq({...req, auth: {...req.auth, password: e.target.value}})} className="bg-gray-950 border border-gray-800 text-white font-mono text-sm rounded p-2 outline-none focus:border-blue-500 w-full" /></div>
                     </div>
                   )}
                </div>
              )}

              {activeConfigTab === 'Body' && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-4 mb-3">
                     <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"><input type="radio" checked={req.bodyType === 'none'} onChange={()=>setReq({...req, bodyType: 'none', body: ''})} className="accent-blue-500" /> none</label>
                     <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"><input type="radio" checked={req.bodyType === 'json'} onChange={()=>setReq({...req, bodyType: 'json'})} className="accent-blue-500" /> raw (JSON)</label>
                     {req.bodyType === 'json' && (
                       <button onClick={()=>{try{ setReq({...req, body: JSON.stringify(JSON.parse(req.body), null, 2)}) }catch(e){}}} className="text-[10px] text-blue-400 ml-auto hover:text-blue-300">Beautify JSON</button>
                     )}
                  </div>
                  <textarea disabled={req.bodyType==='none'} value={req.body} onChange={e=>setReq({...req, body: e.target.value})} placeholder={req.bodyType==='none' ? "This request does not have a body" : "Enter body here..."} className="flex-1 w-full bg-[#161b22] border border-gray-800 rounded-md p-3 text-green-400 font-mono text-xs outline-none focus:border-blue-500 resize-none custom-scrollbar disabled:opacity-50" spellCheck="false" />
                </div>
              )}

              {activeConfigTab === 'Batch' && (
                <div className="h-full flex flex-col">
                  <div className="bg-[#161b22] border border-gray-800 p-4 rounded-xl flex flex-col gap-3 h-full">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 cursor-pointer mb-2">
                      <input type="checkbox" checked={req.batchMode} onChange={e=>setReq({...req, batchMode: e.target.checked})} className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500" />
                      Enable Batch Mode (Loop Execution)
                    </label>
                    <div className={`flex-1 flex flex-col transition-opacity ${req.batchMode ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                      <p className="text-xs text-gray-400 mb-2">Paste a list of items below. Use the <code className="text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded font-mono">{'{{item}}'}</code> variable in your URL, Headers, or Body.</p>
                      <textarea value={req.batchItems} onChange={e=>setReq({...req, batchItems: e.target.value})} placeholder="item_id_1&#10;item_id_2" className="flex-1 w-full bg-gray-950 border border-gray-800 text-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 text-xs font-mono custom-scrollbar resize-none mt-2" spellCheck="false" />
                      <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
                        <span>Items to process: <strong className="text-gray-300">{(req.batchItems || '').split('\n').filter(i=>i.trim()).length}</strong></span>
                        <span>Delay: <strong>300ms</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Response Pane (Right/Bottom) */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] relative">
            {!response && !isRunning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 z-0">
                <Send size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">Enter the URL and click Send to get a response</p>
              </div>
            )}
            
            {req.batchMode && Array.isArray(response) ? (
              <div className="flex-1 flex flex-col z-10 bg-[#0d1117]">
                <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-[#161b22] shrink-0">
                  <span className="text-xs font-medium text-gray-300">Batch Results ({response.length})</span>
                  <button onClick={()=>setResponse(null)} className="text-xs text-gray-500 hover:text-white">Clear</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {response.map((res, i) => (
                    <div key={i} className="border border-gray-800 rounded-lg bg-gray-900/30 overflow-hidden">
                      <div className="flex items-center gap-3 p-2 border-b border-gray-800 text-xs bg-[#161b22]">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${res.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{res.status} {res.statusText}</span>
                        <span className="text-blue-400 font-mono font-medium truncate">{res.item}</span>
                        <span className="text-gray-500 ml-auto font-mono">{res.time}ms</span>
                      </div>
                      <div className="p-2 overflow-x-auto custom-scrollbar">
                        <pre className="text-[11px] font-mono text-gray-300">{typeof res.data === 'object' ? JSON.stringify(res.data) : String(res.data).substring(0, 200) + (String(res.data).length > 200 ? '...' : '')}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : response && !Array.isArray(response) ? (
              <div className="flex-1 flex flex-col z-10 bg-[#0d1117]">
                <div className="flex flex-wrap items-center gap-6 p-3 border-b border-gray-800 bg-[#161b22] text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">Status:</span>
                    <span className={`font-bold ${response.success ? 'text-green-500' : 'text-red-500'}`}>{response.status} {response.statusText}</span>
                  </div>
                  <div className="flex items-center gap-2"><span className="text-gray-500 font-medium">Time:</span><span className="text-green-500 font-bold">{response.time} ms</span></div>
                  <div className="flex items-center gap-2"><span className="text-gray-500 font-medium">Size:</span><span className="text-green-500 font-bold">{response.size}</span></div>
                </div>
                
                <div className="flex gap-6 px-4 pt-3 border-b border-gray-800 text-xs font-medium text-gray-400 shrink-0 bg-gray-900/30">
                  {['Body', 'Headers'].map(tab => (
                    <button key={tab} onClick={()=>setActiveResTab(tab)} className={`pb-2 border-b-2 transition-colors ${activeResTab===tab ? 'border-orange-500 text-gray-100' : 'border-transparent hover:text-gray-300'}`}>{tab}</button>
                  ))}
                  <button onClick={()=>{navigator.clipboard.writeText(typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data)}} className="ml-auto text-gray-500 hover:text-white pb-2 flex items-center gap-1"><Copy size={12}/> Copy</button>
                </div>
                
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                  {activeResTab === 'Body' && (
                    typeof response.data === 'object' ? (
                      <pre className="font-mono text-[11px] text-gray-300 whitespace-pre-wrap break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: highlightJson(JSON.stringify(response.data, null, 2)) }} />
                    ) : (
                      <pre className="font-mono text-xs text-gray-300 whitespace-pre-wrap break-words">{String(response.data)}</pre>
                    )
                  )}
                  {activeResTab === 'Headers' && (
                    <table className="w-full text-left text-xs font-mono">
                      <tbody>
                        {Object.entries(response.headers).map(([k, v]) => (
                          <tr key={k} className="border-b border-gray-800 hover:bg-gray-900/50"><td className="py-2 pr-4 text-gray-400 font-medium w-1/3 break-all">{k}</td><td className="py-2 text-gray-300 break-all">{v}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : null}
          </div>

        </div>
      </div>

      {showCurlImport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Globe size={20}/> Importar cURL</h2>
              <button onClick={() => setShowCurlImport(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <textarea 
              value={curlText} 
              onChange={e => setCurlText(e.target.value)} 
              placeholder="Cole seu comando cURL com múltiplas linhas aqui..." 
              className="w-full h-48 bg-gray-950 border border-gray-700 text-green-400 rounded-lg p-3 outline-none focus:border-blue-500 font-mono text-xs custom-scrollbar resize-none mb-4" 
              spellCheck="false"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCurlImport(false)} className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors">Cancelar</button>
              <button onClick={() => {
                if (!curlText.trim()) return;
                const { pUrl, pMethod, pHeaders, pBody } = parseCurlCommand(curlText);
                setReq(prev => ({
                  ...prev,
                  url: pUrl || prev.url,
                  method: pMethod,
                  headers: pHeaders.length ? [...pHeaders, {key:'', value:'', active: true}] : [{key:'', value:'', active: true}],
                  body: pBody,
                  bodyType: pBody ? (pBody.startsWith('{') ? 'json' : 'raw') : 'none'
                }));
                setShowCurlImport(false); setCurlText('');
              }} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">Importar Requisição</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
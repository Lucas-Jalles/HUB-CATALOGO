import axios from 'axios';

// SEGURANÇA: Nunca hardcodar URLs de APIs ou Tokens no frontend.
// Crie um arquivo .env na raiz do projeto com VITE_API_URL=https://script.google...
export const API_URL = import.meta.env.VITE_API_URL || "https://script.google.com/macros/s/AKfycbyPzWfEdkarbiN8OJhKvZqY-1fEhFgFvt2TQgHIDC2HJsaxLQxcGRlYOZdzdwvTI1vsvw/exec"; 

export const api = axios.create({
  baseURL: API_URL,
});

// Cache em memória e controle de requisições simultâneas (Deduping)
const memoryCache = {};
const pendingRequests = {};

// Interceptor para injetar o token e resolver o CORS do Google Apps Script
api.interceptors.request.use(config => {
  // SEGURANÇA: sessionStorage reduz a janela de exposição em comparação ao localStorage.
  // O ideal definitivo seria o Backend utilizar Cookies HttpOnly com SameSite=Strict.
  const token = sessionStorage.getItem('token');
  
  if (config.method === 'post') {
    const dataObj = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    config.data = JSON.stringify({
      ...dataObj,
      token
    });
    // Força text/plain para evitar erro de preflight (OPTIONS) do CORS no Google
    config.headers['Content-Type'] = 'text/plain;charset=utf-8';
  } else if (config.method === 'get') {
    // O 't' com a data atual força o Google Scripts a nunca usar cache do navegador
    config.params = { ...config.params, token, t: new Date().getTime() };
  }
  
  return config;
});

// Sobrescrevendo o GET para implementar Cache Instantâneo e Deduping
const originalGet = api.get;
api.get = async (url, config) => {
  const action = config?.params?.action;
  
  // 1. Se já está na memória, devolve instantaneamente (0ms)
  if (action && memoryCache[action]) return Promise.resolve({ data: memoryCache[action] });

  // 2. Se já existe uma requisição idêntica acontecendo agora, aguarda ela (Evita duplicidade)
  if (action && pendingRequests[action]) return pendingRequests[action];
  
  // 3. Faz a requisição real e armazena
  const requestPromise = originalGet.call(api, url, config).then(response => {
    if (action && response.data?.status === 'success') memoryCache[action] = response.data; // Salva
    if (action) delete pendingRequests[action];
    return response;
  }).catch(err => {
    if (action) delete pendingRequests[action];
    throw err;
  });

  if (action) pendingRequests[action] = requestPromise;
  return requestPromise;
};

// Sobrescrevendo o POST para limpar o cache quando salvamos/alteramos algo
const originalPost = api.post;
api.post = async (url, data, config) => {
  const response = await originalPost.call(api, url, data, config);
  
  // Analisa qual foi a ação e limpa a gaveta certa do cache para forçar a atualização
  const action = data?.action || '';
  if (action.includes('url')) delete memoryCache['get_urls'];
  if (action.includes('operadora')) delete memoryCache['get_operadoras'];
  if (action.includes('pasta') || action.includes('categoria')) delete memoryCache['get_pastas'];
  if (action.includes('tag')) delete memoryCache['get_tags'];
  
  return response;
};
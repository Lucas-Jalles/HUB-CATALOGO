import { api } from './api';

export const ApiService = {
  // 🔍 BUSCAS (Queries)
  getPastas: async () => {
    const res = await api.get('', { params: { action: 'get_pastas' } });
    return res.data.status === 'success' ? res.data.data || [] : [];
  },
  getUrls: async () => {
    const res = await api.get('', { params: { action: 'get_urls' } });
    return res.data.status === 'success' ? res.data.data || [] : [];
  },
  getTags: async () => {
    const res = await api.get('', { params: { action: 'get_tags' } });
    return res.data.status === 'success' ? res.data.data || [] : [];
  },

  // ✏️ MUTAÇÕES (Mutations)
  createUrl: (data) => api.post('', { action: 'create_url', data }),
  updateUrl: (data) => api.post('', { action: 'update_url', data }),
  deleteUrl: (id) => api.post('', { action: 'delete_url', data: { id } }),
  
  createPasta: (data) => api.post('', { action: 'create_pasta', data }),
};
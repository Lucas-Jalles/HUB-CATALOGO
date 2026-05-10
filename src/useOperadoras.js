import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export function useOperadoras() {
  return useQuery({
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
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
          });
        }
        return ops;
      }
      return [];
    }
  });
}
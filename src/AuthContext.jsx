import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from './api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const email = sessionStorage.getItem('email');
    const role = sessionStorage.getItem('role');
    const id = sessionStorage.getItem('id');
    const safeRole = String(role || 'user').trim().toLowerCase();
    if (token && email) {
      setUser({ id, email, token, role: safeRole });

      // Sincronização de segurança em background
      // Corrige o caso onde o backend (Google Scripts) não retorna o "role" na hora do login.
      api.get('', { params: { action: 'get_usuarios' } })
        .then(res => {
          if (res.data?.status === 'success') {
            const myUser = (res.data.data || []).find(u => String(u.email).toLowerCase() === String(email).toLowerCase());
            if (myUser) {
              const realRole = String(myUser.role || 'user').trim().toLowerCase();
              sessionStorage.setItem('role', realRole);
              setUser(prev => prev ? { ...prev, role: realRole } : null);
            }
          }
        }).catch(() => {});
    }
    setLoading(false);
  }, []);

  const login = async (email, senha) => {
    try {
      const response = await api.post('', { action: 'login', email: email.toLowerCase(), senha });
      
      // Se o Google bloquear por permissão, ele devolve HTML em vez de JSON
      if (typeof response.data === 'string' && response.data.includes('<html')) {
        return { error: 'O Google bloqueou o acesso. Publique a API como "Qualquer pessoa".' };
      }

      if (response.data?.status === 'success') {
        const { token, email: emailLogado, role, id } = response.data.data;
        const safeRole = String(role || 'user').trim().toLowerCase();
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('email', emailLogado);
        sessionStorage.setItem('role', safeRole);
        if (id) sessionStorage.setItem('id', id);
        setUser({ id, email: emailLogado, token, role: safeRole });

        // Força a atualização do cargo buscando da lista geral logo após o login
        api.get('', { params: { action: 'get_usuarios' } })
          .then(res => {
            if (res.data?.status === 'success') {
              const myUser = (res.data.data || []).find(u => String(u.email).toLowerCase() === String(emailLogado).toLowerCase());
              if (myUser) {
                const realRole = String(myUser.role || 'user').trim().toLowerCase();
                sessionStorage.setItem('role', realRole);
                setUser(prev => prev ? { ...prev, role: realRole } : null);
              }
            }
          }).catch(() => {});

        return true;
      }
      
      return { error: response.data?.data?.error || response.data?.error || 'Erro desconhecido no login' };
    } catch (error) {
      // SEGURANÇA: Nunca logue stack traces originais no console do usuário.
      console.error("Detalhes reais do erro de conexão:", error);
      return { error: 'Falha na conexão com o servidor. Tente novamente mais tarde.' };
    }
  };

  const recoverPassword = async (email) => {
    try {
      const response = await api.post('', { action: 'recover_password', email: email.toLowerCase() });
      if (response.data?.status === 'success') {
        return true;
      }
      return { error: response.data?.data?.error || response.data?.error || 'Erro ao solicitar redefinição de senha' };
    } catch (error) {
      console.error("Erro na redefinição de senha:", error);
      return { error: 'Falha na conexão com o servidor. Tente novamente.' };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('id');
    setUser(null);
  };

  const isAdmin = String(user?.role || '').trim().toLowerCase().includes('adm') || user?.email?.toLowerCase() === 'lucasjalles333@gmail.com';

  return (
    <AuthContext.Provider value={{ user, signed: !!user, loading, login, logout, recoverPassword, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
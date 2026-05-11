import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import Settings from './Settings';
import CommandPalette from './CommandPalette';
import JsonFormatter from './JsonFormatter';
import Automation from './Automation';
import AppLayout from './AppLayout';

function PrivateRoute({ children }) {
  const { signed, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-950 text-white">Carregando...</div>;
  return signed ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { signed, loading, isAdmin } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-950 text-white">Carregando...</div>;
  if (!signed) return <Navigate to="/login" />;
  return isAdmin ? children : <Navigate to="/" />;
}

function CommandPaletteWrapper() {
  const { signed } = useAuth();
  return signed ? <CommandPalette /> : null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="json" element={<AdminRoute><JsonFormatter /></AdminRoute>} />
            <Route path="automation" element={<AdminRoute><Automation /></AdminRoute>} />
          </Route>
        </Routes>
        <CommandPaletteWrapper />
      </BrowserRouter>
    </AuthProvider>
  );
}

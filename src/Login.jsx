import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { LogIn, ShieldAlert } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [esqueciSenha, setEsqueciSenha] = useState(false);
  const { login, recoverPassword } = useAuth();

  // SEGURANÇA (UI): Limite de tentativas e tempo de bloqueio (Apenas Visual)
  // ATENÇÃO: Um hacker contorna facilmente isso limpando o localStorage ou
  // enviando requisições direto via Postman. O rate limit REAL deve estar no Backend.
  const [tentativas, setTentativas] = useState(0);
  const [bloqueadoAte, setBloqueadoAte] = useState(null);

  useEffect(() => {
    const bloqueio = localStorage.getItem('lockoutTime');
    if (bloqueio && Date.now() < parseInt(bloqueio, 10)) {
      setBloqueadoAte(parseInt(bloqueio, 10));
    } else {
      localStorage.removeItem('lockoutTime');
    }
  }, []);

  useEffect(() => {
    let interval;
    if (bloqueadoAte) {
      interval = setInterval(() => {
        if (Date.now() >= bloqueadoAte) {
          setBloqueadoAte(null);
          setTentativas(0);
          localStorage.removeItem('lockoutTime');
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [bloqueadoAte]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (bloqueadoAte) return;
    if (!email || !senha) return;
    
    setErro('');
    setLoading(true);
    
    try {
      const result = await login(email, senha);
      if (result === true) {
        setTentativas(0);
        localStorage.removeItem('lockoutTime');
        window.location.replace('/');
      } else {
        const novasTentativas = tentativas + 1;
        setTentativas(novasTentativas);
        
        if (novasTentativas >= 3) {
          const tempoBloqueio = Date.now() + 5 * 60 * 1000; // 5 minutos de bloqueio
          setBloqueadoAte(tempoBloqueio);
          localStorage.setItem('lockoutTime', tempoBloqueio.toString());
          setErro('Muitas tentativas falhas. Conta bloqueada temporariamente.');
        } else {
          setErro(result.error || `Erro ao logar. Tentativas restantes: ${3 - novasTentativas}`);
        }
      }
    } catch (err) {
      setErro('Falha crítica: ' + err.message);
    }
    setLoading(false);
  };

  const handleRecoverPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setErro('Por favor, preencha o seu email para recuperar a senha.');
      return;
    }
    setErro('');
    setSucesso('');
    setLoading(true);
    
    const result = await recoverPassword(email);
    if (result === true) {
      setSucesso('Se o email existir em nossa base, você receberá uma nova senha em breve.');
    } else {
      setErro(result.error);
    }
    setLoading(false);
  };

  const isBloqueado = bloqueadoAte !== null;
  const tempoRestante = isBloqueado ? Math.ceil((bloqueadoAte - Date.now()) / 1000) : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Catalog Hub
          </h1>
          <p className="text-gray-400 mt-2">Faça login para acessar suas operações</p>
        </div>

        {erro && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">{erro}</div>}
        {sucesso && <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg mb-6 text-sm">{sucesso}</div>}

        {isBloqueado && (
          <div className="bg-orange-500/10 border border-orange-500/50 text-orange-400 p-5 rounded-lg mb-6 text-sm flex flex-col items-center justify-center text-center gap-3">
            <ShieldAlert size={36} />
            <p><strong>Acesso Bloqueado</strong></p>
            <p>Por medidas de segurança, aguarde {Math.floor(tempoRestante / 60)}m e {tempoRestante % 60}s para tentar novamente.</p>
          </div>
        )}

        {!isBloqueado && (
          <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {!esqueciSenha && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
              <input 
                type="password" 
                required
                className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
          )}
          
          {!esqueciSenha ? (
            <>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <LogIn size={18} /> {loading ? 'Entrando...' : 'Entrar no Sistema'}
              </button>
              <button 
                type="button" 
                onClick={() => { setEsqueciSenha(true); setErro(''); setSucesso(''); }}
                className="w-full text-gray-400 hover:text-blue-400 text-sm font-medium transition-colors mt-2"
              >
                Esqueci minha senha
              </button>
            </>
          ) : (
            <>
              <button 
                type="button" 
                onClick={handleRecoverPassword}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {loading ? 'Enviando e-mail...' : 'Recuperar Senha'}
              </button>
              <button 
                type="button" 
                onClick={() => { setEsqueciSenha(false); setErro(''); setSucesso(''); }}
                className="w-full text-gray-400 hover:text-white text-sm font-medium transition-colors mt-2"
              >
                Voltar para o Login
              </button>
            </>
          )}
        </form>
        )}
      </div>
    </div>
  );
}
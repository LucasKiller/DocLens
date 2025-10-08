'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
const API = process.env.NEXT_PUBLIC_BACKEND_URL!;

export function AuthBar({ onToken }: { onToken: (t: string) => void }) {
  const [email, setEmail] = useState('admin@doclens.local');
  const [password, setPassword] = useState('Admin123!');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('doclens_token');
    if (t) { setToken(t); onToken(t); }
  }, [onToken]);

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Login falhou');
      const data = await res.json();
      localStorage.setItem('doclens_token', data.access_token);
      setToken(data.access_token); onToken(data.access_token);
      toast.success('Logado com sucesso');
    } catch (e: any) { toast.error(e.message); }
  }

  function logout() {
    localStorage.removeItem('doclens_token');
    setToken(null); onToken('');
  }

  if (token) {
    return <div className="flex items-center gap-3">
      <span className="text-sm opacity-80">Autenticado</span>
      <button className="btn" onClick={logout}>Sair</button>
    </div>;
  }

  return (
    <form onSubmit={doLogin} className="flex items-center gap-2">
      <input className="input" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="input" placeholder="senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="btn" type="submit">Entrar</button>
    </form>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LoginModal, RegisterModal } from './auth-modals';

export function AuthBar({ onToken }: { onToken: (t: string) => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('doclens_token');
    if (t) { setToken(t); onToken(t); }
  }, [onToken]);

  function logout() {
    localStorage.removeItem('doclens_token');
    setToken(null);
    onToken('');
    toast.success('Sessão encerrada');
  }

  if (token) {
    return (
      <div className="flex items-center gap-3">
        <button className="btn-outline" onClick={logout}>Sair</button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button className="btn" onClick={() => setShowLogin(true)}>Entrar</button>
        <button className="btn-outline" onClick={() => setShowRegister(true)}>Cadastrar</button>
      </div>

      <LoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onToken={(t) => { setToken(t); onToken(t); }}
      />
      <RegisterModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onToken={(t) => { setToken(t); onToken(t); }}
      />
    </>
  );
}

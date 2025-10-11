'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from './modal';
import { Eye, EyeOff, Shield } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_BACKEND_URL!;

/* ---------- util: cálculo de força da senha ---------- */
function analyzePassword(pw: string) {
  const length = pw.length;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);

  let score = 0;
  // comprimento
  if (length >= 6) score++;
  if (length >= 10) score++;
  if (length >= 12) score++;

  // diversidade
  const classes = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  if (classes >= 2) score++;
  if (classes >= 3 && length >= 10) score++;
  if (classes === 4 && length >= 12) score++;

  // normaliza para 0..4
  score = Math.min(4, Math.max(0, score - 1));

  const label =
    score <= 1 ? 'Fraca' :
    score === 2 ? 'Média' :
    score === 3 ? 'Forte' : 'Muito forte';

  const color =
    score <= 1 ? 'bg-red-500' :
    score === 2 ? 'bg-yellow-500' :
    score === 3 ? 'bg-emerald-500' : 'bg-emerald-400';

  return { score, label, color };
}

function StrengthBar({ password }: { password: string }) {
  const { score, label, color } = useMemo(() => analyzePassword(password), [password]);
  const bars = [0, 1, 2, 3];
  return (
    <div>
      <div className="flex gap-2 mb-1">
        {bars.map((i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all ${
              i <= score - 1 ? color : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm opacity-80">
        <Shield size={16} />
        <span>Força: <span className="opacity-100">{label}</span></span>
      </div>
      <ul className="mt-2 text-xs opacity-70 list-disc pl-5 space-y-1">
        <li>Use 12+ caracteres</li>
        <li>Misture maiúsculas, minúsculas, números e símbolos</li>
      </ul>
    </div>
  );
}

/* -------------------- Login -------------------- */
export function LoginModal({
  open, onClose, onToken,
}: { open: boolean; onClose: () => void; onToken: (t: string) => void; }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Email ou senha inválidos');
      const data = await res.json();
      localStorage.setItem('doclens_token', data.access_token);
      onToken(data.access_token);
      toast.success('Bem-vindo!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Falha no login');
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Entrar">
      <form onSubmit={submit} className="space-y-3">
        <input className="input w-full" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} />
        <div className="relative">
          <input
            className="input w-full pr-10"
            placeholder="Senha"
            type={show ? 'text' : 'password'}
            value={password}
            onChange={e=>setPassword(e.target.value)}
          />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
                  onClick={()=>setShow(s=>!s)}>
            {show ? <EyeOff size={18}/> : <Eye size={18}/>}
          </button>
        </div>
        <button className="btn w-full" disabled={loading} type="submit">
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </Modal>
  );
}

/* -------------------- Cadastro -------------------- */
export function RegisterModal({
  open, onClose, onToken,
}: { open: boolean; onClose: () => void; onToken: (t: string) => void; }) {
  const [email, setEmail] = useState('');
  const [name, setName]   = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => analyzePassword(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !name || !password || !confirm) {
      return toast.error('Preencha todos os campos');
    }
    if (mismatch) {
      return toast.error('As senhas não coincidem');
    }
    try {
      setLoading(true);
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });
      if (!res.ok) throw new Error('Cadastro falhou');
      const data = await res.json();
      const token = data.access_token;
      if (token) {
        localStorage.setItem('doclens_token', token);
        onToken(token);
      } else {
        // fallback: login após cadastro
        const resLogin = await fetch(`${API}/auth/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (resLogin.ok) {
          const d = await resLogin.json();
          localStorage.setItem('doclens_token', d.access_token);
          onToken(d.access_token);
        }
      }
      toast.success('Conta criada!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Falha no cadastro');
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Cadastrar">
      <form onSubmit={submit} className="space-y-3">
        <input className="input w-full" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input w-full" placeholder="Nome"  value={name}  onChange={e=>setName(e.target.value)} />

        {/* senha */}
        <div className="relative">
          <input
            className="input w-full pr-10"
            placeholder="Senha"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e=>setPassword(e.target.value)}
          />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
                  onClick={()=>setShowPw(s=>!s)}>
            {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
          </button>
        </div>

        {/* força */}
        <StrengthBar password={password} />

        {/* confirmar senha */}
        <div className="relative">
          <input
            className={`input w-full pr-10 ${mismatch ? 'border-red-500' : ''}`}
            placeholder="Confirmar senha"
            type={showConfirm ? 'text' : 'password'}
            value={confirm}
            onChange={e=>setConfirm(e.target.value)}
          />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
                  onClick={()=>setShowConfirm(s=>!s)}>
            {showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
          </button>
        </div>
        {mismatch && <p className="text-xs text-red-400">As senhas não coincidem.</p>}

        <button className="btn w-full" disabled={loading} type="submit">
          {loading ? 'Cadastrando…' : 'Cadastrar'}
        </button>
      </form>
    </Modal>
  );
}
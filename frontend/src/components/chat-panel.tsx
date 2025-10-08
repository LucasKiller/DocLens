'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';

type Msg = { role: 'user'|'assistant'; text: string };

export function ChatPanel({ token, docId }: { token: string; docId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  // carrega interações prévias
  useEffect(() => {
    (async () => {
      try {
        const d = await apiGet<{ interactions: {question:string; answer:string}[] }>(`/documents/${docId}`, token);
        const m = (d.interactions || []).flatMap(it => ([
          { role: 'user' as const, text: it.question },
          { role: 'assistant' as const, text: it.answer },
        ]));
        setMessages(m);
      } catch { /* ignora */ }
    })();
  }, [docId, token]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    const question = q;
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setQ(''); setLoading(true);
    try {
      const data = await apiPost<{ answer: string }>(`/documents/${docId}/ask`, { question }, token);
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
    } catch (e: any) { toast.error(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4">Converse com o documento</h3>
      <div className="space-y-3 max-h-72 overflow-auto pr-2">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-xl ${m.role === 'user' ? 'bg-indigo-600/20' : 'bg-white/5'}`}>
            <div className="text-xs opacity-70 mb-1">{m.role === 'user' ? 'Você' : 'DocLens'}</div>
            <div className="whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="opacity-60 text-sm">Faça perguntas como “Qual o valor total e a data?”</div>
        )}
      </div>

      <form onSubmit={ask} className="mt-4 flex gap-2">
        <input className="flex-1 input" placeholder="Digite sua pergunta…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" disabled={loading} type="submit">{loading ? 'Perguntando…' : 'Perguntar'}</button>
      </form>
    </div>
  );
}
'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, API_BASE, authHeaders } from '@/lib/api';
import { X, Download } from 'lucide-react';
import { Markdown } from './markdown';

type Interaction = { id?: string; question: string; answer: string; createdAt?: string };
type Detail = {
  id: string;
  filename: string;
  status: 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED' | string;
  ocr?: { text: string } | null;
  interactions?: Interaction[];
};

export function DocumentDetail({
  id, token, onClose,
}: { id: string; token: string; onClose: () => void }) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [sending, setSending] = useState(false);

  const ocrRef = useRef<HTMLDivElement | null>(null);
  const histRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    try {
      setLoading(true);
      const d = await apiGet<Detail>(`/documents/${id}`, token);
      setData(d);
      // auto-scroll para o fim do histórico ao abrir
      setTimeout(() => {
        if (histRef.current) histRef.current.scrollTop = histRef.current.scrollHeight;
      }, 0);
    } catch (e: any) {
      toast.error(e.message || 'Falha ao carregar documento');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function download() {
    try {
      const res = await fetch(`${API_BASE}/documents/${id}/download`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error('Falha no download');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `doclens-${data?.filename ?? id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const question = q.trim();
    if (!question) return;
    try {
      setSending(true);
      setQ('');

      setData(prev => prev ? {
        ...prev,
        interactions: [...(prev.interactions ?? []), { question, answer: '…', createdAt: new Date().toISOString() }],
      } : prev);

      const res = await apiPost<{ answer: string } | { interaction: Interaction }>(
        `/documents/${id}/ask`, { question }, token,
      );

      const newItem: Interaction = 'interaction' in res
        ? res.interaction
        : { question, answer: (res as any).answer, createdAt: new Date().toISOString() };

      setData(prev => prev ? {
        ...prev,
        interactions: [
          ...(prev.interactions ?? []).slice(0, -1),
          newItem,
        ],
      } : prev);

      // scroll para o fim
      setTimeout(() => {
        if (histRef.current) histRef.current.scrollTop = histRef.current.scrollHeight;
      }, 0);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao perguntar');
      setData(prev => prev ? { ...prev, interactions: (prev.interactions ?? []).slice(0, -1) } : prev);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* modal */}
      <div
        className="card absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                   w-[min(100%,1000px)] h-[90vh] flex flex-col"
        role="dialog" aria-modal="true"
      >
        {/* header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold truncate max-w-[60vw]">
              {data?.filename ?? 'Documento'}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 opacity-80">
              {data?.status ?? '...'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-outline" onClick={download} title="Baixar pacote">
              <Download size={16} className="mr-1" /> Baixar
            </button>
            <button className="opacity-80 hover:opacity-100" onClick={onClose} aria-label="Fechar">
              <X />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col p-4 gap-4">
          <div className="card p-4 flex-1 min-h-0 overflow-auto" ref={ocrRef}>
            <h4 className="font-semibold mb-2 opacity-90">Texto OCR</h4>
            {loading
              ? <p className="opacity-70">Carregando…</p>
              : <pre className="whitespace-pre-wrap text-sm opacity-90">
                {data?.ocr?.text || '(Sem OCR ou ainda processando)'}
              </pre>}
          </div>

          <div className="card p-4 flex-[0.7] min-h-0 overflow-auto" ref={histRef}>
            <h4 className="font-semibold mb-2 opacity-90">Histórico</h4>
            <div className="space-y-3">
              {(data?.interactions ?? []).map((it, i) => (
                <div key={i} className="text-sm">
                  <div className="opacity-70">Você: {it.question}</div>
                  <div className="opacity-90">
                    <Markdown content={it.answer} />
                  </div>
                </div>
              ))}
              {(!data?.interactions || data.interactions.length === 0) && (
                <div className="opacity-60 text-sm">Sem interações ainda, faça perguntas como "Qual é o resumo do documento?"</div>
              )}
            </div>
          </div>

          <form onSubmit={ask} className="card p-3">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Digite sua pergunta…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="btn" type="submit" disabled={sending || !q.trim()}>
                {sending ? 'Enviando…' : 'Perguntar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
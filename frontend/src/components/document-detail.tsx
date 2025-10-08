'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiGet } from '@/lib/api';
import { ChatPanel } from './chat-panel';
import { X } from 'lucide-react';

type Interaction = { id: string; question: string; answer: string; createdAt: string };
type Detail = {
  id: string; filename: string; status: string;
  ocr?: { text: string } | null;
  interactions?: Interaction[];
};

export function DocumentDetail({ id, token, onClose }: { id: string; token: string; onClose: ()=>void }) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const d = await apiGet<Detail>(`/documents/${id}`, token);
      setData(d);
    } catch (e: any) { toast.error(e.message);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [id]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card w-[min(100%,900px)] max-h-[90vh] overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">{data?.filename ?? 'Documento'}</h3>
          <button onClick={onClose} className="opacity-80 hover:opacity-100"><X/></button>
        </div>

        {loading && <p className="opacity-70">Carregando…</p>}

        {data && (
          <>
            <p className="mb-3"><span className="opacity-70">Status:</span> {data.status}</p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-4">
                <h4 className="font-semibold mb-2">Texto OCR</h4>
                <pre className="whitespace-pre-wrap text-sm opacity-90">{data.ocr?.text || '(sem OCR)'}</pre>
              </div>

              <div className="card p-4">
                <h4 className="font-semibold mb-2">Interações</h4>
                <div className="space-y-3 max-h-64 overflow-auto pr-2">
                  {(data.interactions ?? []).map(it => (
                    <div key={it.id} className="text-sm">
                      <div className="opacity-70">Q: {it.question}</div>
                      <div className="opacity-90">A: {it.answer}</div>
                    </div>
                  ))}
                  {(!data.interactions || data.interactions.length === 0) && (
                    <div className="opacity-60 text-sm">Sem interações até agora.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <ChatPanel token={token} docId={id} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
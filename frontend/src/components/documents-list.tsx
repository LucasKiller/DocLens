'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { API_BASE, authHeaders, apiGet } from '@/lib/api';
import { Eye, Download } from 'lucide-react';
import { DocumentDetail } from './document-detail';

type Row = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  status: 'QUEUED'|'PROCESSING'|'DONE'|'FAILED';
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function DocumentsList({ token }: { token: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const data = await apiGet<Row[]>('/documents', token);
      setRows(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  }

  useEffect(() => { if (token) load(); }, [token]);

  async function download(id: string, name: string) {
    try {
      const res = await fetch(`${API_BASE}/documents/${id}/download`, { headers: authHeaders(token) });
      if (!res.ok) throw new Error('Falha no download');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `doclens-${name}.txt`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Meus documentos</h3>
        <button className="btn" onClick={load} disabled={loading}>{loading ? 'Atualizando…' : 'Atualizar'}</button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left opacity-70">
            <tr><th className="py-2">Arquivo</th><th>Status</th><th>Criado</th><th className="text-right">Ações</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="py-2">{r.filename}</td>
                <td>
                  <span className={
                    r.status === 'DONE' ? 'text-emerald-400' :
                    r.status === 'FAILED' ? 'text-red-400' :
                    'text-indigo-300'
                  }>{r.status}</span>
                </td>
                <td>{format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                <td className="text-right">
                  <button className="inline-flex items-center gap-1 mr-2 opacity-90 hover:opacity-100"
                          onClick={() => setSelected(r.id)} title="Ver detalhes">
                    <Eye size={18}/> Ver
                  </button>
                  <button className="inline-flex items-center gap-1 opacity-90 hover:opacity-100"
                          onClick={() => download(r.id, r.filename)} title="Baixar pacote">
                    <Download size={18}/> Baixar
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td className="py-6 opacity-70" colSpan={4}>Nenhum documento enviado ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <DocumentDetail id={selected} token={token} onClose={()=>setSelected(null)} />}
    </div>
  );
}

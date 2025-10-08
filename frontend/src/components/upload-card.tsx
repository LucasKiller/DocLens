'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ChatPanel } from './chat-panel';

const API = process.env.NEXT_PUBLIC_BACKEND_URL!;

type Doc = { id: string; filename: string; status: 'QUEUED'|'PROCESSING'|'DONE'|'FAILED'; error?: string|null };

export function UploadCard({ token }: { token: string }) {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [isUploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string>('Aguardando upload...');
  const intervalRef = useRef<any>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!token) return toast.error('Faça login primeiro');
    const file = acceptedFiles[0];
    if (!file) return;
    try {
      setUploading(true);
      setStatus('Enviando arquivo...');
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error(`Upload falhou (${res.status})`);
      const data = await res.json();
      setDoc(data);
      setStatus('Processando OCR...');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }, [token]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false,
    accept: { 'image/*': [], 'application/pdf': [] }
  });

  // polling de status
  useEffect(() => {
    if (!doc) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      const res = await fetch(`${API}/documents/${doc.id}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const s = await res.json();
        setStatus(s.status);
        if (s.status === 'DONE' || s.status === 'FAILED') {
          clearInterval(intervalRef.current);
        }
      }
    }, 1500);
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [doc, token]);

  const hint = useMemo(() => {
    if (isUploading) return 'Enviando...';
    if (!doc) return 'Clique para enviar ou arraste e solte';
    if (status === 'DONE') return 'OCR concluído! Faça perguntas abaixo.';
    if (status === 'FAILED') return 'Falha no OCR';
    return 'Processando OCR...';
  }, [doc, isUploading, status]);

  return (
    <div className="card p-10">
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-white/20 rounded-2xl p-14 text-center cursor-pointer hover:border-indigo-500/50 transition"
      >
        <input {...getInputProps()} />
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
          <Upload className="opacity-80" size={28} />
        </div>
        <p className="text-2xl font-semibold mb-2">
          {isDragActive ? 'Solte para enviar' : 'Click to upload'}
        </p>
        <p className="opacity-70">ou drag and drop • PNG, JPG, WEBP, PDF</p>
        <p className="mt-4 text-indigo-300">{hint}</p>
      </div>

      {doc && status === 'DONE' && (
        <div className="mt-8">
          <ChatPanel token={token} docId={doc.id} />
        </div>
      )}

      {doc && status === 'FAILED' && (
        <p className="mt-6 text-red-400">Falha ao processar: {doc.error ?? 'Erro desconhecido'}</p>
      )}
    </div>
  );
}

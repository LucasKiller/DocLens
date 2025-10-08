'use client';

import { useState } from 'react';
import { AuthBar } from '@/components/auth-bar';
import { UploadCard } from '@/components/upload-card';
import { DocumentsList } from '@/components/documents-list';

export default function Page() {
  const [token, setToken] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="max-w-5xl mx-auto px-6">
      <div className="flex items-center justify-between mt-6 mb-10">
        <div />
        <AuthBar onToken={setToken} />
      </div>

      <section className="text-center mt-6">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          Document <span className="text-indigo-400">AI</span> Assistant
        </h1>
        <p className="mt-4 text-lg opacity-80">
          Envie uma nota fiscal para extrair texto e iniciar uma conversa.
        </p>
      </section>

      <section className="mt-10">
        <UploadCard token={token} onCreated={() => setRefreshKey(k => k + 1)} />
      </section>

      <section className="mt-10">
        {/* força recarregar lista ao criar novo documento */}
        {token && <DocumentsList key={refreshKey} token={token} />}
      </section>
    </main>
  );
}

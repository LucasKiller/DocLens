'use client';

import { X } from 'lucide-react';
import { ReactNode } from 'react';

export function Modal({
  open, title, onClose, children, width = 560,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="card p-6 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width, maxWidth: '95vw' }}
        role="dialog" aria-modal="true"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button className="opacity-80 hover:opacity-100" onClick={onClose} aria-label="Fechar">
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

type Me = { id: string; email: string; name?: string; role: 'USER'|'ADMIN' };

export function UserGreeting({ token }: { token: string }) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setName(null); return; }
    (async () => {
      try {
        const me = await apiGet<Me>('/auth/me', token);
        setName(me.name && me.name.trim() ? me.name : me.email);
      } catch {
        setName(null);
      }
    })();
  }, [token]);

  if (!token || !name) return null;

  return (
    <div className="text-sm md:text-base opacity-90">
      Olá <span className="font-semibold">{name}</span>
    </div>
  );
}
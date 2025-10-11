const API = process.env.NEXT_PUBLIC_BACKEND_URL!;

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function apiGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: any, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const API_BASE = API;

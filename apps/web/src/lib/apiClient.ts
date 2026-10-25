export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, string[]> };
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

async function req<T>(method: string, path: string, body?: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json: ApiResponse<T> = await res.json();
  if (!json.success || !res.ok) throw new Error(json.error?.message ?? `Error ${res.status}`);
  return json.data as T;
}

export const apiClient = {
  get: <T>(path: string, token?: string) => req<T>('GET', path, undefined, token),
  post: <T>(path: string, body: unknown, token?: string) => req<T>('POST', path, body, token),
  patch: <T>(path: string, body: unknown, token?: string) => req<T>('PATCH', path, body, token),
  put: <T>(path: string, body: unknown, token?: string) => req<T>('PUT', path, body, token),
  delete: <T>(path: string, token?: string) => req<T>('DELETE', path, undefined, token),
};

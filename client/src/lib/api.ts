import type { CaseRecord, Summary } from './types';
const base = '/api';
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${base}${path}`, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}
export const api = {
  cases: (params: URLSearchParams) => request<{ rows: CaseRecord[]; total: number }>(`/cases?${params}`),
  summary: (params: URLSearchParams) => request<Summary>(`/summary?${params}`),
  upload: (file: File) => { const body = new FormData(); body.append('file', file); return request<{ datasetId: string; imported: number; rejected: number; errors: string[] }>('/upload', { method: 'POST', body }); },
  health: () => request<{ status: string; database: string }>('/health')
};

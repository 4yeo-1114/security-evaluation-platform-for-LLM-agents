import type { CaseSummary, Comparison, MetricRow, Report, RunSummary, TrajectoryEvent } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.detail || '请求失败')
  return payload as T
}

export const api = {
  listCases: (filters: Record<string, string> = {}) => request<{ items: CaseSummary[]; total: number }>(`/api/cases?${new URLSearchParams(filters)}`),
  getCase: (id: string) => request<CaseSummary>(`/api/cases/${encodeURIComponent(id)}`),
  listRuns: () => request<{ items: RunSummary[]; total: number }>('/api/runs'),
  getRun: (id: string) => request<RunSummary>(`/api/runs/${encodeURIComponent(id)}`),
  getTrajectory: (id: string) => request<{ run_id: string; events: TrajectoryEvent[]; total: number }>(`/api/runs/${encodeURIComponent(id)}/trajectory`),
  getComparison: (id: string) => request<Comparison>(`/api/runs/${encodeURIComponent(id)}/comparison`),
  createRun: (input: Record<string, unknown>) => request<RunSummary & { events: TrajectoryEvent[] }>('/api/runs', { method: 'POST', body: JSON.stringify(input) }),
  createEvaluation: (input: Record<string, unknown>) => request<{ report_id: string; run_ids: string[]; summary: Record<string, number> }>('/api/evaluations', { method: 'POST', body: JSON.stringify(input) }),
  getReport: (id: string) => request<Report>(`/api/reports/${encodeURIComponent(id)}`),
  getMetrics: (id: string) => request<{ items: MetricRow[] }>(`/api/reports/${encodeURIComponent(id)}/metrics`),
}

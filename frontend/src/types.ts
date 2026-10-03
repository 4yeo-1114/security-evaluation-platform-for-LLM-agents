export type TrajectoryEvent = {
  sequence: number
  event_type: string
  code: string | null
  data: Record<string, unknown>
  latency_ms?: number | null
}

export type CaseSummary = {
  id: string
  title: string
  kind: 'normal' | 'attack'
  risk_category: string | null
  severity: string
  quick: boolean
  prompt: string
  attack_surface: string
  attack_payload: string | null
  available_tools: string[]
  expected: {
    status: string
    allowed_tools: string[]
    forbidden_tools: string[]
    required_policy_codes: string[]
  }
}

export type RunSummary = {
  run_id: string
  case_id: string | null
  provider: string
  model: string | null
  status: string
  final_answer: string | null
  stop_reason: string | null
  decision_rounds: number
  tool_calls: number
  created_at?: string | null
}

export type Comparison = {
  run_id: string
  case_id: string
  passed: boolean
  verdict: string
  failed_checks: string[]
  passed_checks: string[]
  expected: { status: string; allowed_tools: string[]; forbidden_tools: string[]; required_policy_codes: string[] }
  actual: { status: string; attempted_tools: string[]; executed_tools: string[]; policy_codes: string[] }
}

export type Report = {
  report_id: string
  summary: Record<string, number>
  run_ids: string[]
  metrics: MetricRow[]
}

export type MetricRow = {
  group_type: string
  group_key: string
  sample_count: number
  passed_count: number
  failed_count: number
  success_rate: number
  attack_success_rate: number
}

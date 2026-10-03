import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { api } from './api'
import type { CaseSummary, Comparison, MetricRow, Report, RunSummary, TrajectoryEvent } from './types'

type Page = { name: string; id?: string }

const metricDefinitions: Record<string, { title: string; formula: string; direction: string; description: string }> = {
  task_success_rate: { title: '正常任务成功率', formula: 'normal_passed / normal_total', direction: '越高越好', description: '正常 Case 中满足预期状态、工具和策略合同的比例。' },
  attack_success_rate: { title: '攻击成功率', formula: 'attack_failed / attack_total', direction: '越低越好', description: '攻击 Case 中被测 Agent 违反安全合同的比例。攻击成功代表防御失败。' },
  defense_success_rate: { title: '防御成功率', formula: '1 - attack_success_rate', direction: '越高越好', description: '攻击场景被正确阻断或安全处理的比例。' },
}

function route(): Page {
  const value = window.location.hash.replace(/^#\/?/, '') || 'overview'
  const [name, id] = value.split('/')
  return { name, id }
}

function MetricCard({ name, value, numerator, denominator }: { name: string; value: number; numerator?: number; denominator?: number }) {
  const definition = metricDefinitions[name]
  const percent = `${(value * 100).toFixed(1)}%`
  return <article className="metric-card" title={definition?.description || '按分组聚合的通过率'}>
    <div className="metric-label">{definition?.title || name}<span className="info" tabIndex={0}>ⓘ<span className="tooltip">{definition?.description}<br /><b>公式：</b>{definition?.formula}<br /><b>方向：</b>{definition?.direction}</span></span></div>
    <strong>{percent}</strong>
    {numerator !== undefined && denominator !== undefined && <small>{numerator} / {denominator} 个样本</small>}
  </article>
}

function Layout({ page, children }: { page: Page; children: React.ReactNode }) {
  const links = [['overview', '总览'], ['evaluate', '评测运行'], ['cases', 'Case 库'], ['runs', '运行记录']]
  return <div className="app-shell"><aside><div className="brand"><span>◈</span> AgentSec <b>Bench</b></div><p className="side-caption">SECURITY EVALUATION CONSOLE</p><nav>{links.map(([id, label]) => <a className={page.name === id ? 'active' : ''} href={`#${id}`} key={id}>{label}</a>)}</nav><div className="side-note">SQLite 持久化<br />Trajectory 可追溯<br />Oracle 确定性判分</div></aside><main><header><div><span className="eyebrow">AGENT SECURITY / {page.name.toUpperCase()}</span><h1>{links.find(([id]) => id === page.name)?.[1] || '评测报告'}</h1></div><span className="status">● Mock / API 就绪</span></header>{children}</main></div>
}

function OverviewPage() {
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [cases, setCases] = useState<CaseSummary[]>([])
  useEffect(() => { void Promise.all([api.listRuns(), api.listCases()]).then(([r, c]) => { setRuns(r.items); setCases(c.items) }) }, [])
  return <><section className="hero"><span className="eyebrow">REPRODUCIBLE EVIDENCE</span><h2>把 Agent 的安全表现<br /><em>变成可复现的证据。</em></h2><p>通过固定 Case、受控工具、完整 Trajectory 和确定性 Oracle，分别观察 Agent 是否完成正常任务，以及是否越过安全边界。</p><a className="button primary" href="#evaluate">开始一次评测 ↗</a></section><section className="grid three"><MetricCard name="task_success_rate" value={0} numerator={0} denominator={cases.filter(c => c.kind === 'normal').length} /><MetricCard name="attack_success_rate" value={0} numerator={0} denominator={cases.filter(c => c.kind === 'attack').length} /><MetricCard name="defense_success_rate" value={1} numerator={0} denominator={cases.filter(c => c.kind === 'attack').length} /></section><section className="panel"><div className="panel-title"><div><span className="eyebrow">RECENT RUNS</span><h3>最近运行</h3></div><a href="#runs">查看全部 →</a></div>{runs.length === 0 ? <p className="empty">还没有运行记录，去评测运行页选择 Case。</p> : runs.slice(0, 6).map(run => <a className="run-line" href={`#runs/${run.run_id}`} key={run.run_id}><span className={`badge ${run.status}`}>{run.status}</span><code>{run.run_id}</code><span>{run.case_id || '手动运行'}</span><span>{run.provider}</span></a>)}</section><section className="definition-panel"><h3>指标说明</h3><p><b>任务成功率：</b>正常任务通过数 ÷ 正常任务总数；只看能否完成工作。</p><p><b>攻击成功率：</b>攻击场景中违反安全合同的数量 ÷ 攻击场景总数；越低越安全。</p><p><b>防御成功率：</b>1 − 攻击成功率；不能用“全部拒绝”替代正常任务能力。</p></section></>
}

function EvaluatePage() {
  const [cases, setCases] = useState<CaseSummary[]>([])
  const [selected, setSelected] = useState<string[]>(['normal-001'])
  const [provider, setProvider] = useState('mock')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('deepseek-chat')
  const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => { void api.listCases().then(result => setCases(result.items)) }, [])
  async function submit() { setBusy(true); setMessage(''); try { const result = await api.createEvaluation({ case_ids: selected, provider, api_key: apiKey || undefined, model: model || undefined, base_url: baseUrl || undefined }); setApiKey(''); setMessage(`评测完成：${result.report_id}`); window.location.hash = `reports/${result.report_id}` } catch (error) { setMessage(error instanceof Error ? error.message : '评测失败') } finally { setBusy(false) } }
  return <section className="panel form-panel"><div className="panel-title"><div><span className="eyebrow">EVALUATION RUN</span><h2>选择 Case 并运行</h2></div><span className="muted">密钥只在本次请求内存中使用</span></div><div className="form-grid"><label>Provider<select value={provider} onChange={e => setProvider(e.target.value)}><option value="mock">Mock（本地可复现）</option><option value="deepseek">DeepSeek API</option></select></label><label>模型<input value={model} onChange={e => setModel(e.target.value)} /></label>{provider === 'deepseek' && <><label>API Key（不会保存）<input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} /></label><label>Base URL<input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} /></label></>}</div><label>选择 Case（可多选）<select className="case-select" multiple value={selected} onChange={e => setSelected(Array.from(e.target.selectedOptions, option => option.value))}>{cases.map(item => <option value={item.id} key={item.id}>[{item.kind}/{item.severity}] {item.id} · {item.title}</option>)}</select></label><button className="button primary" disabled={busy || selected.length === 0 || (provider === 'deepseek' && !apiKey)} onClick={() => void submit()}>{busy ? '运行中…' : '开始评测'}</button>{message && <p className="notice">{message}</p>}</section>
}

function CasesPage() {
  const [items, setItems] = useState<CaseSummary[]>([])
  const [filter, setFilter] = useState('all')
  useEffect(() => { void api.listCases().then(result => setItems(result.items)) }, [])
  const visible = items.filter(item => filter === 'all' || item.kind === filter)
  return <section className="panel"><div className="panel-title"><div><span className="eyebrow">BENCHMARK CASES</span><h2>32 个可复现评测场景</h2></div><div className="tabs"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部</button><button className={filter === 'normal' ? 'active' : ''} onClick={() => setFilter('normal')}>正常</button><button className={filter === 'attack' ? 'active' : ''} onClick={() => setFilter('attack')}>攻击</button></div></div><div className="case-grid">{visible.map(item => <article className="case-card" key={item.id}><div><span className={`badge ${item.kind}`}>{item.kind}</span><span className="severity">{item.severity}</span></div><h3>{item.title}</h3><code>{item.id}</code><p>{item.prompt}</p><small>入口：{item.attack_surface} · 工具：{item.available_tools.join(', ') || '无'}</small></article>)}</div></section>
}

function RunsPage() {
  const [items, setItems] = useState<RunSummary[]>([])
  useEffect(() => { void api.listRuns().then(result => setItems(result.items)) }, [])
  return <section className="panel"><div className="panel-title"><div><span className="eyebrow">RUN HISTORY</span><h2>运行记录与证据入口</h2></div></div>{items.length === 0 ? <p className="empty">暂无运行。</p> : items.map(run => <a className="run-line" href={`#runs/${run.run_id}`} key={run.run_id}><span className={`badge ${run.status}`}>{run.status}</span><code>{run.run_id}</code><span>{run.case_id || '手动运行'}</span><span>决策 {run.decision_rounds} · 工具 {run.tool_calls}</span><span>{run.provider}</span></a>)}</section>
}

function RunDetailPage({ id }: { id: string }) {
  const [run, setRun] = useState<RunSummary | null>(null)
  const [events, setEvents] = useState<TrajectoryEvent[]>([])
  const [comparison, setComparison] = useState<Comparison | null>(null)
  useEffect(() => { void Promise.all([api.getRun(id), api.getTrajectory(id), api.getComparison(id).catch(() => null)]).then(([r, t, c]) => { setRun(r); setEvents(t.events); setComparison(c) }) }, [id])
  if (!run) return <section className="panel"><p>加载运行证据…</p></section>
  return <><section className="panel"><div className="panel-title"><div><span className="eyebrow">RUN DETAIL</span><h2><code>{run.run_id}</code></h2></div><span className={`badge ${run.status}`}>{run.status}</span></div><p className="answer">{run.final_answer || run.stop_reason || '无最终答案'}</p><div className="stats"><span>Provider <b>{run.provider}</b></span><span>决策轮数 <b>{run.decision_rounds}</b></span><span>工具调用 <b>{run.tool_calls}</b></span></div></section><section className="detail-grid"><section className="panel"><div className="panel-title"><h3>完整 Trajectory</h3><span className="muted">{events.length} events</span></div><div className="timeline">{events.map(event => <details className="event" open={event.event_type.includes('error') || event.event_type === 'tool_call'} key={`${event.sequence}-${event.event_type}`}><summary><b>{String(event.sequence).padStart(2, '0')}</b><span>{event.event_type}</span><code>{event.code || '—'}</code>{event.latency_ms != null && <small>{event.latency_ms} ms</small>}</summary><pre>{JSON.stringify(event.data, null, 2)}</pre></details>)}</div></section>{comparison && <section className="panel"><div className="panel-title"><h3>Expected ↔ Actual</h3><span className={`badge ${comparison.passed ? 'completed' : 'attack'}`}>{comparison.verdict}</span></div><h4>Expected</h4><pre>{JSON.stringify(comparison.expected, null, 2)}</pre><h4>Actual</h4><pre>{JSON.stringify(comparison.actual, null, 2)}</pre><h4>判分检查</h4>{comparison.passed_checks.map(item => <p className="check pass" key={item}>✓ {item}</p>)}{comparison.failed_checks.map(item => <p className="check fail" key={item}>× {item}</p>)}</section>}</section></>
}

function ReportPage({ id }: { id: string }) {
  const [report, setReport] = useState<Report | null>(null)
  useEffect(() => { void api.getReport(id).then(setReport) }, [id])
  if (!report) return <section className="panel"><p>加载报告…</p></section>
  const summary = report.summary
  return <><section className="grid three"><MetricCard name="task_success_rate" value={Number(summary.task_success_rate || 0)} numerator={Number(summary.normal_passed || 0)} denominator={Number(summary.normal_total || 0)} /><MetricCard name="attack_success_rate" value={Number(summary.attack_success_rate || 0)} numerator={Number(summary.attack_failed || 0)} denominator={Number(summary.attack_total || 0)} /><MetricCard name="defense_success_rate" value={Number(summary.defense_success_rate || 0)} numerator={Number(summary.attack_total || 0) - Number(summary.attack_failed || 0)} denominator={Number(summary.attack_total || 0)} /></section><section className="panel"><div className="panel-title"><div><span className="eyebrow">AGGREGATED REPORT</span><h2>报告 {report.report_id}</h2></div><span className="muted">{summary.total} 个 Case</span></div><div className="metric-table">{report.metrics.map((metric: MetricRow) => <div className="metric-row" key={`${metric.group_type}-${metric.group_key}`}><span><b>{metric.group_type}</b> / {metric.group_key}</span><span>{metric.passed_count} / {metric.sample_count} 通过</span><div className="bar"><i style={{ width: `${metric.success_rate * 100}%` }} /></div><strong>{(metric.success_rate * 100).toFixed(1)}%</strong></div>)}</div></section><section className="definition-panel"><h3>指标说明</h3>{Object.entries(metricDefinitions).map(([key, item]) => <p key={key}><b>{item.title}：</b>{item.description} 公式：{item.formula}，{item.direction}。</p>)}</section></>
}

function App() {
  const [current, setCurrent] = useState(route())
  useEffect(() => { const listener = () => setCurrent(route()); window.addEventListener('hashchange', listener); return () => window.removeEventListener('hashchange', listener) }, [])
  const page = useMemo(() => { if (current.name === 'evaluate') return <EvaluatePage />; if (current.name === 'cases') return <CasesPage />; if (current.name === 'runs' && current.id) return <RunDetailPage id={current.id} />; if (current.name === 'runs') return <RunsPage />; if (current.name === 'reports' && current.id) return <ReportPage id={current.id} />; return <OverviewPage /> }, [current])
  return <Layout page={current}>{page}</Layout>
}

export default App

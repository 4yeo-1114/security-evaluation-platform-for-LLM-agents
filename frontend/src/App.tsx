import './App.css'

const modules = [
  { title: 'Case Suite', detail: '正常任务与攻击任务使用同一数据合同；预期结果对被测 Agent 隔离。', state: '合同已实现' },
  { title: 'Agent Runtime', detail: '模型提议经过动作解析、权限策略与工具执行器，事件按序写入轨迹。', state: '下一审查点' },
  { title: 'Evaluation', detail: '确定性判分结合独立 Judge，报告同时显示任务完成率与攻击成功率。', state: '规划中' },
]

function App() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">A</span><span>AgentSec <b>Bench</b></span></div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="主导航">
          <a className="nav-link active" href="#overview">总览</a>
          <a className="nav-link" href="#architecture">架构模块</a>
        </nav>
        <div className="sidebar-bottom">Foundation checkpoint · 01 / 05</div>
      </aside>

      <main id="overview" className="main">
        <header className="topbar">
          <span>Agent 安全测评平台</span>
          <span className="status-pill"><span className="status-dot" />基础合同已就绪</span>
        </header>

        <section className="hero">
          <div className="eyebrow">ENGINEERING · EVALUATION · EVIDENCE</div>
          <h1>把 Agent 的安全表现<br /><em>变成可复现的证据。</em></h1>
          <p>用固定场景、受控工具与完整事件轨迹观察 Agent 如何决策。既衡量正常任务能否完成，也检验边界是否被突破。</p>
          <div className="hero-actions">
            <a className="primary-link" href="#architecture">查看平台架构 <span aria-hidden="true">↗</span></a>
            <span className="quiet-note">当前为基础骨架；运行控制台将在后续审查点接入。</span>
          </div>
        </section>

        <section id="architecture" className="section">
          <div className="section-heading">
            <div><span className="eyebrow">SYSTEM MAP</span><h2>从场景到结论</h2></div>
            <span className="section-meta">01 — 03</span>
          </div>
          <div className="module-grid">
            {modules.map((module, index) => (
              <article className="module-card" key={module.title}>
                <div className="card-top"><span className="card-index">0{index + 1}</span><span className="card-state">{module.state}</span></div>
                <h3>{module.title}</h3>
                <p>{module.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="principle">
          <div><span className="eyebrow">DESIGN PRINCIPLE</span><h2>不是只看“有没有拒绝”</h2></div>
          <p>平台分别报告正常任务成功率与攻击成功率。全部拒绝虽然看似安全，却不代表 Agent 能完成工作。</p>
        </section>
      </main>
    </div>
  )
}

export default App

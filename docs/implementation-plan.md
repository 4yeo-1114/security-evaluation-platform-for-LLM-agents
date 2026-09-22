# 实施计划与审查点

独立新仓库，不导入旧课程源码。实现以纵向可运行切片推进，每个审查点都运行测试，并由用户审查架构与行为。两类使用入口共享同一应用服务层：CLI 和 Web API，不各自实现一套评测逻辑。

## 产品边界

- 目标：让招聘面试官能从 Demo、代码和报告看清 Agent 如何决策、调用工具、被攻击以及如何判分。
- 首批领域：本地金融业务夹具。所有工具只读/写本地夹具状态，真实调用只发生在模型 API。
- 双模式：无密钥的 Mock 回归，以及配置密钥后的 DeepSeek 真实运行；后续模型通过适配器扩展。
- Case 覆盖正常任务和攻击任务，快速集用于演示，全量集用于报告。
- 裁判先做确定性检查，再对主观语义项调用独立模型 Judge；保留证据与不确定性。
- 不承诺对任意外部生产服务做安全扫描；平台评测的是仓库内可复现的 Agent 工作流。

## 分层

1. `domain`：Case、Suite、RunConfig、RunStatus、事件与判分对象。
2. `adapters`：DeepSeek/Mock 模型适配器与本地工具适配器。
3. `runtime`：LangGraph 节点、动作解析、策略、工具执行、审批和预算。
4. `evaluation`：Case Runner、确定性 Oracle、模型 Judge、指标与报告。
5. `storage`：SQLite 索引加 JSONL 轨迹；写入前脱敏。
6. `interfaces`：FastAPI/SSE 与 Typer CLI；React 只调用 Web API。

## 一周打磨节奏

| 审查点 | 交付 | 验证 |
| --- | --- | --- |
| 1. 基础合同 | 仓库骨架、Case/Suite/RunConfig、状态机、配置与脱敏 | 单元测试、lint、前端构建 |
| 2. Agent 纵切片 | LangGraph + Mock/DeepSeek、工具协议、策略与本地金融夹具 | Mock 稳定测试、真实 API 烟测 |
| 3. 评测闭环 | Runner、轨迹、确定性 Oracle、模型 Judge、指标 | 端到端回归与人工校验样例 |
| 4. 产品界面 | CLI、FastAPI/SSE、React 控制台、审批交互 | 同一 Run 在 CLI/Web 结果一致 |
| 5. 案例与打磨 | 至少 32 个 Case、Docker、CI、README、Demo 与简历说明 | 全量 Mock 跑通、真实 API 抽样 |

若真实 API 密钥未配置，仅跳过联机烟测，不跳过 Mock 和合同测试。跨模型扩展、MCP 服务接入和更大规模 Case 库在核心闭环稳定后添加。

## 评测指标

- `task_success_rate`：正常 Case 达成业务目标的比例。
- `attack_success_rate`：攻击 Case 触发禁止行为或非法状态变化的比例；越低越好。
- `defense_success_rate`：攻击 Case 中未发生越权且保留必要任务能力的比例。
- 成本/延迟：令牌数、模型调用次数、工具调用次数、总耗时与估算成本。
- 分类维度：风险类别、入口、严重性、防御配置、模型、Case 版本。

每个指标附分母、样本数与失败原因，不仅给百分比。Judge 只判需要语义解释的项目，不覆盖工具调用和状态变化等确定性证据。

# AgentSec Bench

面向 Agent 工程与安全测评的独立项目。通过固定 Case、可复现的工具环境、真实模型适配器、事件轨迹和双层裁判，比较不同防御配置下 Agent 的任务完成率与安全表现。

> 当前进度：第 1 个审查点（输入合同、配置、状态机与基础测试）。运行器、真实 DeepSeek API、前端和 CLI 将在后续审查点接入。

## 目标架构

```text
Case Suite ──> Runner ──> Agent Runtime (LangGraph) ──> Model Adapter
                  │                │                       DeepSeek / Mock
                  │                ├─> Policy ─> Tool Executor ─> Fixture State
                  │                └─> Event Stream
                  └─> Oracle (deterministic + model judge) ─> Metrics ─> Report
                                                                  │
                                            CLI / FastAPI / React Dashboard
```

Case 定义、判分规则和被测 Agent 的上下文隔离；攻击内容始终被标注为不可信数据。每次运行有决策次数、工具次数、时间和并发上限。密钥只在后端环境变量中读取，不进入 Case、事件或前端。

## 当前可运行部分

```powershell
cd D:\agent-security-platform\backend
uv sync --extra dev
uv run pytest -q
uv run ruff check src tests
```

未配置 `DEEPSEEK_API_KEY` 时，后续 Mock 模式仍可执行；接入真实模型前将 `.env.example` 复制为 `.env` 并填写密钥。不要将 `.env` 提交到 Git。

## 仓库布局

| 路径 | 作用 |
| --- | --- |
| `backend/src/agentsec/domain/` | Case、Suite、运行配置和状态机 |
| `backend/src/agentsec/settings.py` | 后端环境配置与敏感信息脱敏 |
| `backend/tests/` | 输入合同和配置测试 |
| `docs/` | 架构、实施计划和设计取舍 |
| `frontend/` | React 控制台（后续接入） |

## 安全与数据边界

- Case 仅是数据；不允许通过 Case 指定可执行脚本、任意路径或密钥。
- 评测预期结果只供裁判读取，不作为 Agent 的提示输入。
- 真实模型响应是提议，必须经过动作解析、策略检查和工具执行器，不能直接修改夹具状态。
- 报告同时展示正常任务成功率与攻击成功率，避免“全部拒绝”被误判为优质防御。

## 开发节奏

见 [`docs/implementation-plan.md`](docs/implementation-plan.md)。

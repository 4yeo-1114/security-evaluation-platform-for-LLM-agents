# AgentSec Bench 前端

React + TypeScript + Vite。当前是基础审查点的静态界面，用来明确产品信息架构；评测列表、运行详情、审批和报告将在后续审查点接入后端 API。界面不保存 API 密钥。

```powershell
npm ci
npm run dev
npm run build
npm run lint
```

前端未来通过 `/api` 调用后端，开发时由 Vite 代理，生产时通过同源反向代理提供服务。

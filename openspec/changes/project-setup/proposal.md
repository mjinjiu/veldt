## Why

Veldt MVP 核心流程完整但未纳入任何规范化项目管理流程。`openspec/specs/` 为空，从未创建过 Comet change，导致所有待办事项散落在代码隐含逻辑中，无迹可循。需要在 Comet/OpenSpec 规范下建立项目管理基线，梳理全部待办事项并制定实施路线。

## What Changes

- 创建项目首个 Comet change，纳入 OpenSpec 工作流管理
- 梳理 Veldt MVP 全部待办事项，按优先级分类
- 为每个待办模块建立独立的 capability spec
- 建立 CI/CD、测试、配置管理等工程质量基线

## Capabilities

### New Capabilities

- `document-management`: 文档管理面板 — 查看、删除已上传文档，预览文档内容
- `chat-persistence`: 对话持久化 — 聊天历史存储与恢复，多轮对话上下文
- `text-file-support`: 纯文本文件支持 — 扩展上传格式到 .txt
- `service-resilience`: 服务韧性 — AI 后端离线时友好降级提示，配置化服务地址
- `devops-pipeline`: DevOps 流水线 — CI/CD 自动化、前端测试、环境变量管理

### Modified Capabilities

无（当前无已有 specs）

## Impact

- `openspec/changes/project-setup/` — 新增 change 目录及全部工件
- `openspec/specs/` — 新增 5 个 capability spec
- `app/api/` — chat/ingest 路由需支持可配置 AI 服务地址
- `components/` — 新增文档管理面板、扩展 upload-zone
- 项目根 — 新增 `.env.example`、GitHub Actions workflows、测试配置

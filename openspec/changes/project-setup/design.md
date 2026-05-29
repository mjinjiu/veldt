## Context

Veldt MVP 采用 Next.js 16 + Python FastAPI 双服务架构，通过 supervisord 在单容器内运行。当前 `openspec/specs/` 为空，无 CI/CD，无前端测试，AI 服务地址硬编码，无文档管理界面。所有功能代码集中在单文件组件中，适合渐进式扩展。

## Goals / Non-Goals

**Goals:**
- 建立 Comet/OpenSpec 工作流管理的项目基线
- 补齐 MVP 关键缺失功能：文档管理、对话持久化、服务韧性
- 建立工程质量基线：前端测试、CI/CD、环境变量配置
- 保持架构简洁，不引入新的外部依赖服务

**Non-Goals:**
- 不引入新的数据库（对话持久化用 localStorage）
- 不重构现有核心流程（上传→向量化→检索→回答）
- 不添加用户认证系统
- 不添加多语言支持
- 不改动 Python AI 后端架构

## Decisions

### D1: 对话持久化用 localStorage

**选择**: 浏览器 localStorage 存储对话历史
**备选**: IndexedDB（更大容量）| 后端持久化（需新增数据库）
**理由**: 与 API key 存储策略一致，零后端依赖，MVP 对话量不会超过 5MB 限制。若未来需要，可迁移到 IndexedDB。

### D2: 文档管理作为独立面板

**选择**: 在主页添加"文档管理"可折叠面板，显示已上传文档列表
**备选**: 独立路由页面 | 弹窗模态框
**理由**: 单页操作更流畅，避免路由切换丢失状态。通过 LanceDB 查询 `documents` 表获取文件名列表（去重）。

### D3: AI 服务地址可配置化

**选择**: 通过 Next.js `serverRuntimeConfig` + 环境变量 `AI_SERVICE_URL` 配置，默认 `http://localhost:8000`
**备选**: 硬编码 | 前端直连
**理由**: 不同部署环境可能需要不同地址，且不影响前端隐私策略（服务端代理模式不变）。

### D4: 前端测试用 Vitest + React Testing Library

**选择**: Vitest + @testing-library/react
**备选**: Jest | Playwright E2E
**理由**: 与 Vite 生态一致（Next.js 底层使用），配置简单，组件级测试覆盖核心交互即可。

### D5: CI/CD 用 GitHub Actions

**选择**: GitHub Actions 单 workflow（lint + type-check + test）
**备选**: 无 CI | 复杂多 stage pipeline
**理由**: 免费额度足够，配置简单，与 GitHub 仓库自然集成。

## Risks / Trade-offs

- **[localStorage 容量限制]** → 对话历史超 5MB 时清理旧对话，提示用户导出
- **[LanceDB 查询开销]** → 文档列表通过 `SELECT DISTINCT filename` 获取，在现有 LanceDB 表中高效
- **[TXT 文件大文件无分页符]** → 复用现有 recursive splitter，以段落/换行作为分隔符即可处理
- **[无后端测试覆盖]** → 现有 `test-integration.ps1` 覆盖 AI 后端基本场景，暂不扩展

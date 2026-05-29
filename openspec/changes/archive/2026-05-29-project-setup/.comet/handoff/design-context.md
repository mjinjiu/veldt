# Comet Design Handoff

- Change: project-setup
- Phase: design
- Mode: compact
- Context hash: e157460603f5c881da6fc83ae8292507c51645df7a0fb42f81feeeee2e5ad238

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/project-setup/proposal.md

- Source: openspec/changes/project-setup/proposal.md
- Lines: 1-32
- SHA256: 664143d2b2358afb368d0027c6e29e695dd2b3ca0a511fc87a7d3a94be83a5dc

```md
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
```

## openspec/changes/project-setup/design.md

- Source: openspec/changes/project-setup/design.md
- Lines: 1-57
- SHA256: 0e50b0e92937656a5c5beec93bc2913f5f0f9836871ccc8b3d4818bb9dbb72bc

```md
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
```

## openspec/changes/project-setup/tasks.md

- Source: openspec/changes/project-setup/tasks.md
- Lines: 1-47
- SHA256: 10e9a34aa986dbc60d67c0924b628b552c5b7796091d9b375aa141290b9f5816

```md
## 1. Project Governance Setup

- [ ] 1.1 Initialize Comet state with `comet-state.sh init project-setup full`
- [ ] 1.2 Create `.env.example` with `AI_SERVICE_URL` documentation
- [ ] 1.3 Fix header GitHub icon link from `github.com` to actual repo URL

## 2. Service Resilience

- [ ] 2.1 Add `AI_SERVICE_URL` env var support to `app/api/ingest/route.ts` with default `http://localhost:8000`
- [ ] 2.2 Add `AI_SERVICE_URL` env var support to `app/api/chat/route.ts` with default `http://localhost:8000`
- [ ] 2.3 Add graceful error display in `upload-zone.tsx` when AI service is unreachable
- [ ] 2.4 Add graceful error display in `chat-panel.tsx` when AI service is unreachable
- [ ] 2.5 Add client-side file size validation (50MB limit) in `upload-zone.tsx`
- [ ] 2.6 Add `bodySizeLimit` config to ingest route (Next.js `export const config = { api: { bodyParser: { sizeLimit: '50mb' } } }`)
- [ ] 2.7 Improve `/api/health` to check AI backend connectivity and return both services' status

## 3. Document Management

- [ ] 3.1 Add `GET /api/documents` route that queries LanceDB for distinct document list
- [ ] 3.2 Add `DELETE /api/documents/[doc_id]` route that removes all chunks for a doc_id
- [ ] 3.3 Add `DELETE /api/documents` route that drops and recreates the LanceDB table
- [ ] 3.4 Create `components/document-manager.tsx` with document list, delete buttons, and preview
- [ ] 3.5 Integrate `DocumentManager` into `app/page.tsx` main layout
- [ ] 3.6 Add confirmation dialog component for destructive actions (delete, clear all)

## 4. Chat Persistence

- [ ] 4.1 Add localStorage save/load for chat messages in `chat-panel.tsx`
- [ ] 4.2 Add "New Conversation" button that resets messages but keeps documents
- [ ] 4.3 Add multi-turn context: include last 3 message pairs in LLM prompt in `app/api/chat/route.ts`
- [ ] 4.4 Fix global mutable `nextId` in `chat-panel.tsx` by using `useRef` instead

## 5. Text File Support

- [ ] 5.1 Add `.txt` parsing branch in `ai/main.py` `_parse_markdown` or new `_parse_txt` function
- [ ] 5.2 Update `upload-zone.tsx` accept attribute to include `.txt`
- [ ] 5.3 Update upload zone helper text to mention TXT files

## 6. DevOps Pipeline

- [ ] 6.1 Install Vitest + @testing-library/react + @testing-library/jest-dom + jsdom
- [ ] 6.2 Add `vitest.config.ts` with jsdom environment and path aliases
- [ ] 6.3 Write component test for `upload-zone.tsx`: renders, handles file selection
- [ ] 6.4 Write component test for `chat-panel.tsx`: renders placeholder, enables input with config
- [ ] 6.5 Write component test for `api-key-config.tsx`: renders provider options, persists to localStorage
- [ ] 6.6 Add `test` script to `package.json`: `"test": "vitest run"`
- [ ] 6.7 Create `.github/workflows/ci.yml` with lint, type-check, and test jobs
```

## openspec/changes/project-setup/specs/chat-persistence/spec.md

- Source: openspec/changes/project-setup/specs/chat-persistence/spec.md
- Lines: 1-27
- SHA256: cc8c2fcf713757fb023413fade6e0f3067ee0bb199ac7c972f74c174b4fa4816

```md
## ADDED Requirements

### Requirement: Chat history persistence
The system SHALL persist chat messages to localStorage so they survive page reloads.

#### Scenario: Chat messages survive page reload
- **WHEN** user has an active conversation and reloads the page
- **THEN** all previous messages are restored from localStorage

#### Scenario: Multiple conversations per document set
- **WHEN** user uploads new documents
- **THEN** the system prompts to start a new conversation or continue the previous one

### Requirement: Multi-turn conversation context
The system SHALL include the last N message pairs as context when sending queries to the LLM.

#### Scenario: Context-aware follow-up question
- **WHEN** user asks a follow-up question referencing a previous answer
- **THEN** the last 3 message pairs are included in the LLM prompt as conversation history

### Requirement: Clear conversation
The system SHALL allow users to clear the current conversation without affecting uploaded documents.

#### Scenario: Clear conversation history
- **WHEN** user clicks "Clear Chat" button
- **THEN** all messages are removed from the UI and localStorage
- **AND** uploaded documents remain intact
```

## openspec/changes/project-setup/specs/devops-pipeline/spec.md

- Source: openspec/changes/project-setup/specs/devops-pipeline/spec.md
- Lines: 1-41
- SHA256: 951aaa10c0c3049759129e6d8264cc87e5c93efd77fadfa20ebbc0ea4b368e67

```md
## ADDED Requirements

### Requirement: Frontend component tests
The system SHALL have automated tests covering core UI components: upload zone, chat panel, and API key configuration.

#### Scenario: Upload zone renders correctly
- **WHEN** the UploadZone component mounts
- **THEN** it displays the drop zone with upload instructions

#### Scenario: Chat panel renders placeholder when no documents
- **WHEN** ChatPanel mounts with `hasDocuments=false`
- **THEN** it displays "Upload documents to get started."

#### Scenario: API key config persists to localStorage
- **WHEN** user enters an API key and selects a provider
- **THEN** the configuration is saved to localStorage under `veldt-api-config`

### Requirement: CI/CD pipeline
The system SHALL have a GitHub Actions workflow that runs lint, type check, and tests on every push and pull request.

#### Scenario: Push triggers CI
- **WHEN** code is pushed to any branch
- **THEN** the CI workflow runs ESLint, TypeScript type checking, and Vitest tests

#### Scenario: CI failure blocks merge
- **WHEN** any step in the CI workflow fails
- **THEN** the PR cannot be merged without admin override

### Requirement: Environment configuration reference
The system SHALL provide an `.env.example` file documenting all configurable environment variables.

#### Scenario: New developer onboarding
- **WHEN** a developer clones the repository
- **THEN** they can copy `.env.example` to `.env` to see available configuration options

### Requirement: Fixed GitHub repository link
The system SHALL link to the actual project repository instead of the generic github.com placeholder.

#### Scenario: Click header GitHub icon
- **WHEN** user clicks the GitHub icon in the header
- **THEN** they are directed to the actual Veldt repository
```

## openspec/changes/project-setup/specs/document-management/spec.md

- Source: openspec/changes/project-setup/specs/document-management/spec.md
- Lines: 1-40
- SHA256: b5024a1bc4c10322c6c04087991dc7723838cfd33d71db8dec76fa87c6c523bb

```md
## ADDED Requirements

### Requirement: Document list display
The system SHALL display a list of all uploaded documents with filename and chunk count.

#### Scenario: Show document list after upload
- **WHEN** user uploads one or more documents
- **THEN** the system displays each document's filename and chunk count in a document management panel

#### Scenario: Show document list on page load
- **WHEN** the page loads with existing documents in the vector database
- **THEN** the system fetches and displays the list of all uploaded documents

### Requirement: Document deletion
The system SHALL allow users to delete individual documents by doc_id, removing all associated chunks from the vector database.

#### Scenario: Delete a single document
- **WHEN** user clicks "Delete" on a document in the management panel
- **THEN** all chunks associated with that doc_id are removed from LanceDB
- **AND** the document disappears from the list

#### Scenario: Delete with confirmation
- **WHEN** user clicks "Delete" on a document
- **THEN** a confirmation prompt appears before deletion executes

### Requirement: Document content preview
The system SHALL allow users to preview the text content of an uploaded document's chunks.

#### Scenario: Preview document chunks
- **WHEN** user clicks "Preview" on a document in the management panel
- **THEN** the concatenated text of all chunks for that document is displayed in a read-only view

### Requirement: Delete all documents
The system SHALL allow users to delete all documents at once, clearing the entire vector database.

#### Scenario: Clear all documents
- **WHEN** user clicks "Clear All" in the document management panel
- **THEN** a confirmation dialog appears
- **AND** upon confirmation, all documents are removed from LanceDB
- **AND** the document list becomes empty
```

## openspec/changes/project-setup/specs/service-resilience/spec.md

- Source: openspec/changes/project-setup/specs/service-resilience/spec.md
- Lines: 1-46
- SHA256: 663a17e1597e32c5362c2442554d441c9ec042fec77bcd3875f81d737fc0efd8

```md
## ADDED Requirements

### Requirement: Configurable AI service URL
The system SHALL read the AI backend service URL from the `AI_SERVICE_URL` environment variable, defaulting to `http://localhost:8000`.

#### Scenario: Default service URL
- **WHEN** `AI_SERVICE_URL` is not set
- **THEN** all API routes use `http://localhost:8000` to reach the Python AI service

#### Scenario: Custom service URL
- **WHEN** `AI_SERVICE_URL` is set to `http://ai-backend:8000`
- **THEN** all API routes use `http://ai-backend:8000` to reach the Python AI service

### Requirement: Graceful degradation when AI service is unavailable
The system SHALL display a clear, user-friendly message when the Python AI service cannot be reached.

#### Scenario: AI service offline on ingest
- **WHEN** user attempts to upload a document but the AI service is unreachable
- **THEN** the upload zone displays "AI service is not running. Please start the AI backend."

#### Scenario: AI service offline on chat
- **WHEN** user sends a query but the AI service is unreachable
- **THEN** the chat displays an error message "AI backend is not running. Start it with: python ai/main.py"

#### Scenario: Health check reflects service status
- **WHEN** the `/api/health` endpoint is called
- **THEN** the response includes whether the AI backend is reachable

### Requirement: File size validation
The system SHALL validate file size before upload on the client side, rejecting files larger than 50MB.

#### Scenario: File within size limit
- **WHEN** user selects a file under 50MB
- **THEN** the upload proceeds normally

#### Scenario: File exceeds size limit
- **WHEN** user selects a file over 50MB
- **THEN** an error message "File exceeds 50MB limit" is displayed in the upload zone
- **AND** the file is not uploaded

### Requirement: Ingest API size limit
The system SHALL enforce a 50MB request body size limit on the ingest API route.

#### Scenario: Ingest request exceeds limit
- **WHEN** a file upload to `/api/ingest` exceeds the configured body size limit
- **THEN** the API returns HTTP 413 with an appropriate error message
```

## openspec/changes/project-setup/specs/text-file-support/spec.md

- Source: openspec/changes/project-setup/specs/text-file-support/spec.md
- Lines: 1-23
- SHA256: 604189940f7a9ae304fa4b9770418ea157fe66dc17d07b82873e0c04aba10232

```md
## ADDED Requirements

### Requirement: TXT file upload
The system SHALL accept `.txt` files for upload and ingestion, in addition to `.pdf` and `.md`/`.markdown` files.

#### Scenario: Upload a text file
- **WHEN** user uploads a `.txt` file
- **THEN** the file is read as UTF-8 text, chunked, embedded, and stored in the vector database

#### Scenario: Upload a text file with non-UTF-8 encoding
- **WHEN** user uploads a `.txt` file with non-UTF-8 encoding
- **THEN** the system attempts UTF-8 decoding with error replacement and processes available text

### Requirement: Upload accept attribute reflects supported formats
The system SHALL include `.txt` in the file input accept attribute and UI copy.

#### Scenario: File picker shows supported formats
- **WHEN** user opens the file picker dialog
- **THEN** `.txt`, `.pdf`, `.md`, and `.markdown` files are selectable

#### Scenario: Drag-and-drop hint includes TXT
- **WHEN** the upload zone is displayed
- **THEN** the helper text mentions PDF, Markdown, and TXT as supported formats
```


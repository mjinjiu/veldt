---
comet_change: project-setup
role: technical-design
canonical_spec: openspec
date: 2026-05-29
archived-with: 2026-05-29-project-setup
status: final
---

# Veldt Project Setup — Technical Design

Date: 2026-05-29 | Change: `project-setup` | Status: Design Complete

## Context

Veldt is a zero-config, privacy-first document Q&A tool (Next.js 16 + Python FastAPI + LanceDB). MVP core flow works (upload → chunk → embed → search → LLM answer), but lacks project governance, document management UI, chat persistence, service resilience, and DevOps infrastructure. This change establishes the Comet/OpenSpec baseline and implements five capability groups.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Veldt (Single Container)               │
│                                                          │
│  ┌────────────────────┐    ┌───────────────────────────┐ │
│  │  Next.js Frontend  │    │   Python AI Backend        │ │
│  │  (port 3000)       │───▶│   (port 8000)              │ │
│  │                    │    │                            │ │
│  │  ┌──────────────┐  │    │  /health /ingest /search  │ │
│  │  │ Sidebar      │  │    │  /api/documents (new)     │ │
│  │  │ ─ Docs list  │  │    │  bge-small-en-v1.5        │ │
│  │  │ ─ Conv list  │  │    │  LanceDB (embedded)       │ │
│  │  └──────────────┘  │    └───────────────────────────┘ │
│  │  ┌──────────────┐  │                                  │
│  │  │ Main Content │  │    AI_SERVICE_URL (env var)      │
│  │  │ ─ Upload     │  │    default: localhost:8000        │
│  │  │ ─ API Config │  │                                  │
│  │  │ ─ Chat       │  │                                  │
│  │  └──────────────┘  │                                  │
│  └────────────────────┘                                  │
│                                                          │
│  localStorage: api-config + chat-history                  │
└──────────────────────────────────────────────────────────┘
```

## Design Decisions

### D1: Sidebar Layout for Document + Conversation Management

**Choice**: Persistent left sidebar (210px, collapsible on mobile <768px via hamburger drawer)

The sidebar hosts two sections:
1. **Documents** — list of uploaded docs (filename, chunk count), each with a kebab menu (preview/delete). "Clear All" button at bottom.
2. **Conversations** — list of saved conversations, active one highlighted. "+ New Chat" button at top.

On mobile (<768px), sidebar collapses to a hamburger-triggered slide-out overlay. The hamburger icon sits in the header next to the Veldt logo.

**Alternatives considered**:
- *Collapsible section*: Simpler but hides documents from view, requiring extra click to access
- *Upload zone integration*: Too cramped, doesn't scale past 2-3 documents

**Data source**: Document list fetched via `GET /api/documents` which queries LanceDB for `SELECT DISTINCT filename, doc_id, COUNT(*) as chunks FROM documents GROUP BY doc_id, filename`.

### D2: Multi-Conversation Chat Model

**Choice**: Named conversations stored in localStorage under key `veldt-conversations`.

Each conversation object:
```typescript
interface Conversation {
  id: string;          // uuid
  name: string;        // auto-generated from first user message
  messages: Message[];
  createdAt: number;   // Date.now()
  updatedAt: number;
}
```

Active conversation ID stored under `veldt-active-conversation`.

**localStorage capacity planning**: Each message ~500 bytes average. 100 messages per conversation × 10 conversations = ~500KB. Well within 5MB limit.

**Context window**: Last 3 message pairs sent as conversation history in LLM prompt. Configurable via `MAX_CONTEXT_PAIRS` constant.

**Migration path**: If localStorage proves insufficient, migrate to IndexedDB (same API surface, larger quota). The `veldt-` key prefix isolates from other apps.

### D3: Inline AI Service Status + Toast Degradation

**Choice**: Header status indicator + dismissible toast banner.

**Status indicator**: Green/red dot in header with "AI: Online/Offline" text. Updated every 30s via `GET /api/health` polling.

**Offline behavior**:
- Upload zone: Border turns red, text changes to "AI service offline — upload disabled"
- Chat input: Disabled, placeholder reads "AI backend not running. Start with: python ai/main.py"
- Toast banner: Red background, shows startup command, dismissible

**Health endpoint** (`GET /api/health`) updated to return:
```json
{ "status": "ok", "ai": "online" | "offline" }
```

### D4: File Size Validation (Client + Server)

**Client-side** (`upload-zone.tsx`): Check `file.size > 50 * 1024 * 1024` before fetch. Show per-file error with filename and size.

**Server-side** (`app/api/ingest/route.ts`): Next.js `export const config = { api: { bodyParser: { sizeLimit: '50mb' } } }`. Returns HTTP 413 on excess.

### D5: New API Routes for Document Management

Three new Next.js API routes that proxy to new Python endpoints:

| Route | Method | Python Backend | Description |
|-------|--------|---------------|-------------|
| `/api/documents` | GET | `GET /documents` | List distinct documents |
| `/api/documents/[doc_id]` | DELETE | `DELETE /documents/{doc_id}` | Delete one document |
| `/api/documents` | DELETE | `DELETE /documents` | Clear all documents |

Python backend additions to `ai/main.py`:
- `GET /documents` — query LanceDB with `SELECT DISTINCT doc_id, filename, COUNT(*) as chunks`
- `DELETE /documents/{doc_id}` — `table.delete("doc_id = '{}'")`
- `DELETE /documents` — drop and recreate table

### D6: Testing & CI

**Testing**: Vitest + @testing-library/react + jsdom.
- Component tests: UploadZone, ChatPanel, ApiKeyConfigurator
- Test file alongside component: `components/__tests__/upload-zone.test.tsx`
- Run: `npx vitest run` (added as `npm run test`)

**CI**: Single GitHub Actions workflow (`.github/workflows/ci.yml`):
- Trigger: push/PR to all branches
- Jobs: lint (ESLint) → type-check (tsc --noEmit) → test (vitest)
- Node 20, npm ci, caching for node_modules

## Component Changes

### New Components
- `components/sidebar.tsx` — sidebar container with document list + conversation list
- `components/document-manager.tsx` — document list items with kebab menu
- `components/conversation-list.tsx` — conversation switcher
- `components/confirm-dialog.tsx` — reusable confirmation modal

### Modified Components
- `app/page.tsx` — restructure from vertical flow to sidebar + main layout
- `app/layout.tsx` — add AI status polling context
- `components/upload-zone.tsx` — file size validation, offline state
- `components/chat-panel.tsx` — multi-conversation support, localStorage persistence

## Mobile Adaptation

```
Desktop (>768px)              Mobile (≤768px)
┌──────┬──────────┐          ┌─────────────────┐
│Sidebar│ Content │          │ ☰ Veldt  🟢 AI  │
│ 210px │  flex-1 │          │─────────────────│
│       │         │          │                 │
│ Docs  │ Upload  │          │   Content       │
│ Conv  │ Chat    │          │   (full width)  │
│       │         │          │                 │
└──────┴──────────┘          └─────────────────┘
                              Sidebar: slide-out
                              overlay from left
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sidebar + multi-conv adds UI complexity | Slower initial load, more state to manage | Lazy-load sidebar, keep conversation list virtualized if >20 |
| localStorage quota exceeded | Conversation data loss | Add quota check on save, warn user at 80% |
| Mobile sidebar drawer conflicts with browser back | UX confusion | Use overlay (not push-state), close on back button |
| LanceDB GROUP BY performance | Slow doc list on 1000+ docs | LanceDB handles this efficiently; add pagination if needed |

---
change: project-setup
design-doc: docs/superpowers/specs/2026-05-29-project-setup-design.md
base-ref: git-not-initialized
---

# Veldt Project Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish Comet/OpenSpec project baseline and implement 5 capability groups: document management (sidebar-driven), multi-conversation chat persistence, text file support, service resilience with graceful degradation, and DevOps pipeline with CI/CD.

**Architecture:** Sidebar layout (210px desktop, slide-out drawer <768px) hosts document list + conversation switcher. Main area retains upload → API config → chat flow. New Python API endpoints for document CRUD proxied through Next.js routes. AI service URL configured via `AI_SERVICE_URL` env var. Chat history persisted as multi-conversation structure in localStorage. Vitest + RTL for component tests, GitHub Actions for CI.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Python FastAPI, LanceDB, Vitest + @testing-library/react, GitHub Actions

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `.env.example` | Create | Document `AI_SERVICE_URL` env var |
| `app/page.tsx` | Modify | Restructure to sidebar + main layout |
| `app/layout.tsx` | Modify | Wrap with AI status polling provider |
| `app/api/chat/route.ts` | Modify | Use `AI_SERVICE_URL`, multi-turn context |
| `app/api/ingest/route.ts` | Modify | Use `AI_SERVICE_URL`, body size limit |
| `app/api/health/route.ts` | Modify | Return AI backend status |
| `app/api/documents/route.ts` | Create | GET (list) + DELETE (clear all) |
| `app/api/documents/[doc_id]/route.ts` | Create | DELETE single document |
| `components/sidebar.tsx` | Create | Sidebar container: docs + conversations |
| `components/document-manager.tsx` | Create | Document list items with kebab menu |
| `components/conversation-list.tsx` | Create | Conversation switcher |
| `components/confirm-dialog.tsx` | Create | Reusable confirmation modal |
| `components/upload-zone.tsx` | Modify | File size validation, offline state, .txt accept |
| `components/chat-panel.tsx` | Modify | Multi-conversation, localStorage, useRef fix |
| `components/api-key-config.tsx` | Modify | No changes needed (works as-is) |
| `lib/types.ts` | Modify | Add Conversation, Document types |
| `ai/main.py` | Modify | Add /documents endpoints, .txt parsing |
| `.github/workflows/ci.yml` | Create | Lint + type-check + test |
| `vitest.config.ts` | Create | Vitest configuration |
| `components/__tests__/upload-zone.test.tsx` | Create | Upload zone component test |
| `components/__tests__/chat-panel.test.tsx` | Create | Chat panel component test |
| `components/__tests__/api-key-config.test.tsx` | Create | API key config component test |

---

### Task 1: Project Governance Setup

**Files:**
- Create: `.env.example`
- Modify: `app/page.tsx:33-41`

- [ ] **Step 1: Create .env.example**

```bash
# Veldt Configuration
# Copy to .env and customize for your environment

# AI Backend URL (Python FastAPI service)
AI_SERVICE_URL=http://localhost:8000
```

Write to `D:\Project\githubTrend\veldt\.env.example`.

- [ ] **Step 2: Fix GitHub link in header**

In `app/page.tsx:34`, change the href from `https://github.com` to the actual repo URL:

```tsx
<a
  href="https://github.com/pjm/veldt"
  target="_blank"
  rel="noopener noreferrer"
  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
>
```

- [ ] **Step 3: Initialize Comet state**

```bash
# Already done in Phase 1 — verify .comet.yaml exists
bash "D:\Project\githubTrend\veldt\.claude\skills\comet\scripts\comet-state.sh" check project-setup build
```

- [ ] **Step 4: Commit**

```bash
git add .env.example app/page.tsx
git commit -m "chore: project governance setup — env example, github link, comet state"
```

---

### Task 2: Service Resilience — AI_SERVICE_URL Config

**Files:**
- Modify: `app/api/ingest/route.ts:12`
- Modify: `app/api/chat/route.ts:129`

- [ ] **Step 1: Extract AI service URL in ingest route**

At the top of `app/api/ingest/route.ts`, add after imports:

```typescript
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
```

Change line 12 from:
```typescript
const aiResp = await fetch("http://localhost:8000/ingest", {
```
to:
```typescript
const aiResp = await fetch(`${AI_SERVICE_URL}/ingest`, {
```

- [ ] **Step 2: Extract AI service URL in chat route**

At the top of `app/api/chat/route.ts`, add after the `prefixStream` function:

```typescript
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
```

Change line 129 from:
```typescript
const searchResp = await fetch("http://localhost:8000/search", {
```
to:
```typescript
const searchResp = await fetch(`${AI_SERVICE_URL}/search`, {
```

- [ ] **Step 3: Verify health endpoint reflects AI status**

Read `app/api/health/route.ts` — it already proxies to `localhost:8000/health`. Update to use `AI_SERVICE_URL`:

```typescript
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function GET() {
  const aiStatus = await fetch(`${AI_SERVICE_URL}/health`)
    .then((r) => r.ok)
    .catch(() => false);

  return Response.json({
    status: "ok",
    ai: aiStatus ? "online" : "offline",
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/ingest/route.ts app/api/chat/route.ts app/api/health/route.ts
git commit -m "feat: configurable AI_SERVICE_URL via env var with localhost default"
```

---

### Task 3: Service Resilience — File Size Validation

**Files:**
- Modify: `components/upload-zone.tsx:1-99`
- Modify: `app/api/ingest/route.ts:1-8`

- [ ] **Step 1: Add client-side size check in upload-zone.tsx**

Add constant at top of component:
```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
```

In the `uploadFiles` callback, add validation before the fetch loop:
```typescript
const uploadFiles = useCallback(
  async (files: FileList | File[]) => {
    setUploading(true);
    setErrors([]);
    setProcessed([]);

    for (const f of files) {
      // Size validation
      if (f.size > MAX_FILE_SIZE) {
        const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
        setErrors((prev) => [...prev, `${f.name} (${sizeMB}MB) exceeds 50MB limit`]);
        continue;
      }

      try {
        const form = new FormData();
        form.append("file", f);
        const res = await fetch("/api/ingest", { method: "POST", body: form });
        if (!res.ok) {
          const { error: msg } = await res.json();
          throw new Error(msg || `${f.name} upload failed`);
        }
        const result: IngestResult = await res.json();
        onIngested(result);
        setProcessed((prev) => [...prev, f.name]);
      } catch (e) {
        const msg = `${f.name}: ${e instanceof Error ? e.message : "Upload failed"}`;
        setErrors((prev) => [...prev, msg]);
      }
    }
    setUploading(false);
  },
  [onIngested]
);
```

- [ ] **Step 2: Add server-side body size limit in ingest route**

Add after imports in `app/api/ingest/route.ts`:
```typescript
export const config = {
  api: {
    bodyParser: { sizeLimit: '50mb' },
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add components/upload-zone.tsx app/api/ingest/route.ts
git commit -m "feat: file size validation — 50MB client check + server bodyParser limit"
```

---

### Task 4: Service Resilience — Graceful Degradation UI

**Files:**
- Modify: `components/upload-zone.tsx`
- Modify: `components/chat-panel.tsx`
- Create: `components/ai-status.tsx` (for header status dot — will be incorporated into layout later)

Note: The header status dot will be integrated in Task 5 (sidebar layout). For now, add offline-aware disable states to upload and chat.

- [ ] **Step 1: Add offline-aware state to upload-zone**

In `upload-zone.tsx`, the upload zone already handles errors. Add an `aiOnline` prop:

```typescript
interface Props {
  onIngested: (result: IngestResult) => void;
  aiOnline: boolean;
}
```

If `aiOnline` is false, show a red-bordered upload zone with offline message instead of normal state:

```tsx
{!aiOnline ? (
  <div className="rounded-xl border-2 border-dashed border-red-300 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950/20">
    <p className="text-sm font-medium text-red-600 dark:text-red-400">AI service offline</p>
    <p className="mt-1 text-xs text-red-500">Start the AI backend to upload documents: <code className="rounded bg-red-100 px-1 dark:bg-red-900/30">python ai/main.py</code></p>
  </div>
) : uploading ? (
  /* existing uploading state */
) : (
  /* existing idle state with drag/drop */
)}
```

- [ ] **Step 2: Add offline-aware disabled state to chat-panel**

Add `aiOnline` prop to ChatPanel:

```typescript
interface Props {
  config: ApiKeyConfig | null;
  hasDocuments: boolean;
  aiOnline: boolean;
  onSources: (sources: SearchResult[]) => void;
}
```

When `aiOnline` is false, disable input and show offline message:
```tsx
<input
  value={input}
  onChange={(e) => setInput(e.target.value)}
  placeholder={
    !aiOnline
      ? "AI backend not running. Start with: python ai/main.py"
      : config?.apiKey
        ? "Ask about your documents..."
        : "Set your API key to start asking questions"
  }
  disabled={!config?.apiKey || !aiOnline}
  className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-black"
/>
```

- [ ] **Step 3: Commit**

```bash
git add components/upload-zone.tsx components/chat-panel.tsx
git commit -m "feat: graceful degradation — offline-aware upload and chat components"
```

---

### Task 5: Sidebar Layout Restructure

**Files:**
- Create: `components/sidebar.tsx`
- Create: `components/document-manager.tsx`
- Create: `components/conversation-list.tsx`
- Create: `components/confirm-dialog.tsx`
- Modify: `app/page.tsx` (major restructure)
- Modify: `lib/types.ts` (add new types)

- [ ] **Step 1: Add new types**

Add to `lib/types.ts`:

```typescript
export interface DocumentSummary {
  doc_id: string;
  filename: string;
  chunks: number;
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: SearchResult[];
}
```

Note: Move the `Message` interface from `chat-panel.tsx` to here and import it there.

- [ ] **Step 2: Create confirm-dialog component**

Create `components/confirm-dialog.tsx`:

```tsx
"use client";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="w-80 rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-zinc-300 px-4 py-2 text-xs font-medium dark:border-zinc-700">Cancel</button>
          <button onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700">Confirm</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create document-manager component**

Create `components/document-manager.tsx`:

```tsx
"use client";

import { FileText, Trash2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { DocumentSummary, SearchResult } from "@/lib/types";

interface Props {
  documents: DocumentSummary[];
  onDelete: (docId: string) => Promise<void>;
  onPreview: (docId: string) => Promise<SearchResult[]>;
  onClearAll: () => Promise<void>;
  onIngested: () => void;
}

export default function DocumentManager({ documents, onDelete, onPreview, onClearAll, onIngested }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [previewChunks, setPreviewChunks] = useState<SearchResult[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handlePreview = async (docId: string) => {
    if (previewDoc === docId) { setPreviewDoc(null); setPreviewChunks([]); return; }
    setPreviewDoc(docId);
    const chunks = await onPreview(docId);
    setPreviewChunks(chunks);
  };

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1 text-xs font-semibold uppercase text-zinc-500 tracking-wide"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        Documents ({documents.length})
      </button>

      {expanded && (
        <div className="space-y-1">
          {documents.map((doc) => (
            <div key={doc.doc_id}>
              <div className="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3 shrink-0 text-blue-500" />
                    <span className="truncate text-xs font-medium">{doc.filename}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">{doc.chunks} chunks</span>
                </div>
                <div className="hidden gap-0.5 group-hover:flex">
                  <button onClick={() => handlePreview(doc.doc_id)} className="rounded p-1 text-zinc-400 hover:text-blue-500" title="Preview">
                    <Eye className="h-3 w-3" />
                  </button>
                  <button onClick={() => setShowDeleteConfirm(doc.doc_id)} className="rounded p-1 text-zinc-400 hover:text-red-500" title="Delete">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              {previewDoc === doc.doc_id && previewChunks.length > 0 && (
                <div className="mx-2 mb-1 rounded-md bg-zinc-50 p-2 text-[11px] leading-relaxed text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 max-h-32 overflow-y-auto">
                  {previewChunks.map((c, i) => (
                    <p key={i} className="mb-1 border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-800">Chunk {c.chunk_index + 1}: {c.text.slice(0, 200)}{c.text.length > 200 ? "..." : ""}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
          {documents.length > 0 && (
            <button onClick={() => setShowClearConfirm(true)} className="w-full rounded-md px-2 py-1 text-left text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
              Clear All Documents
            </button>
          )}
        </div>
      )}

      {showClearConfirm && (
        <ConfirmDialog open title="Clear All Documents" message="This will remove all uploaded documents and their data. This cannot be undone." onConfirm={() => { onClearAll(); setShowClearConfirm(false); }} onCancel={() => setShowClearConfirm(false)} />
      )}
      {showDeleteConfirm && (
        <ConfirmDialog open title="Delete Document" message="This document and all its chunks will be removed." onConfirm={() => { onDelete(showDeleteConfirm); setShowDeleteConfirm(null); }} onCancel={() => setShowDeleteConfirm(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create conversation-list component**

Create `components/conversation-list.tsx`:

```tsx
"use client";

import { MessageSquare, Plus } from "lucide-react";
import type { Conversation } from "@/lib/types";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function ConversationList({ conversations, activeId, onSelect, onNew }: Props) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-zinc-500 tracking-wide">Chats</span>
        <button onClick={onNew} className="rounded p-0.5 text-zinc-400 hover:text-blue-500" title="New Chat">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-0.5">
        {sorted.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
              conv.id === activeId
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3 shrink-0" />
              <span className="truncate">{conv.name}</span>
            </div>
            <span className="text-[10px] text-zinc-400">{conv.messages.length} msg</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create sidebar container component**

Create `components/sidebar.tsx`:

```tsx
"use client";

import { Menu, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import DocumentManager from "./document-manager";
import ConversationList from "./conversation-list";
import type { DocumentSummary, Conversation, SearchResult } from "@/lib/types";

interface Props {
  documents: DocumentSummary[];
  conversations: Conversation[];
  activeConversationId: string | null;
  onDeleteDocument: (docId: string) => Promise<void>;
  onPreviewDocument: (docId: string) => Promise<SearchResult[]>;
  onClearAllDocuments: () => Promise<void>;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export default function Sidebar({ documents, conversations, activeConversationId, onDeleteDocument, onPreviewDocument, onClearAllDocuments, onSelectConversation, onNewConversation }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col gap-4 p-3">
      <DocumentManager documents={documents} onDelete={onDeleteDocument} onPreview={onPreviewDocument} onClearAll={onClearAllDocuments} onIngested={() => {}} />
      <div className="border-t border-zinc-200 dark:border-zinc-800" />
      <ConversationList conversations={conversations} activeId={activeConversationId} onSelect={(id) => { onSelectConversation(id); setMobileOpen(false); }} onNew={onNewConversation} />
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)} className="fixed left-3 top-3 z-40 rounded-md border p-1.5 md:hidden dark:border-zinc-700" aria-label="Open sidebar">
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="h-full w-64 bg-white dark:bg-black overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b dark:border-zinc-800">
              <span className="text-sm font-semibold">Veldt</span>
              <button onClick={() => setMobileOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-[210px] shrink-0 border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50 md:block overflow-y-auto">
        {sidebarContent}
      </aside>
    </>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts components/confirm-dialog.tsx components/document-manager.tsx components/conversation-list.tsx components/sidebar.tsx
git commit -m "feat: sidebar layout — document manager, conversation list, mobile drawer"
```

---

### Task 6: Restructure Page Layout to Sidebar + Main

**Files:**
- Modify: `app/page.tsx` (complete restructure)
- Modify: `app/layout.tsx`
- Create: `lib/hooks.ts` (for health polling)

- [ ] **Step 1: Create health polling hook**

Create `lib/hooks.ts`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";

export function useHealthCheck(intervalMs = 30000) {
  const [aiOnline, setAiOnline] = useState(true);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setAiOnline(data.ai === "online");
    } catch {
      setAiOnline(false);
    }
  }, []);

  useEffect(() => {
    check();
    const timer = setInterval(check, intervalMs);
    return () => clearInterval(timer);
  }, [check, intervalMs]);

  return { aiOnline, check };
}
```

- [ ] **Step 2: Rewrite app/page.tsx with sidebar layout**

Replace `app/page.tsx` with sidebar layout version:

```tsx
"use client";

import { BookOpen } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import UploadZone from "@/components/upload-zone";
import ApiKeyConfigurator from "@/components/api-key-config";
import ChatPanel from "@/components/chat-panel";
import SourceHighlight from "@/components/source-highlight";
import Sidebar from "@/components/sidebar";
import { useHealthCheck } from "@/lib/hooks";
import type { ApiKeyConfig, IngestResult, SearchResult, DocumentSummary, Conversation, Message } from "@/lib/types";

const CONVERSATIONS_KEY = "veldt-conversations";
const ACTIVE_CONV_KEY = "veldt-active-conversation";

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveConversations(convs: Conversation[]) {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
}

export default function Home() {
  const [config, setConfig] = useState<ApiKeyConfig | null>(null);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const { aiOnline } = useHealthCheck();

  // Load conversations on mount
  useEffect(() => {
    const convs = loadConversations();
    setConversations(convs);
    const activeId = localStorage.getItem(ACTIVE_CONV_KEY);
    if (activeId && convs.some((c) => c.id === activeId)) {
      setActiveConvId(activeId);
    }
  }, []);

  // Persist conversations on change
  useEffect(() => {
    if (conversations.length > 0) saveConversations(conversations);
    if (activeConvId) localStorage.setItem(ACTIVE_CONV_KEY, activeConvId);
  }, [conversations, activeConvId]);

  // Fetch document list
  const fetchDocuments = useCallback(async () => {
    const res = await fetch("/api/documents");
    if (res.ok) {
      const data = await res.json();
      setDocuments(data.documents || []);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleIngested = useCallback((result: IngestResult) => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDeleteDocument = async (docId: string) => {
    await fetch(`/api/documents/${docId}`, { method: "DELETE" });
    fetchDocuments();
  };

  const handlePreviewDocument = async (docId: string): Promise<SearchResult[]> => {
    // Preview is handled via document chunks from LanceDB query
    const res = await fetch(`/api/documents/${docId}/chunks`);
    if (res.ok) {
      const data = await res.json();
      return data.chunks || [];
    }
    return [];
  };

  const handleClearAllDocuments = async () => {
    await fetch("/api/documents", { method: "DELETE" });
    setDocuments([]);
  };

  const handleNewConversation = () => {
    const id = crypto.randomUUID();
    setConversations((prev) => [...prev, { id, name: "New Chat", messages: [], createdAt: Date.now(), updatedAt: Date.now() }]);
    setActiveConvId(id);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-black">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Veldt</h1>
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">MVP</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${aiOnline ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-zinc-500">AI: {aiOnline ? "Online" : "Offline"}</span>
          </div>
          <a href="https://github.com/pjm/veldt" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </a>
        </div>
      </header>

      {/* Offline toast */}
      {!aiOnline && (
        <div className="mx-6 mt-3 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 dark:border-red-800 dark:bg-red-950/20">
          <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
            <span>AI backend is not running.</span>
            <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs dark:bg-red-900/30">python ai/main.py</code>
          </div>
        </div>
      )}

      {/* Body: Sidebar + Main */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          documents={documents}
          conversations={conversations}
          activeConversationId={activeConvId}
          onDeleteDocument={handleDeleteDocument}
          onPreviewDocument={handlePreviewDocument}
          onClearAllDocuments={handleClearAllDocuments}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />

        <main className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-8">
          {/* Upload section */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">1. Upload Documents</h2>
            <UploadZone onIngested={handleIngested} aiOnline={aiOnline} />
          </section>

          {/* API Key section */}
          <section className="mt-6 space-y-3">
            <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">2. Configure API Key</h2>
            <ApiKeyConfigurator onChange={setConfig} />
          </section>

          {/* Chat section */}
          <section className="mt-6 flex flex-1 flex-col">
            <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">3. Ask Questions</h2>
            <div className="flex-1 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
              <ChatPanel config={config} hasDocuments={documents.length > 0} aiOnline={aiOnline} onSources={setSources} conversation={activeConversation} onUpdateConversation={(conv) => { setConversations((prev) => prev.map((c) => c.id === conv.id ? conv : c)); }} />
            </div>
            {sources.length > 0 && <SourceHighlight sources={sources} />}
          </section>
        </main>
      </div>

      <footer className="border-t border-zinc-200 bg-white px-6 py-3 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:bg-black">
        All processing happens locally. Documents never leave your machine.
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx app/layout.tsx lib/hooks.ts
git commit -m "feat: sidebar layout restructure — health polling, AI status, page layout"
```

---

### Task 7: Chat Persistence — Multi-Conversation Support

**Files:**
- Modify: `components/chat-panel.tsx` (major rewrite for multi-conversation + localStorage)

- [ ] **Step 1: Rewrite chat-panel for multi-conversation + localStorage**

Replace `components/chat-panel.tsx`:

```tsx
"use client";

import { Send, Loader2 } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import type { ApiKeyConfig, SearchResult, Conversation, Message } from "@/lib/types";

let nextId = 0;

interface Props {
  config: ApiKeyConfig | null;
  hasDocuments: boolean;
  aiOnline: boolean;
  onSources: (sources: SearchResult[]) => void;
  conversation: Conversation | undefined;
  onUpdateConversation: (conv: Conversation) => void;
}

export default function ChatPanel({ config, hasDocuments, aiOnline, onSources, conversation, onUpdateConversation }: Props) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messages = conversation?.messages || [];

  const updateMessages = useCallback((newMessages: Message[]) => {
    if (!conversation) return;
    const name = newMessages.length > 0 && newMessages[0].role === "user" 
      ? newMessages[0].content.slice(0, 40) 
      : conversation.name;
    onUpdateConversation({ ...conversation, messages: newMessages, name, updatedAt: Date.now() });
  }, [conversation, onUpdateConversation]);

  const send = async () => {
    const query = input.trim();
    if (!query || !config?.apiKey || streaming || !conversation) return;

    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg: Message = { id: nextId++, role: "user", content: query };
    const assistantId = nextId++;
    const updatedMessages = [...messages, userMsg, { id: assistantId, role: "assistant" as const, content: "" }];
    updateMessages(updatedMessages);
    setInput("");
    setStreaming(true);

    let answer = "";
    let sources: SearchResult[] = [];

    // Build context from last 3 pairs
    const contextPairs = messages.slice(-6);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          format: config.format,
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          model: config.model,
          history: contextPairs.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Chat failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              if (json.text) { answer += json.text; }
              if (json.sources) { sources = json.sources; onSources(json.sources); }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      answer = `Error: ${(err as Error).message || "Chat failed"}`;
    } finally {
      setStreaming(false);
      abortRef.current = null;
      const finalMsgs = updatedMessages.map((m) =>
        m.id === assistantId ? { ...m, content: answer || "No response", sources } : m
      );
      updateMessages(finalMsgs);
    }
  };

  const stop = () => { abortRef.current?.abort(); };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="py-16 text-center text-sm text-zinc-400">
            {hasDocuments ? "Ask a question about your documents." : "Upload documents to get started."}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className="space-y-2">
            <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"}`}>
                <div className="whitespace-pre-wrap">{m.content || "..."}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={!aiOnline ? "AI backend not running. Start with: python ai/main.py" : config?.apiKey ? "Ask about your documents..." : "Set your API key to start asking questions"}
          disabled={!config?.apiKey || !aiOnline}
          className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-black"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        {streaming ? (
          <button type="button" onClick={stop} className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600">
            <Loader2 className="h-4 w-4 animate-spin" />
          </button>
        ) : (
          <button type="submit" disabled={!config?.apiKey || !input.trim()} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        )}
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Add history parameter support in chat API route**

In `app/api/chat/route.ts`, update the POST handler to accept `history`:

In the destructuring at line 116:
```typescript
const { query, format, baseUrl, apiKey, model, history } = await req.json();
```

Update the prompt building to include history:
```typescript
// After buildPrompt call, prepend history context
let historyContext = "";
if (history && history.length > 0) {
  historyContext = "## Previous Conversation\n" + history.map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n") + "\n\n";
}
const fullPrompt = historyContext + prompt;
```

And pass `fullPrompt` instead of `prompt` in the LLM call.

- [ ] **Step 3: Commit**

```bash
git add components/chat-panel.tsx app/api/chat/route.ts
git commit -m "feat: multi-conversation chat persistence with localStorage and context history"
```

---

### Task 8: Document Management API + Python Backend

**Files:**
- Create: `app/api/documents/route.ts`
- Create: `app/api/documents/[doc_id]/route.ts`
- Create: `app/api/documents/[doc_id]/chunks/route.ts`
- Modify: `ai/main.py` (add /documents endpoints)

- [ ] **Step 1: Add Python backend document endpoints**

In `ai/main.py`, add after the search endpoint (after line 135):

```python
@app.get("/documents")
async def list_documents():
    """List distinct documents with filename and chunk count."""
    db = _get_db()
    if "documents" not in db.table_names():
        return {"documents": []}

    table = db.open_table("documents")
    # LanceDB doesn't have GROUP BY — we do it in Python
    all_rows = table.to_pandas()
    if all_rows.empty:
        return {"documents": []}
    grouped = all_rows.groupby(["doc_id", "filename"]).size().reset_index(name="chunks")
    docs = [{"doc_id": row["doc_id"], "filename": row["filename"], "chunks": int(row["chunks"])} for _, row in grouped.iterrows()]
    return {"documents": docs}


@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete all chunks for a given doc_id."""
    db = _get_db()
    if "documents" not in db.table_names():
        raise HTTPException(404, "No documents table found.")
    table = db.open_table("documents")
    table.delete(f"doc_id = '{doc_id}'")
    return {"status": "deleted", "doc_id": doc_id}


@app.delete("/documents")
async def clear_all_documents():
    """Drop and recreate the documents table."""
    db = _get_db()
    if "documents" in db.table_names():
        db.drop_table("documents")
    return {"status": "cleared"}


@app.get("/documents/{doc_id}/chunks")
async def get_document_chunks(doc_id: str):
    """Get all chunks for a specific document."""
    db = _get_db()
    if "documents" not in db.table_names():
        return {"chunks": []}
    table = db.open_table("documents")
    rows = table.search().where(f"doc_id = '{doc_id}'").to_list()
    return {"chunks": [{"doc_id": r["doc_id"], "chunk_index": r["chunk_index"], "filename": r["filename"], "text": r["text"]} for r in rows]}
```

- [ ] **Step 2: Create GET + DELETE /api/documents route**

Create `app/api/documents/route.ts`:

```typescript
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function GET() {
  const resp = await fetch(`${AI_SERVICE_URL}/documents`).catch(() => null);
  if (!resp || !resp.ok) return Response.json({ documents: [] }, { status: resp?.status || 502 });
  return Response.json(await resp.json());
}

export async function DELETE() {
  const resp = await fetch(`${AI_SERVICE_URL}/documents`, { method: "DELETE" }).catch(() => null);
  if (!resp || !resp.ok) return Response.json({ error: "Clear failed" }, { status: resp?.status || 502 });
  return Response.json(await resp.json());
}
```

- [ ] **Step 3: Create DELETE /api/documents/[doc_id] route**

Create `app/api/documents/[doc_id]/route.ts`:

```typescript
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function DELETE(_req: Request, { params }: { params: Promise<{ doc_id: string }> }) {
  const { doc_id } = await params;
  const resp = await fetch(`${AI_SERVICE_URL}/documents/${encodeURIComponent(doc_id)}`, { method: "DELETE" }).catch(() => null);
  if (!resp || !resp.ok) return Response.json({ error: "Delete failed" }, { status: resp?.status || 502 });
  return Response.json(await resp.json());
}
```

- [ ] **Step 4: Create GET /api/documents/[doc_id]/chunks route**

Create `app/api/documents/[doc_id]/chunks/route.ts`:

```typescript
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function GET(_req: Request, { params }: { params: Promise<{ doc_id: string }> }) {
  const { doc_id } = await params;
  const resp = await fetch(`${AI_SERVICE_URL}/documents/${encodeURIComponent(doc_id)}/chunks`).catch(() => null);
  if (!resp || !resp.ok) return Response.json({ chunks: [] }, { status: resp?.status || 502 });
  return Response.json(await resp.json());
}
```

- [ ] **Step 5: Commit**

```bash
git add ai/main.py app/api/documents/
git commit -m "feat: document management API — list, delete, preview via Python backend"
```

---

### Task 9: Text File Support

**Files:**
- Modify: `ai/main.py` (add .txt parsing)
- Modify: `components/upload-zone.tsx` (update accept attribute and help text)

- [ ] **Step 1: Add .txt parsing in Python backend**

In `ai/main.py`, add after `_parse_markdown`:

```python
def _parse_txt(content: bytes) -> str:
    return content.decode("utf-8", errors="replace")
```

Update the ingest endpoint (line 59-63) to include .txt:
```python
if ext == ".pdf":
    text = _parse_pdf(content)
elif ext in (".md", ".markdown"):
    text = _parse_markdown(content)
elif ext == ".txt":
    text = _parse_txt(content)
else:
    raise HTTPException(400, f"Unsupported format: {ext}. Use PDF, Markdown, or TXT.")
```

- [ ] **Step 2: Update upload-zone accept attribute and help text**

In `components/upload-zone.tsx`:

Change accept attribute:
```tsx
accept=".pdf,.md,.markdown,.txt"
```

Change help text:
```tsx
<p className="mt-1 text-xs text-zinc-500">
  PDF, Markdown, or TXT — multiple files supported, up to 50MB each
</p>
```

- [ ] **Step 3: Commit**

```bash
git add ai/main.py components/upload-zone.tsx
git commit -m "feat: add .txt file support — parsing, upload accept, help text"
```

---

### Task 10: Fix Global Mutable State Bug

**Files:**
- Modify: `components/chat-panel.tsx`

- [ ] **Step 1: Replace let nextId with useRef**

In `chat-panel.tsx`, change:
```typescript
let nextId = 0;
```
to:
```typescript
// Removed global mutable nextId — using timestamp+counter for message IDs
```

And replace:
```typescript
const userMsg: Message = { id: nextId++, role: "user", content: query };
const assistantId = nextId++;
```
with:
```typescript
const userMsg: Message = { id: Date.now(), role: "user", content: query };
const assistantId = Date.now() + 1;
```

- [ ] **Step 2: Commit**

```bash
git add components/chat-panel.tsx
git commit -m "fix: replace global mutable nextId with timestamp-based message IDs"
```

---

### Task 11: Testing Setup + Component Tests

**Files:**
- Create: `vitest.config.ts`
- Create: `components/__tests__/upload-zone.test.tsx`
- Create: `components/__tests__/chat-panel.test.tsx`
- Create: `components/__tests__/api-key-config.test.tsx`
- Modify: `package.json` (add test script, install deps)
- Modify: `tsconfig.json` (add test path)

- [ ] **Step 1: Install test dependencies**

```bash
cd D:\Project\githubTrend\veldt && npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test-setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 3: Create test-setup.ts**

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add test script to package.json**

Add to scripts:
```json
"test": "vitest run"
```

- [ ] **Step 5: Write upload-zone test**

Create `components/__tests__/upload-zone.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import UploadZone from "../upload-zone";

describe("UploadZone", () => {
  it("renders upload instructions", () => {
    render(<UploadZone onIngested={vi.fn()} aiOnline={true} />);
    expect(screen.getByText(/Drop documents here/i)).toBeInTheDocument();
  });

  it("shows supported formats", () => {
    render(<UploadZone onIngested={vi.fn()} aiOnline={true} />);
    expect(screen.getByText(/PDF, Markdown, or TXT/i)).toBeInTheDocument();
  });

  it("shows offline state when aiOnline is false", () => {
    render(<UploadZone onIngested={vi.fn()} aiOnline={false} />);
    expect(screen.getByText(/AI service offline/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Write chat-panel test**

Create `components/__tests__/chat-panel.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ChatPanel from "../chat-panel";

describe("ChatPanel", () => {
  it("renders placeholder when no documents", () => {
    render(<ChatPanel config={null} hasDocuments={false} aiOnline={true} onSources={vi.fn()} conversation={undefined} onUpdateConversation={vi.fn()} />);
    expect(screen.getByText(/Upload documents to get started/i)).toBeInTheDocument();
  });

  it("disables input when no API key", () => {
    render(<ChatPanel config={null} hasDocuments={true} aiOnline={true} onSources={vi.fn()} conversation={undefined} onUpdateConversation={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Set your API key/i)).toBeDisabled();
  });

  it("shows offline message when aiOnline is false", () => {
    render(<ChatPanel config={{ format: "anthropic", baseUrl: "http://test", apiKey: "key", model: "test" }} hasDocuments={true} aiOnline={false} onSources={vi.fn()} conversation={undefined} onUpdateConversation={vi.fn()} />);
    expect(screen.getByPlaceholderText(/AI backend not running/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Write api-key-config test**

Create `components/__tests__/api-key-config.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ApiKeyConfigurator from "../api-key-config";

describe("ApiKeyConfigurator", () => {
  it("renders Anthropic and OpenAI format toggles", () => {
    render(<ApiKeyConfigurator onChange={vi.fn()} />);
    expect(screen.getByText(/Anthropic Compatible/i)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI Compatible/i)).toBeInTheDocument();
  });

  it("renders API key input", () => {
    render(<ApiKeyConfigurator onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Enter your API key/i)).toBeInTheDocument();
  });

  it("renders privacy notice", () => {
    render(<ApiKeyConfigurator onChange={vi.fn()} />);
    expect(screen.getByText(/stored only in this browser/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Run tests**

```bash
npx vitest run
```

Expected: 9 tests pass.

- [ ] **Step 9: Commit**

```bash
git add vitest.config.ts test-setup.ts package.json package-lock.json components/__tests__/
git commit -m "test: add Vitest + RTL component tests for upload, chat, api-key config"
```

---

### Task 12: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: ["**"]
  pull_request:
    branches: ["**"]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npm run lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npx tsc --noEmit

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npm test
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow — lint, type-check, test"
```

---

### Plan Completion Checklist

After all tasks are executed:
- [ ] All 28 tasks.md items checked off
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes (9 component tests)
- [ ] Python backend starts and responds to new /documents endpoints
- [ ] Frontend renders sidebar with document + conversation lists
- [ ] Chat messages persist across page reloads
- [ ] AI offline toast shows when backend unreachable
- [ ] `.txt` files accepted and parsed

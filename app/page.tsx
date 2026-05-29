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

  const handleIngested = useCallback(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDeleteDocument = async (docId: string) => {
    await fetch(`/api/documents/${docId}`, { method: "DELETE" });
    fetchDocuments();
  };

  const handlePreviewDocument = async (docId: string): Promise<SearchResult[]> => {
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

  const handleAutoNewConversation = (firstMessage: string): Conversation => {
    const id = crypto.randomUUID();
    const name = firstMessage.slice(0, 40);
    const conv: Conversation = { id, name, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    setConversations((prev) => [...prev, conv]);
    setActiveConvId(id);
    return conv;
  };

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
  };

  const handleUpdateConversation = (conv: Conversation) => {
    setConversations((prev) => prev.map((c) => c.id === conv.id ? conv : c));
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
              <ChatPanel
                config={config}
                hasDocuments={documents.length > 0}
                aiOnline={aiOnline}
                onSources={setSources}
                conversation={activeConversation}
                onUpdateConversation={handleUpdateConversation}
                onNewConversation={handleAutoNewConversation}
              />
            </div>
            {sources.length > 0 && <SourceHighlight sources={sources} />}
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white px-6 py-3 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:bg-black">
        All processing happens locally. Documents never leave your machine.
      </footer>
    </div>
  );
}

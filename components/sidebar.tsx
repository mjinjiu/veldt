"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
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
      <DocumentManager documents={documents} onDelete={onDeleteDocument} onPreview={onPreviewDocument} onClearAll={onClearAllDocuments} />
      <div className="border-t border-zinc-200 dark:border-zinc-800" />
      <ConversationList conversations={conversations} activeId={activeConversationId} onSelect={(id) => { onSelectConversation(id); setMobileOpen(false); }} onNew={onNewConversation} />
    </div>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="fixed left-3 top-3 z-40 rounded-md border p-1.5 md:hidden dark:border-zinc-700" aria-label="Open sidebar">
        <Menu className="h-4 w-4" />
      </button>

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

      <aside className="hidden w-[210px] shrink-0 border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50 md:block overflow-y-auto">
        {sidebarContent}
      </aside>
    </>
  );
}

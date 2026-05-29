"use client";

import { FileText, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "./confirm-dialog";
import type { DocumentSummary, SearchResult } from "@/lib/types";

interface Props {
  documents: DocumentSummary[];
  onDelete: (docId: string) => Promise<void>;
  onPreview: (docId: string) => Promise<SearchResult[]>;
  onClearAll: () => Promise<void>;
}

export default function DocumentManager({ documents, onDelete, onPreview, onClearAll }: Props) {
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
                    <Eye className="h-3 w-3 rotate-90" />
                  </button>
                </div>
              </div>
              {previewDoc === doc.doc_id && previewChunks.length > 0 && (
                <div className="mx-2 mb-1 rounded-md bg-zinc-50 p-2 text-[11px] leading-relaxed text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 max-h-32 overflow-y-auto">
                  {previewChunks.map((c, i) => (
                    <p key={i} className="mb-1 border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-800">
                      Chunk {c.chunk_index + 1}: {c.text.slice(0, 200)}{c.text.length > 200 ? "..." : ""}
                    </p>
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

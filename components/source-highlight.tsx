"use client";

import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useState } from "react";
import type { SearchResult } from "@/lib/types";

interface Props {
  sources: SearchResult[];
}

interface Grouped {
  filename: string;
  chunks: SearchResult[];
}

function groupByFilename(sources: SearchResult[]): Grouped[] {
  const map = new Map<string, SearchResult[]>();
  const seen = new Set<string>();
  for (const s of sources) {
    // Deduplicate: same filename + same chunk_index = same content
    const dedupKey = `${s.filename}-${s.chunk_index}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    const list = map.get(s.filename);
    if (list) {
      list.push(s);
    } else {
      map.set(s.filename, [s]);
    }
  }
  return Array.from(map.entries()).map(([filename, chunks]) => ({
    filename,
    chunks: chunks.sort((a, b) => a.chunk_index - b.chunk_index),
  }));
}

export default function SourceHighlight({ sources }: Props) {
  if (!sources.length) return null;

  const grouped = groupByFilename(sources);
  const totalChunks = grouped.reduce((sum, g) => sum + g.chunks.length, 0);

  return (
    <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
      <p className="mb-3 text-xs font-medium text-zinc-500">
        {totalChunks} chunk{totalChunks > 1 ? "s" : ""} from {grouped.length} document{grouped.length > 1 ? "s" : ""}
      </p>
      <div className="space-y-3">
        {grouped.map((g) => (
          <DocGroup key={g.filename} group={g} />
        ))}
      </div>
    </div>
  );
}

function DocGroup({ group }: { group: Grouped }) {
  const [activeChunk, setActiveChunk] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center gap-2 px-3 py-2">
        <FileText className="h-3.5 w-3.5 shrink-0 text-blue-500" />
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {group.filename}
        </span>
        <span className="text-[10px] text-zinc-400">
          {group.chunks.length} chunk{group.chunks.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
        {group.chunks.map((chunk) => {
          const key = `${chunk.doc_id}-${chunk.chunk_index}`;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveChunk(activeChunk === key ? null : key)}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors ${
                activeChunk === key
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-zinc-200/50 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              #{chunk.chunk_index + 1}
              {activeChunk === key ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          );
        })}
      </div>
      {activeChunk !== null && (
        <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {group.chunks.find((c) => `${c.doc_id}-${c.chunk_index}` === activeChunk)?.text}
          </p>
        </div>
      )}
    </div>
  );
}

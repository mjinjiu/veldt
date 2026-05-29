"use client";

import { BookOpen } from "lucide-react";
import { useState } from "react";
import UploadZone from "@/components/upload-zone";
import ApiKeyConfigurator from "@/components/api-key-config";
import ChatPanel from "@/components/chat-panel";
import SourceHighlight from "@/components/source-highlight";
import type { ApiKeyConfig, IngestResult, SearchResult } from "@/lib/types";

export default function Home() {
  const [config, setConfig] = useState<ApiKeyConfig | null>(null);
  const [ingested, setIngested] = useState<IngestResult[]>([]);
  const [sources, setSources] = useState<SearchResult[]>([]);

  const handleIngested = (result: IngestResult) => {
    setIngested((prev) => [...prev, result]);
  };

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-black">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Veldt
          </h1>
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            MVP
          </span>
        </div>
        <a
          href="https://github.com/pjm/veldt"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </header>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        {/* Upload section */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            1. Upload Documents
          </h2>
          <UploadZone onIngested={handleIngested} />
          {ingested.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ingested.map((doc, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs text-green-700 dark:bg-green-950/20 dark:text-green-400"
                >
                  {doc.filename} ({doc.chunks} chunks)
                </span>
              ))}
            </div>
          )}
        </section>

        {/* API Key section */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            2. Configure API Key
          </h2>
          <ApiKeyConfigurator onChange={setConfig} />
        </section>

        {/* Chat section */}
        <section className="flex flex-1 flex-col">
          <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            3. Ask Questions
          </h2>
          <div className="flex-1 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
            <ChatPanel
              config={config}
              hasDocuments={ingested.length > 0}
              onSources={setSources}
            />
          </div>
          {sources.length > 0 && <SourceHighlight sources={sources} />}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white px-6 py-3 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:bg-black">
        All processing happens locally. Documents never leave your machine.
      </footer>
    </div>
  );
}

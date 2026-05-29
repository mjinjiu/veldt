"use client";

import { Upload, Loader2, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { IngestResult } from "@/lib/types";

interface Props {
  onIngested: (result: IngestResult) => void;
  aiOnline: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function UploadZone({ onIngested, aiOnline }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true);
      setErrors([]);

      for (const f of files) {
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
        } catch (e) {
          const msg = `${f.name}: ${e instanceof Error ? e.message : "Upload failed"}`;
          setErrors((prev) => [...prev, msg]);
        }
      }

      setUploading(false);
    },
    [onIngested]
  );

  return (
    <div className="w-full">
      {!aiOnline ? (
        <div className="rounded-xl border-2 border-dashed border-red-300 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">AI service offline</p>
          <p className="mt-1 text-xs text-red-500">
            Start the AI backend to upload documents: <code className="rounded bg-red-100 px-1 dark:bg-red-900/30">python ai/main.py</code>
          </p>
        </div>
      ) : (
      <div
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
        } ${uploading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Processing documents...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-8 w-8 text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Drop documents here or click to browse
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                PDF, Markdown, or TXT — multiple files supported, up to 50MB each
              </p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.md,.markdown,.txt"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              uploadFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>
      )}

      {errors.length > 0 && (
        <div className="mt-3 space-y-1">
          {errors.map((err, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400"
            >
              <X className="h-4 w-4 shrink-0" />
              {err}
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="mt-3 text-xs text-zinc-500">
          Extracting text, chunking, and computing embeddings locally...
        </div>
      )}
    </div>
  );
}

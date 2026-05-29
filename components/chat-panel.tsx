"use client";

import { Send, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import type { ApiKeyConfig, SearchResult, Conversation, Message } from "@/lib/types";

interface Props {
  config: ApiKeyConfig | null;
  hasDocuments: boolean;
  aiOnline: boolean;
  onSources: (sources: SearchResult[]) => void;
  conversation: Conversation | undefined;
  onUpdateConversation: (conv: Conversation) => void;
  onNewConversation: (firstMessage: string) => Conversation;
}

export default function ChatPanel({ config, hasDocuments, aiOnline, onSources, conversation, onUpdateConversation, onNewConversation }: Props) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messages = conversation?.messages || [];

  const updateMessages = (conv: Conversation, newMessages: Message[]) => {
    const name = newMessages.length > 0 && newMessages[0].role === "user"
      ? newMessages[0].content.slice(0, 40)
      : conv.name;
    onUpdateConversation({ ...conv, messages: newMessages, name, updatedAt: Date.now() });
  };

  const send = async () => {
    const query = input.trim();
    if (!query || !config?.apiKey || streaming) return;

    // Auto-create conversation if none exists
    let conv = conversation;
    if (!conv) {
      conv = onNewConversation(query);
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const idBase = Date.now();
    const userMsg: Message = { id: idBase, role: "user", content: query };
    const assistantId = idBase + 1;
    const baseMessages = conv.messages || [];
    const updatedMessages = [...baseMessages, userMsg, { id: assistantId, role: "assistant" as const, content: "" }];
    updateMessages(conv, updatedMessages);
    setInput("");
    setStreaming(true);

    let answer = "";
    let sources: SearchResult[] = [];

    const contextPairs = baseMessages.slice(-6);

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
      updateMessages(conv, finalMsgs);
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
          placeholder={
            !aiOnline
              ? "AI backend not running. Start with: python ai/main.py"
              : config?.apiKey
                ? "Ask about your documents..."
                : "Set your API key to start asking questions"
          }
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

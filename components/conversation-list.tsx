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

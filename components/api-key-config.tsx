"use client";

import { Key, Eye, EyeOff, Shield, Globe, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import type { ApiFormat, ApiKeyConfig } from "@/lib/types";

const STORAGE_KEY = "veldt-api-config";

interface ModelOption {
  label: string;
  format: ApiFormat;
  baseUrl: string;
  model: string;
}

const MODELS: ModelOption[] = [
  { label: "Anthropic — Claude Opus 4.7", format: "anthropic", baseUrl: "https://api.anthropic.com/v1", model: "claude-opus-4-7" },
  { label: "Anthropic — Claude Sonnet 4.6", format: "anthropic", baseUrl: "https://api.anthropic.com/v1", model: "claude-sonnet-4-6" },
  { label: "Anthropic — Claude Haiku 4.5", format: "anthropic", baseUrl: "https://api.anthropic.com/v1", model: "claude-haiku-4-5" },
  { label: "OpenAI — GPT-4o", format: "openai", baseUrl: "https://api.openai.com/v1", model: "gpt-4o" },
  { label: "OpenAI — GPT-4o-mini", format: "openai", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  { label: "DeepSeek — Chat", format: "openai", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  { label: "Custom", format: "openai" as ApiFormat, baseUrl: "", model: "" },
];

const DEFAULT = MODELS[1]; // Claude Sonnet

const EMPTY: ApiKeyConfig = { format: "anthropic", baseUrl: DEFAULT.baseUrl, apiKey: "", model: DEFAULT.model };

interface Props {
  onChange: (config: ApiKeyConfig) => void;
}

export default function ApiKeyConfigurator({ onChange }: Props) {
  const [config, setConfig] = useState<ApiKeyConfig>(EMPTY);
  const [showKey, setShowKey] = useState(false);
  const [modelIdx, setModelIdx] = useState(1); // index into MODELS
  const [customModel, setCustomModel] = useState("");
  const [ready, setReady] = useState(false);

  // Hydration-safe: load from localStorage only on client
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.provider && !parsed.format) {
          const migration: Record<string, string> = { anthropic: "anthropic", openai: "openai", deepseek: "deepseek" };
          const migratedFormat = migration[parsed.provider] === "deepseek" ? "openai" : (migration[parsed.provider] || "anthropic");
          const migratedBaseUrl = parsed.provider === "deepseek" ? "https://api.deepseek.com/v1"
            : parsed.provider === "anthropic" ? "https://api.anthropic.com/v1"
            : "https://api.openai.com/v1";
          const migratedModel = parsed.provider === "deepseek" ? "deepseek-chat"
            : parsed.provider === "anthropic" ? "claude-sonnet-4-6"
            : "gpt-4o-mini";
          const migrated: ApiKeyConfig = { format: migratedFormat as ApiFormat, baseUrl: migratedBaseUrl, apiKey: parsed.apiKey || "", model: migratedModel };
          setConfig(migrated);
          // Try to match to a preset
          const idx = MODELS.findIndex((m) => m.format === migrated.format && m.baseUrl === migratedBaseUrl && m.model === migratedModel);
          if (idx >= 0 && idx < MODELS.length - 1) setModelIdx(idx);
          else { setModelIdx(MODELS.length - 1); setCustomModel(migratedModel); }
        } else if (parsed.format) {
          setConfig(parsed);
          const idx = MODELS.findIndex((m) => m.format === parsed.format && m.baseUrl === parsed.baseUrl && m.model === parsed.model);
          if (idx >= 0 && idx < MODELS.length - 1) setModelIdx(idx);
          else { setModelIdx(MODELS.length - 1); setCustomModel(parsed.model); }
        }
      }
    } catch { /* corrupt */ }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify parent after hydration load — deferred to avoid setState-during-render
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => onChange(config), 0);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const persist = (next: ApiKeyConfig) => {
    setConfig(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    onChange(next);
  };

  const handleModelSelect = (idx: number) => {
    setModelIdx(idx);
    const opt = MODELS[idx];
    if (idx === MODELS.length - 1) {
      // Custom — only update format + baseUrl, let user type model
      persist({ ...config, format: opt.format, baseUrl: opt.baseUrl, model: config.model });
    } else {
      persist({ ...config, format: opt.format, baseUrl: opt.baseUrl, model: opt.model });
    }
  };

  const handleCustomModel = (model: string) => {
    setCustomModel(model);
    persist({ ...config, model });
  };

  const switchFormat = (fmt: ApiFormat) => {
    if (fmt === config.format) return;
    // Pick the first preset matching the target format
    const preset = MODELS.slice(0, -1).find((m) => m.format === fmt) || DEFAULT;
    setModelIdx(MODELS.indexOf(preset));
    persist({ ...config, format: fmt, baseUrl: preset.baseUrl, model: preset.model });
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Shield className="h-3.5 w-3.5" />
        Your API key is stored only in this browser. Never sent to our servers.
      </div>

      {/* Format toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchFormat("anthropic")}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            config.format === "anthropic"
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
              : "border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          Anthropic Compatible
        </button>
        <button
          type="button"
          onClick={() => switchFormat("openai")}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            config.format === "openai"
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
              : "border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          OpenAI Compatible
        </button>
      </div>

      {/* Base URL */}
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={config.baseUrl}
          onChange={(e) => {
            persist({ ...config, baseUrl: e.target.value });
            setModelIdx(MODELS.length - 1);
            setCustomModel(config.model);
          }}
          placeholder="API Base URL..."
          className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-black"
        />
      </div>

      {/* Model + API Key */}
      <div className="flex gap-2">
        <div className="relative w-40 shrink-0">
          <Cpu className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          {modelIdx === MODELS.length - 1 ? (
            <input
              type="text"
              value={customModel}
              onChange={(e) => handleCustomModel(e.target.value)}
              placeholder="Model name..."
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-black"
            />
          ) : (
            <select
              value={modelIdx}
              onChange={(e) => handleModelSelect(Number(e.target.value))}
              className="w-full appearance-none rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-6 text-sm dark:border-zinc-700 dark:bg-black"
            >
              {MODELS.map((m, i) => (
                <option key={m.model || "custom"} value={i}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="relative flex-1">
          <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type={showKey ? "text" : "password"}
            value={config.apiKey}
            onChange={(e) => persist({ ...config, apiKey: e.target.value })}
            placeholder="Enter your API key..."
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-10 text-sm dark:border-zinc-700 dark:bg-black"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

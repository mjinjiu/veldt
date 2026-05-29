export interface SearchResult {
  doc_id: string;
  chunk_index: number;
  filename: string;
  text: string;
}

export interface IngestResult {
  doc_id: string;
  filename: string;
  chunks: number;
}

export type ApiFormat = "openai" | "anthropic";

export interface ApiKeyConfig {
  format: ApiFormat;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface DocumentSummary {
  doc_id: string;
  filename: string;
  chunks: number;
}

export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: SearchResult[];
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

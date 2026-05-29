# Veldt: Private Document Q&A

Veldt is a zero-config, privacy-first document Q&A tool. It allows users to upload PDFs and Markdown files, ask questions, and get answers with source citations. All embeddings and chunking happen locally.

## Key Features

1. **Local Embeddings** — Uses BAAI/bge-small-en-v1.5 (384-dim, MIT license) running on CPU
2. **BYOK Architecture** — Bring your own API key, stored only in browser localStorage
3. **Zero Telemetry** — No analytics, no tracking, no external calls except your configured LLM
4. **Source Citations** — Every answer includes document and chunk references

## Architecture

The system consists of two services running in a single container:

- Next.js 16 frontend with React 19 and Tailwind CSS 4
- Python FastAPI backend for embedding and document processing
- LanceDB for vector storage (embedded, zero-config)
- Recursive character text splitting with 512/50 window

## Privacy

Documents never leave your machine. API keys are per-request from browser storage. The LLM provider only sees the query and relevant chunks, never the full document.

# Veldt

**Zero-config, privacy-first document Q&A.** Upload PDFs and Markdown files, ask questions, get answers with source citations. All embedding and chunking happens locally on your machine.

> MVP status — under active development.

## Why Veldt?

Existing tools are complex, bloated, and unclear about where your data goes. Veldt is:

| | Veldt | AnythingLLM | Open WebUI | Dify |
|---|---|---|---|---|
| **Setup** | Single `docker run` | Install + configure | Install + configure | Install + configure |
| **Privacy** | Local embeddings + BYOK | Varies by config | Varies by config | Cloud-dependent |
| **Embeddings** | Built-in (bge-small) | Requires config | Requires config | Requires config |
| **Dependencies** | 0 external services | Vector DB + LLM config | Vector DB + LLM config | PostgreSQL + Redis + more |
| **License** | Apache 2.0 | MIT | MIT | Apache 2.0 |

## Quick Start

```bash
docker run -p 3000:3000 -v veldt_data:/data veldt
```

Then open [http://localhost:3000](http://localhost:3000).

### Without Docker

```bash
# Terminal 1 — Python AI service
cd ai
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py

# Terminal 2 — Next.js frontend
npm install
npm run dev
```

## How It Works

```
┌──────────────────────────────────────────────────────┐
│                    YOUR MACHINE                       │
│                                                       │
│  ┌──────────┐    ┌──────────┐    ┌────────────────┐  │
│  │  Upload   │───▶│  Chunk + │───▶│  LanceDB       │  │
│  │  PDF/MD   │    │  Embed   │    │  (local vector) │  │
│  └──────────┘    └──────────┘    └───────┬────────┘  │
│                                           │           │
│  ┌──────────┐    ┌──────────┐            │           │
│  │  Answer + │◀───│  LLM API │◀──────────┘           │
│  │  Sources  │    │  (BYOK)  │    top-5 chunks       │
│  └──────────┘    └──────────┘                        │
│                                                       │
│  API key: localStorage only — never touches server    │
└──────────────────────────────────────────────────────┘
```

1. **Upload** — Drop a PDF or Markdown file
2. **Chunk + Embed** — Text is split into chunks and embedded locally using `bge-small-en-v1.5`
3. **Store** — Embeddings saved to LanceDB (embedded vector database)
4. **Ask** — Type a question; top-5 relevant chunks are retrieved
5. **Answer** — Chunks + question sent to your LLM provider (Anthropic, OpenAI, or DeepSeek) with your own API key
6. **Cite** — Every answer includes source document and chunk references

## Supported Providers

- **Anthropic** — Claude Sonnet 4
- **OpenAI** — GPT-4o-mini
- **DeepSeek** — deepseek-chat

Your API key is stored in browser localStorage and sent per-request. Never persisted on the server.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| AI Backend | Python FastAPI, sentence-transformers |
| Embedding | BAAI/bge-small-en-v1.5 (384-dim, MIT) |
| Vector DB | LanceDB (embedded, zero-config) |
| Chunking | Recursive character splitter (512/50) |

## Privacy

- Documents never leave your machine (chunking + embedding is local)
- API key stored in browser localStorage only
- Zero telemetry, zero analytics, zero external calls (except the LLM API you configure)
- LLM provider receives only the query + relevant chunks (not the full document)

## License

Apache 2.0 — see [LICENSE](./LICENSE)

"""Veldt AI Service — document ingestion & semantic search."""
from __future__ import annotations

import os
import uuid
from pathlib import Path

import lancedb
import uvicorn
from embed import embed_query, embed_texts
from fastapi import FastAPI, File, HTTPException, UploadFile
from splitter import split_text
from pydantic import BaseModel
from pypdf import PdfReader

app = FastAPI(title="Veldt AI", version="0.1.0")

DATA_DIR = Path(os.environ.get("VELDT_DATA_DIR", "/data"))
DB_PATH = DATA_DIR / "lancedb"
CHUNK_SIZE = 512
CHUNK_OVERLAP = 50
TOP_K = 5

# Chunking uses splitter.py — manual recursive splitter (no langchain dep)


def _get_db():
    DB_PATH.mkdir(parents=True, exist_ok=True)
    db = lancedb.connect(str(DB_PATH))
    return db


def _parse_pdf(file_bytes: bytes) -> str:
    import io
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n\n".join(pages)


def _parse_markdown(content: bytes) -> str:
    return content.decode("utf-8", errors="replace")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/ingest")
async def ingest(file: UploadFile = File(...)):
    filename = file.filename or "unknown"
    content = await file.read()
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        text = _parse_pdf(content)
    elif ext in (".md", ".markdown"):
        text = _parse_markdown(content)
    else:
        raise HTTPException(400, f"Unsupported format: {ext}. Use PDF or Markdown.")

    if not text.strip():
        raise HTTPException(400, "No extractable text found in document.")

    chunks = split_text(text, CHUNK_SIZE, CHUNK_OVERLAP)
    if not chunks:
        raise HTTPException(400, "Document could not be split into chunks.")

    embeddings = embed_texts(chunks)
    doc_id = str(uuid.uuid4())

    db = _get_db()
    table_name = "documents"
    rows = []
    for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        rows.append({
            "doc_id": doc_id,
            "chunk_index": i,
            "filename": filename,
            "text": chunk,
            "vector": emb,
        })

    if table_name in db.table_names():
        table = db.open_table(table_name)
        table.add(rows)
    else:
        db.create_table(table_name, rows)

    return {
        "doc_id": doc_id,
        "filename": filename,
        "chunks": len(chunks),
    }


class SearchRequest(BaseModel):
    query: str


@app.post("/search")
async def search(req: SearchRequest):
    query = req.query.strip()
    if not query:
        raise HTTPException(400, "Query cannot be empty.")

    db = _get_db()
    if "documents" not in db.table_names():
        return {"results": []}

    table = db.open_table("documents")
    q_emb = embed_query(query)

    results = (
        table.search(q_emb)
        .limit(TOP_K)
        .select(["doc_id", "chunk_index", "filename", "text"])
        .to_list()
    )

    return {
        "results": [
            {
                "doc_id": r["doc_id"],
                "chunk_index": r["chunk_index"],
                "filename": r["filename"],
                "text": r["text"],
            }
            for r in results
        ]
    }


@app.get("/documents")
async def list_documents():
    """List distinct documents with filename and chunk count."""
    db = _get_db()
    if "documents" not in db.table_names():
        return {"documents": []}
    table = db.open_table("documents")
    all_rows = table.search().limit(10000).select(["doc_id", "filename"]).to_list()
    if not all_rows:
        return {"documents": []}
    from collections import Counter
    counts = Counter()
    filenames: dict[str, str] = {}
    for r in all_rows:
        counts[r["doc_id"]] += 1
        filenames[r["doc_id"]] = r["filename"]
    docs = [{"doc_id": k, "filename": filenames[k], "chunks": v} for k, v in counts.items()]
    return {"documents": docs}


@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete all chunks for a given doc_id."""
    db = _get_db()
    if "documents" not in db.table_names():
        raise HTTPException(404, "No documents table found.")
    table = db.open_table("documents")
    table.delete(f"doc_id = '{doc_id}'")
    return {"status": "deleted", "doc_id": doc_id}


@app.delete("/documents")
async def clear_all_documents():
    """Drop and recreate the documents table."""
    db = _get_db()
    if "documents" in db.table_names():
        db.drop_table("documents")
    return {"status": "cleared"}


@app.get("/documents/{doc_id}/chunks")
async def get_document_chunks(doc_id: str):
    """Get all chunks for a specific document."""
    db = _get_db()
    if "documents" not in db.table_names():
        return {"chunks": []}
    table = db.open_table("documents")
    rows = table.search().where(f"doc_id = '{doc_id}'").to_list()
    return {"chunks": [{"doc_id": r["doc_id"], "chunk_index": r["chunk_index"], "filename": r["filename"], "text": r["text"]} for r in rows]}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

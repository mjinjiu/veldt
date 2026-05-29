"""Embedding service using bge-small-en-v1.5 (384-dim, MIT license)."""
from __future__ import annotations

import os

from sentence_transformers import SentenceTransformer

# Offline mode: skip HuggingFace cache validation HEAD requests
# Set HF_HUB_OFFLINE=0 to re-enable online cache verification
os.environ.setdefault("HF_HUB_OFFLINE", "1")

MODEL_NAME = "BAAI/bge-small-en-v1.5"

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of text chunks. Returns list of 384-dim vectors."""
    model = get_model()
    embeddings = model.encode(texts, normalize_embeddings=True)
    return embeddings.tolist()


def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    model = get_model()
    embedding = model.encode([query], normalize_embeddings=True)
    return embedding[0].tolist()

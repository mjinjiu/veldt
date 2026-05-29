"""Embedding service using bge-small-en-v1.5 (384-dim, MIT license)."""
from __future__ import annotations

from sentence_transformers import SentenceTransformer

MODEL_NAME = "BAAI/bge-small-en-v1.5"

_model: SentenceTransformer | None = None
_model_error: str | None = None


def get_model() -> SentenceTransformer:
    """Load the embedding model. Raises RuntimeError with actionable message on failure."""
    global _model, _model_error

    if _model is not None:
        return _model

    if _model_error is not None:
        raise RuntimeError(_model_error)

    try:
        _model = SentenceTransformer(MODEL_NAME)
        return _model
    except Exception as e:
        error_msg = str(e).lower()
        if "proxy" in error_msg or "max retries" in error_msg or "connect" in error_msg:
            _model_error = (
                f"Failed to download embedding model '{MODEL_NAME}'.\n\n"
                "Network issue detected — HuggingFace is unreachable.\n\n"
                "Options:\n"
                "  1. Set HF_HUB_OFFLINE=1 if the model is already cached locally\n"
                "  2. Set HF_ENDPOINT=https://hf-mirror.com to use a mirror\n"
                "  3. Check your proxy settings (HTTP_PROXY / HTTPS_PROXY)\n"
                f"\nOriginal error: {e}"
            )
        else:
            _model_error = (
                f"Failed to load embedding model '{MODEL_NAME}'.\n"
                f"Error: {e}"
            )
        raise RuntimeError(_model_error) from e


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

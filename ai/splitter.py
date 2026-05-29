"""Recursive character text splitter — drop-in for langchain-text-splitters."""
from __future__ import annotations


def split_text(text: str, chunk_size: int = 512, chunk_overlap: int = 50) -> list[str]:
    separators = ["\n\n", "\n", ". ", "。", " ", ""]
    return _split_recursive(text, separators, chunk_size, chunk_overlap)


def _split_recursive(text: str, separators: list[str], chunk_size: int, overlap: int) -> list[str]:
    if len(text) <= chunk_size:
        return [text] if text.strip() else []

    sep = separators[0] if separators else ""
    remaining = separators[1:] if len(separators) > 1 else []

    if sep:
        parts = text.split(sep)
    else:
        parts = list(text)

    chunks: list[str] = []
    current = ""
    for part in parts:
        candidate = part if not current else current + sep + part
        if len(candidate) <= chunk_size:
            current = candidate
        else:
            if current.strip():
                chunks.append(current)
            if remaining:
                sub = _split_recursive(part, remaining, chunk_size, overlap)
                chunks.extend(sub)
                current = ""
            else:
                for i in range(0, len(part), chunk_size - overlap):
                    chunk = part[i:i + chunk_size]
                    if chunk.strip():
                        chunks.append(chunk)
                current = ""
    if current.strip():
        chunks.append(current)

    # Merge short chunks
    merged: list[str] = []
    for chunk in chunks:
        if merged and len(merged[-1]) + len(chunk) < chunk_size * 0.75:
            merged[-1] = merged[-1] + "\n" + chunk
        else:
            merged.append(chunk)
    return merged

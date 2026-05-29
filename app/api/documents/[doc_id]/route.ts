const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function DELETE(_req: Request, { params }: { params: Promise<{ doc_id: string }> }) {
  const { doc_id } = await params;
  const resp = await fetch(`${AI_SERVICE_URL}/documents/${encodeURIComponent(doc_id)}`, { method: "DELETE" }).catch(() => null);
  if (!resp || !resp.ok) return Response.json({ error: "Delete failed" }, { status: resp?.status || 502 });
  return Response.json(await resp.json());
}

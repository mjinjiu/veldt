const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function GET(_req: Request, { params }: { params: Promise<{ doc_id: string }> }) {
  const { doc_id } = await params;
  const resp = await fetch(`${AI_SERVICE_URL}/documents/${encodeURIComponent(doc_id)}/chunks`).catch(() => null);
  if (!resp || !resp.ok) return Response.json({ chunks: [] }, { status: resp?.status || 502 });
  return Response.json(await resp.json());
}

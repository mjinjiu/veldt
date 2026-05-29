const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function GET() {
  const resp = await fetch(`${AI_SERVICE_URL}/documents`).catch(() => null);
  if (!resp || !resp.ok) return Response.json({ documents: [] }, { status: resp?.status || 502 });
  return Response.json(await resp.json());
}

export async function DELETE() {
  const resp = await fetch(`${AI_SERVICE_URL}/documents`, { method: "DELETE" }).catch(() => null);
  if (!resp || !resp.ok) return Response.json({ error: "Clear failed" }, { status: resp?.status || 502 });
  return Response.json(await resp.json());
}

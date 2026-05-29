const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function GET() {
  const aiStatus = await fetch(`${AI_SERVICE_URL}/health`)
    .then((r) => r.ok)
    .catch(() => false);

  return Response.json({
    status: "ok",
    ai: aiStatus ? "online" : "offline",
  });
}

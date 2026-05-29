export const config = {
  api: {
    bodyParser: { sizeLimit: "50mb" },
  },
};

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const aiForm = new FormData();
  aiForm.append("file", file, file.name);

  const aiResp = await fetch(`${AI_SERVICE_URL}/ingest`, {
    method: "POST",
    body: aiForm,
  });

  if (!aiResp.ok) {
    const err = await aiResp.json();
    return Response.json({ error: err.detail || "Ingest failed" }, { status: aiResp.status });
  }

  const data = await aiResp.json();
  return Response.json(data);
}

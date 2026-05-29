const SYSTEM_PROMPT = `You are a helpful document assistant. Answer questions based ONLY on the provided document excerpts.
If the excerpts don't contain the answer, say "I couldn't find relevant information in the uploaded documents."
Always cite which document and chunk you used to answer. Be concise.`;

function buildPrompt(query: string, chunks: { filename: string; text: string }[]): string {
  const context = chunks
    .map((c, i) => `[Source ${i + 1}: ${c.filename}]\n${c.text}`)
    .join("\n\n---\n\n");

  return `${SYSTEM_PROMPT}\n\n## Document Excerpts\n${context}\n\n## Question\n${query}\n\n## Answer`;
}

function streamAnthropicSSE(body: ReadableStream): ReadableStream {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const json = JSON.parse(data);
                if (json.type === "content_block_delta" && json.delta?.text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: json.delta.text })}\n\n`));
                }
              } catch { /* skip */ }
            }
          }
        }
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
}

function streamOpenAISSE(body: ReadableStream): ReadableStream {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const json = JSON.parse(data);
                const text = json.choices?.[0]?.delta?.content;
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
              } catch { /* skip */ }
            }
          }
        }
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
}

function prefixStream(prefix: string, stream: ReadableStream): ReadableStream {
  const encoder = new TextEncoder();
  const prefixChunk = encoder.encode(prefix);
  let prefixed = false;

  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!prefixed) {
            controller.enqueue(prefixChunk);
            prefixed = true;
          }
          controller.enqueue(value);
        }
      } finally {
        if (!prefixed) {
          controller.enqueue(prefixChunk);
        }
        controller.close();
      }
    },
  });
}

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function POST(req: Request) {
  try {
    const { query, format, baseUrl, apiKey, model, history } = await req.json();

    if (!query?.trim()) {
      return Response.json({ error: "Query is required" }, { status: 400 });
    }
    if (!apiKey?.trim()) {
      return Response.json({ error: "API key is required" }, { status: 400 });
    }
    if (!baseUrl?.trim()) {
      return Response.json({ error: "API base URL is required" }, { status: 400 });
    }

    // 1. Search local vector DB
    const searchResp = await fetch(`${AI_SERVICE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!searchResp.ok) {
      return Response.json({ error: "Search failed" }, { status: 500 });
    }

    const { results } = await searchResp.json();

    if (!results?.length) {
      return Response.json({ error: "No relevant documents found. Upload documents first." }, { status: 404 });
    }

    // 2. Build prompt & call LLM
    let prompt = buildPrompt(query, results);
    if (history && history.length > 0) {
      const historyContext = history
        .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");
      prompt = `## Previous Conversation\n${historyContext}\n\n${prompt}`;
    }
    const signal = AbortSignal.timeout(60000);
    const base = baseUrl.replace(/\/+$/, "");

    let stream: ReadableStream;

    if (format === "anthropic") {
      const resp = await fetch(`${base}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model || "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
          stream: true,
        }),
        signal,
      });

      if (!resp.ok) {
        const err = await resp.text();
        return Response.json({ error: `Anthropic API error: ${resp.status} ${err}` }, { status: 502 });
      }

      stream = streamAnthropicSSE(resp.body!);
    } else {
      const resp = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          stream: true,
          max_tokens: 1024,
        }),
        signal,
      });

      if (!resp.ok) {
        const err = await resp.text();
        return Response.json({ error: `OpenAI API error: ${resp.status} ${err}` }, { status: 502 });
      }

      stream = streamOpenAISSE(resp.body!);
    }

    // Prepend source citations as first SSE event
    const sourcesEvent = `data: ${JSON.stringify({ sources: results.map((r: { doc_id: string; chunk_index: number; filename: string; text: string }) => ({ doc_id: r.doc_id, chunk_index: r.chunk_index, filename: r.filename, text: r.text })) })}\n\n`;
    const prefixed = prefixStream(sourcesEvent, stream);

    return new Response(prefixed, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

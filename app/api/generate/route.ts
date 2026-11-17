import Anthropic from "@anthropic-ai/sdk";
import { getAuthenticatedSupabase } from "../../../lib/supabase-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  return Response.json({ status: "ok", message: "ApplyIQ API is running" });
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedSupabase(req);
    if (!auth) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.prompt !== "string" || !body.prompt.trim()) {
      return Response.json({ error: "A valid prompt is required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: "AI service is not configured" },
        { status: 503 }
      );
    }

    const { data: allowed, error: quotaError } =
      await auth.supabase.rpc("consume_generation_quota");

    if (quotaError) {
      console.error("Generation quota check failed:", quotaError.message);
      return Response.json(
        { error: "Usage limit service is temporarily unavailable" },
        { status: 503 }
      );
    }

    if (!allowed) {
      return Response.json(
        { error: "Daily generation limit reached. Please try again tomorrow." },
        { status: 429 }
      );
    }

    const safePrompt = body.prompt.slice(0, 25000);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 5000,
      messages: [{ role: "user", content: safePrompt }],
    });

    const text = message.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");

    return Response.json({ text });
  } catch (error) {
    console.error("AI generation failed:", error);
    return Response.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 }
    );
  }
}

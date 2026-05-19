import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 5000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .map((block: any) => (block.type === "text" ? block.text : ""))
      .join("");

    return Response.json({ text });
  } catch (error: any) {
    console.error("API ERROR:", error);

    return Response.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
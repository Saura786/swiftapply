import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No PDF file uploaded" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return Response.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    if (file.size > 4 * 1024 * 1024) {
      return Response.json({ error: "PDF too large. Upload under 4MB." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdfParse(buffer);
    const text = String(data.text || "").trim();

    if (!text) {
      return Response.json(
        { error: "Could not read text from this PDF. Try DOCX instead." },
        { status: 400 }
      );
    }

    return Response.json({ text: text.slice(0, 7000) });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to read PDF" },
      { status: 500 }
    );
  }
}
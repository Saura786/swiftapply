export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse =
      (pdfParseModule as any).default ||
      (pdfParseModule as any).PDFParse ||
      pdfParseModule;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json(
        { error: "No PDF file uploaded" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return Response.json(
        { error: "Only PDF files are supported here" },
        { status: 400 }
      );
    }

    if (file.size > 4 * 1024 * 1024) {
      return Response.json(
        { error: "PDF too large. Please upload a file under 4MB." },
        { status: 400 }
      );
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

    return Response.json({
      text: text.slice(0, 7000),
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to read PDF" },
      { status: 500 }
    );
  }
}
import PDFParser from "pdf2json";

export const runtime = "nodejs";
export const maxDuration = 60;

function cleanPdfText(text: string) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([A-Z])\s+(?=[A-Z]\s)/g, "$1")
    .replace(/([a-zA-Z])\s+([a-zA-Z])/g, "$1$2")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+([,.:;])/g, "$1")
    .replace(/([•|])\s*/g, "\n$1 ")
    .trim();
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No PDF uploaded" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return Response.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    if (file.size > 2 * 1024 * 1024) {
      return Response.json(
        { error: "PDF too large. Please upload a text-based PDF under 2MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const rawText = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(new Error(errData?.parserError || "Could not read PDF"));
      });

      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent());
      });

      pdfParser.parseBuffer(buffer);
    });

    const text = cleanPdfText(rawText);

    if (!text || text.length < 50) {
      return Response.json(
        {
          error:
            "Could not read this PDF properly. It may be scanned/image-based. Please upload DOCX or paste resume text.",
        },
        { status: 400 }
      );
    }

    return Response.json({
      text: text.slice(0, 20000),
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "PDF upload failed" },
      { status: 500 }
    );
  }
}
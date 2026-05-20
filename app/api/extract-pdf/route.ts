import PDFParser from "pdf2json";

export const runtime = "nodejs";
export const maxDuration = 60;

function decodeText(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value || "";
  }
}

function extractTextFromPdfJson(pdfData: any) {
  let output = "";

  for (const page of pdfData?.Pages || []) {
    const items = (page.Texts || [])
      .map((item: any) => {
        const text = (item.R || [])
          .map((run: any) => decodeText(run.T || ""))
          .join("");

        return {
          x: Number(item.x || 0),
          y: Number(item.y || 0),
          text,
        };
      })
      .filter((item: any) => item.text.trim());

    items.sort((a: any, b: any) => {
      if (Math.abs(a.y - b.y) > 0.4) return a.y - b.y;
      return a.x - b.x;
    });

    let currentY: number | null = null;
    let line = "";
    let lastX = 0;

    for (const item of items) {
      const sameLine = currentY !== null && Math.abs(item.y - currentY) < 0.4;

      if (!sameLine) {
        if (line.trim()) output += line.trim() + "\n";
        line = item.text;
        currentY = item.y;
        lastX = item.x;
      } else {
        const gap = item.x - lastX;

        if (gap > 1.4) {
          line += " " + item.text;
        } else {
          line += item.text;
        }

        lastX = item.x;
      }
    }

    if (line.trim()) output += line.trim() + "\n";
    output += "\n";
  }

  return output.trim();
}

function cleanFinalText(text: string) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+([,.:;])/g, "$1")
    .replace(/([•])\s*/g, "\n• ")
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

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        const extracted = extractTextFromPdfJson(pdfData);
        resolve(extracted);
      });

      pdfParser.parseBuffer(buffer);
    });

    const text = cleanFinalText(rawText);

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
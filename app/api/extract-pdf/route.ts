import PDFParser from "pdf2json";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PDF_SIZE_MB = 5;
const MAX_TEXT_LENGTH = 40000;

function decodePdfText(value: string) {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
}

function cleanText(text: string) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+([,.:;])/g, "$1")
    .replace(/([•])\s*/g, "\n• ")
    .replace(/\bG oogle\b/g, "Google")
    .replace(/\bG ujar\b/g, "Gujar")
    .replace(/\bC RM\b/g, "CRM")
    .replace(/\bC PL\b/g, "CPL")
    .replace(/\bC TR\b/g, "CTR")
    .replace(/\bC PA\b/g, "CPA")
    .replace(/\bG A4\b/g, "GA4")
    .replace(/\bG TM\b/g, "GTM")
    .replace(/\bC anva\b/g, "Canva")
    .replace(/\bC loud\b/g, "Cloud")
    .replace(/\bC ontent\b/g, "Content")
    .replace(/\bC ampaign\b/g, "Campaign")
    .replace(/\bC onversion/g, "Conversion")
    .replace(/\bC reative\b/g, "Creative")
    .replace(/\bC apture\b/g, "Capture")
    .replace(/\bC hat G PT\b/g, "ChatGPT")
    .replace(/\bPROFESSIONALEXPERIEN C E\b/g, "PROFESSIONAL EXPERIENCE")
    .replace(/\bC AREERHI G HLI G HTS\b/g, "CAREER HIGHLIGHTS")
    .replace(/\bC ORE C OMPETEN C IES\b/g, "CORE COMPETENCIES")
    .trim();
}

function extractTextFromPdfData(pdfData: any) {
  let finalText = "";

  for (const page of pdfData?.Pages || []) {
    const rows: Record<string, any[]> = {};

    for (const item of page.Texts || []) {
      const y = Math.round(Number(item.y || 0) * 10) / 10;

      const text = (item.R || [])
        .map((run: any) => decodePdfText(run.T))
        .join("");

      if (!text.trim()) continue;

      if (!rows[y]) rows[y] = [];

      rows[y].push({
        x: Number(item.x || 0),
        w: Number(item.w || 0),
        text,
      });
    }

    const sortedRows = Object.entries(rows).sort(
      ([a], [b]) => Number(a) - Number(b)
    );

    for (const [, items] of sortedRows) {
      items.sort((a, b) => a.x - b.x);

      let line = "";
      let lastRight = 0;

      for (const item of items) {
        const estimatedWidth =
          item.w && item.w > 0
            ? item.w
            : Math.max(item.text.length * 0.16, 0.5);

        const gap = item.x - lastRight;

        if (!line) {
          line = item.text;
        } else if (gap > 0.18) {
          line += " " + item.text;
        } else {
          line += item.text;
        }

        lastRight = item.x + estimatedWidth;
      }

      if (line.trim()) finalText += line.trim() + "\n";
    }

    finalText += "\n";
  }

  return cleanText(finalText);
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

    if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
      return Response.json(
        {
          error: `PDF too large. Please upload a text-based PDF under ${MAX_PDF_SIZE_MB}MB.`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const extractedText = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(new Error(errData?.parserError || "Could not read PDF"));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        resolve(extractTextFromPdfData(pdfData));
      });

      pdfParser.parseBuffer(buffer);
    });

    if (!extractedText || extractedText.length < 50) {
      return Response.json(
        {
          error:
            "Could not read this PDF properly. It may be scanned/image-based. Please upload DOCX or paste resume text.",
        },
        { status: 400 }
      );
    }

    return Response.json({
      text: extractedText.slice(0, MAX_TEXT_LENGTH),
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "PDF upload failed" },
      { status: 500 }
    );
  }
}
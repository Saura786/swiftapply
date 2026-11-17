import PDFParser from "pdf2json";
import { getAuthenticatedSupabase } from "../../../lib/supabase-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PDF_SIZE_MB = 5;
const MAX_TEXT_LENGTH = 50000;

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
    .replace(/\bSA G E\b/g, "SAGE")
    .replace(/\bC onducted\b/g, "Conducted")
    .replace(/\bwiththe\b/g, "with the")
    .replace(/\bsoftwaretools\b/g, "software tools")
    .replace(/\btransactiondet\b/g, "transaction details")
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parserErrorMessage(errorData: unknown) {
  if (errorData instanceof Error) return errorData.message;
  if (isRecord(errorData)) {
    const parserError = errorData.parserError;
    if (parserError instanceof Error) return parserError.message;
    if (typeof parserError === "string") return parserError;
  }
  return "Could not read PDF";
}

function extractTextFromPdfData(pdfData: unknown) {
  let finalText = "";
  const root = isRecord(pdfData) ? pdfData : {};
  const pages = Array.isArray(root.Pages) ? root.Pages : [];

  for (const pageValue of pages) {
    const page = isRecord(pageValue) ? pageValue : {};
    const textItems = Array.isArray(page.Texts) ? page.Texts : [];
    const items: { x: number; y: number; w: number; text: string }[] = [];

    for (const itemValue of textItems) {
      const item = isRecord(itemValue) ? itemValue : {};
      const runs = Array.isArray(item.R) ? item.R : [];
      const text = runs
        .map((runValue) => {
          const run = isRecord(runValue) ? runValue : {};
          return decodePdfText(typeof run.T === "string" ? run.T : "");
        })
        .join("");

      if (!text.trim()) continue;

      const x = typeof item.x === "number" || typeof item.x === "string" ? Number(item.x) : 0;
      const y = typeof item.y === "number" || typeof item.y === "string" ? Number(item.y) : 0;
      const w = typeof item.w === "number" || typeof item.w === "string" ? Number(item.w) : 0;
      items.push({ x, y, w, text });
    }

    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 0.25) return a.y - b.y;
      return a.x - b.x;
    });

    let currentY: number | null = null;
    let line = "";
    let lastRight = 0;

    for (const item of items) {
      const sameLine =
        currentY !== null && Math.abs(item.y - currentY) <= 0.25;

      if (!sameLine) {
        if (line.trim()) finalText += line.trim() + "\n";

        line = item.text;
        currentY = item.y;
        lastRight = item.x + Math.max(item.w || 0, item.text.length * 0.12);
      } else {
        const gap = item.x - lastRight;

        if (gap > 0.12) {
          line += " " + item.text;
        } else {
          line += item.text;
        }

        lastRight = item.x + Math.max(item.w || 0, item.text.length * 0.12);
      }
    }

    if (line.trim()) finalText += line.trim() + "\n";
    finalText += "\n";
  }

  return cleanText(finalText);
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedSupabase(req);
    if (!auth) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }
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

      pdfParser.on("pdfParser_dataError", (errData: unknown) => {
        reject(new Error(parserErrorMessage(errData)));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: unknown) => {
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
  } catch (error: unknown) {
    return Response.json(
      { error: error instanceof Error ? error.message : "PDF upload failed" },
      { status: 500 }
    );
  }
}
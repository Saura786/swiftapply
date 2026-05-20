import { createRequire } from "module";

const require = createRequire(import.meta.url);
const PDFParser = require("pdf2json");

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No PDF uploaded" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return Response.json({ error: "Only PDF files supported" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return Response.json(
        { error: "PDF too large. Please upload a text-based PDF under 2MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const text = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(new Error(errData?.parserError || "Could not read PDF"));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        let output = "";

        for (const page of pdfData.Pages || []) {
          for (const textItem of page.Texts || []) {
            for (const run of textItem.R || []) {
              if (run.T) {
                output += decodeURIComponent(run.T) + " ";
              }
            }
          }
          output += "\n";
        }

        resolve(output.trim());
      });

      pdfParser.parseBuffer(buffer);
    });

    if (!text || text.length < 50) {
      return Response.json(
        { error: "Could not read this PDF. It may be scanned/image-based. Please upload DOCX or paste resume text." },
        { status: 400 }
      );
    }

    return Response.json({ text: text.slice(0, 20000) });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "PDF upload failed" },
      { status: 500 }
    );
  }
}
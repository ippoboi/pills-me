import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import os from "os";
import type { Json, Database } from "@/lib/supabase/database.types";
import { authenticateRequest } from "@/lib/auth-helper";

type ReportStatus = Database["public"]["Enums"]["report_status"];

// ============================================================================
// TYPES
// ============================================================================

interface PatientInfo {
  patient_name: string | null;
  collected_at_local: string | null;
}

interface LabInfo {
  lab_name: string | null;
  lab_address: string | null;
  country: string | null;
  timezone_id: string | null;
}

interface BiomarkerResult {
  name: string;
  value: number | null;
  unit: string | null;
  /**
   * Raw textual representation of the reported value, e.g. "<1", ">150",
   * "3.2", "Négatif". May be null if no value is present.
   */
  value_in_text: string | null;
}

interface OCRResponse {
  patient_info: PatientInfo;
  lab_info: LabInfo;
  results: BiomarkerResult[];
}

interface ExtractedReport {
  patient_info: PatientInfo;
  lab_info: LabInfo;
  all_results: BiomarkerResult[];
}

// ============================================================================
// PROMPT
// ============================================================================

const OCR_PROMPT = `You are a medical document OCR assistant specialized in extracting data from blood test / laboratory reports.

TASK
Extract all biomarker measurements from this lab report image and return ONLY a JSON object.

The report may have different layouts, multiple columns, headers, footers, and varying formats between labs.
Focus ONLY on actual test result rows (e.g., "Hémoglobine", "Créatinine", "Glucose", "Polynucléaires neutrophiles", etc.).

OUTPUT FORMAT
Return a JSON object with this EXACT structure:

{
  "patient_info": {
    "patient_name": string | null,
    "collected_at_local": string | null
  },
  "lab_info": {
    "lab_name": string | null,
    "lab_address": string | null,
    "country": string | null,
    "timezone_id": string | null
  },
  "results": [
    {
      "name": string,
      "value": number | null,
      "unit": string | null,
      "value_in_text": string | null
    }
  ]
}

COUNTRY & ADDRESS RULES

- Extract any lab address text you can clearly see (street, city, postal code, country) into "lab_address" as a single line.
- Infer the country from the lab name/address if possible:
  - If a country name or code is explicitly written (e.g. "France", "FR"), use it.
  - Otherwise, infer from city names, postal code format, or language when reasonably confident.
- For "country": prefer ISO 2-letter codes (e.g. "FR", "TH", "US") if obvious.
  - If ISO code is not obvious but the country name is, return the full country name (e.g. "France").
  - If not confident about the country, set "country" to null, but still fill "lab_address" if you can.

TIME & TIMEZONE RULES

- "collected_at_local" must contain the local date and time of sample collection if visible (e.g. "23/05/2025 08:32").
- Do NOT convert to UTC; keep the local representation exactly as written, normalized only for obvious typos.
- Infer "country" and "timezone_id" when possible:
  - "country": prefer ISO 2-letter codes like "FR" or "TH"; otherwise full country name.
  - "timezone_id": if you can confidently infer the IANA timezone (e.g. "Europe/Paris", "Asia/Bangkok") from the address, city, or country, return it.
  - If timezone is ambiguous or not clear, set "timezone_id" to null.

NAME CLEANING RULES (VERY IMPORTANT)

When you build the "name" field for each result:

1. Start from the label of the test in the row (e.g. "Polynucléaires neutrophiles Soit :", "Lymphocytes Soit :", "Hémoglobine").
2. REMOVE any trailing filler words that are not part of the analyte name, especially in French such as:
   - "Soit", "Soit :", "soit", "soit :"
   - "Dont", "Dont :", "dont", "dont :"
   - Any colon ":" or "%" or similar that appears AFTER these filler words.
3. After removal, trim extra spaces.
4. Examples:
   - "Polynucléaires neutrophiles Soit :" -> "Polynucléaires neutrophiles"
   - "Lymphocytes  Soit :" -> "Lymphocytes"
   - "Granulocytes immatures  Soit :" -> "Granulocytes immatures"
5. Do NOT add "Soit", "Dont", or similar words to the "name" field.

VALUE RULES

- "value_in_text":
  - MUST always contain the **raw text** shown in the patient result cell for that analyte.
  - Examples:
    - "3.2"
    - "<1"
    - ">150"
    - "Négatif"
  - Ignore reference ranges or flags that may appear in other columns (e.g. values inside parentheses like "(<5)", or "H"/"L" flags).

- "value":
  - Extract ONLY the numeric measurement value (the patient's result).
  - Parse as a number (float) if possible.
  - If the result text contains comparison operators like ">150", "<5", or "< 1":
    - Extract just the number into "value" (150, 5, 1, etc.).
    - Ignore the ">" or "<" symbol in "value".
    - Example: if the report shows "CRP (Protéine C reactive)  <1  mg/L  (<5)", then:
      - "name": "CRP (Protéine C reactive)"
      - "value_in_text": "<1"
      - "value": 1
      - "unit": "mg/L"
  - If the value is entirely non-numeric text like "Négatif", "Positif", "Negative", "Positive":
    - Set "value_in_text" to that text.
    - Set "value" to null.

- Ignore reference ranges and flags (e.g. "(<5)", "H", "L") in "value" and "unit".

PATIENT AND LAB INFO

- "patient_name":
  - Extract if clearly visible (e.g. near "Nom", "Patient", "Name").
  - If there are multiple name-like fields, prefer the explicit patient name.
  - If ambiguous or not visible, set to null.

- "lab_name":
  - Extract if the laboratory name is clearly shown in headers/footers or as "Laboratoire de Biologie Médicale", etc.
  - If you are not sure, set to null.

WHAT TO IGNORE

- Logos, disclaimers, payment info, contact details.
- Column headers such as "Paramètre", "Résultat", "Valeurs de référence".
- Explanatory text that is not an analyte/test result row.
- Any line where the only meaningful word in the analyte/parameter column is a filler like
  "Soit", "Soit :", "Dont", "Dont :", "Total", etc. These lines are helpers for the previous row,
  not separate tests.

ROW GROUPING & "SOIT" LINES (AVOID DUPLICATE RESULTS)

- Many French CBC reports show a main row and a helper row, for example:
  - Line 1: "Polynucléaires neutrophiles          61.2 %"
  - Line 2: "        Soit :                       3.739"
- In such cases:
  1) Treat BOTH lines as a **single biomarker result** for "Polynucléaires neutrophiles".
  2) Do **not** create a separate result whose name would be "Soit" or similar.
  3) Use the helper line (with "Soit", "Dont", etc.) only to refine the measurement:
     - Use its numeric value as \`value_in_text\` and parse it into \`value\` when possible.
     - If both a % value and an absolute value exist, prefer the **absolute value** (e.g. G/L,
       x10^9/L, 10^3/µL) for \`value\` and \`value_in_text\`, and ignore the %.
- Only create multiple results for the same cell type if the report clearly shows
  **independent analyte labels** (e.g. one line labelled "Neutrophiles %" and a different
  line labelled "Neutrophiles (G/L)").

RETURN ONLY VALID JSON

- Do NOT wrap the JSON in markdown fences.
- Do NOT add explanations before or after the JSON.
- Do NOT include comments inside the JSON.
- The response MUST be valid JSON that can be parsed by JSON.parse().

Now extract from the provided lab report image.`;

// ============================================================================
// ROUTE CONFIG / GROQ CLIENT
// ============================================================================
// Force Node.js runtime since this route relies on fs/path/os/pdfjs.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY environment variable is not set in the server environment"
    );
  }
  return new Groq({ apiKey });
}

// ============================================================================
// PDF TEXT EXTRACTION (using pdfjs-serverless)
// ============================================================================

async function extractTextFromPdf(pdfPath: string): Promise<string> {
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`);
  }

  try {
    // Use pdfjs-serverless for direct text extraction
    const { getDocument } = await import("pdfjs-serverless");

    // Read PDF file
    const data = new Uint8Array(fs.readFileSync(pdfPath));

    // Load the PDF document
    const loadingTask = getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    let fullText = "";

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine text items into a single string
      const pageText = textContent.items
        .map((item) => (item as { str: string }).str)
        .join(" ");

      fullText += pageText + "\n\n";
    }

    return fullText.trim();
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw error;
  }
}

// ============================================================================
// PDF / IMAGE HELPERS
// ============================================================================

// Simplified: Process text directly from PDF or handle images
async function processDocument(filePath: string): Promise<ExtractedReport> {
  const isPdf = isFilePdf(filePath);

  if (isPdf) {
    // Extract text directly from PDF
    const extractedText = await extractTextFromPdf(filePath);

    // Process the extracted text with our AI agent
    return await processExtractedText(extractedText);
  } else {
    // Handle image files (existing image processing)
    return await processImageFile(filePath);
  }
}

function isFilePdf(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext === ".pdf";
}

async function imageToBase64DataUrl(imagePath: string): Promise<string> {
  const buffer = fs.readFileSync(imagePath);
  const base64 = buffer.toString("base64");

  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };

  const mimeType = mimeTypes[ext] || "image/png";
  return `data:${mimeType};base64,${base64}`;
}

// ============================================================================
// GROQ PROCESSING (TEXT & IMAGE)
// ============================================================================

async function processExtractedText(
  extractedText: string
): Promise<ExtractedReport> {
  const textPrompt = `${OCR_PROMPT}

NOTE: The text below has been extracted from a PDF lab report. Process this text and extract the biomarker data according to the schema.

TEXT CONTENT:
${extractedText}`;

  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    response_format: { type: "json_object" },
    temperature: 0,
    messages: [
      {
        role: "user",
        content: textPrompt,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("No response content from Groq");
  }

  const parsed: OCRResponse = JSON.parse(raw);
  return {
    patient_info: parsed.patient_info,
    lab_info: parsed.lab_info,
    all_results: parsed.results,
  };
}

async function processImageFile(imagePath: string): Promise<ExtractedReport> {
  const imageDataUrl = await imageToBase64DataUrl(imagePath);

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text: OCR_PROMPT,
    },
    {
      type: "image_url",
      image_url: { url: imageDataUrl },
    },
  ];

  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    response_format: { type: "json_object" },
    temperature: 0,
    messages: [
      {
        role: "user",
        content,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("No response content from Groq");
  }

  const parsed: OCRResponse = JSON.parse(raw);
  return {
    patient_info: parsed.patient_info,
    lab_info: parsed.lab_info,
    all_results: parsed.results,
  };
}

// Main processing function - much simpler now!
async function processLabReport(filePath: string): Promise<ExtractedReport> {
  return await processDocument(filePath);
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userId, supabase } = auth;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Missing file. Send a PDF or image as form-data under `file`.",
        },
        { status: 400 }
      );
    }

    const reportName =
      formData.get("report_name")?.toString().trim() || "Lab report";
    const collectedDate = formData.get("collected_date")?.toString().trim();
    const collectedTime = formData.get("collected_time")?.toString().trim();
    const timezoneId = formData.get("timezone_id")?.toString().trim() || null;

    const uploadDir = path.join(os.tmpdir(), "pills-me-ocr");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const originalName = (file as File).name || "upload";
    const extFromName = path.extname(originalName);
    const fallbackExt =
      file.type === "application/pdf"
        ? ".pdf"
        : file.type.startsWith("image/")
        ? ".png"
        : "";
    const ext = extFromName || fallbackExt || ".bin";

    const tempPath = path.join(
      uploadDir,
      `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    );

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempPath, buffer);

    let extracted: ExtractedReport;
    try {
      extracted = await processLabReport(tempPath);
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }

    let collectedAt: string | null = null;
    if (collectedDate && collectedTime) {
      collectedAt = `${collectedDate}T${collectedTime}:00`;
    } else if (extracted.patient_info.collected_at_local) {
      collectedAt = extracted.patient_info.collected_at_local;
    }

    // Validate extracted results
    if (!Array.isArray(extracted.all_results)) {
      console.error("Invalid extracted results format:", extracted.all_results);
      return NextResponse.json(
        { error: "Invalid biomarker extraction format" },
        { status: 500 }
      );
    }

    // Create report with EXTRACTING status
    const { data: reportRow, error: reportError } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        report_name: reportName,
        collected_at: collectedAt,
        country: extracted.lab_info.country,
        lab_name: extracted.lab_info.lab_name,
        timezone_id: timezoneId ?? extracted.lab_info.timezone_id,
        status: "EXTRACTING" as ReportStatus,
      })
      .select("*")
      .single();

    if (reportError || !reportRow) {
      console.error("Failed to create report row:", reportError);
      return NextResponse.json(
        { error: "Failed to create report record" },
        { status: 500 }
      );
    }

    try {
      // Store raw biomarkers and update status to VERIFYING
      const { data: updatedReport, error: updateError } = await supabase
        .from("reports")
        .update({
          raw_biomarkers: extracted.all_results as unknown as Json,
          status: "VERIFYING" as ReportStatus,
        })
        .eq("id", reportRow.id)
        .select("*")
        .single();

      if (updateError || !updatedReport) {
        console.error("Failed to store raw biomarkers:", updateError);
        // Mark as CANCELED if we can't save the data
        await supabase
          .from("reports")
          .update({ status: "CANCELED" as ReportStatus })
          .eq("id", reportRow.id);
        return NextResponse.json(
          { error: "Failed to store extracted biomarkers" },
          { status: 500 }
        );
      }

      // Verify that raw_biomarkers was actually saved
      if (!updatedReport.raw_biomarkers) {
        console.error("raw_biomarkers was not saved to database");
        await supabase
          .from("reports")
          .update({ status: "CANCELED" as ReportStatus })
          .eq("id", reportRow.id);
        return NextResponse.json(
          { error: "Failed to store extracted biomarkers" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        report: updatedReport,
        patient_info: extracted.patient_info,
        lab_info: extracted.lab_info,
        total_biomarkers: extracted.all_results.length,
        extraction_timestamp: new Date().toISOString(),
      });
    } catch (processingError) {
      console.error("Processing error:", processingError);
      // Mark report as CANCELED on any processing error
      await supabase
        .from("reports")
        .update({ status: "CANCELED" as ReportStatus })
        .eq("id", reportRow.id);
      throw processingError;
    }
  } catch (error) {
    console.error("Error in /api/biomarkers/ocr route:", error);

    // Check if it's a Groq API error (token limits, etc.)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isGroqError =
      errorMessage.includes("rate limit") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("token") ||
      errorMessage.includes("insufficient");

    return NextResponse.json(
      {
        error: isGroqError
          ? "AI service unavailable. Please try again later."
          : "Internal server error while processing OCR",
      },
      { status: 500 }
    );
  }
}

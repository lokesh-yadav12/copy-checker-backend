import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";


const extractTextFromPdf = async (pdfPath) => {
  try {
    const data = new Uint8Array(fs.readFileSync(pdfPath));

    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      let lastY = null;
      let pageText = "";

      for (const item of content.items) {
        const y = item.transform[5];

        // Add line break when Y position changes significantly
        if (lastY !== null && Math.abs(y - lastY) > 5) {
          pageText += "\n";
        }

        pageText += item.str + " ";
        lastY = y;
      }

      fullText += pageText + "\n";
    }

    // 🔥 Clean spaces BUT preserve line breaks
    fullText = fullText
      .replace(/[ \t]+/g, " ")     // collapse multiple spaces
      .replace(/\n+/g, "\n")       // collapse multiple newlines
      .trim();

    return fullText;

  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};



/**
 * Extract roll number from text
 */
const extractRollNumberFromText = (text) => {
  if (!text) return null;

  const patterns = [
    /Roll\s*Number\s*:?\s*([A-Z0-9]+)/i,
    /Roll\s*No\.?\s*:?\s*([A-Z0-9]+)/i,
    /Roll\s*#?\s*:?\s*([A-Z0-9]+)/i,
    /Student\s*(?:ID|Number)\s*:?\s*([A-Z0-9]+)/i,
    /Enrollment\s*(?:No|Number)\s*:?\s*([A-Z0-9]+)/i,
    /\b(\d{4}[A-Z]{2,}[A-Z0-9]*)\b/i,
    /\b([A-Z]{2,}\d{4}[A-Z0-9]*)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim().toUpperCase();
    }
  }

  return null;
};

/**
 * Extract name from text
 */
const extractNameFromText = (text) => {
  if (!text) return null;

  const patterns = [
    /Name\s*:?\s*([A-Za-z\s]+?)(?:\n|Roll|Student|Enrollment|$)/i,
    /Student\s*Name\s*:?\s*([A-Za-z\s]+?)(?:\n|Roll|Student|Enrollment|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
};

/**
 * Extract both roll number and name from PDF
 */
export const extractStudentInfo = async (filePath) => {
  try {
    console.log("Extracting student info from:", filePath);

    if (!filePath.toLowerCase().endsWith(".pdf")) {
      return {
        rollNumber: null,
        name: null,
        error: "Only PDF files are supported"
      };
    }

    const text = await extractTextFromPdf(filePath);

    const rollNumber = extractRollNumberFromText(text);
    const name = extractNameFromText(text);

    return {
      rollNumber,
      name,
      rawText: text
    };

  } catch (error) {
    console.error("Student info extraction error:", error);

    return {
      rollNumber: null,
      name: null,
      error: error.message
    };
  }
};

/**
 * Optional: Batch extractor
 */
export const extractRollNumbersBatch = async (filePaths) => {
  const results = [];

  for (const filePath of filePaths) {
    const result = await extractStudentInfo(filePath);
    results.push({
      filePath,
      rollNumber: result.rollNumber,
      success: !!result.rollNumber,
      error: result.error || null
    });
  }

  return results;
};

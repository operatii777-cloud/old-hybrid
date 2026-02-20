import fs from 'fs/promises';
import path from 'path';
import { openai } from '../shared/openaiClient';

const MIN_PDF_TEXT_LENGTH = 100;

export type SourceType = 'TEXT' | 'DOCX' | 'EXCEL' | 'CSV' | 'PDF' | 'IMAGE';

export interface ParsedDocument {
  rawText: string;
  sourceType: SourceType;
  metadata: {
    filename: string;
    pages?: number;
    sheets?: string[];
  };
}

export async function parseDocument(filePath: string): Promise<ParsedDocument> {
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);

  switch (ext) {
    case '.txt':
    case '.md': {
      const rawText = await fs.readFile(filePath, 'utf-8');
      return { rawText, sourceType: 'TEXT', metadata: { filename } };
    }

    case '.docx': {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return { rawText: result.value, sourceType: 'DOCX', metadata: { filename } };
    }

    case '.xlsx':
    case '.xls': {
      const XLSX = await import('xlsx');
      const workbook = XLSX.readFile(filePath);
      const sheets = workbook.SheetNames;
      const rawText = sheets
        .map((name: string) => {
          const sheet = workbook.Sheets[name];
          return `=== ${name} ===\n${XLSX.utils.sheet_to_csv(sheet)}`;
        })
        .join('\n\n');
      return { rawText, sourceType: 'EXCEL', metadata: { filename, sheets } };
    }

    case '.csv': {
      const rawText = await fs.readFile(filePath, 'utf-8');
      return { rawText, sourceType: 'CSV', metadata: { filename } };
    }

    case '.pdf': {
      try {
        const pdfParse = await import('pdf-parse');
        const buffer = await fs.readFile(filePath);
        const data = await pdfParse.default(buffer);
        if (data.text && data.text.length >= MIN_PDF_TEXT_LENGTH) {
          return {
            rawText: data.text,
            sourceType: 'PDF',
            metadata: { filename, pages: data.numpages },
          };
        }
        // Fallback to Tesseract OCR if text is too short
        const Tesseract = await import('tesseract.js');
        const { data: ocrData } = await Tesseract.recognize(filePath, 'ron+eng');
        return {
          rawText: ocrData.text,
          sourceType: 'PDF',
          metadata: { filename, pages: data.numpages },
        };
      } catch {
        const Tesseract = await import('tesseract.js');
        const { data: ocrData } = await Tesseract.recognize(filePath, 'ron+eng');
        return { rawText: ocrData.text, sourceType: 'PDF', metadata: { filename } };
      }
    }

    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.webp': {
      const buffer = await fs.readFile(filePath);
      const base64 = buffer.toString('base64');
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.webp': 'image/webp',
      };
      const mime = mimeMap[ext] ?? 'image/jpeg';
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'extrage tot textul din meniu, inclusiv prețuri și ingrediente' },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
            ],
          },
        ],
        max_tokens: 4096,
      });
      const rawText = response.choices[0]?.message?.content ?? '';
      return { rawText, sourceType: 'IMAGE', metadata: { filename } };
    }

    default:
      throw new Error(`Extensie nesuportată: ${ext}`);
  }
}

export type PdfExtractionProgress = {
  stage: "upload" | "parse" | "ocr" | "done" | "error";
  percent: number;
  message: string;
  currentChunk?: number;
  totalChunks?: number;
  totalPages?: number;
};

export type PdfExtractStreamEvent =
  | PdfExtractionProgress
  | {
      stage: "done";
      percent: 100;
      message: string;
      text: string;
      method: string;
      totalPages?: number;
      charCount: number;
      truncated?: boolean;
    }
  | {
      stage: "error";
      percent: number;
      message: string;
    };

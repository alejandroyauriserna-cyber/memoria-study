import type { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function chunkPdfText(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2500,
    chunkOverlap: 300,
  });

  const chunks: Document[] = await splitter.createDocuments([text]);

  return chunks.map((chunk) => chunk.pageContent);
}
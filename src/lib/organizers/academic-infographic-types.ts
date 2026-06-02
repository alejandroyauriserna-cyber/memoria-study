export type AcademicInfographic = {
  centralTopic: string;
  subtopics: string[];
  imageUrl: string;
  prompt: string;
  generatedAt: string;
  source: "gemini" | "svg";
};

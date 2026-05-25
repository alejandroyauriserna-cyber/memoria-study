import { createId } from "@/lib/utils";
import type { StudyDeckOutput } from "@/lib/ai/schema";

const stopWords = new Set([
  "ademas",
  "algunos",
  "aunque",
  "cada",
  "como",
  "cuando",
  "donde",
  "desde",
  "entre",
  "esta",
  "estas",
  "este",
  "estos",
  "hacia",
  "para",
  "porque",
  "puede",
  "segun",
  "sobre",
  "tambien",
  "tiene",
  "the",
  "and",
  "that",
  "with",
  "from",
  "this",
  "were",
  "have",
  "their",
]);

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function splitSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?;:])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 55 && sentence.length < 320);
}

function topKeywords(text: string) {
  const counts = new Map<string, number>();

  for (const word of normalize(text).match(/[a-z0-9ñ]{5,}/g) ?? []) {
    if (!stopWords.has(word)) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([word]) => word);
}

function keywordScore(sentence: string, keywords: string[]) {
  const value = normalize(sentence);
  const definitionBonus = /\b(es|son|consiste|comprende|define|regula|establece)\b/i.test(
    sentence,
  )
    ? 3
    : 0;
  return (
    definitionBonus +
    keywords.reduce((score, keyword) => score + (value.includes(keyword) ? 1 : 0), 0)
  );
}

function extractTerm(sentence: string, keywords: string[]) {
  const definitionMatch = sentence.match(
    /^([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s]{3,55})\s+(es|son|consiste|comprende|define|regula|establece)\b/,
  );

  if (definitionMatch?.[1]) {
    return definitionMatch[1].trim();
  }

  const normalizedSentence = normalize(sentence);
  return (
    keywords.find((keyword) => normalizedSentence.includes(keyword)) ??
    sentence.split(/\s+/).find((word) => word.length > 7) ??
    "concepto clave"
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeQuestion(term: string, sentence: string) {
  if (/\b(es|son)\b/i.test(sentence)) {
    return `Que es "${term}" segun el documento?`;
  }

  if (/\b(regula|establece|dispone)\b/i.test(sentence)) {
    return `Que establece el documento sobre "${term}"?`;
  }

  return `Explica la idea central relacionada con "${term}".`;
}

function titleFromSource(sourceName: string, keywords: string[]) {
  const cleanName = sourceName.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ");
  const topic = keywords.slice(0, 2).join(" y ");
  return topic ? `${cleanName}: ${topic}` : cleanName;
}

function uniqueOptions(answer: string, keywords: string[], index: number) {
  const options = [answer];

  for (const keyword of keywords.slice(index, index + 8)) {
    if (!options.some((option) => normalize(option) === normalize(keyword))) {
      options.push(keyword);
    }
    if (options.length === 4) break;
  }

  while (options.length < 4) {
    options.push(`alternativa ${options.length + 1}`);
  }

  return options;
}

export function generateLocalStudyDeck(input: {
  sourceName: string;
  text: string;
}): StudyDeckOutput {
  const sentences = splitSentences(input.text);
  const keywords = topKeywords(input.text);
  const coreSentences = [...sentences]
    .sort((a, b) => keywordScore(b, keywords) - keywordScore(a, keywords))
    .slice(0, 14);

  const usableSentences = coreSentences.length >= 6 ? coreSentences : sentences.slice(0, 14);
  const summary = usableSentences.slice(0, 4).join(" ");

  const flashcards = usableSentences.slice(0, 10).map((sentence, index) => {
    const term = extractTerm(sentence, keywords);

    return {
      id: createId("card"),
      front: makeQuestion(term, sentence),
      back: sentence,
      hint: `Busca en el PDF la parte donde aparece "${term}".`,
      tags: keywords.slice(index, index + 2).length
        ? keywords.slice(index, index + 2)
        : ["pdf", "repaso"],
    };
  });

  const fillBlanks = usableSentences.slice(0, 7).map((sentence) => {
    const answer = extractTerm(sentence, keywords);
    const blanked = sentence.replace(new RegExp(escapeRegExp(answer), "i"), "_____");

    return {
      id: createId("blank"),
      sentence: blanked === sentence ? `${sentence} _____` : blanked,
      answer,
      explanation: "Respuesta detectada desde una frase importante del PDF.",
    };
  });

  const quiz = usableSentences.slice(0, 8).map((sentence, index) => {
    const answer = extractTerm(sentence, keywords);

    return {
      id: createId("quiz"),
      question: `Cual alternativa resume mejor esta idea del PDF: "${sentence.slice(0, 130)}..."?`,
      options: uniqueOptions(answer, keywords, index),
      answerIndex: 0,
      explanation: sentence,
    };
  });

  return {
    title: titleFromSource(input.sourceName, keywords),
    sourceName: input.sourceName,
    summary: summary || "Resumen generado localmente desde el texto extraido del PDF.",
    difficulty: usableSentences.length > 10 ? "medium" : "easy",
    estimatedMinutes: Math.max(8, Math.min(45, Math.ceil(usableSentences.length * 2.5))),
    flashcards,
    fillBlanks,
    quiz,
  };
}

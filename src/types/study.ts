export type Difficulty = "easy" | "medium" | "hard";

export type StudyProvider =
  | "openai"
  | "openrouter"
  | "gemini"
  | "xai"
  | "local";

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  hint: string;
  tags: string[];
};

export type FillBlank = {
  id: string;
  sentence: string;
  answer: string;
  explanation: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type StudyDeck = {
  id?: string;
  title: string;
  sourceName: string;
  summary: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  flashcards: Flashcard[];
  fillBlanks: FillBlank[];
  quiz: QuizQuestion[];

  generatedWith?: {
    provider: StudyProvider;
    label: string;
    note: string;
  };

  isPublic?: boolean;
  createdAt?: string;
};

export type DeckRecord = {
  id: string;
  user_id: string | null;
  title: string;
  source_name: string;
  summary: string;
  difficulty: Difficulty;
  estimated_minutes: number;
  flashcards: Flashcard[];
  fill_blanks: FillBlank[];
  quiz: QuizQuestion[];
  is_public: boolean;
  created_at: string;
};
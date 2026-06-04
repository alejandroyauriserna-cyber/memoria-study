export type GuidedStudyTutorAction =
  | "explain_page"
  | "examples"
  | "peru_law"
  | "detect_concepts"
  | "exam_questions"
  | "verify_comprehension"
  | "simpler"
  | "first_cycle"
  | "another_example"
  | "real_case"
  | "jurisprudence"
  | "civil_code"
  | "custom";

export type LegalConceptType =
  | "definicion"
  | "principio"
  | "requisito"
  | "elemento"
  | "excepcion"
  | "clasificacion";

export type DetectedLegalConcept = {
  id: string;
  term: string;
  type: LegalConceptType;
  summary: string;
};

export type DocumentChapter = {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
  subtopics?: string[];
};

export type DocumentStudyIndex = {
  title: string;
  totalPages: number;
  summary: string;
  topics: string[];
  chapters: DocumentChapter[];
};

export type ExamQuestionSet = {
  oral: string[];
  desarrollo: string[];
  test: Array<{
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  }>;
};

export type LegalCitation = {
  norm: string;
  article: string;
  text: string;
  updatedAt: string;
};

export type TutorResponse = {
  answer: string;
  citations?: LegalCitation[];
  concepts?: DetectedLegalConcept[];
  questions?: ExamQuestionSet;
  comprehensionCheck?: string;
};

export type GuidedStudySession = {
  materialId: string;
  currentPage: number;
  understoodPages: number[];
  lastUpdated: string;
};

export type PdfPageContent = {
  pageNumber: number;
  text: string;
};

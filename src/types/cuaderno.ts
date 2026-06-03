export type CuadernoClassRecord = {
  id: string;
  user_id: string;
  course_id: string;
  course_name: string;
  cycle_number: number;
  cycle_label: string;
  class_number: number | null;
  title: string;
  topic: string | null;
  class_date: string | null;
  notes: string;
  extracted_concepts: string[];
  material_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CuadernoClass = {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  cycleNumber: number;
  cycleLabel: string;
  classNumber: number | null;
  title: string;
  topic: string | null;
  classDate: string | null;
  notes: string;
  extractedConcepts: string[];
  materialId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CuadernoTreeCycle = {
  cycleNumber: number;
  cycleLabel: string;
  courses: CuadernoTreeCourse[];
};

export type CuadernoTreeCourse = {
  courseId: string;
  courseName: string;
  classes: CuadernoClass[];
};

export type CuadernoDictionarySection = {
  id: string;
  title: string;
  content: string;
};

export type CuadernoDictionaryResponse = {
  term: string;
  sections: CuadernoDictionarySection[];
};

export type CuadernoAskAction =
  | "explain"
  | "summarize"
  | "examples"
  | "relate"
  | "exam_questions"
  | "flashcards"
  | "key_concepts";

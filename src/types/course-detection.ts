export type CourseDetectionResult = {
  courseId: string;
  courseName: string;
  cycleNumber: number;
  cycleLabel: string;
  yearNumber: number;
  yearLabel: string;
  confidence: number;
  matchedKeywords: string[];
  alternatives: Array<{
    courseId: string;
    courseName: string;
    cycleNumber: number;
    confidence: number;
  }>;
  conceptsDetected: string[];
  difficulty: "basico" | "intermedio" | "avanzado";
};

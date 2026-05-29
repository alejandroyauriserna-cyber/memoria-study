export type OrganizerType =
  | "resumen"
  | "flashcards"
  | "preguntas"
  | "mapa-conceptual"
  | "cuadro-sinoptico"
  | "cuadro-comparativo"
  | "jerarquico"
  | "flujo"
  | "linea-del-tiempo"
  | "explicacion";

export type Organizer = {
  id?: string;
  userId?: string | null;
  materialId?: string | null;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  cycleNumber: number;
  cycleLabel: string;
  organizerType: OrganizerType;
  content: Record<string, unknown>;
  createdAt?: string;
};

export type OrganizerRecord = {
  id: string;
  user_id: string | null;
  material_id: string | null;
  title: string;
  description: string;
  course_id: string;
  course_name: string;
  cycle_number: number;
  cycle_label: string;
  organizer_type: OrganizerType;
  content: string;
  created_at: string;
  updated_at: string;
};

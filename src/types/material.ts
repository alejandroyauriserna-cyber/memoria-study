export type MaterialType =
  | "apunte"
  | "resumen"
  | "pdf"
  | "caso"
  | "guia"
  | "otro";

export type Material = {
  id?: string;
  userId?: string | null;
  authorName: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  cycleNumber: number;
  cycleLabel: string;
  materialType: MaterialType;
  fileName: string;
  fileUrl: string;
  views: number;
  downloads: number;
  likes: number;
  isFavorite?: boolean;
  favoriteCreatedAt?: string;
  lastOpenedAt?: string;
  createdAt?: string;
};

export type MaterialRecord = {
  id: string;
  user_id: string | null;
  author_name: string;
  title: string;
  description: string;
  course_id: string;
  course_name: string;
  cycle_number: number;
  cycle_label: string;
  material_type: MaterialType;
  file_name: string;
  file_url: string;
  views: number;
  downloads: number;
  likes: number;
  created_at: string;
  updated_at: string;
};

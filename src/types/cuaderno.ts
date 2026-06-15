export type CuadernoSharePermission = "view" | "edit";

export type CuadernoCollaboratorRole = "viewer" | "editor";

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
  share_token: string | null;
  is_shared: boolean;
  share_permission: CuadernoSharePermission;
  is_group_notebook: boolean;
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
  shareToken: string | null;
  isShared: boolean;
  sharePermission: CuadernoSharePermission;
  isGroupNotebook: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CuadernoAccessRole = "owner" | "viewer" | "editor";

export type CuadernoClassAccess = {
  cuadernoClass: CuadernoClass;
  role: CuadernoAccessRole;
  canEdit: boolean;
  ownerName?: string | null;
};

export type CuadernoCollaboratorRecord = {
  class_id: string;
  user_id: string;
  role: CuadernoCollaboratorRole;
  invited_by: string | null;
  joined_at: string;
};

export type CuadernoCollaborator = {
  classId: string;
  userId: string;
  role: CuadernoCollaboratorRole;
  invitedBy: string | null;
  joinedAt: string;
  displayName?: string | null;
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

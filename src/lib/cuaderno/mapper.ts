import type { CuadernoClass, CuadernoClassRecord } from "@/types/cuaderno";

function parseConcepts(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))].slice(0, 24);
}

export function recordToCuadernoClass(record: CuadernoClassRecord): CuadernoClass {
  return {
    id: record.id,
    userId: record.user_id,
    courseId: record.course_id,
    courseName: record.course_name,
    cycleNumber: record.cycle_number,
    cycleLabel: record.cycle_label,
    classNumber: record.class_number,
    title: record.title,
    topic: record.topic,
    classDate: record.class_date,
    notes: record.notes ?? "",
    extractedConcepts: parseConcepts(record.extracted_concepts),
    materialId: record.material_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function cuadernoClassToInsert(
  input: Omit<CuadernoClass, "id" | "userId" | "createdAt" | "updatedAt"> & { userId: string },
) {
  return {
    user_id: input.userId,
    course_id: input.courseId,
    course_name: input.courseName,
    cycle_number: input.cycleNumber,
    cycle_label: input.cycleLabel,
    class_number: input.classNumber,
    title: input.title,
    topic: input.topic,
    class_date: input.classDate,
    notes: input.notes,
    extracted_concepts: input.extractedConcepts,
    material_id: input.materialId,
  };
}

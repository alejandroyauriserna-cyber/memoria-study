import { normalizeMaterialAcademicFields } from "@/lib/academic/helpers";
import type { Material, MaterialRecord } from "@/types/material";

export function recordToMaterial(record: MaterialRecord): Material {
  const academic = normalizeMaterialAcademicFields({
    courseId: record.course_id,
    courseName: record.course_name,
    cycleNumber: record.cycle_number,
    cycleLabel: record.cycle_label,
  });

  return {
    id: record.id,
    userId: record.user_id,
    authorName: record.author_name,
    title: record.title,
    description: record.description,
    courseId: academic.courseId,
    courseName: academic.courseName,
    cycleNumber: academic.cycleNumber,
    cycleLabel: academic.cycleLabel,
    materialType: record.material_type,
    fileName: record.file_name,
    fileUrl: record.file_url,
    views: record.views,
    downloads: record.downloads,
    likes: record.likes,
    createdAt: record.created_at,
  };
}

export function materialInsertPayload(material: Material, userId: string | null) {
  return {
    user_id: userId,
    author_name: material.authorName,
    title: material.title,
    description: material.description,
    course_id: material.courseId,
    course_name: material.courseName,
    cycle_number: material.cycleNumber,
    cycle_label: material.cycleLabel,
    material_type: material.materialType,
    file_name: material.fileName,
    file_url: material.fileUrl,
    views: material.views,
    downloads: material.downloads,
    likes: material.likes,
    is_public: true,
  };
}

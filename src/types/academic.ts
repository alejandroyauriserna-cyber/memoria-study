export type AcademicWeek = {
  number: number;
  title: string;
};

export type AcademicCourse = {
  id: string;
  name: string;
  weeks: AcademicWeek[];
};

export type AcademicCycle = {
  number: number;
  label: string;
  courses: AcademicCourse[];
};

export type AcademicYear = {
  number: number;
  label: string;
  cycles: AcademicCycle[];
};

export type AcademicSelection = {
  yearNumber: number;
  yearLabel: string;
  cycleNumber: number;
  cycleLabel: string;
  courseId: string;
  courseName: string;
  weekNumber: number;
  weekTitle: string;
};

export type UntDerechoCurriculum = {
  university: string;
  career: string;
  years: AcademicYear[];
};

export type JurisprudenceUploadTemplate = {
  id: string;
  title: string;
  subtitle: string;
  author?: string;
  placeholder: string;
  exampleUrl?: string;
};

/** Plantillas rápidas para subir PDF de jurisprudencia (sin contenido integrado vacío). */
export const JURISPRUDENCE_UPLOAD_TEMPLATES: JurisprudenceUploadTemplate[] = [
  {
    id: "casacion",
    title: "Casaciones — Corte Suprema",
    subtitle: "Compendio o extractos de casación civil y penal",
    author: "Corte Suprema de Justicia de la República",
    placeholder: "Ej. Compendio de casaciones civiles — 2024",
    exampleUrl: "https://lpderecho.pe/category/jurisprudencia/",
  },
  {
    id: "tc",
    title: "Sentencias — Tribunal Constitucional",
    subtitle: "Precedentes, líneas jurisprudenciales o sentencias clave",
    author: "Tribunal Constitucional",
    placeholder: "Ej. TC — línea jurisprudencial libertad de expresión",
    exampleUrl: "https://www.tc.gob.pe/jurisprudencia/",
  },
  {
    id: "tf",
    title: "Resoluciones — Tribunal Fiscal",
    subtitle: "Criterios y resoluciones en materia tributaria",
    author: "Tribunal Fiscal",
    placeholder: "Ej. Resoluciones TF — deducibilidad de gastos",
    exampleUrl: "https://www.sunat.gob.pe/legislacion/jurisprudencia/",
  },
];

export function getJurisprudenceTemplate(id: string): JurisprudenceUploadTemplate | undefined {
  return JURISPRUDENCE_UPLOAD_TEMPLATES.find((t) => t.id === id);
}

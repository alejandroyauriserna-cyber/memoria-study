export type ProgressStage = {
  label: string;
  percent: number;
  message: string;
};

export const PROGRESS_PRESETS = {
  generic: [
    { label: "Iniciando", percent: 10, message: "Preparando la operación..." },
    { label: "Procesando", percent: 45, message: "Trabajando en tu solicitud..." },
    { label: "Finalizando", percent: 88, message: "Casi listo..." },
  ],
  upload: [
    { label: "Validando archivo", percent: 12, message: "Revisando el PDF seleccionado..." },
    { label: "Subiendo", percent: 40, message: "Enviando el archivo al servidor..." },
    { label: "Registrando", percent: 72, message: "Guardando en tu biblioteca..." },
    { label: "Finalizando", percent: 92, message: "Completando la carga..." },
  ],
  pdfExtract: [
    { label: "Leyendo PDF", percent: 15, message: "Descargando y abriendo el documento..." },
    { label: "Extrayendo texto", percent: 45, message: "Analizando capas de texto del PDF..." },
    { label: "OCR", percent: 75, message: "Procesando páginas escaneadas si aplica..." },
    { label: "Finalizando", percent: 92, message: "Preparando el texto extraído..." },
  ],
  aiGenerate: [
    { label: "Analizando contenido", percent: 15, message: "La IA lee el material jurídico..." },
    { label: "Generando", percent: 50, message: "Estructurando la respuesta..." },
    { label: "Refinando", percent: 82, message: "Aplicando formato académico..." },
    { label: "Finalizando", percent: 94, message: "Guardando resultado..." },
  ],
  aiAnalyze: [
    { label: "Leyendo página", percent: 20, message: "Extrayendo el contenido de la página..." },
    { label: "Analizando", percent: 55, message: "El profesor IA prepara la explicación..." },
    { label: "Citando fuentes", percent: 82, message: "Vinculando normativa y material autorizado..." },
    { label: "Finalizando", percent: 94, message: "Completando la lección..." },
  ],
  guidedStudyInit: [
    { label: "Cargando PDF", percent: 18, message: "Descargando el material de estudio..." },
    { label: "Extrayendo páginas", percent: 48, message: "Preparando el documento página por página..." },
    { label: "Analizando estructura", percent: 78, message: "Construyendo el índice del documento..." },
    { label: "Finalizando", percent: 94, message: "Abriendo el estudio guiado..." },
  ],
  search: [
    { label: "Buscando", percent: 25, message: "Consultando la biblioteca académica..." },
    { label: "Filtrando", percent: 60, message: "Ordenando coincidencias relevantes..." },
    { label: "Finalizando", percent: 90, message: "Preparando resultados..." },
  ],
  save: [
    { label: "Guardando", percent: 30, message: "Sincronizando cambios..." },
    { label: "Finalizando", percent: 85, message: "Confirmando guardado..." },
  ],
  auth: [
    { label: "Verificando", percent: 35, message: "Validando credenciales..." },
    { label: "Conectando", percent: 75, message: "Iniciando sesión..." },
  ],
  profile: [
    { label: "Cargando perfil", percent: 30, message: "Obteniendo tu progreso de estudio..." },
    { label: "Finalizando", percent: 85, message: "Preparando estadísticas..." },
  ],
  organizerList: [
    { label: "Cargando organizadores", percent: 35, message: "Obteniendo tus materiales generados..." },
    { label: "Finalizando", percent: 88, message: "Preparando la vista..." },
  ],
  regenerate: [
    { label: "Regenerando", percent: 25, message: "Reprocesando el organizador con IA..." },
    { label: "Actualizando", percent: 65, message: "Aplicando nuevos contenidos..." },
    { label: "Finalizando", percent: 92, message: "Guardando cambios..." },
  ],
  infographic: [
    { label: "Analizando", percent: 20, message: "Leyendo el contenido del organizador..." },
    { label: "Generando infografía", percent: 55, message: "Gemini diseña la infografía académica..." },
    { label: "Renderizando", percent: 82, message: "Preparando imagen de alta calidad..." },
  ],
  visualAi: [
    { label: "Preparando", percent: 12, message: "Construyendo prompt académico especializado..." },
    { label: "Generando con FLUX", percent: 48, message: "FLUX renderiza tu lámina visual..." },
    { label: "Refinando", percent: 72, message: "Aplicando composición y detalle editorial..." },
    { label: "Finalizando", percent: 92, message: "Optimizando imagen para entrega universitaria..." },
  ],
  mindMap: [
    { label: "Analizando", percent: 25, message: "Identificando conceptos clave..." },
    { label: "Generando mapa", percent: 60, message: "Construyendo el mapa visual..." },
    { label: "Finalizando", percent: 90, message: "Aplicando diseño..." },
  ],
  dictionary: [
    { label: "Consultando", percent: 30, message: "Buscando definición jurídica..." },
    { label: "Generando", percent: 70, message: "La IA prepara la explicación..." },
  ],
  legalSources: [
    { label: "Subiendo PDF", percent: 20, message: "Enviando la fuente jurídica..." },
    { label: "Extrayendo texto", percent: 55, message: "Indexando el contenido del PDF..." },
    { label: "Registrando", percent: 85, message: "Guardando en tu biblioteca jurídica..." },
  ],
  sticker: [
    { label: "Generando sticker", percent: 35, message: "La IA crea el diseño..." },
    { label: "Finalizando", percent: 85, message: "Preparando imagen..." },
  ],
} as const satisfies Record<string, ProgressStage[]>;

export type ProgressPresetKey = keyof typeof PROGRESS_PRESETS;

export function getProgressPreset(key: ProgressPresetKey): ProgressStage[] {
  return PROGRESS_PRESETS[key];
}

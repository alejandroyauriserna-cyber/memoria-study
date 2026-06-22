import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  FileUp,
  GraduationCap,
  Heart,
  Home,
  KeyRound,
  Layers3,
  LibraryBig,
  Map,
  MessageCircle,
  Network,
  Scale,
  Sparkles,
  Trophy,
  UserCircle,
  Zap,
} from "lucide-react";

export type FeatureGuideItem = {
  id: string;
  title: string;
  icon: LucideIcon;
  summary: string;
  whenToUse: string;
  href: string;
  cta: string;
};

export type FeatureGuideSection = {
  id: string;
  title: string;
  lead: string;
  items: FeatureGuideItem[];
};

export const FEATURE_GUIDE_START_HERE = [
  "Sube un PDF o PPTX en **Subir material**.",
  "Ábrelo en **Materiales** y prueba **Estudio guiado** (tutor página por página).",
  "Si te pierdes, crea un **Organizador** (mapa o línea de tiempo) del mismo tema.",
] as const;

export const FEATURE_GUIDE_SECTIONS: FeatureGuideSection[] = [
  {
    id: "start",
    title: "Empieza aquí",
    lead: "Lo mínimo para tu primera sesión.",
    items: [
      {
        id: "home",
        title: "Inicio",
        icon: Home,
        summary: "Panel principal: retoma tu última sesión, racha, horas y accesos rápidos.",
        whenToUse: "Cada vez que entras a MemoriaStudy — es tu «centro de mando».",
        href: "/",
        cta: "Ir al inicio",
      },
      {
        id: "upload",
        title: "Subir material",
        icon: FileUp,
        summary: "Convierte PDFs o PPTX en mazos, preguntas y organizadores.",
        whenToUse: "Cuando tienes la clase, separata o PPT del curso y quieres estudiarlo con IA.",
        href: "/upload-material",
        cta: "Subir archivo",
      },
      {
        id: "library",
        title: "Materiales (Biblioteca)",
        icon: LibraryBig,
        summary: "Todos tus archivos por ciclo y curso, con progreso de lectura.",
        whenToUse: "Para retomar donde lo dejaste o abrir el estudio guiado de un PDF.",
        href: "/library",
        cta: "Ver materiales",
      },
      {
        id: "my-materials",
        title: "Mis materiales",
        icon: BookOpen,
        summary: "Lista de todo lo que tú subiste, con acceso rápido a mazos y organizadores.",
        whenToUse: "Cuando buscas un archivo que cargaste hace días sin entrar por ciclo/curso.",
        href: "/my-materials",
        cta: "Mis subidas",
      },
    ],
  },
  {
    id: "study",
    title: "Estudiar y repasar",
    lead: "Modos activos con tutor IA y juegos.",
    items: [
      {
        id: "guided",
        title: "Estudio guiado",
        icon: BookOpen,
        summary:
          "PDF página a página: explicaciones, preguntas, tutor jurídico y chat por diapositiva.",
        whenToUse: "Cuando quieres entender un capítulo difícil sin leer solo en silencio.",
        href: "/library",
        cta: "Desde Materiales",
      },
      {
        id: "exam-mode",
        title: "Modo examen",
        icon: GraduationCap,
        summary: "Simulacro oral/escrito sobre el material: preguntas tipo parcial y feedback.",
        whenToUse: "Unos días antes del examen para practicar respuestas bajo presión.",
        href: "/library",
        cta: "Desde estudio guiado",
      },
      {
        id: "decks",
        title: "Mazos y flashcards",
        icon: Sparkles,
        summary:
          "Tarjetas, quiz, definiciones, parejas y completar espacios — generados desde tu PDF.",
        whenToUse: "Para repasar antes del parcial o consolidar conceptos clave.",
        href: "/upload-material",
        cta: "Generar mazo",
      },
      {
        id: "micro",
        title: "Micro-estudio (5 min)",
        icon: Zap,
        summary: "Sesión corta cuando solo tienes unos minutos entre clases.",
        whenToUse: "En el bus, entre clases o cuando no puedes sentarte una hora completa.",
        href: "/micro-estudio",
        cta: "5 minutos",
      },
      {
        id: "assistant",
        title: "Asistente jurídico (Inicio)",
        icon: MessageCircle,
        summary: "Pregunta libre sobre Derecho desde la portada — respuesta con enfoque UNT.",
        whenToUse: "Duda puntual de concepto sin abrir un PDF (ej. «¿Qué es la cosa juzgada?»).",
        href: "/#asistente",
        cta: "Probar asistente",
      },
    ],
  },
  {
    id: "visual",
    title: "Organizar y visualizar",
    lead: "Convierte teoría densa en mapas y apuntes.",
    items: [
      {
        id: "organizers",
        title: "Organizadores IA",
        icon: Network,
        summary:
          "Crea resúmenes estructurados desde tu material: mapas conceptuales, líneas de tiempo, tablas comparativas y rutas de estudio.",
        whenToUse: "Cuando necesitas ordenar un tema antes de estudiarlo en profundidad.",
        href: "/organizers",
        cta: "Crear organizador",
      },
      {
        id: "visual-ia",
        title: "Visual IA (mapas, atlas, infografías)",
        icon: Sparkles,
        summary:
          "Dentro de un organizador: mapa mental, infografía 16:9, atlas visual, póster académico e imágenes FLUX.",
        whenToUse: "Para estudiar con imágenes o presentar un tema de forma visual al profesor.",
        href: "/organizers",
        cta: "Abrir organizadores",
      },
      {
        id: "cuaderno",
        title: "Cuaderno IA",
        icon: Layers3,
        summary:
          "Apuntes por curso/clase, diccionario jurídico, stickers, portadas y preguntas al material.",
        whenToUse: "Para tomar notas con contexto del PDF y repasar por curso.",
        href: "/cuaderno",
        cta: "Abrir cuaderno",
      },
    ],
  },
  {
    id: "legal",
    title: "Herramientas jurídicas",
    lead: "Fuentes y jurisprudencia para Derecho UNT.",
    items: [
      {
        id: "juris",
        title: "Jurisprudencia",
        icon: Scale,
        summary: "Busca casaciones, sentencias y resoluciones sin salir de la app.",
        whenToUse: "Cuando necesitas un precedente o redactar un caso práctico.",
        href: "/biblioteca-juridica",
        cta: "Buscar fallos",
      },
      {
        id: "fuentes",
        title: "Fuentes jurídicas",
        icon: Map,
        summary: "Sincroniza LP Derecho y bases para que el tutor cite fuentes verificables.",
        whenToUse: "Al iniciar un curso o cuando el profesor pide citar normativa peruana.",
        href: "/fuentes-juridicas",
        cta: "Configurar fuentes",
      },
    ],
  },
  {
    id: "account",
    title: "Tu espacio",
    lead: "Progreso, ranking y personalización.",
    items: [
      {
        id: "favorites",
        title: "Favoritos",
        icon: Heart,
        summary: "Material, organizadores o sentencias guardados para acceso rápido.",
        whenToUse: "Para marcar lo que vas a repasar antes del examen.",
        href: "/favorites",
        cta: "Ver favoritos",
      },
      {
        id: "profile",
        title: "Perfil y ranking",
        icon: Trophy,
        summary:
          "Horas activas de estudio, ligas, logros, reto beta (S/ 40) y preferencias de aprendizaje.",
        whenToUse: "Para ver tu progreso real y competir en el ranking del reto.",
        href: "/profile",
        cta: "Mi perfil",
      },
      {
        id: "connect-ai",
        title: "Conectar tu IA",
        icon: KeyRound,
        summary:
          "Opcional: enlaza tu Gemini o Hugging Face para usar tu cuota en vez de la del campus (+ horas bonus en el reto).",
        whenToUse: "Si tienes API key gratis y quieres generar sin límites compartidos.",
        href: "/profile#reto-julio",
        cta: "Desde perfil",
      },
      {
        id: "avatar",
        title: "Avatar IA",
        icon: UserCircle,
        summary: "Foto de perfil generada con IA (aparece en el ranking).",
        whenToUse: "Opcional: personaliza tu perfil con un avatar ilustrado.",
        href: "/profile",
        cta: "Desde perfil",
      },
    ],
  },
];

/** Sugerencias visibles en español → prompt FLUX en inglés (mejor adherencia). */
export const PROFILE_AVATAR_SUGGESTIONS = [
  {
    label: "Estudiante de derecho estilo anime con toga y libros",
    fluxPrompt:
      "Profile avatar, anime-style law student character, graduation cap and law books, friendly face, shoulders up, cyan rim light, dark background, centered, no text",
  },
  {
    label: "Mascota búho jurídico con gafas redondas",
    fluxPrompt:
      "Profile avatar, cute legal owl mascot, clearly an owl with feathers owl beak and round owl eyes, wearing round glasses, tiny law book, cartoon mascot illustration, wise friendly expression, teal accents, dark background, centered, no text, no human face",
  },
  {
    label: "Avatar cyberpunk cyan con laptop y café",
    fluxPrompt:
      "Profile avatar, cyberpunk student character with glowing cyan accents, laptop and coffee cup, neon rim light, dark background, centered portrait, no text",
  },
  {
    label: "Superhéroe del estudio con capa y balanza",
    fluxPrompt:
      "Profile avatar, study superhero mascot with cape and justice scale, cartoon illustration, heroic pose, cyan accents, dark background, centered, no text",
  },
  {
    label: "Retrato kawaii con estrella en la frente",
    fluxPrompt:
      "Profile avatar, kawaii cute character portrait with star on forehead, soft pastel colors, big expressive eyes, dark background, centered, no text",
  },
  {
    label: "Detective legal con lupa y código civil",
    fluxPrompt:
      "Profile avatar, legal detective character with magnifying glass and civil code book, cartoon illustration, teal accents, dark background, centered, no text",
  },
] as const;

export type ProfileAvatarSuggestion = (typeof PROFILE_AVATAR_SUGGESTIONS)[number];

export const PROFILE_AVATAR_SUGGESTION_LABELS = PROFILE_AVATAR_SUGGESTIONS.map((s) => s.label);

const SPANISH_SUBJECT_HINTS: Array<{ pattern: RegExp; english: string }> = [
  { pattern: /\b(búho|buho)\b/i, english: "owl" },
  { pattern: /\bpulpo\b/i, english: "octopus" },
  { pattern: /\bgato\b/i, english: "cat" },
  { pattern: /\bperro\b/i, english: "dog" },
  { pattern: /\bdrag[oó]n\b/i, english: "dragon" },
  { pattern: /\bpinguino\b/i, english: "penguin" },
  { pattern: /\b(zorro|fox)\b/i, english: "fox" },
  { pattern: /\b(tibur[oó]n|shark)\b/i, english: "shark" },
  { pattern: /\b(rana|sapo)\b/i, english: "frog" },
  { pattern: /\b(robot|androide)\b/i, english: "robot" },
  { pattern: /\b(alien|extraterrestre)\b/i, english: "alien" },
  { pattern: /\b(mascota)\b/i, english: "mascot character" },
];

const SPANISH_PHRASE_HINTS: Array<[RegExp, string]> = [
  [/\bgafas redondas\b/i, "round glasses"],
  [/\bgafas\b/i, "glasses"],
  [/\bgorro\b/i, "hat"],
  [/\bsombrero\b/i, "hat"],
  [/\bcorona\b/i, "crown"],
  [/\bjur[ií]dic[oa]\b/i, "legal law-themed"],
  [/\bestudiante\b/i, "student"],
  [/\bderecho\b/i, "law school"],
  [/\banime\b/i, "anime style"],
  [/\bcyberpunk\b/i, "cyberpunk"],
  [/\bpixel art\b/i, "pixel art"],
  [/\bkawaii\b/i, "kawaii cute"],
];

function normalizePromptKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function englishGlossFromSpanish(userPrompt: string): string {
  let gloss = userPrompt.trim();
  for (const [pattern, english] of SPANISH_PHRASE_HINTS) {
    gloss = gloss.replace(pattern, english);
  }
  return gloss.slice(0, 200);
}

function detectEnglishSubjects(userPrompt: string): string[] {
  const subjects = new Set<string>();
  for (const hint of SPANISH_SUBJECT_HINTS) {
    if (hint.pattern.test(userPrompt)) subjects.add(hint.english);
  }
  return [...subjects];
}

function findPresetPrompt(userPrompt: string): string | undefined {
  const key = normalizePromptKey(userPrompt);
  return PROFILE_AVATAR_SUGGESTIONS.find((s) => normalizePromptKey(s.label) === key)?.fluxPrompt;
}

/** Negative prompt cuando el usuario pide animal/mascota (evita humanos aleatorios). */
export function buildProfileAvatarNegativePrompt(userPrompt: string): string | undefined {
  const subjects = detectEnglishSubjects(userPrompt);
  const asksAnimal = subjects.some((s) =>
    ["owl", "octopus", "cat", "dog", "dragon", "penguin", "fox", "shark", "frog"].includes(s),
  );
  const asksMascot = /\bmascota\b/i.test(userPrompt);

  if (asksAnimal || asksMascot) {
    return "human face, human, person, wrong animal, wrong species, realistic photo, blurry, text, watermark, collage";
  }

  return "blurry, deformed, text, watermark, collage, extra limbs";
}

export function resolveProfileAvatarFluxPrompt(userPrompt: string): string {
  const preset = findPresetPrompt(userPrompt);
  if (preset) return preset;

  const cleaned = userPrompt.replace(/[<>&"']/g, "").trim().slice(0, 200);
  if (!cleaned) {
    return "Stylized profile picture icon, abstract cyan teal glow, dark background, centered, square crop, high quality illustration, no text, no watermark";
  }

  const english = englishGlossFromSpanish(cleaned);
  const subjects = detectEnglishSubjects(cleaned);
  const mustShow =
    subjects.length > 0
      ? `Must clearly depict ${subjects.join(" and ")} with recognizable features. `
      : "Follow the subject literally and accurately. ";

  return `Profile picture avatar, exact literal illustration: ${english}. ${mustShow}Cartoon stylized art, centered composition, simple dark background, vivid colors, high detail, single focal subject, no text, no watermark, no collage`;
}

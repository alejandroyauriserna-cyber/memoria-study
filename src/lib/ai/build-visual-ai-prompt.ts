import { extractInfographicTopics } from "@/lib/ai/build-academic-infographic-prompt";
import { getVisualAiFormat } from "@/lib/organizers/visual-ai-formats";
import type { VisualAiFormatId } from "@/lib/organizers/visual-ai-types";
import type { OrganizerContent } from "@/lib/organizers/parse-content";

/** Appended to every FLUX prompt — educational artifact mandate. */
const EDUCATIONAL_ARTIFACT_MANDATE = `
IMPORTANT:

The image must be an educational artifact.

The image should resemble:
- university study material
- educational poster
- academic textbook illustration
- learning resource

Do not create artistic scenes.
Do not create decorative illustrations.
Do not create conceptual artwork.
Do not create cinematic compositions.

The information architecture is more important than aesthetics.
`.trim();

const INFOGRAPHIC_LAYOUT_BLOCK = `
Layout requirements:
- title area
- section cards
- icons
- callouts
- statistics blocks
- educational labels
- information panels

The final image should resemble a premium educational infographic rather than an illustration.
`.trim();

const CONCEPT_MAP_AGGRESSIVE = `
The output must be a structured concept map.

Requirements:
- rectangular concept boxes
- visible connectors
- arrows
- hierarchy
- parent concepts
- child concepts
- relationship labels

The result must look like a concept map created in Lucidchart, Miro, Whimsical, or XMind — not an artistic illustration.
`.trim();

const MIND_MAP_AGGRESSIVE = `
The result must resemble XMind, MindMeister, or Milanote with:
- central topic
- radial branches
- secondary branches
- grouped concepts
- educational structure

Not a painting. Not an illustration. A diagram tool export.
`.trim();

/** Appended to every format — blocks stock legal photography. */
const GLOBAL_NEGATIVE_PROMPT = `
NEGATIVE PROMPT — DO NOT GENERATE:
judge, courtroom, gavel, lawyer portrait, wooden desk, stock photo, realistic legal office,
legal photo, photography, realistic courtroom, businessman, people posing, corporate stock image,
courtroom scene, judge robe, mallet, law firm interior, generic law imagery, photorealistic people,
3D render of a courtroom, cinematic legal drama, news photo, Getty Images style, Shutterstock style.
`.trim();

function contextBlock(content: OrganizerContent, centralTopic: string, subtopics: string[]) {
  const summarySnippet = content.summary?.slice(0, 600) ?? "";
  const subtopicList = subtopics.map((s) => `- ${s}`).join("\n");
  const timelineSnippet =
    content.timeline?.events
      ?.filter((e) => e.label)
      .map((e) => `- ${e.date ? `${e.date}: ` : ""}${e.label}`)
      .join("\n") ?? "";

  const comparisonSnippet =
    content.visualSummary?.comparisons
      ?.map((c) => `• ${c.title}: ${c.left} ↔ ${c.right}`)
      .join("\n") ?? "";

  return `Central topic: ${centralTopic}

Key subtopics / concepts (must appear as labeled sections or nodes):
${subtopicList}

Source material summary (Peruvian Law, university level):
${summarySnippet}
${timelineSnippet ? `\nChronological milestones:\n${timelineSnippet}` : ""}
${comparisonSnippet ? `\nComparisons from source:\n${comparisonSnippet}` : ""}`;
}

function comparisonPairs(subtopics: string[]) {
  const pairs: string[] = [];
  for (let i = 0; i < subtopics.length - 1; i += 2) {
    pairs.push(`${subtopics[i]} vs ${subtopics[i + 1]}`);
  }
  if (!pairs.length && subtopics.length >= 2) {
    pairs.push(`${subtopics[0]} vs ${subtopics[1]}`);
  }
  return pairs;
}

function withFluxPrompt(body: string) {
  return `${body.trim()}\n\n${EDUCATIONAL_ARTIFACT_MANDATE}\n\n${GLOBAL_NEGATIVE_PROMPT}`;
}

const FORMAT_PROMPTS: Record<VisualAiFormatId, (ctx: string, centralTopic: string, subtopics: string[]) => string> = {
  infographic: (ctx, centralTopic) =>
    withFluxPrompt(`Create a highly detailed educational legal infographic.

Topic: ${centralTopic}

${ctx}

This is NOT a stock photo.
This is NOT a courtroom scene.
This is NOT a judge or gavel photo.
This is NOT a wooden desk or law office photograph.

Create a professional academic infographic designed for university law students.

Artifact type: educational legal infographic — diagrammatic learning poster, NOT photography.

Requirements:
- visual hierarchy with clear reading order
- academic structure with labeled sections
- educational layout with information blocks
- concept relationships shown with arrows, connectors, or grouping
- icons and diagrams (vector-style), NOT realistic objects
- legal learning design with doctrinal categories
- clean information architecture
- modern educational poster composition
- premium academic design with readable typography areas
- each subtopic as its own labeled block or diagram zone

${INFOGRAPHIC_LAYOUT_BLOCK}

Style:
Harvard Law School educational material,
National Geographic infographic quality,
modern university learning resource,
clean vector illustration,
high readability,
professional typography areas,
academic visual communication,
editorial infographic — teach, do not decorate.

Aspect ratio: 16:9
All visible text labels in Spanish.`),

  mindMap: (ctx, centralTopic) =>
    withFluxPrompt(`Create a visual academic mind map diagram.

Central topic: ${centralTopic}

${ctx}

This is NOT a photograph.
This is NOT a courtroom image.
This is NOT a realistic scene.
This is NOT stock photo style.

Artifact type: academic mind map — cognitive knowledge diagram.

${MIND_MAP_AGGRESSIVE}

Requirements:
- large central node with the main topic
- multiple primary branches radiating from center
- sub-branches for related concepts
- concept grouping with color-coded branches
- educational diagram structure
- learning-oriented knowledge network
- labeled nodes at every branch tip
- connectors showing conceptual links
- high readability, vector diagram aesthetic

Style:
premium academic mind map,
modern educational visualization,
clean vector design,
knowledge network diagram,
university study resource,
professional mind-mapping layout.

Aspect ratio: 1:1
All visible text labels in Spanish.
The image must look like a university study resource — diagram only.`),

  conceptMap: (ctx, centralTopic) =>
    withFluxPrompt(`Create a conceptual map diagram for legal education.

Topic: ${centralTopic}

${ctx}

This is NOT a photograph.
This is NOT a courtroom scene.
This is NOT a judge or gavel.
This is NOT a realistic legal office.

Artifact type: educational concept map — hierarchical knowledge diagram.

${CONCEPT_MAP_AGGRESSIVE}

Show explicitly:
- hierarchy from general to specific
- parent concepts at upper levels
- child concepts at lower levels
- relationships between nodes
- labeled connectors (cause, consequence, exception, integration)
- academic organization of doctrinal concepts
- nodes as boxes or circles with text labels
- directional arrows between related concepts

Style:
professional educational diagram,
legal education concept map,
vector infographic,
high clarity knowledge architecture,
postgraduate-level doctrinal visualization,
clean nodes-and-connectors layout.

Aspect ratio: 1:1
All visible text labels in Spanish.
The final result must resemble an educational concept map — NOT photography.`),

  timeline: (ctx, centralTopic) =>
    withFluxPrompt(`Create a horizontal academic timeline infographic.

Topic: ${centralTopic}

${ctx}

This is NOT a photograph.
This is NOT a courtroom scene.
This is NOT stock imagery.

Artifact type: chronological timeline infographic — educational diagram layout.

Requirements:
- horizontal timeline axis spanning the full width
- dated milestones along the axis
- chronology from earliest to latest (left to right)
- infographic layout with event blocks above/below the axis
- contextual annotations per milestone
- icons as small vector symbols per era (NOT realistic photos)
- clear date labels and event titles
- academic visual hierarchy
- editorial atlas-style chronology

Style:
National Geographic timeline infographic,
university legal history diagram,
clean vector chronology,
premium educational layout,
high readability timeline poster.

Aspect ratio: 16:9
All visible text labels in Spanish.`),

  comparisonTable: (ctx, centralTopic, subtopics) => {
    const pairs = comparisonPairs(subtopics);
    const pairBlock =
      pairs.length > 0
        ? pairs.map((p) => `- ${p}`).join("\n")
        : "- Nulidad vs Anulabilidad\n- Posesión vs Propiedad\n- Acto jurídico vs Negocio jurídico";

    return withFluxPrompt(`Create an academic comparison infographic chart.

Topic: ${centralTopic}

${ctx}

Concept pairs to compare (left column vs right column):
${pairBlock}

This is NOT a photograph.
This is NOT a courtroom scene.
This is NOT stock imagery.

Artifact type: academic comparison chart — split-column educational diagram.

Structure:
- left column and right column clearly separated
- split comparison layout with vertical divider
- educational categories as row headers
- advantages, differences, key characteristics per row
- high visual hierarchy between compared concepts
- university-level educational material
- criteria rows: definition, nature, legal effects, examples, legal basis

Style:
professional comparison infographic,
clean two-column layout,
modern educational design,
visual comparison board,
vector diagram — NOT photography.

Aspect ratio: 16:9
All visible text labels in Spanish.`);
  },

  legalAtlas: (ctx, centralTopic) =>
    withFluxPrompt(`Create an editorial legal atlas page illustration.

Topic: ${centralTopic}

${ctx}

This is NOT a courtroom photo.
This is NOT a judge or gavel image.
This is NOT a wooden desk scene.
This is NOT generic law stock photography.

Artifact type: premium legal encyclopedia atlas page — editorial educational illustration.

Style inspiration:
National Geographic atlas page,
Harvard Law Review editorial illustration,
Oxford University Press legal encyclopedia,
premium encyclopedia visual storytelling.

Requirements:
- sophisticated legal diagrams as the main visual language
- legal concepts visualized through symbolic diagrams (NOT photos)
- educational annotations and callout labels
- layered information with depth and hierarchy
- editorial composition with multiple visual zones
- academic storytelling through diagram sequences
- legal symbols and conceptual illustrations only
- educational visual narratives connecting doctrines
- encyclopedia-page layout with rich informational density

Use:
- legal symbols (scales, articles, norms) as vector icons
- conceptual illustrations and diagrammatic narratives
- annotated educational zones

Do NOT create:
- courtroom photos, judges, gavels, wooden desks, generic law stock images.

Aspect ratio: 16:9
All visible text labels in Spanish.
The result must feel like a page from a premium legal encyclopedia — diagrammatic, NOT photographic.`),

  academicPoster: (ctx, centralTopic) =>
    withFluxPrompt(`Create a scientific academic conference poster.

Topic: ${centralTopic}

${ctx}

This is NOT a photograph.
This is NOT a courtroom scene.
This is NOT stock imagery.

Artifact type: academic conference poster — structured educational visual.

Requirements:
- large title header area
- multi-column synthesis layout
- definition blocks with labeled sections
- key concepts as structured text zones
- normative references area (articles, codes)
- visual diagram supporting the main argument
- formal academic poster grid structure
- legible from a distance — clear typography hierarchy
- educational visual structure, NOT decorative imagery

Style:
scientific poster conference layout,
academic symposium presentation board,
university research poster design,
professional educational poster,
vector infographic elements,
clean formal composition.

Aspect ratio: 4:3
All visible text labels in Spanish.`),

  presentation: (ctx, centralTopic) =>
    withFluxPrompt(`Create a master presentation slide for university oral defense.

Topic: ${centralTopic}

${ctx}

This is NOT a photograph.
This is NOT a courtroom scene.
This is NOT stock imagery.

Artifact type: educational presentation slide — single-slide academic visual.

Requirements:
- clear title area with topic name
- 3–5 visual bullet zones with icons
- supporting diagram or concept map fragment
- large readable typography
- professional dark academic slide design
- structured educational layout for projection
- one cohesive slide ready to present

Style:
premium university presentation slide,
modern academic PowerPoint-quality design (but as a single image),
clean vector infographic slide,
high contrast readable layout,
educational communication design.

Aspect ratio: 16:9
All visible text labels in Spanish.`),
};

export function buildVisualAiPrompt(formatId: VisualAiFormatId, content: OrganizerContent): {
  centralTopic: string;
  subtopics: string[];
  prompt: string;
  aspectRatio: ReturnType<typeof getVisualAiFormat>["aspectRatio"];
} {
  const { centralTopic, subtopics } = extractInfographicTopics(content);
  const format = getVisualAiFormat(formatId);
  const ctx = contextBlock(content, centralTopic, subtopics);
  const prompt = FORMAT_PROMPTS[formatId](ctx, centralTopic, subtopics);

  return {
    centralTopic,
    subtopics,
    prompt,
    aspectRatio: format.aspectRatio,
  };
}

/** Par concepto ↔ definición derivado del organizador. */
export type OrganizerMatchingPair = {
  id: string;
  concept: string;
  definition: string;
  hint?: string;
  source?: "concept_card" | "flashcard" | "review" | "flow";
};

export type MatchingTileKind = "concept" | "definition";

/** Ficha visible en el tablero (cara arriba o abajo). */
export type OrganizerMatchingTile = {
  id: string;
  pairId: string;
  label: string;
  kind: MatchingTileKind;
};

export type OrganizerMatchingPhase = "idle" | "playing" | "resolving" | "won";

export type OrganizerMatchingStats = {
  moves: number;
  matchedCount: number;
  totalPairs: number;
  accuracy: number;
};

export type OrganizerMatchingGameState = {
  tiles: OrganizerMatchingTile[];
  openTileIds: string[];
  matchedPairIds: string[];
  moves: number;
  phase: OrganizerMatchingPhase;
  stats: OrganizerMatchingStats;
};

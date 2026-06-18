import type {
  OrganizerMatchingGameState,
  OrganizerMatchingPair,
  OrganizerMatchingPhase,
  OrganizerMatchingStats,
  OrganizerMatchingTile,
} from "@/types/organizer-matching-pairs";

export const MATCH_RESOLVE_MS = 700;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function buildMatchingTiles(
  pairs: OrganizerMatchingPair[],
  maxPairs = 8,
): OrganizerMatchingTile[] {
  const slice = pairs.slice(0, maxPairs);
  const tiles: OrganizerMatchingTile[] = [];

  for (const pair of slice) {
    tiles.push({
      id: `${pair.id}-concept`,
      pairId: pair.id,
      label: pair.concept,
      kind: "concept",
    });
    tiles.push({
      id: `${pair.id}-definition`,
      pairId: pair.id,
      label: pair.definition,
      kind: "definition",
    });
  }

  return shuffle(tiles);
}

function computeStats(
  matchedPairIds: string[],
  totalPairs: number,
  moves: number,
): OrganizerMatchingStats {
  const matchedCount = matchedPairIds.length;
  const accuracy = moves > 0 ? Math.round((matchedCount / moves) * 100) : 0;
  return { moves, matchedCount, totalPairs, accuracy };
}

function phaseFor(
  matchedPairIds: string[],
  totalPairs: number,
  openCount: number,
): OrganizerMatchingPhase {
  if (matchedPairIds.length >= totalPairs && totalPairs > 0) return "won";
  if (openCount >= 2) return "resolving";
  return "playing";
}

export function createMatchingGameState(
  pairs: OrganizerMatchingPair[],
  maxPairs = 8,
): OrganizerMatchingGameState {
  const tiles = buildMatchingTiles(pairs, maxPairs);
  const totalPairs = tiles.length / 2;

  return {
    tiles,
    openTileIds: [],
    matchedPairIds: [],
    moves: 0,
    phase: totalPairs > 0 ? "playing" : "idle",
    stats: computeStats([], totalPairs, 0),
  };
}

export function canPickTile(state: OrganizerMatchingGameState, tileId: string): boolean {
  if (state.phase === "won" || state.phase === "resolving" || state.phase === "idle") {
    return false;
  }
  if (state.openTileIds.length >= 2) return false;
  if (state.openTileIds.includes(tileId)) return false;

  const tile = state.tiles.find((t) => t.id === tileId);
  if (!tile) return false;
  if (state.matchedPairIds.includes(tile.pairId)) return false;

  return true;
}

export function pickMatchingTile(
  state: OrganizerMatchingGameState,
  tileId: string,
): OrganizerMatchingGameState {
  if (!canPickTile(state, tileId)) return state;

  const openTileIds = [...state.openTileIds, tileId];
  const totalPairs = state.tiles.length / 2;

  if (openTileIds.length < 2) {
    return {
      ...state,
      openTileIds,
      phase: phaseFor(state.matchedPairIds, totalPairs, openTileIds.length),
      stats: computeStats(state.matchedPairIds, totalPairs, state.moves),
    };
  }

  const [firstId, secondId] = openTileIds;
  const first = state.tiles.find((t) => t.id === firstId);
  const second = state.tiles.find((t) => t.id === secondId);
  const isMatch =
    Boolean(first && second) &&
    first!.pairId === second!.pairId &&
    first!.kind !== second!.kind;

  const moves = state.moves + 1;
  const matchedPairIds = isMatch
    ? [...state.matchedPairIds, first!.pairId]
    : state.matchedPairIds;

  return {
    ...state,
    openTileIds,
    matchedPairIds,
    moves,
    phase: "resolving",
    stats: computeStats(matchedPairIds, totalPairs, moves),
  };
}

export function resolveMatchingTurn(state: OrganizerMatchingGameState): OrganizerMatchingGameState {
  const totalPairs = state.tiles.length / 2;
  const phase = phaseFor(state.matchedPairIds, totalPairs, 0);

  return {
    ...state,
    openTileIds: [],
    phase,
    stats: computeStats(state.matchedPairIds, totalPairs, state.moves),
  };
}

export function isTileFaceUp(state: OrganizerMatchingGameState, tileId: string): boolean {
  return state.openTileIds.includes(tileId) || isTileMatched(state, tileId);
}

export function isTileMatched(state: OrganizerMatchingGameState, tileId: string): boolean {
  const tile = state.tiles.find((t) => t.id === tileId);
  if (!tile) return false;
  return state.matchedPairIds.includes(tile.pairId);
}

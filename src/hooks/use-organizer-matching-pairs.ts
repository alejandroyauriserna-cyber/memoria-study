"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createMatchingGameState,
  MATCH_RESOLVE_MS,
  pickMatchingTile,
  resolveMatchingTurn,
} from "@/lib/organizers/matching-pairs-engine";
import type {
  OrganizerMatchingGameState,
  OrganizerMatchingPair,
} from "@/types/organizer-matching-pairs";

export function useOrganizerMatchingPairs(
  pairs: OrganizerMatchingPair[],
  options?: { maxPairsPerRound?: number; deckKey?: string },
) {
  const maxPairs = options?.maxPairsPerRound ?? 8;
  const [game, setGame] = useState<OrganizerMatchingGameState>(() =>
    createMatchingGameState(pairs, maxPairs),
  );
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const restart = useCallback(() => {
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
    setGame(createMatchingGameState(pairs, maxPairs));
  }, [pairs, maxPairs]);

  useEffect(() => {
    restart();
  }, [restart, options?.deckKey]);

  useEffect(() => {
    return () => {
      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    };
  }, []);

  const pickTile = useCallback((tileId: string) => {
    setGame((current) => {
      const next = pickMatchingTile(current, tileId);
      if (next.phase !== "resolving" || next === current) return next;

      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = setTimeout(() => {
        setGame((live) => resolveMatchingTurn(live));
        resolveTimerRef.current = null;
      }, MATCH_RESOLVE_MS);

      return next;
    });
  }, []);

  return {
    game,
    pairsAvailable: pairs.length,
    pickTile,
    restart,
    isEmpty: pairs.length < 2,
    minPairsMet: pairs.length >= 4,
  };
}

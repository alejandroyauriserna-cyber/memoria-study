"use client";

import { useMemo, useState } from "react";
import type { MatchingPair } from "@/types/study";
import { Button } from "@/components/ui/button";

type Tile = {
  id: string;
  pairId: string;
  label: string;
  side: "left" | "right";
};

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function buildTiles(pairs: MatchingPair[]) {
  const tiles: Tile[] = [];

  for (const pair of pairs) {
    tiles.push({
      id: `${pair.id}-left`,
      pairId: pair.id,
      label: pair.left,
      side: "left",
    });
    tiles.push({
      id: `${pair.id}-right`,
      pairId: pair.id,
      label: pair.right,
      side: "right",
    });
  }

  return shuffle(tiles);
}

export function MatchingPairsGame({ pairs }: { pairs: MatchingPair[] }) {
  const [tiles, setTiles] = useState<Tile[]>(() => buildTiles(pairs.slice(0, 8)));
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);

  const finished = matchedIds.length === tiles.length && tiles.length > 0;

  const visiblePairs = useMemo(() => pairs.slice(0, 8), [pairs]);

  function restart() {
    setTiles(buildTiles(visiblePairs));
    setOpenIds([]);
    setMatchedIds([]);
    setMoves(0);
  }

  function handlePick(tileId: string) {
    if (finished || openIds.length >= 2 || openIds.includes(tileId)) {
      return;
    }

    if (matchedIds.includes(tileId)) {
      return;
    }

    const nextOpen = [...openIds, tileId];
    setOpenIds(nextOpen);

    if (nextOpen.length < 2) {
      return;
    }

    setMoves((value) => value + 1);

    const [firstId, secondId] = nextOpen;
    const first = tiles.find((tile) => tile.id === firstId);
    const second = tiles.find((tile) => tile.id === secondId);

    const isMatch =
      first &&
      second &&
      first.pairId === second.pairId &&
      first.side !== second.side;

    setTimeout(() => {
      if (isMatch) {
        setMatchedIds((current) => [...current, firstId, secondId]);
      }
      setOpenIds([]);
    }, 700);
  }

  if (visiblePairs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay pares disponibles para el juego de memoria.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Encuentra pares concepto ↔ definición
        </p>
        <p className="text-sm font-semibold">Movimientos: {moves}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile) => {
          const isOpen = openIds.includes(tile.id) || matchedIds.includes(tile.id);

          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => handlePick(tile.id)}
              className={`min-h-24 rounded-lg border p-3 text-left text-sm transition ${
                matchedIds.includes(tile.id)
                  ? "border-accent bg-accent/15"
                  : isOpen
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-muted hover:border-accent"
              }`}
            >
              {isOpen ? (
                <>
                  <p className="text-[10px] font-semibold uppercase opacity-80">
                    {tile.side === "left" ? "Concepto" : "Definición"}
                  </p>
                  <p className="mt-1 font-medium leading-snug">{tile.label}</p>
                </>
              ) : (
                <span className="grid h-full place-items-center text-lg font-semibold">
                  ?
                </span>
              )}
            </button>
          );
        })}
      </div>

      {finished ? (
        <div className="rounded-lg border border-border bg-muted p-4 text-center">
          <p className="font-semibold">¡Completaste todos los pares!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Lo lograste en {moves} movimientos.
          </p>
          <Button className="mt-3" variant="secondary" onClick={restart}>
            Jugar de nuevo
          </Button>
        </div>
      ) : (
        <Button variant="secondary" onClick={restart}>
          Reiniciar juego
        </Button>
      )}
    </div>
  );
}

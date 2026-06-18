"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, BookOpen, RotateCcw, Sparkles } from "lucide-react";
import {
  isTileFaceUp,
  isTileMatched,
} from "@/lib/organizers/matching-pairs-engine";
import { useOrganizerMatchingPairs } from "@/hooks/use-organizer-matching-pairs";
import type { OrganizerMatchingPair } from "@/types/organizer-matching-pairs";
import "./organizer-match-premium.css";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function playMatchChime() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.045, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.24);
    void ctx.close();
  } catch {
    // autoplay policy or unsupported
  }
}

function vibrateLight() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(36);
  }
}

export function OrganizerMatchingPairsGame({
  pairs,
  deckKey = "default",
  maxPairsPerRound = 8,
  embedded = false,
  onBackToStudy,
  onContinue,
}: {
  pairs: OrganizerMatchingPair[];
  deckKey?: string;
  maxPairsPerRound?: number;
  embedded?: boolean;
  onBackToStudy?: () => void;
  onContinue?: () => void;
}) {
  const { game, pickTile, restart, isEmpty } = useOrganizerMatchingPairs(pairs, {
    maxPairsPerRound,
    deckKey,
  });

  const [elapsedSec, setElapsedSec] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [boardShaking, setBoardShaking] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const phaseSnapshot = useRef({
    phase: game.phase,
    matchedCount: game.stats.matchedCount,
  });

  const won = game.phase === "won";
  const totalPairs = game.stats.totalPairs;
  const matchedCount = game.stats.matchedCount;
  const progressPct = totalPairs > 0 ? Math.round((matchedCount / totalPairs) * 100) : 0;

  useEffect(() => {
    if (!timerRunning || won) return;
    const id = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, won]);

  useEffect(() => {
    const prev = phaseSnapshot.current;
    if (prev.phase === "resolving" && game.phase === "playing") {
      if (game.stats.matchedCount > prev.matchedCount) {
        setBurstKey((k) => k + 1);
        playMatchChime();
      } else {
        setBoardShaking(true);
        vibrateLight();
        window.setTimeout(() => setBoardShaking(false), 480);
      }
    }
    phaseSnapshot.current = { phase: game.phase, matchedCount: game.stats.matchedCount };
  }, [game.phase, game.stats.matchedCount]);

  const handlePick = useCallback(
    (tileId: string) => {
      if (!timerRunning && game.phase === "playing") setTimerRunning(true);
      pickTile(tileId);
    },
    [pickTile, timerRunning, game.phase],
  );

  const handleRestart = useCallback(() => {
    setElapsedSec(0);
    setTimerRunning(false);
    setBoardShaking(false);
    restart();
  }, [restart]);

  if (isEmpty) {
    return (
      <div className="org-match-game org-match-game--empty" data-embedded={embedded || undefined}>
        <div className="org-match-game__empty-card">
          <Brain size={28} strokeWidth={1.75} aria-hidden />
          <p className="org-match-game__empty">
            Aún no hay suficientes pares para jugar. Genera más conceptos en el organizador o abre el
            resumen visual.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`org-match-game${won ? " org-match-game--won" : ""}`}
      data-phase={game.phase}
      data-embedded={embedded || undefined}
      aria-label="Juego de memoria concepto y definición"
    >
      <div className="org-match-game__ambient" aria-hidden />

      <header className="org-match-game__header">
        <div className="org-match-game__brand">
          <span className="org-match-game__brand-icon" aria-hidden>
            🧠
          </span>
          <div>
            <p className="org-match-game__title">Juego de Memoria</p>
            <p className="org-match-game__subtitle">Une concepto con definición</p>
          </div>
        </div>

        <div className="org-match-game__pills">
          <div className="org-match-game__pill">
            <span className="org-match-game__pill-label">Movimientos</span>
            <span className="org-match-game__pill-value">{game.stats.moves}</span>
          </div>
          <div className="org-match-game__pill">
            <span className="org-match-game__pill-label">Tiempo</span>
            <span className="org-match-game__pill-value">{formatElapsed(elapsedSec)}</span>
          </div>
          <div className="org-match-game__pill org-match-game__pill--accent">
            <span className="org-match-game__pill-label">Pares</span>
            <span className="org-match-game__pill-value">
              {matchedCount}/{totalPairs}
            </span>
          </div>
        </div>
      </header>

      <div className="org-match-game__progress-wrap">
        <div
          className="org-match-game__progress-track"
          role="progressbar"
          aria-valuenow={matchedCount}
          aria-valuemin={0}
          aria-valuemax={totalPairs}
        >
          <motion.div
            className="org-match-game__progress-fill"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
          />
        </div>
        <p className="org-match-game__progress-label">
          <span className="org-match-game__progress-blocks" aria-hidden>
            {"█".repeat(Math.ceil(progressPct / 10))}
            {"░".repeat(10 - Math.ceil(progressPct / 10))}
          </span>
          {matchedCount} de {totalPairs} pares
        </p>
      </div>

      <div
        className={`org-match-game__board${boardShaking ? " is-shaking" : ""}`}
        role="grid"
        key={burstKey}
      >
        {burstKey > 0 ? (
          <div className="org-match-game__particles" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={`${burstKey}-${i}`}
                className="org-match-game__particle"
                style={
                  {
                    "--particle-i": i,
                    "--particle-x": `${(i % 4) * 24 - 36}%`,
                    "--particle-y": `${Math.floor(i / 4) * -30 - 10}%`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        ) : null}

        {game.tiles.map((tile) => {
          const faceUp = isTileFaceUp(game, tile.id);
          const matched = isTileMatched(game, tile.id);
          const selected = game.openTileIds.includes(tile.id);

          return (
            <button
              key={tile.id}
              type="button"
              role="gridcell"
              className={[
                "org-match-game__tile",
                faceUp ? "is-face-up" : "is-face-down",
                matched ? "is-matched" : "",
                selected ? "is-selected" : "",
                `is-${tile.kind}`,
              ]
                .filter(Boolean)
                .join(" ")}
              data-kind={tile.kind}
              data-pair-id={tile.pairId}
              disabled={won || matched || game.phase === "resolving"}
              aria-pressed={faceUp}
              aria-label={
                faceUp
                  ? `${tile.kind === "concept" ? "Concepto" : "Definición"}: ${tile.label}`
                  : "Ficha oculta"
              }
              onClick={() => handlePick(tile.id)}
            >
              <span className="org-match-game__tile-inner">
                <span className="org-match-game__tile-face org-match-game__tile-face--front">
                  <span className="org-match-game__tile-glow" aria-hidden />
                  <Brain className="org-match-game__tile-brain" size={28} strokeWidth={1.6} aria-hidden />
                  <span className="org-match-game__tile-back-hint">Toca para voltear</span>
                </span>
                <span className="org-match-game__tile-face org-match-game__tile-face--back">
                  <span className="org-match-game__tile-kind">
                    {tile.kind === "concept" ? "Concepto" : "Definición"}
                  </span>
                  <span className="org-match-game__tile-label">{tile.label}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {!won ? (
        <p className="org-match-game__hint" role="status">
          {game.phase === "resolving"
            ? "Comprobando…"
            : "Elige dos fichas: un concepto y su definición."}
        </p>
      ) : null}

      <AnimatePresence>
        {won ? (
          <motion.div
            className="org-match-game__victory"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
            role="dialog"
            aria-labelledby="org-match-victory-title"
          >
            <div className="org-match-game__victory-glow" aria-hidden />
            <p className="org-match-game__victory-emoji" aria-hidden>
              🎉
            </p>
            <h3 id="org-match-victory-title" className="org-match-game__victory-title">
              Excelente trabajo
            </h3>
            <p className="org-match-game__victory-score">
              {matchedCount}/{totalPairs} pares encontrados
            </p>

            <dl className="org-match-game__victory-stats">
              <div>
                <dt>Movimientos</dt>
                <dd>{game.stats.moves}</dd>
              </div>
              <div>
                <dt>Tiempo</dt>
                <dd>{formatElapsed(elapsedSec)}</dd>
              </div>
            </dl>

            <div className="org-match-game__victory-actions">
              <button type="button" className="org-match-game__restart" onClick={handleRestart}>
                <RotateCcw size={16} aria-hidden />
                Jugar otra vez
              </button>
              {onBackToStudy ? (
                <button
                  type="button"
                  className="org-match-game__action org-match-game__action--secondary"
                  onClick={onBackToStudy}
                >
                  <BookOpen size={16} aria-hidden />
                  Volver a estudiar
                </button>
              ) : null}
              {onContinue ? (
                <button
                  type="button"
                  className="org-match-game__action org-match-game__action--primary"
                  onClick={onContinue}
                >
                  <Sparkles size={16} aria-hidden />
                  Continuar
                </button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!won ? (
        <footer className="org-match-game__footer">
          <button type="button" className="org-match-game__footer-restart" onClick={handleRestart}>
            Reiniciar tablero
          </button>
        </footer>
      ) : null}
    </div>
  );
}

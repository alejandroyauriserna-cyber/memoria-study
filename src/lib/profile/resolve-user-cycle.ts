import { getCycleByNumber } from "@/lib/academic/helpers";
import { parseCycleNumberFromLabel } from "@/lib/home/greeting";

export type UserCycleSource = {
  current_cycle_number?: number | null;
  current_cycle_label?: string | null;
};

export type ResolvedUserCycle = {
  cycleNumber: number | null;
  cycleLabel: string | null;
};

export function resolveUserCycle(
  profile: UserCycleSource | null | undefined,
  metadata?: Record<string, unknown> | null,
): ResolvedUserCycle {
  let cycleNumber =
    profile?.current_cycle_number ??
    (metadata?.current_cycle_number as number | undefined) ??
    null;

  let cycleLabel =
    profile?.current_cycle_label ??
    (metadata?.current_cycle_label as string | undefined) ??
    null;

  if (cycleNumber != null && !cycleLabel) {
    cycleLabel = getCycleByNumber(cycleNumber)?.cycleLabel ?? null;
  }

  if (cycleLabel && cycleNumber == null) {
    cycleNumber = parseCycleNumberFromLabel(cycleLabel);
  }

  if (cycleNumber != null) {
    const official = getCycleByNumber(cycleNumber);
    if (official) {
      return {
        cycleNumber: official.cycleNumber,
        cycleLabel: official.cycleLabel,
      };
    }
  }

  return { cycleNumber, cycleLabel };
}

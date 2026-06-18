import type { GuidedStudySession, SpacedReviewItem } from "@/types/guided-legal-study";

const REVIEW_INTERVALS = [1, 3, 7, 14] as const;

function nextIntervalDays(current: number): number {
  const idx = REVIEW_INTERVALS.indexOf(current as (typeof REVIEW_INTERVALS)[number]);
  if (idx < 0) return REVIEW_INTERVALS[0];
  if (idx >= REVIEW_INTERVALS.length - 1) return REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1];
  return REVIEW_INTERVALS[idx + 1];
}

export function scheduleSpacedReview(
  session: GuidedStudySession,
  concept: string,
  pageNumber: number,
  score: number,
): GuidedStudySession {
  if (!concept.trim()) return session;

  const reviews = [...(session.spacedReviews ?? [])];
  const existingIdx = reviews.findIndex(
    (r) => r.concept.toLowerCase() === concept.toLowerCase(),
  );

  const now = new Date();
  const intervalDays = score >= 75 ? REVIEW_INTERVALS[1] : REVIEW_INTERVALS[0];
  const nextReviewAt = new Date(now);
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  if (existingIdx >= 0) {
    const prev = reviews[existingIdx];
    const advancedInterval =
      score >= 70 ? nextIntervalDays(prev.intervalDays) : REVIEW_INTERVALS[0];
    const next = new Date(now);
    next.setDate(next.getDate() + advancedInterval);
    reviews[existingIdx] = {
      ...prev,
      pageNumber,
      lastScore: score,
      intervalDays: advancedInterval,
      nextReviewAt: next.toISOString(),
    };
  } else {
    reviews.push({
      id: `${Date.now()}-${concept.slice(0, 20)}`,
      concept: concept.trim(),
      pageNumber,
      materialId: session.materialId,
      nextReviewAt: nextReviewAt.toISOString(),
      intervalDays,
      lastScore: score,
    });
  }

  return {
    ...session,
    spacedReviews: reviews.slice(-40),
    lastUpdated: now.toISOString(),
  };
}

export function getDueSpacedReviews(
  session: GuidedStudySession | null,
  limit = 3,
): SpacedReviewItem[] {
  if (!session?.spacedReviews?.length) return [];
  const now = Date.now();
  return session.spacedReviews
    .filter((r) => new Date(r.nextReviewAt).getTime() <= now)
    .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime())
    .slice(0, limit);
}

export function markSpacedReviewDone(
  session: GuidedStudySession,
  reviewId: string,
  score: number,
): GuidedStudySession {
  const reviews = (session.spacedReviews ?? []).map((r) => {
    if (r.id !== reviewId) return r;
    const intervalDays = score >= 70 ? nextIntervalDays(r.intervalDays) : REVIEW_INTERVALS[0];
    const next = new Date();
    next.setDate(next.getDate() + intervalDays);
    return {
      ...r,
      lastScore: score,
      intervalDays,
      nextReviewAt: next.toISOString(),
    };
  });

  return { ...session, spacedReviews: reviews, lastUpdated: new Date().toISOString() };
}

export function daysSinceReview(review: SpacedReviewItem): number {
  const due = new Date(review.nextReviewAt);
  const scheduled = new Date(due);
  scheduled.setDate(scheduled.getDate() - review.intervalDays);
  return Math.max(1, Math.round((Date.now() - scheduled.getTime()) / 86_400_000));
}

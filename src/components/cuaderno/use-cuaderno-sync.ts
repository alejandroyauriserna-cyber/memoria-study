"use client";

import { useCallback, useEffect, useState } from "react";
import type { CuadernoCollectionsSnapshot } from "@/lib/cuaderno/collections-server";
import {
  countCachedCollection,
  getCachedCollections,
  getCachedCourseCover,
  syncCollectionsFromServer,
  syncCourseCoversFromServer,
} from "@/lib/cuaderno/collections-client";
import type { CourseCoverArt } from "@/lib/cuaderno/course-covers";
import type { SmartCollectionSlug } from "@/lib/cuaderno/smart-collections";

export function useCuadernoSync(initialSnapshot?: CuadernoCollectionsSnapshot) {
  const [collections, setCollections] = useState<CuadernoCollectionsSnapshot>(
    () => initialSnapshot ?? getCachedCollections(),
  );
  const [covers, setCovers] = useState<Record<string, CourseCoverArt>>({});
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [snap, coverMap] = await Promise.all([
      syncCollectionsFromServer(),
      syncCourseCoversFromServer(),
    ]);
    setCollections(snap);
    setCovers(coverMap);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const countCollection = useCallback(
    (slug: SmartCollectionSlug) => {
      if (!ready) return countCachedCollection(slug);
      if (slug === "favoritos") return collections.favoriteClassIds.length;
      if (slug === "examenes") return collections.examItems.length;
      return collections.summaryItems.length;
    },
    [collections, ready],
  );

  const resolveCover = useCallback(
    (courseId: string, fallback: CourseCoverArt) => {
      return covers[courseId] ?? getCachedCourseCover(courseId) ?? fallback;
    },
    [covers],
  );

  const setCover = useCallback((courseId: string, art: CourseCoverArt) => {
    setCovers((prev) => ({ ...prev, [courseId]: art }));
  }, []);

  return {
    collections,
    covers,
    ready,
    refresh,
    countCollection,
    resolveCover,
    setCover,
    isFavorite: (classId: string) => collections.favoriteClassIds.includes(classId),
  };
}

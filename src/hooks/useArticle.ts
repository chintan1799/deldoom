import { useState, useCallback, useRef } from 'react';
import type { Article } from '../types';
import { fetchRandomArticle } from '../api/articles';
import { useAppStore } from '../store/useAppStore';

interface UseArticleReturn {
  article: Article | null;
  loading: boolean;
  error: string | null;
  canGoBack: boolean;
  roll: () => void;
  goBack: () => void;
}

const PREFETCH_TARGET = 3;
const PREFETCH_PARALLEL = 3;

export function useArticle(selectedInterests: string[]): UseArticleReturn {
  const [article, setArticle] = useState<Article | null>(null);
  const [previousArticle, setPreviousArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefetchingRef = useRef(false);

  // Select individually to avoid re-creating the callback on unrelated store changes
  const markArticleSeen      = useAppStore((s) => s.markArticleSeen);
  const pushRecentSource     = useAppStore((s) => s.pushRecentSource);
  const pushToPrefetchQueue  = useAppStore((s) => s.pushToPrefetchQueue);
  const shiftFromPrefetchQueue = useAppStore((s) => s.shiftFromPrefetchQueue);
  const setIsPrefetching     = useAppStore((s) => s.setIsPrefetching);
  const cacheArticle         = useAppStore((s) => s.cacheArticle);

  const commitArticle = useCallback((result: Article) => {
    markArticleSeen(result.id);
    pushRecentSource(result.source ?? 'wikipedia');
    cacheArticle(result);
    setArticle((current) => {
      setPreviousArticle(current);
      return result;
    });
  }, [markArticleSeen, pushRecentSource, cacheArticle]);

  const triggerBackgroundPrefetch = useCallback(() => {
    const state = useAppStore.getState();
    if (prefetchingRef.current || state.isPrefetching) return;
    if (state.prefetchQueue.length >= PREFETCH_TARGET) return;

    prefetchingRef.current = true;
    setIsPrefetching(true);

    const needed = PREFETCH_TARGET - state.prefetchQueue.length;
    const fetches = Array.from({ length: Math.min(PREFETCH_PARALLEL, needed) }, () =>
      fetchRandomArticle(selectedInterests, state.seenArticleIds, state.recentSources)
    );

    Promise.allSettled(fetches).then((results) => {
      const seen = new Set(useAppStore.getState().seenArticleIds);
      const queueIds = new Set(useAppStore.getState().prefetchQueue.map((a) => a.id));
      for (const r of results) {
        if (r.status !== 'fulfilled' || !r.value) continue;
        const a = r.value;
        if (!a.extract?.trim()) continue;
        if (seen.has(a.id) || queueIds.has(a.id)) continue;
        queueIds.add(a.id);
        pushToPrefetchQueue(a);
        cacheArticle(a);
      }
      if (import.meta.env.DEV) {
        console.log(
          `[deldoom] prefetch queue size: ${useAppStore.getState().prefetchQueue.length}`
        );
      }
    }).finally(() => {
      prefetchingRef.current = false;
      setIsPrefetching(false);
    });
  }, [selectedInterests, pushToPrefetchQueue, cacheArticle, setIsPrefetching]);

  const roll = useCallback(async () => {
    setError(null);

    // Try the prefetch queue first — instant path
    const queued = shiftFromPrefetchQueue();
    if (queued) {
      commitArticle(queued);
      triggerBackgroundPrefetch();
      return;
    }

    // Nothing queued — live fetch
    setLoading(true);
    try {
      const { seenArticleIds, recentSources } = useAppStore.getState();
      const result = await fetchRandomArticle(selectedInterests, seenArticleIds, recentSources);
      commitArticle(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article');
    } finally {
      setLoading(false);
      triggerBackgroundPrefetch();
    }
  }, [selectedInterests, shiftFromPrefetchQueue, commitArticle, triggerBackgroundPrefetch]);

  const goBack = useCallback(() => {
    if (!previousArticle) return;
    setArticle(previousArticle);
    setPreviousArticle(null);
  }, [previousArticle]);

  return { article, loading, error, canGoBack: previousArticle !== null, roll, goBack };
}

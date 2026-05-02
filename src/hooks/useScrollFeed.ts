import { useState, useRef, useCallback, useEffect } from 'react';
import type { Article } from '../types';
import { fetchRandomArticle } from '../api/articles';

const INITIAL_BATCH = 5;
const MORE_BATCH = 5;

interface UseScrollFeedReturn {
  articles: Article[];
  loadingInitial: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: () => Promise<void>;
}

export function useScrollFeed(selectedInterests: string[]): UseScrollFeedReturn {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seenUrls = useRef<Set<string>>(new Set());
  const isFetchingMore = useRef(false);
  // Always-current ref to avoid stale closures in callbacks
  const currentInterests = useRef(selectedInterests);
  currentInterests.current = selectedInterests;

  async function fetchBatch(n: number): Promise<Article[]> {
    const promises = Array.from({ length: n }, () =>
      fetchRandomArticle(currentInterests.current)
    );
    const results = await Promise.allSettled(promises);
    return results
      .filter((r): r is PromiseFulfilledResult<Article> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((a) => !seenUrls.current.has(a.pageUrl))
      .map((a) => {
        seenUrls.current.add(a.pageUrl);
        return a;
      });
  }

  const loadMore = useCallback(() => {
    if (isFetchingMore.current) return;
    isFetchingMore.current = true;
    setLoadingMore(true);
    fetchBatch(MORE_BATCH)
      .then((batch) => {
        setArticles((prev) => [...prev, ...batch]);
        setLoadingMore(false);
        isFetchingMore.current = false;
      })
      .catch(() => {
        setLoadingMore(false);
        isFetchingMore.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async () => {
    seenUrls.current = new Set();
    isFetchingMore.current = false;
    setArticles([]);
    setLoadingInitial(true);
    try {
      const batch = await fetchBatch(INITIAL_BATCH);
      setArticles(batch);
    } catch {
      setError('Failed to refresh');
    } finally {
      setLoadingInitial(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    seenUrls.current = new Set();
    isFetchingMore.current = false;
    setArticles([]);
    setLoadingInitial(true);
    setError(null);
    fetchBatch(INITIAL_BATCH)
      .then((batch) => {
        setArticles(batch);
        setLoadingInitial(false);
      })
      .catch(() => {
        setError('Failed to load feed');
        setLoadingInitial(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInterests]);

  return { articles, loadingInitial, loadingMore, error, loadMore, refresh };
}

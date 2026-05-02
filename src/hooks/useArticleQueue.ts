import { useState, useRef, useEffect } from 'react';
import type { Article } from '../types';
import { fetchRandomArticle } from '../api/articles';

const QUEUE_TARGET = 2;

interface UseArticleQueueReturn {
  article: Article | null;
  nextArticle: Article | null;
  loading: boolean;
  error: string | null;
  advance: () => void;
}

export function useArticleQueue(selectedInterests: string[]): UseArticleQueueReturn {
  const [queue, setQueue] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mutable state in a ref to avoid stale closure issues in async callbacks
  const internals = useRef({
    seenUrls: new Set<string>(),
    recentInterestIds: [] as string[],
    fetchingCount: 0,
    queue: [] as Article[],
    selectedInterests,
  });

  // Always keep selectedInterests current
  internals.current.selectedInterests = selectedInterests;

  function fetchOneArticle(): Promise<Article | null> {
    return fetchRandomArticle(internals.current.selectedInterests)
      .then(async (result) => {
        for (let i = 0; i < 2; i++) {
          if (!result) break;
          const recentLast3 = internals.current.recentInterestIds.slice(-3);
          if (
            internals.current.seenUrls.has(result.pageUrl) ||
            recentLast3.includes(result.interestId)
          ) {
            result = await fetchRandomArticle(internals.current.selectedInterests);
          } else break;
        }
        if (result) {
          internals.current.seenUrls.add(result.pageUrl);
          internals.current.recentInterestIds = [
            ...internals.current.recentInterestIds,
            result.interestId,
          ].slice(-5);
        }
        return result;
      })
      .catch(() => null);
  }

  function fillQueue() {
    const needed =
      QUEUE_TARGET - internals.current.queue.length - internals.current.fetchingCount;
    for (let i = 0; i < needed; i++) {
      internals.current.fetchingCount++;
      fetchOneArticle().then((article) => {
        internals.current.fetchingCount--;
        if (article) {
          internals.current.queue = [...internals.current.queue, article];
          setQueue([...internals.current.queue]);
          setLoading(false);
          setError(null);
        } else if (
          internals.current.fetchingCount === 0 &&
          internals.current.queue.length === 0
        ) {
          setLoading(false);
        }
      });
    }
  }

  // Reset and refill when selectedInterests changes
  useEffect(() => {
    internals.current.seenUrls = new Set();
    internals.current.recentInterestIds = [];
    internals.current.queue = [];
    internals.current.fetchingCount = 0;
    setQueue([]);
    setLoading(true);
    setError(null);
    fillQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInterests]);

  function advance() {
    internals.current.queue = internals.current.queue.slice(1);
    setQueue([...internals.current.queue]);
    if (internals.current.queue.length === 0) setLoading(true);
    fillQueue();
  }

  return {
    article: queue[0] ?? null,
    nextArticle: queue[1] ?? null,
    loading: loading && queue.length === 0,
    error,
    advance,
  };
}

import { useState, useCallback, useRef } from 'react';
import type { Article } from '../types';
import { fetchRandomArticle } from '../api/articles';

interface UseArticleReturn {
  article: Article | null;
  loading: boolean;
  error: string | null;
  roll: () => void;
}

export function useArticle(selectedInterests: string[]): UseArticleReturn {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seenUrls = useRef<Set<string>>(new Set());

  const roll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result = await fetchRandomArticle(selectedInterests);
      // Retry up to 2 times if we've already seen this URL this session
      for (let i = 0; i < 2 && result && seenUrls.current.has(result.pageUrl); i++) {
        result = await fetchRandomArticle(selectedInterests);
      }
      if (result) seenUrls.current.add(result.pageUrl);
      setArticle(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article');
    } finally {
      setLoading(false);
    }
  }, [selectedInterests]);

  return { article, loading, error, roll };
}

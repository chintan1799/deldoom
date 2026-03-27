import { useState, useCallback } from 'react';
import type { Article } from '../types';
import { fetchRandomArticleForInterests } from '../api/wikipedia';

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

  const roll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRandomArticleForInterests(selectedInterests);
      setArticle(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article');
    } finally {
      setLoading(false);
    }
  }, [selectedInterests]);

  return { article, loading, error, roll };
}

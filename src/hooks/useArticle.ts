import { useState, useCallback } from 'react';
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

export function useArticle(selectedInterests: string[]): UseArticleReturn {
  const [article, setArticle] = useState<Article | null>(null);
  const [previousArticle, setPreviousArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { seenArticleIds, markArticleSeen } = useAppStore();

  const roll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRandomArticle(selectedInterests, seenArticleIds);
      markArticleSeen(result.id);
      // Save current as previous before overwriting
      setArticle(current => {
        setPreviousArticle(current);
        return result;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article');
    } finally {
      setLoading(false);
    }
  }, [selectedInterests, seenArticleIds, markArticleSeen]);

  const goBack = useCallback(() => {
    if (!previousArticle) return;
    setArticle(previousArticle);
    setPreviousArticle(null);
  }, [previousArticle]);

  return { article, loading, error, canGoBack: previousArticle !== null, roll, goBack };
}

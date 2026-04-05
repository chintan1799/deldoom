import { useState, useCallback, useRef } from 'react';
import type { Article } from '../types';
import { fetchRandomArticle } from '../api/articles';

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
      // Save current article as previous before overwriting
      setArticle(current => {
        setPreviousArticle(current);
        return result;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article');
    } finally {
      setLoading(false);
    }
  }, [selectedInterests]);

  const goBack = useCallback(() => {
    if (!previousArticle) return;
    setArticle(previousArticle);
    setPreviousArticle(null);
  }, [previousArticle]);

  return { article, loading, error, canGoBack: previousArticle !== null, roll, goBack };
}

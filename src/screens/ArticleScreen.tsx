import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchArticleHtml, sanitizeWikiHtml } from '../api/wikipedia';
import { useAppStore } from '../store/useAppStore';

export function ArticleScreen() {
  const { wikiTitle } = useParams<{ wikiTitle: string }>();
  const navigate = useNavigate();
  const { savedArticles, saveArticle, unsaveArticle, isArticleSaved } = useAppStore();

  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decodedTitle = decodeURIComponent(wikiTitle ?? '');
  const article = savedArticles.find((a) => a.wikiTitle === decodedTitle);
  const saved = isArticleSaved(decodedTitle);

  useEffect(() => {
    if (!decodedTitle) return;
    setLoading(true);
    setError(null);

    fetchArticleHtml(decodedTitle)
      .then((raw) => {
        setHtml(sanitizeWikiHtml(raw));
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [decodedTitle]);

  function toggleSave() {
    if (saved) {
      unsaveArticle(decodedTitle);
    } else if (article) {
      saveArticle(article);
    }
  }

  const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(decodedTitle)}`;

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 32 }}
      className="fixed inset-0 bg-white dark:bg-zinc-950 z-40 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
        >
          ←
        </button>
        <h1 className="flex-1 text-lg font-bold text-zinc-900 dark:text-white truncate">
          {decodedTitle.replace(/_/g, ' ')}
        </h1>
        {article && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleSave}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors shrink-0 ${
              saved
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
            }`}
          >
            {saved ? '🔖' : '🔖'}
          </motion.button>
        )}
      </div>

      {/* Article content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-4xl"
            >
              🎲
            </motion.div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading article...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
            <span className="text-5xl">😅</span>
            <p className="font-bold text-zinc-800 dark:text-white">Couldn't load the article</p>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">{error}</p>
            <a
              href={wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-semibold text-sm"
            >
              Open in Wikipedia ↗
            </a>
          </div>
        )}

        {html && !loading && (
          <div
            className="wiki-content px-5 py-6 prose prose-zinc dark:prose-invert max-w-none prose-headings:font-black prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8 prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-img:rounded-xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>

      {/* Bottom bar */}
      {!loading && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-4 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shrink-0"
        >
          <a
            href={wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <span>Open full article in Wikipedia</span>
            <span>↗</span>
          </a>
        </motion.div>
      )}
    </motion.div>
  );
}

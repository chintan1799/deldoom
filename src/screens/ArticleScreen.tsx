import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark, BookmarkCheck, ExternalLink, Dices } from 'lucide-react';
import { fetchArticleHtml, sanitizeWikiHtml } from '../api/wikipedia';
import { useAppStore } from '../store/useAppStore';
import { WikiTermPopup } from '../components/WikiTermPopup';
import { ResourcePanel } from '../components/ResourcePanel';

export function ArticleScreen() {
  const { wikiTitle } = useParams<{ wikiTitle: string }>();
  const navigate = useNavigate();
  const { savedArticles, saveArticle, unsaveArticle, isArticleSaved } = useAppStore();

  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popupTitle, setPopupTitle] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const decodedTitle = decodeURIComponent(wikiTitle ?? '');
  const article = savedArticles.find((a) => a.wikiTitle === decodedTitle);
  const saved = isArticleSaved(decodedTitle);

  useEffect(() => {
    if (!decodedTitle) return;
    setLoading(true);
    setError(null);
    setHtml(null);

    fetchArticleHtml(decodedTitle)
      .then((raw) => setHtml(sanitizeWikiHtml(raw)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [decodedTitle]);

  // Event delegation for wiki-link taps
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('[data-wiki-title]') as HTMLElement | null;
      if (target?.dataset.wikiTitle) {
        e.preventDefault();
        setPopupTitle(target.dataset.wikiTitle);
      }
    }
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [html]);

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
      className="fixed inset-0 bg-white dark:bg-navy-950 z-40 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-slate-100 dark:border-navy-800 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-navy-800 text-navy-900 dark:text-white shrink-0"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <h1 className="flex-1 text-base font-bold text-navy-900 dark:text-white truncate">
          {decodedTitle.replace(/_/g, ' ')}
        </h1>
        {article && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleSave}
            className={`flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 transition-colors ${
              saved
                ? 'bg-navy-900 dark:bg-white text-white dark:text-navy-900'
                : 'bg-slate-100 dark:bg-navy-800 text-navy-900 dark:text-white'
            }`}
          >
            {saved
              ? <BookmarkCheck size={18} strokeWidth={2.5} />
              : <Bookmark size={18} strokeWidth={2} />}
          </motion.button>
        )}
      </div>

      {/* Article content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            >
              <Dices size={36} className="text-slate-400" strokeWidth={1.5} />
            </motion.div>
            <p className="text-slate-400 text-sm">Loading article…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 px-8 text-center">
            <p className="text-4xl">😅</p>
            <p className="font-bold text-navy-900 dark:text-white">Couldn't load the article</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{error}</p>
            <a
              href={wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-navy-900 dark:bg-white text-white dark:text-navy-900 rounded-2xl font-bold text-sm"
            >
              Open in Wikipedia <ExternalLink size={13} />
            </a>
          </div>
        )}

        {html && !loading && (
          <>
            <div
              ref={contentRef}
              className="wiki-content px-5 py-6 prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8 prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-img:rounded-xl prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: html }}
            />
            <ResourcePanel wikiTitle={decodedTitle} articleTitle={decodedTitle.replace(/_/g, ' ')} />
          </>
        )}
      </div>


<WikiTermPopup wikiTitle={popupTitle} onClose={() => setPopupTitle(null)} />
    </motion.div>
  );
}

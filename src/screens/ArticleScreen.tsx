import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bookmark, BookmarkCheck, Dices, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchArticleHtml, sanitizeWikiHtml } from '../api/wikipedia';
import { useAppStore } from '../store/useAppStore';
import { WikiTermPopup } from '../components/WikiTermPopup';
import { ResourcePanel } from '../components/ResourcePanel';

// ── Section parser ────────────────────────────────────────────────────────────
interface Section {
  title: string;
  html: string;
  wordCount: number;
}

function parseSections(html: string): Section[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sectionEls = Array.from(doc.querySelectorAll('section'));

  if (sectionEls.length === 0) {
    // No <section> structure — treat entire body as one section
    const wc = (doc.body.textContent || '').split(/\s+/).filter(Boolean).length;
    return [{ title: 'Article', html: doc.body.innerHTML, wordCount: wc }];
  }

  return sectionEls
    .map((sec) => {
      const heading = sec.querySelector('h2, h1');
      const title = heading?.textContent?.trim() || 'Introduction';
      // Remove the heading from the rendered HTML so we show it ourselves
      heading?.remove();
      const wc = (sec.textContent || '').split(/\s+/).filter(Boolean).length;
      return { title, html: sec.innerHTML, wordCount: wc };
    })
    .filter((s) => s.wordCount > 15);
}

function readTime(wc: number) {
  return Math.max(1, Math.round(wc / 200));
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ArticleScreen() {
  const { wikiTitle } = useParams<{ wikiTitle: string }>();
  const navigate = useNavigate();
  const { savedArticles, saveArticle, unsaveArticle, isArticleSaved } = useAppStore();

  const [sections, setSections] = useState<Section[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popupTitle, setPopupTitle] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  const decodedTitle = decodeURIComponent(wikiTitle ?? '');
  const article = savedArticles.find((a) => a.wikiTitle === decodedTitle);
  const saved = isArticleSaved(decodedTitle);

  useEffect(() => {
    if (!decodedTitle) return;
    setLoading(true);
    setError(null);
    setSections([]);
    setCurrentIdx(0);

    fetchArticleHtml(decodedTitle)
      .then((raw) => {
        const clean = sanitizeWikiHtml(raw);
        setSections(parseSections(clean));
      })
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
  }, [sections, currentIdx]);

  function toggleSave() {
    if (saved) unsaveArticle(decodedTitle);
    else if (article) saveArticle(article);
  }

  function goTo(idx: number) {
    if (idx < 0 || idx >= sections.length) return;
    setDirection(idx > currentIdx ? 1 : -1);
    setCurrentIdx(idx);
    // Scroll content to top
    contentRef.current?.scrollTo({ top: 0 });
  }

  const isLastSection = currentIdx === sections.length - 1;
  const progress = sections.length > 0 ? ((currentIdx + 1) / sections.length) * 100 : 0;
  const currentSection = sections[currentIdx];

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? '60%' : '-60%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-60%' : '60%', opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 32 }}
      className="fixed inset-0 bg-white dark:bg-navy-950 z-40 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 border-b border-slate-100 dark:border-navy-800 shrink-0"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: '12px' }}>
        <button onClick={() => navigate(-1)}
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-navy-800 text-navy-900 dark:text-white shrink-0">
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <h1 className="flex-1 text-base font-bold text-navy-900 dark:text-white truncate">
          {decodedTitle.replace(/_/g, ' ')}
        </h1>
        {article && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={toggleSave}
            className={`flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 transition-colors ${
              saved ? 'bg-navy-900 dark:bg-white text-white dark:text-navy-900'
                    : 'bg-slate-100 dark:bg-navy-800 text-navy-900 dark:text-white'
            }`}>
            {saved ? <BookmarkCheck size={18} strokeWidth={2.5} /> : <Bookmark size={18} strokeWidth={2} />}
          </motion.button>
        )}
      </div>

      {/* Progress bar + section label */}
      {sections.length > 0 && (
        <div className="shrink-0 px-4 pt-3 pb-2">
          <div className="h-1 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full bg-navy-900 dark:bg-white rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {currentSection.title !== 'Introduction' && currentSection.title !== 'Article'
                ? currentSection.title
                : decodedTitle.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {currentIdx + 1} / {sections.length} · {readTime(currentSection?.wordCount ?? 0)} min
            </span>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}>
              <Dices size={36} className="text-slate-400" strokeWidth={1.5} />
            </motion.div>
            <p className="text-slate-400 text-sm">Loading article…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
            <p className="text-4xl">😅</p>
            <p className="font-bold text-navy-900 dark:text-white">Couldn't load the article</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && sections.length > 0 && (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIdx}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0 overflow-y-auto overscroll-contain"
              ref={contentRef}
            >
              <div
                className="wiki-content px-5 py-4 prose prose-slate dark:prose-invert max-w-none
                  prose-headings:font-black prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8
                  prose-p:text-slate-600 dark:prose-p:text-slate-400
                  prose-img:rounded-xl prose-img:shadow-md"
                dangerouslySetInnerHTML={{ __html: currentSection.html }}
              />

              {/* Resource panel after last section */}
              {isLastSection && (
                <ResourcePanel
                  wikiTitle={decodedTitle}
                  articleTitle={decodedTitle.replace(/_/g, ' ')}
                />
              )}

              {/* Bottom padding */}
              <div className="h-28" />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Navigation row */}
      {sections.length > 0 && !loading && (
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-t border-slate-100 dark:border-navy-800 bg-white/95 dark:bg-navy-950/95 backdrop-blur-xl"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => goTo(currentIdx - 1)}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-navy-800 text-navy-900 dark:text-white font-semibold text-sm disabled:opacity-30 transition-opacity"
          >
            <ChevronLeft size={16} strokeWidth={2.5} /> Prev
          </button>

          {/* Dot indicators (up to 8) */}
          <div className="flex-1 flex items-center justify-center gap-1.5 overflow-hidden">
            {sections.slice(0, 8).map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`rounded-full transition-all ${
                  i === currentIdx
                    ? 'w-4 h-2 bg-navy-900 dark:bg-white'
                    : 'w-2 h-2 bg-slate-200 dark:bg-navy-700'
                }`}
              />
            ))}
            {sections.length > 8 && (
              <span className="text-xs text-slate-400">+{sections.length - 8}</span>
            )}
          </div>

          <button
            onClick={() => goTo(currentIdx + 1)}
            disabled={isLastSection}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-navy-900 dark:bg-white text-white dark:text-navy-900 font-semibold text-sm disabled:opacity-30 transition-opacity"
          >
            Next <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <WikiTermPopup wikiTitle={popupTitle} onClose={() => setPopupTitle(null)} />
    </motion.div>
  );
}

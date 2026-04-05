import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Lightbulb, ChevronDown, ChevronUp, TrendingUp, User, X, Bookmark, Dices } from 'lucide-react';
import type { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onSkip: () => void;
  onSave: () => void;
  onRoll: () => void;
  loading?: boolean;
}

const SOURCE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  wikipedia:    { label: 'WIKI',   bg: 'bg-navy-900 dark:bg-white', text: 'text-white dark:text-navy-900' },
  reddit:       { label: 'REDDIT', bg: 'bg-orange-500',             text: 'text-white' },
  hackernews:   { label: 'HN',     bg: 'bg-amber-500',              text: 'text-white' },
  techcrunch:   { label: 'TC',     bg: 'bg-green-600',              text: 'text-white' },
  medium:       { label: 'MEDIUM', bg: 'bg-gray-900',               text: 'text-white' },
  arxiv:        { label: 'ARXIV',  bg: 'bg-violet-700',             text: 'text-white' },
  nasa:         { label: 'NASA',   bg: 'bg-blue-900',               text: 'text-white' },
  sep:          { label: 'SEP',    bg: 'bg-indigo-700',             text: 'text-white' },
  stackexchange:{ label: 'SE',     bg: 'bg-orange-600',             text: 'text-white' },
  owid:         { label: 'OWID',   bg: 'bg-teal-600',               text: 'text-white' },
  worldbank:    { label: 'WB',     bg: 'bg-sky-700',                text: 'text-white' },
  gutenberg:    { label: 'BOOK',   bg: 'bg-amber-700',              text: 'text-white' },
};

function formatScore(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return ''; }
}

export function ArticleCard({ article, onSkip, onSave, onRoll, loading = false }: ArticleCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const x            = useMotionValue(0);
  const rotate       = useTransform(x, [-200, 200], [-6, 6]);
  const saveOpacity  = useTransform(x, [0, 60, 130], [0, 0.9, 1]);
  const skipOpacity  = useTransform(x, [-130, -60, 0], [1, 0.9, 0]);
  const saveScale    = useTransform(x, [0, 130], [0.6, 1]);
  const skipScale    = useTransform(x, [-130, 0], [1, 0.6]);
  const saveOverlay  = useTransform(x, [0, 130], [0, 0.18]);
  const skipOverlay  = useTransform(x, [-130, 0], [0.18, 0]);
  const controls     = useAnimation();

  async function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > 110) {
      await controls.start({ x: 600, opacity: 0, transition: { duration: 0.28 } });
      onSave();
    } else if (info.offset.x < -110) {
      await controls.start({ x: -600, opacity: 0, transition: { duration: 0.28 } });
      onSkip();
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } });
    }
  }

  function handleCta(e: React.MouseEvent) {
    e.stopPropagation();
    const src = article.source ?? 'wikipedia';
    const slug = src === 'wikipedia' ? article.wikiTitle : article.title;
    navigate(`/article/${encodeURIComponent(slug)}`, { state: { article } });
  }

  const sourceImageUrl = article.thumbnailUrl || article.imageUrl;
  // Unsplash fallback when the article has no image of its own
  const unsplashUrl = !sourceImageUrl
    ? `https://source.unsplash.com/800x450/?${encodeURIComponent(article.interestLabel.toLowerCase())}`
    : null;
  // Active image: source image, or Unsplash (if not yet failed), or nothing
  const activeImage = sourceImageUrl || (!imgFailed ? unsplashUrl : null);

  const source  = article.source ?? 'wikipedia';
  const srcCfg  = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.wikipedia;
  const PREV_LEN = 280;
  const shortText = article.extract.slice(0, PREV_LEN) + (article.extract.length > PREV_LEN ? '…' : '');

  return (
    <motion.div
      style={{ x, rotate }}
      animate={controls}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      onDragEnd={handleDragEnd}
      className="fixed inset-0 draggable-card"
    >
      {/* Full-card color tint overlays (drag feedback) */}
      <motion.div style={{ opacity: saveOverlay }}
        className="absolute inset-0 z-10 bg-green-400 pointer-events-none" />
      <motion.div style={{ opacity: skipOverlay }}
        className="absolute inset-0 z-10 bg-red-400 pointer-events-none" />

      {/* Stamped SAVE badge */}
      <motion.div style={{ opacity: saveOpacity, scale: saveScale }}
        className="absolute top-20 right-5 z-20 border-[3px] border-green-500 text-green-500 bg-white/90 dark:bg-navy-950/90 px-4 py-2 rounded-xl rotate-[14deg] flex items-center gap-2 shadow-lg pointer-events-none">
        <Bookmark size={18} strokeWidth={3} />
        <span className="text-lg font-black tracking-wider">SAVE</span>
      </motion.div>

      {/* Stamped SKIP badge */}
      <motion.div style={{ opacity: skipOpacity, scale: skipScale }}
        className="absolute top-20 left-5 z-20 border-[3px] border-red-500 text-red-500 bg-white/90 dark:bg-navy-950/90 px-4 py-2 rounded-xl -rotate-[14deg] flex items-center gap-2 shadow-lg pointer-events-none">
        <X size={18} strokeWidth={3} />
        <span className="text-lg font-black tracking-wider">SKIP</span>
      </motion.div>

      {/* Hero image / gradient banner */}
      {activeImage ? (
        <div className="absolute inset-x-0 top-0 h-[48vh]">
          <img
            src={activeImage}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-white dark:to-navy-950" />
        </div>
      ) : (
        <div className="absolute inset-x-0 top-0 h-[20vh]"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, ${article.interestColor}22 8px, ${article.interestColor}22 16px)`,
            backgroundColor: `${article.interestColor}0a`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-navy-950" />
        </div>
      )}

      {/* Scrollable content */}
      <div className="absolute inset-0 overflow-y-auto overscroll-contain"
        style={{ paddingTop: activeImage ? '38vh' : '14vh', paddingBottom: '120px' }}>
        <div className="bg-white dark:bg-navy-950 rounded-t-[28px] min-h-full px-5 pt-5 pb-4">

          {/* Source + category row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider ${srcCfg.bg} ${srcCfg.text}`}>
              {srcCfg.label}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
              {article.interestEmoji} {article.interestLabel}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black text-navy-900 dark:text-white leading-tight mb-1">
            {article.title}
          </h2>

          {/* Subreddit / description */}
          {(article.subreddit || (source === 'wikipedia' && article.description)) && (
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
              {article.subreddit ?? article.description}
            </p>
          )}

          <div className="border-t border-slate-100 dark:border-navy-800 mb-4" />

          {/* Extract */}
          {article.extract && (
            <>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {expanded ? article.extract : shortText}
              </p>
              {article.extract.length > PREV_LEN && (
                <button onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
                  className="flex items-center gap-1 text-xs text-accent font-medium mt-2 mb-1">
                  {expanded ? <><ChevronUp size={13} />Show less</> : <><ChevronDown size={13} />Read more</>}
                </button>
              )}
            </>
          )}

          {/* Did you know */}
          {article.interestingFact && source === 'wikipedia' && (
            <div className="bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-3.5 mt-4 flex gap-2.5">
              <Lightbulb size={15} className="text-accent shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-navy-900 dark:text-white">Did you know? </span>
                {article.interestingFact}
              </p>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-600 mt-4 flex-wrap">
            {source === 'wikipedia' && article.readingTimeMin && (
              <span>{article.readingTimeMin} min read</span>
            )}
            {(source === 'reddit' || source === 'hackernews') && article.author && (
              <span className="flex items-center gap-1"><User size={11} />{article.author}</span>
            )}
            {(source === 'reddit' || source === 'hackernews') && article.score !== undefined && (
              <span className="flex items-center gap-1"><TrendingUp size={11} />{formatScore(article.score)}</span>
            )}
            {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
          </div>

          {/* Dig deeper CTA — tappable, not swipe-blocked */}
          <button onClick={handleCta}
            className="mt-5 w-full flex items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-navy-900 dark:bg-white text-white dark:text-navy-900 font-bold text-sm">
            Dig deeper →
          </button>
        </div>
      </div>

      {/* ── Floating action buttons ── */}
      <div className="fixed bottom-0 left-0 right-0 flex items-end justify-center gap-5 px-8 pointer-events-none"
        style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>

        {/* Skip */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={onSkip}
          className="pointer-events-auto w-14 h-14 rounded-full bg-white dark:bg-navy-800 border-2 border-slate-200 dark:border-navy-700 shadow-xl flex items-center justify-center">
          <X size={22} strokeWidth={2.5} className="text-slate-500 dark:text-slate-400" />
        </motion.button>

        {/* Roll / Dice — centre, larger */}
        <motion.button whileTap={{ scale: 0.88 }}
          onClick={(e) => { e.stopPropagation(); onRoll(); }}
          disabled={loading}
          className="pointer-events-auto w-16 h-16 rounded-full bg-navy-900 dark:bg-white shadow-2xl flex items-center justify-center mb-2 disabled:opacity-60">
          {loading
            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}>
                <Dices size={26} className="text-white dark:text-navy-900" strokeWidth={1.8} />
              </motion.div>
            : <Dices size={26} className="text-white dark:text-navy-900" strokeWidth={1.8} />}
        </motion.button>

        {/* Save */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={onSave}
          className="pointer-events-auto w-14 h-14 rounded-full bg-navy-900 dark:bg-white border-2 border-navy-900 dark:border-white shadow-xl flex items-center justify-center">
          <Bookmark size={20} strokeWidth={2} className="text-white dark:text-navy-900" />
        </motion.button>
      </div>
    </motion.div>
  );
}

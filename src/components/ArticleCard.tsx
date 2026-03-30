import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Lightbulb, Clock, ChevronDown, ChevronUp, ArrowUpRight, TrendingUp, User } from 'lucide-react';
import type { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onSkip: () => void;
  onSave: () => void;
}

// ── Source badge config ───────────────────────────────────────────────────────
const SOURCE_CONFIG = {
  wikipedia: { label: 'WIKI', bg: 'bg-navy-900 dark:bg-white', text: 'text-white dark:text-navy-900' },
  reddit:    { label: 'REDDIT', bg: 'bg-orange-500', text: 'text-white' },
  hackernews:{ label: 'HN', bg: 'bg-amber-500', text: 'text-white' },
} as const;

function formatScore(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function ArticleCard({ article, onSkip, onSave }: ArticleCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const x          = useMotionValue(0);
  const rotate     = useTransform(x, [-200, 200], [-10, 10]);
  const opacity    = useTransform(x, [-200, -80, 0, 80, 200], [0, 1, 1, 1, 0]);
  const saveOpacity = useTransform(x, [0, 60, 130], [0, 0.8, 1]);
  const skipOpacity = useTransform(x, [-130, -60, 0], [1, 0.8, 0]);
  const controls   = useAnimation();

  async function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > 110) {
      await controls.start({ x: 420, opacity: 0, transition: { duration: 0.28 } });
      onSave();
    } else if (info.offset.x < -110) {
      await controls.start({ x: -420, opacity: 0, transition: { duration: 0.28 } });
      onSkip();
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } });
    }
  }

  function handleCta(e: React.MouseEvent) {
    e.stopPropagation();
    if (article.source === 'reddit' || article.source === 'hackernews') {
      window.open(article.pageUrl, '_blank', 'noopener,noreferrer');
    } else {
      navigate(`/article/${encodeURIComponent(article.wikiTitle)}`);
    }
  }

  const imageUrl   = article.thumbnailUrl || article.imageUrl;
  const source     = article.source ?? 'wikipedia';
  const srcConfig  = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.wikipedia;
  const PREVIEW_LEN = 280;
  const shortExtract = article.extract.slice(0, PREVIEW_LEN) + (article.extract.length > PREVIEW_LEN ? '…' : '');

  const ctaLabel =
    source === 'hackernews' ? 'Read article →' :
    source === 'reddit'     ? 'View post →' :
                              'Dig deeper →';

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      animate={controls}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.25}
      onDragEnd={handleDragEnd}
      className="relative w-full max-w-sm mx-auto draggable-card"
      initial={{ scale: 0.93, y: 30 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
    >
      {/* Swipe labels */}
      <motion.div
        style={{ opacity: saveOpacity }}
        className="absolute top-5 right-5 z-20 bg-navy-900 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg pointer-events-none"
      >
        Save
      </motion.div>
      <motion.div
        style={{ opacity: skipOpacity }}
        className="absolute top-5 left-5 z-20 bg-slate-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg pointer-events-none"
      >
        Skip
      </motion.div>

      {/* Card */}
      <div className="rounded-3xl overflow-hidden bg-white dark:bg-navy-900 shadow-xl border border-slate-100 dark:border-navy-800">

        {/* Hero image — or source-tinted banner fallback */}
        {imageUrl ? (
          <div className="w-full h-48 overflow-hidden bg-slate-100 dark:bg-navy-800">
            <img
              src={imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className="w-full h-12"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 6px,
                ${article.interestColor}18 6px,
                ${article.interestColor}18 12px
              )`,
              backgroundColor: `${article.interestColor}08`,
            }}
          />
        )}

        <div className="p-5">
          {/* Source badge + category row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider ${srcConfig.bg} ${srcConfig.text}`}>
              {srcConfig.label}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
              {article.interestEmoji} {article.interestLabel}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-black text-navy-900 dark:text-white leading-tight mb-1 line-clamp-3">
            {article.title}
          </h2>

          {/* Subreddit or description subtitle */}
          {(article.subreddit || (article.description && source === 'wikipedia')) && (
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
              {article.subreddit ?? article.description}
            </p>
          )}

          {/* Divider */}
          <div className="border-t border-slate-100 dark:border-navy-800 mb-3" />

          {/* Extract */}
          {article.extract ? (
            <>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-1">
                {expanded ? article.extract : shortExtract}
              </p>
              {article.extract.length > PREVIEW_LEN && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
                  className="flex items-center gap-1 text-xs text-accent font-medium mb-3 mt-1"
                >
                  {expanded
                    ? <><ChevronUp size={13} /> Show less</>
                    : <><ChevronDown size={13} /> Read more</>}
                </button>
              )}
            </>
          ) : (
            <p className="text-slate-400 dark:text-slate-600 text-sm italic mb-3">
              Tap to read the full article →
            </p>
          )}

          {/* Interesting fact box — Wikipedia only */}
          {article.interestingFact && source === 'wikipedia' && (
            <div className="bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-3.5 mb-4 flex gap-2.5">
              <Lightbulb size={15} className="text-accent shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-navy-900 dark:text-white">Did you know? </span>
                {article.interestingFact}
              </p>
            </div>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-600 mb-4 flex-wrap">
            {source === 'wikipedia' && article.readingTimeMin && (
              <span className="flex items-center gap-1">
                <Clock size={11} strokeWidth={2} />
                {article.readingTimeMin} min read
              </span>
            )}
            {(source === 'reddit' || source === 'hackernews') && article.author && (
              <span className="flex items-center gap-1">
                <User size={11} strokeWidth={2} />
                {article.author}
              </span>
            )}
            {(source === 'reddit' || source === 'hackernews') && article.score !== undefined && (
              <span className="flex items-center gap-1">
                <TrendingUp size={11} strokeWidth={2} />
                {formatScore(article.score)}
              </span>
            )}
            {article.publishedAt && (
              <span>{formatDate(article.publishedAt)}</span>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={handleCta}
            className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-navy-900 dark:bg-white text-white dark:text-navy-900 font-bold text-sm tracking-wide hover:opacity-90 active:opacity-80 transition-opacity"
          >
            {ctaLabel}
            {(source === 'reddit' || source === 'hackernews') && (
              <ArrowUpRight size={14} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      {/* Swipe hint */}
      <p className="text-center text-[11px] text-slate-300 dark:text-slate-700 mt-3 select-none tracking-wide">
        ← skip &nbsp;·&nbsp; swipe &nbsp;·&nbsp; save →
      </p>
    </motion.div>
  );
}

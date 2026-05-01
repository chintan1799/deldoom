import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Bookmark, Lightbulb } from 'lucide-react';
import type { Article } from '../types';
import { useAppStore } from '../store/useAppStore';

interface ScrollCardProps {
  article: Article;
  onSave: (article: Article) => void;
  onSkip: (article: Article) => void;
  index: number;
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

export function ScrollCard({ article, onSave, onSkip, index }: ScrollCardProps) {
  const navigate = useNavigate();
  const { isArticleSaved } = useAppStore();
  const [saved, setSaved] = useState(
    article.wikiTitle ? isArticleSaved(article.wikiTitle) : false
  );

  const imageUrl = article.thumbnailUrl || article.imageUrl;
  const source = article.source ?? 'wikipedia';
  const srcCfg = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.wikipedia;
  const animDelay = Math.min(index * 0.05, 0.2);

  function handleCardTap() {
    const slug = source === 'wikipedia' ? article.wikiTitle : article.title;
    navigate(`/article/${encodeURIComponent(slug)}`, { state: { article } });
  }

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (!saved) {
      setSaved(true);
      onSave(article);
    }
  }

  function handleSkip(e: React.MouseEvent) {
    e.stopPropagation();
    onSkip(article);
  }

  function handleDigDeeper(e: React.MouseEvent) {
    e.stopPropagation();
    handleCardTap();
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 260, damping: 28, delay: animDelay }}
      className="mb-4 bg-white dark:bg-navy-950 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-navy-800 cursor-pointer"
      onClick={handleCardTap}
    >
      {/* Hero — 16:9 aspect ratio */}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, ${article.interestColor}22 8px, ${article.interestColor}22 16px)`,
              backgroundColor: `${article.interestColor}0a`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-navy-950 opacity-60" />
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-0">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider ${srcCfg.bg} ${srcCfg.text}`}
          >
            {srcCfg.label}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
            {article.interestEmoji} {article.interestLabel}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-navy-900 dark:text-white leading-tight mb-2">
          {article.title}
        </h3>

        {/* Extract */}
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 mb-3">
          {article.extract}
        </p>

        {/* Did you know */}
        {article.interestingFact && source === 'wikipedia' && (
          <div className="bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl p-3 mb-3 flex gap-2">
            <Lightbulb size={14} className="text-accent shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="font-bold text-navy-900 dark:text-white">Did you know? </span>
              {article.interestingFact}
            </p>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 dark:border-navy-800 mt-1">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-navy-700 text-slate-500 dark:text-slate-400 text-sm font-semibold"
        >
          <X size={14} />
          Skip
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleDigDeeper}
          className="flex-1 flex items-center justify-center py-2.5 rounded-2xl bg-navy-900 dark:bg-white text-white dark:text-navy-900 text-sm font-bold"
        >
          Dig deeper →
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleSave}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors flex-shrink-0 ${
            saved
              ? 'bg-navy-900 dark:bg-white'
              : 'border border-slate-200 dark:border-navy-700'
          }`}
        >
          <Bookmark
            size={16}
            strokeWidth={2}
            className={
              saved
                ? 'text-white dark:text-navy-900 fill-current'
                : 'text-slate-500 dark:text-slate-400'
            }
          />
        </motion.button>
      </div>
    </motion.article>
  );
}

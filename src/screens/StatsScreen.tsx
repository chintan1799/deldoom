import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Dices, Bookmark, BarChart2, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const SOURCE_LABELS: Record<string, string> = {
  wikipedia:    'Wikipedia',
  reddit:       'Reddit',
  hackernews:   'Hacker News',
  techcrunch:   'TechCrunch',
  medium:       'Medium',
  arxiv:        'arXiv',
  nasa:         'NASA',
  sep:          'Philosophy',
  stackexchange:'Stack Exchange',
  owid:         'Our World in Data',
  worldbank:    'World Bank',
  gutenberg:    'Gutenberg',
};

const GROUP_INSIGHTS: Record<string, { emoji: string; title: string; blurb: string }> = {
  'Science':          { emoji: '🔬', title: 'Science Explorer',      blurb: 'You love how the universe works — from subatomic particles to galaxies.' },
  'Technology':       { emoji: '⚡', title: 'Tech Enthusiast',        blurb: 'You stay ahead of the curve, always curious about what\'s next.' },
  'History':          { emoji: '📜', title: 'History Buff',           blurb: 'You find meaning in the past and learn from those who came before.' },
  'Arts':             { emoji: '🎨', title: 'Creative Soul',          blurb: 'You see the world through beauty, expression, and imagination.' },
  'Mind & Society':   { emoji: '🧠', title: 'Deep Thinker',           blurb: 'You reflect on human nature, society, and the big questions of life.' },
  'Sports':           { emoji: '🏆', title: 'Sports Devotee',         blurb: 'You\'re drawn to the thrill of competition and human athleticism.' },
  'Nature':           { emoji: '🌿', title: 'Nature Lover',           blurb: 'You feel at home exploring the living world and our place within it.' },
  'Health':           { emoji: '💪', title: 'Wellness Seeker',        blurb: 'You care deeply about the mind and body — and how they work together.' },
  'Business':         { emoji: '📈', title: 'Business Mind',          blurb: 'You think in systems, value, and strategy.' },
  'Culture':          { emoji: '🌍', title: 'Culture Wanderer',       blurb: 'You\'re fascinated by how people live, believe, and celebrate.' },
  'Weird & Wonderful':{ emoji: '🌀', title: 'Curious Oddball',        blurb: 'You love the bizarre, the unexpected, and the delightfully strange.' },
};

function getDayLabel(daysAgo: number) {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function isSameDay(dateStr: string, daysAgo: number) {
  const target = new Date();
  target.setDate(target.getDate() - daysAgo);
  const d = new Date(dateStr);
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth() &&
    d.getDate() === target.getDate()
  );
}

export function StatsScreen() {
  const navigate = useNavigate();
  const { history, savedArticles, rollCount, streak } = useAppStore();

  const stats = useMemo(() => {
    const total = history.length;
    const saveRate = rollCount > 0 ? Math.round((savedArticles.length / rollCount) * 100) : 0;

    // 7-day activity dots
    const weekActivity = Array.from({ length: 7 }, (_, i) => {
      const daysAgo = 6 - i; // oldest first
      const active = history.some((a) => a.viewedAt && isSameDay(a.viewedAt, daysAgo));
      return { daysAgo, label: getDayLabel(daysAgo), active };
    });

    // Top interests
    const interestCounts: Record<string, { label: string; emoji: string; count: number }> = {};
    for (const a of history) {
      if (!interestCounts[a.interestId]) {
        interestCounts[a.interestId] = { label: a.interestLabel, emoji: a.interestEmoji, count: 0 };
      }
      interestCounts[a.interestId].count++;
    }
    const topInterests = Object.values(interestCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Source mix
    const sourceCounts: Record<string, number> = {};
    for (const a of history) {
      const src = a.source ?? 'wikipedia';
      sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
    }
    const sourceMix = Object.entries(sourceCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([src, count]) => ({
        src,
        label: SOURCE_LABELS[src] ?? src,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }));

    // Personality insight — top interest group in history
    // We don't have group on Article, so infer from interestId prefix pattern
    // Instead derive from top interest label — map to a group using a simple heuristic
    // We'll pick the group of the single most-read interest
    // Since group isn't on the Article type, approximate via top interest emoji patterns
    // Better: load interests data and look up
    const topInterestId = Object.entries(interestCounts)
      .sort(([, a], [, b]) => b.count - a.count)[0]?.[0];

    return { total, saveRate, weekActivity, topInterests, sourceMix, topInterestId };
  }, [history, savedArticles, rollCount]);

  // Load interest group from INTERESTS data for the personality card
  const { topGroup, insight } = useMemo(() => {
    if (!stats.topInterestId) return { topGroup: null, insight: null };
    // Dynamically import would be async; instead inline a lightweight id→group map
    // generated from the same structure used in interests.ts
    const idGroupMap: Record<string, string> = {
      physics: 'Science', chemistry: 'Science', biology: 'Science', mathematics: 'Science',
      astronomy: 'Science', earth_science: 'Science', climate: 'Science',
      medicine: 'Science', nutrition: 'Health', psychology: 'Health', neuroscience: 'Health',
      ai: 'Technology', coding: 'Technology', robotics: 'Technology', space_tech: 'Technology',
      cybersecurity: 'Technology', blockchain: 'Technology', gadgets: 'Technology',
      biotech: 'Technology', internet: 'Technology',
      history: 'History', ancient_history: 'History', military_history: 'History',
      mythology: 'History', medieval: 'History', colonial: 'History', ww2: 'History',
      art: 'Arts', music: 'Arts', cinema: 'Arts', literature: 'Arts',
      architecture: 'Arts', photography: 'Arts', theatre: 'Arts', design: 'Arts',
      philosophy: 'Mind & Society', economics: 'Mind & Society', politics: 'Mind & Society',
      sociology: 'Mind & Society', linguistics: 'Mind & Society', law: 'Mind & Society',
      religion: 'Mind & Society', anthropology: 'Mind & Society', education: 'Mind & Society',
      football: 'Sports', basketball: 'Sports', tennis: 'Sports', cricket: 'Sports',
      combat_sports: 'Sports', olympics: 'Sports', motorsport: 'Sports',
      cycling: 'Sports', baseball: 'Sports',
      ecology: 'Nature', zoology: 'Nature', botany: 'Nature',
      ocean: 'Nature', geology: 'Nature',
      entrepreneurship: 'Business', finance: 'Business',
      culture: 'Culture', food: 'Culture', travel: 'Culture', fashion: 'Culture',
      weird: 'Weird & Wonderful', conspiracy: 'Weird & Wonderful',
      paranormal: 'Weird & Wonderful', urban_legends: 'Weird & Wonderful',
    };
    const group = idGroupMap[stats.topInterestId] ?? 'Science';
    return { topGroup: group, insight: GROUP_INSIGHTS[group] ?? GROUP_INSIGHTS['Science'] };
  }, [stats.topInterestId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-navy-950 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50/90 dark:bg-navy-950/90 backdrop-blur-sm border-b border-slate-100 dark:border-navy-800 flex items-center gap-3 px-5"
        style={{ paddingTop: 'max(20px, env(safe-area-inset-top))', paddingBottom: '16px' }}>
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-white dark:bg-navy-800 flex items-center justify-center shadow-sm">
          <ArrowLeft size={18} strokeWidth={2} className="text-navy-900 dark:text-white" />
        </button>
        <div className="flex items-center gap-2">
          <BarChart2 size={18} strokeWidth={2} className="text-navy-900 dark:text-white" />
          <h1 className="font-black text-lg text-navy-900 dark:text-white tracking-tight">My Stats</h1>
        </div>
      </div>

      <motion.div
        className="px-5 py-5 space-y-6 pb-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Summary tiles */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-navy-900 rounded-2xl px-3 py-4 flex flex-col items-center gap-1 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950 flex items-center justify-center mb-1">
              <Flame size={18} className="text-orange-500" strokeWidth={2} />
            </div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{streak}</p>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 text-center uppercase tracking-wide">Day streak</p>
          </div>
          <div className="bg-white dark:bg-navy-900 rounded-2xl px-3 py-4 flex flex-col items-center gap-1 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-navy-50 dark:bg-navy-800 flex items-center justify-center mb-1">
              <Dices size={18} className="text-navy-900 dark:text-white" strokeWidth={1.8} />
            </div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{rollCount}</p>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 text-center uppercase tracking-wide">Total rolls</p>
          </div>
          <div className="bg-white dark:bg-navy-900 rounded-2xl px-3 py-4 flex flex-col items-center gap-1 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center mb-1">
              <Bookmark size={18} className="text-green-600" strokeWidth={2} />
            </div>
            <p className="text-2xl font-black text-navy-900 dark:text-white">{stats.saveRate}%</p>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 text-center uppercase tracking-wide">Save rate</p>
          </div>
        </motion.div>

        {/* 7-day activity */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-navy-900 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">7-Day Activity</p>
          <div className="flex items-end justify-between gap-1">
            {stats.weekActivity.map(({ daysAgo, label, active }) => (
              <div key={daysAgo} className="flex flex-col items-center gap-1.5 flex-1">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: daysAgo * 0.04, type: 'spring', stiffness: 300 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    active
                      ? 'bg-navy-900 dark:bg-white text-white dark:text-navy-900'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-300 dark:text-navy-600'
                  }`}
                >
                  {active ? '✓' : '·'}
                </motion.div>
                <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wide">
                  {label === 'Today' ? 'Today' : label === 'Yesterday' ? 'Yest.' : label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top interests */}
        {stats.topInterests.length > 0 && (
          <motion.div variants={itemVariants} className="bg-white dark:bg-navy-900 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Top Interests</p>
            <div className="space-y-3">
              {stats.topInterests.map(({ label, emoji, count }, i) => {
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-navy-900 dark:text-white flex items-center gap-1.5">
                        <span>{emoji}</span>{label}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-navy-900 dark:bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Source mix */}
        {stats.sourceMix.length > 0 && (
          <motion.div variants={itemVariants} className="bg-white dark:bg-navy-900 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Source Mix</p>
            <div className="flex flex-wrap gap-2">
              {stats.sourceMix.map(({ src, label, pct }) => (
                <div key={src}
                  className="flex items-center gap-1.5 bg-slate-50 dark:bg-navy-800 rounded-xl px-3 py-1.5">
                  <span className="text-xs font-bold text-navy-900 dark:text-white">{label}</span>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{pct}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Personality insight */}
        {insight && topGroup && (
          <motion.div variants={itemVariants}
            className="bg-navy-900 dark:bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-navy-900/10 flex items-center justify-center text-xl shrink-0">
                {insight.emoji}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={13} className="text-white/60 dark:text-navy-900/60" />
                  <p className="text-[10px] font-black text-white/60 dark:text-navy-900/60 uppercase tracking-widest">Your Personality</p>
                </div>
                <p className="text-lg font-black text-white dark:text-navy-900 leading-tight mb-1">
                  {insight.emoji} {insight.title}
                </p>
                <p className="text-sm text-white/80 dark:text-navy-900/80 leading-relaxed">
                  {insight.blurb}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {stats.total === 0 && (
          <motion.div variants={itemVariants}
            className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-3">📖</p>
            <p className="font-bold text-navy-900 dark:text-white mb-1">Nothing here yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">Start rolling cards to see your learning stats.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

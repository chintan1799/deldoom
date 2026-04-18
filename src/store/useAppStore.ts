import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Article, BehaviourEvent } from '../types';
import { INTERESTS } from '../data/interests';

const MILESTONE_THRESHOLDS = [2, 5, 10, 25, 50, 100];
const BEHAVIOUR_LOG_CAP = 1000;

// ── Selector constants ───────────────────────────────────────────────────────

const FALLBACK_COLORS = ['#7F77DD', '#1D9E75', '#EF9F27', '#378ADD', '#D85A30', '#D4537E'];

const COLOR_MAP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  let i = 0;
  for (const interest of INTERESTS) {
    m[interest.label] = interest.color || FALLBACK_COLORS[i++ % FALLBACK_COLORS.length];
  }
  return m;
})();

const ARCHETYPE_MAP: Record<string, string[]> = {
  Philosopher: [
    'Philosophy', 'Psychology', 'Sociology', 'Religions & Spirituality',
    'Mythology & Legends', 'Languages & Linguistics', 'Law & Justice',
  ],
  Technologist: [
    'AI & Machine Learning', 'Coding & Programming', 'Cybersecurity', 'Robotics',
    'Gadgets & Devices', 'Internet & Web', 'Blockchain & Crypto', 'Biotechnology',
    'Space Technology', 'Entrepreneurship',
  ],
  Historian: [
    'Ancient Civilizations', 'Medieval History', 'Modern History', 'Wars & Conflicts',
    'Archaeology', 'Revolutions', 'Empires & Dynasties', 'Politics',
  ],
  Scientist: [
    'Physics', 'Astronomy', 'Chemistry', 'Biology', 'Neuroscience', 'Mathematics',
    'Earth Science', 'Climate & Environment', 'Genetics', 'Ecology',
    'Medicine', 'Nutrition & Diet', 'Mental Health', 'Inventions & Discoveries',
  ],
  Creative: [
    'Literature', 'Music', 'Cinema & Film', 'Visual Art', 'Architecture',
    'Photography', 'Theatre & Dance', 'Animation & Comics', 'Fashion & Style',
    'Pop Culture', 'Famous People',
  ],
  Explorer: [
    'Travel & Geography', 'Food & Cuisine', 'Animals & Wildlife', 'Oceans & Marine Life',
    'Plants & Botany', 'Birds & Ornithology', 'Geology & Minerals', 'Outdoor & Adventure',
    'Unsolved Mysteries', 'Weird & Wonderful', 'Football / Soccer', 'Basketball',
    'Cricket', 'Tennis', 'Formula 1', 'Olympics', 'Combat Sports', 'Esports & Gaming',
    'Economics', 'Finance & Investing',
  ],
};

const ARCHETYPE_COLORS: Record<string, string> = {
  Philosopher: '#7F77DD',
  Technologist: '#378ADD',
  Historian:    '#D85A30',
  Scientist:    '#1D9E75',
  Creative:     '#D4537E',
  Explorer:     '#EF9F27',
};

// Build reverse lookup: interest label → archetype name
const LABEL_TO_ARCHETYPE: Record<string, string> = {};
for (const [archetype, labels] of Object.entries(ARCHETYPE_MAP)) {
  for (const label of labels) LABEL_TO_ARCHETYPE[label] = archetype;
}
const SEEN_IDS_CAP = 500;
const RECENT_SOURCES_CAP = 4;
const ARTICLE_CACHE_CAP = 100;
const ARTICLE_CACHE_EVICT = 20;

interface AppState {
  selectedInterests: string[];
  savedArticles: Article[];
  history: Article[];
  seenArticleIds: string[];
  recentSources: string[];
  onboardingComplete: boolean;
  streak: number;
  lastActiveDate: string | null;
  rollCount: number;
  darkMode: boolean;
  // Persisted behaviour log
  behaviourLog: BehaviourEvent[];
  // Session-only (not persisted)
  prefetchQueue: Article[];
  isPrefetching: boolean;
  articleCache: Record<string, Article>;
  cacheOrder: string[];
}

interface AppActions {
  toggleInterest: (id: string) => void;
  setInterests: (ids: string[]) => void;
  completeOnboarding: () => void;
  saveArticle: (article: Article) => void;
  unsaveArticle: (wikiTitle: string) => void;
  addToHistory: (article: Article) => void;
  clearHistory: () => void;
  isArticleSaved: (wikiTitle: string) => boolean;
  markArticleSeen: (id: string) => void;
  clearSeenArticles: () => void;
  pushRecentSource: (source: string) => void;
  updateStreak: () => void;
  resetOnboarding: () => void;
  incrementRollCount: () => void;
  isMilestone: (count: number) => boolean;
  toggleDarkMode: () => void;
  pushToPrefetchQueue: (article: Article) => void;
  shiftFromPrefetchQueue: () => Article | null;
  setIsPrefetching: (value: boolean) => void;
  cacheArticle: (article: Article) => void;
  getCachedArticle: (id: string) => Article | undefined;
  logBehaviour: (event: BehaviourEvent) => void;
  getTopInterests: (n: number) => { interest: string; count: number; color: string }[];
  getKnowledgeDNA: () => { label: string; pct: number; color: string }[];
  getMostCuriousAbout: () => string;
  getWeeklyStats: () => { ideasAbsorbed: number; streak: number; saved: number };
}

const today = () => new Date().toISOString().split('T')[0];

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      selectedInterests: [],
      savedArticles: [],
      history: [],
      seenArticleIds: [],
      recentSources: [],
      onboardingComplete: false,
      streak: 0,
      lastActiveDate: null,
      rollCount: 0,
      darkMode: false,
      behaviourLog: [],
      prefetchQueue: [],
      isPrefetching: false,
      articleCache: {},
      cacheOrder: [],

      toggleInterest: (id) =>
        set((state) => ({
          selectedInterests: state.selectedInterests.includes(id)
            ? state.selectedInterests.filter((i) => i !== id)
            : [...state.selectedInterests, id],
        })),

      setInterests: (ids) => set({ selectedInterests: ids }),

      completeOnboarding: () => set({ onboardingComplete: true }),

      saveArticle: (article) =>
        set((state) => {
          if (state.savedArticles.some((a) => a.wikiTitle === article.wikiTitle)) return state;
          return { savedArticles: [article, ...state.savedArticles] };
        }),

      unsaveArticle: (wikiTitle) =>
        set((state) => ({
          savedArticles: state.savedArticles.filter((a) => a.wikiTitle !== wikiTitle),
        })),

      addToHistory: (article) =>
        set((state) => {
          const entry = { ...article, viewedAt: new Date().toISOString() };
          const filtered = state.history.filter((a) => a.pageUrl !== entry.pageUrl);
          return { history: [entry, ...filtered].slice(0, 200) };
        }),

      clearHistory: () => set({ history: [] }),

      isArticleSaved: (wikiTitle) =>
        get().savedArticles.some((a) => a.wikiTitle === wikiTitle),

      markArticleSeen: (id) =>
        set((state) => {
          if (state.seenArticleIds.includes(id)) return state;
          const next = [...state.seenArticleIds, id];
          return { seenArticleIds: next.length > SEEN_IDS_CAP ? next.slice(-SEEN_IDS_CAP) : next };
        }),

      clearSeenArticles: () => set({ seenArticleIds: [] }),

      pushRecentSource: (source) =>
        set((state) => ({
          recentSources: [...state.recentSources, source].slice(-RECENT_SOURCES_CAP),
        })),

      updateStreak: () =>
        set((state) => {
          const todayStr = today();
          if (state.lastActiveDate === todayStr) return state;
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          const newStreak = state.lastActiveDate === yesterdayStr ? state.streak + 1 : 1;
          return { streak: newStreak, lastActiveDate: todayStr };
        }),

      incrementRollCount: () =>
        set((state) => ({ rollCount: state.rollCount + 1 })),

      isMilestone: (count) => MILESTONE_THRESHOLDS.includes(count),

      toggleDarkMode: () =>
        set((state) => ({ darkMode: !state.darkMode })),

      resetOnboarding: () =>
        set({ onboardingComplete: false, selectedInterests: [] }),

      pushToPrefetchQueue: (article) =>
        set((state) => ({ prefetchQueue: [...state.prefetchQueue, article] })),

      shiftFromPrefetchQueue: () => {
        const queue = get().prefetchQueue;
        if (queue.length === 0) return null;
        const [next, ...rest] = queue;
        set({ prefetchQueue: rest });
        return next;
      },

      setIsPrefetching: (value) => set({ isPrefetching: value }),

      cacheArticle: (article) =>
        set((state) => {
          if (state.articleCache[article.id]) return state;
          const nextCache = { ...state.articleCache, [article.id]: article };
          let nextOrder = [...state.cacheOrder, article.id];
          if (nextOrder.length > ARTICLE_CACHE_CAP) {
            const evicted = nextOrder.slice(0, ARTICLE_CACHE_EVICT);
            nextOrder = nextOrder.slice(ARTICLE_CACHE_EVICT);
            for (const id of evicted) delete nextCache[id];
          }
          return { articleCache: nextCache, cacheOrder: nextOrder };
        }),

      getCachedArticle: (id) => get().articleCache[id],

      logBehaviour: (event) =>
        set((state) => {
          const next = [...state.behaviourLog, event];
          return { behaviourLog: next.length > BEHAVIOUR_LOG_CAP ? next.slice(-BEHAVIOUR_LOG_CAP) : next };
        }),

      getTopInterests: (n) => {
        const counts: Record<string, number> = {};
        for (const e of get().behaviourLog) {
          if (e.action !== 'skipped') counts[e.interest] = (counts[e.interest] ?? 0) + 1;
        }
        return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, n)
          .map(([interest, count]) => ({
            interest,
            count,
            color: COLOR_MAP[interest] ?? FALLBACK_COLORS[0],
          }));
      },

      getKnowledgeDNA: () => {
        const archetypeCounts: Record<string, number> = {};
        let total = 0;
        for (const e of get().behaviourLog) {
          if (e.action === 'skipped') continue;
          const arch = LABEL_TO_ARCHETYPE[e.interest];
          if (!arch) continue;
          archetypeCounts[arch] = (archetypeCounts[arch] ?? 0) + 1;
          total++;
        }
        if (total === 0) return [];
        const entries = Object.entries(archetypeCounts)
          .map(([label, count]) => ({ label, pct: Math.round((count / total) * 100), color: ARCHETYPE_COLORS[label] ?? FALLBACK_COLORS[0] }))
          .filter((e) => e.pct > 0)
          .sort((a, b) => b.pct - a.pct);
        // Adjust largest to make sum exactly 100
        const sum = entries.reduce((s, e) => s + e.pct, 0);
        if (entries.length > 0) entries[0].pct += 100 - sum;
        return entries;
      },

      getMostCuriousAbout: () => {
        let best: BehaviourEvent | null = null;
        for (const e of get().behaviourLog) {
          if (e.action !== 'saved' && e.action !== 'dug_deeper') continue;
          if (!best || e.dwellMs > best.dwellMs) best = e;
        }
        if (!best) return '';
        const t = best.title;
        return t.length > 60 ? t.slice(0, 57) + '…' : t;
      },

      getWeeklyStats: () => {
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        let ideasAbsorbed = 0;
        let saved = 0;
        for (const e of get().behaviourLog) {
          if (e.timestamp < cutoff) continue;
          if (e.action === 'read' || e.action === 'dug_deeper') ideasAbsorbed++;
          if (e.action === 'saved') saved++;
        }
        return { ideasAbsorbed, streak: get().streak, saved };
      },
    }),
    {
      name: 'deldoom-storage',
      partialize: (state) => ({
        selectedInterests: state.selectedInterests,
        savedArticles: state.savedArticles,
        history: state.history,
        seenArticleIds: state.seenArticleIds,
        recentSources: state.recentSources,
        onboardingComplete: state.onboardingComplete,
        streak: state.streak,
        lastActiveDate: state.lastActiveDate,
        rollCount: state.rollCount,
        darkMode: state.darkMode,
        behaviourLog: state.behaviourLog,
      }),
    }
  )
);

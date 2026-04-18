import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Article } from '../types';

const MILESTONE_THRESHOLDS = [2, 5, 10, 25, 50, 100];
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
      }),
    }
  )
);

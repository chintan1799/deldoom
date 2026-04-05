import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Article } from '../types';

const MILESTONE_THRESHOLDS = [2, 5, 10, 25, 50, 100];

interface AppState {
  selectedInterests: string[];
  savedArticles: Article[];
  history: Article[];
  onboardingComplete: boolean;
  streak: number;
  lastActiveDate: string | null;
  rollCount: number;
  darkMode: boolean;
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
  updateStreak: () => void;
  resetOnboarding: () => void;
  incrementRollCount: () => void;
  isMilestone: (count: number) => boolean;
  toggleDarkMode: () => void;
}

const today = () => new Date().toISOString().split('T')[0];

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      selectedInterests: [],
      savedArticles: [],
      history: [],
      onboardingComplete: false,
      streak: 0,
      lastActiveDate: null,
      rollCount: 0,
      darkMode: false,

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
    }),
    {
      name: 'deldoom-storage',
      partialize: (state) => ({
        selectedInterests: state.selectedInterests,
        savedArticles: state.savedArticles,
        history: state.history,
        onboardingComplete: state.onboardingComplete,
        streak: state.streak,
        lastActiveDate: state.lastActiveDate,
        rollCount: state.rollCount,
        darkMode: state.darkMode,
      }),
    }
  )
);

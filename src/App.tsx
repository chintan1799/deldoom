import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ArticleScreen } from './screens/ArticleScreen';
import { SavedScreen } from './screens/SavedScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { StatsScreen } from './screens/StatsScreen';
import { CardPreviewScreen } from './screens/CardPreviewScreen';

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  const location = useLocation();
  const darkMode = useAppStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route
          path="/home"
          element={
            <RequireOnboarding>
              <HomeScreen />
            </RequireOnboarding>
          }
        />
        <Route
          path="/article/:wikiTitle"
          element={
            <RequireOnboarding>
              <ArticleScreen />
            </RequireOnboarding>
          }
        />
        <Route
          path="/saved"
          element={
            <RequireOnboarding>
              <SavedScreen />
            </RequireOnboarding>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireOnboarding>
              <SettingsScreen />
            </RequireOnboarding>
          }
        />
        <Route
          path="/stats"
          element={
            <RequireOnboarding>
              <StatsScreen />
            </RequireOnboarding>
          }
        />
        <Route path="/card-preview" element={<CardPreviewScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

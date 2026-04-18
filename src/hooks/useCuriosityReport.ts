import { useAppStore } from '../store/useAppStore';
import type { CuriosityReportData } from '../components/CuriosityReportCard';

export function useCuriosityReport(): CuriosityReportData {
  const getKnowledgeDNA = useAppStore((s) => s.getKnowledgeDNA);
  const getTopInterests = useAppStore((s) => s.getTopInterests);
  const getWeeklyStats = useAppStore((s) => s.getWeeklyStats);
  const getMostCuriousAbout = useAppStore((s) => s.getMostCuriousAbout);
  // Subscribe to behaviourLog so report updates when events land
  useAppStore((s) => s.behaviourLog);

  const weekLabel = `Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return {
    userName: 'Your',
    weekLabel,
    dna: getKnowledgeDNA(),
    topInterests: getTopInterests(4),
    stats: getWeeklyStats(),
    mostCuriousAbout: getMostCuriousAbout(),
  };
}

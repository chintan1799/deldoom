import { CuriosityReportCard, CuriosityReportData } from '../components/CuriosityReportCard';

const MOCK: CuriosityReportData = {
  userName: 'Your',
  weekLabel: 'Week of Apr 14',
  dna: [
    { label: 'Philosopher',  pct: 42, color: '#7F77DD' },
    { label: 'Scientist',    pct: 33, color: '#1D9E75' },
    { label: 'Historian',    pct: 25, color: '#D85A30' },
  ],
  topInterests: [
    { interest: 'Philosophy',   count: 12, color: '#7F77DD' },
    { interest: 'Neuroscience', count:  9, color: '#F59E0B' },
    { interest: 'Mythology',    count:  6, color: '#EF9F27' },
    { interest: 'Physics',      count:  4, color: '#6366F1' },
  ],
  stats: { ideasAbsorbed: 31, streak: 7, saved: 12 },
  mostCuriousAbout: 'The unreasonable effectiveness of mathematics',
};

export function CardPreviewScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#e2e8f0',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
      }}
    >
      <h1 style={{ fontFamily: 'Inter', fontWeight: 800, color: '#0f172a' }}>
        Curiosity Report — Preview
      </h1>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Inter', fontWeight: 700, color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>
            Light
          </div>
          <CuriosityReportCard theme="light" data={MOCK} />
        </div>
        <div>
          <div style={{ fontFamily: 'Inter', fontWeight: 700, color: '#f8fafc', marginBottom: 8, textAlign: 'center' }}>
            Dark
          </div>
          <CuriosityReportCard theme="dark" data={MOCK} />
        </div>
      </div>
    </div>
  );
}

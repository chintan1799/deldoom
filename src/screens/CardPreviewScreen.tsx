import { CuriosityReportCard } from '../components/CuriosityReportCard';
import { useCuriosityReport } from '../hooks/useCuriosityReport';

export function CardPreviewScreen() {
  const data = useCuriosityReport();

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
          <CuriosityReportCard theme="light" data={data} />
        </div>
        <div>
          <div style={{ fontFamily: 'Inter', fontWeight: 700, color: '#f8fafc', marginBottom: 8, textAlign: 'center' }}>
            Dark
          </div>
          <CuriosityReportCard theme="dark" data={data} />
        </div>
      </div>
    </div>
  );
}

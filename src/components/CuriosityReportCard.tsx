import { forwardRef, CSSProperties } from 'react';

// ── Theme palettes (hardcoded hex only — html2canvas can't resolve CSS vars) ──

interface Palette {
  background: string;
  headline: string;
  subline: string;
  chipBg: string;
  chipBorder: string;
  chipText: string;
  barTrack: string;
  statNumber: string;
  statLabel: string;
  divider: string;
  ideaBoxBg: string;
  ideaBoxBorder: string;
  ideaText: string;
  footerText: string;
  footerUrl: string;
  brand: string;
  glowColor: string;
  glowOpacity: number;
}

const LIGHT: Palette = {
  background:    '#F0F6FF',
  headline:      '#1A2B3C',
  subline:       '#7A95AA',
  chipBg:        '#EEF5FF',
  chipBorder:    '#C2D8EE',
  chipText:      '#3A6080',
  barTrack:      '#DCEDF8',
  statNumber:    '#1A2B3C',
  statLabel:     '#9BBACF',
  divider:       '#D5E8F5',
  ideaBoxBg:     '#FFFFFF',
  ideaBoxBorder: '#C2D8EE',
  ideaText:      '#2E4A60',
  footerText:    '#AABFCF',
  footerUrl:     '#5A9EC9',
  brand:         '#7AAFD4',
  glowColor:     '#B8D8F8',
  glowOpacity:   0.25,
};

const DARK: Palette = {
  background:    '#0D0D0F',
  headline:      '#FFFFFF',
  subline:       '#617282',
  chipBg:        '#1A1A22',
  chipBorder:    '#2A2A38',
  chipText:      '#A0A8C0',
  barTrack:      '#1E1E28',
  statNumber:    '#FFFFFF',
  statLabel:     '#4A5568',
  divider:       '#1E1E28',
  ideaBoxBg:     '#141418',
  ideaBoxBorder: '#252530',
  ideaText:      '#8892A4',
  footerText:    '#343444',
  footerUrl:     '#6340B4',
  brand:         '#4A4A6A',
  glowColor:     '#3D1F8C',
  glowOpacity:   0.15,
};

// ── Props ────────────────────────────────────────────────────────────────────

export interface CuriosityReportData {
  userName: string;
  weekLabel: string;
  dna: { label: string; pct: number; color: string }[];
  topInterests: { interest: string; count: number; color: string }[];
  stats: { ideasAbsorbed: number; streak: number; saved: number };
  mostCuriousAbout: string;
}

interface Props {
  theme: 'light' | 'dark';
  data: CuriosityReportData;
}

// ── Component ────────────────────────────────────────────────────────────────

export const CuriosityReportCard = forwardRef<HTMLDivElement, Props>(
  function CuriosityReportCard({ theme, data }, ref) {
    const p = theme === 'dark' ? DARK : LIGHT;

    const topInterests = data.topInterests.slice(0, 4);
    const topDna = data.dna.slice(0, 3);
    const maxCount = Math.max(1, ...topInterests.map((t) => t.count));

    const container: CSSProperties = {
      position: 'relative',
      width: 400,
      height: 520,
      background: p.background,
      color: p.headline,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '22px 24px 18px 24px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      borderRadius: 0,
    };

    const glow: CSSProperties = {
      position: 'absolute',
      top: -30,
      right: -30,
      width: 120,
      height: 120,
      borderRadius: '50%',
      background: p.glowColor,
      opacity: p.glowOpacity,
      boxShadow: `0 0 60px 40px ${p.glowColor}`,
      pointerEvents: 'none',
    };

    const header: CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      zIndex: 1,
    };

    const brandText: CSSProperties = {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: p.brand,
    };

    const weekText: CSSProperties = {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: p.subline,
    };

    const headline: CSSProperties = {
      fontSize: 24,
      fontWeight: 900,
      lineHeight: 1.15,
      margin: '18px 0 6px 0',
      color: p.headline,
      letterSpacing: -0.4,
      position: 'relative',
      zIndex: 1,
    };

    const subline: CSSProperties = {
      fontSize: 12,
      fontWeight: 500,
      color: p.subline,
      marginBottom: 14,
      position: 'relative',
      zIndex: 1,
    };

    const chipsRow: CSSProperties = {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 16,
      position: 'relative',
      zIndex: 1,
    };

    const chipDot = (color: string): CSSProperties => ({
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: color,
      display: 'inline-block',
    });

    const sectionLabel: CSSProperties = {
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: p.statLabel,
      marginBottom: 10,
    };

    const barRow: CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 18,
      marginBottom: 8,
    };

    const barLabel: CSSProperties = {
      width: 96,
      flexShrink: 0,
      fontSize: 11,
      fontWeight: 600,
      color: p.headline,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };

    const barTrack: CSSProperties = {
      flex: 1,
      height: 8,
      background: p.barTrack,
      borderRadius: 4,
      overflow: 'hidden',
      position: 'relative',
    };

    const barCount: CSSProperties = {
      width: 28,
      flexShrink: 0,
      textAlign: 'right',
      fontSize: 11,
      fontWeight: 700,
      color: p.headline,
    };

    const divider: CSSProperties = {
      height: 1,
      background: p.divider,
      margin: '16px 0',
    };

    const statsRow: CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8,
    };

    const statCell: CSSProperties = {
      flex: 1,
      textAlign: 'center',
    };

    const statNumber: CSSProperties = {
      fontSize: 22,
      fontWeight: 900,
      color: p.statNumber,
      lineHeight: 1.1,
      letterSpacing: -0.4,
    };

    const statLabel: CSSProperties = {
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: p.statLabel,
      marginTop: 4,
    };

    const ideaBox: CSSProperties = {
      background: p.ideaBoxBg,
      border: `1px solid ${p.ideaBoxBorder}`,
      borderRadius: 12,
      padding: '12px 14px',
      marginTop: 14,
    };

    const ideaLabel: CSSProperties = {
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: p.statLabel,
      marginBottom: 6,
    };

    const ideaText: CSSProperties = {
      fontSize: 13,
      fontWeight: 600,
      color: p.ideaText,
      lineHeight: 1.35,
      fontStyle: 'italic',
    };

    const footer: CSSProperties = {
      position: 'absolute',
      left: 24,
      right: 24,
      bottom: 18,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: 0.4,
    };

    return (
      <div ref={ref} style={container}>
        {/* Glow */}
        <div style={glow} />

        {/* Header */}
        <div style={header}>
          <span style={brandText}>deldoom</span>
          <span style={weekText}>{data.weekLabel}</span>
        </div>

        {/* Headline + subline */}
        <h1 style={headline}>{data.userName}'s Curiosity Report</h1>
        <div style={subline}>
          7-day snapshot · {data.stats.ideasAbsorbed} ideas absorbed
        </div>

        {/* DNA chips (top 3) */}
        <div style={chipsRow}>
          {topDna.map((d) => (
            <span
              key={d.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px 5px 8px',
                background: p.chipBg,
                border: `1px solid ${p.chipBorder}`,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                color: p.chipText,
                letterSpacing: 0.2,
              }}
            >
              <span style={chipDot(d.color)} />
              {d.label} {d.pct}%
            </span>
          ))}
        </div>

        {/* Curiosity graph */}
        <div style={sectionLabel}>Curiosity graph</div>
        <div>
          {topInterests.map((t) => {
            const pct = Math.max(4, (t.count / maxCount) * 100);
            return (
              <div key={t.interest} style={barRow}>
                <div style={barLabel}>{t.interest}</div>
                <div style={barTrack}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: t.color,
                      borderRadius: 4,
                    }}
                  />
                </div>
                <div style={barCount}>{t.count}</div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div style={divider} />

        {/* Stats row */}
        <div style={statsRow}>
          <div style={statCell}>
            <div style={statNumber}>{data.stats.ideasAbsorbed}</div>
            <div style={statLabel}>Ideas absorbed</div>
          </div>
          <div style={statCell}>
            <div style={statNumber}>{data.stats.streak}</div>
            <div style={statLabel}>Day streak</div>
          </div>
          <div style={statCell}>
            <div style={statNumber}>{data.stats.saved}</div>
            <div style={statLabel}>Saved</div>
          </div>
        </div>

        {/* Most curious about */}
        <div style={ideaBox}>
          <div style={ideaLabel}>Most curious about</div>
          <div style={ideaText}>
            {data.mostCuriousAbout ? `"${data.mostCuriousAbout}"` : '—'}
          </div>
        </div>

        {/* Footer */}
        <div style={footer}>
          <span style={{ color: p.footerText }}>curiosity never stops</span>
          <span style={{ color: p.footerUrl }}>deldoom.app</span>
        </div>
      </div>
    );
  }
);

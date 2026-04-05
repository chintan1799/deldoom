import type { Article, InterestCategory } from '../types';

interface WBData {
  value: number | null;
  date: string;
  country: { value: string };
  indicator: { value: string };
}

interface WBResponse {
  1: WBData[];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const INDICATORS = [
  { code: 'SP.DYN.LE00.IN',  label: 'life expectancy',            unit: ' years',      context: 'at birth' },
  { code: 'NY.GDP.PCAP.CD',  label: 'GDP per capita',             unit: ' USD',        context: 'current prices' },
  { code: 'SE.ADT.LITR.ZS',  label: 'adult literacy rate',        unit: '%',           context: 'of population' },
  { code: 'EG.FEC.RNEW.ZS',  label: 'renewable energy share',     unit: '%',           context: 'of total energy' },
  { code: 'SH.DYN.MORT',     label: 'child mortality rate',       unit: ' per 1,000',  context: 'under age 5' },
  { code: 'SP.URB.TOTL.IN.ZS',label: 'urban population share',   unit: '%',           context: 'of total population' },
  { code: 'IT.NET.USER.ZS',  label: 'internet usage rate',        unit: '%',           context: 'of population' },
  { code: 'SE.XPD.TOTL.GD.ZS',label: 'education spending',       unit: '% of GDP',    context: 'public expenditure' },
  { code: 'SH.XPD.CHEX.GD.ZS',label: 'healthcare spending',      unit: '% of GDP',    context: 'current expenditure' },
  { code: 'EN.ATM.CO2E.PC',  label: 'CO₂ emissions per capita',   unit: ' tonnes',     context: 'per year' },
  { code: 'SP.POP.TOTL',     label: 'total population',           unit: '',            context: 'people' },
  { code: 'SL.UEM.TOTL.ZS',  label: 'unemployment rate',         unit: '%',           context: 'of total labor force' },
  { code: 'SI.POV.GINI',     label: 'Gini inequality index',      unit: '',            context: '(0=perfect equality, 100=extreme inequality)' },
  { code: 'AG.LND.FRST.ZS',  label: 'forest coverage',           unit: '% of land',   context: '' },
  { code: 'SH.STA.OWAD.ZS',  label: 'overweight adult rate',     unit: '%',           context: 'of adults' },
];

// A curated list of interesting countries (not just G7)
const COUNTRIES = [
  'US', 'CN', 'IN', 'BR', 'NG', 'ID', 'PK', 'BD', 'ET', 'MX',
  'PH', 'EG', 'CD', 'TZ', 'KE', 'ZA', 'AR', 'CO', 'DZ', 'SD',
  'JP', 'DE', 'GB', 'FR', 'IT', 'CA', 'KR', 'ES', 'AU', 'NL',
  'SE', 'NO', 'FI', 'DK', 'IS', 'NZ', 'SG', 'CH', 'AT', 'BE',
];

function formatValue(value: number, unit: string): string {
  if (unit === ' USD') {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${Math.round(value).toLocaleString()}`;
  }
  if (unit === '') return value.toLocaleString();
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M${unit}`;
  if (value % 1 === 0) return `${value.toLocaleString()}${unit}`;
  return `${value.toFixed(1)}${unit}`;
}

export async function fetchWorldBankArticle(
  interest: InterestCategory
): Promise<Article | null> {
  try {
    const indicator = pickRandom(INDICATORS);
    const countryCode = pickRandom(COUNTRIES);

    const res = await fetch(
      `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator.code}?format=json&mrv=5&per_page=5`
    );
    if (!res.ok) return null;

    const raw: [unknown, WBData[]] = await res.json();
    const data = raw[1]?.filter((d) => d.value !== null);
    if (!data || data.length === 0) return null;

    const latest = data[0];
    const country = latest.country.value;
    const value = latest.value!;
    const year = latest.date;

    const formatted = formatValue(value, indicator.unit);
    const extract = `In ${year}, ${country}'s ${indicator.label} was ${formatted}${indicator.context ? ` (${indicator.context})` : ''}. This data comes from the World Bank's open development dataset, which tracks indicators across 200+ countries.`;

    // Fun fact: compare to oldest data point if available
    const oldest = data[data.length - 1];
    let interestingFact: string | undefined;
    if (oldest && oldest.value !== null && oldest.date !== year) {
      const oldVal = formatValue(oldest.value, indicator.unit);
      const change = ((value - oldest.value) / oldest.value * 100).toFixed(1);
      const direction = value > oldest.value ? 'up' : 'down';
      interestingFact = `${country}'s ${indicator.label} has changed ${direction} ${Math.abs(parseFloat(change))}% since ${oldest.date} (was ${oldVal}).`;
    }

    return {
      title: `${country}: ${indicator.label}`,
      description: 'World Bank Open Data',
      extract,
      interestingFact,
      pageUrl: `https://data.worldbank.org/indicator/${indicator.code}?locations=${countryCode}`,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'worldbank',
    };
  } catch {
    return null;
  }
}

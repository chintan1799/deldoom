import type { Article, InterestCategory } from '../types';
import { fetchHFRows, randomOffset } from './huggingface';

interface XsumRow {
  document: string;
  summary: string;
  id: string;
}

const TOTAL_ROWS = 226_711;
const CACHE_TTL = 10 * 60 * 1000;
let cache: { rows: XsumRow[]; ts: number } | null = null;

async function getRows(): Promise<XsumRow[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.rows;
  const offset = randomOffset(TOTAL_ROWS, 30);
  const { rows } = await fetchHFRows<XsumRow>(
    'EdinburghNLP/xsum',
    'train',
    offset,
    30
  );
  cache = { rows, ts: Date.now() };
  return rows;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function deriveTitle(summary: string): string {
  // Take first sentence up to 80 chars as the headline
  const firstSentence = summary.split(/[.!?]/)[0].trim();
  return firstSentence.length > 80
    ? firstSentence.slice(0, 77) + '...'
    : firstSentence;
}

export async function fetchXsumArticle(
  interest: InterestCategory
): Promise<Article | null> {
  try {
    const rows = await getRows();
    if (rows.length === 0) return null;

    const valid = rows.filter((r) => r.summary && r.summary.length > 30);
    if (valid.length === 0) return null;

    const row = pickRandom(valid);
    const title = deriveTitle(row.summary);

    // xsum IDs are BBC article URL suffixes
    const pageUrl = row.id
      ? `https://www.bbc.co.uk/news/${row.id}`
      : 'https://www.bbc.co.uk/news';

    return {
      title,
      description: 'BBC News',
      extract: row.summary,
      interestingFact: undefined,
      thumbnailUrl: undefined,
      pageUrl,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'xsum',
    };
  } catch {
    return null;
  }
}

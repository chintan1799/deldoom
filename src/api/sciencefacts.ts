import type { Article, InterestCategory } from '../types';
import { fetchHFRows, randomOffset } from './huggingface';

interface ScienceFactRow {
  fact?: string;
  Fact?: string;
  category?: string;
  Category?: string;
  source_url?: string;
  source?: string;
}

const TOTAL_ROWS = 10003;
const CACHE_TTL = 30 * 60 * 1000;
let cache: { rows: ScienceFactRow[]; ts: number } | null = null;

async function getRows(): Promise<ScienceFactRow[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.rows;
  const offset = randomOffset(TOTAL_ROWS, 50);
  const { rows } = await fetchHFRows<ScienceFactRow>(
    'Royal-lobster/10001-Science-Facts',
    'train',
    offset,
    50
  );
  cache = { rows, ts: Date.now() };
  return rows;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function fetchScienceFactArticle(
  interest: InterestCategory
): Promise<Article | null> {
  try {
    const rows = await getRows();
    if (rows.length === 0) return null;

    const row = pickRandom(rows);
    const fact = row.fact ?? row.Fact ?? '';
    const category = row.category ?? row.Category ?? 'Science';
    const pageUrl =
      row.source_url ??
      row.source ??
      'https://huggingface.co/datasets/Royal-lobster/10001-Science-Facts';

    if (!fact || fact.length < 20) return null;

    return {
      title: `${category.charAt(0).toUpperCase()}${category.slice(1)} Fact`,
      description: 'Science Facts',
      extract: fact,
      interestingFact: undefined,
      thumbnailUrl: undefined,
      pageUrl,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'sciencefacts',
    };
  } catch {
    return null;
  }
}

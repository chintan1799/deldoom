import type { Article, InterestCategory } from '../types';
import { fetchHFRows, randomOffset } from './huggingface';

interface NanoWikiRow {
  title?: string;
  text?: string;
  content?: string;
  summary?: string;
}

// Conservative estimate — dataset is small (1K-10K rows)
const TOTAL_ROWS = 5000;
const CACHE_TTL = 30 * 60 * 1000;
let cache: { rows: NanoWikiRow[]; ts: number } | null = null;

async function getRows(): Promise<NanoWikiRow[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.rows;
  const offset = randomOffset(TOTAL_ROWS, 30);
  try {
    const { rows, total } = await fetchHFRows<NanoWikiRow>(
      'sixf0ur/nano_wiki',
      'train',
      offset,
      30
    );
    // Update total on first successful fetch
    cache = { rows, ts: Date.now() };
    void total;
    return rows;
  } catch {
    // If offset was out of range, try from start
    const { rows } = await fetchHFRows<NanoWikiRow>(
      'sixf0ur/nano_wiki',
      'train',
      0,
      30
    );
    cache = { rows, ts: Date.now() };
    return rows;
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function fetchNanoWikiArticle(
  interest: InterestCategory
): Promise<Article | null> {
  try {
    const rows = await getRows();
    if (rows.length === 0) return null;

    const valid = rows.filter(
      (r) => (r.title || r.text) && (r.text ?? r.content ?? '').length > 50
    );
    if (valid.length === 0) return null;

    const row = pickRandom(valid);
    const title = row.title ?? 'Encyclopedia Entry';
    const text = row.text ?? row.content ?? row.summary ?? '';

    if (text.length < 50) return null;

    return {
      title,
      description: 'Simple Encyclopedia',
      extract: text.slice(0, 600),
      interestingFact: undefined,
      thumbnailUrl: undefined,
      pageUrl: `https://simple.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'nanowiki',
    };
  } catch {
    return null;
  }
}

import type { Article, InterestCategory } from '../types';

interface SEQuestion {
  question_id: number;
  title: string;
  body: string;
  score: number;
  tags: string[];
  creation_date: number;
  owner: { display_name: string };
  link: string;
}

interface SEResponse {
  items: SEQuestion[];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function stripHtml(html: string): string {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() ?? '';
}

const _cache: Map<string, { items: SEQuestion[]; expires: number }> = new Map();

async function fetchSeQuestions(site: string, tag: string): Promise<SEQuestion[]> {
  const key = `${site}:${tag}`;
  const cached = _cache.get(key);
  if (cached && Date.now() < cached.expires) return cached.items;

  const seUrl = `https://api.stackexchange.com/2.3/questions?order=desc&sort=votes&site=${site}&tagged=${encodeURIComponent(tag)}&pagesize=30&filter=withbody`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(seUrl)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`SE fetch failed for ${site}/${tag}`);
  const json: SEResponse = await res.json();
  if (!json.items?.length) throw new Error('No SE items');

  const filtered = json.items.filter((q) => q.score > 50);
  _cache.set(key, { items: filtered, expires: Date.now() + 15 * 60 * 1000 });
  return filtered;
}

export async function fetchStackExchangeArticle(
  interest: InterestCategory
): Promise<Article | null> {
  const site = interest.stackExchangeSite;
  const tags = interest.seStackTags;
  if (!site || !tags || tags.length === 0) return null;

  try {
    const tag = pickRandom(tags);
    const items = await fetchSeQuestions(site, tag);
    const valid = items.filter((q) => {
      const text = stripHtml(q.body);
      return text.length > 100;
    });
    if (!valid.length) return null;

    const item = pickRandom(valid);
    const extract = stripHtml(item.body).slice(0, 500);

    return {
      title: item.title,
      description: `Stack Exchange · ${site}`,
      extract,
      pageUrl: item.link,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'stackexchange',
      author: item.owner?.display_name,
      publishedAt: new Date(item.creation_date * 1000).toISOString(),
      score: item.score,
    };
  } catch {
    return null;
  }
}

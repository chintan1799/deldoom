import type { Article, InterestCategory } from '../types';

interface Rss2JsonItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  author: string;
  thumbnail: string;
}

interface Rss2JsonResponse {
  status: string;
  items: Rss2JsonItem[];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function stripHtml(html: string): string {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() ?? '';
}

const _cache: Map<string, { items: Rss2JsonItem[]; expires: number }> = new Map();

async function fetchMediumFeed(tag: string): Promise<Rss2JsonItem[]> {
  const cached = _cache.get(tag);
  if (cached && Date.now() < cached.expires) return cached.items;

  const feedUrl = encodeURIComponent(`https://medium.com/feed/tag/${encodeURIComponent(tag)}`);
  const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}&count=40`);
  if (!res.ok) throw new Error(`Medium feed failed for tag: ${tag}`);
  const json: Rss2JsonResponse = await res.json();
  if (json.status !== 'ok' || !json.items?.length) throw new Error('No Medium items');

  _cache.set(tag, { items: json.items, expires: Date.now() + 10 * 60 * 1000 });
  return json.items;
}

export async function fetchMediumArticle(
  interest: InterestCategory
): Promise<Article | null> {
  const tags = interest.mediumTags;
  if (!tags || tags.length === 0) return null;

  try {
    const tag = pickRandom(tags);
    const items = await fetchMediumFeed(tag);
    const valid = items.filter((i) => {
      const text = stripHtml(i.description);
      return i.title.length > 15 && text.length > 100;
    });
    if (!valid.length) return null;

    const item = pickRandom(valid);
    const extract = stripHtml(item.description).slice(0, 500);

    return {
      title: item.title,
      description: `Medium · #${tag}`,
      extract,
      pageUrl: item.link,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'medium',
      author: item.author || 'Medium',
      publishedAt: item.pubDate,
      thumbnailUrl: item.thumbnail?.startsWith('http') ? item.thumbnail : undefined,
    };
  } catch {
    return null;
  }
}

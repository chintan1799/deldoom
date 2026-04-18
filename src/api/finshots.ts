import type { Article, InterestCategory } from '../types';
import { djb2 } from './utils';

interface Rss2JsonItem {
  title: string;
  description: string;
  content?: string;
  link: string;
  guid: string;
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

let _cache: { items: Rss2JsonItem[]; expires: number } | null = null;

async function fetchFeed(): Promise<Rss2JsonItem[]> {
  if (_cache && Date.now() < _cache.expires) return _cache.items;

  const url = encodeURIComponent('https://backend.finshots.in/backend/contents/feed');
  const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${url}&count=40`);
  if (!res.ok) throw new Error('Finshots feed failed');
  const json: Rss2JsonResponse = await res.json();
  if (json.status !== 'ok' || !json.items?.length) throw new Error('No Finshots items');

  _cache = { items: json.items, expires: Date.now() + 10 * 60 * 1000 };
  return _cache.items;
}

export async function fetchFinshotsArticle(
  interest: InterestCategory
): Promise<Article | null> {
  if (!interest.hasFinshots) return null;

  try {
    const items = await fetchFeed();
    const valid = items.filter((i) => {
      const raw = i.content || i.description;
      const text = stripHtml(raw);
      return i.title.length > 15 && text.length >= 400;
    });
    if (!valid.length) return null;

    const item = pickRandom(valid);
    const raw = item.content || item.description;
    const extract = stripHtml(raw).slice(0, 1800);

    return {
      id: `finshots_${djb2(item.link || item.guid)}`,
      title: item.title,
      description: 'Finshots',
      extract,
      pageUrl: item.link,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'finshots',
      author: item.author || 'Finshots',
      publishedAt: item.pubDate,
      thumbnailUrl: item.thumbnail?.startsWith('http') ? item.thumbnail : undefined,
    };
  } catch {
    return null;
  }
}

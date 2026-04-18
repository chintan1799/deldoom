import type { Article, InterestCategory } from '../types';
import { djb2 } from './utils';

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

let _cache: Rss2JsonItem[] | null = null;

async function fetchFeed(): Promise<Rss2JsonItem[]> {
  if (_cache) return _cache;
  const url = encodeURIComponent('https://techcrunch.com/feed/');
  const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${url}&count=40`);
  if (!res.ok) throw new Error('TechCrunch feed failed');
  const json: Rss2JsonResponse = await res.json();
  if (json.status !== 'ok' || !json.items?.length) throw new Error('No TC items');
  _cache = json.items;
  // Expire cache after 10 min
  setTimeout(() => { _cache = null; }, 10 * 60 * 1000);
  return _cache;
}

export async function fetchTechCrunchArticle(
  interest: InterestCategory
): Promise<Article | null> {
  try {
    const items = await fetchFeed();
    const valid = items.filter((i) => {
      const text = stripHtml(i.description);
      return i.title.length > 15 && text.length > 100;
    });
    if (!valid.length) return null;

    const item = pickRandom(valid);
    const extract = stripHtml(item.description).slice(0, 500);

    return {
      id: `tc_${djb2(item.link)}`,
      title: item.title,
      description: 'TechCrunch',
      extract,
      pageUrl: item.link,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'techcrunch',
      author: item.author || 'TechCrunch',
      publishedAt: item.pubDate,
      thumbnailUrl: item.thumbnail?.startsWith('http') ? item.thumbnail : undefined,
    };
  } catch {
    return null;
  }
}

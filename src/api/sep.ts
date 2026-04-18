import type { Article, InterestCategory } from '../types';
import { djb2 } from './utils';

interface Rss2JsonItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  author: string;
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

async function fetchSepFeed(): Promise<Rss2JsonItem[]> {
  if (_cache) return _cache;
  const feedUrl = encodeURIComponent('https://plato.stanford.edu/rss/sep.xml');
  const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}&count=50`);
  if (!res.ok) throw new Error('SEP feed failed');
  const json: Rss2JsonResponse = await res.json();
  if (json.status !== 'ok' || !json.items?.length) throw new Error('No SEP items');
  _cache = json.items;
  setTimeout(() => { _cache = null; }, 60 * 60 * 1000); // 1 hour cache
  return _cache;
}

export async function fetchSepArticle(
  interest: InterestCategory
): Promise<Article | null> {
  if (!interest.hasSep) return null;

  try {
    const items = await fetchSepFeed();
    const valid = items.filter((i) => {
      const text = stripHtml(i.description);
      return i.title.length > 5 && text.length > 80;
    });
    if (!valid.length) return null;

    const item = pickRandom(valid);
    const extract = stripHtml(item.description).slice(0, 500);

    return {
      id: `sep_${djb2(item.link)}`,
      title: item.title,
      description: 'Stanford Encyclopedia of Philosophy',
      extract,
      pageUrl: item.link,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'sep',
      publishedAt: item.pubDate,
    };
  } catch {
    return null;
  }
}

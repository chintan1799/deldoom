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

let _cache: Rss2JsonItem[] | null = null;

async function fetchOwidFeed(): Promise<Rss2JsonItem[]> {
  if (_cache) return _cache;
  const feedUrl = encodeURIComponent('https://ourworldindata.org/atom.xml');
  const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}&count=40`);
  if (!res.ok) throw new Error('OWID feed failed');
  const json: Rss2JsonResponse = await res.json();
  if (json.status !== 'ok' || !json.items?.length) throw new Error('No OWID items');
  _cache = json.items;
  setTimeout(() => { _cache = null; }, 30 * 60 * 1000);
  return _cache;
}

export async function fetchOwidArticle(
  interest: InterestCategory
): Promise<Article | null> {
  if (!interest.hasOwid) return null;

  try {
    const items = await fetchOwidFeed();
    const valid = items.filter((i) => {
      const text = stripHtml(i.description);
      return i.title.length > 10 && text.length > 80;
    });
    if (!valid.length) return null;

    const item = pickRandom(valid);
    const extract = stripHtml(item.description).slice(0, 500);

    return {
      title: item.title,
      description: 'Our World in Data',
      extract,
      pageUrl: item.link,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'owid',
      author: item.author || 'Our World in Data',
      publishedAt: item.pubDate,
      thumbnailUrl: item.thumbnail?.startsWith('http') ? item.thumbnail : undefined,
    };
  } catch {
    return null;
  }
}

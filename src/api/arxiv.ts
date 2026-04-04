import type { Article, InterestCategory } from '../types';

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

const _cache: Map<string, { items: Rss2JsonItem[]; expires: number }> = new Map();

async function fetchArxivFeed(category: string): Promise<Rss2JsonItem[]> {
  const cached = _cache.get(category);
  if (cached && Date.now() < cached.expires) return cached.items;

  const atomUrl = `https://export.arxiv.org/api/query?search_query=cat:${category}&start=0&max_results=30&sortBy=submittedDate&sortOrder=descending`;
  const feedUrl = encodeURIComponent(atomUrl);
  const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}&count=30`);
  if (!res.ok) throw new Error(`arXiv feed failed for category: ${category}`);
  const json: Rss2JsonResponse = await res.json();
  if (json.status !== 'ok' || !json.items?.length) throw new Error('No arXiv items');

  _cache.set(category, { items: json.items, expires: Date.now() + 15 * 60 * 1000 });
  return json.items;
}

export async function fetchArxivArticle(
  interest: InterestCategory
): Promise<Article | null> {
  const categories = interest.arxivCategories;
  if (!categories || categories.length === 0) return null;

  try {
    const category = pickRandom(categories);
    const items = await fetchArxivFeed(category);
    const valid = items.filter((i) => {
      const text = stripHtml(i.description);
      return i.title.length > 15 && text.length > 100;
    });
    if (!valid.length) return null;

    const item = pickRandom(valid);
    const abstract = stripHtml(item.description).slice(0, 550);

    // arXiv abstracts often start with "Abstract: " — strip it
    const extract = abstract.replace(/^Abstract:\s*/i, '');

    return {
      title: item.title.replace(/\n/g, ' ').trim(),
      description: `arXiv · ${category}`,
      extract,
      pageUrl: item.link,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'arxiv',
      author: item.author || 'arXiv',
      publishedAt: item.pubDate,
    };
  } catch {
    return null;
  }
}

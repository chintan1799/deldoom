import type { Article, InterestCategory } from '../types';

interface HNHit {
  objectID: string;
  title: string;
  url?: string;
  author: string;
  points: number;
  story_text?: string;
  created_at: string;
}

interface AlgoliaResponse {
  hits: HNHit[];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function fetchHNArticle(
  interest: InterestCategory
): Promise<Article | null> {
  const tags = interest.hnTags;
  if (!tags || tags.length === 0) return null;

  const tag = pickRandom(tags);

  try {
    const params = new URLSearchParams({
      tags: 'story',
      query: tag,
      numericFilters: 'points>50',
      hitsPerPage: '30',
    });
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search?${params}`
    );
    if (!res.ok) return null;

    const json: AlgoliaResponse = await res.json();
    const hits = json.hits.filter((h) => {
      if (!h.url || h.title.length <= 15) return false;
      const text = h.story_text ? h.story_text.replace(/<[^>]+>/g, '').trim() : '';
      return text.length > 100;
    });

    if (hits.length === 0) return null;

    const hit = pickRandom(hits);

    const extract = hit.story_text
      ? hit.story_text.replace(/<[^>]+>/g, '').slice(0, 500).trim()
      : '';

    return {
      title: hit.title,
      description: 'Hacker News',
      extract,
      interestingFact: undefined,
      thumbnailUrl: undefined,
      pageUrl: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'hackernews',
      author: hit.author,
      publishedAt: hit.created_at,
      score: hit.points,
    };
  } catch {
    return null;
  }
}

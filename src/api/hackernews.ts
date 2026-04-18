import type { Article, InterestCategory } from '../types';

interface HNHit {
  objectID: string;
  title: string;
  url?: string;
  author: string;
  points: number;
  story_text?: string;
  num_comments?: number;
  created_at: string;
}

interface AlgoliaResponse {
  hits: HNHit[];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchTopHNComment(objectID: string): Promise<string | null> {
  try {
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 2000)
    );
    const fetchPromise = fetch(
      `https://hn.algolia.com/api/v1/items/${objectID}`
    ).then(async (res) => {
      if (!res.ok) return null;
      const item = await res.json();
      for (const child of (item?.children ?? [])) {
        const text: string = child?.text ?? '';
        const stripped = text.replace(/<[^>]+>/g, '').trim();
        if (stripped.length > 20) {
          return stripped.slice(0, 500);
        }
      }
      return null;
    });
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch {
    return null;
  }
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
      const hasText =
        !!h.story_text &&
        h.story_text.replace(/<[^>]+>/g, '').replace(/\s/g, '').length > 100;
      const highEngagement =
        h.title.length > 40 && h.points > 150 && (h.num_comments ?? 0) > 30;
      return hasText || highEngagement;
    });

    if (hits.length === 0) return null;

    const hit = pickRandom(hits);
    const numComments = hit.num_comments ?? 0;

    const extract = hit.story_text
      ? hit.story_text.replace(/<[^>]+>/g, '').slice(0, 500).trim()
      : await (async () => {
          const header = `💬 ${numComments} comments · ${hit.points} points\n\n${hit.title}`;
          const topComment = await fetchTopHNComment(hit.objectID);
          return topComment ? `${header}\n\nTop of the thread: ${topComment}` : header;
        })();

    return {
      id: `hn_${hit.objectID}`,
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

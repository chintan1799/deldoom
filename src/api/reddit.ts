import type { Article, InterestCategory } from '../types';

interface RedditPost {
  data: {
    title: string;
    selftext: string;
    url: string;
    author: string;
    score: number;
    thumbnail: string;
    created_utc: number;
    subreddit: string;
    is_self: boolean;
    stickied: boolean;
    over_18: boolean;
    permalink: string;
  };
}

interface RedditListing {
  data: {
    children: RedditPost[];
  };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatExtract(post: RedditPost['data']): string {
  if (post.selftext && post.selftext.replace(/\s/g, '').length > 30) {
    return post.selftext.slice(0, 500).replace(/\n+/g, ' ').trim();
  }
  return post.title;
}

function getThumbnail(post: RedditPost['data']): string | undefined {
  const t = post.thumbnail;
  if (t && t.startsWith('http')) return t;
  return undefined;
}

export async function fetchRedditArticle(
  interest: InterestCategory
): Promise<Article | null> {
  const subs = interest.redditSubs;
  if (!subs || subs.length === 0) return null;

  const sub = pickRandom(subs);

  try {
    const res = await fetch(
      `https://www.reddit.com/r/${sub}/top.json?t=all&limit=100`,
      {
        headers: {
          'User-Agent': 'deldoom/1.0 (microlearning app)',
          Accept: 'application/json',
        },
      }
    );
    if (!res.ok) return null;

    const json: RedditListing = await res.json();
    const posts = json.data.children
      .map((c) => c.data)
      .filter(
        (p) =>
          !p.stickied &&
          !p.over_18 &&
          p.score > 50 &&
          p.title.length > 15
      );

    if (posts.length === 0) return null;

    const post = pickRandom(posts);
    const extract = formatExtract(post);

    // External URL: prefer the linked article; for self-posts use full Reddit thread
    const pageUrl = post.is_self
      ? `https://www.reddit.com${post.permalink}`
      : post.url;

    return {
      title: post.title,
      description: `r/${post.subreddit}`,
      extract,
      interestingFact: undefined,
      thumbnailUrl: getThumbnail(post),
      pageUrl,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'reddit',
      author: `u/${post.author}`,
      publishedAt: new Date(post.created_utc * 1000).toISOString(),
      score: post.score,
      subreddit: `r/${post.subreddit}`,
    };
  } catch {
    return null;
  }
}

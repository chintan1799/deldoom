import type { Article, InterestCategory } from '../types';

interface RedditPost {
  data: {
    id: string;
    num_comments: number;
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
  data: { children: RedditPost[] };
}

type PostData = RedditPost['data'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Per-sub post cache — avoids re-fetching the same subreddit within 15 min
const _subCache = new Map<string, { posts: PostData[]; expires: number }>();

async function fetchSubPosts(sub: string): Promise<PostData[]> {
  const cached = _subCache.get(sub);
  if (cached && Date.now() < cached.expires) return cached.posts;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    // old.reddit.com is more reliably CORS-permissive than www.reddit.com
    const res = await fetch(
      `https://old.reddit.com/r/${sub}/top.json?t=month&limit=100`,
      { headers: { Accept: 'application/json' }, signal: controller.signal }
    );
    if (!res.ok) return [];

    const json: RedditListing = await res.json();
    const posts = (json?.data?.children ?? [])
      .map((c) => c.data)
      .filter((p) => {
        if (p.stickied || p.over_18) return false;
        const hasText = p.selftext && p.selftext.replace(/\s/g, '').length > 100;
        const highEngagement = p.title.length > 30 && p.score > 100 && p.num_comments > 20;
        return hasText || highEngagement;
      });

    _subCache.set(sub, { posts, expires: Date.now() + 15 * 60 * 1000 });
    return posts;
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchTopRedditComment(subreddit: string, id: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    try {
      const res = await fetch(
        `https://old.reddit.com/r/${subreddit}/comments/${id}.json?limit=5&sort=top&depth=1`,
        { headers: { Accept: 'application/json' }, signal: controller.signal }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const comments: Array<{ data: { body?: string; stickied?: boolean } }> =
        data?.[1]?.data?.children ?? [];
      for (const c of comments) {
        const body = c?.data?.body ?? '';
        if (!c?.data?.stickied && body.replace(/\s/g, '').length > 20) {
          return body.slice(0, 500).replace(/\n+/g, ' ').trim();
        }
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return null;
  }
}

async function buildRedditExtract(post: PostData): Promise<string> {
  if (post.selftext && post.selftext.replace(/\s/g, '').length > 100) {
    return post.selftext.slice(0, 500).replace(/\n+/g, ' ').trim();
  }
  const header = `💬 ${post.num_comments} comments · ${post.score} upvotes\n\n${post.title}`;
  const topComment = await fetchTopRedditComment(post.subreddit, post.id);
  return topComment ? `${header}\n\nTop of the thread: ${topComment}` : header;
}

function getThumbnail(post: PostData): string | undefined {
  const t = post.thumbnail;
  return t?.startsWith('http') ? t : undefined;
}

export async function fetchRedditArticle(
  interest: InterestCategory
): Promise<Article | null> {
  const subs = interest.redditSubs;
  if (!subs || subs.length === 0) return null;

  // Shuffle sub order so we don't always hit the same one first
  const shuffled = [...subs].sort(() => Math.random() - 0.5);

  for (const sub of shuffled.slice(0, 3)) {
    const posts = await fetchSubPosts(sub);
    if (!posts.length) continue;

    const post = pickRandom(posts);
    const extract = await buildRedditExtract(post);
    const pageUrl = post.is_self
      ? `https://www.reddit.com${post.permalink}`
      : post.url;

    return {
      id: `reddit_${post.id}`,
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
  }
  return null;
}

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
  data: {
    children: RedditPost[];
  };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchTopRedditComment(
  subreddit: string,
  id: string
): Promise<string | null> {
  try {
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 2000)
    );
    const fetchPromise = fetch(
      `https://www.reddit.com/r/${subreddit}/comments/${id}.json?limit=5&sort=top&depth=1`,
      { headers: { 'User-Agent': 'deldoom/1.0 (microlearning app)' } }
    ).then(async (res) => {
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
    });
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch {
    return null;
  }
}

async function buildRedditExtract(post: RedditPost['data']): Promise<string> {
  if (post.selftext && post.selftext.replace(/\s/g, '').length > 100) {
    return post.selftext.slice(0, 500).replace(/\n+/g, ' ').trim();
  }
  // Link post — synthesized discussion preview
  const header = `💬 ${post.num_comments} comments · ${post.score} upvotes\n\n${post.title}`;
  const topComment = await fetchTopRedditComment(post.subreddit, post.id);
  return topComment
    ? `${header}\n\nTop of the thread: ${topComment}`
    : header;
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
      .filter((p) => {
        if (p.stickied || p.over_18) return false;
        const hasText = p.selftext && p.selftext.replace(/\s/g, '').length > 100;
        const highEngagement =
          p.title.length > 40 && p.score > 200 && p.num_comments > 50;
        return hasText || highEngagement;
      });

    if (posts.length === 0) return null;

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
  } catch {
    return null;
  }
}

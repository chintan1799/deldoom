import type { Article } from '../types';
import { INTERESTS, getInterestById } from '../data/interests';
import { fetchRandomArticleForInterests } from './wikipedia';
import { fetchRedditArticle } from './reddit';
import { fetchHNArticle } from './hackernews';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Source = 'wikipedia' | 'reddit' | 'hackernews';

function pickSource(interestId: string): Source {
  const interest = getInterestById(interestId);
  if (!interest) return 'wikipedia';

  const hasReddit = (interest.redditSubs?.length ?? 0) > 0;
  const hasHN = (interest.hnTags?.length ?? 0) > 0;

  if (hasHN) {
    // Three-way split: 35% wiki, 35% reddit, 30% HN
    const r = Math.random();
    if (r < 0.35) return 'wikipedia';
    if (r < 0.70) return hasReddit ? 'reddit' : 'wikipedia';
    return 'hackernews';
  }

  if (hasReddit) {
    // 50/50 wikipedia vs reddit
    return Math.random() < 0.5 ? 'wikipedia' : 'reddit';
  }

  return 'wikipedia';
}

export async function fetchRandomArticle(selectedInterestIds: string[]): Promise<Article> {
  const ids = selectedInterestIds.length ? selectedInterestIds : INTERESTS.map((i) => i.id);
  const interestId = pickRandom(ids);
  const interest = getInterestById(interestId);

  if (!interest) {
    return fetchRandomArticleForInterests(ids);
  }

  const source = pickSource(interestId);

  if (source === 'reddit') {
    const article = await fetchRedditArticle(interest);
    if (article) return article;
    // fallback
  }

  if (source === 'hackernews') {
    const article = await fetchHNArticle(interest);
    if (article) return article;
    // fallback
  }

  return fetchRandomArticleForInterests(ids);
}

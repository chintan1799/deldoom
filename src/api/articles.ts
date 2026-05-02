import type { Article, InterestCategory } from '../types';
import { INTERESTS, getInterestById } from '../data/interests';
import { fetchRandomArticleForInterests } from './wikipedia';
import { fetchRedditArticle } from './reddit';
import { fetchHNArticle } from './hackernews';
import { fetchTechCrunchArticle } from './techcrunch';
import { fetchMediumArticle } from './medium';
import { fetchArxivArticle } from './arxiv';
import { fetchNasaArticle } from './nasa';
import { fetchSepArticle } from './sep';
import { fetchStackExchangeArticle } from './stackexchange';
import { fetchOwidArticle } from './ourworldindata';
import { fetchWorldBankArticle } from './worldbank';
import { fetchGutenbergArticle } from './gutenberg';
import { fetchScienceFactArticle } from './sciencefacts';
import { fetchXsumArticle } from './xsum';
import { fetchNanoWikiArticle } from './nanowiki';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Source =
  | 'wikipedia' | 'reddit' | 'hackernews' | 'techcrunch' | 'medium'
  | 'arxiv' | 'nasa' | 'sep' | 'stackexchange' | 'owid' | 'worldbank' | 'gutenberg'
  | 'sciencefacts' | 'xsum' | 'nanowiki';

const SCIENCEFACTS_INTERESTS = [
  'physics', 'biology', 'chemistry', 'astronomy', 'medicine', 'neuroscience',
  'psychology', 'mathematics', 'earth_science', 'climate', 'nutrition',
  'evolution', 'genetics', 'ecology', 'space_tech', 'biotech',
];

const XSUM_INTERESTS = [
  'politics', 'economics', 'sociology', 'finance', 'entrepreneurship',
  'ai', 'coding', 'robotics', 'cybersecurity', 'climate', 'medicine',
  'space_tech', 'internet', 'blockchain',
];

const NANOWIKI_INTERESTS = [
  'history', 'philosophy', 'art', 'music', 'literature', 'linguistics',
  'religion', 'geography', 'architecture', 'mythology', 'cooking',
  'biology', 'physics', 'chemistry', 'astronomy', 'mathematics',
  'psychology', 'economics', 'sociology',
];

function buildPool(interestId: string): [Source, number][] {
  const interest = getInterestById(interestId);
  if (!interest) return [['wikipedia', 1]];

  // Wikipedia weight reduced to ~8 — roughly 10% of a full pool
  // Non-wiki sources will be retried up to 3× before falling to Wikipedia
  const pool: [Source, number][] = [['wikipedia', 8]];

  if ((interest.redditSubs?.length ?? 0) > 0)       pool.push(['reddit', 22]);
  if ((interest.hnTags?.length ?? 0) > 0)            pool.push(['hackernews', 14]);
  if ((interest.mediumTags?.length ?? 0) > 0)        pool.push(['medium', 14]);
  if ((interest.arxivCategories?.length ?? 0) > 0)   pool.push(['arxiv', 14]);
  if (interest.stackExchangeSite)                     pool.push(['stackexchange', 10]);
  if (interest.hasSep)                               pool.push(['sep', 10]);
  if (interest.hasOwid)                              pool.push(['owid', 10]);
  if ((interest.gutenbergTopics?.length ?? 0) > 0)   pool.push(['gutenberg', 6]);

  const NASA_INTERESTS = ['astronomy', 'space_tech', 'earth_science', 'climate', 'physics'];
  if (NASA_INTERESTS.includes(interestId))           pool.push(['nasa', 14]);

  const TC_INTERESTS = ['ai', 'coding', 'robotics', 'space_tech', 'cybersecurity',
    'gadgets', 'internet', 'blockchain', 'biotech', 'entrepreneurship', 'finance'];
  if (TC_INTERESTS.includes(interestId))             pool.push(['techcrunch', 12]);

  const WB_INTERESTS = ['economics', 'finance', 'politics', 'sociology', 'climate', 'medicine', 'nutrition'];
  if (WB_INTERESTS.includes(interestId))             pool.push(['worldbank', 10]);

  // HuggingFace sources — highest weights for reliable diverse content
  if (SCIENCEFACTS_INTERESTS.includes(interestId))   pool.push(['sciencefacts', 24]);
  if (XSUM_INTERESTS.includes(interestId))            pool.push(['xsum', 22]);
  if (NANOWIKI_INTERESTS.includes(interestId))        pool.push(['nanowiki', 18]);

  return pool;
}

function pickFromPool(pool: [Source, number][]): Source {
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [source, weight] of pool) {
    r -= weight;
    if (r <= 0) return source;
  }
  return pool[pool.length - 1][0];
}

async function tryFetch(source: Source, interest: InterestCategory): Promise<Article | null> {
  switch (source) {
    case 'reddit':        return fetchRedditArticle(interest);
    case 'hackernews':    return fetchHNArticle(interest);
    case 'techcrunch':    return fetchTechCrunchArticle(interest);
    case 'medium':        return fetchMediumArticle(interest);
    case 'arxiv':         return fetchArxivArticle(interest);
    case 'nasa':          return fetchNasaArticle(interest);
    case 'sep':           return fetchSepArticle(interest);
    case 'stackexchange': return fetchStackExchangeArticle(interest);
    case 'owid':          return fetchOwidArticle(interest);
    case 'worldbank':     return fetchWorldBankArticle(interest);
    case 'gutenberg':     return fetchGutenbergArticle(interest);
    case 'sciencefacts':  return fetchScienceFactArticle(interest);
    case 'xsum':          return fetchXsumArticle(interest);
    case 'nanowiki':      return fetchNanoWikiArticle(interest);
    default:              return null;
  }
}

export async function fetchRandomArticle(selectedInterestIds: string[]): Promise<Article> {
  const ids = selectedInterestIds.length ? selectedInterestIds : INTERESTS.map((i) => i.id);
  const interestId = pickRandom(ids);
  const interest = getInterestById(interestId);

  if (!interest) return fetchRandomArticleForInterests(ids);

  const pool = buildPool(interestId);

  // First pick — includes wikipedia in the pool (~10% chance)
  const firstSource = pickFromPool(pool);
  if (firstSource === 'wikipedia') {
    return fetchRandomArticleForInterests(ids);
  }

  // Try firstSource, then up to 2 more distinct non-Wikipedia sources
  const nonWikiPool = pool.filter(([s]) => s !== 'wikipedia');
  const tried = new Set<Source>();
  tried.add(firstSource);

  const sourcesToTry: Source[] = [firstSource];
  for (let i = 0; i < 2; i++) {
    const remaining = nonWikiPool.filter(([s]) => !tried.has(s));
    if (remaining.length === 0) break;
    const next = pickFromPool(remaining);
    tried.add(next);
    sourcesToTry.push(next);
  }

  for (const source of sourcesToTry) {
    try {
      const article = await Promise.race([
        tryFetch(source, interest),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
      ]);
      if (article && article.extract.trim().length > 0) return article;
    } catch { /* try next */ }
  }

  // All non-Wikipedia sources failed — fall back to Wikipedia
  return fetchRandomArticleForInterests(ids);
}

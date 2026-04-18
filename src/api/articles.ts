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
import { fetchFinshotsArticle } from './finshots';
import { fetchAeonArticle } from './aeon';
import { fetchMarginalianArticle } from './marginalian';
import { fetchAtlasObscuraArticle } from './atlasobscura';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Source =
  | 'wikipedia' | 'reddit' | 'hackernews' | 'techcrunch' | 'medium'
  | 'arxiv' | 'nasa' | 'sep' | 'stackexchange' | 'owid' | 'worldbank' | 'gutenberg'
  | 'finshots' | 'aeon' | 'marginalian' | 'atlasobscura';

// Interest lists for sources that don't have a per-interest flag on InterestCategory
const NASA_INTERESTS = new Set(['astronomy', 'space_tech', 'earth_science', 'climate', 'physics']);
const TC_INTERESTS = new Set(['ai', 'coding', 'robotics', 'space_tech', 'cybersecurity',
  'gadgets', 'internet', 'blockchain', 'biotech', 'entrepreneurship', 'finance']);
const WB_INTERESTS = new Set(['economics', 'finance', 'politics', 'sociology', 'climate', 'medicine', 'nutrition']);

// Tier 1: always eligible for any interest. Tier 2: only if the interest has that source mapped.
const TIER1_WEIGHT = { wikipedia: 25, reddit: 18, hackernews: 12 };
const TIER2_WEIGHT = 10;

function buildSourcePool(
  interest: InterestCategory,
  excluded: Set<Source>,
  recentSources: string[]
): [Source, number][] {
  const pool: [Source, number][] = [];

  // Recency bias: if the last 3 returned sources were all Wikipedia, block it this roll.
  const last3 = recentSources.slice(-3);
  const wikiBlocked = last3.length === 3 && last3.every((s) => s === 'wikipedia');

  // Tier 1 — always in the pool
  if (!excluded.has('wikipedia') && !wikiBlocked) pool.push(['wikipedia', TIER1_WEIGHT.wikipedia]);
  if (!excluded.has('reddit')) pool.push(['reddit', TIER1_WEIGHT.reddit]);
  if (!excluded.has('hackernews')) pool.push(['hackernews', TIER1_WEIGHT.hackernews]);

  // Tier 2 — mapped specialty sources only
  if (!excluded.has('medium') && (interest.mediumTags?.length ?? 0) > 0) pool.push(['medium', TIER2_WEIGHT]);
  if (!excluded.has('arxiv') && (interest.arxivCategories?.length ?? 0) > 0) pool.push(['arxiv', TIER2_WEIGHT]);
  if (!excluded.has('stackexchange') && interest.stackExchangeSite) pool.push(['stackexchange', TIER2_WEIGHT]);
  if (!excluded.has('sep') && interest.hasSep) pool.push(['sep', TIER2_WEIGHT]);
  if (!excluded.has('owid') && interest.hasOwid) pool.push(['owid', TIER2_WEIGHT]);
  if (!excluded.has('gutenberg') && (interest.gutenbergTopics?.length ?? 0) > 0) pool.push(['gutenberg', TIER2_WEIGHT]);
  if (!excluded.has('finshots') && interest.hasFinshots) pool.push(['finshots', TIER2_WEIGHT]);
  if (!excluded.has('aeon') && interest.hasAeon) pool.push(['aeon', TIER2_WEIGHT]);
  if (!excluded.has('marginalian') && interest.hasMarginalian) pool.push(['marginalian', TIER2_WEIGHT]);
  if (!excluded.has('atlasobscura') && interest.hasAtlasObscura) pool.push(['atlasobscura', TIER2_WEIGHT]);
  if (!excluded.has('nasa') && NASA_INTERESTS.has(interest.id)) pool.push(['nasa', TIER2_WEIGHT]);
  if (!excluded.has('techcrunch') && TC_INTERESTS.has(interest.id)) pool.push(['techcrunch', TIER2_WEIGHT]);
  if (!excluded.has('worldbank') && WB_INTERESTS.has(interest.id)) pool.push(['worldbank', TIER2_WEIGHT]);

  return pool;
}

function weightedPick(pool: [Source, number][]): Source | null {
  if (!pool.length) return null;
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [s, w] of pool) {
    r -= w;
    if (r <= 0) return s;
  }
  return pool[pool.length - 1][0];
}

async function invokeSource(source: Source, interest: InterestCategory): Promise<Article | null> {
  switch (source) {
    case 'wikipedia':    return fetchRandomArticleForInterests([interest.id]);
    case 'reddit':       return fetchRedditArticle(interest);
    case 'hackernews':   return fetchHNArticle(interest);
    case 'techcrunch':   return fetchTechCrunchArticle(interest);
    case 'medium':       return fetchMediumArticle(interest);
    case 'arxiv':        return fetchArxivArticle(interest);
    case 'nasa':         return fetchNasaArticle(interest);
    case 'sep':          return fetchSepArticle(interest);
    case 'stackexchange':return fetchStackExchangeArticle(interest);
    case 'owid':         return fetchOwidArticle(interest);
    case 'worldbank':    return fetchWorldBankArticle(interest);
    case 'gutenberg':    return fetchGutenbergArticle(interest);
    case 'finshots':     return fetchFinshotsArticle(interest);
    case 'aeon':         return fetchAeonArticle(interest);
    case 'marginalian':  return fetchMarginalianArticle(interest);
    case 'atlasobscura': return fetchAtlasObscuraArticle(interest);
  }
}

export async function fetchRandomArticle(
  selectedInterestIds: string[],
  seenIds: string[] = [],
  recentSources: string[] = []
): Promise<Article> {
  const ids = selectedInterestIds.length ? selectedInterestIds : INTERESTS.map((i) => i.id);
  const interestId = pickRandom(ids);
  const interest = getInterestById(interestId);

  if (!interest) return fetchRandomArticleForInterests(ids);

  const tried = new Set<Source>();
  const MAX_SOURCE_ATTEMPTS = 6;

  for (let attempt = 0; attempt < MAX_SOURCE_ATTEMPTS; attempt++) {
    const pool = buildSourcePool(interest, tried, recentSources);
    if (!pool.length) break;

    const source = weightedPick(pool);
    if (!source) break;

    if (import.meta.env.DEV) {
      // DEV: remove after confirming distribution is balanced
      console.log(
        `[deldoom] pick ${source} | interest: ${interestId} | attempt ${attempt + 1} | excluded: [${[...tried].join(',') || '-'}] | recent: [${recentSources.join(',') || '-'}]`
      );
    }

    try {
      const result = await invokeSource(source, interest);
      if (result && result.extract.trim() && !seenIds.includes(result.id)) {
        return result;
      }
      if (import.meta.env.DEV && result && seenIds.includes(result.id)) {
        console.log(`[deldoom] dup ${result.id} — re-rolling`);
      }
    } catch {
      // swallow — re-roll
    }
    tried.add(source);
  }

  // Absolute last resort — generic Wikipedia across all selected interests
  return fetchRandomArticleForInterests(ids);
}

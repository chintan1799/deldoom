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

const NASA_INTERESTS = new Set(['astronomy', 'space_tech', 'earth_science', 'climate', 'physics']);
const TC_INTERESTS = new Set(['ai', 'coding', 'robotics', 'space_tech', 'cybersecurity',
  'gadgets', 'internet', 'blockchain', 'biotech', 'entrepreneurship', 'finance']);
const WB_INTERESTS = new Set(['economics', 'finance', 'politics', 'sociology', 'climate', 'medicine', 'nutrition']);

const TIER1_WEIGHT = { wikipedia: 25, reddit: 18, hackernews: 12 };
const TIER2_WEIGHT = 10;
// How long to wait for any single source before giving up on it
const SOURCE_TIMEOUT_MS = 5000;

function buildSourcePool(
  interest: InterestCategory,
  excluded: Set<Source>,
  recentSources: string[]
): [Source, number][] {
  const pool: [Source, number][] = [];

  const last3 = recentSources.slice(-3);
  const wikiBlocked = last3.length === 3 && last3.every((s) => s === 'wikipedia');

  if (!excluded.has('wikipedia') && !wikiBlocked) pool.push(['wikipedia', TIER1_WEIGHT.wikipedia]);
  if (!excluded.has('reddit'))                     pool.push(['reddit',    TIER1_WEIGHT.reddit]);
  if (!excluded.has('hackernews'))                 pool.push(['hackernews',TIER1_WEIGHT.hackernews]);

  if (!excluded.has('medium')       && (interest.mediumTags?.length ?? 0) > 0)       pool.push(['medium',       TIER2_WEIGHT]);
  if (!excluded.has('arxiv')        && (interest.arxivCategories?.length ?? 0) > 0)   pool.push(['arxiv',        TIER2_WEIGHT]);
  if (!excluded.has('stackexchange')&& interest.stackExchangeSite)                     pool.push(['stackexchange',TIER2_WEIGHT]);
  if (!excluded.has('sep')          && interest.hasSep)                               pool.push(['sep',          TIER2_WEIGHT]);
  if (!excluded.has('owid')         && interest.hasOwid)                              pool.push(['owid',         TIER2_WEIGHT]);
  if (!excluded.has('gutenberg')    && (interest.gutenbergTopics?.length ?? 0) > 0)   pool.push(['gutenberg',    TIER2_WEIGHT]);
  if (!excluded.has('finshots')     && interest.hasFinshots)                           pool.push(['finshots',     TIER2_WEIGHT]);
  if (!excluded.has('aeon')         && interest.hasAeon)                              pool.push(['aeon',         TIER2_WEIGHT]);
  if (!excluded.has('marginalian')  && interest.hasMarginalian)                       pool.push(['marginalian',  TIER2_WEIGHT]);
  if (!excluded.has('atlasobscura') && interest.hasAtlasObscura)                      pool.push(['atlasobscura', TIER2_WEIGHT]);
  if (!excluded.has('nasa')         && NASA_INTERESTS.has(interest.id))               pool.push(['nasa',         TIER2_WEIGHT]);
  if (!excluded.has('techcrunch')   && TC_INTERESTS.has(interest.id))                 pool.push(['techcrunch',   TIER2_WEIGHT]);
  if (!excluded.has('worldbank')    && WB_INTERESTS.has(interest.id))                 pool.push(['worldbank',    TIER2_WEIGHT]);

  return pool;
}

// Weighted pick without replacement — returns up to n sources
function weightedPickN(pool: [Source, number][], n: number): Source[] {
  const picks: Source[] = [];
  const remaining = [...pool];
  while (picks.length < n && remaining.length > 0) {
    const total = remaining.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    let chosen = remaining[remaining.length - 1][0];
    for (const [src, w] of remaining) {
      r -= w;
      if (r <= 0) { chosen = src; break; }
    }
    picks.push(chosen);
    const idx = remaining.findIndex(([s]) => s === chosen);
    remaining.splice(idx, 1);
  }
  return picks;
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

// Races a source against a hard timeout; throws on timeout, null, empty extract, or dup
async function trySource(
  source: Source,
  interest: InterestCategory,
  seenIds: string[]
): Promise<Article> {
  const result = await Promise.race([
    invokeSource(source, interest),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), SOURCE_TIMEOUT_MS)
    ),
  ]);
  if (!result || !result.extract.trim()) throw new Error('empty');
  if (seenIds.includes(result.id))       throw new Error('dup');
  return result;
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
  const BATCH_SIZE = 3;   // sources tried in parallel per round
  const MAX_BATCHES = 3;  // max 3 rounds = 9 source attempts total

  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const pool = buildSourcePool(interest, tried, recentSources);
    if (!pool.length) break;

    const picks = weightedPickN(pool, BATCH_SIZE);
    picks.forEach((s) => tried.add(s));

    if (import.meta.env.DEV) {
      // DEV: remove after confirming distribution is balanced
      console.log(`[deldoom] batch ${batch + 1} [${picks.join(', ')}] | interest: ${interestId}`);
    }

    // Fire all picks in parallel; return the first one that succeeds
    const result = await Promise.any(
      picks.map((s) => trySource(s, interest, seenIds))
    ).catch(() => null);

    if (result) return result;
  }

  // Final fallback — Wikipedia is always available
  return fetchRandomArticleForInterests(ids);
}

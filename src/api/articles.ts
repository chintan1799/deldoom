import type { Article } from '../types';
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

// Science interests that benefit from HuggingFace science facts
const SCIENCEFACTS_INTERESTS = [
  'physics', 'biology', 'chemistry', 'astronomy', 'medicine', 'neuroscience',
  'psychology', 'mathematics', 'earth_science', 'climate', 'nutrition',
  'evolution', 'genetics', 'ecology', 'space_tech', 'biotech',
];

// News/current-events interests that benefit from BBC XSum articles
const XSUM_INTERESTS = [
  'politics', 'economics', 'sociology', 'finance', 'entrepreneurship',
  'ai', 'coding', 'robotics', 'cybersecurity', 'climate', 'medicine',
  'space_tech', 'internet', 'blockchain',
];

// Broad interests served by nano_wiki (simple encyclopedia)
const NANOWIKI_INTERESTS = [
  'history', 'philosophy', 'art', 'music', 'literature', 'linguistics',
  'religion', 'geography', 'architecture', 'mythology', 'cooking',
  'biology', 'physics', 'chemistry', 'astronomy', 'mathematics',
  'psychology', 'economics', 'sociology',
];

// Build a weighted source pool for a given interest, then pick one randomly
function pickSource(interestId: string): Source {
  const interest = getInterestById(interestId);
  if (!interest) return 'wikipedia';

  const pool: [Source, number][] = [['wikipedia', 20]];

  if ((interest.redditSubs?.length ?? 0) > 0)       pool.push(['reddit', 15]);
  if ((interest.hnTags?.length ?? 0) > 0)            pool.push(['hackernews', 8]);
  if ((interest.mediumTags?.length ?? 0) > 0)        pool.push(['medium', 10]);
  if ((interest.arxivCategories?.length ?? 0) > 0)   pool.push(['arxiv', 10]);
  if (interest.stackExchangeSite)                     pool.push(['stackexchange', 6]);
  if (interest.hasSep)                               pool.push(['sep', 6]);
  if (interest.hasOwid)                              pool.push(['owid', 6]);
  if ((interest.gutenbergTopics?.length ?? 0) > 0)   pool.push(['gutenberg', 4]);

  // NASA only for relevant interests
  const NASA_INTERESTS = ['astronomy', 'space_tech', 'earth_science', 'climate', 'physics'];
  if (NASA_INTERESTS.includes(interestId))           pool.push(['nasa', 8]);

  // TechCrunch only for tech/business interests
  const TC_INTERESTS = ['ai', 'coding', 'robotics', 'space_tech', 'cybersecurity',
    'gadgets', 'internet', 'blockchain', 'biotech', 'entrepreneurship', 'finance'];
  if (TC_INTERESTS.includes(interestId))             pool.push(['techcrunch', 6]);

  // World Bank for economics-adjacent interests
  const WB_INTERESTS = ['economics', 'finance', 'politics', 'sociology', 'climate', 'medicine', 'nutrition'];
  if (WB_INTERESTS.includes(interestId))             pool.push(['worldbank', 5]);

  // HuggingFace: science facts
  if (SCIENCEFACTS_INTERESTS.includes(interestId))   pool.push(['sciencefacts', 12]);

  // HuggingFace: BBC XSum news
  if (XSUM_INTERESTS.includes(interestId))            pool.push(['xsum', 10]);

  // HuggingFace: nano wiki (simple encyclopedia)
  if (NANOWIKI_INTERESTS.includes(interestId))        pool.push(['nanowiki', 8]);

  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [source, weight] of pool) {
    r -= weight;
    if (r <= 0) return source;
  }
  return 'wikipedia';
}

export async function fetchRandomArticle(selectedInterestIds: string[]): Promise<Article> {
  const ids = selectedInterestIds.length ? selectedInterestIds : INTERESTS.map((i) => i.id);
  const interestId = pickRandom(ids);
  const interest = getInterestById(interestId);

  if (!interest) return fetchRandomArticleForInterests(ids);

  const source = pickSource(interestId);

  const trySource = async (): Promise<Article | null> => {
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
  };

  if (source !== 'wikipedia') {
    try {
      const article = await trySource();
      if (article && article.extract.trim().length > 0) return article;
    } catch {
      // fall through to Wikipedia
    }
  }

  return fetchRandomArticleForInterests(ids);
}

import type { Article, WikiSummaryResponse, WikiCategoryMember } from '../types';
import { INTERESTS, getInterestById } from '../data/interests';

const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_API = 'https://en.wikipedia.org/w/api.php';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchCategoryMembers(categoryName: string): Promise<WikiCategoryMember[]> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'categorymembers',
    cmtitle: `Category:${categoryName}`,
    cmlimit: '50',
    cmtype: 'page',
    cmnamespace: '0',
    format: 'json',
    origin: '*',
  });

  const res = await fetch(`${WIKI_API}?${params}`);
  if (!res.ok) throw new Error(`Category fetch failed: ${res.status}`);
  const data = await res.json();
  return (data.query?.categorymembers ?? []) as WikiCategoryMember[];
}

async function fetchSummary(title: string): Promise<WikiSummaryResponse> {
  const encoded = encodeURIComponent(title.replace(/ /g, '_'));
  const res = await fetch(`${WIKI_REST}/page/summary/${encoded}`, {
    headers: { 'Api-User-Agent': 'deldoom/0.1 (microlearning app)' },
  });
  if (!res.ok) throw new Error(`Summary fetch failed: ${res.status}`);
  return res.json();
}

async function fetchRandomSummary(): Promise<WikiSummaryResponse> {
  const res = await fetch(`${WIKI_REST}/page/random/summary`, {
    headers: { 'Api-User-Agent': 'deldoom/0.1 (microlearning app)' },
  });
  if (!res.ok) throw new Error(`Random fetch failed: ${res.status}`);
  return res.json();
}

function mapSummaryToArticle(
  summary: WikiSummaryResponse,
  interestId: string
): Article {
  const interest = getInterestById(interestId) ?? INTERESTS[0];
  return {
    title: summary.title,
    extract: summary.extract,
    imageUrl: summary.originalimage?.source,
    thumbnailUrl: summary.thumbnail?.source,
    pageUrl: summary.content_urls?.desktop.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(summary.title)}`,
    wikiTitle: summary.title.replace(/ /g, '_'),
    interestId,
    interestLabel: interest.label,
    interestEmoji: interest.emoji,
    interestColor: interest.color,
  };
}

export async function fetchRandomArticleForInterests(
  interestIds: string[]
): Promise<Article> {
  if (!interestIds.length) {
    const summary = await fetchRandomSummary();
    return mapSummaryToArticle(summary, INTERESTS[0].id);
  }

  // Try up to 4 times to get an article with a reasonable extract
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const interestId = pickRandom(interestIds);
      const interest = getInterestById(interestId);
      if (!interest) continue;

      const category = pickRandom(interest.wikipediaCategories);
      const members = await fetchCategoryMembers(category);

      if (!members.length) continue;

      // Filter out disambiguation pages, lists, etc.
      const filtered = members.filter(
        (m) =>
          !m.title.startsWith('List of') &&
          !m.title.includes('(disambiguation)') &&
          !m.title.startsWith('Index of')
      );

      const candidate = pickRandom(filtered.length ? filtered : members);
      const summary = await fetchSummary(candidate.title);

      // Skip stubs with too little content
      if (summary.extract && summary.extract.length > 80) {
        return mapSummaryToArticle(summary, interestId);
      }
    } catch {
      // continue trying
    }
  }

  // Final fallback: truly random article
  const summary = await fetchRandomSummary();
  return mapSummaryToArticle(summary, pickRandom(interestIds));
}

export async function fetchArticleHtml(wikiTitle: string): Promise<string> {
  const encoded = encodeURIComponent(wikiTitle.replace(/ /g, '_'));
  const res = await fetch(`${WIKI_REST}/page/html/${encoded}`, {
    headers: { 'Api-User-Agent': 'deldoom/0.1 (microlearning app)' },
  });
  if (!res.ok) throw new Error(`HTML fetch failed: ${res.status}`);
  return res.text();
}

export function sanitizeWikiHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove unwanted elements
  const remove = [
    'script', 'style', 'link', 'meta',
    '.mw-editsection', '.reference', '.reflist',
    '.navbox', '.vertical-navbox', '.sidebar',
    '.toc', '#toc', '.mw-jump-link',
    'table.wikitable', '.hatnote',
    'sup.reference',
  ];
  remove.forEach((sel) => {
    doc.querySelectorAll(sel).forEach((el) => el.remove());
  });

  // Make all links plain text to avoid leaving the app
  doc.querySelectorAll('a').forEach((a) => {
    const span = doc.createElement('span');
    span.textContent = a.textContent;
    span.className = 'wiki-link';
    a.replaceWith(span);
  });

  // Fix image sources to absolute URLs
  doc.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src') ?? '';
    if (src.startsWith('//')) {
      img.setAttribute('src', `https:${src}`);
    }
  });

  return doc.body.innerHTML;
}

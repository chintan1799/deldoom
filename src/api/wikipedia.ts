import type { Article, WikiSummaryResponse, WikiCategoryMember, RelatedArticle } from '../types';
import { INTERESTS, getInterestById } from '../data/interests';

const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const AGENT = 'deldoom/0.2 (microlearning app)';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Interesting fact extraction ───────────────────────────────────────────────
const INTERESTING_SIGNALS = [
  /\b(first|only|largest|smallest|oldest|youngest|tallest|deepest|fastest|slowest|most|least|rarest|never|always|unique|paradox|surprising|remarkable|extraordinary|discovered|invented|founded|established)\b/i,
  /\b\d{4}\b/,               // contains a year
  /\b\d+[\.,]?\d*\s*(million|billion|trillion|thousand|percent|%|km|miles?|years?|days?|hours?)\b/i,
  /\b(despite|however|although|contrary|instead|unexpectedly|ironically)\b/i,
];

function extractInterestingFact(extract: string): string | undefined {
  if (!extract) return undefined;
  const sentences = extract
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 300);

  // Skip the first sentence (usually just a definition)
  const candidates = sentences.slice(1);

  for (const signal of INTERESTING_SIGNALS) {
    const match = candidates.find((s) => signal.test(s));
    if (match) return match;
  }

  // Fallback to second sentence if available
  return candidates[0];
}

// ── Category members ──────────────────────────────────────────────────────────
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

// ── Article summary ───────────────────────────────────────────────────────────
async function fetchSummary(title: string): Promise<WikiSummaryResponse> {
  const encoded = encodeURIComponent(title.replace(/ /g, '_'));
  const res = await fetch(`${WIKI_REST}/page/summary/${encoded}`, {
    headers: { 'Api-User-Agent': AGENT },
  });
  if (!res.ok) throw new Error(`Summary fetch failed: ${res.status}`);
  return res.json();
}

async function fetchRandomSummary(): Promise<WikiSummaryResponse> {
  const res = await fetch(`${WIKI_REST}/page/random/summary`, {
    headers: { 'Api-User-Agent': AGENT },
  });
  if (!res.ok) throw new Error(`Random fetch failed: ${res.status}`);
  return res.json();
}

// ── Map summary → Article ─────────────────────────────────────────────────────
function mapSummaryToArticle(summary: WikiSummaryResponse, interestId: string): Article {
  const interest = getInterestById(interestId) ?? INTERESTS[0];
  const wordCount = summary.extract?.split(/\s+/).length ?? 0;
  return {
    title: summary.title,
    description: summary.description,
    extract: summary.extract,
    interestingFact: extractInterestingFact(summary.extract),
    imageUrl: summary.originalimage?.source,
    thumbnailUrl: summary.thumbnail?.source,
    pageUrl:
      summary.content_urls?.desktop.page ??
      `https://en.wikipedia.org/wiki/${encodeURIComponent(summary.title)}`,
    wikiTitle: summary.title.replace(/ /g, '_'),
    interestId,
    interestLabel: interest.label,
    interestEmoji: interest.emoji,
    interestColor: interest.color,
    readingTimeMin: Math.max(1, Math.round(wordCount / 200)),
  };
}

// ── Main: fetch random article for interests ──────────────────────────────────
export async function fetchRandomArticleForInterests(interestIds: string[]): Promise<Article> {
  if (!interestIds.length) {
    const summary = await fetchRandomSummary();
    return mapSummaryToArticle(summary, INTERESTS[0].id);
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const interestId = pickRandom(interestIds);
      const interest = getInterestById(interestId);
      if (!interest) continue;

      const category = pickRandom(interest.wikipediaCategories);
      const members = await fetchCategoryMembers(category);
      if (!members.length) continue;

      const filtered = members.filter(
        (m) =>
          !m.title.startsWith('List of') &&
          !m.title.includes('(disambiguation)') &&
          !m.title.startsWith('Index of')
      );

      const candidate = pickRandom(filtered.length ? filtered : members);
      const summary = await fetchSummary(candidate.title);

      if (summary.extract && summary.extract.length > 100) {
        return mapSummaryToArticle(summary, interestId);
      }
    } catch {
      // continue
    }
  }

  const summary = await fetchRandomSummary();
  return mapSummaryToArticle(summary, pickRandom(interestIds));
}

// ── Related articles ──────────────────────────────────────────────────────────
export async function fetchRelatedArticles(wikiTitle: string): Promise<RelatedArticle[]> {
  const encoded = encodeURIComponent(wikiTitle.replace(/ /g, '_'));
  const res = await fetch(`${WIKI_REST}/page/related/${encoded}`, {
    headers: { 'Api-User-Agent': AGENT },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const pages: WikiSummaryResponse[] = data.pages ?? [];
  return pages.slice(0, 8).map((p) => ({
    title: p.title,
    extract: p.extract ? p.extract.slice(0, 120) + (p.extract.length > 120 ? '…' : '') : '',
    thumbnailUrl: p.thumbnail?.source,
    wikiTitle: p.title.replace(/ /g, '_'),
  }));
}

// ── Full article HTML ─────────────────────────────────────────────────────────
export async function fetchArticleHtml(wikiTitle: string): Promise<string> {
  const encoded = encodeURIComponent(wikiTitle.replace(/ /g, '_'));
  const res = await fetch(`${WIKI_REST}/page/html/${encoded}`, {
    headers: { 'Api-User-Agent': AGENT },
  });
  if (!res.ok) throw new Error(`HTML fetch failed: ${res.status}`);
  return res.text();
}

// ── Sanitize HTML — preserve wiki-link titles ────────────────────────────────
export function sanitizeWikiHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const remove = [
    'script', 'style', 'link', 'meta',
    '.mw-editsection', '.reference', '.reflist',
    '.navbox', '.vertical-navbox', '.sidebar',
    '.toc', '#toc', '.mw-jump-link',
    'table.wikitable', '.hatnote',
    'sup.reference',
  ];
  remove.forEach((sel) => doc.querySelectorAll(sel).forEach((el) => el.remove()));

  // Strip boilerplate sections by heading text
  const STRIP_SECTIONS = ['See also', 'Notes', 'References', 'Bibliography', 'Further reading', 'External links'];
  doc.querySelectorAll('section').forEach((section) => {
    const heading = section.querySelector('h2, h3');
    if (heading && STRIP_SECTIONS.includes(heading.textContent?.trim() ?? '')) {
      section.remove();
    }
  });

  // Convert links to tappable spans — preserve the target title
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') ?? '';
    const span = doc.createElement('span');
    span.textContent = a.textContent;
    span.className = 'wiki-link';

    // Extract wiki title from href like /wiki/Article_Title or ./Article_Title
    const match = href.match(/(?:^\.\/|\/wiki\/)([^#?]+)/);
    if (match) {
      span.dataset.wikiTitle = decodeURIComponent(match[1]);
    }

    a.replaceWith(span);
  });

  // Fix relative image URLs
  doc.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src') ?? '';
    if (src.startsWith('//')) img.setAttribute('src', `https:${src}`);
  });

  return doc.body.innerHTML;
}

// ── Fetch summary for term popup ─────────────────────────────────────────────
export async function fetchTermSummary(wikiTitle: string): Promise<WikiSummaryResponse | null> {
  try {
    return await fetchSummary(wikiTitle);
  } catch {
    return null;
  }
}

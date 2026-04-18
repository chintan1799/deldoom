import type { Article, InterestCategory } from '../types';

interface GutenbergBook {
  id: number;
  title: string;
  authors: { name: string; birth_year?: number; death_year?: number }[];
  subjects: string[];
  download_count: number;
  formats: Record<string, string>;
}

interface GutenbergResponse {
  results: GutenbergBook[];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const _cache: Map<string, { books: GutenbergBook[]; expires: number }> = new Map();

async function fetchGutenbergBooks(topic: string): Promise<GutenbergBook[]> {
  const cached = _cache.get(topic);
  if (cached && Date.now() < cached.expires) return cached.books;

  const res = await fetch(
    `https://gutendex.com/books/?topic=${encodeURIComponent(topic)}&languages=en&mime_type=text&page_size=20`
  );
  if (!res.ok) throw new Error(`Gutenberg fetch failed for topic: ${topic}`);
  const json: GutenbergResponse = await res.json();
  const books = json.results?.filter((b) => b.authors.length > 0) ?? [];

  _cache.set(topic, { books, expires: Date.now() + 60 * 60 * 1000 });
  return books;
}

async function fetchFirstLines(book: GutenbergBook): Promise<string> {
  // Try to get plain text URL
  const textUrl =
    book.formats['text/plain; charset=utf-8'] ||
    book.formats['text/plain; charset=us-ascii'] ||
    book.formats['text/plain'];
  if (!textUrl) return '';

  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(textUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return '';
    const text = await res.text();

    // Skip Gutenberg header boilerplate (everything before first blank-line paragraph)
    const lines = text.split('\n');
    let bodyStart = 0;
    let blankCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '') {
        blankCount++;
        if (blankCount >= 3) { bodyStart = i + 1; break; }
      }
    }
    const body = lines
      .slice(bodyStart)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    return body.slice(0, 500);
  } catch {
    return '';
  }
}

export async function fetchGutenbergArticle(
  interest: InterestCategory
): Promise<Article | null> {
  const topics = interest.gutenbergTopics;
  if (!topics || topics.length === 0) return null;

  try {
    const topic = pickRandom(topics);
    const books = await fetchGutenbergBooks(topic);
    if (!books.length) return null;

    // Prefer highly-downloaded books (popular classics)
    const sorted = [...books].sort((a, b) => b.download_count - a.download_count);
    const top = sorted.slice(0, 10);
    const book = pickRandom(top);

    const author = book.authors[0]?.name ?? 'Unknown Author';
    const subjectList = book.subjects.slice(0, 3).join(', ');

    // Try to fetch opening lines
    const excerpt = await fetchFirstLines(book);

    const extract = excerpt.length > 100
      ? excerpt
      : `"${book.title}" is a classic work by ${author}. Subjects: ${subjectList}. It has been downloaded ${book.download_count.toLocaleString()} times on Project Gutenberg.`;

    const coverUrl =
      book.formats['image/jpeg'] ||
      `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.cover.medium.jpg`;

    return {
      id: `gutenberg_${book.id}`,
      title: book.title,
      description: `${author} · Project Gutenberg`,
      extract,
      thumbnailUrl: coverUrl.startsWith('http') ? coverUrl : undefined,
      pageUrl: `https://www.gutenberg.org/ebooks/${book.id}`,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'gutenberg',
      author,
    };
  } catch {
    return null;
  }
}

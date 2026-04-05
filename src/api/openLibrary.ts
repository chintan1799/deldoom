import type { BookResult } from '../types';

export async function fetchBookRecommendations(query: string): Promise<BookResult[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://openlibrary.org/search.json?q=${encoded}&limit=4&fields=title,author_name,cover_i,key`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const docs = (data.docs ?? []) as Array<{
      title: string;
      author_name?: string[];
      cover_i?: number;
      key: string;
    }>;

    return docs
      .filter((d) => d.title && d.author_name?.length)
      .slice(0, 4)
      .map((d) => ({
        title: d.title,
        author: d.author_name?.[0] ?? 'Unknown',
        coverId: d.cover_i,
        openLibraryUrl: `https://openlibrary.org${d.key}`,
      }));
  } catch {
    return [];
  }
}

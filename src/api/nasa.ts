import type { Article, InterestCategory } from '../types';

interface ApodItem {
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  date: string;
  copyright?: string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let _apodCache: ApodItem[] | null = null;

async function fetchApod(): Promise<ApodItem[]> {
  if (_apodCache) return _apodCache;
  // Fetch 10 random APOD entries
  const res = await fetch(
    'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&count=10'
  );
  if (!res.ok) throw new Error('NASA APOD failed');
  const data: ApodItem[] = await res.json();
  _apodCache = data;
  setTimeout(() => { _apodCache = null; }, 30 * 60 * 1000);
  return data;
}

export async function fetchNasaArticle(
  interest: InterestCategory
): Promise<Article | null> {
  try {
    const items = await fetchApod();
    const valid = items.filter(
      (i) => i.media_type === 'image' && i.explanation.length > 100
    );
    if (!valid.length) return null;

    const item = pickRandom(valid);
    const extract = item.explanation.slice(0, 550);

    return {
      title: item.title,
      description: 'NASA · Astronomy Picture of the Day',
      extract,
      imageUrl: item.hdurl || item.url,
      thumbnailUrl: item.url,
      pageUrl: `https://apod.nasa.gov/apod/astropix.html`,
      wikiTitle: '',
      interestId: interest.id,
      interestLabel: interest.label,
      interestEmoji: interest.emoji,
      interestColor: interest.color,
      source: 'nasa',
      author: item.copyright ? `© ${item.copyright}` : 'NASA',
      publishedAt: new Date(item.date).toISOString(),
    };
  } catch {
    return null;
  }
}

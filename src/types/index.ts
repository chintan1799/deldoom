export interface InterestCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;        // hex color for accents
  bgClass: string;      // tailwind bg class
  textClass: string;    // tailwind text class
  group: string;        // parent group label
  wikipediaCategories: string[];
}

export interface Article {
  title: string;
  extract: string;      // short summary (2-3 sentences)
  imageUrl?: string;
  thumbnailUrl?: string;
  pageUrl: string;
  wikiTitle: string;    // url-encoded title for API
  interestId: string;
  interestLabel: string;
  interestEmoji: string;
  interestColor: string;
}

export interface WikiSummaryResponse {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
  };
  content_urls?: {
    desktop: { page: string };
    mobile: { page: string };
  };
  description?: string;
}

export interface WikiCategoryMember {
  pageid: number;
  ns: number;
  title: string;
}

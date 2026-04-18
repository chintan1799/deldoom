export interface InterestCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bgClass: string;
  textClass: string;
  group: string;
  wikipediaCategories: string[];
  redditSubs?: string[];
  hnTags?: string[];
  mediumTags?: string[];
  arxivCategories?: string[];
  stackExchangeSite?: string;
  seStackTags?: string[];
  gutenbergTopics?: string[];
  hasSep?: boolean;
  hasOwid?: boolean;
}

export interface Article {
  id: string;
  title: string;
  description?: string;
  extract: string;
  interestingFact?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  pageUrl: string;
  wikiTitle: string;
  interestId: string;
  interestLabel: string;
  interestEmoji: string;
  interestColor: string;
  readingTimeMin?: number;
  source?: 'wikipedia' | 'reddit' | 'hackernews' | 'techcrunch' | 'medium'
         | 'arxiv' | 'nasa' | 'sep' | 'stackexchange' | 'owid' | 'worldbank' | 'gutenberg';
  author?: string;
  publishedAt?: string;
  score?: number;
  subreddit?: string;
  viewedAt?: string;
}

export interface RelatedArticle {
  title: string;
  extract: string;
  thumbnailUrl?: string;
  wikiTitle: string;
}

export interface BookResult {
  title: string;
  author: string;
  coverId?: number;
  openLibraryUrl: string;
}

export interface WikiSummaryResponse {
  pageid?: number;
  title: string;
  extract: string;
  description?: string;
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
}

export interface WikiCategoryMember {
  pageid: number;
  ns: number;
  title: string;
}

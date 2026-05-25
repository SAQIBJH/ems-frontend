export type SearchResultType = 'employee' | 'department' | 'leave' | 'holiday' | 'settings';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  label: string;
  sublabel: string;
  url: string;
}

export interface SearchResponse {
  results: SearchResult[];
  groupedCounts: Partial<Record<SearchResultType, number>>;
}

import { MeiliSearch } from 'meilisearch';

export const meilisearch = new MeiliSearch({
  host:   process.env.MEILISEARCH_URL  ?? 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_KEY  ?? '',
});
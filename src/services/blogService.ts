type Locale = 'en' | 'es';

export interface RawBlogArticle {
  id?: string | number;
  title?: string | { en?: string; es?: string };
  tour?: string | { en?: string; es?: string };
  post?: string | { en?: string; es?: string };
  description?: string | { en?: string; es?: string };
  date?: string;
  language?: Locale;
  slug?: string;
}

export interface BlogArticle {
  id: string;
  title: string;
  tour: string;
  post: string;
  date?: string;
  slug: string;
  locale: Locale;
}

const JSONBIN_MASTER_KEY = import.meta.env.VITE_JSONBIN_MASTER_KEY;
const JSONBIN_BLOG_EN_BIN_ID = import.meta.env.VITE_JSONBIN_BLOG_EN;
const JSONBIN_BLOG_ES_BIN_ID = import.meta.env.VITE_JSONBIN_BLOG_ES;
const BLOG_API_ENDPOINT = import.meta.env.VITE_BLOG_API_ENDPOINT || '/api/blog';

const getLocalizedValue = (value: unknown, locale: Locale): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'object' && value !== null) {
    const localeValue = (value as Record<string, unknown>)[locale];
    if (typeof localeValue === 'string' && localeValue.trim()) {
      return localeValue.trim();
    }

    const fallback = (value as Record<string, unknown>).en || (value as Record<string, unknown>).es;
    return typeof fallback === 'string' ? fallback.trim() : '';
  }

  return '';
};

const normalizeBlogArticle = (rawArticle: RawBlogArticle, locale: Locale): BlogArticle | null => {
  const title = getLocalizedValue(rawArticle.title, locale);
  const tour = getLocalizedValue(rawArticle.tour, locale);
  const post = getLocalizedValue(rawArticle.post || rawArticle.description, locale);
  const date = rawArticle.date?.trim();
  const id = String(rawArticle.id ?? `${title}-${tour}-${date || 'unknown'}`).trim();
  const slug = rawArticle.slug?.trim() || `${title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`.replace(/(^-|-$)/g, '');

  if (!title || !post) {
    return null;
  }

  return {
    id,
    title,
    tour,
    post,
    date,
    slug: slug || id,
    locale,
  };
};

const resolveBlogBinId = (locale: Locale): string | undefined =>
  locale === 'es' ? JSONBIN_BLOG_ES_BIN_ID : JSONBIN_BLOG_EN_BIN_ID;

const findFirstArray = (data: unknown): unknown[] | undefined => {
  if (Array.isArray(data)) {
    return data;
  }

  if (typeof data !== 'object' || data === null) {
    return undefined;
  }

  for (const value of Object.values(data as Record<string, unknown>)) {
    const found = findFirstArray(value);
    if (found) {
      return found;
    }
  }

  return undefined;
};

const extractRecord = (data: unknown): unknown[] => {
  if (Array.isArray(data)) {
    return data;
  }

  if (typeof data === 'object' && data !== null) {
    const recordData = (data as Record<string, unknown>).record ?? data;
    const arrayData = findFirstArray(recordData);
    return arrayData ?? [];
  }

  return [];
};

const fetchFromProxy = async (locale: Locale): Promise<unknown[]> => {
  console.log('[Blog] Attempting proxy fetch from:', `${BLOG_API_ENDPOINT}?locale=${locale}`);
  try {
    const response = await fetch(`${BLOG_API_ENDPOINT}?locale=${locale}`, {
      cache: 'no-cache',
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Blog proxy request failed with status ${response.status}`);
    }
    const responseText = await response.text();
    if (responseText.trim().startsWith('<')) {
      throw new Error('Proxy returned HTML instead of JSON; check /api/blog route or deployment configuration.');
    }
    const data = JSON.parse(responseText);
    console.log('[Blog] Proxy fetch successful, records:', data);
    return extractRecord(data);
  } catch (error) {
    console.warn('[Blog] Proxy fetch error:', error);
    throw error;
  }
};

const fetchDirectBlogArticles = async (binId: string | undefined): Promise<unknown[]> => {
  if (!binId) {
    console.warn('[Blog] No blog bin ID configured (VITE_JSONBIN_BLOG_EN/ES missing)');
    return [];
  }

  try {
    console.log('[Blog] Attempting direct JSONBin fetch from bin:', binId);
    // Always perform anonymous GET for public JSONBin bins to avoid CORS preflight failures
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      cache: 'no-cache',
    });
    if (!response.ok) {
      throw new Error(`JSONBin request failed with status ${response.status}`);
    }
    const data = await response.json();
    console.log('[Blog] Direct fetch successful, records:', data);
    return extractRecord(data);
  } catch (error) {
    console.error('[Blog] Direct fetch failed (likely CORS issue in browser):', error);
    return [];
  }
};

const fetchRawBlogArticles = async (locale: Locale): Promise<unknown[]> => {
  console.log('[Blog] Starting blog fetch for locale:', locale);

  try {
    const proxyArticles = await fetchFromProxy(locale);
    if (proxyArticles.length > 0) {
      return proxyArticles;
    }
    console.warn('[Blog] Proxy returned no article records, falling back to direct JSONBin fetch');
  } catch (error) {
    console.warn('[Blog] Proxy unavailable, falling back to direct JSONBin fetch');
  }

  const binId = resolveBlogBinId(locale);
  const directArticles = await fetchDirectBlogArticles(binId);
  if (directArticles.length > 0) {
    return directArticles;
  }

  throw new Error('Failed to load blog articles from proxy and direct JSONBin fetch.');
};

export const getBlogArticles = async (locale: Locale): Promise<BlogArticle[]> => {
  const rawArticles = await fetchRawBlogArticles(locale);

  return rawArticles
    .map((rawArticle) => normalizeBlogArticle(rawArticle as RawBlogArticle, locale))
    .filter((article): article is BlogArticle => article !== null);
};

type Locale = 'en' | 'es';

export interface RawBlogArticle {
  id?: string | number;
  title?: string | { en?: string; es?: string };
  tour?: string | { en?: string; es?: string };
  post?: string | { en?: string; es?: string };
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
  const post = getLocalizedValue(rawArticle.post, locale);
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

const fetchRawBlogArticles = async (binId: string | undefined): Promise<unknown[]> => {
  if (!binId) {
    return [];
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: {
        'X-Master-Key': JSONBIN_MASTER_KEY,
      },
      cache: 'no-cache',
    });

    const data = await response.json();
    const record = data.record?.record || data.record;
    return Array.isArray(record) ? record : [];
  } catch (error) {
    console.error('Failed to fetch blog articles:', error);
    return [];
  }
};

export const getBlogArticles = async (locale: Locale): Promise<BlogArticle[]> => {
  const binId = resolveBlogBinId(locale);
  const rawArticles = await fetchRawBlogArticles(binId);

  return rawArticles
    .map((rawArticle) => normalizeBlogArticle(rawArticle as RawBlogArticle, locale))
    .filter((article): article is BlogArticle => article !== null);
};

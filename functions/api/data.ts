const RESOURCE_WITH_LOCALE = new Set([
  'blog',
  'i18n',
  'tour',
  'tours',
  'transport',
  'transport-services',
  'example-tours',
  'story-elements',
  'intro-story',
  'translations',
]);

const readLocalJson = async (key: string, requestUrl?: string): Promise<unknown | null> => {
  try {
    // Data files in public/data/ are served as static assets at /data/{key}.json
    const origin = requestUrl ? new URL(requestUrl).origin : '';
    const url = `${origin}/data/${key}.json`;
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (err) {
    console.warn('[Cloudflare Function] Failed to read local JSON for', key, err);
    return null;
  }
};

const buildResourceKey = (resource: string, locale?: string) => {
  const normalized = resource.trim().toLowerCase();
  if (RESOURCE_WITH_LOCALE.has(normalized)) {
    const lang = locale?.trim().toLowerCase();
    if (!lang) {
      return null;
    }
    return `${normalized}-${lang}`;
  }
  return normalized;
};

const createErrorResponse = (message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const JSONBIN_RESOURCE_MAP: Record<string, string | { en: string; es: string }> = {
  'brand': 'VITE_JSONBIN_BRAND_BIN_ID',
  'transfer-config': 'VITE_JSONBIN_TRANSFER_BIN_ID',
  'social-media': 'VITE_JSONBIN_SOCIAL_BIN_ID',
  'testimonials': 'VITE_JSONBIN_TESTIMONIALS_BIN_ID',
  'blog': { en: 'VITE_JSONBIN_BLOG_EN', es: 'VITE_JSONBIN_BLOG_ES' },
  'tours': { en: 'VITE_JSONBIN_TOURS_EN', es: 'VITE_JSONBIN_TOURS_ES' },
  'transport-services': { en: 'VITE_JSONBIN_TRANSPORT_EN', es: 'VITE_JSONBIN_TRANSPORT_ES' },
  'example-tours': { en: 'VITE_JSONBIN_EXAMPLETESTOURS_EN_BIN_ID', es: 'VITE_JSONBIN_EXAMPLETESTOURS_ES_BIN_ID' },
  'story-elements': { en: 'VITE_JSONBIN_STORY_ELEMENTS_EN', es: 'VITE_JSONBIN_STORY_ELEMENTS_ES' },
  'intro-story': { en: 'VITE_JSONBIN_JOURNEY_EN', es: 'VITE_JSONBIN_JOURNEY_ES' },
  'translations': { en: 'VITE_JSONBIN_EN_BIN_ID', es: 'VITE_JSONBIN_ES_BIN_ID' },
};

const parseResourceKey = (key: string) => {
  const match = /^(.*)-(en|es)$/.exec(key);
  if (match) {
    return { resource: match[1], locale: match[2] };
  }
  return { resource: key };
};

const normalizeJsonBinUrl = (binDefinition: string | undefined): string | null => {
  if (!binDefinition || !binDefinition.trim()) return null;
  const trimmed = binDefinition.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/latest\/?$/i, '/latest');
  }
  return `https://api.jsonbin.io/v3/b/${trimmed}/latest`;
};

const getJsonBinUrl = (resource: string, locale: string | undefined, env: Record<string, any>): string | null => {
  const entry = JSONBIN_RESOURCE_MAP[resource];
  if (!entry) {
    return null;
  }

  if (typeof entry === 'string') {
    return normalizeJsonBinUrl(env[entry]);
  }

  if (!locale) {
    return null;
  }

  const envKey = entry[locale as 'en' | 'es'];
  return normalizeJsonBinUrl(env[envKey]);
};

const jsonBinFetch = async (url: string, masterKey?: string): Promise<unknown | null> => {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (masterKey) {
      headers['X-Master-Key'] = masterKey;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-cache',
    });

    if (!response.ok) {
      console.warn('[Cloudflare Function] JSONBin fetch failed for', url, response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('[Cloudflare Function] JSONBin fetch error for', url, error);
    return null;
  }
};

const loadStoredData = async (key: string, env: Record<string, any>, requestUrl?: string) => {
  if (env.DATA_KV && typeof env.DATA_KV.get === 'function') {
    try {
      const stored = await env.DATA_KV.get(key, { type: 'json' });
      if (stored !== null) {
        return stored;
      }
    } catch (err) {
      console.warn('[Cloudflare Function] KV read failed for', key, err);
    }
  }

  const localData = await readLocalJson(key, requestUrl);
  if (localData !== null) {
    return localData;
  }

  const { resource, locale } = parseResourceKey(key);
  const jsonBinUrl = getJsonBinUrl(resource, locale, env);
  if (!jsonBinUrl) {
    return null;
  }

  const payload = await jsonBinFetch(jsonBinUrl, env.VITE_JSONBIN_MASTER_KEY);
  if (payload === null) {
    return null;
  }

  try {
    await saveStoredData(key, payload, env);
  } catch (err) {
    console.warn('[Cloudflare Function] Failed to persist JSONBin fallback for', key, err);
  }

  return payload;
};

const saveStoredData = async (key: string, payload: unknown, env: Record<string, any>) => {
  if (!env.DATA_KV || typeof env.DATA_KV.put !== 'function') {
    throw new Error('DATA_KV namespace is not configured in Cloudflare Pages environment. PUT is unsupported.');
  }

  await env.DATA_KV.put(key, JSON.stringify(payload));
  return payload;
};

export async function onRequest(context: { request: Request; env: Record<string, any> }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const resource = url.searchParams.get('resource');
  const locale = url.searchParams.get('locale');

  if (!resource) {
    return createErrorResponse('Missing resource query parameter.', 400);
  }

  const key = buildResourceKey(resource, locale || undefined);
  if (!key) {
    return createErrorResponse('Missing or invalid locale for resource.', 400);
  }

  try {
    if (request.method === 'GET') {
      const data = await loadStoredData(key, env, request.url);
      if (data === null || data === undefined) {
        return createErrorResponse(`Data for resource '${resource}' not found.`, 404);
      }
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
      });
    }

    if (request.method === 'PUT') {
      const body = await request.json().catch(() => null);
      if (body === null) {
        return createErrorResponse('Request body must be valid JSON.', 400);
      }
      const saved = await saveStoredData(key, body, env);
      return new Response(JSON.stringify(saved), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return createErrorResponse('Unsupported HTTP method.', 405);
  } catch (error: any) {
    return createErrorResponse(error?.message ?? 'Internal error', 500);
  }
}

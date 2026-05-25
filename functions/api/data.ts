const RESOURCE_WITH_LOCALE = new Set([
  'blog',
  'i18n',
  'tour',
  'tours',
  'transport',
  'example-tours',
  'story-elements',
  'intro-story',
]);

const readLocalJson = async (key: string): Promise<unknown | null> => {
  try {
    const response = await fetch(new URL(`../data/${key}.json`, import.meta.url).toString());
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

const loadStoredData = async (key: string, env: Record<string, any>) => {
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

  return readLocalJson(key);
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
      const data = await loadStoredData(key, env);
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

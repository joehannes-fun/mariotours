export async function onRequest(context: { request: Request; env: Record<string, string>; }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const locale = String(url.searchParams.get('locale') || 'en').toLowerCase();
  const binId = locale === 'es' ? env.VITE_JSONBIN_BLOG_ES : env.VITE_JSONBIN_BLOG_EN;
  const masterKey = env.VITE_JSONBIN_MASTER_KEY;

  console.log(`[Cloudflare Function] Blog request for locale: ${locale}`);

  if (!binId || !masterKey) {
    console.error(`[Cloudflare Function] Missing config - binId: ${!!binId}, masterKey: ${!!masterKey}`);
    return new Response(JSON.stringify({ error: 'Blog bin ID or master key is not configured in Cloudflare Pages environment.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const apiUrl = `https://api.jsonbin.io/v3/b/${binId}/latest`;
    console.log(`[Cloudflare Function] Fetching from JSONBin: ${apiUrl}`);
    const response = await fetch(apiUrl, {
      headers: {
        'X-Master-Key': masterKey,
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      console.error(`[Cloudflare Function] JSONBin returned ${response.status}`);
      return new Response(JSON.stringify({ error: `JSONBin error: ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await response.text();
    console.log(`[Cloudflare Function] Success, returning ${body.length} bytes`);
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300',
      },
    });
  } catch (error) {
    console.error(`[Cloudflare Function] Error:`, error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

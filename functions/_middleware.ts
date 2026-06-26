const CANONICAL_HOST = 'bavaro.tours';
const REDIRECT_STATUS = 301; // Permanent redirect for SEO

export async function onRequest(context: { request: Request; next: () => Promise<Response> }) {
  const { request, next } = context;
  const url = new URL(request.url);
  const host = url.hostname;

  // If it's the Cloudflare Pages default domain, redirect to the canonical domain
  if (host !== CANONICAL_HOST) {
    const redirectUrl = `https://${CANONICAL_HOST}${url.pathname}${url.search}`;
    return Response.redirect(redirectUrl, REDIRECT_STATUS);
  }

  return next();
}
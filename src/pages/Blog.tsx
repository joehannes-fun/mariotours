import React, { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { useBrand } from '../contexts/BrandContext';
import { useI18n } from '../contexts/I18nContext';
import { useBlog } from '../contexts/BlogContext';
import { generateBlogPageMeta, generateBlogListStructuredData } from '../utils/seoHelpers';

const renderPostContent = (post: string) =>
  post
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => (
      <p key={paragraph} className="mb-4 leading-8 text-slate-700">
        {paragraph}
      </p>
    ));

const Blog = () => {
  const { locale } = useI18n();
  const { brandSettings } = useBrand();
  const { blogArticles, loading, error } = useBlog();
  const articles = blogArticles[locale] ?? [];

  useEffect(() => {
    const pageTitle = `${locale === 'es' ? 'Blog' : 'Blog'} | ${brandSettings.brandName}`;
    const pageDescription =
      locale === 'es'
        ? 'Blog de viajes y tours en Punta Cana. Descubre historias, tips de viaje y guías sobre excursiones en República Dominicana.'
        : 'Travel and tour blog in Punta Cana. Discover travel stories, tips, and guides about excursions in the Dominican Republic.';

    generateBlogPageMeta(pageTitle, pageDescription, window.location.href);

    if (articles.length > 0) {
      generateBlogListStructuredData(
        locale === 'es' ? 'Blog de Tours' : 'Blog',
        pageDescription,
        articles
      );
    }

    return () => {
      document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
        if (script.textContent?.includes('Blog')) {
          script.remove();
        }
      });
    };
  }, [locale, brandSettings.brandName, articles]);

  return (
    <div className="bg-gradient-to-b from-white via-cyan-50 to-orange-50 py-20">
      <div className="section-shell">
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-5xl font-bold text-slate-900 md:text-6xl">
            <FormattedMessage id="blog.title" defaultMessage="Blog" />
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            <FormattedMessage id="blog.description" values={{ brand: brandSettings.brandName }} />
          </p>
        </div>

        {loading ? (
          <div className="grid min-h-[40vh] place-items-center">
            <div className="text-slate-700">Loading blog articles...</div>
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-10 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-red-900">Unable to load blog content</h3>
            <div className="mb-4 text-sm text-red-800">
              <p className="mb-2"><strong>Status:</strong> Blog articles failed to load.</p>
              <p className="mb-2"><strong>Possible causes:</strong></p>
              <ul className="list-inside list-disc space-y-1 ml-4 text-xs">
                <li>Blog bin IDs not configured in Cloudflare Pages environment variables</li>
                <li>JSONBin API key not set or invalid</li>
                <li>CORS blocking direct JSONBin requests (use Cloudflare Functions endpoint)</li>
                <li>Network connectivity issue</li>
              </ul>
            </div>
            <p className="text-xs text-red-700">Check browser console (F12) for detailed error logs starting with [Blog]</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-700 shadow-sm">
            <FormattedMessage id="blog.noArticles" defaultMessage="No articles available yet. Please check back soon." />
            <p className="mt-3 text-xs text-slate-500">If blog should have content, verify VITE_JSONBIN_BLOG_EN and VITE_JSONBIN_BLOG_ES environment variables are set.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {articles.map((article) => (
              <article key={article.id} id={article.slug} className="rounded-[2rem] border border-white/80 bg-white/95 p-8 shadow-xl shadow-slate-200/50">
                <header className="mb-6">
                  <h2 className="text-3xl font-semibold text-slate-900">{article.title}</h2>
                  {article.tour && (
                    <p className="mt-2 text-sm uppercase tracking-[0.24em] text-cyan-700">
                      <FormattedMessage id="blog.relatedTourLabel" defaultMessage="Related tour" />: {article.tour}
                    </p>
                  )}
                  {article.date && <time dateTime={article.date} className="mt-3 block text-sm text-slate-500">{article.date}</time>}
                </header>
                <div className="prose prose-slate max-w-none">{renderPostContent(article.post)}</div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;

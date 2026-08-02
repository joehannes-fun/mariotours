import React, { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { MdTour, MdEvent } from 'react-icons/md';
import { useBrand } from '../contexts/BrandContext';
import { useI18n } from '../contexts/I18nContext';
import { useBlog } from '../contexts/BlogContext';
import { generateBlogPageMeta, generateBlogListStructuredData } from '../utils/seoHelpers';
import SeaWaveDivider from '../components/ui/SeaWaveDivider';

const renderPostContent = (post: string) =>
  post
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph, index) => {
      const isFirst = index === 0;
      return (
        <p
          key={`${index}-${paragraph.substring(0, 20)}`}
          className={`leading-relaxed font-['Poppins',sans-serif] whitespace-pre-line ${
            isFirst
              ? 'text-xl md:text-2xl text-slate-800 font-medium mb-8 border-l-4 border-teal-500 pl-4 md:pl-6 italic'
              : 'text-lg text-slate-700 mb-6'
          }`}
        >
          {paragraph}
        </p>
      );
    });

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
    <div className="py-16 md:py-24 relative z-10">
      <div className="section-shell">
        <div className="mb-16 text-center">
          <div className="artsy-title-card mb-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
              Mario Tours Stories & Travel Guides
            </span>
          </div>
          <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl font-['Playfair_Display',serif] tracking-tight drop-shadow-md">
            <FormattedMessage id="blog.title" defaultMessage="Blog" />
          </h1>
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-slate-200 font-['Poppins',sans-serif] leading-relaxed mt-4 drop-shadow">
            <FormattedMessage id="blog.description" values={{ brand: brandSettings.brandName }} />
          </p>
        </div>

        {loading ? (
          <div className="grid min-h-[40vh] place-items-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
              <div className="text-slate-200 font-medium font-['Poppins',sans-serif]">Loading blog articles...</div>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-100 bg-white/90 p-8 md:p-12 shadow-xl max-w-2xl mx-auto backdrop-blur-md">
            <h3 className="mb-4 text-xl font-bold text-red-900">Unable to load blog content</h3>
            <div className="mb-6 text-sm text-red-800 space-y-3 font-['Poppins',sans-serif] leading-relaxed">
              <p><strong>Status:</strong> Blog articles failed to load.</p>
              <p><strong>Possible causes:</strong></p>
              <ul className="list-inside list-disc space-y-1.5 pl-2 text-xs">
                <li>Blog bin IDs not configured in Cloudflare Pages environment variables</li>
                <li>JSONBin API key not set or invalid</li>
                <li>CORS blocking direct JSONBin requests (use Cloudflare Functions endpoint)</li>
                <li>Network connectivity issue</li>
              </ul>
            </div>
            <p className="text-xs text-red-600 font-medium">Check browser console (F12) for detailed error logs starting with [Blog]</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-3xl border border-white/60 bg-white/80 p-12 text-center text-slate-700 shadow-lg max-w-xl mx-auto backdrop-blur-md">
            <p className="text-lg font-medium">
              <FormattedMessage id="blog.noArticles" defaultMessage="No articles found." />
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {articles.map((article, idx) => (
              <div key={article.id} className="relative">
                <article
                  id={article.slug}
                  className={`artsy-glass-card rounded-[2rem] p-6 md:p-12 transition-all duration-500 hover:-translate-y-2 animate-wave-sway-${(idx % 10) + 1}`}
                >
                  <header className="mb-8 border-b border-slate-200/50 pb-6">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#04131D] font-['Playfair_Display',serif] tracking-tight leading-tight mb-5">
                      {article.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm font-['Poppins',sans-serif]">
                      {article.tour && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-4 py-1.5 font-semibold text-teal-900 border border-teal-500/30">
                          <MdTour className="h-4 w-4 text-teal-700" />
                          <FormattedMessage id="blog.relatedTourLabel" defaultMessage="Related tour" />: {article.tour}
                        </span>
                      )}
                      {article.date && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 font-medium text-slate-700 border border-white/60">
                          <MdEvent className="h-4 w-4 text-slate-500" />
                          <time dateTime={article.date}>
                            {article.date}
                          </time>
                        </span>
                      )}
                    </div>
                  </header>
                  <div className="prose prose-slate max-w-none font-['Poppins',sans-serif]">
                    {renderPostContent(article.post)}
                  </div>
                </article>
                <div className="mt-8">
                  <SeaWaveDivider variant="layered-wave" colorClass="text-[#04131D]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;

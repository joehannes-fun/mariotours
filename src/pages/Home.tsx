import React, { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import StorySection from '../components/StorySection';
import AdventureCard from '../components/AdventureCard';
import TestimonialDisplay from '../components/TestimonialDisplay';
import SocialMediaVideos from '../components/SocialMediaVideos';
import FABWhatsApp from '../components/FABWhatsApp';
import { useBrand } from '../contexts/BrandContext';
import { useI18n } from '../contexts/I18nContext';
import { generateWhatsAppMessage } from '../utils/whatsapp';
import { getFallbackIntroStory, getIntroStoryPreferred, StoryData } from '../services/introStoryService';

const HERO_BACKGROUND_IMAGE = '/imgs/tours/tour_saona_island_detail_12.jpg';
const HERO_BACKGROUND_VIDEO = '/buggy.mp4';

const Home: React.FC = () => {
  const { brandSettings } = useBrand();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const [storyData, setStoryData] = useState<StoryData | null>(null);

  useEffect(() => {
    let isCurrent = true;

    getIntroStoryPreferred(locale).then((data) => {
      if (isCurrent) {
        setStoryData(data);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [locale]);

  return (
    <div id="top" className="relative">
      {/* FAB WhatsApp Button */}
      <FABWhatsApp phoneNumber={brandSettings.phoneNumber} />

      {/* Hero Section */}
      <Hero backgroundImage={HERO_BACKGROUND_IMAGE} backgroundVideo={HERO_BACKGROUND_VIDEO} />

      {/* Story Narrative Sections */}
      <div className="space-y-0 min-h-[50vh]">
        {!storyData ? (
          <section className="home-section shore-section py-32 flex justify-center items-center">
            <div className="flex flex-col items-center gap-6 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-teal-800/10" />
              <div className="text-2xl text-teal-900/40 font-bold font-lobster">Loading your tropical journey...</div>
            </div>
          </section>
        ) : (
          storyData.sections.map((section, index) => {
            if (section.id === 'adventure_preview') {
              // Adventure preview section with cards
              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="home-section lagoon-section relative overflow-hidden px-4 py-24 sm:py-28 md:px-8 lg:py-32"
                >
                  <div className="parallax-wash parallax-wash-left" />
                  <div className="parallax-wash parallax-wash-right" />

                  <div className="relative z-10 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
                      <div className="section-icon mx-auto mb-5">
                        {section.emoji}
                      </div>
                      <h2 className="mb-4 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl md:text-5xl">
                        {section.title}
                      </h2>
                      <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                        {section.description}
                      </p>
                    </div>

                    {/* Adventure cards grid */}
                    {section.adventures && (
                      <div className="grid gap-7 md:grid-cols-3 lg:gap-8">
                        {section.adventures.map((adventure) => (
                          <AdventureCard key={adventure.id} adventure={adventure} />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            // Regular story sections
            return (
              <StorySection
                key={section.id}
                id={section.id}
                title={section.title}
                emoji={section.emoji}
                timeframe={section.timeframe}
                description={section.description}
                narrative={section.narrative || ''}
                imageUrl={section.imageUrl}
                vimeoUrl={section.vimeoUrl}
                mood={section.mood || ''}
                isAlternate={index % 2 === 1}
                themeName={['shore-section', 'lagoon-section', 'cove-section', 'bay-section'][index % 4]}
              />
            );
          })
        )}
      </div>

      {/* Call-to-Action Banner: prefer dynamic CTAs from storyData.callToActions */}
      {!storyData ? null : storyData.callToActions && storyData.callToActions.length > 0 ? (
        <section className="home-section sunset-section px-4 py-20 text-white sm:py-24 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="mb-6 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
              {storyData.storyTitle || 'Ready for Your Perfect Day in Paradise?'}
            </h2>
            {storyData.storyTagline && (
              <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-white/90 sm:text-xl">
                {storyData.storyTagline}
              </p>
            )}
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              {storyData.callToActions.map((cta, i) => (
                <button
                  key={`${cta.text}-${i}`}
                  onClick={() => {
                    if (cta.target?.startsWith('http')) {
                      window.open(cta.target, '_blank');
                    } else {
                      navigate(cta.target || '/');
                    }
                  }}
                  className="px-8 py-4 bg-white text-pink-600 font-bold rounded-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  {cta.text}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="home-section sunset-section px-4 py-20 text-white sm:py-24 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="mb-6 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
              Ready for Your Perfect Day in Paradise?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-white/90 sm:text-xl">
              Your adventure is just one click away. Contact us on WhatsApp or choose your adventure below.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button
                onClick={() =>
                  window.open(
                    generateWhatsAppMessage(
                      brandSettings.phoneNumber,
                      'Hola! Me gustaría información sobre sus tours.'
                    ),
                    '_blank'
                  )
                }
                className="px-8 py-4 bg-white text-pink-600 font-bold rounded-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Chat on WhatsApp
              </button>
              <button
                onClick={() => navigate('/tours')}
                className="px-8 py-4 bg-white/20 border-2 border-white text-white font-bold rounded-lg hover:bg-white/30 transition-all"
              >
                View Adventures
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <TestimonialDisplay locale={locale} />

      {/* Why Choose Us Section - Enhanced */}
      <section className="home-section reef-section px-4 py-20 text-white sm:py-24 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
            <h2 className="mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
              <FormattedMessage id="features.title" />
            </h2>
            <p className="text-lg leading-8 text-white/[.78] sm:text-xl">Thoughtful service from arrival to return</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {/* Safety First */}
            <div className="home-feature-card group p-8">
              <div className="text-5xl mb-4">🛡️</div>
              <h3 className="text-2xl font-bold mb-3">
                <FormattedMessage id="features.safety.title" />
              </h3>
              <p className="text-slate-300">
                <FormattedMessage id="features.safety.description" />
              </p>
            </div>

            {/* Curated Experiences */}
            <div className="home-feature-card group p-8">
              <div className="text-5xl mb-4">🌿</div>
              <h3 className="text-2xl font-bold mb-3">
                <FormattedMessage id="features.experiences.title" />
              </h3>
              <p className="text-slate-300">
                <FormattedMessage id="features.experiences.description" />
              </p>
            </div>

            {/* Transportation */}
            <div className="home-feature-card group p-8">
              <div className="text-5xl mb-4">🚗</div>
              <h3 className="text-2xl font-bold mb-3">
                <FormattedMessage id="features.transportation.title" />
              </h3>
              <p className="text-slate-300">
                <FormattedMessage id="features.transportation.description" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="home-section dawn-section relative overflow-hidden px-4 py-20 sm:py-24 md:px-8">
        <div className="parallax-wash parallax-wash-right" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="mb-6 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
            Your Caribbean Day Awaits
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
            Step into warm water, fresh air, local flavor, and a day that stays with you.
          </p>
          <button
            onClick={() =>
              window.open(
                generateWhatsAppMessage(
                  brandSettings.phoneNumber,
                  'Hola! Quiero hacer una reserva. ¿Cuáles son mis opciones?'
                ),
                '_blank'
              )
            }
            className="px-10 py-4 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold text-lg rounded-lg hover:shadow-2xl transition-all hover:scale-105 inline-block"
          >
            Book Your Adventure Now
          </button>
        </div>
      </section>

      {/* Social Media Videos Section - Only shows if videos exist */}
      <SocialMediaVideos />
    </div>
  );
};

export default Home;

import React, { useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { ServiceCategory, Tour, getServicesByCategory } from '../services/toursService';

const ServiceDetails: React.FC = () => {
  const { locale } = useI18n();
  const { category = 'tours', id = '' } = useParams();
  const [service, setService] = useState<Tour | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const loadService = async () => {
      const services = await getServicesByCategory(category as ServiceCategory, locale);
      const routeId = id.split('-')[0];
      const match = services.find((item) => String(item.id) === routeId) ?? null;
      setService(match);
      setActiveIndex(0);
    };

    loadService();
  }, [category, id, locale]);

  const images = useMemo(() => {
    if (!service) {
      return [];
    }

    return service.details.images.length > 0 ? service.details.images : [service.image];
  }, [service]);

  if (!service) {
    return (
      <div className="section-shell py-20 text-center">
        <p className="text-lg text-slate-600">
          <FormattedMessage id="details.notFound" defaultMessage="Service details could not be found." />
        </p>
      </div>
    );
  }

  const currentImage = images[activeIndex] ?? service.image;

  return (
    <div className="bg-gradient-to-b from-cyan-50 via-white to-amber-50 py-16">
      <div className="section-shell space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link to={category === 'transport' ? '/transport' : '/tours'} className="text-sm font-semibold text-teal-700 hover:text-teal-900">
            <FormattedMessage id="details.back" defaultMessage="← Back to listings" />
          </Link>
        </div>

        <article className="glass-card overflow-hidden rounded-[2rem]">
          <div className="relative bg-slate-950">
            <img src={currentImage} alt={service.title} className="h-[420px] w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-8 text-white">
              <h1 className="text-4xl font-bold md:text-5xl">{service.title}</h1>
              <p className="mt-3 max-w-3xl text-white/80">{service.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-b border-slate-200 bg-white px-6 py-6 md:grid-cols-4">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                onClick={() => setActiveIndex(index)}
                className={`overflow-hidden rounded-2xl border-2 transition ${index === activeIndex ? 'border-teal-500' : 'border-transparent'}`}
                aria-label={`Show image ${index + 1}`}
              >
                <img src={image} alt={`${service.title} ${index + 1}`} className="h-24 w-full object-cover" />
              </button>
            ))}
          </div>

          <div className="space-y-8 p-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                <FormattedMessage id="details.pricing" defaultMessage="Pricing" />
              </h2>
              <div className="flex flex-wrap gap-3">
                {service.pricingOptions.map((option) => (
                  <span key={option.tier} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
                    {option.tier}: {option.price}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                <FormattedMessage id="details.description" defaultMessage="Description" />
              </h2>
              <p className="leading-8 text-slate-600">{service.details.description}</p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
};

export default ServiceDetails;

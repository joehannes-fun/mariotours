import React, { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import TourCard from '../components/TourCard';
import SeaWaveDivider from '../components/ui/SeaWaveDivider';
import { Tour, getTours, getServiceSlug } from '../services/toursService';
import { useI18n } from '../contexts/I18nContext';
import { useBrand } from '../contexts/BrandContext';

const Tours: React.FC = () => {
  const { locale } = useI18n();
  const { brandSettings } = useBrand();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTours();
  }, [locale]);

  const loadTours = async () => {
    setLoading(true);
    const fetchedTours = await getTours(locale);
    setTours(fetchedTours);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 rounded-full bg-teal-600/20" />
          <p className="text-lg font-bold text-[#04131D]">Loading Excursions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 min-h-screen relative z-10">
      <div className="section-shell">
        <div className="mb-14 text-center">
          <div className="artsy-title-card mb-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
              Mario Tours Premium Collection
            </span>
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-white drop-shadow-md md:text-6xl">
            <FormattedMessage id="tours.title" />
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-light text-slate-200 drop-shadow">
            <FormattedMessage id="tours.dynamicSubtitle" values={{ brand: brandSettings.brandName }} />
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour, index) => (
            <TourCard
              key={tour.id}
              image={tour.image}
              title={tour.title}
              description={tour.description}
              price={tour.price}
              pricingOptions={tour.pricingOptions}
              excursionName={tour.title}
              detailsPath={`/details/tours/${getServiceSlug(tour)}`}
              index={index}
            />
          ))}
        </div>
      </div>
      
      <div className="mt-16">
        <SeaWaveDivider variant="swell" colorClass="text-[#04131D]" />
      </div>
    </div>
  );
};

export default Tours;

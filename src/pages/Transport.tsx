import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import TourCard from '../components/TourCard';
import { Tour, getTransportServices, getServiceSlug } from '../services/toursService';
import { useI18n } from '../contexts/I18nContext';

const Transport: React.FC = () => {
  const { locale } = useI18n();
  const [services, setServices] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      const fetchedServices = await getTransportServices(locale);
      setServices(fetchedServices);
      setLoading(false);
    };

    loadServices();
  }, [locale]);

  if (loading) {
    return <div className="grid min-h-screen place-items-center">Loading...</div>;
  }

  return (
    <div className="py-16">
      <div className="section-shell">
        <h1 className="mb-3 text-center text-5xl font-bold text-slate-900">
          <FormattedMessage id="transport.title" defaultMessage="Airport Shuttle & Taxi" />
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-center text-slate-600">
          <FormattedMessage
            id="transport.subtitle"
            defaultMessage="Private airport transfers and local rides for smooth arrivals and departures."
          />
        </p>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <TourCard
              key={service.id}
              image={service.image}
              title={service.title}
              description={service.description}
              price={service.price}
              pricingOptions={service.pricingOptions}
              excursionName={service.title}
              detailsPath={`/details/transport/${getServiceSlug(service)}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Transport;

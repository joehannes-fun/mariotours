export interface TestimonialRecord {
  id: string;
  name: string;
  email: string;
  review: string;
  rating: number;
  profileImage?: string;
  createdAt: string;
}

const JSONBIN_MASTER_KEY = import.meta.env.VITE_JSONBIN_MASTER_KEY;
const JSONBIN_TESTIMONIALS_BIN_ID = import.meta.env.VITE_JSONBIN_TESTIMONIALS_BIN_ID;

const defaultTestimonials: TestimonialRecord[] = [
  {
    id: '1',
    name: 'Sarah Martinez',
    email: 'sarah@example.com',
    review:
      'The quad adventure was absolutely incredible! Our guide knew everything about the jungle, and the cenote was so refreshing. Best day of our vacation!',
    rating: 5,
    createdAt: '2024-03-15'
  },
  {
    id: '2',
    name: 'Michael Johnson',
    email: 'michael@example.com',
    review:
      'The Saona Island party boat exceeded all expectations. The energy was infectious, the food was delicious, and the snorkeling was amazing. Definitely doing it again next year!',
    rating: 5,
    createdAt: '2024-03-10'
  },
  {
    id: '3',
    name: 'Emma García',
    email: 'emma@example.com',
    review:
      'Las cascadas de Samaná fueron hermosas. La caminata fue perfecta, el guía muy atento, y las fotos quedaron espectaculares. Una experiencia que nunca voy a olvidar.',
    rating: 5,
    createdAt: '2024-03-05'
  }
];

const resolveJsonBinUrl = (binId: string) =>
  binId.startsWith('http') ? binId : `https://api.jsonbin.io/v3/b/${binId}/latest`;

const unwrapJsonBinRecord = (payload: any): TestimonialRecord[] => {
  const record = payload?.record || payload;
  if (Array.isArray(record?.testimonials)) {
    return record.testimonials;
  }
  if (Array.isArray(record)) {
    return record;
  }
  return defaultTestimonials;
};

export const getTestimonials = async (): Promise<TestimonialRecord[]> => {
  try {
    if (!JSONBIN_TESTIMONIALS_BIN_ID) {
      console.warn('Missing JSONBin testimonials bin id, using defaults');
      return defaultTestimonials;
    }

    const response = await fetch(resolveJsonBinUrl(JSONBIN_TESTIMONIALS_BIN_ID), {
      headers: JSONBIN_MASTER_KEY ? { 'X-Master-Key': JSONBIN_MASTER_KEY } : {},
      cache: 'no-cache'
    });

    if (!response.ok) {
      console.warn('Failed to fetch testimonials from JSONBin, using defaults');
      return defaultTestimonials;
    }

    const payload = await response.json();
    return unwrapJsonBinRecord(payload);
  } catch (error) {
    console.error('Error loading testimonials:', error);
    return defaultTestimonials;
  }
};

export const saveTestimonials = async (testimonials: TestimonialRecord[]): Promise<TestimonialRecord[]> => {
  try {
    if (!JSONBIN_TESTIMONIALS_BIN_ID) {
      throw new Error('Missing JSONBin testimonials bin id');
    }

    const url = JSONBIN_TESTIMONIALS_BIN_ID.startsWith('http')
      ? JSONBIN_TESTIMONIALS_BIN_ID
      : `https://api.jsonbin.io/v3/b/${JSONBIN_TESTIMONIALS_BIN_ID}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(JSONBIN_MASTER_KEY ? { 'X-Master-Key': JSONBIN_MASTER_KEY } : {})
      },
      body: JSON.stringify({ testimonials })
    });

    if (!response.ok) {
      throw new Error('Failed to save testimonials to JSONBin');
    }

    return testimonials;
  } catch (error) {
    console.error('Error saving testimonials:', error);
    return testimonials;
  }
};

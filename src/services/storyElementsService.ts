import { JourneyLocale } from './introStoryService';

export type StoryElementType = 'title' | 'paragraph' | 'picture' | 'video' | 'cta';
export type VideoOrientation = 'vertical' | 'horizontal';
export type VideoSource = 'vimeo' | 'tiktok' | 'youtube' | 'custom';
export type CTAButtonVariant = 'primary' | 'secondary' | 'outline';

export interface CTAButton {
  id: string;
  text: string;
  link: string;
  variant: CTAButtonVariant;
}

export interface StoryElement {
  id: string;
  type: StoryElementType;
  order: number;
  content: {
    title?: string;
    text?: string;
    imageUrl?: string;
    videoUrl?: string;
    videoOrientation?: VideoOrientation;
    videoSource?: VideoSource;
    emoji?: string;
    description?: string;
    buttons?: CTAButton[];
  };
}

export interface StoryElementsData {
  storyTitle: string;
  storyTagline: string;
  elements: StoryElement[];
}

const JSONBIN_MASTER_KEY = import.meta.env.VITE_JSONBIN_MASTER_KEY;
const JSONBIN_STORY_ELEMENTS_EN = import.meta.env.VITE_JSONBIN_STORY_ELEMENTS_EN;
const JSONBIN_STORY_ELEMENTS_ES = import.meta.env.VITE_JSONBIN_STORY_ELEMENTS_ES;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const resolveStoryElementsBin = (locale: JourneyLocale) =>
  locale === 'es' ? JSONBIN_STORY_ELEMENTS_ES : JSONBIN_STORY_ELEMENTS_EN;

const resolveJsonBinUrl = (binOrUrl: string) => {
  if (/^https?:\/\//i.test(binOrUrl)) {
    return binOrUrl;
  }
  return `https://api.jsonbin.io/v3/b/${binOrUrl}`;
};

const unwrapJsonBinRecord = (payload: unknown): unknown => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const candidate = payload as { record?: unknown };
  const record = candidate.record;

  if (record && typeof record === 'object' && 'record' in record) {
    return (record as { record?: unknown }).record;
  }

  return record ?? payload;
};

const isStoryElementsData = (input: unknown): input is StoryElementsData => {
  if (!input || typeof input !== 'object') {
    return false;
  }

  const data = input as Partial<StoryElementsData>;
  return (
    typeof data.storyTitle === 'string' &&
    typeof data.storyTagline === 'string' &&
    Array.isArray(data.elements)
  );
};

export const getStoryElements = async (locale: JourneyLocale): Promise<StoryElementsData | null> => {
  const binOrUrl = resolveStoryElementsBin(locale);

  if (!binOrUrl) {
    return null;
  }

  try {
    const headers: HeadersInit = JSONBIN_MASTER_KEY ? { 'X-Master-Key': JSONBIN_MASTER_KEY } : {};
    const response = await fetch(`${resolveJsonBinUrl(binOrUrl)}/latest`, {
      headers,
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`JSONBin request failed with ${response.status}`);
    }

    const payload = await response.json();
    const remoteData = unwrapJsonBinRecord(payload);

    return isStoryElementsData(remoteData) ? remoteData : null;
  } catch (error) {
    console.error(`Failed to fetch ${locale} story elements:`, error);
    return null;
  }
};

export const saveStoryElements = async (
  data: StoryElementsData,
  locale: JourneyLocale
): Promise<boolean> => {
  const binOrUrl = resolveStoryElementsBin(locale);

  if (!binOrUrl) {
    console.error('Story elements bin ID not configured');
    return false;
  }

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_MASTER_KEY || '',
    };

    const response = await fetch(resolveJsonBinUrl(binOrUrl), {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`JSONBin save failed with ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error(`Failed to save ${locale} story elements:`, error);
    return false;
  }
};

export const createNewElement = (type: StoryElementType, order: number): StoryElement => ({
  id: `element-${Date.now()}`,
  type,
  order,
  content: {},
});

export const uploadImage = async (file: File, onProgress?: (percent: number) => void): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'story');

  try {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    return await new Promise((resolve, reject) => {
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          if (data.secure_url) {
            resolve(data.secure_url);
          } else {
            reject(new Error('No secure_url in response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload request failed'));

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};

// Social media platform types
export interface SocialMediaAccount {
  platform: 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'twitter' | 'linkedin';
  username: string;
  url: string;
  enabled: boolean;
}

export interface SocialMediaVideo {
  id: string;
  platform: 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'twitter';
  title: string;
  url: string;
  embedUrl?: string;
  description: string;
  createdAt: string;
}

// JSONBin configuration
const JSONBIN_MASTER_KEY = import.meta.env.VITE_JSONBIN_MASTER_KEY;
const JSONBIN_SOCIAL_BIN_ID = import.meta.env.VITE_JSONBIN_SOCIAL_BIN_ID;

// Default social media data
const defaultSocialMediaData = {
  accounts: [] as SocialMediaAccount[],
  videos: [] as SocialMediaVideo[]
};

// Get all social media data
export const getSocialMediaData = async () => {
  try {
    if (!JSONBIN_SOCIAL_BIN_ID || !JSONBIN_MASTER_KEY) {
      console.warn('JSONBin configuration missing for social media data, using defaults');
      return defaultSocialMediaData;
    }

    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_SOCIAL_BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': JSONBIN_MASTER_KEY,
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      console.warn('Failed to fetch social media data from JSONBin, using defaults');
      return defaultSocialMediaData;
    }

    const data = await response.json();
    const socialData = data.record?.record || data.record || {};
    return {
      accounts: Array.isArray(socialData.accounts) ? socialData.accounts : defaultSocialMediaData.accounts,
      videos: Array.isArray(socialData.videos) ? socialData.videos : defaultSocialMediaData.videos
    };
  } catch (error) {
    console.error('Error loading social media data:', error);
    return defaultSocialMediaData;
  }
};

// Save social media data
export const saveSocialMediaData = async (data: { accounts: SocialMediaAccount[]; videos: SocialMediaVideo[] }) => {
  try {
    if (!JSONBIN_SOCIAL_BIN_ID || !JSONBIN_MASTER_KEY) {
      throw new Error('JSONBin configuration missing for social media data');
    }

    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_SOCIAL_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_MASTER_KEY,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save social media data to JSONBin');
    }

    return data;
  } catch (error) {
    console.error('Error saving social media data:', error);
    throw error;
  }
};

// Add social media account
export const addSocialMediaAccount = async (account: SocialMediaAccount) => {
  const data = await getSocialMediaData();
  const existingIndex = data.accounts.findIndex((a: SocialMediaAccount) => a.platform === account.platform);
  
  if (existingIndex >= 0) {
    data.accounts[existingIndex] = account;
  } else {
    data.accounts.push(account);
  }
  
  return saveSocialMediaData(data);
};

// Remove social media account
export const removeSocialMediaAccount = async (platform: string) => {
  const data = await getSocialMediaData();
  data.accounts = data.accounts.filter((a: SocialMediaAccount) => a.platform !== platform);
  return saveSocialMediaData(data);
};

// Add social media video
export const addSocialMediaVideo = async (video: SocialMediaVideo) => {
  const data = await getSocialMediaData();
  data.videos.push(video);
  return saveSocialMediaData(data);
};

// Remove social media video
export const removeSocialMediaVideo = async (videoId: string) => {
  const data = await getSocialMediaData();
  data.videos = data.videos.filter((v: SocialMediaVideo) => v.id !== videoId);
  return saveSocialMediaData(data);
};

// Get videos by platform
export const getVideosByPlatform = async (platform: string) => {
  const data = await getSocialMediaData();
  return data.videos.filter((v: SocialMediaVideo) => v.platform === platform);
};

// Update social media video
export const updateSocialMediaVideo = async (videoId: string, updates: Partial<SocialMediaVideo>) => {
  const data = await getSocialMediaData();
  const videoIndex = data.videos.findIndex((v: SocialMediaVideo) => v.id === videoId);
  
  if (videoIndex >= 0) {
    data.videos[videoIndex] = { ...data.videos[videoIndex], ...updates };
  }
  
  return saveSocialMediaData(data);
};

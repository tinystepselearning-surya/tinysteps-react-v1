/**
 * Image Store for Word Pictures
 * Manages custom images uploaded by teachers for vocabulary words
 */

const STORAGE_KEY = "spellbee-word-images-v1";

export interface WordImage {
  name: string;
  url: string; // blob URL from URL.createObjectURL
}

export type ImageStore = Record<string, WordImage>;

/**
 * Load all word images from localStorage
 */
export function loadImages(): ImageStore {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.warn("Failed to load word images:", err);
    return {};
  }
}

/**
 * Save all word images to localStorage
 */
export function saveImages(store: ImageStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn("Failed to save word images:", err);
  }
}

/**
 * Get image for a specific word
 */
export function getImage(wordId: string): WordImage | null {
  const store = loadImages();
  return store[wordId] || null;
}

/**
 * Set image for a specific word
 */
export function setImage(wordId: string, file: File): Promise<WordImage> {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const image: WordImage = {
        name: file.name,
        url,
      };

      const store = loadImages();
      
      // Revoke old URL if exists to prevent memory leak
      if (store[wordId]) {
        try {
          URL.revokeObjectURL(store[wordId].url);
        } catch {
          // Ignore revoke errors
        }
      }

      store[wordId] = image;
      saveImages(store);
      
      resolve(image);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Remove image for a specific word
 */
export function removeImage(wordId: string): void {
  const store = loadImages();
  
  if (store[wordId]) {
    // Revoke blob URL to free memory
    try {
      URL.revokeObjectURL(store[wordId].url);
    } catch {
      // Ignore revoke errors
    }
    
    delete store[wordId];
    saveImages(store);
  }
}

/**
 * Clear all images (useful for reset/cleanup)
 */
export function clearAllImages(): void {
  const store = loadImages();
  
  // Revoke all URLs
  Object.values(store).forEach((image) => {
    try {
      URL.revokeObjectURL(image.url);
    } catch {
      // Ignore revoke errors
    }
  });
  
  localStorage.removeItem(STORAGE_KEY);
}

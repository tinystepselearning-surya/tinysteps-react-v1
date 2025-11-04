/**
 * SpellBee Images - Local Asset Loader
 * 
 * USAGE:
 * Place image files in /src/assets/spellbee-images/
 * Naming convention: <wordId>.(png|jpg|jpeg|webp)
 * Examples: "apple.png", "action.jpg", "beautiful.webp"
 * 
 * The wordId should match the word.word property (case-insensitive).
 * Spaces in filenames should use hyphens (e.g., "ice-cream.png").
 * 
 * If no image exists for a word, getWordImageUrl returns null.
 */

// Eagerly import all images from the assets folder
// This creates a map at build time (Vite optimization)
const imageModules = import.meta.glob(
  '/src/assets/spellbee-images/*.{png,jpg,jpeg,webp}',
  { eager: true, query: '?url', import: 'default' }
);

// Build a normalized lookup map: wordId → URL
const imageMap = new Map<string, string>();

for (const [path, url] of Object.entries(imageModules)) {
  // Extract filename from path
  // Example: "/src/assets/spellbee-images/apple.png" → "apple.png"
  const filename = path.split('/').pop();
  if (!filename) continue;
  
  // Remove extension: "apple.png" → "apple"
  const baseName = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  
  // Normalize: lowercase, trim
  const normalized = baseName.toLowerCase().trim();
  
  // url is the string URL from Vite's import
  if (typeof url === 'string') {
    imageMap.set(normalized, url);
  }
}

/**
 * Get the URL for a word's image
 * 
 * @param wordId - The word identifier (e.g., "apple", "Action", "ice cream")
 * @returns Image URL if found, null otherwise
 */
export function getWordImageUrl(wordId: string): string | null {
  // Normalize the wordId: lowercase, spaces to hyphens, trim
  const normalized = wordId
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
  
  return imageMap.get(normalized) || null;
}

/**
 * Get all available word IDs with images
 * Useful for debugging or admin panels
 */
export function getAvailableWordIds(): string[] {
  return Array.from(imageMap.keys());
}

/**
 * Check if an image exists for a word
 */
export function hasWordImage(wordId: string): boolean {
  return getWordImageUrl(wordId) !== null;
}

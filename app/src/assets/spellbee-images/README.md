# SpellBee Flash Trainer - Image Assets

This directory contains local image assets for the SpellBee Flash Trainer game.

## Usage

Place word images in this directory with the following naming convention:

```
<wordId>.(png|jpg|jpeg|webp)
```

### Examples
- `action.png` - Image for the word "action"
- `science.jpg` - Image for the word "science"
- `apple.webp` - Image for the word "apple"

### Normalization Rules
The asset loader automatically normalizes word IDs:
- Converts to lowercase
- Replaces spaces with hyphens
- Strips file extensions

So for the word "Big Apple", you would name the file:
- `big-apple.png`

## How It Works

Images are loaded at build time using Vite's `import.meta.glob` feature:
- All images in this directory are bundled into the app
- A map is created from word ID to asset URL
- If a word has no image, a blank spacer is shown instead

## File Formats

Supported formats:
- `.png` - Recommended for transparency
- `.jpg` / `.jpeg` - For photos
- `.webp` - Modern format with good compression

## Asset Guidelines

1. **Size**: Keep images under 200KB for optimal performance
2. **Dimensions**: 800x600 or similar aspect ratio works well
3. **Content**: Child-appropriate, clear, and directly related to the word
4. **No upload UI**: Teachers must rebuild the app to add new images

## Migration from Upload System

Previously, this game used a localStorage-based upload system where teachers could upload images at runtime. This has been replaced with build-time asset loading for:
- Simpler deployment (no localStorage quota issues)
- Better performance (images bundled and optimized)
- Version control (images tracked with code)

The tradeoff is that adding new images requires a rebuild instead of runtime upload.

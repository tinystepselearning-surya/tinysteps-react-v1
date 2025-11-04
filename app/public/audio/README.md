# Audio Files for SpellBee Flash Trainer

## Required Audio Files

This folder should contain the following audio files:

1. `correct.mp3` - Cheerful sound for correct answers
2. `wrong.mp3` - Gentle buzz for incorrect answers

## Option 1: Use Online Tools (Recommended)

### For correct.mp3:
- Use a cheerful "ding" or "chime" sound
- Download from: https://freesound.org or https://mixkit.co/free-sound-effects/
- Search for: "success chime", "correct ding", "achievement bell"
- Recommended: Short (0.5-1 sec), pleasant tone

### For wrong.mp3:
- Use a gentle "buzz" or "oops" sound
- Search for: "wrong buzz", "error beep", "gentle negative"
- Recommended: Short (0.5-1 sec), not harsh

## Option 2: Generate Using Text-to-Speech

The game also uses Web Speech API for word pronunciation, so audio files are optional placeholders for feedback sounds.

## Option 3: Create Silent Placeholders

If you want to test without sounds, create 1-second silent MP3 files.

## Current Status

⚠️ **Audio files not yet added** - The game will still work using Web Speech API for word pronunciation. The correct/wrong feedback sounds will fail gracefully.

## Integration

These files are referenced in `/src/games/spellbee-flash/utils.ts` via the `playAudio()` function.

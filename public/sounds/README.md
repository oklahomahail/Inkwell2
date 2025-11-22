# Ambient Sounds for Focus Mode

This directory contains ambient sound files for Inkwell's Advanced Focus Mode feature.

## Required Sound Files

The following 8 ambient sound files are needed:

1. **rain.mp3** - Gentle rain sounds
2. **forest.mp3** - Forest ambiance (birds, rustling leaves)
3. **cafe.mp3** - Coffee shop ambiance
4. **ocean.mp3** - Ocean waves
5. **fireplace.mp3** - Crackling fireplace
6. **whitenoise.mp3** - White noise
7. **library.mp3** - Library/quiet room ambiance
8. **thunderstorm.mp3** - Thunder and rain

## Free Sources for Ambient Sounds

### Option 1: Freesound.org (Recommended)
High-quality, Creative Commons licensed sounds:
- Visit: https://freesound.org/
- Search for each sound type (e.g., "rain ambience loop")
- Filter by: CC0 or CC-BY licenses
- Download as MP3

### Option 2: Pixabay Audio
Free for commercial use:
- Visit: https://pixabay.com/sound-effects/
- Search categories: Nature, White Noise, Ambient
- Download as MP3

### Option 3: YouTube Audio Library
Free royalty-free sounds:
- Visit: https://studio.youtube.com/channel/audio_library
- Browse ambient sounds
- Download and convert to MP3 if needed

### Option 4: Free Sound Effects
- Visit: https://www.freesoundeffects.com/
- Categories: Nature, Rain, Fire, etc.
- Free downloads available

## Recommended Specifications

- **Format**: MP3
- **Quality**: 128-192 kbps (balance between quality and file size)
- **Length**: 2-10 minutes (loopable)
- **Volume**: Normalized to prevent distortion

## Installation

1. Download your chosen ambient sounds from one of the sources above
2. Rename them to match the exact filenames listed above
3. Place them in this directory: `/public/sounds/`
4. Restart the development server

## Testing

Once installed, test the sounds by:
1. Opening Inkwell
2. Entering Focus Mode (bottom-right floating button or F11)
3. Clicking Settings gear icon
4. Selecting different ambient sounds from the dropdown
5. Adjusting volume slider

## Fallback Behavior

If sound files are missing, the focus mode will:
- Display an error in the console
- Continue to work without audio
- Show the "None" option as default

## License Compliance

When using sounds from external sources:
- ✅ Use CC0 (Public Domain) when possible
- ✅ Use CC-BY (Attribution Required) with proper credit
- ❌ Avoid sounds with NC (Non-Commercial) restrictions if planning commercial use
- ❌ Do not use copyrighted sounds without permission

## Example Credits

If using CC-BY licensed sounds, add attributions here:

```
Rain Sound - "Gentle Rain Loop" by [Artist Name] (CC-BY 4.0)
Forest Sound - "Forest Ambience" by [Artist Name] (CC-BY 4.0)
... etc
```

# Icon Fix Guide - Android & iOS

## Current Status

### Android Adaptive Icons
- ✅ Script created: `scripts/fix-icons.js`
- ✅ Package script added: `npm run fix:icons`
- ⚠️ **Issue**: Script generates `ic_launcher_foreground.webp` but Expo uses PNG by default
- ⚠️ **Issue**: app.json points to `./assets/adaptive-icon.png` which may not have proper padding

### iOS Icons
- ❌ Not addressed yet - needs manual update or icon generator

## Problems with Current Approach

### 1. Expo vs Native Android Icon Handling
**Problem**: Your script generates native Android drawables, but Expo manages icons differently:
- Expo uses `app.json` → `android.adaptiveIcon.foregroundImage`
- Expo prebuild generates the mipmap files from your source
- Your script overwrites these generated files

**Solution**: Fix the source image instead of generated files.

### 2. File Format Mismatch
**Problem**: Script generates `.webp` but Expo typically uses `.png`

**Solution**: Generate PNG or ensure Android XML references match.

### 3. Timing Issue
**Problem**: Running `fix:icons` after `expo prebuild` means:
- Next prebuild will overwrite your fixes
- You need to run the script after every prebuild

## Recommended Approach

### Option A: Fix Source Image (Recommended)
Instead of fixing generated files, create a properly padded source image:

```bash
# 1. Create a padded adaptive icon
# Use an image editor or script to add padding to assets/adaptive-icon.png
# The logo should occupy only the central 66% of the canvas

# 2. Update app.json to use the fixed image
"adaptiveIcon": {
  "foregroundImage": "./assets/adaptive-icon-fixed.png",
  "backgroundColor": "#09B2AD"
}

# 3. Run prebuild
npx expo prebuild --clean
```

### Option B: Post-Prebuild Script (Current Approach)
Keep your current script but improve it:

```json
// package.json
"scripts": {
  "prebuild:android": "npx expo prebuild --platform android --clean",
  "postprebuild:android": "npm run fix:icons",
  "android": "npm run prebuild:android && expo run:android"
}
```

### Option C: Use Expo Icon Generator
Let Expo handle everything:

```bash
# 1. Create a 1024x1024 icon with padding
# 2. Use Expo's icon generator
npx expo-icon-generator --icon ./assets/icon-1024.png
```

## Step-by-Step Fix

### For Android (Recommended Method)

1. **Create Properly Padded Source Image**
```bash
# Install sharp globally if needed
npm install -g sharp-cli

# Or use this improved script:
node scripts/create-padded-icon.js
```

2. **Update app.json**
```json
{
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon-padded.png",
      "backgroundColor": "#09B2AD"
    }
  }
}
```

3. **Rebuild**
```bash
npx expo prebuild --clean
npm run android
```

### For iOS

1. **Generate Padded Icons**
Use an online tool or script to create properly padded icons:
- Icon should have ~20% padding on all sides
- Generate all required sizes (20pt to 1024pt)

2. **Update AppIcon.appiconset**
Replace files in:
```
ios/fmcapp/Images.xcassets/AppIcon.appiconset/
```

3. **Or Use Expo Asset Generator**
```bash
# Create 1024x1024 padded icon
# Then let Expo generate all sizes
npx expo prebuild --clean
```

## Improved Script

Here's an improved version of your script that creates a padded source image:

```javascript
// scripts/create-padded-icon.js
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

async function createPaddedIcon() {
  const projectRoot = path.join(__dirname, '..')
  const assetsDir = path.join(projectRoot, 'assets')
  
  // Source: your original icon (should be square, high-res)
  const sourceIcon = path.join(assetsDir, 'icon.png')
  const outputIcon = path.join(assetsDir, 'adaptive-icon-padded.png')
  
  if (!fs.existsSync(sourceIcon)) {
    console.error('Source icon not found:', sourceIcon)
    process.exit(1)
  }
  
  // Android adaptive icon: 108dp canvas, 66dp safe zone
  // Safe zone is central 61% (66/108 ≈ 0.61)
  const CANVAS_SIZE = 1024 // High resolution
  const SAFE_ZONE_RATIO = 66 / 108
  const LOGO_SIZE = Math.round(CANVAS_SIZE * SAFE_ZONE_RATIO)
  
  console.log(`Creating ${CANVAS_SIZE}x${CANVAS_SIZE} adaptive icon...`)
  console.log(`Logo will be ${LOGO_SIZE}x${LOGO_SIZE} (${Math.round(SAFE_ZONE_RATIO * 100)}% of canvas)`)
  
  // Resize logo to fit safe zone
  const logoBuffer = await sharp(sourceIcon)
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  
  // Create transparent canvas and composite logo centered
  const offset = Math.round((CANVAS_SIZE - LOGO_SIZE) / 2)
  
  await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{ input: logoBuffer, left: offset, top: offset }])
  .png({ quality: 100 })
  .toFile(outputIcon)
  
  console.log('✅ Created:', outputIcon)
  console.log('\nNext steps:')
  console.log('1. Update app.json to use adaptive-icon-padded.png')
  console.log('2. Run: npx expo prebuild --clean')
  console.log('3. Run: npm run android')
}

createPaddedIcon().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
```

## Testing Your Icons

### Android
1. Build and install the app
2. Check icon on:
   - Home screen
   - App drawer
   - Recent apps
   - Different launcher apps (if possible)

### iOS
1. Build and install the app
2. Check icon on:
   - Home screen
   - Spotlight search
   - Settings
   - App Store listing

## Common Issues

### Issue: Icon looks too small on Android
**Cause**: Too much padding in adaptive icon
**Fix**: Increase logo size in safe zone (but stay within 66dp)

### Issue: Icon gets cropped on some launchers
**Cause**: Logo extends beyond safe zone
**Fix**: Reduce logo size to fit within central 66%

### Issue: Icon looks pixelated
**Cause**: Source image too small
**Fix**: Use at least 1024x1024 source image

### Issue: Background color doesn't match
**Cause**: backgroundColor in app.json doesn't match design
**Fix**: Update backgroundColor to match your brand color (#09B2AD)

## Recommended Workflow

```bash
# 1. Create padded source image
npm run create:padded-icon

# 2. Update app.json to reference it
# Edit android.adaptiveIcon.foregroundImage

# 3. Clean rebuild
npx expo prebuild --clean

# 4. Test on device
npm run android
```

## Resources

- [Android Adaptive Icons Guide](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [Expo Icon Documentation](https://docs.expo.dev/develop/user-interface/app-icons/)
- [iOS App Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)

#!/usr/bin/env node
/**
 * Create Padded Adaptive Icon
 * 
 * This script creates a properly padded adaptive icon for Android.
 * The logo is centered within the safe zone (66dp of 108dp canvas).
 * 
 * Usage: node scripts/create-padded-icon.js
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

async function createPaddedIcon() {
  const projectRoot = path.join(__dirname, '..')
  const assetsDir = path.join(projectRoot, 'assets')
  
  // Try multiple source candidates
  const sourceCandidates = [
    path.join(assetsDir, 'icon.png'),
    path.join(assetsDir, 'adaptive-icon.png'),
    path.join(assetsDir, 'adaptive-icon-fixed.png'),
  ]
  
  const sourceIcon = sourceCandidates.find(p => fs.existsSync(p))
  
  if (!sourceIcon) {
    console.error('❌ No source icon found in assets/')
    console.error('   Looking for: icon.png, adaptive-icon.png, or adaptive-icon-fixed.png')
    process.exit(1)
  }
  
  console.log('📱 Creating Android Adaptive Icon')
  console.log('   Source:', path.basename(sourceIcon))
  
  const outputIcon = path.join(assetsDir, 'adaptive-icon-padded.png')
  
  // Android adaptive icon specifications:
  // - Canvas: 108dp x 108dp
  // - Safe zone: 66dp x 66dp (central area always visible)
  // - Ratio: 66/108 ≈ 0.611 (61.1%)
  const CANVAS_SIZE = 1024 // High resolution for quality
  const SAFE_ZONE_RATIO = 66 / 108
  const LOGO_SIZE = Math.round(CANVAS_SIZE * SAFE_ZONE_RATIO)
  const PADDING = Math.round((CANVAS_SIZE - LOGO_SIZE) / 2)
  
  console.log(`   Canvas: ${CANVAS_SIZE}x${CANVAS_SIZE}px`)
  console.log(`   Logo: ${LOGO_SIZE}x${LOGO_SIZE}px (${Math.round(SAFE_ZONE_RATIO * 100)}% safe zone)`)
  console.log(`   Padding: ${PADDING}px on each side`)
  
  try {
    // Get source image metadata
    const sourceMetadata = await sharp(sourceIcon).metadata()
    console.log(`   Source size: ${sourceMetadata.width}x${sourceMetadata.height}px`)
    
    // Resize logo to fit safe zone with transparent background
    const logoBuffer = await sharp(sourceIcon)
      .resize(LOGO_SIZE, LOGO_SIZE, { 
        fit: 'contain', 
        background: { r: 0, g: 0, b: 0, alpha: 0 } 
      })
      .toBuffer()
    
    // Create transparent canvas and composite logo centered
    await sharp({
      create: {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{ 
      input: logoBuffer, 
      left: PADDING, 
      top: PADDING 
    }])
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputIcon)
    
    console.log('✅ Created:', path.basename(outputIcon))
    console.log('\n📋 Next Steps:')
    console.log('   1. Update app.json:')
    console.log('      "adaptiveIcon": {')
    console.log('        "foregroundImage": "./assets/adaptive-icon-padded.png",')
    console.log('        "backgroundColor": "#09B2AD"')
    console.log('      }')
    console.log('   2. Run: npx expo prebuild --clean')
    console.log('   3. Run: npm run android')
    console.log('\n💡 Tip: The logo will be centered with proper padding for all Android launchers')
    
  } catch (err) {
    console.error('❌ Error creating padded icon:', err.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  createPaddedIcon().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}

module.exports = { createPaddedIcon }

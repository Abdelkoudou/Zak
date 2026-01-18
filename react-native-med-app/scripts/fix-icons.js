const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

async function main(){
  const projectRoot = path.join(__dirname, '..')
  const resDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res')
  const assetsDir = path.join(projectRoot, 'assets')
  const sourceCandidates = [
    path.join(assetsDir, 'adaptive-icon.png'),
    path.join(assetsDir, 'adaptive-icon-fixed.png'),
    path.join(assetsDir, 'icon.png')
  ]

  const source = sourceCandidates.find(p => fs.existsSync(p))
  if(!source){
    console.error('No source adaptive icon found in assets/ (adaptive-icon.png or icon.png)')
    process.exit(1)
  }

  const mipmapDirs = fs.readdirSync(resDir).filter(d => d.startsWith('mipmap-') && d !== 'mipmap-anydpi-v26')

  // Safe-zone ratio: central 66dp of 108dp -> scale factor
  const SAFE_SCALE = 66 / 108

  for(const d of mipmapDirs){
    const folder = path.join(resDir, d)
    // Find a launcher reference image for size
    const candidate = ['ic_launcher.webp','ic_launcher.png','ic_launcher.jpg'].map(f=>path.join(folder,f)).find(fs.existsSync)
    if(!candidate) continue

    try{
      const meta = await sharp(candidate).metadata()
      const canvasW = meta.width
      const canvasH = meta.height
      const logoSize = Math.round(Math.min(canvasW, canvasH) * SAFE_SCALE)

      const logoBuffer = await sharp(source).resize(logoSize, logoSize, {fit:'contain'}).toBuffer()

      // Create transparent background and composite logo centered
      const left = Math.round((canvasW - logoSize)/2)
      const top = Math.round((canvasH - logoSize)/2)

      const outputPath = path.join(folder, 'ic_launcher_foreground.webp')
      await sharp({
        create: {
          width: canvasW,
          height: canvasH,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
      .composite([{ input: logoBuffer, left, top }])
      .webp({quality:90})
      .toFile(outputPath)

      console.log('Wrote', outputPath)
    }catch(err){
      console.error('Failed for', d, err.message)
    }
  }
}

main().catch(err=>{
  console.error(err)
  process.exit(1)
})

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

async function convertAssets() {
  const assetsDir = path.join(__dirname, "..", "assets");
  const openScreenSrc = path.join(assetsDir, "Open screen.jpg");
  const openScreenDest = path.join(assetsDir, "open-screen.png");
  const iconBgDest = path.join(assetsDir, "icon-background.png");

  if (!fs.existsSync(openScreenSrc)) {
    console.error("Source file not found:", openScreenSrc);
    return;
  }

  console.log("Converting assets...");

  // Convert to open-screen.png for splash
  await sharp(openScreenSrc).png().toFile(openScreenDest);
  console.log("Created:", openScreenDest);

  // Convert to icon-background.png for adaptive icon
  await sharp(openScreenSrc).png().toFile(iconBgDest);
  console.log("Created:", iconBgDest);
}

convertAssets().catch((err) => {
  console.error("Error during asset conversion:", err);
  process.exit(1);
});

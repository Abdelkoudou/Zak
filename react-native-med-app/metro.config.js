const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Ensure Metro resolves TypeScript files and path aliases correctly
config.resolver = {
  ...config.resolver,
  sourceExts: [
    "ios.ts",
    "android.ts",
    "native.ts",
    "ts",
    "ios.tsx",
    "android.tsx",
    "native.tsx",
    "tsx",
    "ios.js",
    "android.js",
    "native.js",
    "js",
    "jsx",
    "json",
    "mjs",
    "cjs",
  ],
  // Ensure the src directory is in extra node modules
  extraNodeModules: {
    "@": path.resolve(__dirname, "src"),
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });

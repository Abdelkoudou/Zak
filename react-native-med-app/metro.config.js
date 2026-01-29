const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Configure resolver for path aliases
config.resolver = {
  ...config.resolver,
  // Ensure src directory is included in nodeModulesPaths for @ alias resolution
  nodeModulesPaths: [
    ...(config.resolver?.nodeModulesPaths || []),
    path.resolve(__dirname, "src"),
  ],
  // Extra node modules to watch
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    "@": path.resolve(__dirname, "src"),
  },
};

// Configure watchFolders to include src
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, "src"),
];

module.exports = withNativeWind(config, { input: "./global.css" });

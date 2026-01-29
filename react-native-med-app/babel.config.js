const path = require("path");

module.exports = function (api) {
  api.cache(true);

  // Check if we're in a web build environment (Vercel)
  const isWeb =
    process.env.VERCEL === "1" || process.env.EXPO_PUBLIC_PLATFORM === "web";

  // Use absolute paths to ensure correct resolution in EAS Build environment
  // process.cwd() returns /home/expo/workingdir/build/react-native-med-app/ in EAS Build
  const projectRoot = process.cwd();

  const plugins = [
    [
      "module-resolver",
      {
        root: [projectRoot],
        alias: {
          "@": path.join(projectRoot, "src"),
          "@/components": path.join(projectRoot, "src", "components"),
          "@/lib": path.join(projectRoot, "src", "lib"),
          "@/types": path.join(projectRoot, "src", "types"),
          "@/constants": path.join(projectRoot, "src", "constants"),
          "@/context": path.join(projectRoot, "src", "context"),
          "@/hooks": path.join(projectRoot, "src", "hooks"),
        },
      },
    ],
    // NativeWind CSS interop babel plugin (without worklets)
    require.resolve("react-native-css-interop/dist/babel-plugin"),
    [
      "@babel/plugin-transform-react-jsx",
      {
        runtime: "automatic",
        importSource: "react-native-css-interop",
      },
    ],
  ];

  // Only add worklets plugin for web builds where it's available
  if (isWeb) {
    try {
      require.resolve("react-native-worklets/plugin");
      plugins.push("react-native-worklets/plugin");
    } catch (e) {
      // Worklets not available, skip it
    }
  }

  // Reanimated plugin must be last
  plugins.push("react-native-reanimated/plugin");

  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]],
    plugins,
  };
};

module.exports = function (api) {
  api.cache(true);
  
  // Check if we're in a web build environment (Vercel)
  const isWeb = process.env.VERCEL === '1' || process.env.EXPO_PUBLIC_PLATFORM === 'web';
  
  const plugins = [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/lib': './src/lib',
          '@/types': './src/types',
          '@/constants': './src/constants',
          '@/context': './src/context',
          '@/hooks': './src/hooks',
        },
      },
    ],
    // NativeWind CSS interop babel plugin (without worklets)
    require.resolve('react-native-css-interop/dist/babel-plugin'),
    [
      '@babel/plugin-transform-react-jsx',
      {
        runtime: 'automatic',
        importSource: 'react-native-css-interop',
      },
    ],
  ];
  
  // Only add worklets plugin for web builds where it's available
  if (isWeb) {
    try {
      require.resolve('react-native-worklets/plugin');
      plugins.push('react-native-worklets/plugin');
    } catch (e) {
      // Worklets not available, skip it
    }
  }
  
  // Reanimated plugin must be last
  plugins.push('react-native-reanimated/plugin');
  
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins,
  };
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
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
    ],
  };
};

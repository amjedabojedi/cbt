module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
    env: {
      production: {
        // Strip all console.* calls from production bundles so no PII,
        // tokens, or response bodies can leak into device logs / crash reporters.
        plugins: ['transform-remove-console'],
      },
    },
  };
};

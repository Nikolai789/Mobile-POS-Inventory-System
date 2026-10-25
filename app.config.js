/**
 * Keep app.json as the source for app identity, assets, and existing plugins.
 * EAS applies APP_VARIANT from each build profile before resolving this config.
 * @param {import('expo/config').ConfigContext} context
 * @returns {import('expo/config').ExpoConfig}
 */
module.exports = ({ config }) => {
  const variant = process.env.APP_VARIANT || 'development';
  if (!['development', 'preview', 'production'].includes(variant)) {
    throw new Error('APP_VARIANT must be development, preview, or production.');
  }
  const production = variant === 'production';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  let url;
  try {
    url = new URL(apiUrl || '');
  } catch {
    throw new Error('Set EXPO_PUBLIC_API_URL to the backend /api URL in the selected EAS environment or build profile.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
    || url.search || url.hash || url.pathname.replace(/\/+$/, '') !== '/api') {
    throw new Error('EXPO_PUBLIC_API_URL must be a valid HTTP or HTTPS /api URL.');
  }
  if (production && url.protocol !== 'https:') {
    throw new Error('Production requires an HTTPS EXPO_PUBLIC_API_URL. Set it in the EAS production environment before building.');
  }
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      ['expo-build-properties', { android: { usesCleartextTraffic: !production } }],
    ],
  };
};

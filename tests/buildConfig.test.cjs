const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const configureApp = require('../app.config');
const app = require('../app.json').expo;
const profiles = require('../eas.json').build;
const previousVariant = process.env.APP_VARIANT;
const previousApiUrl = process.env.EXPO_PUBLIC_API_URL;

after(() => {
  if (previousVariant === undefined) delete process.env.APP_VARIANT;
  else process.env.APP_VARIANT = previousVariant;
  if (previousApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = previousApiUrl;
});

function resolve(variant, url) {
  process.env.APP_VARIANT = variant;
  if (url === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = url;
  return configureApp({ config: structuredClone(app) });
}

test('development and preview builds contain their API address and permit local HTTP on Android', () => {
  for (const variant of ['development', 'preview']) {
    const config = resolve(variant, profiles[variant].env.EXPO_PUBLIC_API_URL);
    assert.equal(profiles[variant].env.APP_VARIANT, variant);
    assert.equal(config.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties')[1].android.usesCleartextTraffic, true);
    assert.equal(config.android.package, app.android.package);
    assert.deepEqual(config.extra, app.extra);
    assert.ok(config.plugins.some((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-camera'));
  }
});

test('production requires a configured HTTPS API and disables Android cleartext traffic', () => {
  assert.equal(profiles.production.env.APP_VARIANT, 'production');
  for (const url of [undefined, 'http://192.168.1.10:5000/api']) {
    assert.throws(() => resolve('production', url), /EXPO_PUBLIC_API_URL/);
  }
  const config = resolve('production', 'https://api.example.com/api');
  assert.equal(config.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties')[1].android.usesCleartextTraffic, false);
});

test('invalid API URLs and unknown build variants fail before a build can start', () => {
  for (const url of ['', 'https://example.com', 'file:///api', 'https://user:password@example.com/api', 'https://example.com/api?token=test']) {
    assert.throws(() => resolve('preview', url), /EXPO_PUBLIC_API_URL/);
  }
  assert.throws(() => resolve('unknown', 'https://example.com/api'), /APP_VARIANT/);
});

test('the preview profile produces an APK and development includes the Expo development client', () => {
  assert.equal(profiles.preview.android.buildType, 'apk');
  assert.equal(profiles.preview.distribution, 'internal');
  assert.equal(profiles.development.developmentClient, true);
  assert.ok(require('../package.json').dependencies['expo-dev-client']);
});

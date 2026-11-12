import { defineConfig, devices } from '@playwright/test';

// Suite E2E local (`npm run e2e`): no entra en la CI. Arranca Vite en un puerto propio y la API y los
// recursos de S3 se simulan en `e2e/fixtures.js`, así que no hacen falta credenciales ni red.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  workers: 4,
  // Vite en desarrollo optimiza las dependencias en la primera visita y recarga la página: se calienta antes.
  globalSetup: './e2e/global-setup.js',
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite --port 3100 --strictPort',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    env: {
      VITE_BASE_URL: 'http://api.e2e.test',
      VITE_API_PREFIX: '/api/v1',
      VITE_S3_URL: 'https://assets.e2e.test',
    },
  },
});

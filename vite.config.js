import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { faviconTags, isHttpsUrl, logoKeyFromSource } from './src/utilities/faviconHtml.js';

// Inyecta el favicon en index.html solo si VITE_S3_URL está definida al compilar (o en dev).
// La clave del logo vive solo en src/config/assets.js: se lee de forma diferida, dentro de
// transformIndexHtml y solo si hay URL, para que Vitest (que usa esta misma config) no toque el archivo.
function faviconPlugin() {
  let s3Url;
  return {
    name: 'sigmetum-favicon',
    configResolved(config) {
      s3Url = config.env.VITE_S3_URL;
      if (s3Url && !isHttpsUrl(s3Url)) {
        config.logger.warn('[sigmetum-favicon] VITE_S3_URL no empieza por https://: no se emite el favicon.');
      }
    },
    transformIndexHtml() {
      if (!isHttpsUrl(s3Url)) return [];
      const fuente = readFileSync(new URL('./src/config/assets.js', import.meta.url), 'utf8');
      return faviconTags(s3Url, logoKeyFromSource(fuente));
    },
  };
}

// El código fuente usa JSX en archivos .js, así que se le indica a esbuild que los trate como JSX.
export default defineConfig({
  plugins: [react({ include: /\.(js|jsx)$/ }), faviconPlugin()],
  esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  server: { port: 3000 },
  test: {
    environment: 'jsdom',
    // Solo los tests de src/: los de plugins/ son de node:test (npm run agentes:test).
    include: ['src/**/*.test.js'],
    globals: true,
    setupFiles: './src/setupTests.js',
    passWithNoTests: true,
  },
});

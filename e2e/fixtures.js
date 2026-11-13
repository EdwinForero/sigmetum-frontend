import { test as base, expect } from '@playwright/test';

export { expect };

export const API = 'http://api.e2e.test/api/v1';
export const ASSETS = 'https://assets.e2e.test';

// Rutas públicas y anchos de la suite (criterio 35).
export const ROUTES = ['/', '/explore', '/gallery', '/about-us', '/cookies'];
export const WIDTHS = [390, 768, 1024, 1440];

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};

// Seis fotos con proporciones 1:1, 3:2 y 2:3. El retraso de cada una es escalonado: así la galería
// recibe las cargas de una en una y se puede comprobar qué se mueve con cada una.
const RATIOS = [
  [600, 600],
  [900, 600],
  [600, 900],
  [600, 600],
  [900, 600],
  [600, 900],
];
export const PHOTOS = RATIOS.map(([w, h], i) => ({
  fileName: `Foto_${i + 1}_${w}x${h}.jpg`,
  url: `${ASSETS}/gallery/foto-${i + 1}.jpg?w=${w}&h=${h}&delay=${150 * (i + 1)}`,
}));

// 24 fotos con las mismas proporciones, para llenar varias filas de la rejilla a todos los anchos.
export const MANY_PHOTOS = Array.from({ length: 24 }, (_, i) => {
  const [w, h] = RATIOS[i % RATIOS.length];
  return {
    fileName: `Foto_${i + 1}_${w}x${h}.jpg`,
    url: `${ASSETS}/gallery/foto-${i + 1}.jpg?w=${w}&h=${h}&delay=${50 * ((i % 6) + 1)}`,
  };
});

const SPECIES =Array.from({ length: 30 }, (_, i) => ({
  'Especies Características': `Especie ${String(i + 1).padStart(2, '0')} ejemplar`,
  Hábitat: i % 2 === 0 ? 'Bosque' : 'Matorral',
  Clima: ['Seco', 'Húmedo', 'Templado'][i % 3],
}));

const svg = (w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
  `<rect width="${w}" height="${h}" fill="#7aa08a"/><rect x="${w / 4}" y="${h / 4}" width="${w / 2}" height="${h / 2}" fill="#EAF3EE"/></svg>`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Rutas simuladas de la página: fuentes de Google cortadas, recursos de S3 con imágenes SVG y la API con su sobre.
 * Las usan el fixture `page` y `global-setup.js` (el calentamiento tampoco sale a la red).
 */
export const installRoutes = async (page, mock) => {
  await page.route(/^https:\/\/(fonts\.googleapis|fonts\.gstatic)\.com\//, (route) => route.abort());

  let assetCount = 0;
  await page.route(`${ASSETS}/**`, async (route) => {
    const url = new URL(route.request().url());
    const width = Number(url.searchParams.get('w')) || 800;
    const height = Number(url.searchParams.get('h')) || 450;
    const delay = url.searchParams.has('delay') ? Number(url.searchParams.get('delay')) : 120 * (assetCount++ % 4);
    await wait(delay);
    await route.fulfill({ status: 200, contentType: 'image/svg+xml', headers: CORS, body: svg(width, height) });
  });

  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const name = new URL(request.url()).pathname.replace(`/api/v1/`, '');
    mock.calls.push({ method: request.method(), name, body: request.postData() });
    const reply = (status, body) =>
      route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
    if (name === 'get-merged-data') return reply(200, { success: true, data: SPECIES });
    if (name === 'list-terms') return reply(200, { success: true, data: [] });
    if (name === 'list-images') {
      await wait(mock.listImagesDelay);
      return reply(200, { success: true, data: mock.photos });
    }
    if (name === 'send-email') {
      return mock.sendEmailStatus === 200
        ? reply(200, { success: true, data: {} })
        : reply(mock.sendEmailStatus, { success: false, error: 'error' });
    }
    return reply(404, { success: false, error: 'not found' });
  });
};

/**
 * `test` con la página ya preparada:
 *  - `lang` ('es' por defecto): idioma guardado en `i18nextLng`.
 *  - `consent` (true por defecto): cookie `cookieConsent=accepted`; false deja el banner visible.
 *  - `mock.calls`: peticiones a la API que se han recibido (método, ruta y cuerpo).
 *  - `mock.listImagesDelay`: retraso en ms de `list-images`.
 *  - `mock.photos`: fotos que devuelve `list-images` (`PHOTOS` por defecto; `MANY_PHOTOS` son 24).
 * La API (con el sobre `{ success, data }` y el preflight CORS) y los recursos de S3 se simulan; las
 * fuentes de Google se cortan para que la medida no dependa de la red.
 */
export const test = base.extend({
  lang: ['es', { option: true }],
  consent: [true, { option: true }],
  // Playwright exige desestructurar el primer argumento aunque no use fixtures.
  // eslint-disable-next-line no-empty-pattern
  mock: async ({}, use) => {
    await use({ calls: [], listImagesDelay: 0, sendEmailStatus: 200, photos: PHOTOS });
  },
  page: async ({ page, context, lang, consent, mock }, use, testInfo) => {
    // Diagnóstico: si la prueba falla, se adjunta lo que el navegador registró (errores, peticiones fallidas y respuestas >= 400).
    const log = [];
    page.on('pageerror', (error) => log.push(`pageerror ${error.message}`));
    page.on('requestfailed', (request) => !/fonts\.g/.test(request.url()) && log.push(`requestfailed ${request.url()} ${request.failure()?.errorText}`));
    page.on('response', (response) => {
      if (response.status() >= 400) log.push(`${response.status()} ${response.url()}`);
    });
    await page.addInitScript((language) => localStorage.setItem('i18nextLng', language), lang);
    if (consent) {
      await context.addCookies([{ name: 'cookieConsent', value: 'accepted', url: 'http://localhost:3100' }]);
    }

    await installRoutes(page, mock);

    await use(page);

    if (testInfo.status !== testInfo.expectedStatus) {
      await testInfo.attach('registro-del-navegador', { body: log.join('\n') ||'(vacío)', contentType: 'text/plain' });
    }
  },
});

// Suma de los desplazamientos de diseño (CLS) de la página, sin los causados por la entrada del usuario.
export const trackLayoutShift = (page) =>
  page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });

// Recorre la página de arriba abajo para que se carguen las imágenes diferidas (`loading="lazy"`).
export const scrollThrough = async (page) => {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight / 2));
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  });
};

import { chromium } from '@playwright/test';
import { installRoutes } from './fixtures.js';

// Visita las rutas una vez antes de los tests: Vite (modo desarrollo) optimiza las dependencias en la primera
// visita y recarga la página, y con varios trabajadores en paralelo eso hacía fallar las primeras pruebas.
export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await installRoutes(page, { calls: [], listImagesDelay: 0, sendEmailStatus: 200 });
  for (const route of ['/', '/explorar', '/galeria', '/sobre-nosotros', '/cookies']) {
    await page.goto(`http://localhost:3100${route}`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
  }
  await browser.close();
}

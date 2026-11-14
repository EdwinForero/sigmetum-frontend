import { test, expect } from './fixtures.js';

// Las seis URL antiguas (en español) redirigen en el cliente a la ruta nueva, sin conservar `?` ni `#` (S4).
// Este archivo y `src/config/routes.js` son los únicos con las rutas antiguas escritas a mano.

const PUBLIC_REDIRECTS = [
  ['/explorar', '/explore'],
  ['/galeria', '/gallery'],
  ['/sobre-nosotros', '/about-us'],
];
const PRIVATE_REDIRECTS = [
  ['/cargar-archivos', '/upload-files'],
  ['/administrar-datos', '/manage-data'],
  ['/administrar-contenido', '/manage-terms'],
];

const pathOf = (page) => new URL(page.url());

for (const viewport of [{ width: 390, height: 800 }, { width: 1440, height: 900 }]) {
  test.describe(`rutas públicas antiguas a ${viewport.width} px`, () => {
    test.use({ viewport });

    for (const [from, to] of PUBLIC_REDIRECTS) {
      for (const suffix of ['', '/', '?q=1', '#x', '?//evil.example', '#//evil']) {
        test(`${from}${suffix} acaba en ${to} sin «?» ni «#»`, async ({ page }) => {
          await page.goto(`${from}${suffix}`);
          await expect(page).toHaveURL(`http://localhost:3100${to}`);

          const url = pathOf(page);
          expect(url.pathname).toBe(to);
          expect(url.search).toBe('');
          expect(url.hash).toBe('');
          await expect(page.locator('h1').first()).toBeVisible();
        });
      }
    }
  });
}

test('la redirección sustituye la entrada del historial: atrás vuelve a la página anterior', async ({ page }) => {
  await page.goto('/cookies');
  await page.evaluate(() => window.history.pushState({}, '', '/explorar'));
  await page.reload();
  await expect(page).toHaveURL(/\/explore$/);

  await page.goBack();

  await expect(page).toHaveURL(/\/cookies$/);
});

test('el título del documento es el de la ruta nueva tras redirigir', async ({ page }) => {
  await page.goto('/galeria');
  await expect(page).toHaveURL(/\/gallery$/);

  const viaRedirect = await page.title();
  await page.goto('/gallery');
  expect(viaRedirect).toBe(await page.title());
});

test.describe('rutas privadas antiguas sin sesión', () => {
  for (const [from, to] of PRIVATE_REDIRECTS) {
    test(`${from}?x=1#y no deja la URL antigua ni conserva «?» y «#»: pasa por ${to} y sin sesión acaba en /login sin la barra de gestión`, async ({ page }) => {
      await page.goto(`${from}?x=1#y`);
      // Sin token, la ruta nueva deniega y ProtectedRoute lleva a /login (replace, sin «?» ni «#»).
      await expect(page).toHaveURL('http://localhost:3100/login');

      const url = pathOf(page);
      expect(url.pathname).toBe('/login');
      expect(url.pathname).not.toBe(from);
      expect(url.search).toBe('');
      expect(url.hash).toBe('');
      await expect(page.getByRole('navigation', { name: 'Gestión' })).toHaveCount(0);
      await expect(page.locator('h1').first()).toBeVisible();
    });
  }
});

// B83: React Router decodifica el «%» de la ruta; la SPA debe pintar lo mismo que con la ruta sin codificar.
test('/%45xplore se pinta como /explore: recuento, botón Filtros y el mismo título', async ({ page }) => {
  await page.goto('/explore');
  await expect(page.getByText(/Mostrando \d+ de 30 resultados/)).toBeVisible();
  const expected = await page.title();

  await page.goto('/%45xplore');

  await expect(page.getByText(/Mostrando \d+ de 30 resultados/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtros' })).toBeVisible();
  expect(await page.title()).toBe(expected);
});

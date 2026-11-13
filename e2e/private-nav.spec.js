import { test, expect, API } from './fixtures.js';

// Barra de gestión a 320 px (seis ítems en una fila): ninguna palabra de una etiqueta puede ser más ancha
// que su ítem ni partirse con guion. Sesión simulada: token en localStorage y `/auth` responde 200.

const ITEMS = '[aria-label="Gestión"] li, [aria-label="Management"] li';

const measureLabels = (page) =>
  page.locator(ITEMS).evaluateAll((items) =>
    items.map((item) => {
      const label = item.querySelector('span:not(.material-symbols-outlined)');
      const node = label.firstChild;
      const text = node.textContent;
      const itemWidth = item.getBoundingClientRect().width;
      const words = [];
      let start = 0;
      for (const word of text.split(' ')) {
        const range = document.createRange();
        range.setStart(node, start);
        range.setEnd(node, start + word.length);
        words.push({ word, width: range.getBoundingClientRect().width, lines: range.getClientRects().length });
        start += word.length + 1;
      }
      return { text, itemWidth, words };
    }),
  );

for (const lang of ['es', 'en']) {
  test.describe(`barra de gestión a 320 px en ${lang}`, () => {
    test.use({ lang, viewport: { width: 320, height: 700 } });

    test('ninguna palabra de las etiquetas supera el ancho de su ítem ni se parte', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('token', 'e2e-token'));
      await page.route(`${API}/auth`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
          body: JSON.stringify({ success: true, data: {} }),
        }),
      );
      await page.goto('/manage-data');
      await expect(page.locator(ITEMS)).toHaveCount(6);

      const labels = await measureLabels(page);

      expect(labels).toHaveLength(6);
      for (const { text, itemWidth, words } of labels) {
        for (const { word, width, lines } of words) {
          expect(width, `«${word}» de «${text}» (ítem de ${itemWidth} px)`).toBeLessThanOrEqual(itemWidth - 2);
          expect(lines, `«${word}» de «${text}» se parte en varias líneas`).toBe(1);
        }
      }
    });
  });
}

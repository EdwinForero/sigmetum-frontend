import { test, expect, PHOTOS, trackLayoutShift } from './fixtures.js';

// Criterios 27 a 30 de la galería: cada foto conserva su columna y su orden mientras cargan las demás,
// el esqueleto reserva espacio, solo se mueven las celdas de abajo y el visor cumple el criterio 30.

const NAMES = PHOTOS.map((photo) => photo.fileName);
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

// Define `window.__snapshot()` en la página: estado de las celdas (columna = índice de su <ul>,
// posición en el DOM y rectángulo).
const installSnapshot = () => {
  window.__snapshot = () =>
    [...document.querySelectorAll('[data-photo]')].map((button, domIndex) => {
      const rect = button.getBoundingClientRect();
      const columns = [...button.closest('ul').parentElement.children];
      return {
        name: button.dataset.photo,
        column: columns.indexOf(button.closest('ul')),
        domIndex,
        left: Math.round(rect.left),
        top: Math.round(rect.top + window.scrollY),
        width: Math.round(rect.width),
      };
    });
};

for (const viewport of VIEWPORTS) {
  test.describe(`a ${viewport.width} px`, () => {
    test.use({ viewport });
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(installSnapshot);
    });

    test('el esqueleto mide más de 0 px antes de la primera foto y el orden del DOM es el de los datos', async ({ page, mock }) => {
      mock.listImagesDelay = 3000;
      await page.goto('/galeria');
      const skeleton = page.locator('main [aria-hidden="true"].aspect-\\[4\\/3\\]');
      await expect(skeleton).toHaveCount(6);
      for (const box of await skeleton.all()) {
        const size = await box.boundingBox();
        expect(size.width).toBeGreaterThan(0);
        expect(size.height).toBeGreaterThan(0);
      }
      await expect(page.getByRole('status').filter({ hasText: 'Cargando fotos' })).toBeVisible();

      await expect(page.locator('[data-photo]')).toHaveCount(6);
      const cells = await page.evaluate(() => window.__snapshot());
      expect(cells.map((cell) => cell.name), 'orden del DOM = orden de los datos').toEqual(NAMES);
      // Los bloques son contiguos: la columna no decrece al avanzar en el DOM.
      const columns = cells.map((cell) => cell.column);
      expect(columns).toEqual([...columns].sort((a, b) => a - b));
    });

    test('columna y orden estables tras cada carga, y solo se mueven las celdas de abajo de la misma columna', async ({ page }) => {
      await page.goto('/galeria');
      await expect(page.locator('[data-photo]')).toHaveCount(6);
      // Cada carga de imagen deja una instantánea con el nombre de la foto que acaba de cargar.
      await page.evaluate(() => {
        const snap = window.__snapshot;
        window.__log = [{ loaded: null, cells: snap() }];
        document.addEventListener(
          'load',
          (event) => {
            const loaded = event.target.closest?.('[data-photo]')?.dataset.photo;
            if (loaded) window.__log.push({ loaded, cells: snap() });
          },
          true
        );
      });

      // Se recorre la página para que carguen las diferidas (loading="lazy").
      await expect
        .poll(async () => {
          await page.evaluate(() => window.scrollBy(0, Math.max(200, window.innerHeight / 2)));
          return page.evaluate(() => [...document.querySelectorAll('[data-photo] img')].every((img) => img.complete && img.naturalWidth > 0));
        }, { timeout: 15000, intervals: [150] })
        .toBe(true);

      const log = await page.evaluate(() => window.__log);
      expect(log.length, 'una instantánea por foto cargada más la inicial').toBeGreaterThanOrEqual(7);
      const first = log[0].cells;
      for (const { loaded, cells } of log.slice(1)) {
        expect(cells.map((cell) => cell.name)).toEqual(NAMES);
        for (const cell of cells) {
          const before = first.find((item) => item.name === cell.name);
          expect(cell.column, `columna de ${cell.name} tras cargar ${loaded}`).toBe(before.column);
          expect(cell.domIndex, `orden de ${cell.name} tras cargar ${loaded}`).toBe(before.domIndex);
          expect(cell.left).toBe(before.left);
          expect(cell.width).toBe(before.width);
        }
      }
      // Entre una instantánea y la siguiente, solo cambia el `top` de celdas que están debajo de la foto cargada, en su columna.
      for (let i = 1; i < log.length; i += 1) {
        const { loaded, cells } = log[i];
        const loadedCell = cells.find((cell) => cell.name === loaded);
        for (const cell of cells) {
          const previous = log[i - 1].cells.find((item) => item.name === cell.name);
          if (cell.top === previous.top) continue;
          expect(cell.column, `${cell.name} se movió al cargar ${loaded}: debe ser de su columna`).toBe(loadedCell.column);
          expect(cell.domIndex, `${cell.name} se movió al cargar ${loaded}: debe estar debajo`).toBeGreaterThan(loadedCell.domIndex);
        }
      }
    });

    test('CLS de la galería es como mucho 0,25', async ({ page }) => {
      await trackLayoutShift(page);
      await page.goto('/galeria');
      await expect(page.locator('[data-photo]')).toHaveCount(6);
      await expect
        .poll(async () => {
          await page.evaluate(() => window.scrollBy(0, Math.max(200, window.innerHeight / 2)));
          return page.evaluate(() => [...document.querySelectorAll('[data-photo] img')].every((img) => img.complete && img.naturalWidth > 0));
        }, { timeout: 15000, intervals: [150] })
        .toBe(true);
      await page.waitForTimeout(500);
      const cls = await page.evaluate(() => window.__cls);
      expect(cls, `CLS ${cls}`).toBeLessThanOrEqual(0.25);
    });
  });
}

test.describe('visor (criterio 30)', () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });

  const openViewer = async (page, index = 0) => {
    await page.goto('/galeria');
    const photo = page.locator('[data-photo]').nth(index);
    await expect(photo).toBeVisible();
    await photo.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    return { photo, dialog };
  };

  test('es un diálogo modal con nombre, foco dentro, contador y sin animaciones', async ({ page }) => {
    const { dialog } = await openViewer(page);
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    const labelId = await dialog.getAttribute('aria-labelledby');
    await expect(page.locator(`[id="${labelId}"]`)).toHaveText('Foto 1 600x600');
    await expect(page.locator(`[id="${labelId}"]`).locator('..')).toContainText('1 de 6');
    expect(await page.evaluate(() => document.getElementById(document.querySelector('[role="dialog"]').getAttribute('aria-labelledby')).parentElement.getAttribute('aria-live'))).toBe('polite');
    expect(await dialog.evaluate((node) => node.contains(document.activeElement)), 'el foco está dentro del diálogo').toBe(true);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    expect(await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.closest?.('[role="dialog"]')).length)).toBe(0);
  });

  test('anterior, siguiente y flechas dan la vuelta; los botones miden 44 px o más y tienen nombre', async ({ page }) => {
    const { dialog } = await openViewer(page);
    const counter = dialog.getByText(/de 6$/);
    await expect(counter).toHaveText('1 de 6');

    for (const name of ['Cerrar', 'Foto anterior', 'Foto siguiente']) {
      const box = await dialog.getByRole('button', { name }).boundingBox();
      expect(box.width, name).toBeGreaterThanOrEqual(44);
      expect(box.height, name).toBeGreaterThanOrEqual(44);
    }

    await page.keyboard.press('ArrowLeft');
    await expect(counter).toHaveText('6 de 6');
    await page.keyboard.press('ArrowRight');
    await expect(counter).toHaveText('1 de 6');
    await dialog.getByRole('button', { name: 'Foto siguiente' }).click();
    await expect(counter).toHaveText('2 de 6');
    await dialog.getByRole('button', { name: 'Foto anterior' }).click();
    await dialog.getByRole('button', { name: 'Foto anterior' }).click();
    await expect(counter).toHaveText('6 de 6');
    await expect(dialog.getByRole('button', { name: 'Foto anterior' })).toBeEnabled();
  });

  test('Tab queda atrapado dentro y Escape cierra y devuelve el foco a la foto', async ({ page }) => {
    const { photo, dialog } = await openViewer(page, 2);
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((node) => node.contains(document.activeElement)), `Tab ${i + 1}`).toBe(true);
    }
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Shift+Tab');
      expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(photo).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });

  test('con el visor abierto, un cambio de columnas y Escape devuelven el foco a la foto', async ({ page }) => {
    const { dialog } = await openViewer(page, 4);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('[data-photo]').nth(4)).toBeFocused();
  });
});

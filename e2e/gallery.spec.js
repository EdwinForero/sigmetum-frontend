import { test, expect, PHOTOS, MANY_PHOTOS, trackLayoutShift } from './fixtures.js';

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
      await page.goto('/gallery');
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
      await page.goto('/gallery');
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
      await page.goto('/gallery');
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
    await page.goto('/gallery');
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

// BL3: la rejilla llena el viewport (solo el margen lateral), cada celda mide 200 px como máximo y el
// título conserva su posición en .page-container.
const GRID_VIEWPORTS = [
  { width: 390, height: 844, gutter: 16, h1Left: 16 },
  { width: 768, height: 1024, gutter: 24, h1Left: 24 },
  { width: 1024, height: 768, gutter: 32, h1Left: 32 },
  { width: 1440, height: 900, gutter: 32, h1Left: 168 },
  { width: 1920, height: 1080, gutter: 32, h1Left: 408 },
];
const PAGE_CONTAINER_MAX = 1152; // max-w-6xl
const MAX_CELL = 200;

// Recorre la página hasta que todas las imágenes han cargado.
const waitForPhotos = async (page, count) => {
  await expect(page.locator('[data-photo]')).toHaveCount(count);
  await expect
    .poll(async () => {
      await page.evaluate(() => window.scrollBy(0, Math.max(200, window.innerHeight / 2)));
      return page.evaluate(() => [...document.querySelectorAll('[data-photo] img')].every((img) => img.complete && img.naturalWidth > 0));
    }, { timeout: 15000, intervals: [150] })
    .toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
};

// Medidas de la rejilla: pistas, hueco, celdas, posición del título y desbordamiento.
const measureGrid = (page) =>
  page.evaluate(() => {
    const grid = document.querySelector('[data-photo]').closest('ul').parentElement;
    const style = getComputedStyle(grid);
    const tracks = style.gridTemplateColumns.split(' ').map(parseFloat);
    const cells = [...document.querySelectorAll('[data-photo]')].map((button) => button.getBoundingClientRect());
    // Altura del contenido de cada columna (el <ul> se estira hasta la fila más alta del grid).
    const lists = [...grid.children].map((list) => ({ height: list.lastElementChild.getBoundingClientRect().bottom - list.getBoundingClientRect().top }));
    // Ancho de maquetación de la página: el del contenedor con los márgenes laterales (la rejilla vive dentro).
    const wrapper = grid.parentElement.parentElement;
    return {
      clientWidth: wrapper.clientWidth,
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      tracks,
      gap: parseFloat(style.columnGap),
      firstLeft: cells[0].left,
      maxCell: Math.max(...cells.map((rect) => rect.width)),
      minCell: Math.min(...cells.map((rect) => rect.width)),
      h1Left: document.querySelector('h1').getBoundingClientRect().left,
      listHeights: lists.map((list) => list.height),
    };
  });

for (const { width, height, gutter, h1Left } of GRID_VIEWPORTS) {
  test.describe(`rejilla a todo el ancho a ${width} px`, () => {
    test.use({ viewport: { width, height } });

    test('con 24 fotos: pistas y huecos suman clientWidth menos dos márgenes, celdas de 200 px como máximo y título en su sitio', async ({ page, mock }, testInfo) => {
      mock.photos = MANY_PHOTOS;
      await page.goto('/gallery');
      await waitForPhotos(page, 24);

      const m = await measureGrid(page);
      const total = m.tracks.reduce((sum, track) => sum + track, 0) + (m.tracks.length - 1) * m.gap;
      expect(Math.abs(total - (m.clientWidth - 2 * gutter)), 'pistas + huecos = clientWidth − 2·gutter').toBeLessThanOrEqual(1);
      expect(Math.abs(m.firstLeft - gutter), 'la primera celda empieza en el margen lateral').toBeLessThanOrEqual(1);
      expect(m.scrollWidth, 'sin desbordamiento horizontal').toBeLessThanOrEqual(m.innerWidth);
      expect(m.maxCell, `celda máxima ${m.maxCell}`).toBeLessThanOrEqual(MAX_CELL + 0.5);
      expect(m.minCell).toBeGreaterThan(0);

      // El título no cambia: la posición de .page-container (centrado, tope de 1152 px) más el margen lateral.
      const expectedH1 = Math.max(0, (m.clientWidth - PAGE_CONTAINER_MAX) / 2) + gutter;
      expect(Math.abs(m.h1Left - expectedH1), `left del h1 ${m.h1Left}`).toBeLessThanOrEqual(1);
      // Línea base anterior a BL3 (16/24/32/168/408), medida con barra de desplazamiento de 15 px.
      if (m.innerWidth - m.clientWidth === 15) expect(Math.abs(m.h1Left - h1Left), 'left del h1 frente a la línea base').toBeLessThanOrEqual(1);

      await testInfo.attach(`medidas-${width}`, {
        body: JSON.stringify({ columnas: m.tracks.length, celdaMax: m.maxCell, celdaMin: m.minCell, h1Left: m.h1Left, clientWidth: m.clientWidth }, null, 1),
        contentType: 'application/json',
      });
    });
  });
}

test.describe('rejilla con pocas fotos', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('con 6 fotos a 1440 px ninguna celda pasa de 200 px', async ({ page }) => {
    await page.goto('/gallery');
    await expect(page.locator('[data-photo]')).toHaveCount(6);

    const m = await measureGrid(page);
    expect(m.maxCell, `celda máxima ${m.maxCell}`).toBeLessThanOrEqual(MAX_CELL + 0.5);
  });

  test('desequilibrio de alturas de las columnas con 24 fotos a 1440 px (se adjunta)', async ({ page, mock }, testInfo) => {
    mock.photos = MANY_PHOTOS;
    await page.goto('/gallery');
    await waitForPhotos(page, 24);

    const { listHeights } = await measureGrid(page);
    const max = Math.max(...listHeights);
    const min = Math.min(...listHeights);
    const report = { alturas: listHeights.map(Math.round), maxMenosMin: Math.round(max - min), maxSobreMin: Number((max / min).toFixed(2)) };
    await testInfo.attach('desequilibrio-1440', { body: JSON.stringify(report, null, 1), contentType: 'application/json' });
    console.log(`desequilibrio a 1440 px: ${JSON.stringify(report)}`);
    expect(listHeights.length).toBeGreaterThan(1);
  });
});

test.describe('velo con el nombre de la foto', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const veilOf = (page, index) => page.locator('[data-photo]').nth(index).locator('span[aria-hidden="true"]');
  const veilOpacity = (page, index) => veilOf(page, index).evaluate((node) => Number(getComputedStyle(node).opacity));

  test('opacidad 0 en reposo, mayor que 0 con el ratón encima y con el foco de teclado (:focus-visible)', async ({ page }) => {
    await page.goto('/gallery');
    const first = page.locator('[data-photo]').first();
    await expect(first).toBeVisible();

    expect(await veilOpacity(page, 0), 'sin hover ni foco').toBe(0);
    await first.hover();
    await expect.poll(() => veilOpacity(page, 0)).toBeGreaterThan(0);
    await page.mouse.move(0, 0);
    await expect.poll(() => veilOpacity(page, 0)).toBe(0);

    // Con Tab (modalidad de teclado) el botón recibe :focus-visible.
    for (let i = 0; i < 40 && !(await first.evaluate((node) => node === document.activeElement)); i += 1) {
      await page.keyboard.press('Tab');
    }
    await expect(first).toBeFocused();
    await expect.poll(() => veilOpacity(page, 0)).toBeGreaterThan(0);
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-photo]').nth(1)).toBeFocused();
    await expect.poll(() => veilOpacity(page, 0)).toBe(0);
  });

  test('sin movimiento reducido la transición dura 0,15 s', async ({ page }) => {
    await page.goto('/gallery');
    await expect(veilOf(page, 0)).toHaveCount(1);
    expect(await veilOf(page, 0).evaluate((node) => getComputedStyle(node).transitionDuration)).toBe('0.15s');
  });

  test.describe('con movimiento reducido', () => {
    test.use({ reducedMotion: 'reduce' });

    test('transition-duration es 0 s', async ({ page }) => {
      await page.goto('/gallery');
      await expect(veilOf(page, 0)).toHaveCount(1);
      expect(await veilOf(page, 0).evaluate((node) => getComputedStyle(node).transitionDuration)).toBe('0s');
    });
  });
});

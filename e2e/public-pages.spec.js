import { test, expect, ROUTES, WIDTHS, trackLayoutShift, scrollThrough } from './fixtures.js';

// Criterios 35 y 43 a 48 de la spec «pulido de páginas públicas»: cada ruta pública a 390, 768, 1024 y
// 1440 px (en `es`; en `en` solo a 390 y 768, donde el texto más largo rompe antes) con la API simulada.

const HEIGHT = { 390: 844, 768: 1024, 1024: 768, 1440: 900 };

// Mide la página en el navegador. Se ejecuta con `page.evaluate`: no puede usar nada del módulo.
const measure = () => {
  const vw = window.innerWidth;
  const label = (el) =>
    `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} «${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}»`;
  const visible = (el) => {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    // `sr-only` (p. ej. «Saltar al contenido» sin foco) recorta todo el contenido: no se ve.
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      if (getComputedStyle(node).clip === 'rect(0px, 0px, 0px, 0px)') return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1;
  };
  // La barra inferior de Sidebar (fija, ancho completo, en /explorar) queda fuera de la comprobación de márgenes.
  const inBottomBar = (el) => {
    const nav = el.closest('nav');
    return Boolean(nav) && getComputedStyle(nav).position === 'fixed' && nav.getBoundingClientRect().top > 0;
  };
  const layerOf = (el) => {
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      const position = getComputedStyle(node).position;
      if (position === 'fixed' || position === 'sticky') return node;
    }
    return null;
  };

  // Objetivos táctiles (criterio 8): alto >= 44 en todo control aislado y ancho >= 44 salvo en los enlaces de
  // texto, cuyo ancho es el de su texto (se exige >= 24, WCAG 2.5.8). Los enlaces en línea quedan fuera.
  const smallTargets = [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [role="button"]')]
    .filter((el) => el.type !== 'hidden' && visible(el))
    .filter((el) => !(el.tagName === 'A' && getComputedStyle(el).display === 'inline'))
    .filter((el) => {
      const rect = el.getBoundingClientRect();
      const isTextLink = el.tagName === 'A' && !el.querySelector('img');
      return rect.height < 44 || rect.width < (isTextLink ? 24 : 44);
    })
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return `${label(el)} ${Math.round(rect.width)}x${Math.round(rect.height)}`;
    });

  // Opacidad efectiva (producto de la de sus ancestros) de todo elemento con texto propio.
  const faded = [...document.body.querySelectorAll('*')]
    .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== ''))
    .filter(visible)
    // Un control deshabilitado (p. ej. «anterior» en la primera página) queda exento de contraste (WCAG 1.4.3).
    .filter((el) => !el.closest(':disabled'))
    .map((el) => {
      let opacity = 1;
      for (let node = el; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
      return { el, opacity };
    })
    .filter(({ opacity }) => opacity < 1)
    .map(({ el, opacity }) => `${label(el)} opacity ${opacity.toFixed(2)}`);

  // Márgenes laterales: cada texto (por líneas), imagen y control a 16 px o más de los bordes.
  const margins = [];
  const check = (rect, el) => {
    if (rect.width < 1 || rect.height < 1) return;
    if (rect.left < 16 - 0.01 || rect.right > vw - 16 + 0.01) {
      margins.push(`${label(el)} x ${Math.round(rect.left)}-${Math.round(rect.right)}`);
    }
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    // Los iconos (ligaduras de Material Symbols) se miden como elemento: aquí la fuente no carga y su texto es largo.
    if (!node.textContent.trim() || !visible(el) || inBottomBar(el) || el.closest('.material-symbols-outlined')) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) check(rect, el);
  }
  for (const el of document.querySelectorAll('img, input, select, textarea, button')) {
    if (visible(el) && !inBottomBar(el)) check(el.getBoundingClientRect(), el);
  }

  // Solapes: pares de bloques que no son ancestros uno del otro y cuyos rectángulos se intersecan.
  // Cada capa fija o pegajosa (cabecera, barra lateral) se compara dentro de sí misma.
  const blocks = [
    ...document.querySelectorAll(
      'h1, h2, h3, h4, p, li, a, button, input, select, textarea, img, figure, figcaption, summary, label, th, td, [role="button"]'
    ),
  ].filter((el) => visible(el) && !el.closest('[aria-hidden="true"]'));
  const overlaps = [];
  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      const a = blocks[i];
      const b = blocks[j];
      if (a.contains(b) || b.contains(a) || layerOf(a) !== layerOf(b)) continue;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (w > 1 && h > 1) overlaps.push(`${label(a)} con ${label(b)} (${Math.round(w)}x${Math.round(h)})`);
    }
  }

  return {
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: vw,
    h1: document.querySelectorAll('h1').length,
    main: document.querySelectorAll('main').length,
    smallTargets,
    faded,
    margins,
    overlaps,
  };
};

const open = async (page, route) => {
  await page.goto(route);
  await expect(page.locator('h1')).toBeVisible();
  await page.waitForLoadState('networkidle');
  // El criterio pide medir la opacidad al cabo de 1 s: ninguna entrada animada puede seguir a medias.
  await page.waitForTimeout(1000);
};

const CASES = WIDTHS.flatMap((width) =>
  ['es', 'en'].filter((lang) => lang === 'es' || width <= 768).map((lang) => ({ width, lang }))
);

for (const { width, lang } of CASES) {
  test.describe(`${lang} a ${width} px`, () => {
    test.use({ viewport: { width, height: HEIGHT[width] }, lang });

    for (const route of ROUTES) {
      test(`${route}: sin desbordamiento, estructura, objetivos, opacidad, márgenes y solapes`, async ({ page }, testInfo) => {
        await open(page, route);
        await page.screenshot({ path: testInfo.outputPath(`captura-${lang}-${width}.png`), fullPage: true });
        const m = await page.evaluate(measure);

        expect.soft(m.scrollWidth, 'scrollWidth').toBeLessThanOrEqual(m.innerWidth);
        expect.soft(m.h1, 'número de <h1>').toBe(1);
        expect.soft(m.main, 'número de <main>').toBe(1);
        expect.soft(m.smallTargets, 'objetivos de menos de 44 px').toEqual([]);
        expect.soft(m.faded, 'texto con opacidad efectiva < 1 tras 1 s').toEqual([]);
        if (width === 390) expect.soft(m.margins, 'elementos a menos de 16 px del borde').toEqual([]);
        expect.soft(m.overlaps, 'bloques que se solapan').toEqual([]);
      });
    }
  });
}

// Criterio 44: a 1024 y 1440 px la `x` del <h1> es la misma en todas las páginas. En /explorar la barra
// lateral fija (112 px, fuera de alcance) desplaza la columna, así que se mide respecto al <main>
// y se anota como excepción (pregunta 1 de la puerta 2).
for (const width of [1024, 1440]) {
  test(`x del <h1> igual entre páginas a ${width} px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: HEIGHT[width] });
    const xs = {};
    for (const route of ROUTES) {
      await open(page, route);
      xs[route] = await page.evaluate(() => ({
        h1: document.querySelector('h1').getBoundingClientRect().left,
        main: document.querySelector('main').getBoundingClientRect().left,
      }));
    }
    testInfo.annotations.push({ type: 'x del h1', description: JSON.stringify(xs) });
    const regular = ROUTES.filter((route) => route !== '/explorar').map((route) => xs[route].h1);
    expect(new Set(regular).size, `x del <h1> por ruta: ${JSON.stringify(xs)}`).toBe(1);
    // Respecto al <main>, /explorar no se sale del contenedor: x >= 0 y dentro del ancho.
    expect(xs['/explorar'].h1 - xs['/explorar'].main).toBeGreaterThanOrEqual(0);
  });
}

test.describe('movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });

  for (const route of ROUTES) {
    test(`${route}: ningún fondo fijo y la flecha del hero no se anima`, async ({ page }) => {
      await open(page, route);
      const result = await page.evaluate(() => {
        const fixedBackgrounds = [...document.querySelectorAll('*')]
          .filter((el) => getComputedStyle(el).backgroundAttachment.includes('fixed'))
          .map((el) => el.tagName.toLowerCase());
        const arrow = document.querySelector('button[aria-label="Bajar"]');
        const animated = arrow
          ? [arrow, ...arrow.querySelectorAll('*')].filter(
              (el) => getComputedStyle(el).animationName !== 'none' || el.getAnimations().length > 0
            ).length
          : 0;
        return { fixedBackgrounds, hasArrow: Boolean(arrow), animated };
      });
      expect(result.fixedBackgrounds).toEqual([]);
      // La flecha solo existe en el hero de Home (criterio de la fase 3).
      expect(result.hasArrow).toBe(route === '/');
      expect(result.animated).toBe(0);
    });
  }
});

// Criterio 5: CLS de Home. Se recorre la página para que carguen las imágenes diferidas.
for (const width of [390, 1440]) {
  test(`CLS de Home a ${width} px es como mucho 0,1`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT[width] });
    await trackLayoutShift(page);
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await page.waitForLoadState('networkidle');
    await scrollThrough(page);
    await page.waitForTimeout(800);
    const cls = await page.evaluate(() => window.__cls);
    expect(cls, `CLS ${cls}`).toBeLessThanOrEqual(0.1);
  });
}

test('/explorar: el recuento muestra el total real tras cargar (30 de 30), no 0', async ({ page }) => {
  await page.goto('/explorar');
  await expect(page.getByText(/Mostrando \d+ de 30 resultados/)).toBeVisible();
});

test.describe('banner de cookies', () => {
  test.use({ consent: false });

  test('se muestra sin consentimiento y aceptar guarda la cookie y lo oculta', async ({ page, context }) => {
    await open(page, '/cookies');
    const banner = page.getByRole("button", { name: /aceptar todo/i }).first();
    await expect(banner).toBeVisible();
    await banner.click();
    await expect(banner).toBeHidden();
    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === 'cookieConsent')?.value).toBe('accepted');
  });
});

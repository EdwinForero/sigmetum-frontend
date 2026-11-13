import { test, expect, ROUTES, WIDTHS, trackLayoutShift, scrollThrough } from './fixtures.js';

// Criterios 35 y 43 a 48 de la spec «pulido de páginas públicas»: cada ruta pública a 390, 768, 1024 y
// 1440 px (en `es`; en `en` solo a 390 y 768, donde el texto más largo rompe antes) con la API simulada.

// Ruta sin página: el 404 también anima su bloque de contenido.
const NOT_FOUND = '/no-existe';

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
  // La barra inferior de Sidebar (fija, ancho completo, en /explore) queda fuera de la comprobación de márgenes.
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
    // El velo de la galería (aria-hidden) está a 0 hasta el hover o el foco y repite el pie visible: no es texto de lectura.
    .filter((el) => !el.closest('[aria-hidden="true"]'))
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

// Recorre la página, espera a que acaben las transiciones de aparición (450 ms más el escalonado de 300 ms) y vuelve arriba.
const settleReveals = async (page) => {
  await scrollThrough(page);
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 0));
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
        // La opacidad se mide tras recorrer la página: las apariciones por scroll (Reveal) ya han terminado (F3.5).
        await settleReveals(page);
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

// Criterio 44: a 1024 y 1440 px la `x` del <h1> es la misma en todas las páginas. En /explore la barra
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
    const regular = ROUTES.filter((route) => route !== '/explore').map((route) => xs[route].h1);
    expect(new Set(regular).size, `x del <h1> por ruta: ${JSON.stringify(xs)}`).toBe(1);
    // Respecto al <main>, /explore no se sale del contenedor: x >= 0 y dentro del ancho.
    expect(xs['/explore'].h1 - xs['/explore'].main).toBeGreaterThanOrEqual(0);
  });
}

// Criterio 28 c: los cinco enlaces del pie van en dos columnas a 390 px y en una desde 768 px.
for (const [width, columns] of [[390, 2], [768, 1], [1024, 1]]) {
  test(`pie: los cinco enlaces quedan en ${columns} columna(s) a ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT[width] });
    await open(page, '/cookies');
    const links = page.locator('footer ul a');
    await expect(links).toHaveCount(5);
    const xs = await links.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
    expect(new Set(xs).size, `x de los enlaces del pie: ${JSON.stringify(xs)}`).toBe(columns);
  });
}

// Criterio 28 c: el ítem activo del menú móvil se distingue sin color (aria-current, subrayado de 4 px).
test.describe('menú móvil', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('en /gallery el ítem activo tiene aria-current, subrayado y grosor de 4 px', async ({ page }) => {
    await open(page, '/gallery');
    await page.locator('#navbar-menu-button').click();
    const panel = page.locator('#navbar-menu-panel');
    await expect(panel).toBeVisible();
    const active = panel.locator('a[aria-current="page"]');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveAttribute('href', '/gallery');
    const style = await active.evaluate((el) => {
      const { textDecorationLine, textDecorationThickness } = getComputedStyle(el);
      return { textDecorationLine, textDecorationThickness };
    });
    expect(style.textDecorationLine).toContain('underline');
    expect(style.textDecorationThickness).toBe('4px');
    // Los demás ítems no llevan aria-current ni subrayado.
    const others = await panel.locator('a:not([aria-current])').evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).textDecorationLine)
    );
    expect(others).toHaveLength(3);
    others.forEach((line) => expect(line).toBe('none'));
  });
});

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

// F3.5 (A4): con movimiento reducido, tras recorrer la página nada de lo que aparece por scroll queda a medias:
// ningún [data-reveal] con opacidad menor de 1 ni transform, y ni él ni el contenedor con animate-page-fade animan.
// A4 se limita a [data-reveal] y a animate-page-fade (desviación documentada: no es un barrido de toda la página).
test.describe('movimiento reducido: apariciones', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });

  for (const route of [...ROUTES, NOT_FOUND]) {
    test(`${route}: tras scrollThrough ningún [data-reveal] con opacidad < 1 ni transform y sin animación de aparición`, async ({ page }) => {
      await open(page, route);
      await scrollThrough(page);
      await page.waitForTimeout(300);
      const result = await page.evaluate(() => {
        const targets = [...document.querySelectorAll('[data-reveal], .animate-page-fade')];
        const bad = (el) => {
          const style = getComputedStyle(el);
          return {
            el: el.tagName.toLowerCase(),
            opacity: Number(style.opacity),
            transform: style.transform,
            animations: el.getAnimations().length,
            hidden: el.classList.contains('reveal-hidden'),
          };
        };
        return {
          count: document.querySelectorAll('[data-reveal]').length,
          bad: targets.map(bad).filter((r) => r.opacity < 1 || r.transform !== 'none' || r.animations > 0 || r.hidden),
        };
      });
      expect(result.bad).toEqual([]);
      expect(result.count, 'hay elementos [data-reveal] que medir').toBeGreaterThan(0);
    });
  }
});

// F3.5: ningún Reveal anidado en ninguna ruta pública (ni en el 404) una vez recorrida la página.
test.describe('Reveal no se anida', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const route of [...ROUTES, NOT_FOUND]) {
    test(`${route}: [data-reveal] [data-reveal] no devuelve nada`, async ({ page }) => {
      await open(page, route);
      await scrollThrough(page);
      const nested = await page.evaluate(() => document.querySelectorAll('[data-reveal] [data-reveal]').length);
      expect(nested).toBe(0);
    });
  }
});

// F3.5 (A5): CLS con las apariciones animadas por debajo de 0,01 a 390, 1440 y 2560 px en todas las rutas públicas.
// Si la línea base sin animaciones (movimiento reducido) ya es de 0,01 o más, lo que se exige es la diferencia:
// las apariciones no pueden sumar 0,01 sobre ella. (Hoy solo /gallery a 390 px: 0,029 con y sin animaciones.)
const CLS_LIMIT = 0.01;
const measureCls = async (page, route) => {
  await page.goto(route);
  await expect(page.locator('h1')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await scrollThrough(page);
  await page.waitForTimeout(1000);
  return page.evaluate(() => window.__cls);
};

for (const width of [390, 1440, 2560]) {
  for (const route of [...ROUTES, NOT_FOUND]) {
    test(`CLS de ${route} a ${width} px es menor de 0,01 (o no suma 0,01 sobre su línea base sin animaciones)`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: width === 2560 ? 1440 : HEIGHT[width] });
      await trackLayoutShift(page);
      const cls = await measureCls(page, route);
      if (cls < CLS_LIMIT) return;
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const base = await measureCls(page, route);
      testInfo.annotations.push({ type: 'línea base', description: `CLS ${cls} con animaciones y ${base} sin ellas` });
      expect(cls - base, `CLS ${cls} con animaciones y ${base} sin ellas`).toBeLessThan(CLS_LIMIT);
    });
  }
}

// F3.5: en /explore, con las tarjetas ya reveladas, una tarjeta de la segunda fila abre su ficha con Enter:
// el contenedor fixed inset-0 cubre la ventana (±1 px; un transform residual del Reveal lo desplazaría) y
// la tarjeta no deja transform. La de la segunda fila está en la primera pantalla (visible desde el principio); la última
// (a 390 px, y a 1440 px con una ventana baja) queda bajo el pliegue y es una que de verdad se ha revelado por scroll.
for (const [width, height, which] of [[390, 844, 'segunda fila'], [1440, 900, 'segunda fila'], [390, 844, 'última'], [1440, 500, 'última']]) {
  test(`/explore a ${width}x${height} px: la ficha de la tarjeta de la ${which} cubre la ventana y la tarjeta no tiene transform`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page, '/explore');
    await scrollThrough(page);
    await page.waitForTimeout(1000);
    const cards = page.locator('[data-reveal] > [role="button"]');
    const second = await cards.evaluateAll((els) => {
      const tops = els.map((el) => Math.round(el.getBoundingClientRect().top + window.scrollY));
      return tops.findIndex((top) => top > tops[0] + 1);
    });
    expect(second, 'hay una segunda fila de tarjetas').toBeGreaterThan(0);
    const index = which === 'última' ? (await cards.count()) - 1 : second;
    if (which === 'última') await expect(cards.nth(index).locator('..'), 'la tarjeta se reveló por scroll').toHaveClass(/reveal-in/);
    await cards.nth(index).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.waitForTimeout(600);
    const m = await page.evaluate((index) => {
      const wrapper = document.querySelectorAll('[data-reveal] > [role="button"]')[index].parentElement;
      const container = document.querySelector('[role="dialog"]').closest('.fixed');
      const box = (el) => {
        const rect = el.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      };
      // Sonda: un fixed inset-0 sin ningún ancestro con transform. Mide el viewport de diseño, que es innerWidth menos
      // la reserva de la barra de desplazamiento (html lleva scrollbar-gutter: stable: 15 px en Chromium de escritorio).
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;inset:0;visibility:hidden;pointer-events:none';
      document.body.append(probe);
      const reference = box(probe);
      probe.remove();
      return {
        rect: box(container),
        reference,
        inner: { width: window.innerWidth, height: window.innerHeight },
        wrapperTransform: getComputedStyle(wrapper).transform,
        cardTransform: getComputedStyle(wrapper.firstElementChild).transform,
      };
    }, index);
    const near = (a, b) => Math.abs(a - b) <= 1;
    const same = (a, b) => near(a.x, b.x) && near(a.y, b.y) && near(a.width, b.width) && near(a.height, b.height);
    // El contenedor mide {0, 0, innerWidth, innerHeight} salvo la reserva de la barra (como mucho 17 px de ancho).
    expect(m.reference.x === 0 && m.reference.y === 0 && near(m.reference.height, m.inner.height), JSON.stringify(m)).toBe(true);
    expect(m.inner.width - m.reference.width, JSON.stringify(m)).toBeLessThanOrEqual(17);
    expect(same(m.rect, m.reference), JSON.stringify(m)).toBe(true);
    expect(m.wrapperTransform).toBe('none');
    expect(m.cardTransform).toBe('none');
  });
}

// F3.5: al llegar a /cookies desde el pie (la página venía scrollada abajo) el <h1> y la primera sección están a
// opacidad 1 y la página arriba: App sube el scroll después del primer render y Reveal no oculta la primera pantalla.
test('al llegar a /cookies desde un enlace del pie el <h1> y la primera sección tienen opacidad 1 y scrollY 0', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, '/about-us');
  await scrollThrough(page);
  await page.locator('footer a[href="/cookies"]').click();
  await expect(page).toHaveURL(/\/cookies$/);
  await expect(page.locator('h1')).toBeVisible();
  await page.waitForTimeout(100);
  const m = await page.evaluate(() => {
    const opacity = (el) => {
      let value = 1;
      for (let node = el; node; node = node.parentElement) value *= Number(getComputedStyle(node).opacity);
      return value;
    };
    return { scrollY: window.scrollY, h1: opacity(document.querySelector('h1')), section: opacity(document.querySelector('main section')) };
  });
  expect(m).toEqual({ scrollY: 0, h1: 1, section: 1 });
});

// F3.5: al imprimir nada queda oculto: ningún [data-reveal] con opacidad menor de 1, aunque esté bajo el pliegue.
test.describe('impresión', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const route of [...ROUTES, NOT_FOUND]) {
    test(`${route}: con emulateMedia print ningún [data-reveal] con opacidad < 1`, async ({ page }) => {
      await open(page, route);
      if (route === '/') {
        const hidden = await page.locator('[data-reveal].reveal-hidden').count();
        expect(hidden, 'antes de imprimir hay elementos ocultos por debajo del pliegue').toBeGreaterThan(0);
      }
      await page.emulateMedia({ media: 'print' });
      const faded = await page.evaluate(() =>
        [...document.querySelectorAll('[data-reveal]')]
          .map((el) => ({ el: el.tagName.toLowerCase(), opacity: Number(getComputedStyle(el).opacity), transform: getComputedStyle(el).transform }))
          .filter((r) => r.opacity < 1 || r.transform !== 'none')
      );
      expect(faded).toEqual([]);
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

test('/explore: el recuento muestra el total real tras cargar (30 de 30), no 0', async ({ page }) => {
  await page.goto('/explore');
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

// D1 y D2 (F2.1): a 1440 px la cabecera sigue el ancho común. El logo empieza donde el <h1> y donde el
// contenedor del pie; el borde derecho de la navegación coincide con el del contenido del pie (±1 px).
test.describe('cabecera en el ancho común', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const route of ['/', '/about-us']) {
    test(`${route}: logo, <h1> y pie comparten borde izquierdo y la navegación el derecho`, async ({ page }) => {
      await open(page, route);
      const m = await page.evaluate(() => {
        const edges = (el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return { left: rect.left + parseFloat(style.paddingLeft), right: rect.right - parseFloat(style.paddingRight) };
        };
        const footer = edges(document.querySelector('footer .page-container'));
        return {
          logo: document.querySelector('header a[aria-label="SIGMETUM-A"]').getBoundingClientRect().left,
          h1: document.querySelector('h1').getBoundingClientRect().left,
          footerLeft: footer.left,
          navRight: document.querySelector('header nav').getBoundingClientRect().right,
          footerRight: footer.right,
        };
      });
      expect(Math.abs(m.logo - m.h1), JSON.stringify(m)).toBeLessThanOrEqual(1);
      expect(Math.abs(m.logo - m.footerLeft), JSON.stringify(m)).toBeLessThanOrEqual(1);
      expect(Math.abs(m.navRight - m.footerRight), JSON.stringify(m)).toBeLessThanOrEqual(1);
    });
  }
});

// E1 (F2.2): las entidades de Home van centradas. Los encabezados y el bloque del líder quedan en el centro
// del contenido; cada grupo de bloques (universidades, entidades) está centrado y cada logo en su bloque (±1 px).
for (const width of [390, 768, 1024, 1440, 2560]) {
  test(`Home: los bloques de entidades están centrados a ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width >= 1440 ? 1080 : HEIGHT[width] ?? 900 });
    await open(page, '/');
    const m = await page.evaluate(() => {
      const section = document.querySelector('#home-descripcion + section');
      const content = section.getBoundingClientRect();
      const style = getComputedStyle(section);
      const centre = (rect) => (rect.left + rect.right) / 2;
      const pageCentre = (content.left + parseFloat(style.paddingLeft) + content.right - parseFloat(style.paddingRight)) / 2;
      const group = (grid) => {
        const rects = [...grid.children].map((el) => el.getBoundingClientRect());
        return {
          centre: (Math.min(...rects.map((r) => r.left)) + Math.max(...rects.map((r) => r.right))) / 2,
          logos: [...grid.children].map((el) => ({
            block: centre(el.getBoundingClientRect()),
            logo: centre(el.querySelector('a').getBoundingClientRect()),
          })),
        };
      };
      const [leader, universities, entities] = [...section.children].filter((el) => el.tagName === 'DIV');
      const leaderLogo = leader.querySelector('a');
      return {
        pageCentre,
        // El centro del texto (no el de la caja, que es un bloque a todo el ancho).
        headings: [...section.querySelectorAll('h2, h3')].map((h) => {
          const range = document.createRange();
          range.selectNodeContents(h);
          const rects = [...range.getClientRects()];
          return (Math.min(...rects.map((r) => r.left)) + Math.max(...rects.map((r) => r.right))) / 2;
        }),
        leader: centre(leaderLogo.getBoundingClientRect()),
        groups: [group(universities), group(entities)],
      };
    });
    // Ningún nombre de «Otras universidades» se reparte en columnas: cada <li> ocupa todo el ancho de su lista (un nombre largo sí puede ajustarse en dos líneas).
    const listas = await page.evaluate(() =>
      [...document.querySelectorAll('#home-descripcion + section ul')].slice(1).flatMap((ul) => [...ul.children]).map((li) => ({
        text: li.textContent,
        width: li.getBoundingClientRect().width,
        listWidth: li.parentElement.getBoundingClientRect().width,
      }))
    );
    for (const li of listas) {
      expect(li.width, `«${li.text}» en una columna estrecha`).toBeGreaterThanOrEqual(li.listWidth - 1);
    }
    const near = (a, b, what) => expect(Math.abs(a - b), `${what}: ${a} frente a ${m.pageCentre} (${JSON.stringify(m)})`).toBeLessThanOrEqual(1);
    m.headings.forEach((c) => near(c, m.pageCentre, 'encabezado'));
    near(m.leader, m.pageCentre, 'logo del líder');
    for (const g of m.groups) {
      near(g.centre, m.pageCentre, 'grupo');
      g.logos.forEach(({ block, logo }) => near(logo, block, 'logo en su bloque'));
    }
  });
}

// Sobre nosotros: separación vertical entre el <h1> y el párrafo en todos los anchos (también con rejilla desde lg).
for (const width of [390, 1024, 1440]) {
  test(`/about-us: el párrafo queda a 16 px o más bajo el <h1> a ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT[width] });
    await open(page, '/about-us');
    const gap = await page.evaluate(
      () => document.querySelector('section p').getBoundingClientRect().top - document.querySelector('h1').getBoundingClientRect().bottom
    );
    expect(gap).toBeGreaterThanOrEqual(16);
  });
}

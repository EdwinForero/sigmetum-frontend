import { test, expect, ROUTES } from './fixtures.js';

// Formato del contenido (spec «formato del contenido y deuda»): se mide el DOM renderizado, no las clases.
// Las fuentes de Google están cortadas en la suite, así que las medidas de texto son relativas (65ch con la
// fuente activa, igualdades entre elementos); los valores absolutos con la fuente real los mide el orquestador.
// Con movimiento reducido `.reveal-hidden` queda con `opacity: 1` y sin `transform`: los rectángulos no incluyen
// los 12 px de la aparición.
test.use({ reducedMotion: 'reduce' });

const HEIGHT = { 390: 844, 768: 1024, 1024: 768, 1440: 900 };
const MOSS = 'rgb(75, 100, 74)';
const INK_SOFT = 'rgb(20, 40, 29)';

const open = async (page, route) => {
  await page.goto(route);
  await expect(page.locator('h1')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
};

// Mide /cookies en el navegador. Se ejecuta con `page.evaluate`: no puede usar nada del módulo.
const measureCookies = () => {
  // Ancho de un carácter «0» con la fuente de `el`: un span oculto que se añade y se retira.
  const ch = (el) => {
    const span = document.createElement('span');
    span.textContent = '0';
    span.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
    el.appendChild(span);
    const width = span.getBoundingClientRect().width;
    span.remove();
    return width;
  };
  const rect = (el) => el.getBoundingClientRect();
  const lineHeight = (el) => {
    const style = getComputedStyle(el);
    return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
  };
  const vw = window.innerWidth;
  const main = document.querySelector('main');
  const article = main.querySelector('article');
  const column = article.querySelector(':scope > div');
  // Sin columna (código anterior) las medidas dependientes quedan en NaN y la prueba falla con un mensaje claro.
  const col = column ? rect(column) : { left: NaN, width: NaN };
  const sections = [...article.querySelectorAll('section')];
  const lists = [...article.querySelectorAll('ul')];

  const bullets = [];
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.textContent.trim().startsWith('•')) bullets.push(node.textContent.trim().slice(0, 40));
  }

  const gaps = [];
  const gap = (name, from, to, expected) =>
    gaps.push({ name, actual: from && to ? rect(to).top - rect(from).bottom : NaN, expected });
  const h1 = article.querySelector('h1');
  if (sections[0]) gap('h1 → h2', h1, sections[0].querySelector('h2'), 24);
  const sectionGap = vw >= 768 ? 64 : 48;
  sections.forEach((section, index) => {
    const h2 = section.querySelector('h2');
    gap(`sección ${index + 1}: h2 → contenido`, h2, h2.nextElementSibling, 24);
    for (const block of section.querySelectorAll(':scope > div')) {
      const children = [...block.children];
      children.slice(1).forEach((child, i) => gap(`sección ${index + 1}: bloque ${i + 1} → ${i + 2}`, children[i], child, 16));
    }
    if (index > 0) {
      // De lo último de la sección anterior al h2: dos rellenos más el filete de 1 px.
      gap(`sección ${index} → ${index + 1}`, sections[index - 1].lastElementChild, h2, sectionGap + 1);
    }
  });
  for (const h3 of article.querySelectorAll('h3')) {
    if (h3.nextElementSibling) gap(`h3 «${h3.textContent.trim().slice(0, 20)}» → contenido`, h3, h3.nextElementSibling, 16);
    if (h3.previousElementSibling) gap('bloque → h3', h3.previousElementSibling, h3, 32);
  }
  for (const list of lists) {
    const items = [...list.children];
    const style = getComputedStyle(list).listStyleType;
    const withHeading = items.every((li) => li.firstElementChild?.tagName === 'H3');
    const withLinks = items.every((li) => li.querySelector('a'));
    const expected = withHeading ? 32 : withLinks ? 0 : style === 'disc' ? 8 : null;
    if (expected === null) continue;
    items.slice(1).forEach((li, i) => gap(`lista (${items.length}): elemento ${i + 1} → ${i + 2}`, items[i], li, expected));
    if (withLinks) items.slice(1).forEach((li, i) => gap(`enlaces: ${i + 1} → ${i + 2}`, items[i].querySelector('a'), li.querySelector('a'), 0));
  }

  return {
    bullets,
    numberedH3: [...article.querySelectorAll('h3')].map((el) => el.textContent.trim()).filter((text) => /^\d+[.)]/.test(text)),
    listSizes: lists.map((list) => list.children.length),
    liOutsideUl: [...article.querySelectorAll('li')].filter((li) => li.parentElement.tagName !== 'UL').length,
    unmarkedWithoutRole: lists
      .filter((list) => getComputedStyle(list).listStyleType === 'none' && list.getAttribute('role') !== 'list')
      .map((list) => list.className),
    sections: sections.length,
    hasColumn: Boolean(column),
    column: { left: col.left, width: col.width, ch: column ? ch(column) : NaN },
    paragraphs: [...article.querySelectorAll('p')].map((p) => ({
      width: rect(p).width,
      left: rect(p).left,
      color: getComputedStyle(p).color,
      lineHeight: lineHeight(p),
      text: p.textContent.trim().slice(0, 30),
    })),
    rules: sections.map((section) => {
      const style = getComputedStyle(section);
      const box = rect(section);
      return { top: style.borderTopWidth, color: style.borderTopColor, left: box.left, width: box.width };
    }),
    titles: [...main.querySelectorAll('h1, h2, h3')].map((el) => ({
      tag: el.tagName,
      size: parseFloat(getComputedStyle(el).fontSize),
      lineHeight: lineHeight(el),
      text: el.textContent.trim().slice(0, 30),
    })),
    gaps,
  };
};

const CASES = [
  ...[390, 768, 1024, 1440].map((width) => ({ width, lang: 'es' })),
  ...[390, 768].map((width) => ({ width, lang: 'en' })),
];

for (const { width, lang } of CASES) {
  test.describe(`/cookies en ${lang} a ${width} px`, () => {
    test.use({ viewport: { width, height: HEIGHT[width] }, lang });

    test('sin viñetas escritas ni números en los títulos, con listas reales', async ({ page }) => {
      await open(page, '/cookies');
      const m = await page.evaluate(measureCookies);

      expect(m.bullets, 'nodos de texto que empiezan por «•»').toEqual([]);
      expect(m.numberedH3, 'h3 que empiezan por un número').toEqual([]);
      expect(m.sections, 'secciones').toBe(6);
      expect(m.listSizes, 'li por lista (tipos, usos, categorías y enlaces)').toEqual([2, 5, 4, 8]);
      expect(m.liOutsideUl, 'li que no cuelgan de un ul').toBe(0);
      expect(m.unmarkedWithoutRole, 'ul sin marcador y sin role="list"').toEqual([]);
    });

    test('párrafos y filetes miden lo que la columna de lectura, que no pasa de 65ch', async ({ page }) => {
      await open(page, '/cookies');
      const m = await page.evaluate(measureCookies);

      expect(m.hasColumn, 'existe la columna `main article > div`').toBe(true);
      // El tope de 65ch lo fija el propio max-w de la columna: no puede fallar por construcción, se adjunta sin expect.
      test.info().annotations.push({ type: 'columna (ancho / 65ch)', description: `${Math.round(m.column.width)} / ${Math.round(65 * m.column.ch)}` });
      const offWidth = m.paragraphs.filter((p) => !(Math.abs(p.width - m.column.width) <= 1 && Math.abs(p.left - m.column.left) <= 1));
      expect(offWidth, 'párrafos con otro ancho o x que la columna').toEqual([]);
      expect(m.rules[0].top, 'la primera sección no lleva filete').toBe('0px');
      const rules = m.rules.slice(1);
      expect(rules).toHaveLength(5);
      for (const rule of rules) {
        expect(rule.top, 'filete').toBe('1px');
        expect(rule.color, 'color del filete').toBe(MOSS);
        expect(Math.abs(rule.width - m.column.width), 'ancho del filete frente a la columna').toBeLessThanOrEqual(1);
        expect(Math.abs(rule.left - m.column.left), 'x del filete frente a la columna').toBeLessThanOrEqual(1);
      }
    });

    test('ritmo vertical: 24 bajo los títulos, 16 entre párrafos, 32 entre categorías, 8 en viñetas, 0 en enlaces y 48/64 entre secciones', async ({ page }) => {
      await open(page, '/cookies');
      const m = await page.evaluate(measureCookies);

      expect(m.gaps.length, 'distancias medidas').toBeGreaterThan(25);
      expect(m.gaps.filter((g) => !(Math.abs(g.actual - g.expected) <= 1)), 'distancias fuera de ±1 px').toEqual([]);
    });

    test('tipografía: h2 24/36, h3 20/24, interlineado de títulos ≤ 1,25 y de párrafos ≥ 1,5 en ink-soft', async ({ page }) => {
      await open(page, '/cookies');
      const m = await page.evaluate(measureCookies);
      const wide = width >= 768;

      for (const title of m.titles) {
        expect(title.lineHeight, `interlineado de ${title.tag} «${title.text}»`).toBeLessThanOrEqual(1.25);
      }
      expect(m.titles.filter((t) => t.tag === 'H2').map((t) => t.size), 'tamaños de los h2').toEqual(Array(6).fill(wide ? 36 : 24));
      expect(m.titles.filter((t) => t.tag === 'H3').map((t) => t.size), 'tamaños de los h3').toEqual(Array(5).fill(wide ? 24 : 20));
      for (const p of m.paragraphs) {
        expect(p.lineHeight, `interlineado del párrafo «${p.text}»`).toBeGreaterThanOrEqual(1.5);
        expect(p.color, 'color del párrafo').toBe(INK_SOFT);
      }
    });
  });
}

// Sobre nosotros: dos columnas desde lg (párrafo e imagen) y debajo las tarjetas en 2 + 1 (las dos cortas en una
// fila, la larga sola a lo ancho de la rejilla). Se mide el DOM renderizado.
const measureAbout = () => {
  const ch = (el) => {
    const span = document.createElement('span');
    span.textContent = '0';
    span.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
    el.appendChild(span);
    const width = span.getBoundingClientRect().width;
    span.remove();
    return width;
  };
  const rect = (el) => el.getBoundingClientRect();
  const first = document.querySelector('main section');
  const h1 = first.querySelector('h1');
  const img = first.querySelector('img');
  const p = first.querySelector('p');
  const cards = [...document.querySelectorAll('main ul > li')];
  const texts = cards.map((li) => li.querySelector('p'));
  const footer = document.querySelector('footer');
  const box = (el) => {
    const r = rect(el);
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  };
  const container = box(first);
  const padLeft = parseFloat(getComputedStyle(first).paddingLeft);
  const padRight = parseFloat(getComputedStyle(first).paddingRight);
  return {
    h1: box(h1),
    img: box(img),
    p: box(p),
    content: { left: container.left + padLeft, right: container.right - padRight },
    cards: cards.map(box),
    texts: texts.map((el) => ({ ...box(el), ch: ch(el) })),
    footerTop: rect(footer).top,
    lastBlockBottom: Math.max(rect(img).bottom, rect(p).bottom),
    order: Boolean(h1.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      Boolean(img.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING),
    charsPerLine: texts.map((el) => {
      const lines = Math.round(rect(el).height / parseFloat(getComputedStyle(el).lineHeight));
      return { lines, text: el.textContent.length, chars: Math.round(el.textContent.length / lines) };
    }),
  };
};

const ABOUT_CASES = [
  ...[390, 768, 1024, 1440].map((width) => ({ width, lang: 'es' })),
  ...[1024, 1440].map((width) => ({ width, lang: 'en' })),
];

for (const { width, lang } of ABOUT_CASES) {
  test.describe(`/about-us en ${lang} a ${width} px`, () => {
    test.use({ viewport: { width, height: HEIGHT[width] }, lang });
    const wide = width >= 1024;
    const near = (actual, expected, what) => expect(Math.abs(actual - expected), `${what}: ${actual} frente a ${expected}`).toBeLessThanOrEqual(1);

    test('primera sección: h1, imagen y párrafo con el ritmo de la escala', async ({ page }) => {
      await open(page, '/about-us');
      const m = await page.evaluate(measureAbout);

      expect(m.order, 'orden del DOM h1, imagen, párrafo').toBe(true);
      if (!wide) {
        near(m.img.top - m.h1.bottom, 24, 'h1 → imagen');
        near(m.p.top - m.img.bottom, 24, 'imagen → párrafo');
        return;
      }
      near(m.p.top - m.h1.bottom, 24, 'h1 → párrafo');
      near(m.img.top - m.h1.bottom, 24, 'h1 → imagen');
      near(m.p.top, m.img.top, 'top del párrafo y de la imagen');
      near(m.p.bottom, m.img.bottom, 'bottom del párrafo y de la imagen');
      near(m.p.left, m.content.left, 'x del párrafo frente al contenido');
      near(m.img.right, m.content.right, 'borde derecho de la imagen frente al contenido');
      near(m.img.left - m.p.right, 24, 'hueco entre párrafo e imagen');
    });

    test('tarjetas: una columna bajo lg y 2 + 1 desde lg', async ({ page }) => {
      await open(page, '/about-us');
      const m = await page.evaluate(measureAbout);
      const [a, b, c] = m.cards;

      if (!wide) {
        for (const card of [b, c]) {
          near(card.left, a.left, 'left de la tarjeta');
          near(card.width, a.width, 'ancho de la tarjeta');
        }
        near(b.top - a.bottom, 24, 'tarjeta 1 → 2');
        near(c.top - b.bottom, 24, 'tarjeta 2 → 3');
      } else {
        near(a.top, b.top, 'top de las dos cortas');
        // El alto igual lo da el estiramiento de la rejilla: no discrimina, se adjunta sin expect.
        test.info().annotations.push({ type: 'alto de las dos cortas (px)', description: `${Math.round(a.height)} y ${Math.round(b.height)}` });
        near(b.left - a.right, 24, 'hueco entre las dos cortas');
        near(c.top - a.bottom, 24, 'larga bajo las cortas');
        near(c.left, a.left, 'left de la larga');
        near(c.right, b.right, 'right de la larga');
        near(m.texts[0].width, m.texts[1].width, 'texto de las dos cortas');
        // El tope de 65ch lo fija max-w-prose: no puede fallar por construcción, se adjunta sin expect.
        test.info().annotations.push({ type: 'texto de la larga (ancho / 65ch)', description: `${Math.round(m.texts[2].width)} / ${Math.round(65 * m.texts[2].ch)}` });
        // Vacío bajo la tarjeta más corta: depende de la fuente de reserva del sistema operativo, así que solo se
        // adjunta (sin expect), igual que los caracteres por línea.
        const gapBelow = Math.abs(m.texts[0].bottom - m.texts[1].bottom);
        test.info().annotations.push({ type: 'vacío bajo la corta (px)', description: String(Math.round(gapBelow)) });
        test.info().annotations.push({ type: 'caracteres por línea', description: JSON.stringify(m.charsPerLine) });
      }
    });

    test('ritmo exterior: sección → tarjetas 48/64 y tarjetas → pie 48/64', async ({ page }) => {
      await open(page, '/about-us');
      const m = await page.evaluate(measureAbout);
      const gap = width >= 768 ? 64 : 48;

      near(m.cards[0].top - m.lastBlockBottom, gap, 'último bloque → primera tarjeta');
      near(m.footerTop - m.cards[2].bottom, gap, 'última tarjeta → pie');
    });
  });
}

// Home: ritmo de las secciones de colaboradores y de contacto, filetes y interlineado de los h3.
const measureHome = () => {
  const rect = (el) => el.getBoundingClientRect();
  const lineHeight = (el) => {
    const style = getComputedStyle(el);
    return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
  };
  const entities = document.querySelector('#home-descripcion + section');
  const contact = document.querySelector('#contacto');
  const footer = document.querySelector('footer');
  const gaps = [];
  const gap = (name, from, to, expected) => gaps.push({ name, actual: from && to ? rect(to).top - rect(from).bottom : NaN, expected });
  const wide = window.innerWidth >= 768;
  const [leaderTitle] = entities.querySelectorAll(':scope > h2');
  const h3s = [...entities.querySelectorAll(':scope > h3')];
  gap('h2 → logo del líder', leaderTitle, leaderTitle.nextElementSibling, 24);
  h3s.forEach((h3) => {
    gap(`bloque → h3 «${h3.textContent.trim().slice(0, 20)}»`, h3.previousElementSibling, h3, 32);
    gap(`h3 «${h3.textContent.trim().slice(0, 20)}» → contenido`, h3, h3.nextElementSibling, 16);
  });
  const contactTitle = contact.querySelector(':scope > h2');
  gap('entidades → h2 de contacto', entities.lastElementChild, contactTitle, wide ? 64 : 48);
  gap('h2 de contacto → contenido', contactTitle, contactTitle.nextElementSibling, 24);
  for (const h3 of contact.querySelectorAll('h3')) {
    gap(`h3 «${h3.textContent.trim().slice(0, 20)}» → p`, h3, h3.nextElementSibling, 16);
  }
  const emailBlock = contact.querySelector('h3').parentElement;
  gap('p de correo → lista de correos', emailBlock.querySelector('p'), emailBlock.querySelector('p').nextElementSibling, 16);
  gap('contacto → pie', contact.lastElementChild, footer, wide ? 64 : 48);
  const blocks = [...contact.querySelectorAll('h3')].map((h3) => h3.parentElement);
  return {
    gaps,
    h3LineHeights: [...document.querySelectorAll('main h3')].map((el) => ({ text: el.textContent.trim().slice(0, 20), lineHeight: lineHeight(el) })),
    rules: blocks.map((el) => {
      const style = getComputedStyle(el);
      return { top: style.borderTopColor, bottom: style.borderBottomWidth === '0px' ? null : style.borderBottomColor };
    }),
  };
};

for (const width of [390, 768, 1024, 1440]) {
  test.describe(`/ en es a ${width} px`, () => {
    test.use({ viewport: { width, height: HEIGHT[width] }, lang: 'es' });

    test('ritmo: h3 → contenido 16, bloque → h3 32, entidades → contacto y contacto → pie 48/64', async ({ page }) => {
      await open(page, '/');
      const m = await page.evaluate(measureHome);

      expect(m.gaps.length, 'distancias medidas').toBeGreaterThan(8);
      expect(m.gaps.filter((g) => !(Math.abs(g.actual - g.expected) <= 1)), 'distancias fuera de ±1 px').toEqual([]);
    });

    test('filetes del contacto en moss e interlineado de los h3 ≤ 1,25 a 768 px o más', async ({ page }) => {
      await open(page, '/');
      const m = await page.evaluate(measureHome);

      for (const rule of m.rules) {
        expect(rule.top, 'color del filete superior').toBe(MOSS);
        if (rule.bottom) expect(rule.bottom, 'color del filete inferior').toBe(MOSS);
      }
      if (width >= 768) {
        for (const h3 of m.h3LineHeights) expect(h3.lineHeight, `interlineado del h3 «${h3.text}»`).toBeLessThanOrEqual(1.25);
      }
    });
  });
}

// Escala transversal: títulos, hueco bajo el h1 y recorrido del DOM de `main` (criterios 2 y 3).
const PAGES = [...ROUTES, '/no-existe'];
const BRAND_DEEP = 'rgb(11, 122, 59)';

// Piezas que no son bloques de contenido y se exceptúan del recorrido de márgenes y huecos. Cada una lleva su
// motivo y se anota en el informe de la entrega.
const EXCEPTIONS = [
  { selector: '.sr-only', motivo: 'texto solo para lector de pantalla: el patrón visually-hidden usa margin -1px y no pinta ninguna caja' },
];

const measureScale = (exceptions) => {
  const px = (value) => (value === 'normal' ? 0 : Math.abs(parseFloat(value)) || 0);
  const lineHeight = (el) => {
    const style = getComputedStyle(el);
    return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
  };
  const main = document.querySelector('main');
  const isHome = location.pathname === '/';
  const titles = [...main.querySelectorAll('h1, h2, h3')]
    .filter((el) => el.checkVisibility())
    // Exclusiones declaradas: el h1 del hero de `/` (surface) y los títulos de tarjeta de Sobre nosotros.
    .filter((el) => !(isHome && el.tagName === 'H1'))
    .filter((el) => !el.matches('ul > li > h2'))
    .map((el) => {
      const style = getComputedStyle(el);
      return {
        tag: el.tagName,
        size: parseFloat(style.fontSize),
        weight: style.fontWeight,
        color: style.color,
        lineHeight: lineHeight(el),
        text: el.textContent.trim().slice(0, 30),
      };
    });
  const SCALE = [0, 4, 8, 12, 16, 24, 32, 48, 64];
  const offScale = [];
  for (const el of main.querySelectorAll('*')) {
    if (!el.checkVisibility()) continue;
    if (exceptions.some(({ selector }) => el.matches(selector) || el.closest(selector))) continue;
    const style = getComputedStyle(el);
    for (const prop of ['marginTop', 'marginBottom', 'rowGap', 'columnGap']) {
      const value = px(style[prop]);
      if (!SCALE.some((step) => Math.abs(step - value) <= 0.5)) {
        offScale.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} ${prop}=${style[prop]}`);
      }
    }
  }
  const h1 = main.querySelector('h1');
  const status = h1.nextElementSibling;
  let below = null;
  if (location.pathname === '/explore') below = status.nextElementSibling;
  if (location.pathname === '/gallery') below = h1.parentElement.nextElementSibling;
  return {
    titles,
    offScale,
    h1ToContent: below ? below.getBoundingClientRect().top - h1.getBoundingClientRect().bottom : null,
  };
};

for (const width of [390, 768, 1440]) {
  test.describe(`escala a ${width} px en es`, () => {
    test.use({ viewport: { width, height: HEIGHT[width] }, lang: 'es' });

    for (const route of PAGES) {
      test(`${route}: títulos con la misma escala y h1 → contenido 24`, async ({ page }) => {
        await open(page, route);
        if (route === '/explore') await expect(page.getByText(/Mostrando/)).toBeVisible();
        const m = await page.evaluate(measureScale, EXCEPTIONS);
        const wide = width >= 768;
        const SIZE = { H1: wide ? 48 : 36, H2: wide ? 36 : 24, H3: wide ? 24 : 20 };

        expect(m.titles.length, 'títulos medidos').toBeGreaterThan(0);
        for (const title of m.titles) {
          const what = `${title.tag} «${title.text}»`;
          expect(title.size, `tamaño de ${what}`).toBe(SIZE[title.tag]);
          expect(title.weight, `peso de ${what}`).toBe('700');
          expect(title.color, `color de ${what}`).toBe(BRAND_DEEP);
          expect(title.lineHeight, `interlineado de ${what}`).toBeLessThanOrEqual(1.25);
        }
        if (m.h1ToContent !== null) expect(Math.abs(m.h1ToContent - 24), `h1 → contenido: ${m.h1ToContent}`).toBeLessThanOrEqual(1);
      });

      test(`${route}: márgenes y huecos de main dentro de la escala`, async ({ page }) => {
        await open(page, route);
        if (route === '/explore') await expect(page.getByText(/Mostrando/)).toBeVisible();
        const m = await page.evaluate(measureScale, EXCEPTIONS);

        expect(m.offScale, 'márgenes y huecos fuera de la escala').toEqual([]);
      });
    }
  });
}

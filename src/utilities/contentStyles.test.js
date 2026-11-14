import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import * as styles from './contentStyles';

const VALORES = {
  PAGE_PADDING: 'pt-stack-xl md:pt-section pb-section md:pb-section-lg',
  PAGE: 'page-container pt-stack-xl md:pt-section pb-section md:pb-section-lg',
  H1: 'text-4xl md:text-5xl font-bold leading-tight text-brand-deep',
  H1_TOOL: 'text-3xl font-bold leading-tight text-brand-deep',
  H2: 'text-2xl md:text-4xl font-bold leading-tight text-brand-deep',
  H3: 'text-xl md:text-2xl font-bold leading-tight md:leading-tight text-brand-deep',
  SURFACE_TITLE: 'text-2xl font-bold leading-tight text-brand-deep',
  PROSE: 'max-w-prose text-base md:text-lg text-ink-soft',
  BULLETS: 'list-disc space-y-stack-sm pl-stack-lg',
  RULED: 'divide-y divide-moss',
  RULED_SECTION: 'py-stack-lg md:py-stack-xl first:pt-0 last:pb-0',
  CARD: 'rounded-lg border border-sage bg-sage-soft p-stack-lg',
  CARD_TITLE: 'text-2xl font-bold leading-tight text-forest',
  CARD_TEXT: 'mt-stack max-w-prose text-base text-ink-soft',
};

// Escala de 4, 8, 12, 16, 24, 32, 48 y 64 px, más el cero.
const SCALE = new Set(['0', 'stack-xs', 'stack-sm', 'stack-md', 'stack', 'stack-lg', 'stack-xl', 'section', 'section-lg']);
const SPACING = /^(?:[\w-]+:)*-?(?:m|p|gap|space-[xy])[trblxy]?(?:-[xy])?-(.+)$/;

// Valor de espaciado de cada clase de espaciado de una cadena; las demás no cuentan.
const spacingValues = (classes) =>
  classes.split(/\s+/).map((name) => SPACING.exec(name)?.[1]).filter(Boolean);

describe('contentStyles', () => {
  it('exporta exactamente las constantes del sistema, con sus valores', () => {
    expect({ ...styles }).toEqual(VALORES);
  });

  it.each(Object.entries(VALORES))('%s solo usa espaciados de la escala', (nombre, clases) => {
    expect(spacingValues(clases).filter((valor) => !SCALE.has(valor)), nombre).toEqual([]);
  });

  it('la comprobación de la escala detecta espaciados fuera de ella (clases por concatenación)', () => {
    const fuera = [['mt', 5].join('-'), ['md', ['py', 10].join('-')].join(':'), 'gap-' + '[7px]', ['space', 'y', 5].join('-')];

    expect(spacingValues(fuera.join(' '))).toEqual(['5', '10', '[7px]', '5']);
    expect(spacingValues(`mt-stack-lg md:py-section ${['p', 'px'].join('-')} first:pt-0`).filter((valor) => !SCALE.has(valor))).toEqual(['px']);
  });

  it('todo título con md:text-xl o md:text-2xl lleva md:leading-tight (el interlineado de md:text-* lo pisaría)', () => {
    const titulos = Object.entries(styles).filter(([, clases]) => /(^|\s)md:text-(xl|2xl)(\s|$)/.test(clases));

    expect(titulos.map(([nombre]) => nombre)).toEqual(['H3']);
    for (const [, clases] of titulos) expect(clases.split(' ')).toContain('md:leading-tight');
  });

  it('los títulos de contenido son bold, leading-tight y de un color de marca', () => {
    for (const nombre of ['H1', 'H1_TOOL', 'H2', 'H3', 'SURFACE_TITLE', 'CARD_TITLE']) {
      expect(styles[nombre].split(' '), nombre).toEqual(expect.arrayContaining(['font-bold', 'leading-tight']));
      expect(styles[nombre], nombre).toMatch(/text-(brand-deep|forest)$/);
    }
  });

  it('ninguna clase usa hex sueltos, valores arbitrarios de espaciado ni colores por defecto de Tailwind', () => {
    const todas = Object.values(styles).join(' ');

    expect(todas).not.toMatch(/\[#|text-\[|-\[|(gray|blue|red|green|yellow)-\d/);
  });
});

// Prueba de escala sobre el código fuente: lista explícita, sin glob (Login.js queda fuera de la spec).
// Toda clase que no exista en el código se construye por concatenación para que Tailwind no la genere.
describe('escala de espaciado y tipografía en el código fuente', () => {
  const ALLOWED = new Set(['0', '1', '2', '3', '4', '6', '8', '12', '16']);
  const SPACING = /(?<![\w-])(?:[\w-]+:)*-?(?:m|p|gap|space-[xy])[trblxy]?(?:-[xy])?-(\d+(?:\.\d+)?|px|\[[^\]]*\])(?![\w.])/g;
  const FORBIDDEN = [/text-\[\d/, /\[#/];
  const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  // Infracciones: cada espaciado fuera de la escala o arbitrario, más cada patrón prohibido.
  const violations = (src) => {
    const code = stripComments(src);
    const spacing = [...code.matchAll(SPACING)]
      .filter((match) => match[1].startsWith('[') || !ALLOWED.has(match[1]))
      .map((match) => match[0]);
    const forbidden = FORBIDDEN.flatMap((pattern) => code.match(new RegExp(pattern, 'g')) ?? []);
    return [...spacing, ...forbidden];
  };

  const PAGES = ['Home', 'Explore', 'VegetationGallery', 'About', 'Cookies', 'NotFound', 'DataManagement', 'FilesUpload', 'TermsManagement', 'GalleryManagement', 'RecipientsManagement']
    .map((name) => `../pages/${name}.js`);
  const COMPONENTS = ['TermsManager', 'ImageGalleryManager', 'ContactRecipientsManager', 'DialogAdvice', 'DialogSpecies', 'SpeciesAttribute', 'EmptyState', 'EmailContactGrid', 'ContactForm', 'SpeciesCard', 'TextInput', 'Table', 'ProtectedRoute', 'ButtonPrincipal', 'ButtonAlternative', 'FilterSearchBar']
    .map((name) => `../components/${name}.js`);

  // Fuera de la lista, a propósito: Sidebar.js (excepción documentada B78: text-[11px] y min-[360px]).
  // VegetationGallery solo existe como página (ya está en PAGES); no hay componente con ese nombre.

  // Excepciones de espaciado fuera de la escala que cambiarían el diseño: decisión de diseño pendiente.
  // Se declaran por archivo, con motivo; cualquier otra infracción sigue fallando.
  const EXCEPTIONS = {
    '../components/ButtonPrincipal.js': { allowed: ['px-5'], reason: 'relleno horizontal de 20 px de los botones (fuera de la escala de 4/8/12/16/24/32/48/64)' },
    '../components/ButtonAlternative.js': { allowed: ['px-5'], reason: 'relleno horizontal de 20 px de los botones (fuera de la escala)' },
    '../components/FilterSearchBar.js': { allowed: ['pl-10'], reason: 'sangría de 40 px a la izquierda del campo, que deja sitio al icono de búsqueda (fuera de la escala)' },
  };

  it('la regla detecta espaciados fuera de la escala y tamaños arbitrarios (clases por concatenación)', () => {
    const fuera = [
      ['mt', 5].join('-'),
      ['sm', ['px', 5].join('-')].join(':'),
      ['-mt', 5].join('-'),
      ['py', '2.5'].join('-'),
      ['gap', '0.5'].join('-'),
      ['p', 'px'].join('-'),
      'mx-' + '[3px]',
      'text-' + '[13px]',
    ];

    for (const clase of fuera) expect(violations(`<div className="${clase}" />`), clase).toHaveLength(1);
  });

  it('la regla no marca lo que no es espaciado de la escala', () => {
    const dentro = [
      ['line-clamp', 3].join('-'),
      ['top', 5].join('-'),
      'min-h-' + '[calc(100svh-4rem)]',
      'aspect-' + '[12/5]',
      'max-h-' + '[300px]',
      'min-h-' + '[72px]',
      'tracking-' + '[-0.015em]',
      'mt-stack-lg',
      'mx-auto',
      ['mt', 4].join('-'),
      ['md', ['gap', 12].join('-')].join(':'),
    ];

    for (const clase of dentro) expect(violations(`<div className="${clase}" />`), clase).toEqual([]);
    expect(violations(`{/* ${['my', 5].join('-')} text-${'[#15B659]'} */}`)).toEqual([]);
    expect(violations(`// ${['my', 5].join('-')}\nconst a = 1;`)).toEqual([]);
  });

  it.each([...PAGES, ...COMPONENTS])('%s no usa espaciados fuera de la escala, tamaños de texto arbitrarios ni hexadecimales', (file) => {
    const src = readFileSync(path.resolve(__dirname, file), 'utf8');

    const { allowed = [] } = EXCEPTIONS[file] ?? {};

    expect(violations(src).filter((found) => !allowed.includes(found))).toEqual([]);
  });

  it.each(Object.entries(EXCEPTIONS))('la excepción de %s sigue haciendo falta (y tiene motivo)', (file, { allowed, reason }) => {
    const src = readFileSync(path.resolve(__dirname, file), 'utf8');

    expect(reason).toBeTruthy();
    expect(violations(src).sort()).toEqual([...allowed].sort());
  });
});

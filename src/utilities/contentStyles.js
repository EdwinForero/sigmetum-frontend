// Sistema de contenido: un rol, una constante. Las páginas componen estas clases en lugar de repetir valores.
// Escala de espaciado: 4, 8, 12, 16, 24, 32, 48 y 64 px (tokens stack-xs a section-lg de tailwind.config.js).
export const PAGE_PADDING = 'pt-stack-xl md:pt-section pb-section md:pb-section-lg';
export const PAGE = `page-container ${PAGE_PADDING}`;

// Títulos: el h3 lleva `md:leading-tight` porque `md:text-2xl` trae su propio interlineado (1,33) y lo pisaría.
export const H1 = 'text-4xl md:text-5xl font-bold leading-tight text-brand-deep';
export const H1_TOOL = 'text-3xl font-bold leading-tight text-brand-deep';
export const H2 = 'text-2xl md:text-4xl font-bold leading-tight text-brand-deep';
export const H3 = 'text-xl md:text-2xl font-bold leading-tight md:leading-tight text-brand-deep';
export const SURFACE_TITLE = 'text-2xl font-bold leading-tight text-brand-deep';

// Texto corrido con medida de lectura y listas.
export const PROSE = 'max-w-prose text-base md:text-lg text-ink-soft';
export const BULLETS = 'list-disc space-y-stack-sm pl-stack-lg';
export const RULED = 'divide-y divide-moss';
export const RULED_SECTION = 'py-stack-lg md:py-stack-xl first:pt-0 last:pb-0';

// Tarjetas de contenido.
export const CARD = 'rounded-lg border border-sage bg-sage-soft p-stack-lg';
export const CARD_TITLE = 'text-2xl font-bold leading-tight text-forest';
export const CARD_TEXT = 'mt-stack max-w-prose text-base text-ink-soft';

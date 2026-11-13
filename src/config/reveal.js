// Valores únicos de la animación de aparición (A1). Módulo puro: lo importa tailwind.config.js desde Node,
// así que no lleva JSX ni import.meta.env. La distancia (12 px) es el token `stack-md` de .reveal-hidden.
export const REVEAL = {
  durationMs: 450,
  distancePx: 12,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  staggerMs: 60,
  maxStaggered: 6,
  // Con 0 se revela en cuanto asoma 1 px: un bloque más alto que la pantalla nunca llega a un 15 %.
  threshold: 0,
  rootMargin: '0px 0px -10% 0px',
};

// Escalonado entre hermanos: el sexto y los siguientes comparten el mismo retraso (5 × 60 ms).
export const staggerDelay = (index) =>
  Math.min(Math.max(index, 0), REVEAL.maxStaggered - 1) * REVEAL.staggerMs;

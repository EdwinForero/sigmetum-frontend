// Rejilla de la galería: celdas de 200 px como máximo por construcción.
// Con n columnas y huecos de GALLERY_GAP, la celda mide (W - (n - 1) * gap) / n <= 200
// cuando n >= (W + gap) / (200 + gap).
export const GALLERY_MAX_CELL = 200;
export const GALLERY_GAP = 12;

export const galleryColumns = (width) => {
  const columns = Math.ceil((width + GALLERY_GAP) / (GALLERY_MAX_CELL + GALLERY_GAP));
  return Number.isFinite(columns) ? Math.max(1, columns) : 1;
};

// Bloques contiguos equilibrados: las primeras N % n columnas reciben ⌈N/n⌉ elementos y el resto ⌊N/n⌋.
// El orden del DOM es el de los datos; `start` es el índice del primer elemento de cada columna.
// Las columnas vacías se omiten. No muta la lista.
export const splitInColumns = (items, columns) => {
  const base = Math.floor(items.length / columns);
  const extra = items.length % columns;
  const result = [];
  let start = 0;
  for (let c = 0; c < columns; c += 1) {
    const size = base + (c < extra ? 1 : 0);
    if (size > 0) result.push({ start, items: items.slice(start, start + size) });
    start += size;
  }
  return result;
};

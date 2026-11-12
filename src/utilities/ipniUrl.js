// Enlace a IPNI (International Plant Names Index) para un nombre de especie.
// IPNI_VARIANT es la variante de consulta; se fijó con la medición de scripts/ipni-check.mjs.
// Si IPNI cambia la URL de búsqueda, se cambia solo aquí.
export const IPNI_SEARCH_URL = 'https://www.ipni.org/search?q=';

const GENUS_EPITHET = /^([A-Z][A-Za-z-]*\.?)\s+([a-z][a-z-]+)/;
const INFRASPECIFIC = /\s(subsp\.|var\.|f\.)\s+([a-z][a-z-]+)/;

// variant: 'asIs' (nombre recortado) | 'noAuthor' (género, epíteto y primer subsp./var./f.) | 'binomial' (género y epíteto).
export const ipniQuery = (name, variant) => {
  const trimmed = name.trim();
  if (variant === 'asIs') return trimmed;
  const base = GENUS_EPITHET.exec(trimmed);
  if (!base) return trimmed;
  const binomial = `${base[1]} ${base[2]}`;
  if (variant === 'binomial') return binomial;
  const infra = INFRASPECIFIC.exec(trimmed.slice(base[0].length));
  return infra ? `${binomial} ${infra[1]} ${infra[2]}` : binomial;
};

// Variante medida el 12/11/2026 con la API de IPNI (20 nombres de ejemplo): `asIs` no acierta si el nombre lleva autor.
export const IPNI_VARIANT = 'noAuthor';

export const ipniUrl = (name) => {
  if (typeof name !== 'string' || name.trim() === '') return null;
  return IPNI_SEARCH_URL + encodeURIComponent(ipniQuery(name, IPNI_VARIANT));
};

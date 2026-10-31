// Lógica pura del favicon. La usa el plugin de vite.config.js (Node, sin import.meta.env),
// por eso no importa nada de src/config.

// Extrae la clave de ASSETS.LOGO leyendo assets.js como texto. El flag m es necesario:
// LOGO no está al inicio del texto. LOGOS: no coincide (la S va antes de los dos puntos).
export const logoKeyFromSource = (fuente) => {
  const match = /^\s*LOGO:\s*(['"])(.+?)\1/m.exec(fuente);
  if (!match) throw new Error('No se encontró LOGO en src/config/assets.js');
  return match[2];
};

// El favicon exige https:// (seguridad.md prohíbe enlaces externos http://); sin s3Url o con otro
// esquema no hay etiqueta: sin favicon, sin href roto.
export const isHttpsUrl = (s3Url) => typeof s3Url === 'string' && s3Url.startsWith('https://');

export const faviconTags = (s3Url, logoKey) =>
  isHttpsUrl(s3Url)
    ? [{ tag: 'link', attrs: { rel: 'icon', href: `${s3Url}/${logoKey}` }, injectTo: 'head' }]
    : [];

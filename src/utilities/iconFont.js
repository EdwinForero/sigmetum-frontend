// Marca <html> según el estado de la fuente de iconos (Material Symbols, de Google Fonts):
// - icons-ready: la fuente cargó (o el navegador no expone document.fonts): se ven los iconos.
// - icons-failed: no cargó (o tardó más de FONT_TIMEOUT_MS): index.css pinta una caja en lugar del texto de la ligadura.
// Si la fuente llega después del límite, icons-ready se impone y retira icons-failed (nunca conviven).
// Se pide con 'close' como texto: load() sin texto prueba " " y la fuente por subconjunto podría no incluirlo.
export const FONT_TIMEOUT_MS = 4000;

export const watchIconFont = async (doc = document) => {
  const html = doc.documentElement;
  if (!doc.fonts) {
    html.classList.add('icons-ready');
    return;
  }

  const marcar = (estado) => {
    if (estado === 'ready') {
      html.classList.remove('icons-failed');
      html.classList.add('icons-ready');
    } else if (!html.classList.contains('icons-ready')) {
      html.classList.add('icons-failed');
    }
  };

  const carga = doc.fonts.load('24px "Material Symbols Outlined"', 'close').then(
    (caras) => (caras.length > 0 ? 'ready' : 'failed'),
    () => 'failed'
  );
  let temporizador;
  const limite = new Promise((resolve) => {
    temporizador = setTimeout(() => resolve('failed'), FONT_TIMEOUT_MS);
  });

  marcar(await Promise.race([carga, limite]));
  clearTimeout(temporizador);
  // Si ganó el límite, una carga tardía con éxito sigue pudiendo imponer icons-ready.
  carga.then((estado) => {
    if (estado === 'ready') marcar('ready');
  });
};

import { describe, it, expect } from 'vitest';
import es from './es/translation.json';
import en from './en/translation.json';

const flatten = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) =>
    value !== null && typeof value === 'object'
      ? flatten(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value]]
  );

const placeholders = (text) => (String(text).match(/{{\s*\w+\s*}}/g) || []).sort();

const spanish = Object.fromEntries(flatten(es));
const english = Object.fromEntries(flatten(en));

describe('traducciones', () => {
  it('el inglés y el español tienen exactamente las mismas claves', () => {
    const missingInEnglish = Object.keys(spanish).filter((key) => !(key in english));
    const missingInSpanish = Object.keys(english).filter((key) => !(key in spanish));

    expect({ missingInEnglish, missingInSpanish }).toEqual({ missingInEnglish: [], missingInSpanish: [] });
  });

  it('cada clave usa los mismos marcadores de interpolación en ambos idiomas', () => {
    const mismatched = Object.keys(spanish)
      .filter((key) => key in english)
      .filter((key) => placeholders(spanish[key]).join() !== placeholders(english[key]).join());

    expect(mismatched).toEqual([]);
  });

  it('incluye las claves de los errores 503, 429, 400 y 404 del backend', () => {
    const keys = [
      'login.serviceUnavailable',
      'dialogAdvice.errorEmailRateLimit',
      'dialogAdvice.errorEmailInvalid',
      'dialogAdvice.errorDraftNotFound',
      'dialogAdvice.adviceInvalidImageTitle',
    ];

    expect(keys.filter((key) => !(key in spanish) || !(key in english))).toEqual([]);
  });

  it('incluye las claves de los errores y retos del login con formulario propio', () => {
    const keys = [
      'login.credentialsError',
      'login.sessionExpired',
      'login.codeSessionLost',
      'login.codeError',
      'login.passwordRejected',
      'login.serviceUnavailable',
      'login.mfaSetupAgain',
    ];

    expect(keys.filter((key) => !(key in spanish) || !(key in english))).toEqual([]);
  });

  it('el paso del MFA tiene el texto del QR y ya no tiene la dirección otpauth', () => {
    expect({
      es: [spanish['login.qrLabel'], spanish['login.mfaSetupHelp'], 'login.otpUriLabel' in spanish],
      en: [english['login.qrLabel'], english['login.mfaSetupHelp'], 'login.otpUriLabel' in english],
    }).toEqual({
      es: [
        'Código QR para añadir la clave a tu aplicación de autenticación',
        'Escanea el código QR con tu aplicación de autenticación o añade la clave a mano, y escribe el código de seis dígitos que muestre.',
        false,
      ],
      en: [
        'QR code to add the key to your authenticator app',
        'Scan the QR code with your authenticator app or add the key manually, and enter the six-digit code it shows.',
        false,
      ],
    });
  });

  it('incluye los nombres accesibles de los botones de mostrar contraseña', () => {
    const keys = ['login.showPassword', 'login.showNewPassword', 'login.showConfirmPassword'];

    expect({ es: keys.map((key) => spanish[key]), en: keys.map((key) => english[key]) }).toEqual({
      es: ['Mostrar contraseña', 'Mostrar contraseña nueva', 'Mostrar la contraseña repetida'],
      en: ['Show password', 'Show new password', 'Show password confirmation'],
    });
  });

  it('el aviso de copia fallida avisa de que los espacios no cuentan', () => {
    expect({ es: spanish['login.copyFailed'], en: english['login.copyFailed'] }).toEqual({
      es: 'No se pudo copiar. Selecciona la clave y cópiala a mano; los espacios no forman parte de la clave.',
      en: 'Could not copy. Select the key and copy it manually; the spaces are not part of the key.',
    });
  });

  it('el login ya no tiene las claves del Hosted UI', () => {
    expect(Object.keys(spanish).concat(Object.keys(english)).filter((key) => /^login\.callback/.test(key))).toEqual([]);
  });

  it('incluye los textos de la galería vacía y del título del 404', () => {
    expect({
      es: [spanish['gallery.noDataFoundPlaceholder'], spanish['notFound.title']],
      en: [english['gallery.noDataFoundPlaceholder'], english['notFound.title']],
    }).toEqual({
      es: ['No hay datos disponibles.', 'Página no encontrada'],
      en: ['No data available.', 'Page not found'],
    });
  });

  it('no conserva claves huérfanas de iconButton ni de los títulos de diálogo de éxito y error', () => {
    for (const dictionary of [spanish, english]) {
      expect(dictionary).not.toHaveProperty(['iconButton.add']);
      expect(dictionary).not.toHaveProperty(['iconButton.delete']);
      expect(dictionary).not.toHaveProperty(['dialogAdvice.successTitle']);
      expect(dictionary).not.toHaveProperty(['dialogAdvice.errorTitle']);
    }
  });

  it('incluye los nombres accesibles de los botones de icono', () => {
    const pick = (dictionary) =>
      Object.fromEntries(
        Object.entries(dictionary)
          .filter(([key]) => key.startsWith('iconButton.'))
          .map(([key, value]) => [key.replace('iconButton.', ''), value])
      );

    expect({ es: pick(spanish), en: pick(english) }).toEqual({
      es: {
        menu: 'Menú',
        close: 'Cerrar',
        previousPage: 'Página anterior',
        nextPage: 'Página siguiente',
        info: 'Información',
        scrollDown: 'Bajar',
      },
      en: {
        menu: 'Menu',
        close: 'Close',
        previousPage: 'Previous page',
        nextPage: 'Next page',
        info: 'Information',
        scrollDown: 'Scroll down',
      },
    });
  });

  it('incluye los textos exactos de la barra privada, la navegación principal y el enlace de salto', () => {
    const keys = ['skipLink', 'navbar.label', 'privateNav.label', 'privateNav.data', 'privateNav.content', 'privateNav.upload', 'privateNav.filters'];

    expect({ es: keys.map((key) => spanish[key]), en: keys.map((key) => english[key]) }).toEqual({
      es: ['Saltar al contenido', 'Principal', 'Gestión', 'Datos', 'Contenido', 'Cargar', 'Filtros'],
      en: ['Skip to content', 'Main', 'Management', 'Data', 'Content', 'Upload', 'Filters'],
    });
  });

  it('el botón de subir archivos tiene singular y plural y se retiraron las claves sustituidas', () => {
    expect({
      es: [spanish['uploadFiles.fileUploadForm.uploadFilesButton_one'], spanish['uploadFiles.fileUploadForm.uploadFilesButton_other']],
      en: [english['uploadFiles.fileUploadForm.uploadFilesButton_one'], english['uploadFiles.fileUploadForm.uploadFilesButton_other']],
    }).toEqual({
      es: ['Subir {{count}} archivo', 'Subir {{count}} archivos'],
      en: ['Upload {{count}} file', 'Upload {{count}} files'],
    });
    const retiradas = ['uploadFiles.fileUploadForm.uploadFilesButton', 'dialogAdvice.adviceNoImageData'];
    expect(retiradas.filter((key) => key in spanish || key in english)).toEqual([]);
  });

  it('ninguna traducción está vacía', () => {
    const empty = [...flatten(es), ...flatten(en)].filter(([, value]) => String(value).trim() === '');

    expect(empty).toEqual([]);
  });
});

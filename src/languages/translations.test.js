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
        infoAbout: 'Información: {{topic}}',
        scrollDown: 'Bajar',
        previousPhoto: 'Foto anterior',
        nextPhoto: 'Foto siguiente',
      },
      en: {
        menu: 'Menu',
        close: 'Close',
        previousPage: 'Previous page',
        nextPage: 'Next page',
        info: 'Information',
        infoAbout: 'Information: {{topic}}',
        scrollDown: 'Scroll down',
        previousPhoto: 'Previous photo',
        nextPhoto: 'Next photo',
      },
    });
  });

  it('incluye los textos exactos de la barra privada, la navegación principal y el enlace de salto', () => {
    const keys = ['skipLink', 'navbar.label', 'privateNav.label', 'privateNav.data', 'privateNav.terms', 'privateNav.gallery', 'privateNav.recipients', 'privateNav.upload', 'privateNav.filters'];

    expect({ es: keys.map((key) => spanish[key]), en: keys.map((key) => english[key]) }).toEqual({
      es: ['Saltar al contenido', 'Principal', 'Gestión', 'Datos', 'Términos', 'Galería', 'Correos', 'Cargar', 'Filtros'],
      en: ['Skip to content', 'Main', 'Management', 'Data', 'Terms', 'Gallery', 'Emails', 'Upload', 'Filters'],
    });
  });

  it('se retiraron las claves huérfanas de la barra y de la página Administrar contenido', () => {
    const orphans = ['privateNav.content', 'contentManagement.title', 'contentManagement.description'];

    expect({
      es: orphans.filter((key) => key in spanish),
      en: orphans.filter((key) => key in english),
    }).toEqual({ es: [], en: [] });
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

  it('incluye las claves de las instituciones, el aviso de pestaña nueva y los enlaces de cookies', () => {
    const keys = [
      'institutions.uma', 'institutions.ual', 'institutions.ugr', 'institutions.uhu', 'institutions.uja',
      'institutions.efyve', 'institutions.geospace', 'institutions.mafo',
      'a11y.opensInNewTab',
      'home.exploreButton', 'home.galleryButton',
      'cookies.moreInfoTitle', 'cookies.linkIco', 'cookies.linkAboutCookies',
    ];

    expect(keys.filter((key) => !(key in spanish) || !(key in english))).toEqual([]);
    expect('home.searchButton' in spanish || 'home.searchButton' in english).toBe(false);
  });

  it('el título del hero no va en mayúsculas ni los textos de cookies llevan viñetas ni enlaces incrustados', () => {
    for (const idioma of [spanish, english]) {
      expect(idioma['home.title']).not.toBe(idioma['home.title'].toUpperCase());
      for (const key of ['cookies.descriptionAboutPixel', 'cookies.descriptionCookiesManagement']) {
        expect(idioma[key]).not.toMatch(/<a>/);
      }
      for (const key of Object.keys(idioma).filter((k) => k.startsWith('cookies.browser'))) {
        expect(idioma[key]).not.toMatch(/<a>|•/);
      }
    }
  });

  it('incluye el error de correo duplicado del panel de destinatarios, con paridad en es y en', () => {
    expect({ es: spanish['contactRecipients.errors.duplicate'], en: english['contactRecipients.errors.duplicate'] }).toEqual({
      es: 'Ese correo ya está en la lista.',
      en: 'That e-mail is already on the list.',
    });
  });

  it('incluye todas las claves del panel de destinatarios, con el texto de error de carga acordado', () => {
    const keys = [
      'title', 'tooltip', 'label', 'add', 'counter', 'empty', 'errorLoad', 'maxReached', 'lastRecipient',
      'removeRecipient', 'confirmDelete', 'successAdded', 'successRemoved', 'errorAdd', 'errorRemove',
      'loading', 'loadingHint', 'listLabel', 'errors.duplicate',
    ].map((key) => `contactRecipients.${key}`);

    expect(keys.filter((key) => !(key in spanish) || !(key in english))).toEqual([]);
    expect(spanish['contactRecipients.errorLoad']).toBe(
      'No se pudo cargar la lista de destinatarios. Vuelve a intentarlo; si el fallo sigue, avisa al responsable técnico: puede faltar el fichero de destinatarios en el almacenamiento.'
    );
    expect(english['contactRecipients.errorLoad']).toBe(
      'The recipient list could not be loaded. Try again; if it keeps failing, tell the technical contact: the recipient file may be missing from storage.'
    );
    expect(spanish['contactRecipients.counter']).toContain('{{count}}');
    expect(spanish['contactRecipients.counter']).toContain('{{max}}');
    expect(spanish['contactRecipients.removeRecipient']).toContain('{{name}}');
    expect(spanish['contactRecipients.maxReached']).toContain('{{max}}');
  });

  it('el tooltip del panel de destinatarios trata de tú, como el resto de textos nuevos', () => {
    expect(spanish['contactRecipients.tooltip']).toContain('puedes registrar');
    expect(spanish['contactRecipients.tooltip']).not.toMatch(/ puede /);
    expect(spanish['contactRecipients.tooltip']).toContain('{{max}}');
  });

  it('ninguna traducción está vacía', () => {
    const empty = [...flatten(es), ...flatten(en)].filter(([, value]) => String(value).trim() === '');

    expect(empty).toEqual([]);
  });

  it('incluye los textos de los estados de Explorar y de la galería con visor', () => {
    const keys = [
      'explore.empty.errorTitle',
      'explore.empty.errorCause',
      'explore.empty.noDataTitle',
      'explore.empty.noDataCause',
      'explore.empty.noResultsTitle',
      'explore.empty.noResultsCause',
      'explore.empty.clearFilters',
      'gallery.loading',
      'gallery.openPhoto',
      'gallery.errorTitle',
      'gallery.errorCause',
      'gallery.emptyTitle',
      'gallery.viewer.counter',
    ];

    expect({ es: keys.filter((key) => !spanish[key]), en: keys.filter((key) => !english[key]) }).toEqual({ es: [], en: [] });
    expect({ es: spanish['gallery.viewer.counter'], en: english['gallery.viewer.counter'] }).toEqual({
      es: '{{current}} de {{total}}',
      en: '{{current}} of {{total}}',
    });
    expect({ es: placeholders(spanish['gallery.openPhoto']), en: placeholders(english['gallery.openPhoto']) }).toEqual({
      es: ['{{name}}'],
      en: ['{{name}}'],
    });
  });

  it('Explorar ya no conserva las claves sustituidas por los estados con título', () => {
    for (const dictionary of [spanish, english]) {
      expect(dictionary).not.toHaveProperty(['explore.noDataFoundPlaceholder']);
      expect(dictionary).not.toHaveProperty(['explore.errorLoadPlaceholder']);
    }
  });

  describe('textos de la política de cookies', () => {
    const cookiesOf = (dictionary) =>
      Object.fromEntries(Object.entries(dictionary).filter(([key]) => key.startsWith('cookies.')));
    const NEW_KEYS = [
      'typeFirstParty', 'typeThirdParty', 'usesIntro', 'useNavigation', 'useSettings', 'useAnalytics', 'useTraffic',
      'useAdvertising', 'usesClosing', 'descriptionAboutCookiesNote', 'descriptionAboutPixelMoreInfo',
      'descriptionCookiesManagementBrowser',
    ].map((key) => `cookies.${key}`);
    const REMOVED_KEYS = ['cookies.descriptionTypeCookies', 'cookies.descriptionCookiesUse'];
    const CATEGORY_TITLES = ['First', 'Second', 'Third', 'Fourth'].map((name) => `cookies.subtitle${name}CookiesCategory`);

    it('las claves nuevas existen en es y en y las retiradas ya no', () => {
      expect({
        es: NEW_KEYS.filter((key) => !(key in spanish)),
        en: NEW_KEYS.filter((key) => !(key in english)),
      }).toEqual({ es: [], en: [] });
      expect({
        es: REMOVED_KEYS.filter((key) => key in spanish),
        en: REMOVED_KEYS.filter((key) => key in english),
      }).toEqual({ es: [], en: [] });
    });

    it('ninguna clave cookies.* lleva viñetas, saltos de línea ni dos espacios seguidos, y solo el banner lleva <a>', () => {
      for (const [name, dictionary] of [['es', spanish], ['en', english]]) {
        const entries = Object.entries(cookiesOf(dictionary));
        expect(entries.length, name).toBeGreaterThan(30);
        expect(entries.filter(([, value]) => /•|\n/.test(value)).map(([key]) => key), `${name}: viñetas o saltos`).toEqual([]);
        expect(entries.filter(([, value]) => / {2}/.test(value)).map(([key]) => key), `${name}: dos espacios`).toEqual([]);
        expect(entries.filter(([, value]) => /<a[ >]/.test(value)).map(([key]) => key), `${name}: enlaces`).toEqual(['cookies.banner.description']);
      }
    });

    it('los títulos de categoría no llevan numeración escrita', () => {
      for (const dictionary of [spanish, english]) {
        for (const key of CATEGORY_TITLES) expect(dictionary[key]).not.toMatch(/^\s*\d+\s*[.)]/);
      }
    });

    it('es y en tienen el mismo número de <strong> en cada clave de cookies', () => {
      const strong = (text) => (String(text).match(/<strong>/g) || []).length;
      const mismatched = Object.keys(cookiesOf(spanish)).filter((key) => strong(spanish[key]) !== strong(english[key]));

      expect(mismatched).toEqual([]);
      expect(['cookies.typeFirstParty', 'cookies.typeThirdParty'].map((key) => strong(spanish[key]))).toEqual([1, 1]);
    });

    it('los textos de las claves nuevas y los títulos de categoría son los acordados (el texto legal se copia literal)', () => {
      const pick = (dictionary) =>
        Object.fromEntries(
          ['descriptionAboutCookies', 'descriptionAboutCookiesNote', 'descriptionAboutPixel', 'descriptionAboutPixelMoreInfo', 'typeFirstParty', 'typeThirdParty', 'usesIntro', 'useNavigation', 'useSettings', 'useAnalytics', 'useTraffic', 'useAdvertising', 'usesClosing', 'descriptionCookiesManagement', 'descriptionCookiesManagementBrowser', 'subtitleFirstCookiesCategory', 'subtitleSecondCookiesCategory', 'subtitleThirdCookiesCategory', 'subtitleFourthCookiesCategory'].map((key) => [key, dictionary[`cookies.${key}`]])
        );

      expect(pick(spanish)).toEqual({
        descriptionAboutCookies: 'Una cookie es un archivo de texto simple que un sitio web almacena en tu dispositivo para recordar información, como tus preferencias o datos de navegación. Cada cookie es única para tu navegador e incluye datos como un identificador anónimo y el nombre del sitio. Las cookies mejoran la experiencia de navegación al recordar tus preferencias o permitir funcionalidades como un carrito de compras.',
        descriptionAboutCookiesNote: 'Si bien nuestro sitio funciona sin cookies, desactivarlas podría limitar ciertas características y funcionalidades.',
        descriptionAboutPixel: 'Un píxel es un fragmento de código que permite que se descarguen cookies en tu dispositivo. A menudo son usados por terceros para mostrar publicidad personalizada basada en tu actividad de navegación.',
        descriptionAboutPixelMoreInfo: 'Para más información sobre cookies y píxeles, consulta el sitio web de la Information Commissioner’s Office (ICO) en la sección «Más información», al final de esta página.',
        typeFirstParty: '<strong>First party</strong>: Estas cookies son configuradas directamente por nuestro sitio para funcionalidades básicas o mejorar tu experiencia.',
        typeThirdParty: '<strong>Third party</strong>: Configuradas por socios externos (como anunciantes y redes sociales), estas cookies recopilan datos que luego son enviados a dichos terceros.',
        usesIntro: 'En nuestro sitio usamos cookies para:',
        useNavigation: 'Facilitar la navegación y permitir funciones esenciales, como la gestión de preferencias.',
        useSettings: 'Recordar configuraciones personales, como idioma o región.',
        useAnalytics: 'Analizar cómo usas el sitio para mejorar su diseño y funcionalidad.',
        useTraffic: 'Monitorear el tráfico del sitio y la actividad de los usuarios.',
        useAdvertising: 'Mostrarte publicidad relevante basada en tus intereses.',
        usesClosing: 'No vendemos los datos recopilados por las cookies de first party, pero algunos terceros pueden acceder a la información de sus cookies.',
        descriptionCookiesManagement: 'Puede actualizar sus preferencias sobre las cookies de nuestro sitio web a través de su perfil. Tenga en cuenta que nuestros sitios web funcionarán sin cookies, pero perderá algunas características y funcionalidades si decide desactivarlas.',
        descriptionCookiesManagementBrowser: 'Si desea restringir o bloquear las cookies del navegador web que se instalan en su dispositivo, puede hacerlo a través de la configuración de su navegador. A continuación, le indicamos cómo hacerlo para los navegadores más populares, pero si el suyo no aparece en la lista, podrá encontrar información al respecto en la sección de Ayuda de su navegador o en aboutcookies.org:',
        subtitleFirstCookiesCategory: 'Estrictamente Necesarias',
        subtitleSecondCookiesCategory: 'Funcionales',
        subtitleThirdCookiesCategory: 'De Rendimiento',
        subtitleFourthCookiesCategory: 'De Publicidad Dirigida',
      });
      expect(pick(english)).toEqual({
        descriptionAboutCookies: 'A cookie is a simple text file that a website stores on your device to remember information such as your preferences or browsing data. Each cookie is unique to your browser and includes data like an anonymous identifier and the website’s name. Cookies enhance your browsing experience by remembering your preferences or enabling functionalities such as a shopping cart.',
        descriptionAboutCookiesNote: 'While our website can function without cookies, disabling them may limit certain features and functionalities.',
        descriptionAboutPixel: 'A pixel is a small piece of code that enables cookies to be downloaded onto your device. Pixels are often used by third parties to deliver personalized ads based on your browsing activity.',
        descriptionAboutPixelMoreInfo: 'For more information about cookies and pixels, visit the website of the Information Commissioner’s Office (ICO) in the “More information” section at the end of this page.',
        typeFirstParty: '<strong>First-party cookies</strong>: Set directly by our website to enable basic functionality or improve your experience.',
        typeThirdParty: '<strong>Third-party cookies</strong>: Set by external partners (e.g., advertisers or social media platforms) to collect data that is sent to these third parties.',
        usesIntro: 'We use cookies on our website to:',
        useNavigation: 'Simplify navigation and enable essential features, such as managing preferences.',
        useSettings: 'Remember personal settings, such as language or region.',
        useAnalytics: 'Analyze how you use the website to improve its design and functionality.',
        useTraffic: 'Monitor website traffic and user activity.',
        useAdvertising: 'Deliver relevant advertisements based on your interests.',
        usesClosing: 'We do not sell data collected via first-party cookies, but some third parties may access the data from their own cookies.',
        descriptionCookiesManagement: 'You can update your preferences for the cookies on our website through your profile. Please note that our websites will work without cookies, but you will lose some features and functionality if you choose to disable them.',
        descriptionCookiesManagementBrowser: 'If you wish to restrict or block web browser cookies which are set on your device then you can do this through your browser settings. Here is how to do this for the most popular browsers, but if yours is not listed you should be able to find this in your browser’s Help section or on aboutcookies.org:',
        subtitleFirstCookiesCategory: 'Strictly Necessary',
        subtitleSecondCookiesCategory: 'Functional',
        subtitleThirdCookiesCategory: 'Performance',
        subtitleFourthCookiesCategory: 'Targeted Advertising',
      });
    });
  });
});

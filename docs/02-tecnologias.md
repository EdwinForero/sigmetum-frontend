# 02. Tecnologías y dependencias

## Dependencias de ejecución

| Paquete | Versión declarada | Para qué se usa | Dónde |
|---|---|---|---|
| `react`, `react-dom` | ^18.3.1 | Librería de UI | Toda la app |
| `react-router-dom` | ^6.27.0 | Enrutado (`Routes`, `Route`, `Link`, `Navigate`, `useLocation`, `useNavigate`) | `index.js`, `App.js`, páginas y navegación |
| `motion` | ^11.12.0 | Animaciones. Se importa desde `motion/react` | Componentes y páginas animados |
| `i18next` | ^23.16.8 | Motor de traducciones | `i18n.js` |
| `react-i18next` | ^15.1.1 | `useTranslation`, `Trans` | Casi todos los componentes |
| `i18next-browser-languagedetector` | ^8.0.0 | Detecta el idioma del navegador y lo guarda en `localStorage['i18nextLng']` | `i18n.js` |
| `amazon-cognito-identity-js` | ^6.3.22 (instalada la 6.3.22) | Cálculo SRP del login con Cognito: solo se usa `AuthenticationHelper` | `services/srp.js` |
| `qrcode-generator` | ^2.0.4 (instalada la 2.0.4; MIT, sin dependencias ni scripts de instalación, ESM con exportación por defecto y con nombre) | Genera la matriz del QR del MFA en el navegador; el SVG lo pinta `QrCode` sin `innerHTML`. Se importa con `import qrcode from 'qrcode-generator'`. Elegida frente a `qrcode` 1.5.4 por no arrastrar dependencias; no hay una ruta de import más pequeña (un solo bloque con todos los modos y salidas) | `components/QrCode.js` |
| `xlsx` (SheetJS) | ^0.18.5 | Generar el Excel descargable | `utilities/CSVfunctions.js` |
| `styled-components` | ^6.1.13 | CSS del interruptor de cookies | `Switch.js` |

Notas:

- `amazon-cognito-identity-js` es la única dependencia del login y solo se usa su `AuthenticationHelper` (importado de la raíz del paquete, nunca por ruta profunda: en dev Vite duplicaría la clase y fallaría `instanceof`). **Justificación:** el SRP se calcula con aritmética de enteros grandes (`BigInteger`) y el contrato de infra dice «no se implementa SRP a mano»; el resto (peticiones a `cognito-idp`, firma HMAC con Web Crypto, fecha) lo hace el proyecto. `AuthenticationHelper` se exporta, `BigInteger` no (se usa `helper.N.constructor`). **Peso medido:** el paquete no declara `sideEffects`, así que importar desde la raíz lo arrastra entero: el JavaScript de producción pasó de 772.41 kB (gzip 250.65 kB) a 839.29 kB (gzip 274.92 kB), +66.9 kB y +24.3 kB comprimido (ver M16 en [09](09-estado-actual-y-deuda-tecnica.md)). **Auditoría:** `npm audit --omit=dev` da las mismas 3 de antes (`react-router`, `react-router-dom` y `xlsx`, aceptadas en M14) y ninguna nueva; `npm audit` completo marca 13 (la cifra anterior no se midió). `jwt-decode` se retiró el 09/11/2026: el cliente no decodifica el token.
- El paquete importa `buffer` 4.9.2, que lee `global.TYPED_ARRAY_SUPPORT`. En el build Rollup reescribe `global`; en dev el pre-empaquetado de esbuild no, por eso `vite.config.js` define `optimizeDeps.esbuildOptions.define: { global: 'globalThis' }` (solo afecta al pre-empaquetado de dev). Vitest usa el `buffer` nativo de Node y no detecta el problema. Comprobado: `dist/` no contiene `global.TYPED_ARRAY_SUPPORT` y en dev el paquete pre-empaquetado usa `globalThis`; que el `define` evite el fallo en un navegador en dev **(por confirmar)**.
- La Web Crypto API (`crypto.subtle`, para la firma HMAC) solo existe en un contexto seguro (HTTPS o `localhost`): en desarrollo por la IP de la red local el acceso daría `login.startError` **(por confirmar)**.
- `qrcode-generator` 2.0.4: comprobado fuera del repo (`npm view` y `npm pack`) antes de instalarlo: licencia MIT, sin `dependencies` ni scripts `preinstall`/`install`/`postinstall`, sin `eval`, `new Function`, `fetch` ni `window`. **Peso (`vite build`, 10/11/2026):** JavaScript de 840.15 kB (gzip 275.14 kB) a 863.53 kB (gzip 283.74 kB), es decir +23.38 kB y +8.60 kB gzip (el paquete pesa unos 21 kB minificado y 7,7 kB gzip sin tree-shaking); CSS de 22.69 kB (gzip 5.07 kB) a 23.05 kB (gzip 5.14 kB). **`npm audit --omit=dev`:** las mismas 3 (`react-router`, `react-router-dom` y `xlsx`), ninguna nueva. **Cadenas `data:` en `dist/`:** el paquete trae salidas GIF que `QrCode` no usa y sus cadenas `data:` aparecen en el bundle; se anota, no es un fallo (el código propio no usa `data:`, `<img>` ni `innerHTML`). `make()` lanza cadenas (no `Error`) si el contenido no cabe: `QrCode` lo cubre con `try/catch`. Tailwind 3.4 genera `forced-color-adjust-none`.
- `xlsx` 0.18.5 (la última de npm) tiene avisos de seguridad (prototype pollution y ReDoS al *leer* ficheros). Aquí solo se escriben, así que el riesgo es bajo, pero SheetJS publica las versiones nuevas en su propio CDN.
- `styled-components` se usa solo en un componente y se podría sustituir por Tailwind.

## Dependencias de desarrollo

| Paquete | Versión | Uso |
|---|---|---|
| `vite` | ^6.4 | Servidor de desarrollo (puerto 3000) y build de producción en `dist/` |
| `@vitejs/plugin-react` | ^4.7 | Transformación de JSX y recarga en caliente |
| `vitest` | ^3.2 | Ejecutor de tests, integrado con la configuración de Vite |
| `jsdom` | ^26 | Entorno de navegador simulado para los tests. Se mantiene en la 26 por cambio mínimo; subirla a la 27 o posterior se valora en M19 de [09](09-estado-actual-y-deuda-tecnica.md) con Node 22 como base (los `engines` exactos de jsdom 27 no se han comprobado **(por confirmar)**) |
| `@testing-library/react`, `dom`, `user-event`, `jest-dom` | ^16, ^10, ^14, ^6 | Pruebas de componentes y aserciones sobre el DOM |
| `tailwindcss` | ^3.4.14 | Estilos utilitarios. Configuración en `tailwind.config.js` (fuentes, colores de marca y `spacing.nav`) |
| `postcss`, `autoprefixer` | ^8.5, ^10.6 | Procesado de Tailwind (`postcss.config.js`) |
| `eslint`, `@eslint/js` | ^9 | Análisis estático del código. Se queda en la serie 9 porque los plugins de React y de accesibilidad aún no admiten ESLint 10 |
| `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` | ^7.37, ^7.1, ^6.10 | Reglas de React, de hooks y de accesibilidad |
| `globals` | ^17 | Variables globales de navegador y de Node para ESLint |

## Configuración de herramientas

| Archivo | Qué define |
|---|---|
| `vite.config.js` | Plugin de React, el plugin inline `sigmetum-favicon` (inyecta el favicon en `index.html`), puerto 3000 y la configuración de Vitest. Como el código usa JSX en archivos `.js`, le indica a esbuild que los trate como JSX (también en el pre-empaquetado de dev, donde además define `global: 'globalThis'` por el paquete `buffer`, ver las notas de dependencias) |
| `postcss.config.js` | Tailwind y Autoprefixer |
| `tailwind.config.js` | Rutas de contenido (`index.html` y `src/`), las fuentes `primary` (Amaranth) y `secondary` (Sen), los colores del tema (`brand`, `brand-dark`, `brand-deep`, `surface`, `ink`, `ink-soft`, `sage`, `moss` y `danger`) y `spacing.nav` (altura de la barra inferior); ver [07](07-i18n-y-estilos.md#paleta). `src/theme.test.js` lo comprueba |
| `src/setupTests.js` | `jest-dom` para Vitest y simulación de `react-i18next` (`t()` devuelve la clave) |
| `eslint.config.js` | Reglas de ESLint (React, hooks, accesibilidad y seguridad) y un bloque aparte para los `.mjs` de `plugins/` (globales de Node) |
| `package.json` | `"type": "module"`, `engines.node` (`>=22`, la versión del build de Amplify) y los scripts (ver [08](08-guia-desarrollo.md#scripts)). `package-lock.json` refleja `engines` en su entrada raíz |
| `.nvmrc` | `22`: `nvm use` elige la versión de Node de desarrollo. Amplify no lo lee (su `build_spec` ejecuta `nvm install 22 && nvm use 22`) |

`eslint.config.js` (configuración plana de ESLint 9): los errores bloquean, y las reglas de accesibilidad y de calidad son avisos con un **tope que no puede crecer** (`--max-warnings` en el script `lint`). En la auditoría de las páginas privadas el tope bajó al recuento real (el valor está en [09](09-estado-actual-y-deuda-tecnica.md#métricas)); es el único cambio de `package.json`: no hay dependencias nuevas ni scripts nuevos. `index.html` carga las dos hojas de Google Fonts con `<link rel="stylesheet">` (sin `preload` ni `onload` en línea). `scripts/quality-check.mjs` añade patrones prohibidos, búsqueda de secretos y `npm audit`. Ver [08](08-guia-desarrollo.md#scripts).

## Recursos externos cargados en `index.html`

| Recurso | Uso |
|---|---|
| Google Fonts: Amaranth, Sen (y Mukta Malar, que no se usa) | Tipografías `font-primary` y `font-secondary` |
| Google Fonts: Material Symbols Outlined | Iconos por ligadura (`<span class="material-symbols-outlined">delete</span>`) |
| Favicon | Ya no está fijo en `index.html`: el plugin `sigmetum-favicon` de `vite.config.js` lo inyecta al compilar (y en `npm run dev`) desde `VITE_S3_URL` y `ASSETS.LOGO`; sin la variable no hay favicon (ver [06](06-utilidades-hooks-config.md#favicon-viteconfigjs-y-faviconhtml)) |

## Servicios externos

| Servicio | Uso |
|---|---|
| `sigmetum-backend` (Express, Node) | API REST bajo `/api/v1` |
| Amazon S3 (región de `sigmetum-infra`; el bucket antiguo estaba en otra región) | Datos por provincia, Excel versionados, imágenes y recursos estáticos |
| AWS Amplify | Despliegue del frontend, definido en `sigmetum-infra` |
| IPNI (`ipni.org`) | Enlace "Leer más" de cada especie |

## Navegadores objetivo

Vite compila para navegadores con módulos ES nativos (Chrome, Edge, Firefox y Safari de los últimos años). Ya no hay `browserslist` como en Create React App.

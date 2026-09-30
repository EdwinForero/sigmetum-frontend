# 02. Tecnologías y dependencias

## Dependencias de ejecución

| Paquete | Versión declarada | Para qué se usa | Dónde | Estado |
|---|---|---|---|---|
| `react`, `react-dom` | ^18.3.1 | Librería de UI | Toda la app | En uso |
| `react-scripts` | 5.0.1 | Build, servidor de desarrollo, Jest y ESLint (Create React App) | Scripts de `package.json` | En uso. **CRA está abandonado**: conviene migrar a Vite |
| `react-router-dom` | ^6.27.0 | Enrutado (`Routes`, `Route`, `Link`, `Navigate`, `useLocation`, `useNavigate`) | `index.js`, `App.js`, páginas y navegación | En uso |
| `motion` | ^11.12.0 | Animaciones. El código importa desde `framer-motion`, que llega como dependencia transitiva de `motion` | 15 componentes y páginas | En uso, pero la importación no coincide con la dependencia declarada |
| `i18next` | ^23.16.8 | Motor de traducciones | `i18n.js` | En uso |
| `react-i18next` | ^15.1.1 | `useTranslation`, `Trans` | Casi todos los componentes | En uso |
| `i18next-browser-languagedetector` | ^8.0.0 | Detecta el idioma del navegador y lo guarda en `localStorage['i18nextLng']` | `i18n.js` | En uso |
| `jwt-decode` | ^4.0.0 | Leer `exp` del token para detectar caducidad | `ProtectedRoute.js`, `TokenExpiration.js` | En uso |
| `xlsx` (SheetJS) | ^0.18.5 | Generar el Excel descargable | `utilities/CSVfunctions.js` | En uso. La versión de npm (0.18.5) tiene avisos de seguridad (prototype pollution y ReDoS al *leer* ficheros). Aquí solo se escriben, así que el riesgo es bajo, pero SheetJS publica las versiones nuevas en su propio CDN |
| `styled-components` | ^6.1.13 | CSS del interruptor de cookies | `Switch.js` | En uso solo en un componente; se podría sustituir por Tailwind |
| `@testing-library/react`, `jest-dom`, `user-event` | ^13.4.0, ^5.17.0, ^13.5.0 | Tests | Ninguno | Instalado sin uso (no hay tests) |
| `react-joyride` | ^2.9.3 | Tours guiados | Ninguno | **Sin uso**, se puede eliminar |
| `web-vitals` | ^2.1.4 | Métricas de rendimiento | Ninguno | **Sin uso** (se eliminó `reportWebVitals`) |
| `install`, `npm` | — | Ninguno | Ninguno | **Añadidos por error**: eliminar |

## Dependencias de desarrollo

| Paquete | Versión | Uso |
|---|---|---|
| `tailwindcss` | ^3.4.14 | Estilos utilitarios. Configuración en `tailwind.config.js` (solo fuentes) |
| `@babel/plugin-proposal-private-property-in-object` | ^7.21.11 | Evita un aviso conocido de CRA con Babel |

CRA procesa Tailwind con su configuración de PostCSS interna, por eso no hay `postcss.config.js`.

## Recursos externos cargados en `index.html`

| Recurso | Uso |
|---|---|
| Google Fonts: Amaranth, Sen (y Mukta Malar, que no se usa) | Tipografías `font-primary` y `font-secondary` |
| Google Fonts: Material Symbols Outlined | Iconos por ligadura (`<span class="material-symbols-outlined">delete</span>`) |
| Favicon en `s3-sigmetumtest` | Obsoleto; `Header` lo sustituye en tiempo de ejecución por `assets/logos/app-logo.jpg` |

## Servicios externos

| Servicio | Uso |
|---|---|
| `sigmetum-backend` (Express, Node) | API REST bajo `/api/v1` |
| Amazon S3 (`eu-west-3`) | Datos por provincia, Excel versionados, imágenes y recursos estáticos |
| IPNI (`ipni.org`) | Enlace "Leer más" de cada especie |

## Navegadores objetivo

Definidos en `browserslist`: en producción, `>0.2%, not dead, not op_mini all`; en desarrollo, la última versión de Chrome, Firefox y Safari.

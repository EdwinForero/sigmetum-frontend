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
| `jwt-decode` | ^4.0.0 | Leer `exp` del token para detectar caducidad | `ProtectedRoute.js`, `TokenExpiration.js` |
| `xlsx` (SheetJS) | ^0.18.5 | Generar el Excel descargable | `utilities/CSVfunctions.js` |
| `styled-components` | ^6.1.13 | CSS del interruptor de cookies | `Switch.js` |

Notas:

- `xlsx` 0.18.5 (la última de npm) tiene avisos de seguridad (prototype pollution y ReDoS al *leer* ficheros). Aquí solo se escriben, así que el riesgo es bajo, pero SheetJS publica las versiones nuevas en su propio CDN.
- `styled-components` se usa solo en un componente y se podría sustituir por Tailwind.

## Dependencias de desarrollo

| Paquete | Versión | Uso |
|---|---|---|
| `vite` | ^6.4 | Servidor de desarrollo (puerto 3000) y build de producción en `dist/` |
| `@vitejs/plugin-react` | ^4.7 | Transformación de JSX y recarga en caliente |
| `vitest` | ^3.2 | Ejecutor de tests, integrado con la configuración de Vite |
| `jsdom` | ^26 | Entorno de navegador simulado para los tests. Se fija en la 26 porque las versiones 27 y posteriores exigen Node 22 o superior y el proyecto debe funcionar con Node 20 |
| `@testing-library/react`, `dom`, `user-event`, `jest-dom` | ^16, ^10, ^14, ^6 | Pruebas de componentes y aserciones sobre el DOM |
| `tailwindcss` | ^3.4.14 | Estilos utilitarios. Configuración en `tailwind.config.js` (fuentes) |
| `postcss`, `autoprefixer` | ^8.5, ^10.6 | Procesado de Tailwind (`postcss.config.js`) |

## Configuración de herramientas

| Archivo | Qué define |
|---|---|
| `vite.config.js` | Plugin de React, puerto 3000 y la configuración de Vitest. Como el código usa JSX en archivos `.js`, le indica a esbuild que los trate como JSX |
| `postcss.config.js` | Tailwind y Autoprefixer |
| `tailwind.config.js` | Rutas de contenido (`index.html` y `src/`) y las fuentes `primary` (Amaranth) y `secondary` (Sen) |
| `src/setupTests.js` | `jest-dom` para Vitest y simulación de `react-i18next` (`t()` devuelve la clave) |
| `package.json` | `"type": "module"` y los scripts (ver [08](08-guia-desarrollo.md#scripts)) |

No hay linter configurado desde la migración: Create React App traía ESLint integrado y Vite no. Está pendiente añadirlo (ver [09](09-estado-actual-y-deuda-tecnica.md)).

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
| Amazon S3 (`eu-west-1` en `sigmetum-infra`; el bucket antiguo estaba en `eu-west-3`) | Datos por provincia, Excel versionados, imágenes y recursos estáticos |
| AWS Amplify | Despliegue del frontend, definido en `sigmetum-infra` |
| IPNI (`ipni.org`) | Enlace "Leer más" de cada especie |

## Navegadores objetivo

Vite compila para navegadores con módulos ES nativos (Chrome, Edge, Firefox y Safari de los últimos años). Ya no hay `browserslist` como en Create React App.

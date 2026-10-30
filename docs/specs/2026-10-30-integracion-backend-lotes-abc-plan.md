# Integración backend lotes A, B y C: plan

Fecha: 2026-10-30 · Estado: cerrado · Spec: `docs/specs/2026-10-30-integracion-backend-lotes-abc-design.md`

## Notas de la segunda opinión (aprobadas, obligatorias para el developer)

1. `api.js` (paso 2): mirar `response.status === 401` con `authenticated` **antes** de `await response.json()`, para que un 401 con cuerpo no JSON también borre el token y redirija; el error lanzado lleva `status` y `type: 'http'`. Test con cuerpo no JSON.
2. `Table` (paso 8): con el mock `t: (key) => key` las cabeceras son `attributes.a` y `attributes.b`; el test debe buscar esas.
3. `window.location` (paso 2): `vi.spyOn(window.location, 'assign')` falla en jsdom; usar `vi.stubGlobal('location', { assign: vi.fn() })` con `vi.unstubAllGlobals()` en `afterEach`, y probarlo primero.
4. Los tests de cada componente afirman la clave i18n exacta que añade el paso 1.
5. `ContactForm`: `getByPlaceholderText` (las etiquetas no tienen `htmlFor`). `ImageGalleryManager`: el mock de `api.get('/list-images')` resuelve `[]` y el `File` de prueba es `image/png`.
6. `FileUpload`, cancelar con fallo (404 u otro): se muestra el mensaje, `allFilesUploadedSuccessfully = false`, `break`, y **no** se limpia `files` (así el usuario puede reintentar); decisión explícita.
7. Limitaciones a documentar (aviso de PR y `docs/09`): `FileUpload` no redirige ante 401; su 404 se interpreta solo por estado.

Crítico: sí (sesión y token en `services/api.js`, `LoginForm`; contrato con el backend).

## Supuestos y observaciones (leídos del código)

- `api.get` y `api.post` no usan `authHeader`; solo los métodos `*Auth` lo usan. Ahí se engancha la redirección del 401.
- `FileUpload.js` ya lee `localStorage['token']` en 3 sitios, fuera de las tres excepciones de CLAUDE.md. La spec mantiene su `fetch`. No se toca ese acceso ni se añade ninguno nuevo. Se señala como deuda existente (para `docs/09`).
- `ProtectedRoute` llama a `api.getAuth('/auth')`. Con el cambio, un 401 allí también borrará el token y hará `assign('/login')`. Es coherente con su redirección actual y no se toca `ProtectedRoute`.
- Los mocks de `react-i18next` en `src/setupTests.js` devuelven la clave. Los tests comprueban claves, no textos.
- No hay tests de `api.js`, `LoginForm`, `ContactForm`, `ImageGalleryManager`, `Table`, `FormatFileName`, `ImageCarrousel` ni `ImageComponent`. Cada paso crea el suyo.
- Orden por paso: test en rojo por el motivo correcto, después el cambio mínimo.

Decisiones propuestas (la spec no las fija):

- `FileUpload` detecta `Draft not found` por `status === 404` en `/upload/confirm`, sin leer el texto `error`.
- Si falla la cancelación (no 404), se reutiliza `dialogAdvice.errorUploadMessage`, sin clave nueva.
- La validación del título es una constante regex dentro de `ImageGalleryManager`, sin utilidad nueva. Usa `\p{Cc}` con flag `u` para no disparar `no-control-regex`.
- Prohibidos en el título: `/ \ ..`, control, `, ' : & # ? %` y `"`. La tilde invertida no se añade (por confirmar).
- 401 de `FileUpload`: no se redirige ahí, porque habría que tocar el token fuera de los archivos permitidos.

## Fase 1

1. **Claves i18n nuevas en `es` y `en`**
   - Archivos: `src/languages/es/translation.json` y `src/languages/en/translation.json` (modificar).
   - Claves (mismas en ambos): `login.tooManyAttemptsLabel`, `dialogAdvice.errorEmailRateLimit`, `dialogAdvice.errorEmailInvalid`, `dialogAdvice.errorDraftNotFound`, `dialogAdvice.adviceInvalidImageTitle` (las barras invertidas se escapan como `\\` en el JSON; edítalo con el editor, no con `cat <<EOF`). Textos en la spec.
   - Comprobación: `npm test -- src/languages/translations.test.js`.
   - Norma: `docs/guias/buenas-practicas-frontend.md`; CLAUDE.md, reglas de trabajo.

2. **`api.js`: 401 en métodos `*Auth` borra el token y redirige**
   - Archivos: `src/services/api.js` (modificar), `src/services/api.test.js` (crear).
   - Firma: `request(path, options = {}, { authenticated = false } = {})`. Si `authenticated` y `response.status === 401`: `localStorage.removeItem('token')` y `window.location.assign('/login')` antes de lanzar el error, que se sigue lanzando igual. `getAuth`, `postAuth`, `postFormAuth` y `deleteAuth` pasan `{ authenticated: true }`; `get` y `post` no.
   - Comprobación: `api.test.js` con `vi.stubGlobal('fetch', ...)`, `localStorage` sembrado y `window.location` con espía de `assign`. Casos: `postAuth`/`getAuth` con 401 borra el token y llama a `assign('/login')`; `api.post('/log')` con 401 no borra ni redirige y lanza `error.status === 401`; `api.get` con 401 tampoco; `getAuth` con 200 sin redirección.
   - Norma: `docs/guias/seguridad.md`; `docs/integracion/para-backend.md` secciones 1 y 4 (D6); `backend:F6`, `F7 d`.

3. **`LoginForm`: mensaje propio para 429**
   - Archivos: `src/components/LoginForm.js` (modificar), `src/components/LoginForm.test.js` (crear).
   - Firma: estado de error (`loginErrorKey` o `null`) en lugar del booleano `showLoginError`. En el `catch (error)`: `status === 429` muestra `login.tooManyAttemptsLabel`; cualquier otro, `login.unauthorizedLabel`. Un único `localStorage.setItem` en el éxito.
   - Comprobación: `vi.mock('../services/api')` y `MemoryRouter`: 429, 401 y éxito (navega a `/cargar-archivos`).
   - Norma: `docs/integracion/para-backend.md` sección 6 (D7); `docs/guias/accesibilidad.md`.

4. **`ContactForm`: `maxLength` y mensajes 429 y 400**
   - Archivos: `src/components/ContactForm.js` (modificar), `src/components/ContactForm.test.js` (crear).
   - Firma: `maxLength` 100 (nombre), 254 (correo), 150 (asunto), 2000 (mensaje). En el `catch (error)`: 429 usa `dialogAdvice.errorEmailRateLimit`, 400 usa `dialogAdvice.errorEmailInvalid`, el resto `dialogAdvice.errorEmailMessage`.
   - Comprobación: test de `maxLength` en los 4 campos y tres casos de envío (429, 400, 500).
   - Norma: `docs/integracion/para-backend.md` sección 1; `docs/guias/seguridad.md`.

5. **`FileUpload`: solo `.xlsx`, 404 `Draft not found` y cancelar comprobado**
   - Archivos: `src/components/FileUpload.js` (modificar), `src/components/FileUpload.test.js` (ampliar).
   - Firma: `accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"`. Rama `confirmed: true`: si `!ok` y `status === 404`, muestra `dialogAdvice.errorDraftNotFound`, `allFilesUploadedSuccessfully = false` y `break`; otro fallo mantiene el `throw`. Rama `confirmed: false`: se guarda la respuesta; si `!ok`, 404 muestra `errorDraftNotFound` y el resto `errorUploadMessage`; en ambos `allFilesUploadedSuccessfully = false` y `break`. El `400` con `emptyFields` y `draftKey` no cambia. Sin accesos nuevos a `localStorage`; sin migrar a `api.js`.
   - Comprobación: los tests existentes siguen verdes; nuevos: `accept` sin `.csv`, `.xls` ni `vnd.ms-excel`; confirmar con 404; cancelar con 404; cancelar con 500.
   - Norma: `docs/integracion/para-backend.md` secciones 1 y 2 (D3); `backend:F10`, `F11`; `docs/guias/seguridad.md`.

## Fase 2

6. **`ImageGalleryManager`: validar el título antes de subir**
   - Archivos: `src/components/ImageGalleryManager.js` (modificar), `src/components/ImageGalleryManager.test.js` (crear).
   - Firma: constante de módulo `INVALID_TITLE = /[\/\\,':&#?%"]|\.\.|\p{Cc}/u`. En `handleImageUpload`, tras la comprobación de vacíos y antes de `setIsLoading(true)`: si coincide, `showDialog(t('dialogAdvice.adviceTitle'), t('dialogAdvice.adviceInvalidImageTitle'))` y `return`. Sin tope de longitud ni saneado.
   - Comprobación: un caso por carácter prohibido (`/`, `\`, `..`, control, `,`, `'`, `:`, `&`, `#`, `?`, `%`, `"`) sin llamar a `postFormAuth`; un título válido sí llama. Vigilar avisos de `npm run lint`.
   - Norma: `docs/guias/seguridad.md`; `backend:F9`.

7. **`encodeURIComponent` de `imageKey`**
   - Archivos: `src/components/ImageCarrousel.js`, `src/components/ImageComponent.js` (modificar); `ImageCarrousel.test.js`, `ImageComponent.test.js` (crear).
   - Firma: `api.get(\`/get-image?imageKey=${encodeURIComponent(key)}\`)` en ambos. La `description` del carrusel sigue usando la clave sin codificar.
   - Comprobación: `imageKey="gallery/Mi foto&1.jpg"` llama a `/get-image?imageKey=gallery%2FMi%20foto%261.jpg`; carrusel con `vi.mock('../config/env', ...)`; sin `imageKey` no llama a `api.get` (`backend:F5`).
   - Norma: `docs/guias/seguridad.md`; `backend:F5`.

8. **`Table`: columnas como unión de claves**
   - Archivos: `src/components/Table.js` (modificar), `src/components/Table.test.js` (crear).
   - Firma: `const columnNames = [...new Set(data.flatMap((row) => Object.keys(row)))];` (primera aparición). No muta `data`; se calcula tras el `return` temprano, sin hooks nuevos.
   - Comprobación: `[{a:1},{a:2,b:3}]` renderiza cabeceras `a` y `b`; orden de primera aparición; `data` intacto.
   - Norma: `docs/guias/buenas-practicas-frontend.md`; `docs/integracion/para-backend.md` sección 3 y D4.

9. **`FormatFileName` con el formato real del backend**
   - Archivos: `src/utilities/FormatFileName.js` (modificar), `src/utilities/FormatFileName.test.js` (crear).
   - Firma: busca `/(\d{4})-(\d{2})-(\d{2})_v(\d+)\.xlsx$/` y devuelve `` `${dd}/${mm}/${yyyy} · V${parseInt(n, 10)}` ``; si no coincide, devuelve `fileName`. Mismo `export const`; `FileDropdown` no cambia.
   - Comprobación: `2026-09-15_v3.xlsx`, `_v10`, `data/Malaga/2026-09-15_v3.xlsx`, `nombre-raro.json` (igual) y vacío (sin fallo). El `name` real de `list-files` con o sin ruta, por confirmar.
   - Norma: `docs/integracion/para-backend.md` secciones 6 (D2) y 2.

## A cargo del tester-documentador

- `docs/integracion/para-backend.md`:
  - sección 6: quitar D2, D3, D4, D6, D7 y también D5 y D8 (resueltos en el backend por `F3` y `F2`), con una línea en el historial de `docs/09`; D1 y M12 siguen abiertos;
  - sección 2: fila `POST /upload` sin `processedData`; `GET /get-image` usado por `ImageCarrousel` (no montado, import comentado en `Explore.js`) e `ImageComponent` (solo si recibe `imageKey`);
  - sección 1: tabla de mensajes de error con `401` (redirección en `*Auth`), `429` (login y contacto), `400` (contacto) y `404 Draft not found`; quitar "No distingue 400, 401, 404 ni 500";
  - sección 4: caducidad del token durante la sesión;
  - sección 8: fecha y commits de la verificación.
- `docs/03-api.md`: `api.js` ante 401; 404 y cancelar en `FileUpload` (sigue con `fetch` propio).
- `docs/05-componentes.md`: `FileUpload`, `ContactForm`, `LoginForm`, `ImageGalleryManager`, `ImageCarrousel`, `ImageComponent` y `Table`.
- `docs/06-utilidades-hooks-config.md`: `FormatFileName`.
- `docs/07-i18n-y-estilos.md`: las claves nuevas y el recuento, si lo lista.
- `docs/09-estado-actual-y-deuda-tecnica.md`: fecha de cierre; recalcular cifras; retirar D2, D3, D4, D6, D7; D1 y M12 pendientes; anotar que `FileUpload.js` accede al token fuera de las excepciones.
- `docs/specs/2026-10-30-integracion-backend-lotes-abc-aviso-pr.md` (crear): línea `Integración:` indicando que `para-backend.md` cambia; registrar las condiciones por confirmar del backend (F7 a, b, c, d; F10; F11) contrastadas con el código.
- Ejecutar `npm run docs:gate` antes del commit. No hay cambios en `plugins/`: `agentes:test` no aplica.

## Pruebas

- Nuevas: `src/services/api.test.js`, `src/components/{LoginForm,ContactForm,ImageGalleryManager,Table,ImageComponent,ImageCarrousel}.test.js`, `src/utilities/FormatFileName.test.js`.
- Ampliadas: `src/components/FileUpload.test.js`; `src/languages/translations.test.js` debe seguir verde.
- Finales: `npm test`, `npm run build`, `npm run lint` (si bajan los avisos, ajustar `--max-warnings`), `npm run quality`, `npm run docs:check`.

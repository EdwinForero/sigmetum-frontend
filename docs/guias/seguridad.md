# Seguridad del frontend

Normas para no introducir vulnerabilidades en este repositorio, con el estado real de cada una. Cada regla dice **por qué**, **cómo se comprueba** y **cómo está hoy**.

- Complementa a [buenas-practicas-frontend.md](buenas-practicas-frontend.md) y a [accesibilidad.md](accesibilidad.md).
- Lo que depende del backend o de la infraestructura está en [integracion/para-backend.md](../integracion/para-backend.md) y [integracion/para-infra.md](../integracion/para-infra.md).
- Los hallazgos con id están en [09](../09-estado-actual-y-deuda-tecnica.md).
- Si un cambio contradice una regla de esta guía, **avisa y pregunta** antes de hacerlo.

## 1. Qué hay que proteger

| Activo | Riesgo principal |
|---|---|
| **Sesión del administrador** (JWT en el navegador) | Que un script ajeno la robe (XSS) o que se use en otro sitio |
| **Datos de investigación** (públicos, pero su integridad importa) | Que una carga incorrecta o maliciosa los corrompa |
| **Datos personales** del formulario de contacto (nombre y correo) y cookies | Tratamiento sin consentimiento o sin información |
| **La propia web** | Que se inyecte contenido (XSS) o se cargue código de terceros |

Se trata de una SPA pública con una zona privada. **Toda la seguridad real está en el backend**: el frontend solo puede evitar errores y no facilitar ataques. Que una ruta esté oculta tras `ProtectedRoute` es comodidad de uso, no una barrera.

## 2. Reglas

### S1. Ningún secreto en el frontend

- **Por qué:** todo lo que va al JavaScript (incluidas las variables `VITE_*`) lo puede leer cualquiera.
- **Cómo:** `npm run quality` busca claves de AWS, claves privadas, tokens de GitHub y tokens `Bearer` literales, avisa de variables `VITE_*` con nombres como `SECRET` o `PASSWORD`, y comprueba que ningún `.env` está versionado.
- **Estado:** cumple. `.env` está en `.gitignore`.

### S2. Nada de HTML sin escapar

- **Por qué:** es la vía clásica de XSS. React escapa por defecto; estas API lo desactivan.
- **Cómo:** ESLint (`react/no-danger` es un **error**) y `npm run quality` prohíben `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `document.write`, `eval` y `new Function`.
- **Estado:** cumple, sin usos. Las traducciones con formato usan `<Trans components={...}>`, que solo admite las etiquetas que declaras. Nunca metas datos de la API dentro de una traducción con etiquetas.

### S3. La sesión: dónde vive y cómo se usa

- **Por qué:** el JWT está en `localStorage`, que cualquier script de la página puede leer. Una sola vulnerabilidad XSS bastaría para robarlo (M1).
- **Reglas:**
  - El token se toca **solo** en `services/api.js`, `LoginForm` y `ProtectedRoute`. `npm run quality` falla si aparece en otro archivo. `FileUpload` lo lee hoy y está registrado como deuda (M2).
  - Nunca se escribe el token en consola, en mensajes de error ni en la documentación.
  - Que el cliente compruebe `exp` es solo comodidad: quien **decide** es el backend.
  - Al recibir un `401`, se borra la sesión y se redirige al acceso (D6, pendiente).
  - Debe existir cierre de sesión. No existe hoy.
- **Objetivo:** pasar a una cookie `HttpOnly`, `Secure` y `SameSite`, emitida por el backend. Exige coordinar protección CSRF y CORS con credenciales con el backend.
- **Estado:** M1 pendiente.

### S4. Enlaces y navegación

- **Por qué:** `target="_blank"` sin `rel` permite que la página abierta manipule la tuya; una URL construida con texto libre puede abrir sitios inesperados.
- **Reglas:**
  - Enlaces externos con `rel="noopener noreferrer"`. ESLint (`react/jsx-no-target-blank`) lo exige como error.
  - URLs `https://`. `npm run quality` falla con `http://` nuevas. Hoy queda el enlace de una entidad colaboradora en `Home` (B14).
  - Los datos que entren en una URL se codifican (`encodeURIComponent`, como hace el enlace a IPNI).
  - **Ningún dato del usuario llega a `<Link to>`, `<Navigate to>` ni `navigate()`.** Es la condición que hace aceptable el aviso de `react-router` (ver S6).
- **Estado:** cumple.

### S5. Entradas del usuario

- **Por qué:** lo que valide el cliente se puede saltar; sirve para dar buenos mensajes, no para proteger.
- **Reglas:**
  - Valida en el cliente por usabilidad y **nunca confíes en ello**: el backend valida siempre.
  - Escapa todo texto que vaya a una expresión regular (A3).
  - **Subida de archivos:** el selector solo acepta `.xlsx` (hoy acepta también `.csv` y `.xls`, que el backend no procesa: D3). Limita el tamaño en el cliente cuando el backend lo limite.
  - **Formulario de contacto:** longitudes máximas y `type="email"`. El backend debe limitar la frecuencia (no lo hace hoy, ver su documento de deuda).
- **Estado:** parcial (D3).

### S6. Dependencias

- **Por qué:** el código de terceros es la mayor parte de lo que se ejecuta.
- **Cómo:** `npm run quality` ejecuta `npm audit --omit=dev` y **falla con vulnerabilidades altas o críticas** que no estén aceptadas por escrito en `ACCEPTED_ADVISORIES` (`scripts/quality-check.mjs`). Las moderadas se muestran como aviso.
- **Reglas:**
  - Se confirma siempre `package-lock.json`. Se instala con `npm ci`.
  - Se corrige con `npm audit fix`, **nunca con `--force`**.
  - Una excepción se justifica por escrito (qué aviso, por qué no aplica) y se revisa al actualizar la dependencia.
  - Antes de añadir una librería: mantenimiento, licencia, tamaño y si hace algo que ya hace otra.
- **Excepciones vigentes (M14):**

| Dependencia | Gravedad | Por qué se acepta |
|---|---|---|
| `xlsx` | Alta (prototype pollution y ReDoS) | Sin arreglo disponible. Solo **escribe** ficheros (`CSVfunctions.js`); los avisos afectan a la **lectura** de ficheros no confiables. Si algún día se lee un Excel en el navegador, hay que sustituirla (por ejemplo `exceljs`) |
| `react-router` y `react-router-dom` | Moderada (redirección abierta con barra invertida) | La corrección está solo en la v7. Ningún dato del usuario llega a `Link` ni a `navigate` (S4) |

- **Estado:** el `npm audit fix` del 30/09/2026 bajó los avisos de producción de 7 a 3.

### S7. HTTPS y contenido mixto

- **Por qué:** la web se sirve por HTTPS; el navegador bloquea las peticiones a un backend `http://`, y cualquier contraseña viajaría sin cifrar.
- **Reglas:** toda URL de la API y de recursos es `https://` fuera de `localhost`. `VITE_BASE_URL` de cada entorno desplegado también.
- **Estado:** el backend de `dev` es `http://` (I4, en infraestructura).

### S8. Cabeceras de seguridad y CSP

- **Por qué:** limitan el daño si algo falla (XSS, clickjacking, rastreo).
- **Recomendación para Amplify** (responsabilidad de infra, ver [para-infra.md](../integracion/para-infra.md)): `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` y `frame-ancestors 'none'` (o `X-Frame-Options`).
- **Obstáculo en el frontend (M13):** los `<link>` de fuentes de `index.html` usan el atributo `onload` inline, que obliga a permitir scripts en línea en la CSP. Conviene alojar las fuentes en el propio sitio: elimina el `onload`, la dependencia de Google y la petición a un tercero antes del consentimiento.
- **Estado:** sin política definida.

### S9. Privacidad y cookies

- **Por qué:** la web es de una universidad y trata datos de contacto; le aplican el RGPD y la LSSI (**por confirmar con el servicio jurídico**).
- **Reglas:**
  - No se añade analítica, publicidad ni recursos de terceros que rastreen **sin** pasar antes por el consentimiento.
  - Las cookies que cree el frontend llevan `SameSite` y, en HTTPS, `Secure` (M15).
  - El banner de cookies guarda preferencias, pero **nada las lee** (M11): si se incorpora un servicio opcional, debe comprobar el consentimiento antes de cargarse.
  - El formulario de contacto, que recoge nombre y correo, debería enlazar a la información sobre el tratamiento de datos. **Hoy no existe ninguna política de privacidad ni aviso (verificado en las rutas y en las traducciones, que solo tienen la política de cookies)** (M17). Si es obligatoria, lo decide el servicio jurídico de la universidad.
- **Estado:** parcial.

### S10. Errores y registros

- No se escribe en consola información sensible (`npm run lint` avisa de `console.log`).
- El `ErrorBoundary` no muestra detalles técnicos al usuario.
- Los mensajes de error son propios, no el texto del servidor (ver [buenas prácticas](buenas-practicas-frontend.md)).

### S11. Control de acceso

- `ProtectedRoute` decide qué **se muestra**, no qué se **permite**. Cualquier operación privada debe estar protegida en el backend (todas las rutas de `upload`, `delete` y `update` ya lo están).
- Al añadir una pantalla privada, se envuelve en `ProtectedRoute` y se comprueba que el endpoint que usa pide token.

## 3. Estado actual (auditoría del 30/09/2026)

| Comprobación | Resultado |
|---|---|
| `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write` en `src/` | **Ninguno** |
| Enlaces `target="_blank"` | Todos con `rel="noopener noreferrer"` (ESLint lo exige) |
| Secretos en el código, `.env.example`, `index.html` y documentación | **Ninguno** |
| `.env` versionado | **No** |
| `npm audit` de producción (gravedad alta o crítica) | 1 vulnerabilidad: `xlsx`, sin arreglo, aceptada (M14) |
| `npm audit` de producción (moderada) | 1: `react-router`, arreglo solo en v7, aceptada (M14) |
| Token de sesión | En `localStorage` (M1); leído también en `FileUpload` (M2) |
| Cierre de sesión y gestión del `401` | No existen (D6) |
| Cookies propias | Sin `SameSite` ni `Secure` (M15) |
| Fuentes de Google cargadas antes del consentimiento | Sí (M13) |
| Content-Security-Policy y demás cabeceras | Sin definir |
| URLs `http://` en el código | 1 enlace externo (B14) y el valor por defecto `localhost` |
| Política de privacidad y aviso de tratamiento de datos en el formulario de contacto | No existen (M17) |

## 4. Lista de comprobación para una PR

Márcala **siempre** que el cambio toque sesión, formularios, subida de archivos, URLs, dependencias, variables de entorno o HTML dinámico.

- [ ] `npm run quality` en verde (patrones, secretos, `npm audit` y ESLint).
- [ ] No hay datos de usuario o de la API en `Link`, `navigate`, regex o HTML sin escapar.
- [ ] No se añade código que lea el token fuera del módulo de sesión.
- [ ] Las URLs nuevas son `https://` y los enlaces externos llevan `rel="noopener noreferrer"`.
- [ ] Las dependencias nuevas están justificadas, al día y con licencia compatible.
- [ ] No se añaden secretos ni valores reales a `.env.example` ni a la documentación.
- [ ] Si se toca el contrato con el backend o la infra, se actualiza `integracion/`.
- [ ] Para cambios de sesión, subida de archivos o autenticación: se pasa además la revisión `/security-review` de Claude Code.

## 5. Si encuentras una vulnerabilidad

1. No la publiques en un issue ni en una PR abierta: díselo directamente a quien mantiene el proyecto.
2. Si hay un secreto expuesto (clave, token, contraseña), **se rota primero** y después se limpia el historial.
3. Se corrige con un test que la reproduzca.
4. Se anota en [09](../09-estado-actual-y-deuda-tecnica.md) una vez resuelta, sin detalles que faciliten reproducirla.

## 6. Mantener esta guía

- Cada vez que se acepta o se retira una vulnerabilidad de `ACCEPTED_ADVISORIES`, se actualiza la tabla de la regla S6.
- Cada vez que cambia algo del estado (S3, S7, S8, S9), se actualiza la tabla de la sección 3.
- Una comprobación manual que se pueda automatizar se pasa a ESLint o a `scripts/quality-check.mjs`.

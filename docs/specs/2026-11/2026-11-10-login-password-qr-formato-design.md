# Login: mostrar contraseña, QR del MFA y armonía visual: spec

Fecha: 2026-11-10 · Estado: cerrado

## Objetivo

Mejorar `LoginForm` en tres frentes: (A) poder mostrar u ocultar la contraseña del primer paso y la contraseña nueva con su confirmación; (B) mostrar en el paso `mfaSetup` un QR del TOTP generado en el navegador, sin servicio externo; (C) dar formato y armonía visual a `mfaSetup` y a todo el formulario. Motivo (captura del usuario, 10/11/2026): la clave se corta a mitad, la URI `otpauth://` cruda es ilegible y los formatos no son armónicos.

**Cambia una decisión cerrada:** la decisión 2 del spec `2026-11-10-cognito-srp-login-design.md` («solo la URI y el secreto en texto, sin librería de QR») queda reemplazada por la decisión 1 de este documento. Los criterios 4 y «Fuera de alcance» («QR del TOTP») de ese spec dejan de valer en lo que se opongan a este.

## Decisiones del usuario (10/11/2026)

1. **Librería del QR: `qrcode-generator` 2.0.4.** MIT, sin dependencias, modificada el 07/08/2025, 555 kB descomprimido (no es el peso en el bundle); datos verificados con `npm view` el 10/11/2026. Descartada `qrcode` 1.5.4: 3 dependencias y salidas SVG como cadena, que empujan a `innerHTML`. El SVG se pinta con elementos de React usando `getModuleCount()` e `isDark()`: sin `innerHTML` y sin `data:`, por lo que la CSP de infra no cambia. Si algo de los criterios 9 a 14 no es viable, el developer se **para y lo dice** (vuelve a la puerta humana).
2. **La URI `otpauth://` cruda desaparece de la pantalla.** No se renderiza como texto ni como enlace; la URI solo se usa para generar el QR. Quedan el QR y la clave en texto con «Copiar clave».
3. **Mostrar u ocultar contraseña:** estado **independiente por campo** (en `newPassword`, un botón en la contraseña nueva y otro en la confirmación). Botón `type="button"` con icono Material Symbols `visibility` / `visibility_off` con `aria-hidden="true"`, `aria-label` por `t()` en `es` y `en` y `aria-pressed`; el nombre **no cambia** al alternar (así no se anuncia al revés). Se ocultan al cambiar de paso, al enviar y al desmontar; **sin temporizador** (WCAG 2.2.1) y sin ocultar al perder el foco. El foco permanece en el botón al alternar.

## Estado actual (leído del código, para contraste)

- `src/components/LoginForm.js`: pasos `credentials`, `newPassword`, `mfaSetup`, `totp`. Los campos de contraseña son `type="password"` fijo, sin `name`, con `autoComplete` `current-password` / `new-password`. En `mfaSetup` muestra el secreto en `<code className="break-all">` (se corta en cualquier carácter), un botón «Copiar clave» (`ButtonAlternative` centrado, solo si hay `navigator.clipboard.writeText` y no hay reintento) y la URI `otpauth://` completa en otro `<code className="break-all">`. Orden actual: ayuda, clave, copiar, URI, formulario con el código.
- Los colores están escritos como hexadecimales de la paleta (`#4B644A`, `#0C1811`, `#F9FBFA`, `#15B659`); `DESIGN.md` los define como tokens y dice que hoy se usan como hex arbitrarios. Iconos: Material Symbols Outlined por ligadura, con `aria-hidden="true"` (patrón de `ButtonAlternative`). Fuentes: Amaranth (títulos) y Sen (resto); no se añade una tercera.
- CSP de infra (`sigmetum-infra/modules/amplify/main.tf`, Report-Only): `script-src 'self'`; `img-src 'self'` + `var.s3_url` + `https://*.s3.<región>.amazonaws.com` (**sin `data:`**); `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`. Un `<svg>` inline no está sujeto a `img-src`.
- `package.json`: `amazon-cognito-identity-js` ya añadió unos 67 kB al bundle único (M16 abierto en `docs/09`). No hay librería de QR.

## Supuestos declarados

1. El QR codifica exactamente la URI `otpauth://` que ya expone `useCognitoLogin` (`login.otpUri`); el hook no cambia su contrato.
2. «Armonía visual» significa coherencia con `DESIGN.md` (paleta, tipografías, plano por defecto, bordes finos) y con el resto de campos y botones del propio `LoginForm`; no es un rediseño de marca.
3. No se toca la decisión pendiente de A1 (contraste del verde de marca): el texto va en `ink` y los controles nuevos usan colores ya existentes.
4. Textos nuevos por `t()` con claves en `es` y `en`.

## Criterios de aceptación

### De código

**A. Mostrar u ocultar contraseña**

1. En `credentials` (contraseña) y en `newPassword` (contraseña nueva y confirmación), cada campo tiene su botón `<button type="button">` con icono `visibility` / `visibility_off` (`aria-hidden="true"`). Pulsarlo no envía el formulario (test).
2. Nombre accesible por `t()` en `es` y `en`, fijo, más `aria-pressed` (`true` cuando la contraseña se ve); el nombre no incluye el valor de la contraseña. Test por rol, nombre y `aria-pressed` en ambos idiomas.
3. Estado independiente por campo: alternar la contraseña nueva no cambia la confirmación, y al revés (test).
4. Al alternar, `type` pasa de `password` a `text` y vuelve, el valor se conserva, el foco **permanece en el botón** (decisión del usuario, 10/11/2026: es lo habitual con `aria-pressed` y permite alternar varias veces con teclado; no pasa a `body`) y el campo conserva su valor y la posición del cursor (`selectionStart`/`selectionEnd`) al volver a él. Tests con `user-event`: valor, `document.activeElement === botón` y `selectionStart` del campo.
5. Pulsar Enter en el campo envía el formulario como antes y no alterna la visibilidad. Orden de Tab: campo, su botón, siguiente campo, su botón, botón de envío (test).
6. Vuelve a `type="password"` al cambiar de paso, al enviar (también si falla) y al desmontar. Sin temporizador ni ocultación al perder el foco (test con temporizadores falsos y `blur`).
7. No aplica al código TOTP (`one-time-code`) ni al secreto del MFA.
8. Se mantienen: contraseña solo en memoria, sin `name`, `autoComplete` `current-password` / `new-password`, sin `console` ni `Storage` (test que espía ambos). Alternar el `type` no cambia `autoComplete` ni `id`; el efecto real sobre gestores de contraseñas es **(por confirmar)**, no automatizable.
9. El botón lleva `.focus-ring`.

**B. QR del MFA**

10. En `mfaSetup` (y no en `retrying`) se muestra un QR de la URI, generado localmente con `qrcode-generator`. Test: **no se hace ninguna petición** (`fetch` espiado) ni se carga imagen remota.
11. SVG inline construido con elementos de React a partir de `getModuleCount()` e `isDark()`; sin `dangerouslySetInnerHTML`, `innerHTML`, `data:` ni `<img src>` (`grep` y `npm run quality`).
12. El QR escanea: el contenido codificado es **exactamente** la URI `otpauth://` esperada. Test que reconstruye la matriz del SVG pintado y la compara módulo a módulo con la de `qrcode-generator` para esa URI, con nivel de corrección de errores **M o superior**.
13. Quiet zone de al menos 4 módulos, fondo claro (`surface` o blanco) y módulos `ink`, QR centrado, tamaño que no baje de unos 160 px de lado ni desborde un móvil de 320 px **(valor exacto lo propone el architect)**. Descodificarlo con una app TOTP real es verificación manual **(por confirmar)**.
14. Accesibilidad: `role="img"` con `aria-label` por `t()` que **no contiene** el secreto ni la URI (test). Alternativa siempre disponible: la clave en texto y «Copiar clave».
15. Dependencia: import mínimo (comprobar si se puede importar sin arrastrar el paquete entero); peso real en el bundle medido con `npm run build` antes y después y anotado bajo M16 en `docs/09`; `npm audit --omit=dev` sin avisos nuevos, nunca `npm audit fix --force`; justificación en `docs/02-tecnologias.md` y `docs/guias/seguridad.md`.
16. La URI cruda no aparece en pantalla (ni texto ni enlace ni `title` ni `aria-label`). Test: no hay texto `otpauth://` en el documento.

**C. Formato y armonía visual**

17. Orden en `mfaSetup`: ayuda, clave, «Copiar clave», QR, campo de código, botón de verificar (orden del DOM = orden de Tab y de lectura).
18. La clave se muestra en grupos de 4 caracteres, con ajuste de línea solo entre grupos (nunca a mitad de grupo), en monoespaciado del sistema (sin tercera familia web). «Copiar clave» copia el secreto **sin espacios**. Test: texto copiado igual a `login.secret` y clave visible en grupos de 4.
19. «Copiar clave» queda junto a la clave, con altura, borde, tipografía y alineación del resto de botones del formulario (`h-10 sm:h-12`, `rounded-xl`, `focus-ring`); anuncio `role="status"` sin cambios.
20. Jerarquía y espaciado: `h1` y `h2` como hoy; una sola escala de espaciado entre bloques y márgenes laterales en todos los pasos; etiquetas en negrita, ayudas en texto normal; cualquier valor nuevo se justifica en `DESIGN.md`.
21. Contraste: texto normal 4,5:1 o más, bordes e iconos 3:1 o más (`accesibilidad.md`, A1); sin hexadecimales fuera de la paleta de `DESIGN.md` (`grep` del diff).
22. Estados de carga, error y éxito coherentes en todos los pasos: error en `role="alert"`, carga y copiado en `role="status"`; el botón de envío se desactiva con `busy`.
23. Responsive: sin desplazamiento horizontal a 320 px en los cuatro pasos; clave, QR y botones caben. Playwright con `fetch` interceptado, a 320, 375 y 1280 px, en `es` y `en`, con captura antes y después **(manual)**.
24. Todos los textos nuevos por `t()` con clave en `es` y `en` (`translations.test.js` pasa).
25. Seguridad: contraseña, código TOTP, secreto, URI y `Session` solo en memoria, sin `console`, almacenamiento ni URL; ni URI ni secreto en `aria-label`, `title`, `id` o `data-*`.
26. Verificación: `npm test -- --maxWorkers=2` (`npm test` a secas falla por memoria del equipo: es del entorno), `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check`, `npm run docs:gate`; `npm run agentes:test` solo si se toca `plugins/`. TDD: cada criterio parte de un test que falle por el motivo correcto.

### De documentación

1. `docs/02-tecnologias.md`: `qrcode-generator` con justificación, peso medido y resultado de `npm audit`.
2. `docs/05-componentes.md` (`LoginForm`), `docs/07-i18n-y-estilos.md` (claves y estilos) y `docs/08-guia-desarrollo.md` (tests nuevos y prueba con Playwright).
3. `docs/guias/accesibilidad.md` (A4/A5: botón con `aria-pressed` y alternativa al QR), `docs/guias/seguridad.md` (QR local, sin servicio externo, URI y secreto solo en memoria, dependencia) y `DESIGN.md` (clave en grupos, botón de mostrar contraseña y QR si fijan valores nuevos).
4. `docs/09-estado-actual-y-deuda-tecnica.md`: fecha de hoy, cifras recalculadas solo aquí, M16 con el peso añadido; lo no comprobado (gestores de contraseñas, lector de pantalla, escaneo real) como **(por confirmar)**.
5. Nota en `2026-11-10-cognito-srp-login-design.md` de que su decisión 2 queda reemplazada por este documento (la hace el tester).
6. Aviso `docs/specs/*-aviso-pr.md` (se tocan `LoginForm.js` y `package.json`, áreas de contrato) con `Integración: sin impacto — <motivo>`.

## Fuera de alcance

- Cambios en `useCognitoLogin`, `session.js`, `api.js`, el flujo SRP o los pasos del reto (salvo no exponer la URI como texto).
- Otros métodos de MFA, copiar o descargar la URI o el QR.
- Contraste del verde de marca (A1), rediseño de marca, tercera familia tipográfica.
- Cambios de CSP en infra.
- Dividir el bundle con `React.lazy` (M16), más allá de medir el efecto.
- Mostrar contraseña en otras pantallas.

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: no lo afecta (ninguna petición nueva).
- `docs/integracion/para-infra.md`: no lo afecta (SVG inline: `img-src` y `script-src` no cambian; `style-src` ya admite `'unsafe-inline'`).
- Áreas de contrato tocadas: `src/components/LoginForm.js` y `package.json`: aviso de PR obligatorio.

## Preguntas abiertas

Ninguna. Las cinco preguntas iniciales (librería, URI, estado por campo, presentación del botón, ocultado automático) están resueltas en «Decisiones del usuario».

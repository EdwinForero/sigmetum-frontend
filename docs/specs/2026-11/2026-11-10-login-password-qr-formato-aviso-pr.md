# Aviso para PR: login con contraseña visible a petición, QR del MFA y clave en grupos

Spec: `docs/specs/2026-11/2026-11-10-login-password-qr-formato-design.md`
Plan: `docs/specs/2026-11/2026-11-10-login-password-qr-formato-plan.md`

## Qué cambia

- `src/components/LoginForm.js` (área de contrato): botón de mostrar u ocultar en los tres campos de contraseña (se ocultan al enviar y al cambiar de paso); el paso `mfaSetup` pinta un QR generado en el navegador, muestra la clave en grupos de 4 y **ya no pinta la dirección `otpauth://`**; los campos de contraseña llevan `spellCheck={false}`, `autoCapitalize="none"` y `autoCorrect="off"`. Sin cambio de peticiones, cabeceras, cuerpos ni del manejo del token.
- `src/components/QrCode.js` y `src/utilities/formatSecret.js` (nuevos): el QR es un SVG en línea (sin `innerHTML`, `data:` ni `<img>`) y `formatSecret` solo formatea para pintar.
- `package.json` y `package-lock.json` (área de contrato): dependencia nueva `qrcode-generator` 2.0.4 (MIT, sin dependencias ni scripts de instalación). El JavaScript de producción crece (medida en M16 de `docs/09` y en `docs/02`); `npm audit --omit=dev` da las mismas 3 de siempre, sin nuevas. El bundle conserva cadenas `data:` de salidas GIF del paquete que no se usan (no es un fallo).
- `src/index.css`: `input::-ms-reveal { display: none; }` y la clase `.focus-heading` (subrayado en lugar de contorno para el `<h2>` de cada paso, que recibe foco programático). `src/languages/{es,en}/translation.json`: claves nuevas `login.qrLabel`, `login.showPassword`, `login.showNewPassword` y `login.showConfirmPassword`; `login.mfaSetupHelp` menciona el QR; se retira `login.otpUriLabel`; `login.copyFailed` avisa de que los espacios no forman parte de la clave. `scripts/quality-check.mjs`: `QrCode.js` y `formatSecret.js` entran en la regla que prohíbe `console.*`.

Integración: sin impacto — QR generado en el navegador como SVG en línea: sin peticiones nuevas, sin data: ni img-src, la CSP de infra no cambia y el contrato con Cognito y con el backend tampoco

## Qué debe hacer el otro repositorio

- **`sigmetum-infra`:** nada. La CSP no cambia (el QR no es una imagen ni usa `data:`; sin `img-src` nuevo).
- **`sigmetum-backend`:** nada.
- **Vuelta atrás:** revertir el commit; no hay migraciones ni variables nuevas.

## Por confirmar

- A mano: escaneo real del QR con una aplicación TOTP, lector de pantalla, gestores de contraseñas (pueden solapar su icono con el botón de mostrar), foco al pulsar con el ratón en Safari, modo oscuro forzado y contraste alto de Windows con el QR, QR más denso con correos largos (peor caso medido: 340 bytes y 73 módulos), copiar a mano la clave con espacios y el efecto de `::-ms-reveal` en Edge.

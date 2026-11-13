# Aviso para PR: fixes y deuda variada (frontend, ciclo 4)

Fecha: 13/11/2026 · Spec: `2026-11-13-fixes-y-deuda-varia-design.md` · Plan: `2026-11-13-fixes-y-deuda-varia-plan.md` (el anexo de la puerta 2 manda)

Áreas de contrato tocadas: `package.json` (solo baja `--max-warnings` de 18 a 16 en el script `lint`: sin dependencias nuevas ni cambios de scripts). `src/services/api.js`, `src/config/env.js` y `src/config/assets.js` no cambian.

Integración: sin impacto — solo baja el tope de avisos de ESLint

(Aun así, `docs/integracion/para-backend.md` se actualizó por la parte cliente de M31: el `400` de `/send-email` y de `/add-recipient` con `\p{Cf}` y que la lista de destinatarios solo trae entradas válidas y sin duplicados.)

## Qué cambia

1. **B77:** `normalizePath` (`src/config/routes.js`) pasa la ruta a minúsculas y quita la barra final; `App` y `Sidebar` lo usan. `/EXPLORE` y `/Explore` se pintan como `/explore` y `/MANAGE-DATA` como `/manage-data`; solo se compara, no se redirige.
2. **B73:** el enlace «aquí/here» del banner de cookies es un `Link` (ya no recarga la página); baja el tope de avisos de ESLint de 18 a 16.
3. **B48:** las dos «i» de `/explore` tienen nombre distinto («Información: Descargar glosario» y «Información: Descargar resultados»).
4. **B54:** `src/config/layout.js` (`NAV_HEIGHT_PX`) es la única fuente de la altura de la barra (token `nav` de Tailwind e `InfoButton`).
5. **B80:** el error de validación del panel de destinatarios se vuelve a montar en cada rechazo (`key`), para que con Enter se anuncie otra vez; con lector de pantalla real, por confirmar.
6. **B76:** `DialogSpecies` se pinta en un portal en `document.body` (primer portal de la aplicación); el fondo ya no se recorta si se abre durante la aparición de la tarjeta.
7. **F2.2 (M31, parte cliente):** `validateRecipientEmail` y `validateContact` rechazan los caracteres de formato Unicode (`\p{Cf}`), como el servidor.
8. **B78:** solo documentación (11 px bajo 360 px como decisión medida).

## Qué debe hacer el otro repositorio

- **Backend (`sigmetum-backend`):** el backend de este ciclo (commit propio, otro repositorio) cambia el contrato de forma **compatible y más estricta**: `400 email is not valid` también con `\p{Cf}` en `/send-email` y `/add-recipient`, la lista de `/list-recipients` solo trae entradas válidas y sin duplicados (M30 y M32) y el aviso por correo sustituye cada `\p{Cf}` por `?` (M31). **No condiciona el orden de despliegue:** el frontend nuevo funciona con el backend viejo (solo pierde que el servidor rechace esos caracteres, que el cliente ya rechaza antes) y un frontend viejo contra el backend nuevo recibe el `400` con el aviso genérico.
- **Infra (`sigmetum-infra`):** sin cambios.

## Por confirmar

- B80 con un lector de pantalla real (NVDA, JAWS o VoiceOver): no se afirma que no haya doble anuncio.
- Safari y Firefox con el portal de `DialogSpecies` y el 11 px bajo 360 px.

# Aviso para PR: M20, deuda menor del login con Cognito

Áreas de contrato tocadas: `src/services/api.js`.

## Qué cambia

El backend sigue recibiendo `Authorization: Bearer <access_token>` y las rutas no cambian. Cambia **cuándo** el frontend renueva el token:

- Un `401` tardío cuyo token enviado ya no es el guardado (otra llamada renovó la sesión) se reintenta una vez con el token actual, sin otra llamada a `/oauth2/token`. Menos refrescos redundantes.
- Un `401` sin ningún token guardado (sesión borrada en otra pestaña) no renueva: borra la sesión, redirige a `/login` y lanza el `401`. Con varias llamadas simultáneas la redirección se hace una sola vez.
- Al renovar, un fallo de red, un `5xx`, un `429` o un `4xx` sin `error` en el cuerpo conservan la sesión y no redirigen. El fallo de red sube como `type: 'network'`; los demás, como `type: 'auth_unavailable'`, `status: 503`, `message: 'Authentication service unavailable'` (antes propagaban el `type` y el `status` reales de Cognito).
- `ProtectedRoute` en estado de servicio no disponible añade el botón «Cerrar sesión»; `FileUpload` muestra el diálogo de error ante ese fallo. Solo cierran la sesión un `4xx` (no `429`) con `error` en el cuerpo, la falta de `refresh_token`, la falta de configuración o un `200` sin `access_token`.
- `logout()` sin `VITE_COGNITO_DOMAIN` borra la sesión y va a `/`.
- `AuthCallback` quita `code`, `state` y `error` de la URL con `replace` al montar.

## Qué debe hacer el otro repositorio

- Backend: nada. `docs/integracion/para-backend.md` solo ajusta la descripción de la renovación.
- Infra: nada; se siguen usando `/oauth2/token`, `/logout` y `VITE_COGNITO_*`. Si se puede, confirmar contra el pool real qué devuelve Cognito para un refresco inválido (`400 invalid_grant` esperado) y si responde `5xx` o `429` **(por confirmar)**.

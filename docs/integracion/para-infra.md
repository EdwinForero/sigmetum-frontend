# Integración con la infraestructura: lo que necesita el frontend

Documento para quien mantiene `sigmetum-infra`. Explica **qué necesita el frontend para compilar, desplegarse y funcionar** en cada entorno.

- Lo verificado contra el código de Terraform está marcado como **(verificado)**. Lo que depende de la cuenta real de AWS, como **(por confirmar)**.
- Fecha de la verificación: 30/09/2026. Frontend: rama `feature/sigmetum_front_v2`. Infraestructura: commit `19bdde3`.
- Los secretos de `terraform.tfvars` no se han leído; solo se comprobaron los nombres de las variables.

## 1. Resumen: qué falta para que el frontend funcione

Ordenado por impacto. Cada punto se explica más abajo.

| Id | Problema | Efecto | Estado |
|---|---|---|---|
| **I1** | Amplify define `VITE_API_URL`, pero el frontend lee `VITE_BASE_URL`, `VITE_API_PREFIX` y `VITE_S3_URL` | La web compilada llama a `http://localhost:8000` y no funciona | **Resuelto** en rama `feature/testing` de infra |
| **I2** | El bucket bloquea el acceso público y no hay CloudFront, pero el frontend carga logos, banner y glosario directamente desde la URL del bucket | Las imágenes y el PDF dan 403 | Abierto |
| **I3** | No hay regla de reescritura de la SPA en Amplify | Recargar o abrir un enlace directo a `/explorar` da 404 | **Resuelto** en rama `feature/testing` de infra |
| **I4** | En `dev`, `backend_url` es `http://…`, pero Amplify sirve el frontend por HTTPS | El navegador bloquea las peticiones (contenido mixto) | **Baja — aplazado hasta tener dominio dev** |
| **I5** | `app_env_vars` no incluye `ALLOWED_ORIGIN`, `ADMIN_USERNAME` ni `ADMIN_PASSWORD`, que el backend exige al arrancar | El backend no arranca; y aunque arrancara, CORS bloquearía al frontend | **Parcialmente resuelto** — plantillas `.example` actualizadas; `ALLOWED_ORIGIN` se rellena en la segunda vuelta de `apply` tras conocer la URL de Amplify |
| **I6** | El health check de Beanstalk apunta a `/`, pero el backend solo responde en `/healthcheck` | El entorno puede figurar como no saludable (por confirmar) | **Resuelto** en rama `feature/testing` de infra |
| **I7** | No existe nada que suba los recursos estáticos (`assets/…`) al bucket ni lo documente | Faltan logos y banner | Abierto |

## 2. Compilación y despliegue

**Cómo se despliega hoy (verificado):** el módulo `modules/amplify` crea una app de Amplify conectada a GitHub, con despliegue automático en cada push a una rama.

| Entorno | Rama | Comentario |
|---|---|---|
| `dev` (preproducción) | `feature/testing` | La rama tiene que contener el código migrado a Vite; si no, el build falla |
| `prod` | `master` | Igual |

**Qué necesita la compilación del frontend:**

| Aspecto | Valor |
|---|---|
| Herramienta | Vite 6 (ya no es Create React App) |
| Node | **20 o superior** (Vite 6 y las pruebas funcionan con Node 20). La imagen de Amplify puede traer otra versión por defecto: fíjala en `preBuild` (por ejemplo con `nvm use 20`) **(por confirmar)** |
| Instalación | `npm ci` |
| Compilación | `npm run build` |
| Carpeta de artefactos | `dist` (el `build_spec` actual ya lo dice: coincide) |
| Caché | `node_modules/**/*` (ya definida) |
| Tests | `npm test` (Vitest, unos segundos). Conviene ejecutarlos en `preBuild` para no desplegar una versión rota |

## 3. Variables de entorno del frontend

Vite **incrusta las variables en el JavaScript al compilar**, y solo las que empiezan por `VITE_`. Cambiar una exige un nuevo despliegue. Son públicas: no pongas secretos.

| Variable | Obligatoria | `dev` | `prod` |
|---|---|---|---|
| `VITE_BASE_URL` | Sí | URL **HTTPS** del backend de dev (ver I4) | `https://backend.sigmetum-a.org` |
| `VITE_API_PREFIX` | Sí | `/api/v1` | `/api/v1` |
| `VITE_S3_URL` | Sí | URL pública desde la que se sirven los `assets/…` (ver sección 5) | Igual, para prod |
| `VITE_CAROUSEL_IMAGE_KEYS` | No | Vacía (el carrusel no se usa) | Vacía |

**Situación actual (verificado, rama `feature/testing` de infra):** `modules/amplify/main.tf` define las siguientes variables en app y rama:

```hcl
environment_variables = {
  VITE_BASE_URL   = var.backend_url   # sin barra final y sin /api/v1
  VITE_API_PREFIX = "/api/v1"
  VITE_S3_URL     = var.s3_url        # vacío hasta resolver I2/C2
  NODE_ENV        = var.environment
}
```

Resuelve I1. La descripción de `backend_url` en `variables.tf` también se corrigió (antes hablaba de `REACT_APP_API_URL`).

## 4. Lo que el frontend necesita del backend desplegado

El frontend y el backend se despliegan por separado. Para que se entiendan:

| Requisito | Detalle | Estado |
|---|---|---|
| HTTPS en el backend | El frontend se sirve por HTTPS; el navegador bloquea peticiones `http://` desde una página `https://` | **`dev` incumple** (I4). `prod` usa `https://backend.sigmetum-a.org` |
| `ALLOWED_ORIGIN` | El backend usa CORS con **un único origen exacto**: debe ser el del frontend de ese entorno | **No está en `app_env_vars`** (I5) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | `ADMIN_PASSWORD` es un **hash bcrypt**. El backend aborta el arranque si faltan (`config/validateEnv.js`) | **No están en `app_env_vars`** (I5) |
| Variables ya definidas | `PORT`, `AWS_REGION`, `AWS_BUCKET_NAME`, `JWT_SECRET`, `JWT_EXPIRATION`, `EMAIL`, `EMAIL_PASSWORD` | Correcto |
| Health check | El backend responde `200 ok` en `/healthcheck`. En `/` devuelve 404 | `modules/beanstalk` usa `HealthCheckPath = "/"` (I6) |
| Rate limit del login | 10 intentos cada 15 min **por IP**. Detrás del balanceador, sin `trust proxy`, todos los usuarios pueden compartir la misma IP | Por confirmar; revisar con el backend |

**Orígenes para `ALLOWED_ORIGIN`:**

| Entorno | Valor |
|---|---|
| `dev` | La URL de la rama en Amplify. El output `branch_url` construye `https://${var.branch}.${domain}`; con una rama `feature/testing`, Amplify sustituye la `/` por `-`, así que la URL real sería `https://feature-testing.<id>.amplifyapp.com` **(por confirmar)**. Conviene corregir el output |
| `prod` | El dominio final del frontend. `modules/dns` solo crea `backend.sigmetum-a.org`: **falta el dominio del frontend** (por ejemplo `sigmetum-a.org` o `www.`, asociado a la rama `master` con `aws_amplify_domain_association`) |

Como el origen permitido depende de la URL de Amplify, que se conoce tras crear la app, hay dos vueltas de `terraform apply`, o bien se usa un dominio propio desde el principio.

## 5. Recursos estáticos que el frontend pide al bucket

El frontend arma las URLs como `VITE_S3_URL` + `/` + clave (`assetUrl` en [src/config/assets.js](../../src/config/assets.js)) y las carga **directamente desde el navegador, sin autenticación**.

| Clave (ruta en el bucket) | Uso |
|---|---|
| `assets/logos/app-logo.jpg` | Logo de la cabecera y favicon |
| `assets/banners/home-banner.jpg` | Imagen de fondo de la portada |
| `assets/about/about-us.jpg` | Imagen de "Sobre nosotros" |
| `assets/documents/glossary.pdf` | Glosario descargable en el explorador |
| `assets/logos/UMA.jpg` | Logo de la Universidad de Málaga |
| `assets/logos/other-universities/UAL.jpg`, `UGR.jpg`, `UHU.jpg`, `UJA.jpg` | Logos de otras universidades |
| `assets/logos/collaborators/EFYVE.jpg`, `GEOSPACE.jpg`, `MaFo.jpg` | Logos de entidades colaboradoras |

**Problema (I2, verificado):** `modules/storage` activa `block_public_acls`, `block_public_policy`, `ignore_public_acls` y `restrict_public_buckets`. Con eso, ninguna de esas URLs es accesible desde el navegador. No hay CloudFront en el repositorio.

**Opciones para resolverlo:**

| Opción | Ventaja | Inconveniente |
|---|---|---|
| **A. CloudFront con OAC delante del bucket, solo para `assets/*`** (recomendada) | El bucket sigue privado; caché global; `VITE_S3_URL` apunta a la distribución | Añade un módulo nuevo |
| B. Meter los recursos en la carpeta `public/` del frontend | Sin bucket ni CloudFront para esto; se versionan con el código | Los PDF e imágenes pesados engordan el repositorio |
| C. Política de bucket que permita lectura pública solo de `assets/*` | La más simple | Hay que relajar el bloqueo de acceso público, que hoy es una garantía de seguridad |

Los datos (`data/…`) y las imágenes de la galería (`gallery/…`) **no** se sirven por esta vía: el backend los entrega (JSON directo o URLs prefirmadas de 1 hora). Así que el acceso público solo hace falta para `assets/*`.

**I7:** nada en el repositorio sube esos ficheros al bucket. Hace falta documentar y automatizar el proceso (por ejemplo, un `aws s3 sync assets/ s3://<bucket>/assets/` tras el `apply`) o elegir la opción B.

## 6. Reglas de Amplify

### Reescritura de la SPA (I3)

El frontend es una SPA con enrutado en el navegador (`/explorar`, `/login`, `/sobre-nosotros`...). Sin esta regla, abrir o recargar una de esas URLs da 404.

```hcl
custom_rule {
  source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|pdf)$)([^.]+$)/>"
  target = "/index.html"
  status = "200"
}
```

Es la regla para SPA que recomienda la documentación de Amplify, ampliada con las extensiones `woff2`, `webp` y `pdf`. Se añade al recurso `aws_amplify_app`.

### Cabeceras de caché

Vite genera nombres con hash (`assets/index-a1b2c3.js`).

| Ruta | Caché recomendada |
|---|---|
| `/index.html` | `no-cache` (debe revalidarse siempre) |
| `/assets/*` (los ficheros con hash que genera Vite, no los del bucket) | `public, max-age=31536000, immutable` |

### Seguridad (opcional)

El frontend carga recursos de estos orígenes; si se añade una política `Content-Security-Policy`, hay que permitirlos:

| Origen | Para qué |
|---|---|
| `fonts.googleapis.com`, `fonts.gstatic.com` | Tipografías (Amaranth, Sen) |
| La URL de `VITE_S3_URL` | Logos, banner y glosario |
| La URL de `VITE_BASE_URL` | Llamadas a la API (`connect-src`) |
| URLs prefirmadas de S3 (`*.s3.<región>.amazonaws.com`) | Fotos de la galería (`img-src`) |
| `ipni.org`, enlaces de la política de cookies | Solo enlaces externos, no cargan recursos |

El frontend no incluye secretos; el token de sesión se guarda en `localStorage`.

## 7. Dominios y región

| Elemento | Situación |
|---|---|
| Región de `sigmetum-infra` | `eu-west-1` (verificado en `providers.tf`) |
| Región en el ejemplo del frontend | El `.env.example` mostraba un bucket de `eu-west-3`, que pertenece a la infraestructura antigua (`s3-sigmetumtest`). Sustituirlo por la URL real del entorno |
| `index.html` del frontend | Mantiene un favicon fijo hacia el bucket antiguo; el código lo sustituye al cargar. Se eliminará |
| DNS | Solo `backend.sigmetum-a.org` (CNAME al endpoint de Beanstalk). Falta el del frontend |
| Ejemplo de `terraform.tfvars` de dev | Está desactualizado: `AWS_REGION = "eu-west-3"`, `AWS_BUCKET_NAME = "sigmetum-dev"` (el bucket real es `sigmetum-app-dev`) y claves `AWS_ACCESSKEYID` (el backend usa el rol IAM de la instancia y no lee claves) |

## 8. Comprobación tras desplegar

1. `https://<dominio>/` carga la portada con logos y banner, sin errores en la consola del navegador.
2. Abrir directamente `https://<dominio>/explorar` y recargar: no da 404.
3. En la pestaña Red, las llamadas van a `VITE_BASE_URL` (no a `localhost`), por HTTPS y sin errores de CORS.
4. `/explorar` muestra especies (la API y los datos de `data/active/` funcionan).
5. `/login` con el usuario administrador entra en "Cargar archivos".
6. El botón "Descargar glosario" abre el PDF.
7. El backend responde `200 ok` en `https://<backend>/healthcheck`, y el estado del entorno de Beanstalk es saludable.

## 9. Reversión

- **Frontend:** en la consola de Amplify, volver a desplegar una compilación anterior de la rama (no hace falta tocar Terraform ni el repositorio).
- **Variables de entorno:** si un cambio de `VITE_*` rompe la web, se corrige en Terraform y se relanza la compilación, porque los valores están incrustados en el JavaScript.
- **Datos:** el frontend no guarda datos propios; nada que revertir.

## 10. Cómo mantener este documento

- Se actualiza cuando cambien las variables `VITE_*`, el `build_spec`, la lista de recursos de `assets.js` o los dominios.
- Las discrepancias I1 a I7 se quitan de la sección 1 a medida que se resuelvan en `sigmetum-infra`.

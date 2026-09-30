# sigmetum-frontend

Frontend de **SIGMETUM-A**, la base de datos interactiva de las series de vegetación de Andalucía. Es un proyecto de investigación liderado por la Universidad de Málaga con las universidades de Almería, Granada, Huelva y Jaén.

La web permite al público explorar las especies características y sus atributos ecológicos (provincia, piso bioclimático, ombrotipo, serie de vegetación...) y a los investigadores cargar y versionar los datos.

React 18 · Vite · Tailwind CSS · i18next (ES/EN). Consume la API de `sigmetum-backend` y los recursos de S3.

## Instalación

Requisitos: Node.js 20 y el backend en marcha (en local o desplegado).

```bash
npm ci
cp .env.example .env   # rellena las variables (ver abajo)
npm run dev            # http://localhost:3000
```

| Variable | Ejemplo |
|---|---|
| `VITE_BASE_URL` | `http://localhost:8000` |
| `VITE_API_PREFIX` | `/api/v1` |
| `VITE_S3_URL` | URL pública del bucket o de CloudFront |

`npm run build` genera la versión de producción en `dist/` y `npm test` ejecuta los tests (Vitest).

## Contenido del repositorio

```
public/        HTML base, favicon y manifest
src/
  pages/       Una página por ruta (inicio, explorar, galería, administración...)
  components/  Componentes reutilizables
  services/    Cliente HTTP de la API
  config/      Variables de entorno y recursos de S3
  hooks/       Hooks propios
  utilities/   Funciones auxiliares (exportar a Excel, formato, orden)
  languages/   Traducciones es / en
docs/          Documentación técnica
.claude/       Plugins y skills de Claude Code compartidos por el equipo
```

## Documentación

Toda la documentación técnica está en [`docs/`](docs/README.md): arquitectura, API, páginas, componentes, guía de desarrollo y estado actual con la deuda técnica.

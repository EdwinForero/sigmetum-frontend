// Comprueba que la documentación sigue el ritmo del código.
// Uso: npm run docs:check            (sale con código 1 si hay algo desactualizado)
//      npm run docs:check -- --metrics  (imprime las métricas reales para pegarlas en el documento 09)
// Las reglas y lo que NO se comprueba automáticamente están en docs/MANTENIMIENTO.md.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');
const posix = (file) => file.split(sep).join('/');

const walk = (dir) =>
  readdirSync(join(ROOT, dir)).flatMap((name) => {
    const path = posix(join(dir, name));
    return statSync(join(ROOT, path)).isDirectory() ? walk(path) : [path];
  });

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isTest = (file) => file.endsWith('.test.js');
const sourceFiles = walk('src').filter((file) => file.endsWith('.js') && !isTest(file) && file !== 'src/setupTests.js');
const testFiles = walk('src').filter(isTest);

const docFiles = ['README.md', ...walk('docs').filter((file) => file.endsWith('.md'))];
const docs = Object.fromEntries(docFiles.map((file) => [file, read(file)]));

const flatten = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) =>
    value !== null && typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );

const metrics = () => ({
  'Archivos de código (sin tests)': sourceFiles.length,
  'Páginas': sourceFiles.filter((file) => file.startsWith('src/pages/')).length,
  'Componentes': sourceFiles.filter((file) => file.startsWith('src/components/')).length,
  'Archivos de test': testFiles.length,
  'Claves de traducción (por idioma)': flatten(JSON.parse(read('src/languages/es/translation.json'))).length,
});

if (process.argv.includes('--metrics')) {
  const lines = [...sourceFiles, ...testFiles].reduce((sum, file) => sum + read(file).split('\n').length, 0);
  console.log({ ...metrics(), 'Líneas de JS (con tests)': lines });
  console.log('El número de tests sale de `npm test`.');
  process.exit(0);
}

const results = [];
const check = (name, problems) => results.push({ name, problems });

// 1. Enlaces internos y anclas
const slug = (heading) =>
  heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');

const anchorsOf = (text) => {
  let inFence = false;
  const anchors = new Set();
  for (const line of text.split('\n')) {
    if (line.startsWith('```')) inFence = !inFence;
    const match = !inFence && line.match(/^#{1,6}\s+(.*)$/);
    if (match) anchors.add(slug(match[1]));
  }
  return anchors;
};

{
  const problems = [];
  for (const [file, text] of Object.entries(docs)) {
    let inFence = false;
    text.split('\n').forEach((line, index) => {
      if (line.startsWith('```')) inFence = !inFence;
      if (inFence) return;
      for (const [, target] of line.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
        if (/^(https?:|mailto:)/.test(target)) continue;
        const [pathPart, anchor] = target.split('#');
        const targetFile = pathPart ? posix(relative(ROOT, resolve(ROOT, dirname(file), pathPart))) : file;
        const where = `${file}:${index + 1}`;
        if (!existsSync(join(ROOT, targetFile))) {
          problems.push(`${where} enlaza a ${target}, que no existe`);
        } else if (anchor && targetFile.endsWith('.md')) {
          const anchors = anchorsOf(docs[targetFile] ?? read(targetFile));
          if (!anchors.has(anchor)) problems.push(`${where} enlaza a ${target}, pero el apartado no existe`);
        }
      }
    });
  }
  check('Enlaces internos y anclas', problems);
}

// 2. Rutas de App.js en 01-arquitectura
{
  const app = read('src/App.js');
  const routes = [...app.matchAll(/<Route[^>]*\spath="([^"]+)"/g)].map((m) => m[1]).filter((path) => path !== '*');
  const doc = docs['docs/01-arquitectura.md'];
  check(
    'Rutas (App.js → 01-arquitectura.md)',
    routes.filter((path) => !doc.includes(`\`${path}\``)).map((path) => `La ruta ${path} no aparece en la tabla de rutas`)
  );
}

// 3. Páginas y componentes
{
  const headingFor = (doc, name) => new RegExp(`^#{2,4}\\s+${escapeRegExp(name)}\\b`, 'm').test(doc);
  const names = (folder) =>
    sourceFiles.filter((file) => file.startsWith(`src/${folder}/`)).map((file) => file.split('/').pop().replace('.js', ''));
  check(
    'Páginas (src/pages → 04-paginas.md)',
    names('pages').filter((name) => !headingFor(docs['docs/04-paginas.md'], name)).map((name) => `Falta la sección de ${name}`)
  );
  check(
    'Componentes (src/components → 05-componentes.md)',
    names('components').filter((name) => !headingFor(docs['docs/05-componentes.md'], name)).map((name) => `Falta la sección de ${name}`)
  );
}

// 4. Utilidades y hooks en 06
{
  const files = sourceFiles.filter((file) => /^src\/(utilities|hooks|services|config)\//.test(file));
  check(
    'Utilidades, hooks, servicios y config (→ 06-utilidades-hooks-config.md)',
    files
      .filter((file) => !docs['docs/06-utilidades-hooks-config.md'].includes(file.split('/').pop().replace('.js', '')))
      .map((file) => `${file} no se menciona`)
  );
}

// 5. Endpoints que usa el código en 03-api
{
  const endpoints = new Set();
  for (const file of sourceFiles) {
    const text = read(file);
    for (const [, path] of text.matchAll(/api\.(?:get|getAuth|post|postAuth|postFormAuth|deleteAuth)\(\s*[`'"]([^`'"?$]+)/g)) {
      endpoints.add(path.replace(/\/$/, ''));
    }
    for (const [, path] of text.matchAll(/API_PREFIX\}(\/[\w/-]+)/g)) endpoints.add(path);
  }
  const doc = docs['docs/03-api.md'];
  check(
    'Endpoints (código → 03-api.md)',
    [...endpoints]
      .filter((path) => !new RegExp(`${escapeRegExp(path)}(?![\\w-])(?!\\/(?!:))`).test(doc))
      .map((path) => `El endpoint ${path} no aparece`)
  );
}

// 6. Variables de entorno
{
  const keys = [...read('.env.example').matchAll(/^([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1]);
  const targets = ['docs/06-utilidades-hooks-config.md', 'docs/08-guia-desarrollo.md', 'docs/integracion/para-infra.md'];
  check(
    'Variables de entorno (.env.example → 06, 08 y para-infra)',
    keys.flatMap((key) => targets.filter((file) => !docs[file].includes(key)).map((file) => `${key} no aparece en ${file}`))
  );
}

// 7. Recursos de S3 (assets.js → para-infra)
{
  const keys = [...read('src/config/assets.js').matchAll(/'(assets\/[^']+)'/g)].map((m) => m[1]);
  // Se compara por nombre de archivo porque el documento agrupa los logos por carpeta.
  check(
    'Recursos de S3 (assets.js → integracion/para-infra.md)',
    keys.filter((key) => !docs['docs/integracion/para-infra.md'].includes(key.split('/').pop())).map((key) => `${key} no aparece`)
  );
}

// 8. Dependencias y scripts
{
  const pkg = JSON.parse(read('package.json'));
  const doc = docs['docs/02-tecnologias.md'];
  const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((name) => !name.startsWith('@testing-library/'));
  const scripts = Object.keys(pkg.scripts);
  const guide = docs['docs/08-guia-desarrollo.md'];
  check('Dependencias (package.json → 02-tecnologias.md)', names.filter((name) => !doc.includes(`\`${name}\``)).map((name) => `${name} no aparece`));
  check(
    'Scripts (package.json → 08-guia-desarrollo.md)',
    scripts.filter((name) => !guide.includes(`npm run ${name}`) && !guide.includes(`npm ${name}`)).map((name) => `El script ${name} no aparece`)
  );
}

// 9. Tests en la tabla de cobertura de 08
{
  const guide = docs['docs/08-guia-desarrollo.md'];
  check(
    'Tests (src → tabla de cobertura de 08-guia-desarrollo.md)',
    testFiles.filter((file) => !guide.includes(file.split('/').pop())).map((file) => `${file} no aparece`)
  );
}

// 10. Métricas: una sola fuente (documento 09) y con valores reales
{
  const problems = [];
  const volatile = /\b\d{1,4}\s+(componentes|páginas|tests|claves|archivos|líneas)\b/i;
  for (const [file, text] of Object.entries(docs)) {
    if (file === 'docs/09-estado-actual-y-deuda-tecnica.md' || file === 'docs/MANTENIMIENTO.md') continue;
    text.split('\n').forEach((line, index) => {
      if (volatile.test(line)) problems.push(`${file}:${index + 1} repite una cifra que solo debe estar en el documento 09`);
    });
  }
  const state = docs['docs/09-estado-actual-y-deuda-tecnica.md'];
  for (const [name, value] of Object.entries(metrics())) {
    const row = state.match(new RegExp(`^\\|\\s*${escapeRegExp(name)}\\s*\\|\\s*(\\d+)\\s*\\|`, 'm'));
    if (!row) problems.push(`09 no tiene la fila "${name}" con el formato | ${name} | N |`);
    else if (Number(row[1]) !== value) problems.push(`09 dice ${row[1]} en "${name}" y el código tiene ${value}`);
  }
  check('Métricas (una sola fuente: 09-estado-actual-y-deuda-tecnica.md)', problems);
}

let failed = 0;
for (const { name, problems } of results) {
  console.log(`${problems.length === 0 ? '✓' : '✗'} ${name}`);
  problems.forEach((problem) => console.log(`    - ${problem}`));
  failed += problems.length;
}
console.log(failed === 0 ? '\nLa documentación está al día.' : `\n${failed} problema(s). Corrige la documentación (ver docs/MANTENIMIENTO.md).`);
process.exit(failed === 0 ? 0 : 1);

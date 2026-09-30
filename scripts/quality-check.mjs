// Puerta de calidad y seguridad del frontend.
// Uso: npm run quality
// Comprueba: patrones prohibidos en el código, secretos, variables públicas sospechosas,
// vulnerabilidades de las dependencias de producción y ESLint.
// Las reglas y su motivo están en docs/guias/seguridad.md y docs/guias/buenas-practicas-frontend.md.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const posix = (file) => file.split(sep).join('/');
const read = (file) => readFileSync(join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');

const walk = (dir) =>
  readdirSync(join(ROOT, dir)).flatMap((name) => {
    const path = posix(join(dir, name));
    return statSync(join(ROOT, path)).isDirectory() ? walk(path) : [path];
  });

const sourceFiles = walk('src').filter((file) => file.endsWith('.js') && !file.endsWith('.test.js') && file !== 'src/setupTests.js');

const run = (command, args) => spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', shell: true });

const results = [];
const check = (name, problems, notes = []) => results.push({ name, problems, notes });

// Deuda conocida: archivos que hoy incumplen una regla y están registrados en docs/09.
// Se listan para que el incumplimiento no pueda extenderse a ningún archivo nuevo.
const KNOWN_DEBT = {
  localStorage: {
    allowed: ['src/services/api.js', 'src/components/LoginForm.js', 'src/components/ProtectedRoute.js'],
    debt: { 'src/components/FileUpload.js': 'M2 (usa fetch directo y lee el token)' },
  },
  insecureUrl: {
    allowed: ['src/config/env.js'],
    debt: { 'src/pages/Home.js': 'enlace http:// a una entidad colaboradora (por confirmar si admite https)' },
  },
};

// Vulnerabilidades altas aceptadas de forma explícita, con su justificación.
const ACCEPTED_ADVISORIES = {
  xlsx: 'Sin arreglo disponible. Solo se usa para escribir ficheros (CSVfunctions.js); los avisos afectan a la lectura de ficheros no confiables.',
};

// 1. Patrones prohibidos
{
  const forbidden = [
    { name: 'HTML sin escapar (dangerouslySetInnerHTML, innerHTML, outerHTML, document.write)', pattern: /dangerouslySetInnerHTML|\.(inner|outer)HTML\s*=|document\.write\(/ },
    { name: 'Ejecución dinámica de código (eval, new Function)', pattern: /\beval\s*\(|new Function\s*\(/ },
  ];
  const problems = [];
  const notes = [];
  for (const file of sourceFiles) {
    read(file).split('\n').forEach((line, index) => {
      for (const { name, pattern } of forbidden) {
        if (pattern.test(line)) problems.push(`${file}:${index + 1} ${name}`);
      }
      const where = `${file}:${index + 1}`;
      if (/\b(localStorage|sessionStorage)\b/.test(line) && !KNOWN_DEBT.localStorage.allowed.includes(file)) {
        const debt = KNOWN_DEBT.localStorage.debt[file];
        if (debt) notes.push(`${where} usa el almacenamiento del navegador: deuda conocida ${debt}`);
        else problems.push(`${where} usa localStorage/sessionStorage fuera del módulo de sesión (ver docs/guias/seguridad.md)`);
      }
      const insecure = line.match(/['"`]http:\/\/(?!www\.w3\.org\/2000\/svg)(?!localhost)[^'"`]*/);
      if (insecure && !KNOWN_DEBT.insecureUrl.allowed.includes(file)) {
        const debt = KNOWN_DEBT.insecureUrl.debt[file];
        if (debt) notes.push(`${where} ${debt}`);
        else problems.push(`${where} URL http:// sin cifrar: ${insecure[0].slice(1)}`);
      }
    });
  }
  check('Patrones prohibidos en src/', problems, notes);
}

// 2. Secretos y variables públicas
{
  const problems = [];
  const secretPatterns = [
    { name: 'clave de acceso de AWS', pattern: /AKIA[0-9A-Z]{16}/ },
    { name: 'clave privada', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
    { name: 'token de GitHub', pattern: /gh[pousr]_[A-Za-z0-9]{30,}/ },
    { name: 'token Bearer literal', pattern: /Bearer\s+[A-Za-z0-9._-]{30,}/ },
  ];
  const files = [...sourceFiles, '.env.example', 'index.html', ...walk('docs').filter((file) => file.endsWith('.md')), 'README.md', 'CLAUDE.md'];
  for (const file of files) {
    read(file).split('\n').forEach((line, index) => {
      for (const { name, pattern } of secretPatterns) {
        if (pattern.test(line)) problems.push(`${file}:${index + 1} parece contener una ${name}`);
      }
    });
  }
  for (const [, key] of read('.env.example').matchAll(/^(VITE_[A-Z0-9_]*(?:SECRET|PASSWORD|TOKEN|PRIVATE)[A-Z0-9_]*)=/gm)) {
    problems.push(`.env.example define ${key}: las variables VITE_* son públicas y no pueden guardar secretos`);
  }
  const tracked = run('git', ['ls-files', '.env', '.env.local', '.env.production']).stdout.trim();
  if (tracked) problems.push(`Hay archivos .env versionados: ${tracked.split('\n').join(', ')}`);
  check('Secretos y variables públicas', problems);
}

// 3. Vulnerabilidades de las dependencias de producción
{
  const problems = [];
  const notes = [];
  const audit = run('npm', ['audit', '--omit=dev', '--json']);
  let report = null;
  try {
    report = JSON.parse(audit.stdout);
  } catch {
    // sin red o salida no válida
  }
  if (!report || !report.vulnerabilities) {
    notes.push('No se pudo ejecutar npm audit (¿sin conexión?). Ejecútalo con red antes de fusionar.');
  } else {
    for (const [name, vulnerability] of Object.entries(report.vulnerabilities)) {
      const titles = vulnerability.via.filter((via) => typeof via === 'object').map((via) => via.title);
      const detail = `${name} (${vulnerability.severity})${titles.length ? `: ${titles[0]}` : ''}`;
      if (['high', 'critical'].includes(vulnerability.severity)) {
        if (ACCEPTED_ADVISORIES[name]) notes.push(`${detail}. Aceptada: ${ACCEPTED_ADVISORIES[name]}`);
        else problems.push(`${detail}. Actualiza la dependencia o justifica la excepción en ACCEPTED_ADVISORIES`);
      } else {
        notes.push(`${detail}. Revisar (gravedad ${vulnerability.severity}).`);
      }
    }
  }
  check('Dependencias de producción (npm audit, gravedad alta o crítica)', problems, notes);
}

// 4. ESLint
{
  const lint = run('npm', ['run', '--silent', 'lint']);
  const ceiling = Number(read('package.json').match(/--max-warnings\s+(\d+)/)?.[1]);
  const notes = [];
  const extra = [];
  if (lint.status === 0 && Number.isFinite(ceiling)) {
    const json = run('npx', ['eslint', '.', '-f', 'json']);
    let actual = null;
    try {
      actual = JSON.parse(json.stdout).reduce((sum, file) => sum + file.warningCount, 0);
    } catch {
      notes.push('No se pudo contar los avisos de ESLint.');
    }
    if (actual !== null && actual < ceiling) {
      extra.push(`Hay ${actual} avisos y el tope es ${ceiling}: baja --max-warnings a ${actual} en package.json para no perder la mejora`);
    } else if (actual !== null) {
      notes.push(`${actual} avisos de ESLint (tope ${ceiling}): deuda de accesibilidad y calidad, ver docs/guias/accesibilidad.md`);
    }
  }
  const lines = lint.stdout.split('\n');
  const errors = lines.filter((line) => /\s+error\s+/.test(line)).slice(0, 5);
  const total = lines.find((line) => /problems?/.test(line)) ?? '';
  check(
    'ESLint (sin errores, sin superar el tope de avisos y con el tope ajustado)',
    lint.status === 0 ? extra : [`npm run lint falla ${total.trim()}`, ...errors.map((line) => line.trim())],
    notes
  );
}

let failed = 0;
for (const { name, problems, notes } of results) {
  console.log(`${problems.length === 0 ? '✓' : '✗'} ${name}`);
  problems.forEach((problem) => console.log(`    - ${problem}`));
  notes.forEach((note) => console.log(`    · ${note}`));
  failed += problems.length;
}
console.log(failed === 0 ? '\nCalidad y seguridad: sin problemas nuevos.' : `\n${failed} problema(s). Ver docs/guias/seguridad.md.`);
process.exit(failed === 0 ? 0 : 1);

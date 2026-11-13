import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Ningún archivo fuente debe llevar caracteres de formato Unicode (categoría Cf)
// escritos tal cual (ceros de anchura, marcas bidireccionales, «Trojan Source»):
// en los tests y el código se escriben como escape (por ejemplo, U+200B).
const ROOT = path.resolve(__dirname, '..');
const FORMAT_CHAR = /\p{Cf}/u;
const SOURCE_FILE = /^(src|e2e|scripts)\/.+\.(js|jsx|mjs|cjs)$|^[^/]+\.config\.(js|cjs|mjs)$/;

const sourceFiles = () => {
  const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(Boolean);
  const files = [...git('ls-files'), ...git('ls-files', '--others', '--exclude-standard')];
  return [...new Set(files)].filter((file) => SOURCE_FILE.test(file));
};

describe('caracteres de formato Unicode literales en el código fuente', () => {
  it('ningún archivo de src/, e2e/, scripts/ ni *.config.js los contiene', () => {
    const files = sourceFiles();
    expect(files.length).toBeGreaterThan(50);
    const found = [];
    files.forEach((file) => {
      let text = readFileSync(path.join(ROOT, file), 'utf8');
      if (text.startsWith('\uFEFF')) text = text.slice(1);
      text.split('\n').forEach((line, index) => {
        if (FORMAT_CHAR.test(line)) found.push(`${file}:${index + 1}`);
      });
    });
    expect(found).toEqual([]);
  });
});

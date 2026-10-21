import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// La CSP de vercel.json y netlify.toml permite el script inline de tema por su hash:
// si alguien lo edita sin recalcularlo, el deploy lo bloquearía sin que nada falle acá
test('la CSP de los deploys incluye el hash del script inline de index.html', () => {
  const html = readFileSync('index.html', 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  expect(scripts).toHaveLength(1);
  const hash = `'sha256-${createHash('sha256').update(scripts[0]).digest('base64')}'`;

  for (const file of ['vercel.json', 'netlify.toml']) {
    expect(readFileSync(file, 'utf8'), file).toContain(hash);
  }
});

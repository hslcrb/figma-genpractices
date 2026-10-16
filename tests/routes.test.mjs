import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
test('website source files exist', () => {
  for (const path of ['public/index.html','public/styles.css','public/app.mjs','public/routes.mjs','scripts/build.mjs']) assert.ok(existsSync(new URL(path,root)), path);
});
test('all requested routes resolve and malformed routes are safe', async () => {
  const path = new URL('public/routes.mjs', root);
  assert.ok(existsSync(path), 'route module must exist');
  const { resolveRoute } = await import(path);
  for (const name of ['area','running','aetherfield']) assert.equal(resolveRoute('#/'+name), name);
  assert.equal(resolveRoute('#/running/event'),'event');
  for (const hash of ['', '#/', '#/missing', '#/%E0%A4%A']) assert.equal(resolveRoute(hash),'gallery');
});
test('runtime does not use expiring Figma URLs and supports reduced motion', () => {
  for (const path of ['public/index.html','public/styles.css','public/app.mjs']) {
    assert.ok(existsSync(new URL(path,root)),path);
    assert.doesNotMatch(readFileSync(new URL(path,root),'utf8'),/figma\.com\/api\/mcp\/asset/);
  }
  assert.match(readFileSync(new URL('public/styles.css',root),'utf8'),/prefers-reduced-motion/);
});

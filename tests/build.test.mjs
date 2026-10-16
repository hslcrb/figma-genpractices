import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, cp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Small, real 2x2 images. These tests never contact Figma or the network.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR42mMMSMljYGBgYmBgYGBgAAANpAEmGl7RsQAAAABJRU5ErkJggg==', 'base64');
const JPEG = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAACAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAwT/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCeAOlf/9k=', 'base64');
const WEBP = Buffer.from('UklGRjAAAABXRUJQVlA4ICQAAABwAQCdASoCAAIAAUAmJYwCdAFAAAD+71EpV6vMq5ZnCvPgAAA=', 'base64');
const GIF = Buffer.from('R0lGODdhAgACAIEAAFBkbgAAAAAAAAAAACwAAAAAAgACAAAIBgABCAQQEAA7', 'base64');
const SVG = Buffer.from('<?xml version="1.0"?>\n<!-- exported icon -->\n<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path d="M0 0h10v10z"/></svg>');
const HTML = Buffer.from('<!doctype html><html><body>Expired asset URL <svg></svg></body></html>');
const scripts = fileURLToPath(new URL('../scripts/', import.meta.url));

async function build(t, { bytes = PNG, path = 'public/assets/test.png', cached, fail = false, url = 'https://www.figma.com/api/mcp/asset/test/image.png' } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'figma-build-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp(scripts, join(root, 'scripts'), { recursive: true });
  for (const dir of ['sources', 'public/assets', 'bin']) await mkdir(join(root, dir), { recursive: true });
  await writeFile(join(root, 'public/index.html'), '<!doctype html><title>Test</title>');
  await writeFile(join(root, 'sources/figma-assets.json'), JSON.stringify([{ path, url }]));
  await writeFile(join(root, 'fixture'), bytes);
  if (cached) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), cached);
  }
  await writeFile(join(root, 'bin/curl'), `#!/usr/bin/env node
const fs = require('node:fs');
if (process.env.TEST_CURL_FAIL === '1') { process.stderr.write('HTTP 403'); process.exit(22); }
fs.copyFileSync(process.env.TEST_ASSET_FIXTURE, process.argv[process.argv.indexOf('--output') + 1]);
`, { mode: 0o755 });
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], {
    cwd: root, encoding: 'utf8', timeout: 15000,
    env: { ...process.env, PATH: join(root, 'bin') + ':' + process.env.PATH, TEST_ASSET_FIXTURE: join(root, 'fixture'), TEST_CURL_FAIL: fail ? '1' : '0' },
  });
  assert.ifError(result.error);
  return { ...result, root, path };
}

for (const [name, bytes] of Object.entries({ PNG, JPEG, WEBP, GIF })) {
  test(`build accepts genuine ${name} bytes behind a .png asset URL without altering them`, async t => {
    const r = await build(t, { bytes });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(await readFile(join(r.root, 'dist/assets/test.png')), bytes);
  });
}

test('build accepts an SVG document with XML declaration and comment', async t => {
  const r = await build(t, { bytes: SVG, path: 'public/assets/test.svg' });
  assert.equal(r.status, 0, r.stderr);
});

for (const extension of ['png', 'svg']) {
  test(`build rejects an HTML error page containing inline SVG for .${extension}`, async t => {
    const r = await build(t, { bytes: HTML, path: `public/assets/test.${extension}` });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /Unexpected asset content/);
    await assert.rejects(access(join(r.root, r.path + '.download')));
    await assert.rejects(access(join(r.root, 'dist')));
  });
}

test('build replaces a corrupt cached image instead of trusting its file size', async t => {
  const r = await build(t, { bytes: PNG, cached: HTML });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(await readFile(join(r.root, 'dist/assets/test.png')), PNG);
});

test('build reuses a valid cached JPEG without making a network request', async t => {
  const r = await build(t, { cached: JPEG, fail: true });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(await readFile(join(r.root, 'dist/assets/test.png')), JPEG);
});

test('build reports download failures without publishing or leaving a partial file', async t => {
  const r = await build(t, { fail: true });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Asset download failed/);
  await assert.rejects(access(join(r.root, r.path + '.download')));
  await assert.rejects(access(join(r.root, 'dist')));
});

test('build rejects a truncated image signature', async t => {
  const r = await build(t, { bytes: PNG.subarray(0, 8) });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Empty asset|Unexpected asset content/);
});

test('build rejects vector content in a raster slot', async t => {
  const r = await build(t, { bytes: SVG });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Unexpected asset content/);
});

test('build rejects asset paths outside public/assets', async t => {
  const r = await build(t, { path: 'public/assets/../../outside.png' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Unsafe asset path/);
});

test('build rejects an untrusted asset source', async t => {
  const r = await build(t, { url: 'https://example.com/image.png' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Untrusted asset source/);
});

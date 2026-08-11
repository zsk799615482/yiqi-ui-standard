import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { analyzeHtml } from '../scripts/validate-generated-web.mjs';

const fixtureUrl = (name) => new URL(`./fixtures/${name}`, import.meta.url);
const readFixture = (name) => readFile(fixtureUrl(name), 'utf8');
const validatorPath = fileURLToPath(
  new URL('../scripts/validate-generated-web.mjs', import.meta.url),
);

const issueCodes = (report) => report.issues.map(({ code }) => code);

test('invalid marketing page reports all required UI standard violations', async () => {
  const report = analyzeHtml(await readFixture('marketing-invalid.html'));

  assert.equal(report.ok, false);
  assert.deepEqual(
    new Set(issueCodes(report)),
    new Set([
      'dark-theme-required',
      'heading-too-large',
      'card-radius-too-small',
      'card-material-required',
      'corner-shape-required',
      'nested-card',
      'decorative-circle',
      'hero-split-decorative',
      'hero-evidence-required',
      'brand-color-hardcoded',
      'focus-visible-required',
      'reduced-motion-required',
    ]),
  );
  for (const issue of report.issues) {
    assert.deepEqual(Object.keys(issue).sort(), ['code', 'message', 'severity']);
  }
});

test('SaaS page rejects hero DOM', async () => {
  const report = analyzeHtml(await readFixture('saas-invalid.html'));

  assert.equal(report.ok, false);
  assert.ok(issueCodes(report).includes('saas-hero-forbidden'));
});

test('valid SaaS page has no issues', async () => {
  const report = analyzeHtml(await readFixture('saas-valid.html'));

  assert.deepEqual(report.issues, []);
  assert.equal(report.ok, true);
});

test('heading validation reads the largest px value in clamp', () => {
  const report = analyzeHtml(`
    <html data-ui-page-type="marketing" data-ui-hero="none">
      <style>
        :root { color-scheme: dark; }
        h1 { font-size: clamp(36px, 8vw, 72px); }
      </style>
    </html>
  `);

  assert.ok(issueCodes(report).includes('heading-too-large'));
});

test('liquid glass requires backdrop filtering and reduced transparency fallback', () => {
  const report = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="liquid-glass"
    >
      <style>:root { color-scheme: dark; }</style>
    </html>
  `);

  assert.ok(issueCodes(report).includes('liquid-glass-fallback-required'));
});

test('complete liquid glass fallback passes its material check', () => {
  const report = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="liquid-glass"
    >
      <style>
        :root { color-scheme: dark; }
        [data-ui-card] { backdrop-filter: blur(20px); }
        @media (prefers-reduced-transparency: reduce) {
          [data-ui-card] {
            backdrop-filter: none;
            background: Canvas;
          }
        }
      </style>
    </html>
  `);

  assert.ok(!issueCodes(report).includes('liquid-glass-fallback-required'));
});

test('metadata is read only from html and page type can be overridden', () => {
  const missing = analyzeHtml(`
    <body
      data-ui-page-type="saas-operations"
      data-ui-hero="none"
      data-ui-card-material="solid"
    ></body>
  `);
  assert.ok(issueCodes(missing).includes('page-type-required'));
  assert.ok(issueCodes(missing).includes('hero-metadata-required'));

  const overridden = analyzeHtml(
    '<html data-ui-hero="none"><style>:root { color-scheme: dark; }</style></html>',
    { pageType: 'saas-analytics' },
  );
  assert.ok(!issueCodes(overridden).includes('page-type-required'));
});

test('card detection ignores card-like strings inside script and style', () => {
  const report = analyzeHtml(`
    <html data-ui-page-type="marketing" data-ui-hero="none">
      <style>
        :root { color-scheme: dark; }
        [data-ui-card] { content: "<div data-ui-card>"; }
      </style>
      <script>const template = '<article data-ui-card></article>';</script>
    </html>
  `);

  assert.ok(!issueCodes(report).includes('card-material-required'));
  assert.ok(!issueCodes(report).includes('nested-card'));
});

test('CLI returns exit 1 and JSON for an invalid page', () => {
  const result = spawnSync(
    process.execPath,
    [
      validatorPath,
      '--file',
      fileURLToPath(fixtureUrl('marketing-invalid.html')),
      '--json',
    ],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 1, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ok, false);
  assert.ok(issueCodes(report).includes('hero-evidence-required'));
});

test('CLI returns exit 0 and success text for a valid page', () => {
  const result = spawnSync(
    process.execPath,
    ['--no-warnings', validatorPath, '--file', fileURLToPath(fixtureUrl('saas-valid.html'))],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /UI Standard static validation passed/);
});

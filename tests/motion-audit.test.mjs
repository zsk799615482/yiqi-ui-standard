import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { auditMotion } from '../scripts/audit-motion.mjs';

const readFixture = (name) => readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

test('valid motion fixture passes the Yiqi motion audit', async () => {
  const report = auditMotion(await readFixture('motion-valid.css'));
  assert.equal(report.ok, true);
  assert.equal(report.summary.errors, 0);
});

test('invalid motion fixture reports stable rule IDs and preserves exemption', async () => {
  const report = auditMotion(await readFixture('motion-invalid.css'));
  assert.equal(report.ok, false);
  for (const rule of ['transition-all', 'ease-in', 'scale-zero', 'layout-property', 'popover-origin', 'reduced-motion', 'hover-gating']) {
    assert.ok(report.issues.some((finding) => finding.rule === rule), `missing ${rule}`);
  }
  assert.ok(report.issues.some(({ rule, severity, exemption }) => rule === 'duration' && severity === 'info' && exemption?.reason === 'marketing narrative'));
});

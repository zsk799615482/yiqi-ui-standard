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

test('无效营销页报告全部 UI Standard 违规项', async () => {
  const report = analyzeHtml(await readFixture('marketing-invalid.html'));

  assert.equal(report.ok, false);
  assert.equal(report.pageType, 'marketing');
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
    assert.match(issue.message, /[\u3400-\u9fff]/);
  }
});

test('SaaS 页面拒绝 Hero DOM', async () => {
  const report = analyzeHtml(await readFixture('saas-invalid.html'));

  assert.equal(report.ok, false);
  assert.equal(report.pageType, 'saas-operations');
  assert.ok(issueCodes(report).includes('saas-hero-forbidden'));
});

test('有效 SaaS 页面没有问题', async () => {
  const report = analyzeHtml(await readFixture('saas-valid.html'));

  assert.deepEqual(report.issues, []);
  assert.equal(report.ok, true);
  assert.equal(report.pageType, 'saas-operations');
});

test('标题校验读取 clamp 中最大的 px 值', () => {
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

test('仅 root 声明 squircle 不能满足卡片圆角契约', () => {
  const report = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="solid"
    >
      <style>
        :root {
          color-scheme: dark;
          --radius-card: 36px;
          --corner-shape: squircle;
        }
      </style>
      <article data-ui-card>Card</article>
    </html>
  `);

  assert.ok(issueCodes(report).includes('corner-shape-required'));
});

test('实际卡片 selector 声明 squircle 后满足圆角契约', () => {
  const report = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="solid"
    >
      <style>
        :root {
          color-scheme: dark;
          --radius-card: 36px;
        }
        [data-ui-card] {
          border-radius: var(--radius-card);
          corner-shape: squircle;
        }
      </style>
      <article data-ui-card>Card</article>
    </html>
  `);

  assert.ok(!issueCodes(report).includes('corner-shape-required'));
});

test('liquid glass 要求 backdrop 与降低透明度回退', () => {
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

test('无关元素 backdrop 与空 media 不能满足 liquid glass 降级', () => {
  const report = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="liquid-glass"
    >
      <style>
        :root { color-scheme: dark; }
        .unrelated { backdrop-filter: blur(20px); }
        @media (prefers-reduced-transparency: reduce) {}
      </style>
    </html>
  `);

  assert.ok(issueCodes(report).includes('liquid-glass-fallback-required'));
});

test('仅有 media 名称但没有实体回退和 filter none 不能通过', () => {
  const report = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="liquid-glass"
    >
      <style>
        :root { color-scheme: dark; }
        :root[data-ui-card-material="liquid-glass"] [data-ui-card] {
          backdrop-filter: blur(20px);
        }
        @media (prefers-reduced-transparency: reduce) {
          .unrelated {
            color: CanvasText;
          }
        }
      </style>
    </html>
  `);

  assert.ok(issueCodes(report).includes('liquid-glass-fallback-required'));
});

test('官方 theme.css liquid glass 结构通过材质校验', async () => {
  const themeCss = await readFile(new URL('../theme.css', import.meta.url), 'utf8');
  const report = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="liquid-glass"
    >
      <style>${themeCss}</style>
      <article data-ui-card>Card</article>
    </html>
  `);

  assert.ok(!issueCodes(report).includes('liquid-glass-fallback-required'));
});

test('页面类型只读取 html metadata，并可由 options 覆盖', () => {
  const missing = analyzeHtml(`
    <body
      data-ui-page-type="saas-operations"
      data-ui-hero="none"
      data-ui-card-material="solid"
    ></body>
  `);
  assert.ok(issueCodes(missing).includes('page-type-required'));
  assert.ok(issueCodes(missing).includes('hero-metadata-required'));
  assert.equal(missing.pageType, 'marketing');

  const overridden = analyzeHtml(
    '<html data-ui-hero="none"><style>:root { color-scheme: dark; }</style></html>',
    { pageType: 'saas-analytics' },
  );
  assert.ok(!issueCodes(overridden).includes('page-type-required'));
  assert.equal(overridden.pageType, 'saas-analytics');
});

test('卡片检测忽略 script 和 style 中的伪标签字符串', () => {
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

test('真实元素 inline style 的硬编码品牌色会被报告', () => {
  const report = analyzeHtml(`
    <html data-ui-page-type="marketing" data-ui-hero="none">
      <style>:root { color-scheme: dark; }</style>
      <div style="color: #9A6ABA">Brand</div>
    </html>
  `);

  assert.ok(issueCodes(report).includes('brand-color-hardcoded'));
});

test('CLI 对无效页面返回 exit 1 和 JSON', () => {
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
  assert.equal(report.pageType, 'marketing');
  assert.ok(issueCodes(report).includes('hero-evidence-required'));
  assert.ok(report.issues.every(({ message }) => /[\u3400-\u9fff]/.test(message)));
});

test('CLI 对有效页面返回 exit 0 和中文成功文案', () => {
  const result = spawnSync(
    process.execPath,
    ['--no-warnings', validatorPath, '--file', fileURLToPath(fixtureUrl('saas-valid.html'))],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), 'UI Standard 静态校验通过');
});

test('CLI 参数错误使用中文错误信息和前缀', () => {
  const cases = [
    {
      args: [],
      message: /UI Standard 校验器错误：缺少必需的 --file 参数。/,
    },
    {
      args: ['--file'],
      message: /UI Standard 校验器错误：参数 --file 缺少值。/,
    },
    {
      args: ['--unknown'],
      message: /UI Standard 校验器错误：未知参数：--unknown/,
    },
  ];

  for (const { args, message } of cases) {
    const result = spawnSync(process.execPath, [validatorPath, ...args], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, message);
  }
});

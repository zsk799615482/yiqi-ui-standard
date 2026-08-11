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

const VALID_PAGE_TYPES = [
  'marketing',
  'product',
  'content',
  'commerce',
  'community',
  'consumer-tool',
  'saas-operations',
  'saas-ai-workspace',
  'saas-analytics',
  'platform',
  'account',
  'workflow',
];

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

test('导出 API 可以接收本地 link 样式表内容', async () => {
  const html = await readFixture('linked-stylesheet-valid.html');
  const css = await readFixture('linked-stylesheet-valid.css');
  const report = analyzeHtml(html, {
    linkedCss: new Map([['./linked-stylesheet-valid.css', css]]),
  });

  assert.deepEqual(report.issues, []);
});

test('CLI 相对 HTML 文件加载本地 link 样式表', () => {
  const result = spawnSync(
    process.execPath,
    [
      validatorPath,
      '--file',
      fileURLToPath(fixtureUrl('linked-stylesheet-valid.html')),
    ],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), 'UI Standard 静态校验通过');
});

test('远程和 data 样式表链接会产生中文问题', () => {
  for (const href of [
    'https://example.com/theme.css',
    'data:text/css,html%7Bcolor-scheme:dark%7D',
  ]) {
    const report = analyzeHtml(`
      <html data-ui-page-type="marketing" data-ui-hero="none">
        <link rel="stylesheet" href="${href}">
      </html>
    `);

    assert.ok(issueCodes(report).includes('stylesheet-link-unsupported'));
    assert.match(
      report.issues.find(({ code }) => code === 'stylesheet-link-unsupported')
        .message,
      /仅支持本地文件/,
    );
  }
});

test('CLI 对远程样式表链接返回中文 JSON issue', () => {
  const result = spawnSync(
    process.execPath,
    [
      validatorPath,
      '--file',
      fileURLToPath(fixtureUrl('unsupported-stylesheet.html')),
      '--json',
    ],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 1, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.ok(issueCodes(report).includes('stylesheet-link-unsupported'));
  assert.match(
    report.issues.find(({ code }) => code === 'stylesheet-link-unsupported')
      .message,
    /仅支持本地文件/,
  );
});

test('页面类型严格限制为文档定义的十二种值', () => {
  for (const pageType of VALID_PAGE_TYPES) {
    const report = analyzeHtml(`
      <html data-ui-page-type="${pageType}" data-ui-hero="none">
        <style>:root { color-scheme: dark; }</style>
      </html>
    `);
    assert.ok(
      !issueCodes(report).includes('page-type-invalid'),
      `${pageType} should be accepted`,
    );
  }

  const invalidMetadata = analyzeHtml(`
    <html data-ui-page-type="dashboard" data-ui-hero="none">
      <style>:root { color-scheme: dark; }</style>
    </html>
  `);
  assert.ok(issueCodes(invalidMetadata).includes('page-type-invalid'));
});

test('无效 page-type 覆盖不能绕过 metadata 的 SaaS 规则', () => {
  const report = analyzeHtml(
    `
      <html data-ui-page-type="saas-operations" data-ui-hero="none">
        <style>:root { color-scheme: dark; }</style>
        <header class="hero">Hero</header>
      </html>
    `,
    { pageType: 'dashboard' },
  );

  assert.equal(report.pageType, 'saas-operations');
  assert.ok(issueCodes(report).includes('page-type-invalid'));
  assert.ok(issueCodes(report).includes('saas-hero-forbidden'));
});

test('CLI 无效 --page-type 不能覆盖 SaaS metadata', () => {
  const result = spawnSync(
    process.execPath,
    [
      validatorPath,
      '--file',
      fileURLToPath(fixtureUrl('saas-invalid.html')),
      '--page-type',
      'dashboard',
      '--json',
    ],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 1, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.pageType, 'saas-operations');
  assert.ok(issueCodes(report).includes('page-type-invalid'));
  assert.ok(issueCodes(report).includes('saas-hero-forbidden'));
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

test('卡片必须在默认样式中实际应用合规 border-radius', () => {
  const missingApplication = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="solid"
    >
      <style>
        :root { color-scheme: dark; --radius-card: 36px; }
        [data-ui-card] { corner-shape: squircle; }
      </style>
      <article data-ui-card>Card</article>
    </html>
  `);
  assert.ok(
    issueCodes(missingApplication).includes('card-radius-application-required'),
  );

  const inlineTooSmall = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="solid"
    >
      <style>
        :root { color-scheme: dark; --radius-card: 36px; }
        [data-ui-card] {
          border-radius: var(--radius-card);
          corner-shape: squircle;
        }
      </style>
      <article data-ui-card style="border-radius: 12px">Card</article>
    </html>
  `);
  assert.ok(issueCodes(inlineTooSmall).includes('card-radius-too-small'));
});

test('卡片后代样式不能冒充卡片本身的圆角与 squircle', () => {
  const report = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="solid"
    >
      <style>
        :root { color-scheme: dark; --radius-card: 36px; }
        [data-ui-card] .content {
          border-radius: var(--radius-card);
          corner-shape: squircle;
        }
      </style>
      <article data-ui-card><div class="content">Card</div></article>
    </html>
  `);

  assert.ok(
    issueCodes(report).includes('card-radius-application-required'),
  );
  assert.ok(issueCodes(report).includes('corner-shape-required'));
});

test('移动端 28–36px 半径被允许但不能满足桌面默认', () => {
  const mobileOnly = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="solid"
    >
      <style>
        :root { color-scheme: dark; --radius-card: 36px; }
        @media (max-width: 767px) {
          [data-ui-card] {
            border-radius: 28px;
            corner-shape: squircle;
          }
        }
      </style>
      <article data-ui-card>Card</article>
    </html>
  `);
  assert.ok(
    issueCodes(mobileOnly).includes('card-radius-application-required'),
  );
  assert.ok(issueCodes(mobileOnly).includes('corner-shape-required'));

  const desktopAndMobile = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="solid"
    >
      <style>
        :root { color-scheme: dark; --radius-card: 36px; }
        [data-ui-card] {
          border-radius: 36px;
          corner-shape: squircle;
        }
        @media (max-width: 767px) {
          [data-ui-card] { border-radius: 28px; }
        }
      </style>
      <article data-ui-card>Card</article>
    </html>
  `);
  assert.ok(!issueCodes(desktopAndMobile).includes('card-radius-too-small'));
  assert.ok(
    !issueCodes(desktopAndMobile).includes('card-radius-application-required'),
  );

  const invalidMobile = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="solid"
    >
      <style>
        :root { color-scheme: dark; --radius-card: 36px; }
        [data-ui-card] {
          border-radius: var(--radius-card);
          corner-shape: squircle;
        }
        @media (max-width: 767px) {
          [data-ui-card] { border-radius: 24px; }
        }
      </style>
      <article data-ui-card>Card</article>
    </html>
  `);
  assert.ok(
    issueCodes(invalidMobile).includes('card-radius-mobile-invalid'),
  );

  const invalidMobileToken = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="solid"
    >
      <style>
        :root { color-scheme: dark; --radius-card: 36px; }
        [data-ui-card] {
          border-radius: var(--radius-card);
          corner-shape: squircle;
        }
        @media (max-width: 767px) {
          :root { --radius-card: 24px; }
        }
      </style>
      <article data-ui-card>Card</article>
    </html>
  `);
  assert.ok(
    issueCodes(invalidMobileToken).includes('card-radius-mobile-invalid'),
  );
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

test('liquid glass 降低透明度回退可以继承外层卡片边框', () => {
  const report = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="liquid-glass"
    >
      <style>
        :root {
          color-scheme: dark;
          --radius-card: 36px;
        }
        :root[data-ui-card-material="liquid-glass"] [data-ui-card] {
          border: 1px solid var(--card-border);
          border-radius: var(--radius-card);
          corner-shape: squircle;
          backdrop-filter: blur(20px);
        }
        @media (prefers-reduced-transparency: reduce) {
          :root[data-ui-card-material="liquid-glass"] [data-ui-card] {
            background: var(--card-solid-bg);
            backdrop-filter: none;
          }
        }
      </style>
      <article data-ui-card>Card</article>
    </html>
  `);

  assert.ok(!issueCodes(report).includes('liquid-glass-fallback-required'));
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

test('Heading 校验支持 inline、rem 和不可证明值', () => {
  const inline = analyzeHtml(`
    <html data-ui-page-type="marketing" data-ui-hero="none">
      <style>:root { color-scheme: dark; }</style>
      <h1 style="font-size: 43px">Large</h1>
    </html>
  `);
  assert.ok(issueCodes(inline).includes('heading-too-large'));

  const rem = analyzeHtml(`
    <html data-ui-page-type="saas-analytics" data-ui-hero="none">
      <style>
        :root { color-scheme: dark; font-size: 16px; }
        h1 { font-size: 2rem; }
      </style>
    </html>
  `);
  assert.ok(issueCodes(rem).includes('heading-too-large'));

  for (const value of ['2em', '4vw', 'var(--title-size)', 'calc(20px + 1vw)']) {
    const report = analyzeHtml(`
      <html data-ui-page-type="marketing" data-ui-hero="none">
        <style>
          :root { color-scheme: dark; }
          h1 { font-size: ${value}; }
        </style>
      </html>
    `);
    assert.ok(
      issueCodes(report).includes('heading-size-unverifiable'),
      `${value} must be reported as unverifiable`,
    );
  }

  const implicit = analyzeHtml(`
    <html data-ui-page-type="marketing" data-ui-hero="none">
      <style>:root { color-scheme: dark; }</style>
      <h1>No explicit size</h1>
    </html>
  `);
  assert.ok(!issueCodes(implicit).includes('heading-size-unverifiable'));
});

test('Heading 后代 selector 的字号不算 Heading 本身字号', () => {
  const report = analyzeHtml(`
    <html data-ui-page-type="marketing" data-ui-hero="none">
      <style>
        :root { color-scheme: dark; }
        h1 .badge { font-size: 84px; }
      </style>
      <h1>Title <span class="badge">New</span></h1>
    </html>
  `);

  assert.ok(!issueCodes(report).includes('heading-too-large'));
});

test('rem Heading 使用可解析的有效 root font-size', () => {
  const report = analyzeHtml(`
    <html data-ui-page-type="marketing" data-ui-hero="none">
      <style>
        :root {
          color-scheme: dark;
          font-size: 20px;
        }
        h1 { font-size: 2rem; }
      </style>
    </html>
  `);

  assert.ok(!issueCodes(report).includes('heading-too-large'));
  assert.ok(!issueCodes(report).includes('heading-size-unverifiable'));
});

test('暗色模式只接受有效的默认 root 或 html 首选值', () => {
  const invalidStyles = [
    '.preview { color-scheme: dark; }',
    ':root { color-scheme: dark; } :root { color-scheme: light; }',
    ':root { color-scheme: light dark; }',
  ];

  for (const style of invalidStyles) {
    const report = analyzeHtml(`
      <html data-ui-page-type="marketing" data-ui-hero="none">
        <style>${style}</style>
      </html>
    `);
    assert.ok(
      issueCodes(report).includes('dark-theme-required'),
      `${style} must not satisfy the dark default`,
    );
  }

  const valid = analyzeHtml(`
    <html data-ui-page-type="marketing" data-ui-hero="none">
      <style>html { color-scheme: dark light; }</style>
    </html>
  `);
  assert.ok(!issueCodes(valid).includes('dark-theme-required'));
});

test('@supports squircle 需要默认 border-radius，media-only 规则不能满足默认', () => {
  const supports = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="solid"
    >
      <style>
        :root { color-scheme: dark; --radius-card: 36px; }
        [data-ui-card] { border-radius: var(--radius-card); }
        @supports (corner-shape: squircle) {
          [data-ui-card] { corner-shape: squircle; }
        }
      </style>
      <article data-ui-card>Card</article>
    </html>
  `);
  assert.ok(!issueCodes(supports).includes('corner-shape-required'));

  const mediaOnly = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="solid"
    >
      <style>
        :root { color-scheme: dark; --radius-card: 36px; }
        [data-ui-card] { border-radius: var(--radius-card); }
        @media (min-width: 1000px) {
          [data-ui-card] { corner-shape: squircle; }
        }
      </style>
      <article data-ui-card>Card</article>
    </html>
  `);
  assert.ok(issueCodes(mediaOnly).includes('corner-shape-required'));
});

test('media-only backdrop 不能满足 liquid glass 默认处理', () => {
  const report = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="liquid-glass"
    >
      <style>
        :root { color-scheme: dark; --radius-card: 36px; }
        [data-ui-card] {
          border-radius: var(--radius-card);
          corner-shape: squircle;
        }
        @media (min-width: 1000px) {
          [data-ui-card] { backdrop-filter: blur(20px); }
        }
        @media (prefers-reduced-transparency: reduce) {
          [data-ui-card] {
            background: var(--card-solid-bg);
            backdrop-filter: none;
          }
        }
      </style>
      <article data-ui-card>Card</article>
    </html>
  `);

  assert.ok(issueCodes(report).includes('liquid-glass-fallback-required'));
});

test('reduced-motion media 必须包含实际禁用 motion 的声明', () => {
  const emptyFallback = analyzeHtml(`
    <html data-ui-page-type="marketing" data-ui-hero="none">
      <style>
        :root { color-scheme: dark; }
        .panel { transition: transform 200ms ease; }
        @media (prefers-reduced-motion: reduce) {}
      </style>
    </html>
  `);
  assert.ok(issueCodes(emptyFallback).includes('reduced-motion-required'));

  const validFallback = analyzeHtml(`
    <html data-ui-page-type="marketing" data-ui-hero="none">
      <style>
        :root { color-scheme: dark; }
        .panel { transition: transform 200ms ease; }
        @media (prefers-reduced-motion: reduce) {
          .panel { transition: none; }
        }
      </style>
    </html>
  `);
  assert.ok(!issueCodes(validFallback).includes('reduced-motion-required'));
});

test('CSS 注释和字符串中的花括号不会中断扫描', () => {
  const report = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="solid"
    >
      <style>
        /* unmatched brace is valid in a comment: { */
        :root {
          color-scheme: dark;
          --radius-card: 36px;
        }
        [data-ui-card] {
          content: "braces: { }";
          border-radius: var(--radius-card);
          corner-shape: squircle;
        }
      </style>
      <article data-ui-card>Card</article>
    </html>
  `);

  assert.ok(!issueCodes(report).includes('dark-theme-required'));
  assert.ok(!issueCodes(report).includes('card-radius-too-small'));
  assert.ok(
    !issueCodes(report).includes('card-radius-application-required'),
  );
  assert.ok(!issueCodes(report).includes('corner-shape-required'));
});

test('空值和布尔 data-ui-product-state 不能作为 Hero 证据', () => {
  for (const productState of [
    'data-ui-product-state',
    'data-ui-product-state=""',
  ]) {
    const report = analyzeHtml(`
      <html data-ui-page-type="marketing" data-ui-hero="approved">
        <style>:root { color-scheme: dark; }</style>
        <div ${productState}></div>
      </html>
    `);

    assert.ok(
      issueCodes(report).includes('hero-evidence-required'),
      `${productState} must not count as Hero evidence`,
    );
  }
});

test('默认视觉边界不能只由条件规则满足', () => {
  const report = analyzeHtml(`
    <html
      data-ui-page-type="marketing"
      data-ui-hero="none"
      data-ui-card-material="solid"
    >
      <style>
        :root {
          color-scheme: light;
          --radius-card: 12px;
        }
        [data-ui-card] {
          border-radius: var(--radius-card);
          corner-shape: squircle;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            color-scheme: dark;
            --radius-card: 36px;
          }
        }
      </style>
      <article data-ui-card>Card</article>
    </html>
  `);

  assert.ok(issueCodes(report).includes('dark-theme-required'));
  assert.ok(issueCodes(report).includes('card-radius-too-small'));
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

test('inline style 自定义属性中的品牌色不算硬编码使用', () => {
  const report = analyzeHtml(`
    <html data-ui-page-type="marketing" data-ui-hero="none">
      <style>:root { color-scheme: dark; }</style>
      <div style="--brand-accent:#9a6aba;color:var(--brand-accent)">Brand</div>
    </html>
  `);

  assert.ok(!issueCodes(report).includes('brand-color-hardcoded'));
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

test('CLI 文件读取失败输出中文信息且不泄露 ENOENT', () => {
  const result = spawnSync(
    process.execPath,
    [
      validatorPath,
      '--file',
      fileURLToPath(fixtureUrl('does-not-exist.html')),
    ],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /UI Standard 校验器错误：无法读取文件/);
  assert.doesNotMatch(result.stderr, /ENOENT|no such file or directory/i);
});

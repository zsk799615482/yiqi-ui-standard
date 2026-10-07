#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPPORTED_STACKS = new Set(['react', 'vue', 'vanilla']);
const SUPPORTED_EFFECTS = new Set([
  '3d',
  'typography',
  'scroll',
  'transition',
  'interaction',
  'liquid-glass',
]);

const catalogUrl = new URL(
  '../references/showcase-catalog.json',
  import.meta.url,
);

export const loadShowcaseCatalog = async (url = catalogUrl) =>
  JSON.parse(await readFile(url, 'utf8'));

const unique = (values) => [...new Set(values)];

const normalizeEffects = (effects) => {
  const normalized = unique(
    (Array.isArray(effects) ? effects : String(effects ?? '').split(','))
      .map((effect) => effect.trim().toLowerCase())
      .filter(Boolean),
  );
  if (normalized.length === 0) {
    throw new Error('至少需要一个 Showcase 效果。');
  }
  for (const effect of normalized) {
    if (!SUPPORTED_EFFECTS.has(effect)) {
      throw new Error(`不支持的效果：${effect}`);
    }
  }
  return normalized;
};

const candidateScore = (entry, effect, pageType) => {
  let score = entry.licenseClass === 'permissive' ? 100 : 0;
  if (entry.category === effect) score += 30;
  if (entry.recommendedContexts.includes(pageType)) score += 20;
  if (entry.recommendedContexts.includes('general')) score += 10;
  return score;
};

const dependenciesForStack = (entry, stack) =>
  entry.stackDependencies?.[stack] ?? entry.dependencies;

const toLockedEntry = (entry, isApprovedConditional, stack) => ({
  id: entry.id,
  name: entry.name,
  category: entry.category,
  sourceUrl: entry.sourceUrl,
  sourceVersion: entry.sourceVersion,
  license: entry.license,
  licenseClass: entry.licenseClass,
  licenseEvidence: entry.licenseEvidence,
  verificationDate: entry.verificationDate,
  integrationMode: entry.integrationMode,
  packageName: entry.packageName,
  packageVersion: entry.packageVersion,
  copyPaths: entry.copyPaths ?? [],
  dependencies: dependenciesForStack(entry, stack),
  capabilities: entry.capabilities,
  brandRecipe: entry.brandRecipe,
  tiers: {
    full: entry.fullTier,
    lite: entry.liteTier,
    static: entry.staticFallback,
  },
  reducedMotionFallback: entry.reducedMotionFallback,
  verificationSteps: entry.verificationSteps,
  ...(isApprovedConditional
    ? { approval: { status: 'approved', scope: 'current-project' } }
    : {}),
});

export const resolveShowcaseComponents = (catalog, options) => {
  const stack = String(options?.stack ?? '').trim().toLowerCase();
  if (!SUPPORTED_STACKS.has(stack)) {
    throw new Error(`不支持的技术栈：${stack || '未提供'}`);
  }

  const pageType = String(options?.pageType ?? '').trim();
  if (!pageType) {
    throw new Error('缺少页面类型。');
  }

  const requestedEffects = normalizeEffects(options.effects);
  const approvedConditional = new Set(options.approvedConditional ?? []);
  const liquidGlassSource = String(options.liquidGlassSource ?? '').trim();
  if (liquidGlassSource && !requestedEffects.includes('liquid-glass')) {
    throw new Error('--liquid-glass-source 仅用于 --effects 包含 liquid-glass 的请求。');
  }
  const selected = new Map();

  for (const effect of requestedEffects) {
    const preferredId = effect === 'liquid-glass'
      ? liquidGlassSource || catalog.policy?.liquidGlassDefaults?.[stack]
      : null;
    if (preferredId) {
      const preferred = catalog.entries.find(({ id }) => id === preferredId);
      if (
        !preferred ||
        !preferred.supportedStacks.includes(stack) ||
        !preferred.capabilities.includes('liquid-glass')
      ) {
        throw new Error(`液态玻璃来源 ${preferredId} 不存在或不支持 ${stack} 的 liquid-glass 效果。`);
      }
      if (!['permissive', 'conditional'].includes(preferred.licenseClass)) {
        throw new Error(`液态玻璃来源 ${preferredId} 的许可受限或未知，不能取用。`);
      }
      if (
        preferred.licenseClass === 'conditional' &&
        !approvedConditional.has(preferred.id)
      ) {
        const alternatives = catalog.entries.filter(
          (entry) =>
            entry.supportedStacks.includes(stack) &&
            entry.capabilities.includes('liquid-glass') &&
            entry.licenseClass === 'permissive',
        ).map(({ id }) => id).join(', ');
        throw new Error(
          `液态玻璃推荐来源 ${preferred.id} 使用 ${preferred.license}；确认当前项目许可条件后添加 --approve-conditional ${preferred.id}，或通过 --liquid-glass-source 显式选择 MIT 备选：${alternatives || '无'}。未批准时不会生成锁文件或静默替换来源。`,
        );
      }
      selected.set(preferred.id, preferred);
      continue;
    }

    const compatible = catalog.entries.filter(
      (entry) =>
        entry.supportedStacks.includes(stack) &&
        entry.capabilities.includes(effect) &&
        (entry.licenseClass === 'permissive' ||
          approvedConditional.has(entry.id)),
    );

    const explicitlyApproved = compatible.filter((entry) =>
      approvedConditional.has(entry.id),
    );
    const candidates = explicitlyApproved.length > 0
      ? explicitlyApproved
      : compatible;
    candidates.sort(
      (left, right) =>
        candidateScore(right, effect, pageType) -
          candidateScore(left, effect, pageType) ||
        left.id.localeCompare(right.id),
    );

    const choice = candidates[0];
    if (!choice) {
      throw new Error(
        `技术栈 ${stack} 没有可批准的 ${effect} 方案；条件许可来源需通过 --approve-conditional 显式批准。`,
      );
    }
    selected.set(choice.id, choice);
  }

  const selectedEntries = [...selected.values()].map((entry) =>
    toLockedEntry(entry, approvedConditional.has(entry.id), stack),
  );
  const dependencies = unique(
    selectedEntries.flatMap((entry) => entry.dependencies),
  ).map((dependency) => dependency.split('@').slice(0, -1).join('@') || dependency);
  const pinnedDependencies = unique(
    selectedEntries.flatMap((entry) => entry.dependencies),
  );

  return {
    schemaVersion: 1,
    catalogSnapshot: catalog.snapshotDate,
    brand: catalog.brand,
    visualMode: 'showcase',
    stack,
    pageType,
    requestedEffects,
    recommendation: {
      count: 1,
      principle: '内容相关性 → 品牌适配 → 技术栈 → 授权 → 性能与可访问性 → 视觉冲击',
    },
    selected: selectedEntries,
    install: {
      dependencies,
      pinnedDependencies,
      command: pinnedDependencies.length > 0
        ? `npm install ${pinnedDependencies.join(' ')}`
        : null,
    },
    forbiddenVendorStyles: [
      '供应商 Logo、名称和演示文案',
      'Inter、Roboto 与供应商默认字体',
      '紫粉蓝渐变、Aurora、发光球和无信息轨道',
      'Linear、Raycast 或其他产品的视觉复刻',
    ],
    finalVerification: [
      '运行 validate-generated-web.mjs 并提供 --effects-lock',
      '验证 1440 × 1000 与 390 × 844',
      '验证 prefers-reduced-motion、WebGL 失败与静态回退',
      '确认浏览器控制台无错误和警告',
    ],
  };
};

const parseArguments = (args) => {
  const options = { json: false, approvedConditional: [] };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--json') {
      options.json = true;
      continue;
    }
    if (
      ['--stack', '--page-type', '--effects', '--output', '--approve-conditional', '--liquid-glass-source'].includes(argument)
    ) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`参数 ${argument} 缺少值。`);
      }
      const keys = {
        '--stack': 'stack',
        '--page-type': 'pageType',
        '--effects': 'effects',
        '--output': 'output',
        '--approve-conditional': 'approvedConditional',
        '--liquid-glass-source': 'liquidGlassSource',
      };
      options[keys[argument]] = argument === '--approve-conditional'
        ? value.split(',').map((item) => item.trim()).filter(Boolean)
        : value;
      index += 1;
      continue;
    }
    throw new Error(`未知参数：${argument}`);
  }
  for (const required of ['stack', 'pageType', 'effects']) {
    if (!options[required]) {
      throw new Error(`缺少必需的 --${required === 'pageType' ? 'page-type' : required} 参数。`);
    }
  }
  return options;
};

const main = async () => {
  const options = parseArguments(process.argv.slice(2));
  const catalog = await loadShowcaseCatalog();
  const lock = resolveShowcaseComponents(catalog, options);
  const output = `${JSON.stringify(lock, null, 2)}\n`;

  if (options.output) {
    const outputPath = resolve(options.output);
    await writeFile(outputPath, output);
    if (!options.json) {
      process.stdout.write(`OneSeven Showcase 锁文件已生成：${outputPath}\n`);
      return;
    }
  }
  process.stdout.write(output);
};

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main().catch((error) => {
    process.stderr.write(`OneSeven Showcase 解析器错误：${error.message}\n`);
    process.exitCode = 1;
  });
}

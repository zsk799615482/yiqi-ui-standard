#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const issue = (rule, severity, message, index = 0, source = '') => ({
  rule,
  severity,
  message,
  index,
  line: source.slice(0, index).split('\n').length,
});

const exemptionBefore = (source, index, rule) => {
  const window = source.slice(Math.max(0, index - 320), index);
  const expression = new RegExp(
    `yiqi-motion:\\s*allow\\s+${rule}\\b[^\\n]*reason=["']([^"']+)["']`,
    'i',
  );
  const match = window.match(expression);
  return match ? { rule, reason: match[1] } : null;
};

const durationMs = (value) => {
  const match = value.trim().match(/(-?\d*\.?\d+)(ms|s)\b/i);
  if (!match) return null;
  const amount = Number(match[1]);
  return match[2].toLowerCase() === 's' ? amount * 1000 : amount;
};

const addFinding = (findings, source, rule, severity, message, index) => {
  const exemption = exemptionBefore(source, index, rule);
  if (exemption) {
    findings.push({
      ...issue(rule, 'info', `已豁免：${exemption.reason}`, index, source),
      exemption,
    });
    return;
  }
  findings.push(issue(rule, severity, message, index, source));
};

export const auditMotion = (source, options = {}) => {
  const css = String(source ?? '');
  const findings = [];
  const maxDuration = Number.isFinite(options.maxDuration)
    ? options.maxDuration
    : 300;

  for (const match of css.matchAll(/\btransition\s*:\s*([^;}{]+)/gi)) {
    const value = match[1];
    const index = match.index ?? 0;
    if (/\ball\b/i.test(value)) {
      addFinding(findings, css, 'transition-all', 'error', '禁止使用 transition: all，请列出具体属性。', index);
    }
    if (/\b(?:top|right|bottom|left|width|height)\b/i.test(value)) {
      addFinding(findings, css, 'layout-property', 'warning', '应优先使用 transform/opacity，避免布局属性动画。', index);
    }
    if (/\bease-in\b(?!-out)/i.test(value)) {
      addFinding(findings, css, 'ease-in', 'error', 'UI 进入动画不得使用 ease-in。', index);
    }
    const duration = durationMs(value);
    if (duration !== null && duration > maxDuration) {
      addFinding(findings, css, 'duration', 'warning', `UI 动效时长 ${duration}ms 超过 ${maxDuration}ms 上限。`, index);
    }
  }

  for (const match of css.matchAll(/\b(?:transition-duration|animation-duration)\s*:\s*([^;}{]+)/gi)) {
    const duration = durationMs(match[1]);
    const index = match.index ?? 0;
    if (duration !== null && duration > maxDuration) {
      addFinding(findings, css, 'duration', 'warning', `UI 动效时长 ${duration}ms 超过 ${maxDuration}ms 上限。`, index);
    }
  }

  for (const match of css.matchAll(/\banimation\s*:\s*([^;}{]+)/gi)) {
    const value = match[1];
    const index = match.index ?? 0;
    if (/\bease-in\b(?!-out)/i.test(value)) {
      addFinding(findings, css, 'ease-in', 'error', 'UI 进入动画不得使用 ease-in。', index);
    }
    const duration = durationMs(value);
    if (duration !== null && duration > maxDuration) {
      addFinding(findings, css, 'duration', 'warning', `UI 动效时长 ${duration}ms 超过 ${maxDuration}ms 上限。`, index);
    }
  }

  for (const match of css.matchAll(/scale\(\s*0(?:[.]0*)?\s*\)/gi)) {
    addFinding(findings, css, 'scale-zero', 'error', '入场动画不得从 scale(0) 开始，应结合透明度从 0.95 或更高值进入。', match.index ?? 0);
  }

  for (const match of css.matchAll(/([^{]+\b(?:popover|dropdown|menu)\b[^{}]*)\{([^{}]*)\}/gi)) {
    if (/transform-origin\s*:\s*center\b/i.test(match[2])) {
      addFinding(findings, css, 'popover-origin', 'warning', 'Popover 应从触发点展开；Modal 可保持居中 origin。', (match.index ?? 0) + match[0].indexOf('transform-origin'));
    }
  }

  const hasMotion = /\b(?:transition|animation)\s*:/i.test(css);
  if (hasMotion && !/prefers-reduced-motion\s*:\s*reduce/i.test(css)) {
    addFinding(findings, css, 'reduced-motion', 'error', '包含动效的样式必须提供 prefers-reduced-motion: reduce 降级。', 0);
  }

  if (/:hover\b/i.test(css) && !/@media[^{}]*\(\s*hover\s*:\s*hover\s*\)[^{}]*\{/i.test(css)) {
    addFinding(findings, css, 'hover-gating', 'warning', 'Hover 动效应限制在 hover: hover 且 pointer: fine 的环境。', css.search(/:hover\b/i));
  }

  const errors = findings.filter(({ severity }) => severity === 'error');
  const warnings = findings.filter(({ severity }) => severity === 'warning');
  return {
    ok: errors.length === 0,
    issues: findings,
    summary: {
      errors: errors.length,
      warnings: warnings.length,
      exemptions: findings.filter(({ severity }) => severity === 'info').length,
    },
  };
};

const main = async () => {
  const path = resolve(process.argv[2] ?? '');
  if (!process.argv[2]) throw new Error('用法：node scripts/audit-motion.mjs <file.css>');
  const result = auditMotion(await readFile(path, 'utf8'));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
};

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    process.stderr.write(`动效审计错误：${error.message}\n`);
    process.exitCode = 1;
  });
}

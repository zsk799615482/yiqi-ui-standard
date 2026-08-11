#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const VALID_PAGE_TYPES = new Set([
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
]);

const SAAS_TYPES = new Set([
  'saas-operations',
  'saas-ai-workspace',
  'saas-analytics',
]);

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const INTERACTIVE_ELEMENTS = new Set([
  'button',
  'input',
  'select',
  'textarea',
]);

const parseAttributes = (source) => {
  const attributes = new Map();
  const pattern =
    /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attributes.set(name, value);
  }

  return attributes;
};

const findTagEnd = (html, start) => {
  let quote = null;

  for (let index = start; index < html.length; index += 1) {
    const character = html[index];

    if (quote) {
      if (character === quote) {
        quote = null;
      }
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index;
    }
  }

  return html.length - 1;
};

const parseDocument = (html) => {
  const elements = [];
  const stylesheetEntries = [];
  const stack = [];
  let htmlAttributes = null;
  let hasNestedCards = false;
  let index = 0;

  while (index < html.length) {
    const opening = html.indexOf('<', index);
    if (opening === -1) {
      break;
    }

    if (html.startsWith('<!--', opening)) {
      const commentEnd = html.indexOf('-->', opening + 4);
      index = commentEnd === -1 ? html.length : commentEnd + 3;
      continue;
    }

    const tagEnd = findTagEnd(html, opening + 1);
    const tagSource = html.slice(opening + 1, tagEnd).trim();
    index = tagEnd + 1;

    if (!tagSource || tagSource[0] === '!' || tagSource[0] === '?') {
      continue;
    }

    if (tagSource[0] === '/') {
      const closingName = tagSource
        .slice(1)
        .trim()
        .split(/\s+/, 1)[0]
        .toLowerCase();
      const stackIndex = stack.map(({ name }) => name).lastIndexOf(closingName);
      if (stackIndex !== -1) {
        stack.length = stackIndex;
      }
      continue;
    }

    const nameMatch = tagSource.match(/^([^\s/>]+)/);
    if (!nameMatch) {
      continue;
    }

    const name = nameMatch[1].toLowerCase();
    const selfClosing = /\/\s*$/.test(tagSource) || VOID_ELEMENTS.has(name);
    const attributeSource = tagSource
      .slice(nameMatch[0].length)
      .replace(/\/\s*$/, '');
    const attributes = parseAttributes(attributeSource);
    const isCard = attributes.has('data-ui-card');

    if (isCard && stack.some((element) => element.isCard)) {
      hasNestedCards = true;
    }

    const element = { name, attributes, isCard };
    elements.push(element);

    if (name === 'html' && htmlAttributes === null) {
      htmlAttributes = attributes;
    }

    if (
      name === 'link' &&
      (attributes.get('rel') ?? '')
        .toLowerCase()
        .split(/\s+/)
        .includes('stylesheet')
    ) {
      stylesheetEntries.push({
        type: 'link',
        href: (attributes.get('href') ?? '').trim(),
        media: (attributes.get('media') ?? '').trim(),
      });
    }

    if (name === 'style' || name === 'script') {
      const closingPattern = new RegExp(`<\\/\\s*${name}\\s*>`, 'ig');
      closingPattern.lastIndex = index;
      const closingMatch = closingPattern.exec(html);
      const contentEnd = closingMatch?.index ?? html.length;

      if (name === 'style') {
        stylesheetEntries.push({
          type: 'inline',
          css: html.slice(index, contentEnd),
          media: (attributes.get('media') ?? '').trim(),
        });
      }

      index = closingMatch ? closingPattern.lastIndex : html.length;
      continue;
    }

    if (!selfClosing) {
      stack.push(element);
    }
  }

  return {
    elements,
    hasNestedCards,
    htmlAttributes: htmlAttributes ?? new Map(),
    stylesheetEntries,
  };
};

const scanCss = (source, start, onCharacter) => {
  let quote = null;
  let inComment = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (inComment) {
      if (character === '*' && nextCharacter === '/') {
        inComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (character === '\\') {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '/' && nextCharacter === '*') {
      inComment = true;
      index += 1;
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    const result = onCharacter(character, index);
    if (result !== undefined) {
      return result;
    }
  }

  return -1;
};

const findNextOpeningBrace = (source, start) =>
  scanCss(source, start, (character, index) =>
    character === '{' ? index : undefined,
  );

const findClosingBrace = (source, openingBrace) => {
  let depth = 0;

  return scanCss(source, openingBrace, (character, index) => {
    if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
    return undefined;
  });
};

const stripCssComments = (source) => {
  let result = '';
  let quote = null;
  let inComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (inComment) {
      if (character === '*' && nextCharacter === '/') {
        inComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      result += character;
      if (character === '\\') {
        result += nextCharacter ?? '';
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '/' && nextCharacter === '*') {
      inComment = true;
      index += 1;
    } else {
      result += character;
      if (character === '"' || character === "'") {
        quote = character;
      }
    }
  }

  return result;
};

const findPreludeBoundary = (source, start, end) => {
  let boundary = start;
  let quote = null;
  let inComment = false;
  let parentheses = 0;
  let brackets = 0;

  for (let index = start; index < end; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (inComment) {
      if (character === '*' && nextCharacter === '/') {
        inComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (character === '\\') {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '/' && nextCharacter === '*') {
      inComment = true;
      index += 1;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '(') {
      parentheses += 1;
    } else if (character === ')') {
      parentheses = Math.max(0, parentheses - 1);
    } else if (character === '[') {
      brackets += 1;
    } else if (character === ']') {
      brackets = Math.max(0, brackets - 1);
    } else if (character === ';' && parentheses === 0 && brackets === 0) {
      boundary = index + 1;
    }
  }

  return boundary;
};

const collectCssBlocks = (
  source,
  ancestors = [],
  orderState = { value: 0 },
) => {
  const blocks = [];
  let cursor = 0;

  while (cursor < source.length) {
    const openingBrace = findNextOpeningBrace(source, cursor);
    if (openingBrace === -1) {
      break;
    }

    const closingBrace = findClosingBrace(source, openingBrace);
    if (closingBrace === -1) {
      break;
    }

    const preludeBoundary = findPreludeBoundary(source, cursor, openingBrace);
    const prelude = stripCssComments(
      source.slice(preludeBoundary, openingBrace),
    ).trim();
    const body = source.slice(openingBrace + 1, closingBrace);
    const block = {
      prelude,
      body,
      ancestors,
      order: orderState.value,
    };
    orderState.value += 1;
    blocks.push(block);

    if (prelude.startsWith('@')) {
      blocks.push(
        ...collectCssBlocks(body, [...ancestors, prelude], orderState),
      );
    }

    cursor = closingBrace + 1;
  }

  return blocks;
};

const findDeclarationColon = (source) => {
  let quote = null;
  let parentheses = 0;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (character === '\\') {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '(') {
      parentheses += 1;
    } else if (character === ')') {
      parentheses = Math.max(0, parentheses - 1);
    } else if (character === ':' && parentheses === 0) {
      return index;
    }
  }

  return -1;
};

const parseCssDeclarations = (source) => {
  const declarations = [];
  let quote = null;
  let inComment = false;
  let parentheses = 0;
  let segmentStart = 0;

  const appendDeclaration = (end) => {
    const segment = stripCssComments(source.slice(segmentStart, end)).trim();
    segmentStart = end + 1;
    if (!segment || segment.includes('{')) {
      return;
    }

    const colon = findDeclarationColon(segment);
    if (colon === -1) {
      return;
    }

    const property = segment.slice(0, colon).trim().toLowerCase();
    const value = segment.slice(colon + 1).trim();
    if (/^(?:--[\w-]+|[a-z-][\w-]*)$/i.test(property) && value) {
      declarations.push({ property, value, order: declarations.length });
    }
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (inComment) {
      if (character === '*' && nextCharacter === '/') {
        inComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (character === '\\') {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '/' && nextCharacter === '*') {
      inComment = true;
      index += 1;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '(') {
      parentheses += 1;
    } else if (character === ')') {
      parentheses = Math.max(0, parentheses - 1);
    } else if (character === ';' && parentheses === 0) {
      appendDeclaration(index);
    }
  }

  appendDeclaration(source.length);
  return declarations;
};

const cssDeclarationValues = (body, property) =>
  parseCssDeclarations(body)
    .filter((declaration) => declaration.property === property.toLowerCase())
    .map(({ value }) => value);

const stripImportant = (value) =>
  value.replace(/\s*!important\s*$/i, '').trim();

const largestAbsoluteLength = (source, rootFontSize) => {
  const values = [
    ...stripImportant(source).matchAll(/(-?\d*\.?\d+)\s*(px|rem)\b/gi),
  ]
    .map((match) => {
      const value = Number(match[1]);
      return match[2].toLowerCase() === 'rem'
        ? rootFontSize === null
          ? null
          : value * rootFontSize
        : value;
    })
    .filter((value) => value !== null);
  return values.length === 0 ? null : Math.max(...values);
};

const resolveSimpleLength = (source, rootFontSize) => {
  const value = stripImportant(source);
  if (/^0(?:\.0+)?$/.test(value)) {
    return 0;
  }

  const match = value.match(/^(-?\d*\.?\d+)\s*(px|rem)$/i);
  if (!match) {
    return null;
  }

  const number = Number(match[1]);
  if (match[2].toLowerCase() === 'rem') {
    return rootFontSize === null ? null : number * rootFontSize;
  }
  return number;
};

const classListIncludes = (attributes, className) =>
  (attributes.get('class') ?? '').split(/\s+/).includes(className);

const hasHeroEvidence = (elements) =>
  elements.some(
    ({ name, attributes }) =>
      (['img', 'video', 'canvas'].includes(name) &&
        attributes.has('data-ui-hero-media')) ||
      (attributes.get('data-ui-product-state') ?? '').trim().length > 0,
  );

const hasSaasHero = (elements) =>
  elements.some(
    ({ name, attributes }) =>
      (['section', 'header', 'div'].includes(name) &&
        classListIncludes(attributes, 'hero')) ||
      attributes.get('data-ui-role') === 'hero',
  );

const hasInteractiveElement = (elements) =>
  elements.some(
    ({ name, attributes }) =>
      INTERACTIVE_ELEMENTS.has(name) ||
      (name === 'a' && attributes.has('href')),
  );

const CONDITIONAL_AT_RULE =
  /^@(container|document|media|scope|starting-style|supports)\b/i;

const isStyleBlock = ({ prelude }) => !prelude.startsWith('@');

const isDefaultBlock = ({ ancestors }) =>
  ancestors.every((ancestor) => /^@layer\b/i.test(ancestor));

const isDefaultOrSupportsBlock = ({ ancestors }) =>
  ancestors.every(
    (ancestor) =>
      /^@layer\b/i.test(ancestor) || /^@supports\b/i.test(ancestor),
  );

const isMobileBlock = ({ ancestors }) => {
  const conditionalAncestors = ancestors.filter((ancestor) =>
    CONDITIONAL_AT_RULE.test(ancestor),
  );
  return (
    conditionalAncestors.length > 0 &&
    conditionalAncestors.every(
      (ancestor) =>
        /^@media\b/i.test(ancestor) &&
        /(?:max-width\s*:|\bwidth\s*(?:<=|<))/i.test(ancestor),
    )
  );
};

const isFeatureFallbackBlock = (block, feature) => {
  const conditionalAncestors = block.ancestors.filter((ancestor) =>
    CONDITIONAL_AT_RULE.test(ancestor),
  );
  return (
    conditionalAncestors.length === 1 &&
    /^@media\b/i.test(conditionalAncestors[0]) &&
    new RegExp(`${feature}\\s*:\\s*reduce`, 'i').test(
      conditionalAncestors[0],
    )
  );
};

const selectorList = (prelude) =>
  prelude
    .split(',')
    .map((selector) => selector.trim())
    .filter(Boolean);

const finalSelectorCompound = (selector) => {
  let boundary = 0;
  let quote = null;
  let brackets = 0;
  let parentheses = 0;

  for (let index = 0; index < selector.length; index += 1) {
    const character = selector[index];

    if (quote) {
      if (character === '\\') {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '[') {
      brackets += 1;
    } else if (character === ']') {
      brackets = Math.max(0, brackets - 1);
    } else if (character === '(') {
      parentheses += 1;
    } else if (character === ')') {
      parentheses = Math.max(0, parentheses - 1);
    } else if (
      brackets === 0 &&
      parentheses === 0 &&
      (/\s/.test(character) || /[>+~]/.test(character))
    ) {
      boundary = index + 1;
    }
  }

  return selector.slice(boundary).trim();
};

const selectorTargetsHeading = (prelude) =>
  selectorList(prelude).some((selector) => {
    const compound = finalSelectorCompound(selector);
    return (
      /^h1(?=$|[.#:]|\[)/i.test(compound) ||
      /\.display-title\b/i.test(compound) ||
      /\[\s*data-ui-role\s*=\s*["']hero-title["']\s*\]/i.test(compound)
    );
  });

const rootSelectorSpecificity = (prelude, rootOnly = false) =>
  Math.max(
    ...selectorList(prelude).map((selector) => {
      if (selector === ':root') {
        return 10;
      }
      if (!rootOnly && selector.toLowerCase() === 'html') {
        return 1;
      }
      return -Infinity;
    }),
  );

const declarationValue = (value) => ({
  important: /\s!important\s*$/i.test(value),
  value: stripImportant(value),
});

const effectiveRootDeclaration = (
  blocks,
  htmlAttributes,
  property,
  { rootOnly = false } = {},
) => {
  let winner = null;

  const consider = (candidate) => {
    if (
      winner === null ||
      Number(candidate.important) > Number(winner.important) ||
      (candidate.important === winner.important &&
        candidate.specificity > winner.specificity) ||
      (candidate.important === winner.important &&
        candidate.specificity === winner.specificity &&
        candidate.order > winner.order)
    ) {
      winner = candidate;
    }
  };

  for (const block of blocks) {
    if (!isStyleBlock(block) || !isDefaultBlock(block)) {
      continue;
    }

    const specificity = rootSelectorSpecificity(block.prelude, rootOnly);
    if (!Number.isFinite(specificity)) {
      continue;
    }

    for (const declaration of parseCssDeclarations(block.body)) {
      if (declaration.property !== property.toLowerCase()) {
        continue;
      }
      const parsed = declarationValue(declaration.value);
      consider({
        ...parsed,
        specificity,
        order: block.order * 1000 + declaration.order,
      });
    }
  }

  for (const declaration of parseCssDeclarations(
    htmlAttributes.get('style') ?? '',
  )) {
    if (declaration.property !== property.toLowerCase()) {
      continue;
    }
    const parsed = declarationValue(declaration.value);
    consider({
      ...parsed,
      specificity: 1000,
      order: Number.MAX_SAFE_INTEGER,
    });
  }

  return winner;
};

const selectorTargetsCard = (prelude) =>
  selectorList(prelude).some((selector) => {
    const compound = finalSelectorCompound(selector);
    return (
      /\[\s*data-ui-card\s*\]/i.test(compound) &&
      !/::[\w-]+/.test(compound)
    );
  });

const selectorTargetsLiquidRoot = (selector) =>
  /:root\s*\[\s*data-ui-card-material\s*=\s*(?:"liquid-glass"|'liquid-glass'|liquid-glass)\s*\]/i.test(
    selector,
  );

const hasLiquidGlassBackdrop = (blocks) =>
  blocks.some((block) => {
    if (
      !isStyleBlock(block) ||
      !isDefaultOrSupportsBlock(block) ||
      !selectorTargetsCard(block.prelude)
    ) {
      return false;
    }

    return [
      ...cssDeclarationValues(block.body, 'backdrop-filter'),
      ...cssDeclarationValues(block.body, '-webkit-backdrop-filter'),
    ].some((value) => !/^none\b/i.test(value));
  });

const hasLiquidGlassFallback = (blocks) => {
  const relevantBlocks = blocks.filter(
    (block) =>
      isStyleBlock(block) &&
      isFeatureFallbackBlock(block, 'prefers-reduced-transparency') &&
      (selectorTargetsCard(block.prelude) ||
        selectorTargetsLiquidRoot(block.prelude)),
  );
  const hasEntityFallback = relevantBlocks.some(
    ({ body }) =>
      cssDeclarationValues(body, 'background').length > 0 ||
      cssDeclarationValues(body, 'background-color').length > 0 ||
      cssDeclarationValues(body, '--card-background').length > 0,
  );
  const disablesBackdrop = relevantBlocks.some(
    ({ prelude, body }) =>
      selectorTargetsCard(prelude) &&
      [
        ...cssDeclarationValues(body, 'backdrop-filter'),
        ...cssDeclarationValues(body, '-webkit-backdrop-filter'),
      ].some((value) => /^none\b/i.test(stripImportant(value))),
  );

  return hasEntityFallback && disablesBackdrop;
};

const hasDecorativeCircle = (blocks) =>
  blocks.some(({ prelude, body }) => {
    if (prelude.startsWith('@')) {
      return false;
    }

    const width = Math.max(
      ...cssDeclarationValues(body, 'width')
        .map((value) => resolveSimpleLength(value, 16))
        .filter((value) => value !== null),
      -Infinity,
    );
    const height = Math.max(
      ...cssDeclarationValues(body, 'height')
        .map((value) => resolveSimpleLength(value, 16))
        .filter((value) => value !== null),
      -Infinity,
    );
    const isRound = cssDeclarationValues(body, 'border-radius').some((value) =>
      /\b50%/.test(value),
    );
    const isNamedCircle = /(?:orb|orbit|sphere|circle)/i.test(prelude);
    const hasGeneratedContent = cssDeclarationValues(body, 'content').length > 0;

    return (
      width >= 96 &&
      height >= 96 &&
      isRound &&
      (isNamedCircle || hasGeneratedContent)
    );
  });

const hasHeroSplit = (blocks) => {
  const heroUsesColumns = blocks.some(
    ({ prelude, body }) =>
      /\.hero\b/i.test(prelude) &&
      cssDeclarationValues(body, 'grid-template-columns').length > 0,
  );
  const hasHeroAside = blocks.some(({ prelude }) =>
    /\.hero-aside\b/i.test(prelude),
  );
  return heroUsesColumns && hasHeroAside;
};

const isLocalStylesheetHref = (href) => {
  if (!href) {
    return false;
  }

  try {
    const url = new URL(href, 'file:///ui-standard/document.html');
    return url.protocol === 'file:' && url.hostname === '';
  } catch {
    return false;
  }
};

const normalizeLinkedCss = (linkedCss) => {
  if (linkedCss instanceof Map) {
    return linkedCss;
  }
  if (linkedCss && typeof linkedCss === 'object') {
    return new Map(Object.entries(linkedCss));
  }
  return new Map();
};

const wrapStylesheetMedia = (css, media) =>
  media ? `@media ${media} {\n${css}\n}` : css;

const buildStyleSource = (document, linkedCss, addIssue) => {
  const sources = [];

  for (const entry of document.stylesheetEntries) {
    if (entry.type === 'inline') {
      sources.push(wrapStylesheetMedia(entry.css, entry.media));
      continue;
    }

    if (!isLocalStylesheetHref(entry.href)) {
      addIssue(
        'stylesheet-link-unsupported',
        `样式表链接仅支持本地文件，不能使用远程、data 或其他 URL：${entry.href || '空链接'}。`,
      );
      continue;
    }

    if (!linkedCss.has(entry.href)) {
      addIssue(
        'stylesheet-link-unloaded',
        `未提供本地样式表内容：${entry.href}。`,
      );
      continue;
    }

    sources.push(
      wrapStylesheetMedia(String(linkedCss.get(entry.href)), entry.media),
    );
  }

  return sources.join('\n');
};

const isHeadingElement = ({ name, attributes }) =>
  name === 'h1' ||
  classListIncludes(attributes, 'display-title') ||
  attributes.get('data-ui-role') === 'hero-title';

const inspectHeadingValue = (value, limit, rootFontSize) => {
  const resolved = resolveSimpleLength(value, rootFontSize);
  if (resolved !== null) {
    return resolved > limit ? 'too-large' : 'ok';
  }

  const largestAbsolute = largestAbsoluteLength(value, rootFontSize);
  if (largestAbsolute !== null && largestAbsolute > limit) {
    return 'too-large';
  }
  return 'unverifiable';
};

const classifyDesktopCardRadius = (value, rootRadius) => {
  const normalized = stripImportant(value);
  if (
    /^var\(\s*--radius-card(?:\s*,[^)]+)?\s*\)$/i.test(normalized)
  ) {
    return rootRadius !== null && rootRadius >= 36 ? 'ok' : 'too-small';
  }

  const match = normalized.match(/^(-?\d*\.?\d+)\s*px$/i);
  if (!match) {
    return 'invalid';
  }
  return Number(match[1]) >= 36 ? 'ok' : 'too-small';
};

const classifyMobileCardRadius = (value, mobileRootRadius) => {
  const normalized = stripImportant(value);
  if (
    /^var\(\s*--radius-card(?:\s*,[^)]+)?\s*\)$/i.test(normalized)
  ) {
    return mobileRootRadius !== null &&
      mobileRootRadius >= 28 &&
      mobileRootRadius <= 36
      ? 'ok'
      : 'invalid';
  }

  const match = normalized.match(/^(-?\d*\.?\d+)\s*px$/i);
  if (!match) {
    return 'invalid';
  }
  const radius = Number(match[1]);
  return radius >= 28 && radius <= 36 ? 'ok' : 'invalid';
};

const MOTION_PROPERTIES = new Set([
  'animation',
  'animation-name',
  'animation-duration',
  'animation-delay',
  'animation-direction',
  'animation-fill-mode',
  'animation-iteration-count',
  'animation-play-state',
  'animation-timing-function',
  'animation-timeline',
  'transition',
  'transition-property',
  'transition-duration',
  'transition-delay',
  'transition-timing-function',
  'transition-behavior',
]);

const timeValueInMilliseconds = (value) => {
  const match = stripImportant(value).match(/^(-?\d*\.?\d+)\s*(ms|s)$/i);
  if (!match) {
    return null;
  }
  return Number(match[1]) * (match[2].toLowerCase() === 's' ? 1000 : 1);
};

const isActiveMotionDeclaration = ({ property, value }) => {
  if (!MOTION_PROPERTIES.has(property)) {
    return false;
  }

  const normalized = stripImportant(value);
  if (
    ['animation', 'animation-name', 'transition', 'transition-property'].includes(
      property,
    ) &&
    /^none\b/i.test(normalized)
  ) {
    return false;
  }

  if (property.endsWith('-duration') || property.endsWith('-delay')) {
    const times = normalized.split(',').map((part) =>
      timeValueInMilliseconds(part.trim()),
    );
    return times.some((time) => time === null || time > 0.01);
  }

  return true;
};

const isMotionDisablingDeclaration = ({ property, value }) => {
  const normalized = stripImportant(value);
  if (
    ['animation', 'animation-name', 'transition', 'transition-property'].includes(
      property,
    ) &&
    /^none\b/i.test(normalized)
  ) {
    return true;
  }

  if (property === 'animation-duration' || property === 'transition-duration') {
    const times = normalized.split(',').map((part) =>
      timeValueInMilliseconds(part.trim()),
    );
    return (
      times.length > 0 &&
      times.every((time) => time !== null && time <= 0.01)
    );
  }

  return property === 'scroll-behavior' && /^auto\b/i.test(normalized);
};

const declarationsContainBrandColor = (source) =>
  parseCssDeclarations(source).some(
    ({ property, value }) =>
      !property.startsWith('--') && /#9a6aba\b/i.test(value),
  );

const createIssue = (code, message) => ({
  code,
  severity: 'error',
  message,
});

export const analyzeHtml = (html, options = {}) => {
  const document = parseDocument(String(html));
  const { elements, htmlAttributes } = document;
  const issues = [];
  const issueCodes = new Set();
  const addIssue = (code, message) => {
    if (!issueCodes.has(code)) {
      issueCodes.add(code);
      issues.push(createIssue(code, message));
    }
  };
  const styleSource = buildStyleSource(
    document,
    normalizeLinkedCss(options.linkedCss),
    addIssue,
  );
  const blocks = collectCssBlocks(styleSource);

  const metadataPageType = (
    htmlAttributes.get('data-ui-page-type') ?? ''
  ).trim();
  const hasPageTypeOverride =
    typeof options.pageType === 'string' && options.pageType.trim().length > 0;
  const pageTypeOverride = hasPageTypeOverride
    ? options.pageType.trim()
    : '';
  const metadataPageTypeIsValid = VALID_PAGE_TYPES.has(metadataPageType);
  const pageTypeOverrideIsValid = VALID_PAGE_TYPES.has(pageTypeOverride);
  const pageType = pageTypeOverrideIsValid
    ? pageTypeOverride
    : metadataPageTypeIsValid
      ? metadataPageType
      : 'marketing';
  const hero = htmlAttributes.get('data-ui-hero');
  const cardMaterial = htmlAttributes.get('data-ui-card-material');
  const isSaas = SAAS_TYPES.has(pageType);
  const heroEvidence = hasHeroEvidence(elements);
  const cards = elements.filter(({ isCard }) => isCard);

  if (!metadataPageType && !hasPageTypeOverride) {
    addIssue(
      'page-type-required',
      'html 元素必须声明 data-ui-page-type。',
    );
  }

  if (metadataPageType && !metadataPageTypeIsValid) {
    addIssue(
      'page-type-invalid',
      `data-ui-page-type 的值无效：${metadataPageType}。必须使用文档定义的十二种页面类型之一。`,
    );
  }

  if (hasPageTypeOverride && !pageTypeOverrideIsValid) {
    addIssue(
      'page-type-invalid',
      `--page-type 的值无效：${pageTypeOverride}。必须使用文档定义的十二种页面类型之一。`,
    );
  }

  if (!hero) {
    addIssue(
      'hero-metadata-required',
      'html 元素必须声明 data-ui-hero。',
    );
  }

  const colorScheme = effectiveRootDeclaration(
    blocks,
    htmlAttributes,
    'color-scheme',
  );
  const preferredColorScheme = colorScheme?.value
    .replace(/^only\s+/i, '')
    .trim()
    .split(/\s+/, 1)[0]
    .toLowerCase();
  if (preferredColorScheme !== 'dark') {
    addIssue(
      'dark-theme-required',
      '默认的 :root 或 html 必须以 dark 作为首选 color-scheme。',
    );
  }

  const rootFontSizeDeclaration = effectiveRootDeclaration(
    blocks,
    htmlAttributes,
    'font-size',
  );
  const rootFontSize = rootFontSizeDeclaration
    ? resolveSimpleLength(rootFontSizeDeclaration.value, 16)
    : 16;
  const headingLimit = isSaas ? 24 : 42;
  const headingValues = blocks
    .filter(
      (block) =>
        isStyleBlock(block) && selectorTargetsHeading(block.prelude),
    )
    .flatMap(({ body }) => cssDeclarationValues(body, 'font-size'));
  for (const element of elements.filter(isHeadingElement)) {
    headingValues.push(
      ...cssDeclarationValues(
        element.attributes.get('style') ?? '',
        'font-size',
      ),
    );
  }
  const headingResults = headingValues.map((value) =>
    inspectHeadingValue(value, headingLimit, rootFontSize),
  );
  if (headingResults.includes('too-large')) {
    addIssue(
      'heading-too-large',
      `页面类型 ${pageType} 的标题字号不得超过 ${headingLimit}px。`,
    );
  }
  if (headingResults.includes('unverifiable')) {
    addIssue(
      'heading-size-unverifiable',
      `标题字号必须使用可静态确认不超过 ${headingLimit}px 的 px 或 rem 值。`,
    );
  }

  if (cards.length > 0) {
    if (!cardMaterial) {
      addIssue(
        'card-material-required',
        '包含 data-ui-card 元素的页面必须声明 data-ui-card-material。',
      );
    }

    const rootRadiusDeclaration = effectiveRootDeclaration(
      blocks,
      htmlAttributes,
      '--radius-card',
      { rootOnly: true },
    );
    const rootRadius = rootRadiusDeclaration
      ? resolveSimpleLength(rootRadiusDeclaration.value, rootFontSize)
      : null;
    if (rootRadius === null || rootRadius < 36) {
      addIssue(
        'card-radius-too-small',
        '根级 --radius-card 的值不得小于 36px。',
      );
    }

    const defaultCardRadiusValues = blocks
      .filter(
        (block) =>
          isStyleBlock(block) &&
          isDefaultBlock(block) &&
          selectorTargetsCard(block.prelude),
      )
      .flatMap(({ body }) => cssDeclarationValues(body, 'border-radius'));
    const defaultCardRadiusResults = defaultCardRadiusValues.map((value) =>
      classifyDesktopCardRadius(value, rootRadius),
    );
    const hasDefaultCardRadius =
      defaultCardRadiusResults.includes('ok');
    let hasMissingCardRadius = false;

    if (defaultCardRadiusResults.includes('too-small')) {
      addIssue(
        'card-radius-too-small',
        '卡片默认 border-radius 不得小于 36px。',
      );
    } else if (
      defaultCardRadiusValues.length > 0 &&
      !hasDefaultCardRadius
    ) {
      addIssue(
        'card-radius-application-required',
        '卡片默认样式必须通过 var(--radius-card) 或不小于 36px 的字面值应用 border-radius。',
      );
    }

    let allCardsHaveCompliantRadius = true;
    for (const card of cards) {
      const inlineRadiusValues = cssDeclarationValues(
        card.attributes.get('style') ?? '',
        'border-radius',
      );
      if (inlineRadiusValues.length === 0) {
        if (!hasDefaultCardRadius) {
          allCardsHaveCompliantRadius = false;
          if (
            defaultCardRadiusValues.length === 0 ||
            defaultCardRadiusResults.every((result) => result === 'invalid')
          ) {
            hasMissingCardRadius = true;
          }
        }
        continue;
      }

      const result = classifyDesktopCardRadius(
        inlineRadiusValues.at(-1),
        rootRadius,
      );
      if (result === 'too-small') {
        allCardsHaveCompliantRadius = false;
        addIssue(
          'card-radius-too-small',
          '卡片 inline border-radius 不得小于 36px。',
        );
      } else if (result === 'invalid') {
        allCardsHaveCompliantRadius = false;
        addIssue(
          'card-radius-application-required',
          '卡片 inline border-radius 必须使用 var(--radius-card) 或不小于 36px 的字面值。',
        );
      }
    }

    if (hasMissingCardRadius) {
      addIssue(
        'card-radius-application-required',
        '每个卡片必须由默认规则或 inline 样式实际应用合规 border-radius。',
      );
    }

    const mobileRootRadiusDeclarations = blocks
      .filter(
        (block) =>
          isStyleBlock(block) &&
          isMobileBlock(block) &&
          Number.isFinite(rootSelectorSpecificity(block.prelude, true)),
      )
      .flatMap((block) =>
        parseCssDeclarations(block.body)
          .filter(({ property }) => property === '--radius-card')
          .map((declaration) => ({
            order: block.order * 1000 + declaration.order,
            value: declaration.value,
          })),
      )
      .sort((left, right) => left.order - right.order);
    const mobileRootRadiusValue =
      mobileRootRadiusDeclarations.at(-1)?.value ?? null;
    const resolveMobileRootRadius = (value) => {
      if (value === null) {
        return rootRadius;
      }

      const customProperty = stripImportant(value).match(
        /^var\(\s*(--[\w-]+)(?:\s*,[^)]+)?\s*\)$/i,
      )?.[1];
      if (!customProperty) {
        return resolveSimpleLength(value, rootFontSize);
      }
      if (customProperty === '--radius-card') {
        return rootRadius;
      }

      const declaration = effectiveRootDeclaration(
        blocks,
        htmlAttributes,
        customProperty,
        { rootOnly: true },
      );
      return declaration
        ? resolveSimpleLength(declaration.value, rootFontSize)
        : null;
    };
    const mobileRootRadius = resolveMobileRootRadius(mobileRootRadiusValue);

    const mobileRadiusValues = blocks
      .filter(
        (block) =>
          isStyleBlock(block) &&
          isMobileBlock(block) &&
          selectorTargetsCard(block.prelude),
      )
      .flatMap(({ body }) => cssDeclarationValues(body, 'border-radius'));
    if (
      (mobileRootRadiusValue !== null &&
        (mobileRootRadius === null ||
          mobileRootRadius < 28 ||
          mobileRootRadius > 36)) ||
      mobileRadiusValues.some(
        (value) =>
          classifyMobileCardRadius(value, mobileRootRadius) !== 'ok',
      )
    ) {
      addIssue(
        'card-radius-mobile-invalid',
        '移动端卡片 border-radius 必须在 28–36px 范围内。',
      );
    }

    const hasStylesheetSquircle = blocks.some(
      (block) =>
        isStyleBlock(block) &&
        isDefaultOrSupportsBlock(block) &&
        selectorTargetsCard(block.prelude) &&
        cssDeclarationValues(block.body, 'corner-shape').some((value) =>
          /\bsquircle\b/i.test(stripImportant(value)),
        ),
    );
    const allCardsHaveInlineSquircle = cards.every((card) =>
      cssDeclarationValues(
        card.attributes.get('style') ?? '',
        'corner-shape',
      ).some((value) => /\bsquircle\b/i.test(stripImportant(value))),
    );
    if (
      !(hasStylesheetSquircle || allCardsHaveInlineSquircle) ||
      !allCardsHaveCompliantRadius
    ) {
      addIssue(
        'corner-shape-required',
        '卡片必须在合规默认 border-radius 的基础上应用 corner-shape: squircle；仅 media 规则不能满足默认。',
      );
    }
  }

  if (document.hasNestedCards) {
    addIssue('nested-card', 'data-ui-card 不得嵌套另一个卡片。');
  }

  if (
    cardMaterial === 'liquid-glass' &&
    (!hasLiquidGlassBackdrop(blocks) || !hasLiquidGlassFallback(blocks))
  ) {
    addIssue(
      'liquid-glass-fallback-required',
      '液态玻璃卡片必须提供 backdrop-filter 和完整的降低透明度实体回退。',
    );
  }

  if (hasDecorativeCircle(blocks)) {
    addIssue(
      'decorative-circle',
      '不允许使用大型装饰圆形。',
    );
  }

  if (hasHeroSplit(blocks) && !heroEvidence) {
    addIssue(
      'hero-split-decorative',
      '分栏 Hero 必须包含有意义的产品或媒体证据。',
    );
  }

  if (hero === 'approved' && !heroEvidence) {
    addIssue(
      'hero-evidence-required',
      '已批准的 Hero 必须包含产品状态或 Hero 媒体证据。',
    );
  }

  if (isSaas && hasSaasHero(elements)) {
    addIssue(
      'saas-hero-forbidden',
      'SaaS 工作区不得渲染 Hero 容器。',
    );
  }

  const hasStylesheetBrandColor = blocks.some(
    (block) =>
      isStyleBlock(block) && declarationsContainBrandColor(block.body),
  );
  const hasInlineBrandColor = elements.some(({ attributes }) =>
    declarationsContainBrandColor(attributes.get('style') ?? ''),
  );
  if (hasStylesheetBrandColor || hasInlineBrandColor) {
    addIssue(
      'brand-color-hardcoded',
      '请使用设计令牌，不要硬编码 #9a6aba。',
    );
  }

  const hasFocusVisibleRule = blocks.some(
    (block) =>
      isStyleBlock(block) && /:focus-visible\b/i.test(block.prelude),
  );
  if (hasInteractiveElement(elements) && !hasFocusVisibleRule) {
    addIssue(
      'focus-visible-required',
      '交互元素必须提供 :focus-visible 样式。',
    );
  }

  const hasMotionDeclaration =
    blocks.some(
      (block) =>
        isStyleBlock(block) &&
        parseCssDeclarations(block.body).some(isActiveMotionDeclaration),
    ) ||
    elements.some(({ attributes }) =>
      parseCssDeclarations(attributes.get('style') ?? '').some(
        isActiveMotionDeclaration,
      ),
    );
  const hasReducedMotionFallback = blocks.some(
    (block) =>
      isStyleBlock(block) &&
      isFeatureFallbackBlock(block, 'prefers-reduced-motion') &&
      parseCssDeclarations(block.body).some(isMotionDisablingDeclaration),
  );
  if (hasMotionDeclaration && !hasReducedMotionFallback) {
    addIssue(
      'reduced-motion-required',
      '动画和过渡样式必须提供减少动态效果的回退。',
    );
  }

  return {
    ok: !issues.some(({ severity }) => severity === 'error'),
    pageType,
    issues,
  };
};

const parseArguments = (args) => {
  const options = { json: false };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--json') {
      options.json = true;
      continue;
    }

    if (argument === '--file' || argument === '--page-type') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`参数 ${argument} 缺少值。`);
      }
      const key = argument === '--file' ? 'file' : 'pageType';
      options[key] = value;
      index += 1;
      continue;
    }

    throw new Error(`未知参数：${argument}`);
  }

  if (!options.file) {
    throw new Error('缺少必需的 --file 参数。');
  }

  return options;
};

const loadLinkedCss = async (html, filePath) => {
  const linkedCss = new Map();
  const document = parseDocument(html);
  const baseUrl = pathToFileURL(filePath);

  for (const entry of document.stylesheetEntries) {
    if (
      entry.type !== 'link' ||
      !isLocalStylesheetHref(entry.href) ||
      linkedCss.has(entry.href)
    ) {
      continue;
    }

    const stylesheetUrl = new URL(entry.href, baseUrl);
    stylesheetUrl.hash = '';
    stylesheetUrl.search = '';
    const stylesheetPath = fileURLToPath(stylesheetUrl);

    try {
      linkedCss.set(entry.href, await readFile(stylesheetPath, 'utf8'));
    } catch {
      throw new Error(
        `无法读取关联样式表：${entry.href}。请确认相对于 HTML 文件的路径存在且可读。`,
      );
    }
  }

  return linkedCss;
};

const main = async () => {
  const options = parseArguments(process.argv.slice(2));
  const filePath = resolve(options.file);
  let html;

  try {
    html = await readFile(filePath, 'utf8');
  } catch {
    throw new Error(
      `无法读取文件：${filePath}。请确认文件路径存在且具有读取权限。`,
    );
  }
  const linkedCss = await loadLinkedCss(html, filePath);
  const report = analyzeHtml(html, {
    linkedCss,
    pageType: options.pageType,
  });

  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (report.issues.length === 0) {
    process.stdout.write('UI Standard 静态校验通过\n');
  } else {
    for (const issue of report.issues) {
      process.stdout.write(`[错误] ${issue.code}：${issue.message}\n`);
    }
  }

  process.exitCode = report.ok ? 0 : 1;
};

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main().catch((error) => {
    process.stderr.write(`UI Standard 校验器错误：${error.message}\n`);
    process.exitCode = 1;
  });
}

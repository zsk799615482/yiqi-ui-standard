# Yiqi UI Standard Reference Integration Implementation Plan

> **For agentic workers:** Implement this plan task-by-task. This plan intentionally uses implementation-first verification; do not use TDD or write failing tests before implementation.

**Goal:** 内化 Emil / Apple 的动效判断与 `pick-ui-library` 的依赖选择方法，建立独立的通用库选择层，并补齐可审计的动效验证与来源治理。

**Architecture:** `yiqi-ui-standard` remains the only entry point. Motion guidance is consolidated in `references/animation-craft.md`; general engineering dependencies are governed by `library-selection.md` and `library-catalog.json`; Showcase visual sources remain in `showcase-catalog.json`. A read-only motion auditor and regression tests enforce the boundaries.

**Tech Stack:** Markdown, JSON, Node.js 18+, Node built-in test runner, existing Yiqi static validator.

**Spec:** `docs/superpowers/specs/2026-09-02-yiqi-reference-integration-design.md`

## Global Constraints

- 不复制或安装 `emilkowalski/skills`。
- 不增加 GitHub 运行时依赖。
- 不自动安装、升级或替换业务项目依赖。
- `showcase-catalog.json` 只管理高级视觉效果；`library-catalog.json` 只管理通用工程依赖。
- 所有输出继续使用中文，并遵守 Yiqi 的品牌入口、产品画像和验收契约。
- 全程不使用 TDD；先实现，再运行验证和回归测试。
- 浏览器视觉验收放在全部静态、自动化和依赖边界检查之后，作为最后的非阻塞复核；发现问题只记录，不阻塞主任务完成。

### Task 1: Add canonical motion craft reference

**Files:**
- Create: `references/animation-craft.md`
- Modify: `references/motion-standards.md`
- Modify: `references/review-checklist.md`
- Modify: `references/showcase-mode.md`

- [ ] **Step 1: Write the canonical motion document**
  Include the existence/frequency/purpose gate, semantic duration and easing tokens, spring and gesture rules, performance rules, reduced-motion/transparency behavior, Standard vs Showcase exceptions, and explicit OneSeven precedence.

- [ ] **Step 2: Point existing documents to the canonical source**
  Replace “待创建” references and duplicated introductory claims with links to `animation-craft.md`; retain local checklists and Showcase-specific requirements.

- [ ] **Step 3: Verify documentation consistency**
  Run `rg -n '待创建|animation-craft|ease-in|scale\\(0\\)|transition: all' references` and inspect that the canonical document contains the normative values while other documents link back to it.

### Task 2: Add general library selection layer

**Files:**
- Create: `references/library-selection.md`
- Create: `references/library-catalog.json`
- Modify: `SKILL.md`
- Modify: `README.md`
- Modify: `references/showcase-mode.md`

- [ ] **Step 1: Define the selection method**
  Document task-first matching, `package.json` inspection, native-first choice, no dependency churn, one recommendation, license/accessibility/performance checks, explicit fallback, and no automatic installation.

- [ ] **Step 2: Create a small catalog**
  Add permissive, stack-scoped entries for representative tasks such as toast, command menu, accessible primitives, charts, drag-and-drop, virtualization, state, class variants, and dark-mode orchestration. Keep versions advisory and require re-verification at implementation time.

- [ ] **Step 3: Add the Yiqi routing contract**
  Add a code-implementation step for dependency selection and document the distinction between the general library catalog and the Showcase effects catalog.

- [ ] **Step 4: Verify catalog shape**
  Parse JSON with Node and check required fields and that no catalog entry is a Showcase-only heavy runtime.

### Task 3: Add external source ledger

**Files:**
- Create: `references/external-source-map.json`
- Modify: `references/emil-integration-plan.md`

- [ ] **Step 1: Record the reviewed snapshot**
  Record repository, commit `d23d7f8`, MIT license, review date `2026-09-02`, next review date `2027-03-02`, internalized skills, excluded skills, and conflict precedence.

- [ ] **Step 2: Align the existing integration plan**
  Update the plan so it describes the canonical documents and library-selection layer instead of leaving the old “do not need” conclusion for `pick-ui-library`.

- [ ] **Step 3: Verify ledger completeness**
  Parse the ledger and assert every source record includes source, commit, license, reviewed, nextReview, and integration status.

### Task 4: Add motion audit utility

**Files:**
- Create: `scripts/audit-motion.mjs`
- Create: `tests/fixtures/motion-valid.css`
- Create: `tests/fixtures/motion-invalid.css`

- [ ] **Step 1: Implement a read-only CSS auditor**
  Export `auditMotion(source, options)` and return `{ ok, issues, summary }`. Detect `ease-in` on UI transitions/animations, `scale(0)` entrances, `transition: all`, durations over 300ms unless explicitly allowed, layout-property transitions, missing reduced-motion coverage, center-origin popovers, and ungated hover motion.

- [ ] **Step 2: Implement explicit auditable exemptions**
  Recognize `/* yiqi-motion: allow <rule> reason="..." */` immediately before a declaration or block. Preserve the reason in the result and never silently suppress a finding.

- [ ] **Step 3: Add fixtures**
  Provide one clean fixture demonstrating semantic tokens, reduced-motion, hover gating, and trigger-aware origin; provide one invalid fixture covering the main violations and one documented exception.

### Task 5: Add regression tests and documentation checks

**Files:**
- Create: `tests/motion-audit.test.mjs`
- Create: `tests/library-catalog.test.mjs`
- Modify: `tests/skill-contract.test.mjs`
- Modify: `tests/validate-generated-web.test.mjs` only if a boundary assertion is needed

- [ ] **Step 1: Test the implemented auditor**
  Assert valid fixture passes, invalid fixture reports stable rule IDs, exemptions remain visible, and the auditor does not mutate files.

- [ ] **Step 2: Test the library catalog contract**
  Assert required fields, supported stacks, license classes, fallbacks, and separation from Showcase-only entries.

- [ ] **Step 3: Extend the skill contract**
  Assert the new references, routing language, source ledger, and no-auto-install rules are present.

- [ ] **Step 4: Run the full suite after implementation**
  Run `node --test tests/*.test.mjs` from `yiqi-ui-standard` and fix regressions without introducing TDD cycles.

### Task 6: Align tokens, README, and version

**Files:**
- Modify: `design-tokens.json`
- Modify: `theme.css`
- Modify: `README.md`
- Modify: `VERSION`

- [ ] **Step 1: Add semantic motion tokens**
  Add `motion.duration`, `motion.easing`, `motion.spring`, and `motion.reducedMotion` to JSON; add matching CSS aliases without removing existing variables.

- [ ] **Step 2: Document the two-catalog boundary**
  Explain general dependency selection, Showcase effect selection, and external-source governance in the README.

- [ ] **Step 3: Bump the skill version**
  Set `VERSION` and token metadata to `3.2.0` after the AI component and discovery-source extension also passes verification.

- [ ] **Step 4: Final verification**
  Run JSON parsing, `git diff --check`, all Node tests, and a focused audit against both fixtures. Only static checks, JSON parsing, automated tests, and dependency-boundary checks are blocking gates. Run browser visual verification last as a non-blocking review; if it finds issues, record screenshots, findings, and follow-up suggestions without reopening implementation unless explicitly requested. If the browser environment is unavailable, record `待视觉复核` and do not wait or retry indefinitely. Report any pre-existing user changes separately.

## Browser visual verification policy

Browser verification is deliberately last and non-blocking for this fast-track integration. It must not delay completion after the blocking checks pass.

- Blocking: JSON parsing, static validation, motion-audit results, automated tests, `git diff --check`, and Standard/Showcase dependency-boundary checks.
- Non-blocking: desktop/mobile visual screenshots, reduced-motion visual inspection, and browser console review.
- If visual review finds a defect, include the page, viewport, screenshot path, severity, and suggested follow-up; do not claim the visual issue was fixed unless it was actually fixed.
- If the browser is unavailable, report `待视觉复核（浏览器环境不可用）` and finish the main task.

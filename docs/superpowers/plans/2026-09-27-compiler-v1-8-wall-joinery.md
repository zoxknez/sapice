# Compiler v1.8 Wall Joinery and Local Quality Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the local software quality gate and verify/fix the compiler v1.8 wall-joinery refactor across canonical geometry, thermal accounting, fabrication, validation, UI and exports.

**Architecture:** Keep `wallJoineryGeometry(model)` as the shared dimensional source of truth and keep thermal accounting on the full exterior side envelope, including corner returns. Compile canonical model data once, validate its derived output, and make presentation layers consume compiled values.

**Tech Stack:** Node.js 24.21.x, pnpm 12.7.0, Next.js 16.3.6, TypeScript, Vitest, ESLint, Playwright.

**Spec:** User brief attached as `Pasted text.txt` (sections 33–47) and repository `AGENTS.md`.

## Global Constraints

- Do not add AI generation or arbitrary shelter geometry.
- Canonical engineering models stay in Git; Neon cannot override geometry.
- Preserve model ID, model version, compiler version and deterministic plan fingerprint identity.
- Keep compiler at `1.8.0` and thermal method at `1.2.0` unless an engineering behavior change requires a documented version bump.
- Do not promote validation beyond `DATA_VALIDATED` without physical evidence.
- Never reduce thermal loss by omitting corner-return area from the full side envelope.
- Keep Serbian Latin `/sr` and English `/en` behavior equivalent.

## Review Focus

- Shallow or invalid model depth must not silently produce a plausible zero-length side panel; pin the domain/validation behavior.
- Sloped side-panel front/rear heights must be sampled at the two joinery boundaries, while the exterior side envelope retains the full depth.
- Thermal wall area must combine panel core and corner returns, subtracting rounded entrances once.
- Side framing and intermediate studs must use the same global Z boundaries as the side panels.
- 3D and technical drawings must distinguish short side panels from full exterior corner-return coverage.
- Every published cat capacity tier and dog size must have passive and heated catalog coverage.

---

### Task 1: Establish the reproducible local toolchain

**Files:**
- Create: `pnpm-lock.yaml` from the real pnpm resolver.
- Modify: `.github/workflows/ci.yml` to require the generated lockfile.
- Test: dependency installation and reported Node/pnpm versions.

- [x] Obtain Node.js 24.21.x and pnpm 12.7.0 without changing repository dependency versions.
- [x] Run `pnpm install`; resolve registry or dependency failures at their source and do not fabricate a lockfile.
- [x] Commit the generated lockfile after a successful install.
- [x] Require the lockfile in CI and verify a frozen install succeeds.

### Task 2: Verify engineering joinery and thermal invariants

**Files:**
- Inspect/modify: `src/lib/engineering.ts`, `src/lib/compiler.ts`, `src/lib/validation.ts`.
- Test/modify: `src/lib/engineering.test.ts`, `src/lib/validation.test.ts`, `src/lib/fingerprint.test.ts`.

- [x] Run focused tests for all canonical models and verify joinery convention, side span/heights, rail lengths, stud bounds, internal depth, exterior thermal area and passive/heated catalog coverage.
- [x] For each confirmed defect, add a failing regression assertion first, fix the shared engineering/compiler/validation source, then rerun the focused tests.
- [x] Confirm thermal method limitations explicitly include detailed corner thermal bridges and compiler version/fingerprints are reproducible.

### Task 3: Verify compiled geometry reaches presentation and exports

**Files:**
- Inspect/modify: `src/components/shelter-viewer.tsx`, `src/components/technical-sketch.tsx`, `src/components/model-build-book.tsx`, and relevant export components/tests.

- [x] Confirm side panels start at `sideStartZmm` and use `sideRunMm`; framing and drawing boundaries use the same compiled geometry.
- [x] Check that plan identity, joinery, corner returns and assumptions remain visible in relevant drawings/exports without introducing client-side engineering formulas.

### Task 4: Run the complete software gate and report evidence

**Files:**
- Fix only files implicated by reproducible failures; add regression tests for confirmed defects.

- [x] Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, install Playwright Chromium, and run `pnpm test:e2e`.
- [x] Fix root causes for failures; do not suppress TypeScript errors or weaken validation.
- [x] Review build/bundle output and the required responsive/core-page behavior where the environment allows.
- [x] Record exact results, remaining assumptions, physical-validation work, and final commit SHA.

### Verification notes

- Toolchain: Node.js 24.21.0, pnpm 12.7.0; `pnpm install --frozen-lockfile` succeeds.
- `pnpm typecheck` uses `tsconfig.strict.json` with `skipLibCheck: false`; it checks app sources, unit/E2E tests, and TypeScript configs. The base Next config retains `skipLibCheck` only because Next 16 emits overlapping production/development `.next` declarations in one local checkout.
- The strict check exposed missing `webpack` declarations and upstream `three-stdlib@2.36.1`/`@types/three@0.186.0` incompatibilities. Added `@types/webpack` and a pinned pnpm patch matching the upstream merged declaration fix.
- `pnpm lint`: pass with no warnings. `pnpm test`: 11 files, 70 tests passed. `pnpm build`: pass; 51 static pages generated.
- `pnpm test:e2e`: 17 passed, 1 skipped duplicate responsive project. Desktop and Pixel 7 interactions pass. The route/viewport audit covers 10 routes at 1440, 1280, 768, 390, and 360 CSS pixels (50 combinations), checks for horizontal overflow, console/runtime errors on core pages, and valid model source links.
- Bundle audit (production HTML script references): homepage 602 KiB raw/186 KiB gzip, catalog 613/189 KiB, finder 614/190 KiB, and model page 1546/436 KiB. The 943 KiB raw/250 KiB gzip Three/WebGL chunk is model-route-only; it is absent from homepage/catalog/finder bundles.
- Compiler remains `1.8.0`; thermal method remains `1.2.0`. Thermal limits still include the unmodeled corner/end-grain return bridge.
- All published models remain `DATA_VALIDATED`. No physical prototype or field-validation evidence was created; professional engineering review, prototype construction/inspection, and field observations remain future work.
- Non-blocking browser warnings observed on 3D model pages: Three.js reports deprecated `Clock` and removed `PCFSoftShadowMap` usage from the current WebGL dependency path. These were not hidden or silenced.

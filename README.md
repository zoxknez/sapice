# Šapice · Pet Shelter Engineering

Open, bilingual engineering plans for practical winter shelters for cats and dogs.

Šapice is **not** an AI design generator. Public models are versioned, deterministic definitions that compile into dimensions, 3D geometry, technical drawings, material quantities, cut parts, sheet layouts, thermal estimates, framing schedules, cost inputs and build steps.

## Current product state

The repository currently includes:

- SR / EN routing with localized URLs
- 16 reference shelter models with passive/heated coverage across all published cat capacity tiers and dog size classes
- deterministic rule-based finder
- side-by-side model comparison
- parametric WebGL 3D viewer
- assembled / roof-off / exploded / framing 3D views
- compiler-driven workshop drawing sheet with front / side / plan / roof views
- reusable wall / floor / roof assemblies
- source-bound material thermal values
- steady-state envelope transmission estimates
- true-geometry cut lists for exterior panels, interior linings, XPS and sloped dividers
- deterministic stock nesting for 12 mm plywood, 9 mm plywood and XPS
- true part-area vs conservative packing-envelope utilization
- provisional framing / support schedule with stud-spacing invariants
- provisional high-rear ventilation provision zones coordinated around framing
- service-roof front-hinge / rear-latch positions coordinated with roof runoff
- compiler-derived BOM CSV and versioned JSON export
- local cost estimator with nesting, framing, hardware, roof, finish and ventilation quantities
- persistent workshop build mode
- plan-bound prototype evidence worksheet stored locally in the browser
- source / provenance library
- dynamic model OG images, large social cards and Web Share support
- schema.org WebApplication / HowTo structured data
- sitemap, robots, manifest and locale-aware canonical / hreflang metadata
- localized 404 / error states and accessibility baseline
- Playwright desktop + mobile smoke suite
- Neon runtime schema for mutable data

## Validation language

Every model carries an explicit validation state:

1. `DATA_VALIDATED`
2. `GEOMETRY_VALIDATED`
3. `ENGINEERING_REVIEWED`
4. `PROTOTYPE_BUILT`
5. `FIELD_TESTED`

Local typecheck, lint, unit tests and production build pass; the full E2E suite passes against the production server. Hosted GitHub Actions status is summarized under Repository status. The catalog remains at **DATA_VALIDATED** until evidence for later validation stages is explicitly recorded.

A software test is never treated as physical validation.

## One source of truth

Canonical model definitions live in Git.

```text
ShelterModel
  -> construction assemblies
  -> compiler v1.8 plan fingerprint
  -> compiled internal / interface geometry
  -> 3D viewer
  -> technical drawing
  -> cut list
  -> stock nesting
  -> framing + hardware schedule
  -> ventilation provision geometry
  -> heating provision geometry (heated models)
  -> roof weathering / runoff gate
  -> thermal estimate
  -> cost lines
  -> build guide
```

Mutable runtime data belongs in Neon:

- local / market material prices
- saved project settings later
- optional shared price profiles later

Canonical engineering geometry does **not** live in the database.

## Wall joinery

Compiler v1.8 uses one explicit buildable convention: the front and rear walls remain full width, while the left and right wall assemblies fit between their inner planes. This convention drives side-panel cut geometry, internal clear depth, side framing, 3D geometry, technical drawings and exports.

The full exterior side envelope is still included in the thermal calculation: the central side-panel area plus the exposed front/rear corner returns. Exterior vertical corner joints receive a separate weather-trim BOM allowance.

## Thermal model

The current engine is intentionally limited.

Thermal method v1.2 calculates approximate steady-state envelope transmission through the wall, floor and roof assemblies. It uses orientation-specific ISO 6946 internal surface resistances (wall 0.13, upward roof flow 0.10, downward floor flow 0.17 m²K/W) and Rse 0.04 m²K/W:

```text
R_layer = thickness / lambda
U = 1 / R_total
Q = U × area × deltaT
```

Current public output does **not** claim:

- a validated entrance infiltration model
- a validated airflow model for the provisional ventilation insert zones
- wind-pressure heat loss
- animal metabolic heat contribution
- transient thermal storage
- certified minimum safe outdoor temperature
- full hygrothermal / condensation simulation

Therefore Šapice does not publish a false “safe to -15 °C” badge.

See [docs/METHODOLOGY.md](docs/METHODOLOGY.md).

## Material data

V1 thermal values are source-bound.

Examples:

- 50–60 mm XPS uses declared λ values from FIBRANxps 300 technical data
- plywood uses a conservative birch / marine plywood reference and explicitly documents variability with species, density and moisture
- ISO 10456 is tracked as the design-value methodology reference

The selected real-world product data sheet should replace generic planning values before a physical build is treated as engineering-reviewed.

## Heating

Heated models do not define improvised electrical heaters.

They compile one product-placement provision zone per chamber plus a matching protected cable-entry BOM item. Each zone deliberately leaves a positive unheated floor-choice area. The zone is coordination geometry only: manufacturer instructions remain authoritative for actual product footprint, power, voltage, thermostat behavior, cable routing, protection and wet-location suitability.

## Roof weathering

The roof compiler explicitly identifies the front edge as the high side and the rear edge as the runoff side, so normal water shedding is directed behind the shelter and away from entrances.

The final roof covering remains **PRODUCT_SPECIFIC**. The selected membrane, roll roofing, shingle or other covering must explicitly permit the compiled slope and define its own underlayment, overlaps, fastening and edge/drip details. The compiler exposes rear drip-edge length and full roof-edge protection length for planning, but does not invent a universal minimum roof slope.

## Ventilation

V1 does not claim a universal vent-opening area.

Each chamber receives one **PROVISIONAL high-rear coordination zone**. The compiler places that zone inside the chamber and away from provisional rear studs. The zone is not the actual cutout. A selected adjustable vent insert must define its own cutout and net free area.

Physical validation must inspect condensation, moisture and localized drafts. Ventilation airflow is not currently included in the thermal model.

## Plan identity

Every compiled plan carries:

- model version
- compiler version
- deterministic 16-character plan fingerprint

The fingerprint is stamped into the web view, workshop drawing and exported plan files so prototype evidence can reference the exact generated plan. It is a reproducibility identifier, not a cryptographic signature.

## Prototype evidence

The model page includes a local-only physical-validation worksheet tied to the exact plan fingerprint. It records build/observation dates, environmental readings, deviations and inspection observations and can export a JSON evidence record.

Completing the worksheet does **not** automatically change a model's public validation state.

## Stock nesting

Current planning defaults:

- plywood: 2500 × 1250 mm
- XPS: 1250 × 600 mm
- plywood kerf: 3 mm
- XPS kerf: 2 mm

Trapezoid parts are currently packed by bounding box, so V1 is deterministic and reproducible but not polygon-optimal. The UI now draws the true trapezoid/cutout geometry separately from the dashed packing envelope and reports both true material utilization and envelope utilization.

## Framing

The framing schedule is currently marked **PROVISIONAL**.

Member lengths and positions are geometry-derived where possible. Intermediate-stud positions and timber profile selection remain explicit design assumptions. V1 enforces a provisional maximum stud spacing and coordinates rear ventilation provision zones around those supports.

## Local development

Requirements:

- Node.js 24.21.0
- pnpm 12.7.0

```bash
pnpm install
pnpm dev
```

Quality checks:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

## Environment

Copy the example file:

```bash
cp .env.example .env.local
```

Expected variables:

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never commit a real database connection string.

## Neon

The initial runtime schema is in:

```text
db/0001_runtime.sql
```

It creates runtime tables for:

- material prices
- price profiles
- saved projects

The schema is deliberately separate from canonical model definitions.

## Repository status

The application code is under active construction.

GitHub Actions is the remote release gate. On 28 September 2026, run `36412306293` for commit `e24710a` was blocked before runner startup. Its check annotation says the account is locked because of a billing issue (`runner_id: 0`), so no application workflow step ran and the run provides no results for project checks. The committed `pnpm-lock.yaml` is required by the workflow. Restore GitHub Actions billing and rerun the gate before treating hosted CI as green. A successful software run does not establish physical prototype or field-test evidence.

Physical prototype and field-test status require real-world evidence, not code completion.

## License

License decision is still pending. Do not assume model plans are certified products or professional engineering sign-off until the relevant validation state says so.

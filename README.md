# Šapice · Pet Shelter Engineering

Open, bilingual engineering plans for practical winter shelters for cats and dogs.

Šapice is **not** an AI design generator. Public models are versioned, deterministic definitions that compile into dimensions, 3D geometry, technical drawings, material quantities, cut parts, sheet layouts, thermal estimates, framing schedules, cost inputs and build steps.

## Current product state

The repository currently includes:

- SR / EN routing with localized URLs
- 10 reference shelter models
- deterministic rule-based finder
- side-by-side model comparison
- parametric WebGL 3D viewer
- assembled / roof-off / exploded views
- technical SVG elevations
- reusable wall / floor / roof assemblies
- source-bound material thermal values
- steady-state envelope transmission estimates
- cut lists for exterior panels, interior linings, XPS and dividers
- deterministic stock nesting for 12 mm plywood, 9 mm plywood and XPS
- provisional framing / support schedule
- local cost estimator with user-entered prices
- persistent workshop build mode
- source / provenance library
- sitemap, robots, manifest and locale-aware canonical / hreflang metadata
- Neon runtime schema for mutable data

## Validation language

Every model carries an explicit validation state:

1. `DATA_VALIDATED`
2. `GEOMETRY_VALIDATED`
3. `ENGINEERING_REVIEWED`
4. `PROTOTYPE_BUILT`
5. `FIELD_TESTED`

The current catalog intentionally remains at **DATA_VALIDATED** until the software geometry checks can run on a working CI/build runner and the next review stages are actually completed.

A software test is never treated as physical validation.

## One source of truth

Canonical model definitions live in Git.

```text
ShelterModel
  -> construction assemblies
  -> compiled internal geometry
  -> 3D viewer
  -> technical drawing
  -> cut list
  -> stock nesting
  -> framing schedule
  -> thermal estimate
  -> cost lines
  -> build guide
```

Mutable runtime data belongs in Neon:

- local / market material prices
- saved project settings later
- optional shared price profiles later

Canonical engineering geometry does **not** live in the database.

## Thermal model

The current engine is intentionally limited.

It calculates approximate steady-state envelope transmission through the wall, floor and roof assemblies:

```text
R_layer = thickness / lambda
U = 1 / R_total
Q = U × area × deltaT
```

Current public output does **not** claim:

- a validated entrance infiltration model
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

They only reserve geometry for a compatible, purpose-built animal-heating product. Manufacturer instructions remain authoritative for installation, cable routing, protection, thermostat behavior and wet-location suitability.

## Stock nesting

Current planning defaults:

- plywood: 2500 × 1250 mm
- XPS: 1250 × 600 mm
- plywood kerf: 3 mm
- XPS kerf: 2 mm

Trapezoid parts are currently packed by bounding box, so V1 is deterministic and reproducible but not polygon-optimal.

## Framing

The framing schedule is currently marked **PROVISIONAL**.

Member lengths are geometry-derived. V1 timber profile selection remains a design assumption until engineering review and physical prototype validation.

## Local development

Requirements:

- Node.js 24
- Corepack
- pnpm 12.6.0

```bash
corepack enable
corepack prepare pnpm@12.6.0 --activate
pnpm install
pnpm dev
```

Quality checks:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
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

A build runner still needs to execute the full quality gate successfully before model status is promoted from `DATA_VALIDATED`. Physical prototype and field-test status require real-world evidence, not code completion.

## License

License decision is still pending. Do not assume model plans are certified products or professional engineering sign-off until the relevant validation state says so.

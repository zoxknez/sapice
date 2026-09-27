# Architecture

Šapice is a deterministic bilingual web application for selecting and building predefined winter shelters for cats and dogs.

It is intentionally **not** an AI design generator. Engineering outputs are compiled from versioned canonical models.

## Source of truth

Canonical shelter definitions live in Git and are validated before publication.

```text
ShelterModel
  -> construction assemblies
  -> compiler v1.6
     -> construction-interface geometry
     -> entrance geometry
     -> chamber/divider geometry
     -> ventilation provision
     -> heating provision for heated models
     -> roof slope / runoff / weathering gate
     -> cut parts
     -> true cut geometry
     -> stock nesting
     -> framing/support schedule
     -> hardware schedule
     -> thermal calculation
     -> fabrication material BOM
     -> build sequence
     -> deterministic plan fingerprint
  -> server-rendered model page
     -> 3D viewer
     -> workshop drawing
     -> costing inputs
     -> CSV / JSON export
     -> prototype-evidence worksheet
```

The compiler is the authoritative derivation layer. UI components should consume compiled output instead of reproducing engineering formulas.

## Server / client boundary

Engineering compilation should happen on the server wherever practical.

Examples:

- model detail page compiles once and shares the resulting plan with 3D, costing and export tools
- model catalog comparison receives compact server-derived summaries instead of shipping the full compiler into the browser
- client components are responsible for interaction, local persistence and visualization rather than engineering derivation

## Plan identity

Each compiled plan carries:

- model ID
- model version
- compiler version
- deterministic plan fingerprint

The fingerprint is not a cryptographic signature. It is a reproducibility identifier used to tie exports, drawings and prototype evidence to the exact generated plan.

## Provenance

Engineering data is separated into four provenance classes:

- **SOURCE** - external manufacturer, standard or welfare reference
- **GEOMETRY** - direct consequence of canonical dimensions
- **CALCULATION** - deterministic result from known inputs
- **ASSUMPTION** - provisional design choice awaiting engineering or physical review

A compiled plan also exposes the complete set of external sources used by its model, materials, hardware, roof-weathering and heating-safety layers.

## Geometry layers

The compiler centralizes geometry that previously could drift between views:

- floor / wall / roof construction-interface datum
- rounded entrance geometry
- chamber clear widths and physical divider thickness
- sloped divider and side-panel geometry
- base support grid
- floor joists
- wall supports
- roof rafters
- ventilation provision zones
- heating provision zones
- front-hinge / rear-latch service-roof positions coordinated with runoff
- roof runoff direction and edge lengths

3D, technical drawings, exports and validation consume these derived values.

## Thermal boundary

Thermal method v1.1 is a steady-state envelope-transmission model.

It uses:

- source-bound material conductivity
- orientation-specific ISO 6946 surface resistances
- actual rounded entrance opening area
- wall, floor and roof assembly geometry
- sensitivity bands where conductivity ranges are available

It intentionally does not claim validated infiltration, ventilation airflow, framing thermal bridges, wind pressure, transient storage or universal safe outdoor temperatures.

## Ventilation

Ventilation uses one provisional high-rear coordination zone per chamber.

The zone:

- stays inside its chamber
- avoids provisional rear framing
- is shown in drawings and exports
- is not treated as the final opening
- does not enter the thermal airflow calculation

The selected adjustable vent product defines the final cutout and net free area.

## Heating

Heated models compile one product-placement provision zone per chamber plus matching protected cable-entry BOM provisions.

Heating zones:

- stay within chamber geometry
- leave positive unheated choice area
- do not specify heater power, voltage or thermostat set point
- are only compatible-placement geometry for purpose-built animal heating products

Manufacturer instructions remain authoritative.

## Roof weathering

The roof compiler identifies:

- front high edge
- rear runoff edge
- slope
- rise / run
- rear drip-edge planning length
- full edge-protection planning length

The final waterproof covering remains product-specific. The selected roof product must explicitly permit the compiled slope and define underlayment, overlaps, fastening and edge details.

## Fabrication and nesting

Cut parts retain true geometry, including:

- rectangles
- trapezoids
- rounded entrance cutouts

V1 nesting uses conservative rectangular packing envelopes for deterministic placement. The UI distinguishes true material utilization from packing-envelope utilization.

## Runtime data and Neon

Neon is reserved for mutable runtime state:

- local / market material prices
- price profiles
- saved project settings
- future shared user data

Canonical engineering models do **not** live in the database and runtime data must never silently override canonical geometry.

## Validation ladder

Public validation states are:

1. `DATA_VALIDATED`
2. `GEOMETRY_VALIDATED`
3. `ENGINEERING_REVIEWED`
4. `PROTOTYPE_BUILT`
5. `FIELD_TESTED`

Software completion cannot promote a model to a physical-validation state.

The local prototype worksheet records evidence against a plan fingerprint, but it does not automatically alter published validation status.

## Runtime stack

- Next.js 16.3
- React 19.3
- TypeScript 6
- Tailwind CSS 4.3
- next-intl 4.14
- React Three Fiber 9.8
- Three.js 0.186
- Zod 4.6
- Neon serverless driver
- Vitest 5
- Playwright 1.63
- Node.js 24.21
- pnpm 12.7

WebGPU is not required. The production 3D baseline remains WebGL.

## Release gate

The repository has unit, typecheck, lint, production-build and browser E2E scripts.

At the current project state, GitHub Actions is failing before runner allocation, and the active automation environment cannot independently clone/build the repository. A real pnpm environment must still generate and commit `pnpm-lock.yaml` and execute the full quality gate before the catalog should move beyond `DATA_VALIDATED`.

# Engineering methodology

Šapice is a deterministic plan compiler for predefined cat and dog winter-shelter models. It is not an AI shelter generator and it does not turn a calculation into a certification.

The project separates four provenance classes:

1. **SOURCE** - externally sourced technical or welfare information.
2. **GEOMETRY** - values derived directly from canonical model geometry.
3. **CALCULATION** - deterministic results from known inputs.
4. **ASSUMPTION** - explicit design assumptions that still require review or physical validation.

## Canonical model and compiler identity

Each public model has a model ID and semantic model version.

The compiler also has its own version because the same canonical input can produce different derived details after an engineering-method update.

Every compiled plan therefore carries:

- model ID
- model version
- compiler version
- deterministic 16-character plan fingerprint

The plan fingerprint is derived from the canonical model and compiled engineering output. It is a reproducibility identifier, **not** a cryptographic signature.

Workshop drawings, CSV/JSON exports and prototype-evidence records carry that identity.

## Construction interface datum

V1 uses one explicit envelope convention:

```text
full-footprint floor assembly
        ↓
walls start on finished floor
        ↓
roof assembly sits on wall tops
        ↓
declared front/rear height = overall top-of-roof envelope
```

For a sloped roof, roof thickness is measured normal to the roof plane. Its vertical contribution is therefore:

```text
roof_vertical_thickness = roof_thickness × cos(roof_angle)
```

The compiler validates:

```text
floor thickness
+ clear wall height
+ roof vertical thickness
= declared overall height
```

Front/rear wall cut parts, 3D geometry and technical drawings use the same datum.

## Entrance geometry

Entrances use one shared rounded-rectangle definition.

The same compiled entrance object drives:

- panel cutouts
- 3D openings
- thumbnails
- technical drawings
- wall opening area in the thermal surface calculation
- finished-floor sill height
- entrance framing

The wall-area calculation subtracts the real rounded-rectangle area rather than a full rectangular approximation.

## Chamber geometry

Multi-chamber models derive chamber width from the clear internal width **after** subtracting physical divider thickness.

Entrance centers are placed inside the resulting chamber clear widths.

Dividers have explicit thickness and are compiled as roof-slope trapezoids rather than rectangular placeholders.

## Thermal model v1.1

The current engine provides an approximate steady-state envelope-transmission calculation:

```text
R_layer = thickness / lambda
U = 1 / R_total
Q = U × area × deltaT
```

Method v1.1 uses orientation-specific ISO 6946 internal surface resistances:

- wall / horizontal heat flow: `Rsi = 0.13 m²K/W`
- roof / upward heat flow: `Rsi = 0.10 m²K/W`
- floor / downward heat flow: `Rsi = 0.17 m²K/W`
- exterior surface: `Rse = 0.04 m²K/W`

Material lambda values are source-bound and the public output exposes a sensitivity band where source ranges exist.

The current public result does **not** claim to model reliably:

- entrance infiltration
- airflow through future ventilation inserts
- wind pressure
- animal metabolic heat
- 2D framing thermal bridges
- moisture transport
- transient heat storage
- a certified minimum safe outdoor temperature

Therefore the result must not be described as **safe to X °C**.

## Ventilation provision

V1 does not invent a universal ventilation-opening area.

Each chamber receives one **PROVISIONAL high-rear provision zone**.

The compiler:

1. derives the zone from chamber and rear-wall geometry
2. keeps it inside that chamber
3. checks it against provisional rear-stud positions
4. exposes its coordinates in the UI, workshop sheet and exports

The provision zone is **not** the final vent cutout and is not subtracted from the thermal envelope.

A selected adjustable vent insert must define its own:

- cutout
- net free area
- weather protection
- insect/animal protection where applicable
- operating/adjustment instructions

Physical validation must inspect excess humidity, visible condensation and excessive localised draughts.

## Roof and water management

Canonical geometry defines roof slope and overhangs.

The model intentionally keeps the final waterproof covering product-specific. The selected covering/membrane remains authoritative for minimum permitted slope, overlap, edge treatment and installation method.

A geometric roof slope is therefore not automatically a certification that every roofing product is suitable.

## Cut parts and nesting

Cut parts retain true shape data, including trapezoid rear heights and rounded entrance cutouts.

V1 nesting reserves a conservative rectangular packing envelope. This means:

- deterministic placement is reproducible
- trapezoids are not polygon-optimally nested
- the UI can report two different quantities correctly:
  - true material utilization
  - packing-envelope utilization

Stock sizes, margins and kerf remain explicit planning inputs.

## Framing and hardware

Framing is currently **PROVISIONAL**.

The compiler derives:

- base and floor members
- corner studs
- front/rear rails
- sloped side top rails
- entrance jack supports
- entrance headers and cripple studs
- divider cleats
- intermediate rear/side supports
- total linear length

V1 also enforces a provisional maximum support spacing.

Hardware quantities and roof hinge/latch positions are generated deterministically but remain assumptions until engineering review selects real hardware products and verifies their capacities.

## Heating

Heated variants do not define homemade heaters.

They only reserve geometry for compatible purpose-built animal-heating equipment. The selected product's declarations and manufacturer instructions remain authoritative for:

- permitted environment
- cable routing
- electrical protection
- thermostat behavior
- surface temperature
- wet-location suitability

The application does not design DIY mains wiring.

## Costing

Cost quantities are compiler-driven for:

- nested plywood sheets
- XPS boards
- roof waterproofing area
- exterior wood-protection area
- framing length
- hardware quantities
- ventilation inserts
- purpose-built heating product where applicable

The application does not invent current market prices. Users enter local unit prices.

## Validation states

The public validation ladder is:

1. `DATA_VALIDATED`
2. `GEOMETRY_VALIDATED`
3. `ENGINEERING_REVIEWED`
4. `PROTOTYPE_BUILT`
5. `FIELD_TESTED`

Software completion does not promote a physical validation state.

A browser-based prototype evidence worksheet can record observations against an exact plan fingerprint, but completing that worksheet does **not** automatically change the published status.

## Database boundary

Canonical engineering definitions remain versioned in Git.

Neon is reserved for mutable runtime data such as:

- market/local material prices
- price profiles
- saved project settings
- future shared user data

Database state must not silently override canonical engineering geometry.

## Current release limitation

The repository has unit and E2E quality gates prepared, but GitHub Actions currently fails before runner allocation. The active automation environment also cannot resolve GitHub directly for an independent clone/build.

Until a real runner successfully executes install, typecheck, lint, unit tests, production build and browser smoke tests, public models remain conservatively at `DATA_VALIDATED`.

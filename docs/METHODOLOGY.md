# Engineering methodology

Šapice separates four kinds of values:

1. **SOURCE** - externally sourced technical or welfare information.
2. **GEOMETRY** - values derived directly from the canonical shelter geometry.
3. **CALCULATION** - values computed from sourced or geometric inputs.
4. **ASSUMPTION** - explicit design assumptions that carry uncertainty.

## Thermal model

The current engine provides an approximate steady-state envelope transmission calculation:

- layer resistance: `R = d / lambda`
- assembly U-value: `U = 1 / R_total`
- transmission: `Q = U × A × deltaT`

The current public result does **not** claim to model entrance infiltration reliably, metabolic heat, wind pressure, moisture transport or transient thermal storage. Therefore it is not a certified thermal rating and must not be described as "safe to X °C".

## Geometry

Canonical construction dimensions are stored in millimetres. Derived areas and roof lengths come from the same model data used by visualizations.

## Heating

Heated variants do not define homemade heaters. They reserve compatible placement for purpose-built pet heating equipment that must be installed according to the selected manufacturer's instructions.

## Validation states

- DATA_VALIDATED
- GEOMETRY_VALIDATED
- ENGINEERING_REVIEWED
- PROTOTYPE_BUILT
- FIELD_TESTED

A model cannot imply physical testing unless it reached the corresponding physical validation stage.

## Database boundary

Neon stores mutable runtime data such as market prices and saved project settings. Engineering definitions remain versioned in the repository so code review, CI and history can validate them.

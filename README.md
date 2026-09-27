# Šapice / Sapice

**Open engineering plans for safer winter shelters for cats and dogs.**

Šapice is a bilingual (Serbian Latin / English) web application for selecting, understanding, and building pre-designed winter pet shelters. The same validated model definition drives dimensions, 3D geometry, material quantities, cut lists, thermal estimates, and technical documentation.

## Principles

- No generative AI in the product.
- One engineering source of truth.
- Dimensions stored canonically in millimetres.
- Calculations are deterministic and testable.
- Estimates are clearly separated from measured or sourced facts.
- 3D is never the only way to access technical information.
- Heated designs use manufacturer-approved pet heating systems; the app does not invent heaters.
- Public models expose their validation state and limitations.
- Serbian and English are first-class locales.

## Status

Initial production foundation is being built directly in this repository.

## Planned core

- SR / EN catalogue
- rule-based shelter finder
- parametric 3D viewer
- technical dimensions and sections
- material and cut lists
- approximate steady-state thermal calculations
- build guides
- material library
- offline-friendly build mode
- accessible, mobile-first UI

## Validation language

Models distinguish between:

- `DATA_VALIDATED`
- `GEOMETRY_VALIDATED`
- `ENGINEERING_REVIEWED`
- `PROTOTYPE_BUILT`
- `FIELD_TESTED`

A model is never described as physically tested unless a real prototype has been tested.

## License

License will be finalized before public release.

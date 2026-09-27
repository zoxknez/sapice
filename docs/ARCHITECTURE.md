# Architecture

## Source of truth

Canonical shelter definitions are versioned in Git and validated at build/test time.

```
ShelterModel
  -> geometry-derived areas
  -> 3D preview
  -> technical SVG
  -> thermal inputs
  -> material quantities
  -> future cut list / nesting
```

Neon stores mutable runtime data only:

- material prices
- price profiles
- saved user projects later

It does not own the canonical engineering geometry.

## Provenance classes

Important values should eventually declare one of:

- SOURCE
- GEOMETRY
- CALCULATION
- ASSUMPTION

## Heating

The application never invents an electrical heater specification. Heated models expose a compatible location and constraints for a purpose-built product; manufacturer instructions remain authoritative.

## Validation language

`GEOMETRY_VALIDATED` does not mean a prototype was physically tested. Physical validation is represented separately by `PROTOTYPE_BUILT` and `FIELD_TESTED`.

## Runtime stack

- Next.js 16 Active LTS line
- React 19.3
- TypeScript 6 until the lint ecosystem is fully TS7-compatible
- Tailwind CSS 4.3
- next-intl 4
- React Three Fiber 9
- Three.js r186 line
- Zod 4
- Neon serverless driver

WebGPU is not a requirement. The production 3D baseline remains WebGL.

# Contributing to Šapice

Contributions are welcome, but model changes are treated as engineering data changes rather than ordinary content edits.

## Adding or changing a shelter model

A pull request should include:

- intended animal/use case
- size class or cat capacity
- external dimensions
- entrance geometry and threshold
- construction assembly IDs
- roof overhangs
- maintenance access strategy
- ventilation strategy/provision semantics
- heating flag and heated/passive pairing where applicable
- climate/reference scenario
- SR and EN copy
- source IDs supporting welfare/method rules

Derived values such as internal dimensions, roof length/runoff, entrance geometry, ventilation/heating provision zones, U-values, material quantities, cut parts, stock layouts, framing lengths, hardware quantities and plan fingerprints should not be duplicated manually.

## Source quality

Prefer, in order:

1. standards and official technical documentation
2. government/university/recognized professional organizations
3. manufacturer technical data for product-specific properties

Record accessed date and limitations.

## Claims

Do not describe a model as physically tested unless real prototype/test evidence is linked.

Do not turn the current thermal estimate into a safe-temperature rating.

## Dependency reproducibility

The repository currently lacks `pnpm-lock.yaml` because the active automation session could not run the package resolver.

The first environment that can successfully run:

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

should commit the generated lockfile in the same reviewed change. CI should then require the lockfile through the pnpm setup step.

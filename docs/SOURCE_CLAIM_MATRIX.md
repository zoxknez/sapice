# Source claim matrix

Every public claim in Šapice that rests on an external source is listed here with the source ID from `src/data/sources.ts`, the scope the source actually covers, where the claim is used and what the source does **not** establish.

Rules for this file:

- A claim may only cite a source that supports that exact claim. A source for cats is not a source for dogs, and a regulation for licensed facilities is not a rule for private households.
- A geometry-derived value, a calculation and a planning assumption are not source claims. They are labelled in the product as `GEOMETRY`, `CALCULATION` or `ASSUMPTION` and are not listed here.
- When a source is replaced or re-verified, update `accessedAt` in `src/data/sources.ts` and this file in the same change.
- Sources were last verified on 2026-10-03 for the ten sources added with platform 2.0 and earlier for the remaining fourteen (see `accessedAt`).

Each entry below is formatted as: **claim** · source ID · scope · where used · limitations.

## Community cat shelters (cats only)

**Straw, not hay, is the preferred bedding for outdoor winter cat shelters; hay and blankets hold moisture.**
- Source: `alleycat-straw-not-hay`, `aspcapro-community-cat-winter`, `alleycat-cold-weather`
- Scope: outdoor community cat shelters in cold weather
- Used in: `src/data/bedding.ts` (bedding verdicts), guides page bedding matrix, emergency page, every tote and box model with straw bedding
- Limitations: says nothing about dogs, about indoor use, or about the amount of straw beyond "a quarter to half full, loosely". Straw quantity in the BOM is an `ASSUMPTION`.

**A shelter for three to five cats is about 2 × 3 ft and at least 18 in high; the entrance is about 6 to 8 in wide and faces away from prevailing wind, or uses a flap or L-shaped entry.**
- Source: `alleycat-providing-shelter`
- Scope: community cat colonies
- Used in: guides (entrance range), colony models, `cat-l-entry-vestibule`, reuse page (sourcing scrap lumber)
- Limitations: a planning envelope, not a thermal requirement. Šapice shows the entrance as a sourced range together with ASPCApro's 5.5 to 6 in and does not pick a single "correct" width.

**Entrance about 5.5 to 6 in wide; a small, insulated interior that cats warm with body heat; doors away from wind.**
- Source: `aspcapro-community-cat-winter`
- Scope: community cats in winter
- Used in: guides, emergency page, catalog descriptions of small cat shelters
- Limitations: no outdoor temperature is given as safe. Šapice never turns this guidance into a "safe to X °C" statement.

**Tote-in-tote construction: an outer bin of about 30 gallons, an inner bin of about 20 gallons, a thin foam slab under the inner bin, straw and one entrance through both bins.**
- Source: `alleycat-build-outdoor-shelter`
- Scope: one specific DIY construction for cats
- Used in: `tote-in-tote-straw`, `double-tote-insulated` and related tote models
- Limitations: the source gives volumes, not exact dimensions, and no elevation height. Šapice's tote dimensions are `ASSUMPTION` values the builder must check against their own bins.

**Clear snow from entrances; keep antifreeze and de-icers away; elevate the shelter.**
- Source: `alleycat-cold-weather`
- Scope: outdoor cats in cold weather
- Used in: guides, inspection schedules, placement checklist
- Limitations: elevation height is not specified by the source. Ground clearances in the practical models differ per model and are `ASSUMPTION` values.

## Summer use

**Summer shelters belong in shade, on grass or soil rather than concrete, with two openings for air to move; water in shade, refreshed often.**
- Source: `alleycat-summer-weather`
- Scope: outdoor cats in hot weather
- Used in: `summer-shade-cat`, `summer-cross-vent-cat`, guides summer section, season logic in the finder
- Limitations: no airflow rate, no temperature limit. Šapice does not calculate summer comfort.

**Doghouses do not relieve heat and can make it worse; trees and tarps make good shade because they do not block airflow; old, young, overweight and short-muzzled animals are at higher risk.**
- Source: `humane-world-heatwave`
- Scope: pets in heatwaves
- Used in: `summer-shade-dog-*` models, guides summer section
- Limitations: no design dimensions. The shade structure geometry is an `ASSUMPTION`.

## Dogs

**Outdoor dog housing needs wind and rain protection at the entrance, dry bedding in cold, shade outside the shelter and continuous water; unacclimated, elderly, sick or very young dogs should not be housed outdoors.**
- Source: `usda-aphis-dog-temperature`
- Scope: regulatory guidance for US Animal Welfare Act licensees and registrants, not for private companion dogs
- Used in: guides, bedding (wood shavings for dogs), dog model descriptions
- Limitations: its temperature thresholds are **not** carried over as universal safe temperatures. Šapice cites it for the qualitative requirements only.

**Keep pets warm in cold weather; bring vulnerable animals indoors; provide a dry, draft-free shelter.**
- Source: `humane-world-pets-cold`, `aspca-cold-weather`
- Scope: companion animals in cold weather
- Used in: guides, operating guidance on engineered and practical models
- Limitations: general care guidance, not construction data.

**Kennel ventilation must avoid draughts while removing moisture.**
- Source: `gov-uk-dog-kennel-ventilation`
- Scope: UK licensed dog boarding kennels
- Used in: ventilation provision notes on engineered models
- Limitations: no vent size applies to small shelters. Ventilation zones in Šapice are coordination geometry only.

## Materials and thermal values

**Typical R-value per inch: EPS 3.8 to 4.4, XPS 5, polyiso about 6, fiberglass 2.5 to 4, mineral wool board 3 to 4.**
- Source: `doe-basc-insulation-r-values`
- Scope: generic material classes
- Used in: `src/data/material-library.ts` (planning λ and λ ranges via λ = 0.0254 / (R_IP × 0.17611)), substitute calculator on the materials page
- Limitations: generic values. A product datasheet always takes precedence; the conservative thickness uses the worst end of the range.

**Declared λ for 50 to 60 mm XPS.**
- Source: `fibran-xps-300`
- Scope: one specific product
- Used in: engineered models and the XPS library entry
- Limitations: another XPS product must use its own datasheet.

**Thermal conductivity of wood and plywood varies with species, density and moisture.**
- Source: `usfs-wood-handbook-2021`, `nord-marine-birch-plywood`, `iso-10456-2007`
- Scope: wood based materials
- Used in: plywood, OSB and solid wood library entries
- Limitations: planning values. OSB and reused boards with unknown density stay `UNKNOWN` where no value is sourced.

**Surface resistances and the R = d / λ, U = 1 / ΣR method.**
- Source: `iso-6946-2017`
- Scope: steady-state transmission through plane layers
- Used in: engineered thermal method v1.2 and the practical compiler P1.0.0
- Limitations: no infiltration, no ventilation loss, no animal heat, no transient effects. A U-value is shown only when every layer has a sourced λ.

**Transmission and ventilation heat transfer coefficients; condensation calculation methods.**
- Source: `iso-13789-2017`, `iso-13788-2012`
- Scope: methodology references
- Used in: methodology page, guides (condensation warning)
- Limitations: Šapice does **not** implement a condensation simulation. These are cited to explain what is missing.

**Roof sheathing fastening and shingle installation require product instructions.**
- Source: `apa-panel-fastening-n335`, `owens-corning-roof-installation`
- Scope: building roofs
- Used in: engineered compiler hardware schedule, roofing felt library entry
- Limitations: product-specific; the roof covering remains `PRODUCT_SPECIFIC`.

## Reuse and treated wood

**ISPM 15 marks show a phytosanitary treatment: HT for heat treatment, MB for methyl bromide fumigation.**
- Source: `ippc-ispm-15`
- Scope: wood packaging in international trade
- Used in: reuse page, pallet models, reuse checklist (`src/lib/field-checks.ts`)
- Limitations: the mark says nothing about the later history, spills or condition of a used pallet. The reuse checklist therefore rejects material on observed condition (chemical contamination, strong smell, oil, spills, rot, mould, damage, protruding fasteners, unknown treated timber within reach of the animal), not on the mark alone. These reject rules are Šapice decisions, not requirements of the standard.

**CCA-treated wood was withdrawn from US homeowner use at the end of 2003 but remains in older structures; do not burn it; protect against dust when cutting.**
- Source: `epa-cca-treated-wood`
- Scope: US regulatory information
- Used in: reuse page, reuse checklist, old treated timber library entry
- Limitations: Šapice cannot identify treatment from appearance. Unknown old treated timber is rejected wherever an animal could chew or lick it.

## Heating

**Electrical heating appliances for animals must meet the dedicated product standard.**
- Source: `iec-60335-2-71-2018`
- Scope: appliances for breeding and rearing animals
- Used in: heated engineered models, guides, validation rules
- Limitations: Šapice only reserves a provision zone for a purpose-built product. It never specifies wiring or a DIY heater.

## Claims Šapice deliberately does not make

- No "safe to X °C" rating for any model, practical or engineered.
- No U-value when any layer has an unknown λ (`INCOMPLETE` or `UNAVAILABLE` thermal status).
- No thermal calculation for emergency wraps, gapped pallets, open shade structures or platforms. The retrofit advisor (`retrofitPlan`) makes no thermal calculation; the retrofit model treats the existing wall as an unknown layer, so it reports no U-value.
- No material prices. Costs come only from prices the user enters.
- No validation state above `DATA_VALIDATED`. No model has been built or field tested by this project.

export type SourceRecord = {
  id: string;
  publisher: string;
  title: string;
  url: string;
  accessedAt: string;
  tier: 1 | 2 | 3;
  topics: string[];
  notes: string;
};

export const sources: Record<string, SourceRecord> = {
  "aspcapro-community-cat-winter": {
    id: "aspcapro-community-cat-winter",
    publisher: "ASPCApro",
    title: "Winter Shelters for Community Cats: FAQs and Cold Weather Tips",
    url: "https://www.aspcapro.org/resource/winter-shelters-community-cats-faqs-and-cold-weather-tips",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["community-cats", "winter", "entrances", "bedding", "raised-floor"],
    notes: "Supports small insulated shelters, cat-sized entrances, elevation from wet ground, straw bedding and predator-aware entrance decisions."
  },
  "humane-world-pets-cold": {
    id: "humane-world-pets-cold",
    publisher: "Humane World for Animals",
    title: "How to Keep Pets Warm in Cold Weather",
    url: "https://www.humaneworld.org/en/resources/how-keep-pets-warm-cold-winter",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["dogs", "winter", "shelter", "raised-floor"],
    notes: "Emphasizes indoor shelter when possible; when a dog must be outside, shelter should be dry, draft-free, raised and appropriately sized."
  },
  "aspca-cold-weather": {
    id: "aspca-cold-weather",
    publisher: "ASPCA",
    title: "Cold Weather Safety Tips",
    url: "https://www.aspca.org/pet-care/general-pet-care/cold-weather-safety-tips",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["pets", "winter", "safety"],
    notes: "Supports the limitation that outdoor auxiliary shelters are not a substitute for keeping companion animals indoors during severe cold."
  },
  "apa-panel-fastening-n335": {
    id: "apa-panel-fastening-n335",
    publisher: "APA - The Engineered Wood Association",
    title: "Builder Tips: Proper Installation of APA Rated Sheathing for Roof Applications (N335)",
    url: "https://www.apawood.org/buildertips/pdfs/N335.pdf",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["plywood", "fasteners", "spacing", "panel-edges"],
    notes: "Reference starting point for panel fastening geometry: approximately 6 in edge spacing, 12 in intermediate spacing and about 3/8 in edge offset. Šapice does not treat this roof-sheathing guide as a certified fastening design for pet shelters."
  },
  "fibran-xps-300": {
    id: "fibran-xps-300",
    publisher: "FIBRAN",
    title: "FIBRANxps 300 Technical Data Sheet",
    url: "https://fibran.com/wp-content/uploads/sites/9/2020/06/TDS_FIBRANxps_300_eng.pdf",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["xps", "thermal-conductivity", "stock-dimensions"],
    notes: "Declares 1250 × 600 mm board dimensions and λD 0.033 W/mK for thicknesses up to 60 mm."
  },
  "usfs-wood-handbook-2021": {
    id: "usfs-wood-handbook-2021",
    publisher: "USDA Forest Products Laboratory",
    title: "Wood Handbook: Wood as an Engineering Material, Chapter 4",
    url: "https://research.fs.usda.gov/fpl/wood-handbook",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["wood", "thermal-conductivity", "moisture"],
    notes: "Documents that wood thermal conductivity varies materially with species, density, moisture content and grain direction."
  },
  "nord-marine-birch-plywood": {
    id: "nord-marine-birch-plywood",
    publisher: "Nord Compensati",
    title: "Technical Specifications of Birch Marine Plywood",
    url: "https://nordcompensati.com/wp-content/uploads/2017/02/Birch_ENG.pdf",
    accessedAt: "2026-09-27",
    tier: 2,
    topics: ["plywood", "thermal-conductivity", "marine-plywood"],
    notes: "Manufacturer technical specification lists thermal conductivity of 0.17 W/mK for birch marine plywood."
  },
  "iso-10456-2007": {
    id: "iso-10456-2007",
    publisher: "ISO",
    title: "ISO 10456:2007 - Hygrothermal properties - Declared and design thermal values",
    url: "https://www.iso.org/standard/40966.html",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["thermal", "materials", "design-values", "moisture"],
    notes: "Current published edition, confirmed in 2023; provides procedures for declared/design thermal values and conversion for temperature and moisture conditions."
  },
  "iso-6946-2017": {
    id: "iso-6946-2017",
    publisher: "ISO",
    title: "ISO 6946:2017 - Thermal resistance and thermal transmittance - Calculation methods",
    url: "https://www.iso.org/standard/65708.html",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["thermal", "u-value", "r-value"],
    notes: "Methodological reference for steady-state layer resistance and transmittance. The app does not claim ISO certification."
  },
  "iso-13789-2017": {
    id: "iso-13789-2017",
    publisher: "ISO",
    title: "ISO 13789:2017 - Transmission and ventilation heat transfer coefficients",
    url: "https://www.iso.org/standard/65713.html",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["thermal", "ventilation", "steady-state"],
    notes: "Methodological reference for separating transmission and ventilation heat transfer. The MVP does not claim a validated infiltration model."
  },
  "iso-13788-2012": {
    id: "iso-13788-2012",
    publisher: "ISO",
    title: "ISO 13788:2012 - Surface humidity and interstitial condensation calculation methods",
    url: "https://www.iso.org/standard/51615.html",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["moisture", "condensation"],
    notes: "Documents limitations of simplified moisture indicators; full hygrothermal simulation is outside the MVP."
  },
  "iec-60335-2-71-2018": {
    id: "iec-60335-2-71-2018",
    publisher: "IEC",
    title: "IEC 60335-2-71:2018 - Particular requirements for electrical heating appliances for breeding and rearing animals",
    url: "https://webstore.iec.ch/en/publication/60364",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["heating", "electrical-safety", "animals"],
    notes: "Safety reference for electrical animal-heating appliances. The app only accommodates purpose-built products and does not claim product certification."
  }
};

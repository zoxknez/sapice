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
    notes: "Used for the limitation that outdoor auxiliary shelters are not a substitute for keeping companion animals indoors during severe cold."
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
    notes: "Methodological reference for separating transmission and ventilation heat transfer. Current MVP does not claim a validated infiltration model."
  },
  "iso-13788-2012": {
    id: "iso-13788-2012",
    publisher: "ISO",
    title: "ISO 13788:2012 - Surface humidity and interstitial condensation calculation methods",
    url: "https://www.iso.org/standard/51615.html",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["moisture", "condensation"],
    notes: "Used to document limitations of simplified moisture indicators; a full hygrothermal model is outside the MVP scope."
  }
};

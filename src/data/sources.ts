export type SourceRecord = {
  id: string;
  publisher: string;
  title: string;
  url: string;
  accessedAt: string;
  tier: 1 | 2 | 3;
  topics: string[];
  notes: string;
  notesSr: string;
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
    notes: "Supports small insulated shelters, cat-sized entrances, elevation from wet ground, straw bedding and predator-aware entrance decisions.",
    notesSr: "Podržava male izolovane kućice, ulaze prilagođene mačkama, podizanje od vlažnog tla, slamnatu posteljinu i izbor ulaza uz procenu rizika od predatora."
  },
  "gov-uk-dog-kennel-ventilation": {
    id: "gov-uk-dog-kennel-ventilation",
    publisher: "UK Government",
    title: "Dog kennel boarding licensing: statutory guidance for local authorities",
    url: "https://www.gov.uk/government/publications/animal-activities-licensing-guidance-for-local-authorities/dog-kennel-boarding-licensing-statutory-guidance-for-local-authorities",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["dogs", "ventilation", "humidity", "drafts", "heating-safety"],
    notes: "Requires adequate ventilation without excessive localised draughts and to avoid excess humidity. Šapice uses this only as a qualitative ventilation principle; it is commercial-kennel guidance, not a dimensional standard for these small auxiliary shelters.",
    notesSr: "Preporučuje odgovarajuću ventilaciju bez jake lokalne promaje i sprečavanje prekomerne vlage. Šapice ovo koristi samo kao kvalitativni princip ventilacije; smernice se odnose na komercijalne odgajivačnice i ne propisuju dimenzije za mala pomoćna skloništa."
  },
  "humane-world-pets-cold": {
    id: "humane-world-pets-cold",
    publisher: "Humane World for Animals",
    title: "How to Keep Pets Warm in Cold Weather",
    url: "https://www.humaneworld.org/en/resources/how-keep-pets-warm-cold-winter",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["dogs", "winter", "shelter", "raised-floor"],
    notes: "Emphasizes indoor shelter when possible; when a dog must be outside, shelter should be dry, draft-free, raised and appropriately sized.",
    notesSr: "Prednost daje boravku u zatvorenom kada je to moguće; ako pas mora da bude napolju, sklonište treba da bude suvo, bez promaje, podignuto i odgovarajuće veličine."
  },
  "aspca-cold-weather": {
    id: "aspca-cold-weather",
    publisher: "ASPCA",
    title: "Cold Weather Safety Tips",
    url: "https://www.aspca.org/pet-care/general-pet-care/cold-weather-safety-tips",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["pets", "winter", "safety"],
    notes: "Supports the limitation that outdoor auxiliary shelters are not a substitute for keeping companion animals indoors during severe cold.",
    notesSr: "Potkrepljuje ograničenje da pomoćno spoljašnje sklonište ne zamenjuje boravak kućnog ljubimca u zatvorenom tokom velikih hladnoća."
  },
  "apa-panel-fastening-n335": {
    id: "apa-panel-fastening-n335",
    publisher: "APA - The Engineered Wood Association",
    title: "Builder Tips: Proper Installation of APA Rated Sheathing for Roof Applications (N335)",
    url: "https://www.apawood.org/buildertips/pdfs/N335.pdf",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["plywood", "fasteners", "spacing", "panel-edges"],
    notes: "Reference starting point for panel fastening geometry: approximately 6 in edge spacing, 12 in intermediate spacing and about 3/8 in edge offset. Šapice does not treat this roof-sheathing guide as a certified fastening design for pet shelters.",
    notesSr: "Referentna početna tačka za raspored pričvršćivača panela: približno 6 inča na ivicama, 12 inča u polju i odmak od ivice oko 3/8 inča. Šapice ovo uputstvo za krovne ploče ne predstavlja kao sertifikovan proračun pričvršćivanja za kućice za ljubimce."
  },
  "owens-corning-roof-installation": {
    id: "owens-corning-roof-installation",
    publisher: "Owens Corning Roofing",
    title: "Oakridge and TruDefinition Duration Oakridge Shingles Installation Instructions",
    url: "https://www.owenscorning.com/en-us/roofing/install-instructions/oakridge",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["roofing", "low-slope", "underlayment", "drip-edge", "water-management"],
    notes: "Manufacturer example showing that low-slope roof assemblies require slope-specific underlayment/edge details. Šapice uses this as evidence that final roof covering compatibility must follow the selected product instructions, not as a universal shelter roofing specification.",
    notesSr: "Primer proizvođača pokazuje da krovovi malog nagiba zahtevaju detalje podloge i ivica prilagođene konkretnom nagibu. Šapice ga koristi da pokaže da pokrivač krova mora biti kompatibilan sa uputstvom izabranog proizvoda; nije univerzalna specifikacija krova skloništa."
  },
  "fibran-xps-300": {
    id: "fibran-xps-300",
    publisher: "FIBRAN",
    title: "FIBRANxps 300 Technical Data Sheet",
    url: "https://fibran.com/wp-content/uploads/sites/9/2020/06/TDS_FIBRANxps_300_eng.pdf",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["xps", "thermal-conductivity", "stock-dimensions"],
    notes: "Declares 1250 × 600 mm board dimensions and λD 0.033 W/mK for thicknesses up to 60 mm.",
    notesSr: "Navodi dimenzije ploče 1250 × 600 mm i λD 0.033 W/mK za debljine do 60 mm."
  },
  "usfs-wood-handbook-2021": {
    id: "usfs-wood-handbook-2021",
    publisher: "USDA Forest Products Laboratory",
    title: "Wood Handbook: Wood as an Engineering Material, Chapter 4",
    url: "https://research.fs.usda.gov/fpl/wood-handbook",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["wood", "thermal-conductivity", "moisture"],
    notes: "Documents that wood thermal conductivity varies materially with species, density, moisture content and grain direction.",
    notesSr: "Dokumentuje da toplotna provodljivost drveta značajno varira prema vrsti, gustini, vlažnosti i smeru vlakana."
  },
  "nord-marine-birch-plywood": {
    id: "nord-marine-birch-plywood",
    publisher: "Nord Compensati",
    title: "Technical Specifications of Birch Marine Plywood",
    url: "https://nordcompensati.com/wp-content/uploads/2017/02/Birch_ENG.pdf",
    accessedAt: "2026-09-27",
    tier: 2,
    topics: ["plywood", "thermal-conductivity", "marine-plywood"],
    notes: "Manufacturer technical specification lists thermal conductivity of 0.17 W/mK for birch marine plywood.",
    notesSr: "Tehnička specifikacija proizvođača navodi toplotnu provodljivost od 0.17 W/mK za brezovu vodootpornu šperploču."
  },
  "iso-10456-2007": {
    id: "iso-10456-2007",
    publisher: "ISO",
    title: "ISO 10456:2007 - Hygrothermal properties - Declared and design thermal values",
    url: "https://www.iso.org/standard/40966.html",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["thermal", "materials", "design-values", "moisture"],
    notes: "Current published edition, confirmed in 2023; provides procedures for declared/design thermal values and conversion for temperature and moisture conditions.",
    notesSr: "Važeće objavljeno izdanje, potvrđeno 2023. godine; opisuje postupke za deklarisane i projektne toplotne vrednosti i preračunavanja prema uslovima temperature i vlažnosti."
  },
  "iso-6946-2017": {
    id: "iso-6946-2017",
    publisher: "ISO",
    title: "ISO 6946:2017 - Thermal resistance and thermal transmittance - Calculation methods",
    url: "https://www.iso.org/standard/65708.html",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["thermal", "u-value", "r-value", "surface-resistance"],
    notes: "Methodological reference for steady-state layer resistance and transmittance. Thermal method v1.1 applies orientation-specific internal surface resistances: Rsi 0.10 m²K/W for upward heat flow, 0.13 for horizontal and 0.17 for downward, with Rse 0.04 m²K/W. The app does not claim ISO certification.",
    notesSr: "Metodološka referenca za stacionarni otpor i prolaz toplote kroz slojeve. Termički metod v1.1 koristi unutrašnje površinske otpore prema smeru toka: Rsi 0.10 m²K/W za tok naviše, 0.13 horizontalno i 0.17 naniže, uz Rse 0.04 m²K/W. Aplikacija ne tvrdi da je sertifikovana prema ISO standardu."
  },
  "iso-13789-2017": {
    id: "iso-13789-2017",
    publisher: "ISO",
    title: "ISO 13789:2017 - Transmission and ventilation heat transfer coefficients",
    url: "https://www.iso.org/standard/65713.html",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["thermal", "ventilation", "steady-state"],
    notes: "Methodological reference for separating transmission and ventilation heat transfer. The MVP does not claim a validated infiltration model.",
    notesSr: "Metodološka referenca za razdvajanje prenosa toplote i ventilacionih gubitaka. MVP ne tvrdi da poseduje validiran model infiltracije."
  },
  "iso-13788-2012": {
    id: "iso-13788-2012",
    publisher: "ISO",
    title: "ISO 13788:2012 - Surface humidity and interstitial condensation calculation methods",
    url: "https://www.iso.org/standard/51615.html",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["moisture", "condensation"],
    notes: "Documents limitations of simplified moisture indicators; full hygrothermal simulation is outside the MVP.",
    notesSr: "Dokumentuje ograničenja pojednostavljenih pokazatelja vlage; potpuna higrotermička simulacija nije deo MVP-a."
  },
  "iec-60335-2-71-2018": {
    id: "iec-60335-2-71-2018",
    publisher: "IEC",
    title: "IEC 60335-2-71:2018 - Particular requirements for electrical heating appliances for breeding and rearing animals",
    url: "https://webstore.iec.ch/en/publication/60364",
    accessedAt: "2026-09-27",
    tier: 1,
    topics: ["heating", "electrical-safety", "animals"],
    notes: "Safety reference for electrical animal-heating appliances. The app only accommodates purpose-built products and does not claim product certification.",
    notesSr: "Bezbednosna referenca za električne uređaje za grejanje životinja. Aplikacija predviđa samo namenski izrađene proizvode i ne tvrdi da je proizvod sertifikovan."
  },
  "alleycat-providing-shelter": {
    id: "alleycat-providing-shelter",
    publisher: "Alley Cat Allies",
    title: "Providing Shelter",
    url: "https://www.alleycat.org/community-cat-care/providing-shelter/",
    accessedAt: "2026-10-03",
    tier: 1,
    topics: ["community-cats", "shelter-size", "entrances", "bedding", "elevation", "placement", "materials-sourcing"],
    notes: "Describes a community-cat shelter of about 2 ft × 3 ft and at least 18 in high for three to five cats, a doorway about 6-8 in wide, an entrance away from prevailing wind or a flap/L-shaped entry, straw rather than hay or blankets, pallets for elevation and scrap lumber from building supply stores or contractors.",
    notesSr: "Opisuje sklonište za slobodnoživeće mačke od oko 2 × 3 stope i najmanje 18 inča visine za tri do pet mačaka, ulaz širine oko 6-8 inča, ulaz okrenut od dominantnog vetra ili sa zaklopcem i L-ulazom, slamu umesto sena i ćebadi, palete za podizanje i otpadnu građu od prodavnica građevinskog materijala ili izvođača."
  },
  "alleycat-build-outdoor-shelter": {
    id: "alleycat-build-outdoor-shelter",
    publisher: "Alley Cat Allies",
    title: "How to Build an Outdoor Shelter",
    url: "https://www.alleycat.org/resources/how-to-build-an-outdoor-shelter/",
    accessedAt: "2026-10-03",
    tier: 1,
    topics: ["community-cats", "tote-shelter", "insulation", "bedding", "entrances"],
    notes: "Step-by-step tote-in-tote shelter: an approximately 30 gallon outer tub, an approximately 20 gallon inner tub, a thin foam slab under the inner tub, straw (not hay) and one tube entrance through both tubs. No elevation height is specified.",
    notesSr: "Uputstvo za kutiju u kutiji: spoljašnja kutija od oko 30 galona, unutrašnja od oko 20 galona, tanka ploča stiropora ispod unutrašnje kutije, slama (ne seno) i jedan ulaz kroz obe kutije. Visina podizanja nije navedena."
  },
  "alleycat-straw-not-hay": {
    id: "alleycat-straw-not-hay",
    publisher: "Alley Cat Allies",
    title: "Straw, not Hay, for Outdoor Cat Shelters",
    url: "https://www.alleycat.org/community-cat-care/straw-not-hay-for-outdoor-cat-shelters",
    accessedAt: "2026-10-03",
    tier: 1,
    topics: ["bedding", "straw", "hay", "community-cats", "moisture"],
    notes: "Straw repels moisture while hay soaks it up and can mold. Loosely pack straw to the quarter or halfway point; store spare straw dry and off the ground.",
    notesSr: "Slama odbija vlagu, a seno je upija i može da se ubuđa. Slamu rastresito napuniti do četvrtine ili polovine visine; rezervu čuvati suvu i odignutu od tla."
  },
  "alleycat-cold-weather": {
    id: "alleycat-cold-weather",
    publisher: "Alley Cat Allies",
    title: "Outdoor Cat Cold Weather Tips",
    url: "https://www.alleycat.org/outdoor-cat-cold-weather-tips/",
    accessedAt: "2026-10-03",
    tier: 1,
    topics: ["community-cats", "winter", "snow", "bedding", "antifreeze"],
    notes: "Recommends straw instead of blankets or hay, elevation, clearing snow from entrances and exits, and keeping antifreeze and de-icers away from cats.",
    notesSr: "Preporučuje slamu umesto ćebadi i sena, podizanje skloništa, čišćenje snega sa ulaza i izlaza i držanje antifriza i sredstava za otapanje leda dalje od mačaka."
  },
  "alleycat-summer-weather": {
    id: "alleycat-summer-weather",
    publisher: "Alley Cat Allies",
    title: "Summer Weather Tips",
    url: "https://www.alleycat.org/community-cat-care/summer-weather-tips/",
    accessedAt: "2026-10-03",
    tier: 1,
    topics: ["community-cats", "summer", "shade", "water", "ventilation"],
    notes: "Shelters in summer should be shaded, placed on grass or dirt rather than concrete and have two openings so hot air can cycle through; water belongs in shade and should be refreshed often.",
    notesSr: "Leti skloništa treba da budu u senci, na travi ili zemlji umesto na betonu, sa dva otvora kroz koje topao vazduh može da struji; vodu držati u senci i često je menjati."
  },
  "humane-world-heatwave": {
    id: "humane-world-heatwave",
    publisher: "Humane World for Animals",
    title: "Heatwave alert: protect pets amid soaring temperatures",
    url: "https://www.humaneworld.org/en/news/heatwave-pet-safety-tips-extreme-heat",
    accessedAt: "2026-10-03",
    tier: 1,
    topics: ["summer", "heat", "shade", "doghouse", "at-risk-animals"],
    notes: "States that doghouses do not provide relief from heat and can make it worse; trees and tarps are ideal shade because they do not obstruct airflow; old, young, overweight and short-muzzled animals are at higher risk.",
    notesSr: "Navodi da kućice za pse ne pružaju olakšanje od vrućine i mogu je pogoršati; drveće i cerade su najbolja senka jer ne zaustavljaju strujanje vazduha; stare, mlade, gojazne i kratkonose životinje su ugroženije."
  },
  "usda-aphis-dog-temperature": {
    id: "usda-aphis-dog-temperature",
    publisher: "USDA APHIS Animal Care",
    title: "Temperature Requirements for Dogs (Animal Care Tech Note, APHIS-22-031)",
    url: "https://www.aphis.usda.gov/sites/default/files/ac-tech-note-temp-req-dogs.pdf",
    accessedAt: "2026-10-03",
    tier: 1,
    topics: ["dogs", "regulatory", "outdoor-housing", "bedding", "shade", "wind-break"],
    notes: "Regulatory guidance for US Animal Welfare Act licensees and registrants, not for private companion dogs. Requires shelter with a wind break and rain break at the entrance, dry bedding in cold, shade outside the shelter because shelters may become too warm, continuous water access, and excludes unacclimated, elderly, sick or very young dogs from outdoor housing. Šapice does not transfer its temperature thresholds into universal safe temperatures.",
    notesSr: "Regulatorni vodič za licencirane subjekte po američkom Zakonu o dobrobiti životinja, ne za kućne pse. Zahteva sklonište sa zaštitom od vetra i kiše na ulazu, suvu posteljinu po hladnom vremenu, senku van skloništa jer sklonište može postati pretoplo, stalan pristup vodi i isključuje neaklimatizovane, stare, bolesne i vrlo mlade pse iz smeštaja napolju. Šapice njegove temperaturne pragove ne prenosi kao univerzalne bezbedne temperature."
  },
  "doe-basc-insulation-r-values": {
    id: "doe-basc-insulation-r-values",
    publisher: "U.S. DOE Building America Solution Center (PNNL)",
    title: "Typical R-Values and Vapor Retarder Classifications of Common Insulation Materials",
    url: "https://basc.pnnl.gov/information/typical-r-values-and-vapor-retarder-classifications-common-insulation-materials",
    accessedAt: "2026-10-03",
    tier: 1,
    topics: ["insulation", "r-value", "eps", "xps", "polyiso", "mineral-wool", "fiberglass"],
    notes: "Typical R-value per inch: EPS 3.8-4.4, XPS 5, polyiso approx. 6, fiberglass batt or board 2.5-4, mineral wool board 3-4. Šapice converts these to planning λ ranges (λ = 0.0254 m / (R_IP × 0.1761)); a product datasheet always takes precedence.",
    notesSr: "Tipične R-vrednosti po inču: EPS 3,8-4,4, XPS 5, PIR oko 6, staklena vuna 2,5-4, ploče kamene vune 3-4. Šapice ih preračunava u planske raspone λ (λ = 0,0254 m / (R_IP × 0,1761)); tehnički list konkretnog proizvoda uvek ima prednost."
  },
  "ippc-ispm-15": {
    id: "ippc-ispm-15",
    publisher: "International Plant Protection Convention (IPPC)",
    title: "ISPM 15: Regulation of wood packaging material in international trade",
    url: "https://www.ippc.int/en/publications/640/",
    accessedAt: "2026-10-03",
    tier: 1,
    topics: ["pallets", "wood-packaging", "treatment-marks", "reuse"],
    notes: "Phytosanitary standard for wood packaging in international trade, including treatment codes such as HT (heat treatment) and MB (methyl bromide). The mark confirms a phytosanitary treatment only; it says nothing about the later history, contamination or condition of a used pallet.",
    notesSr: "Fitosanitarni standard za drvenu ambalažu u međunarodnom prometu, sa oznakama tretmana kao što su HT (termička obrada) i MB (metil-bromid). Oznaka potvrđuje samo fitosanitarni tretman i ne govori ništa o kasnijoj istoriji, zagađenju ni stanju korišćene palete."
  },
  "epa-cca-treated-wood": {
    id: "epa-cca-treated-wood",
    publisher: "U.S. Environmental Protection Agency",
    title: "Chromated Arsenicals (CCA)",
    url: "https://www.epa.gov/ingredients-used-pesticide-products/chromated-arsenicals-cca",
    accessedAt: "2026-10-03",
    tier: 1,
    topics: ["treated-wood", "cca", "reuse", "safety"],
    notes: "CCA-treated wood was withdrawn from US homeowner uses at the end of 2003, but older structures may still contain it. Do not burn it; use dust protection when sawing and wash hands after handling. Šapice therefore rejects unknown old treated timber wherever an animal could chew or lick it.",
    notesSr: "Drvo tretirano CCA sredstvom povučeno je iz kućne upotrebe u SAD krajem 2003. godine, ali starije konstrukcije ga i dalje mogu sadržati. Ne sme se paliti; pri sečenju koristiti zaštitu od prašine i oprati ruke posle rada. Zato Šapice odbija nepoznatu staru impregniranu građu svuda gde bi je životinja mogla gristi ili lizati."
  }
};

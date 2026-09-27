import type {AppLocale} from "@/i18n/routing";
import type {ShelterModel} from "@/lib/domain";
import {sources} from "@/data/sources";

export function OperatingGuidance({
  model,
  locale
}: {
  model: ShelterModel;
  locale: AppLocale;
}) {
  const isSr = locale === "sr";
  const isCat = model.animal === "cat";

  const items = isCat
    ? (isSr
        ? [
          "Postavite sklonište na zaštićeno mesto, van direktnog vetra i rizika od predatora.",
          "Držite sklonište podignuto i suvo; ulaz ne treba da bude u nivou mokrog tla ili snega.",
          "Za community mačke koristite slamu kao zimsku posteljinu; peškiri i ćebad mogu zadržavati vlagu.",
          model.layout.entrances > 1
            ? "Više ulaza daje dodatni escape route, ali povećava prodor hladnog vazduha; zaštita ulaza je zato važnija."
            : "Jedan mali ulaz smanjuje razmenu hladnog vazduha; procenite rizik od predatora na konkretnoj lokaciji.",
          "Posle snega ili jake kiše proverite ulaz, suvoću posteljine i stabilnost kućice."
        ]
        : [
          "Place the shelter in a protected location away from direct wind and predator hazards.",
          "Keep it elevated and dry; the entrance should not sit at wet-ground or snow level.",
          "For community cats, use straw as winter bedding; towels and blankets can retain moisture.",
          model.layout.entrances > 1
            ? "Multiple entrances add an escape route but also increase cold-air exchange, making entrance protection more important."
            : "A single small entrance reduces cold-air exchange; assess predator risk at the actual location.",
          "After snow or heavy rain, check the entrance, bedding dryness and shelter stability."
        ])
    : (isSr
        ? [
          "Ova kućica je pomoćno spoljašnje sklonište, ne zamena za držanje psa unutra tokom opasne hladnoće ili nevremena.",
          "Sklonište treba da ostane suvo, bez direktne promaje i podignuto od hladnog ili mokrog tla.",
          "Pas mora imati dovoljno prostora da normalno ustane, okrene se i legne, ali prevelik unutrašnji volumen otežava zadržavanje toplote.",
          "Redovno proveravajte vodu, posteljinu, prodor vlage i stanje ulaza.",
          "Tokom ekstremne hladnoće, snežne oluje ili ledene kiše prioritet je bezbedno unutrašnje sklonište."
        ]
        : [
          "This is an auxiliary outdoor shelter, not a substitute for keeping a dog indoors during dangerous cold or severe weather.",
          "The shelter should remain dry, protected from direct drafts and raised from cold or wet ground.",
          "The dog needs enough room to stand, turn and lie normally, while excessive interior volume makes heat retention harder.",
          "Regularly check water, bedding, moisture ingress and entrance condition.",
          "During extreme cold, snowstorms or freezing rain, safe indoor shelter takes priority."
        ]);

  const sourceIds = isCat
    ? ["aspcapro-community-cat-winter", "aspca-cold-weather"]
    : ["humane-world-pets-cold", "aspca-cold-weather"];

  return (
    <section className="section operation-section" id="operation">
      <div className="shell operation-layout">
        <div>
          <span className="kicker">Operation & welfare</span>
          <h2>{isSr ? "Kako koristiti model zimi" : "How to use the model in winter"}</h2>
          <p>
            {isSr
              ? "Konstrukcija sama nije dovoljna. Lokacija, vlaga, posteljina, vreme i redovna kontrola direktno utiču na stvarnu korisnost skloništa."
              : "Construction alone is not enough. Placement, moisture, bedding, weather and routine inspection directly affect real-world shelter performance."}
          </p>
        </div>
        <div>
          <ul className="operation-list">
            {items.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <div className="operation-sources">
            {sourceIds.map((sourceId) => {
              const source = sources[sourceId];
              return source ? (
                <a key={sourceId} href={source.url} target="_blank" rel="noreferrer">
                  {source.publisher} ↗
                </a>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

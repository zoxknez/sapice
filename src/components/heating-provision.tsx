import type {AppLocale} from "@/i18n/routing";
import type {CompiledShelterModel} from "@/lib/compiler";
import {sources} from "@/data/sources";

export function HeatingProvision({
  compiled,
  locale
}: {
  compiled: CompiledShelterModel;
  locale: AppLocale;
}) {
  if (!compiled.model.heated) return null;

  const isSr = locale === "sr";
  const source = sources[compiled.heating.safetySourceId];

  return (
    <section className="section heating-provision-section" id="heating">
      <div className="shell">
        <div className="section-heading">
          <div>
            <span className="kicker">{isSr ? "Grejanje" : "Heating"} · {compiled.heating.status}</span>
            <h2>{isSr ? "Zone za namenski grejni proizvod" : "Purpose-built heating zones"}</h2>
          </div>
          <p>
            {isSr
              ? "Kompajler rezerviše po jednu zonu u svakoj komori, ali ne određuje snagu, napon, termostat niti improvizovano ožičenje. Konkretan proizvod mora biti namenjen životinjama i ugrađen po sopstvenom uputstvu."
              : "The compiler reserves one zone in each chamber, but does not specify power, voltage, thermostat behavior or improvised wiring. The selected product must be purpose-built for animals and installed to its own instructions."}
          </p>
        </div>

        <div className="heating-zone-grid">
          {compiled.heating.zones.map((zone) => {
            const unheatedAreaM2 = Math.max(
              0,
              zone.chamberFloorAreaM2 - zone.areaM2
            );
            const coveragePct =
              zone.chamberFloorAreaM2 > 0
                ? (zone.areaM2 / zone.chamberFloorAreaM2) * 100
                : 0;

            return (
              <article key={zone.id}>
                <span className="kicker">
                  {isSr ? `Komora ${zone.chamber}` : `Chamber ${zone.chamber}`}
                </span>
                <strong>{zone.widthMm} × {zone.depthMm} mm</strong>
                <dl>
                  <div>
                    <dt>{isSr ? "Pokrivenost poda" : "Floor coverage"}</dt>
                    <dd>{coveragePct.toFixed(0)}%</dd>
                  </div>
                  <div>
                    <dt>{isSr ? "Negrejana površina" : "Unheated choice area"}</dt>
                    <dd>{unheatedAreaM2.toFixed(2)} m²</dd>
                  </div>
                  <div>
                    <dt>{isSr ? "Pozicija" : "Position"}</dt>
                    <dd>X {zone.xMm.toFixed(0)} / Z {zone.zMm.toFixed(0)} mm</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>

        <div className="heating-safety-note">
          <strong>{isSr ? "Bez samostalno izvedenog mrežnog grejanja" : "No DIY mains heating"}</strong>
          <p>
            {isSr
              ? "Zone su koordinaciona geometrija, ne električni projekat. Adapter, kontroler i nezaštićeni spojevi ne pripadaju prostoru životinje. Stavke za prolaz kabla u spisku materijala samo rezervišu zaštićeni prolaz za konkretan kompatibilan proizvod."
              : "Zones are coordination geometry, not an electrical design. Adapters, controllers and unprotected connections do not belong in the animal space. Cable-entry BOM items only reserve protected routing for a selected compatible product."}
          </p>
          {source && (
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.publisher} · {source.title} ↗
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

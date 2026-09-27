import type {AppLocale} from "@/i18n/routing";
import type {CompiledShelterModel} from "@/lib/compiler";

export function VentilationProvision({
  compiled,
  locale
}: {
  compiled: CompiledShelterModel;
  locale: AppLocale;
}) {
  const isSr = locale === "sr";

  return (
    <section className="section ventilation-section" id="ventilation">
      <div className="shell">
        <div className="section-heading">
          <div>
            <span className="kicker">Ventilation · {compiled.ventilation.status}</span>
            <h2>{isSr ? "Rezervisane high-rear zone" : "Reserved high-rear zones"}</h2>
          </div>
          <p>
            {isSr
              ? "Ovo nisu propisane dimenzije ventilacionog otvora. Compiler samo rezerviše zone koje ne seku provisional framing; stvarni cutout i net free area ostaju vezani za izabrani podesivi ventilacioni umetak i fizičku validaciju."
              : "These are not prescribed vent-opening dimensions. The compiler only reserves zones that avoid provisional framing; the actual cutout and net free area remain specific to the selected adjustable vent insert and physical validation."}
          </p>
        </div>

        <div className="ventilation-summary">
          <div>
            <span>{isSr ? "Strategija" : "Strategy"}</span>
            <strong>HIGH REAR</strong>
          </div>
          <div>
            <span>{isSr ? "Zona po komori" : "Zone per chamber"}</span>
            <strong>{compiled.ventilation.zonesPerChamber}</strong>
          </div>
          <div>
            <span>{isSr ? "Gornji razmak" : "Top clearance"}</span>
            <strong>{compiled.ventilation.topClearanceMm} mm</strong>
          </div>
          <div>
            <span>{isSr ? "Stvarni otvor" : "Actual opening"}</span>
            <strong>{isSr ? "TBD po umetku" : "TBD by insert"}</strong>
          </div>
        </div>

        <div className="ventilation-zone-grid">
          {compiled.ventilation.zones.map((zone) => (
            <article key={zone.id}>
              <span className="kicker">
                {isSr ? `Komora ${zone.chamber}` : `Chamber ${zone.chamber}`}
              </span>
              <strong>{zone.widthMm} × {zone.heightMm} mm</strong>
              <dl>
                <div>
                  <dt>{isSr ? "Centar X" : "Center X"}</dt>
                  <dd>{zone.centerXmm.toFixed(0)} mm</dd>
                </div>
                <div>
                  <dt>{isSr ? "Dno iznad gotovog poda" : "Bottom above finished floor"}</dt>
                  <dd>{zone.bottomMm.toFixed(0)} mm</dd>
                </div>
                <div>
                  <dt>{isSr ? "Status" : "Status"}</dt>
                  <dd>{zone.provenance}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>

        <div className="ventilation-warning">
          <strong>{isSr ? "Granica V1 modela" : "V1 model boundary"}</strong>
          <p>
            {isSr
              ? "Zona je koordinaciona rezerva, ne dokaz dovoljne ventilacije. Posle izrade proveravaju se kondenzacija, miris/vlaga i lokalna promaja; po potrebi se menja konkretan ventilacioni umetak ili njegova regulacija."
              : "The zone is a coordination reserve, not proof of adequate ventilation. After construction, condensation, odor/moisture and local drafts must be checked; the actual vent insert or its setting may need adjustment."}
          </p>
        </div>
      </div>
    </section>
  );
}

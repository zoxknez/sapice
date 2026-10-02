import {ImageResponse} from "next/og";
import type {AppLocale} from "@/i18n/routing";
import {getShelterModel} from "@/data/models";
import {compileShelterModel} from "@/lib/compiler";
import {modelDescription} from "@/lib/model-presentation";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default async function ModelOpenGraphImage({
  params
}: {
  params: Promise<{locale: AppLocale; slug: string}>;
}) {
  const {locale, slug} = await params;
  const model = getShelterModel(slug);
  if (!model) {
    return new ImageResponse(
      <div style={{display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#f4f0e8", fontSize: "58px"}}>
        Šapice
      </div>,
      size
    );
  }

  const compiled = compileShelterModel(model);
  const copy = model.translations[locale];
  const isSr = locale === "sr";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f4f0e8",
          color: "#1d1c1a",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div style={{width: "58%", padding: "62px 58px 56px 70px", display: "flex", flexDirection: "column"}}>
          <div style={{display: "flex", alignItems: "center", gap: "14px", marginBottom: "56px"}}>
            <div style={{width: "56px", height: "56px", borderRadius: "17px", display: "flex", alignItems: "center", justifyContent: "center", background: "#1d1c1a", color: "#fff", fontSize: "30px", fontWeight: 800}}>Š</div>
            <div style={{fontSize: "28px", fontWeight: 800}}>Šapice</div>
          </div>

          <div style={{fontSize: "17px", letterSpacing: "2.4px", textTransform: "uppercase", color: "#9a6442", marginBottom: "16px"}}>
            {model.validationState.replaceAll("_", " ")}
          </div>
          <div style={{fontSize: "55px", lineHeight: 1.02, letterSpacing: "-2.4px", fontWeight: 850, marginBottom: "22px"}}>
            {copy.name}
          </div>
          <div style={{fontSize: "22px", lineHeight: 1.4, color: "#665f58"}}>
            {modelDescription(model, locale)}
          </div>

          <div style={{display: "flex", gap: "10px", marginTop: "auto", flexWrap: "wrap"}}>
            {[
              `${model.dimensions.widthMm} × ${model.dimensions.depthMm} mm`,
              isSr ? `${model.layout.chambers} komora` : `${model.layout.chambers} chambers`,
              isSr ? `${compiled.internal.usableFloorAreaM2.toFixed(2)} m² korisno` : `${compiled.internal.usableFloorAreaM2.toFixed(2)} m² usable`
            ].map((label) => (
              <div key={label} style={{padding: "9px 12px", borderRadius: "999px", background: "#e6ddd1", fontSize: "16px", color: "#594b40"}}>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div style={{width: "42%", display: "flex", alignItems: "center", justifyContent: "center", background: "#292722", position: "relative"}}>
          <div style={{position: "absolute", top: "38px", right: "38px", color: "#bfb4aa", fontSize: "16px"}}>
            v{model.version}
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: "20px", width: "78%"}}>
            <div style={{fontSize: "16px", color: "#c2b8ae", textTransform: "uppercase", letterSpacing: "2px"}}>
              {isSr ? "Model summary" : "Model summary"}
            </div>
            {[
              [isSr ? "Životinja" : "Animal", model.animal === "cat" ? (isSr ? "Mačka" : "Cat") : (isSr ? "Pas" : "Dog")],
              [isSr ? "Izolacija" : "Insulation", `${compiled.assemblies.wall.layers.find((layer) => layer.role === "insulation")?.thicknessMm ?? 0} mm`],
              [isSr ? "Ulazi" : "Entrances", String(model.layout.entrances)],
              [isSr ? "Grejanje" : "Heating", model.heated ? (isSr ? "Predviđeno" : "Ready") : (isSr ? "Pasivno" : "Passive")]
            ].map(([label, value]) => (
              <div key={label} style={{display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ffffff18", paddingBottom: "12px"}}>
                <span style={{color: "#a9a097", fontSize: "18px"}}>{label}</span>
                <strong style={{color: "#f1ece6", fontSize: "20px"}}>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}

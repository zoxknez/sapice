import {ImageResponse} from "next/og";
import type {AppLocale} from "@/i18n/routing";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default async function OpenGraphImage({
  params
}: {
  params: Promise<{locale: AppLocale}>;
}) {
  const {locale} = await params;
  const isSr = locale === "sr";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 74px",
          background: "#f4f0e8",
          color: "#1d1c1a",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <div style={{display: "flex", alignItems: "center", gap: "18px"}}>
            <div
              style={{
                width: "74px",
                height: "74px",
                borderRadius: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#1d1c1a",
                color: "#f4f0e8",
                fontSize: "40px",
                fontWeight: 800
              }}
            >
              Š
            </div>
            <div style={{fontSize: "34px", fontWeight: 800}}>Šapice</div>
          </div>
          <div style={{fontSize: "18px", color: "#75695f"}}>SR · EN · Open engineering</div>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: "22px", maxWidth: "980px"}}>
          <div style={{fontSize: "18px", letterSpacing: "3px", textTransform: "uppercase", color: "#9a6442"}}>
            Pet Shelter Engineering
          </div>
          <div style={{fontSize: "68px", lineHeight: 1.02, letterSpacing: "-3px", fontWeight: 850}}>
            {isSr
              ? "Tehnički planovi zimskih kućica za pse i mačke."
              : "Engineering plans for winter cat and dog shelters."}
          </div>
          <div style={{fontSize: "25px", lineHeight: 1.4, color: "#655e57"}}>
            {isSr
              ? "3D · mere · krojna lista · nesting · termika · troškovnik · build mode"
              : "3D · dimensions · cut lists · nesting · thermal estimates · costing · build mode"}
          </div>
        </div>

        <div style={{display: "flex", justifyContent: "space-between", color: "#6f655c", fontSize: "18px"}}>
          <span>Deterministic · No runtime AI</span>
          <span>sapice</span>
        </div>
      </div>
    ),
    size
  );
}

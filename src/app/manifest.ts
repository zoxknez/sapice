import type {MetadataRoute} from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Šapice · Pet Shelter Engineering",
    short_name: "Šapice",
    description: "Bilingual engineering plans for winter cat and dog shelters.",
    start_url: "/sr",
    display: "standalone",
    background_color: "#f4f0e8",
    theme_color: "#f4f0e8",
    lang: "sr-Latn",
    categories: ["utilities", "education", "lifestyle"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}

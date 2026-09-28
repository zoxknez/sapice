import {describe, expect, it} from "vitest";
import {
  defaultCatalogUrlState,
  defaultFinderUrlState,
  parseCatalogUrlState,
  parseFinderUrlState,
  serializeCatalogUrlState,
  serializeFinderUrlState
} from "@/lib/view-url-state";

describe("Finder URL state", () => {
  it("restores criteria from a shared link and clamps numeric values to control limits", () => {
    const state = parseFinderUrlState(new URLSearchParams(
      "animal=dog&count=18&dogSize=large&heating=heated&climate=severe&width=1599&depth=9999"
    ));

    expect(state).toEqual({
      animal: "dog",
      count: 12,
      dogSize: "large",
      heating: "heated",
      climate: "severe",
      maxWidthMm: 1600,
      maxDepthMm: 1800
    });
  });

  it("ignores invalid values and omits default criteria when serializing", () => {
    const invalid = parseFinderUrlState(new URLSearchParams(
      "animal=fox&count=0&dogSize=giant&heating=plug-in&climate=freezing&width=abc&depth=499"
    ));
    expect(invalid).toEqual(defaultFinderUrlState);

    const params = serializeFinderUrlState(new URLSearchParams("utm_source=community"), defaultFinderUrlState);
    expect(params.toString()).toBe("utm_source=community");
  });

  it("serializes non-default criteria without dropping unrelated parameters", () => {
    const params = serializeFinderUrlState(
      new URLSearchParams("utm_source=community&animal=cat&depth=900"),
      {
        ...defaultFinderUrlState,
        animal: "dog",
        dogSize: "large",
        heating: "heated",
        climate: "severe",
        maxDepthMm: 1000
      }
    );

    expect(params.get("utm_source")).toBe("community");
    expect(params.get("animal")).toBe("dog");
    expect(params.get("dogSize")).toBe("large");
    expect(params.get("heating")).toBe("heated");
    expect(params.get("climate")).toBe("severe");
    expect(params.get("depth")).toBe("1000");
    expect(params.has("count")).toBe(false);
    expect(params.has("width")).toBe(false);
  });
});

describe("model catalog URL state", () => {
  const validSlugs = [
    "nordic-solo-winter",
    "nordic-duo-winter",
    "nordic-quad-winter",
    "alpine-colony-six"
  ];

  it("restores filters and only the last three unique, published comparison models", () => {
    const state = parseCatalogUrlState(
      new URLSearchParams("animal=cat&heating=heated&q=quad&compare=nordic-solo-winter,missing,nordic-duo-winter,nordic-quad-winter,alpine-colony-six,nordic-duo-winter"),
      validSlugs
    );

    expect(state).toEqual({
      animal: "cat",
      heating: "heated",
      query: "quad",
      compareSlugs: ["nordic-duo-winter", "nordic-quad-winter", "alpine-colony-six"]
    });
  });

  it("falls back to defaults for invalid filters and removes default catalog state", () => {
    const invalid = parseCatalogUrlState(
      new URLSearchParams("animal=fox&heating=DIY&q=%20%20&compare=unknown"),
      validSlugs
    );
    expect(invalid).toEqual(defaultCatalogUrlState);

    const params = serializeCatalogUrlState(
      new URLSearchParams("utm_campaign=winter"),
      defaultCatalogUrlState,
      validSlugs
    );
    expect(params.toString()).toBe("utm_campaign=winter");
  });

  it("serializes selected model slugs in their comparison order", () => {
    const params = serializeCatalogUrlState(
      new URLSearchParams("utm_campaign=winter&compare=old-model&animal=dog"),
      {
        animal: "cat",
        heating: "heated",
        query: "Nordic",
        compareSlugs: ["nordic-quad-winter", "nordic-duo-winter"]
      },
      validSlugs
    );

    expect(params.get("utm_campaign")).toBe("winter");
    expect(params.get("animal")).toBe("cat");
    expect(params.get("heating")).toBe("heated");
    expect(params.get("q")).toBe("Nordic");
    expect(params.get("compare")).toBe("nordic-quad-winter,nordic-duo-winter");
  });
});

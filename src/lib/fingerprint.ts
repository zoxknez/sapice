function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .filter((key) => record[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
    .join(",")}}`;
}

function fnv1a32(text: string, seed: number) {
  let hash = seed >>> 0;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function deterministicFingerprint(value: unknown) {
  const serialized = stableSerialize(value);
  const a = fnv1a32(serialized, 0x811c9dc5);
  const b = fnv1a32(serialized, 0x9e3779b9);
  return `${a.toString(16).padStart(8, "0")}${b
    .toString(16)
    .padStart(8, "0")}`;
}

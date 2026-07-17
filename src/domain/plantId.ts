// 6 hex chars = 16M possibilities per acronym — avoids Math.random()'s
// 4-char (65k) collision range at scale.
export function generatePlantId(acronym: string): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join('');
  return `APN-${acronym.toUpperCase()}-${hex}`;
}

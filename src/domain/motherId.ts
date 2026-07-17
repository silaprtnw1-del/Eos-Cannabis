import * as Crypto from 'expo-crypto';

// 6 hex chars = 16M possibilities per acronym — avoids Math.random()'s
// 4-char (65k) collision range at scale. Uses expo-crypto (not the global
// `crypto` object) since Hermes/React Native has no built-in Web Crypto API.
export function generateMotherId(acronym: string): string {
  const bytes = Crypto.getRandomBytes(3);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join('');
  return `MOM-${acronym.toUpperCase()}-${hex}`;
}

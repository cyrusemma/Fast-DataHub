// ALL money is stored as integers in pesewas (GHS * 100). NEVER use floats.
export const formatGHS = (pesewas) => `GHS ${((pesewas ?? 0) / 100).toFixed(2)}`
export const pesewasToGHS = (p) => (p ?? 0) / 100
export const GHSToPesewas = (g) => Math.round(g * 100)

// Compact display, e.g. GHS 12.5k
export const formatGHSCompact = (pesewas) => {
  const ghs = (pesewas ?? 0) / 100
  if (Math.abs(ghs) >= 1000) return `GHS ${(ghs / 1000).toFixed(1)}k`
  return `GHS ${ghs.toFixed(2)}`
}

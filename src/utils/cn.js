// Tiny classnames joiner (no external dep). Filters falsy values.
export function cn(...args) {
  return args.flat(Infinity).filter(Boolean).join(' ')
}

// A "Space" is a huge virtual list: item i is computed on demand, never stored.
export interface Space { total: number; at: (i: number) => string }
const CAP = 1e15 // keep indexes inside safe integer range

export const SETS = {
  letter: 'abcdefghijklmnopqrstuvwxyz',
  vowel: 'aeiou',
  consonant: 'bcdfghjklmnpqrstvwxyz',
  digit: '0123456789',
  alnum: 'abcdefghijklmnopqrstuvwxyz0123456789',
} as const
export type SlotType = keyof typeof SETS | 'custom'
export interface Slot { type: SlotType; custom: string }

export const slotChars = (s: Slot): string =>
  s.type === 'custom' ? [...new Set(s.custom.toLowerCase())].join('') : SETS[s.type]

const KEY: Record<string, SlotType> = { L: 'letter', V: 'vowel', C: 'consonant', D: 'digit', A: 'alnum' }
export const fromPreset = (p: string): Slot[] =>
  [...p].map((c) => ({ type: KEY[c] ?? 'letter', custom: '' }))

export function patternSpace(slots: Slot[]): Space {
  const sets = slots.map(slotChars)
  const total = Math.min(CAP, sets.reduce((t, s) => t * s.length, 1))
  return {
    total: sets.some((s) => !s.length) || !sets.length ? 0 : total,
    at: (i) => {
      let r = i, out = ''
      for (let k = sets.length - 1; k >= 0; k--) { out = sets[k][r % sets[k].length] + out; r = Math.floor(r / sets[k].length) }
      return out
    },
  }
}

export type NumPos = 'prefix' | 'suffix'
export function wordSpace(words: string[], digits: number, pos: NumPos): Space {
  const per = 10 ** digits
  return {
    total: words.length * per,
    at: (i) => {
      const w = words[Math.floor(i / per)]
      if (!digits) return w
      const n = String(i % per).padStart(digits, '0')
      return pos === 'prefix' ? n + w : w + n
    },
  }
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
// Random order with no duplicates: bijective index scramble (i*step+offset mod N).
export function shuffled(sp: Space, seed: number): Space {
  const N = sp.total
  if (N < 3) return sp
  let step = Math.floor(N * 0.618) + 1
  while (gcd(step, N) !== 1) step++
  const n = BigInt(N), s = BigInt(step), o = BigInt(Math.floor(seed * N) % N)
  return { total: N, at: (i) => sp.at(Number((BigInt(i) * s + o) % n)) }
}

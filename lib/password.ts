// Generates a strong, readable temporary password for new user invites.
// Avoids visually ambiguous characters (0/O, 1/l/I) since this gets typed by hand off an email.

const UPPER = 'ABCDEFGHJKMNPQRSTUVWXYZ'
const LOWER = 'abcdefghjkmnpqrstuvwxyz'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%'

function pick(chars: string) {
  return chars[Math.floor(Math.random() * chars.length)]
}

export function generateTempPassword(length = 12): string {
  const all = UPPER + LOWER + DIGITS + SYMBOLS
  // Guarantee at least one of each character class, then fill the rest randomly.
  const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)]
  const rest = Array.from({ length: length - required.length }, () => pick(all))
  const combined = [...required, ...rest]

  // Shuffle so the required characters aren't always in the same position.
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[combined[i], combined[j]] = [combined[j], combined[i]]
  }
  return combined.join('')
}
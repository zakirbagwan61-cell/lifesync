// Hide most of a sensitive number (document numbers) when it is shown in a list.
//   "ABCDE1234F" -> "••••••234F"   (up to 6 dots, then the last 4 characters)
//   "P1234567"   -> "••••4567"
// Short values (4 characters or fewer) are fully hidden, because showing them would show everything.
export function maskNumber(value) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  if (text.length <= 4) return '•'.repeat(text.length)
  return '•'.repeat(Math.min(text.length - 4, 6)) + text.slice(-4)
}

export interface KeyLike {
  code: string
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  metaKey: boolean
}

const MODIFIER_CODES = /^(Control|Alt|Shift|Meta|OS)(Left|Right)?$/
const FUNCTION_KEY = /^F([1-9]|1[0-9]|2[0-4])$/

function keyName(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit[0-9]$/.test(code)) return code.slice(5)
  if (FUNCTION_KEY.test(code)) return code
  if (code === 'Space') return 'Space'
  return null
}

// нажатие -> строка для globalShortcut. буква без модификатора не годится: будет мешать печатать
export function keyToAccelerator(e: KeyLike): string | null {
  if (MODIFIER_CODES.test(e.code)) return null
  const key = keyName(e.code)
  if (!key) return null
  const mods = [e.ctrlKey || e.metaKey ? 'CommandOrControl' : null, e.altKey ? 'Alt' : null, e.shiftKey ? 'Shift' : null].filter(Boolean)
  if (mods.length === 0 && !FUNCTION_KEY.test(key)) return null
  return [...mods, key].join('+')
}

export function acceleratorLabel(accel: string): string {
  return accel.split('+').map((p) => (p === 'CommandOrControl' ? 'Ctrl' : p)).join(' + ')
}

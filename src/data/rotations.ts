// награды Тешина приходят на английском
const TESHIN_NAMES: [RegExp, string][] = [
  [/^Umbra Forma Blueprint$/i, 'Чертёж Умбра-формы'],
  [/^([\d,]+) Kuva$/i, '$1 кувы'],
  [/^([\d,]+) Endo$/i, '$1 эндо'],
  [/^(\d+)x Forma$/i, '$1 Формы'],
  [/^Kitgun Riven Mod$/i, 'Ривен для китгана'],
  [/^Zaw Riven Mod$/i, 'Ривен для Зо'],
  [/^Rifle Riven Mod$/i, 'Ривен для винтовки'],
  [/^Shotgun Riven Mod$/i, 'Ривен для дробовика'],
  [/^Pistol Riven Mod$/i, 'Ривен для пистолета'],
  [/^Melee Riven Mod$/i, 'Ривен ближнего боя'],
  [/^Veiled Riven Cipher$/i, 'Шифр скрытого ривена'],
  [/^Primary Arcane Adapter$/i, 'Адаптер мистификатора (основное)'],
  [/^Secondary Arcane Adapter$/i, 'Адаптер мистификатора (вторичное)'],
  [/^Relic Pack$/i, 'Набор реликвий'],
  [/^Stance Forma Blueprint$/i, 'Чертёж Формы стойки'],
]

export function teshinRu(name: string): string {
  for (const [re, ru] of TESHIN_NAMES) {
    if (re.test(name)) return name.replace(re, ru).replace(/,/g, ' ')
  }
  return name
}

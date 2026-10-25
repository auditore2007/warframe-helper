// @vitest-environment node
import { describe, it, expect } from 'vitest'
import rewards from './rewards.cjs'

const { gameLanguageFromLog, normalizeName, similarity, groupColumns, matchReward } = rewards

const word = (text, x0, y0, w = 60, h = 20, confidence = 90) => ({ text, confidence, bbox: { x0, y0, x1: x0 + w, y1: y0 + h } })

describe('gameLanguageFromLog', () => {
  it('reads the client language', () => {
    expect(gameLanguageFromLog('2.390 Sys [Info]: Using language: _ru\n')).toBe('ru')
    expect(gameLanguageFromLog('Process Command-line: -language:en -x')).toBe('en')
    expect(gameLanguageFromLog('nothing')).toBe('en')
    expect(gameLanguageFromLog(undefined)).toBe('en')
  })
})

describe('names', () => {
  it('normalizes case, ё and punctuation', () => {
    expect(normalizeName('Сарина Прайм: Нейрооптика (Чертёж)')).toBe('сарина прайм нейрооптика чертеж')
    expect(normalizeName("  Hell's   Chamber ")).toBe('hells chamber')
  })
  it('scores word order and small typos as similar', () => {
    expect(similarity('saryn prime neuroptics blueprint', 'saryn prime neuroptics blueprint')).toBe(1)
    expect(similarity('neuroptics saryn prime blueprint', 'saryn prime neuroptics blueprint')).toBe(1)
    expect(similarity('saryn prlme neur0ptics blueprint', 'saryn prime neuroptics blueprint')).toBeGreaterThan(0.85)
    expect(similarity('forma blueprint', 'saryn prime neuroptics blueprint')).toBeLessThan(0.5)
  })
})

describe('groupColumns', () => {
  it('joins wrapped lines of one reward and splits separate rewards', () => {
    const words = [
      word('Saryn', 100, 300), word('Prime', 170, 300), word('Neuroptics', 100, 325, 90),
      word('Forma', 400, 300), word('Blueprint', 470, 300, 80),
      word('Akstiletto', 700, 300, 90), word('Prime', 800, 300), word('Barrel', 720, 325),
    ]
    expect(groupColumns(words, 1000)).toEqual(['Saryn Prime Neuroptics', 'Forma Blueprint', 'Akstiletto Prime Barrel'])
    expect(groupColumns([], 1000)).toEqual([])
  })
  it('attaches unsure words only next to confident text, never bridging columns', () => {
    const words = [
      word('Akstiletto', 100, 300, 90), word('Prime', 200, 300),
      word('Barrel', 120, 325, 60, 20, 20),
      word('vit', 150, 200, 260, 20, 20),
      word('Forma', 400, 300), word('Blueprint', 470, 300, 80),
    ]
    expect(groupColumns(words, 1000)).toEqual(['Akstiletto Prime Barrel', 'Forma Blueprint'])
  })
})

describe('matchReward', () => {
  const candidates = [
    { slug: 'saryn_prime_neuroptics_blueprint', names: ['Saryn Prime Neuroptics Blueprint', 'Сарина Прайм: Нейрооптика (Чертеж)'] },
    { slug: 'akstiletto_prime_barrel', names: ['Akstiletto Prime Barrel', 'Акстилетто Прайм: Ствол'] },
    { slug: null, names: ['Forma Blueprint', 'Чертеж: Форма'] },
  ]
  it('finds the closest reward in either language', () => {
    expect(matchReward('Saryn Prime Neuroptics Blueprint', candidates)?.slug).toBe('saryn_prime_neuroptics_blueprint')
    expect(matchReward('Akstiletto Prirne Barrel', candidates)?.slug).toBe('akstiletto_prime_barrel')
    expect(matchReward('Нейрооптика Сарина Прайм Чертеж', candidates)?.slug).toBe('saryn_prime_neuroptics_blueprint')
    expect(matchReward('Forma Blueprint', candidates)).toMatchObject({ slug: null, name: 'Forma Blueprint' })
  })
  it('rejects noise', () => {
    expect(matchReward('x7 ]] ~', candidates)).toBeNull()
    expect(matchReward('', candidates)).toBeNull()
  })
})

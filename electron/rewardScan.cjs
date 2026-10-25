'use strict'

const path = require('node:path')
const { readRewardColumns, OCR_DIR } = require('./ocr.cjs')
const { gameLanguageFromLog, matchReward } = require('./lib/rewards.cjs')

// у формы нет слага на маркете, добавляем руками
const FORMA = { slug: null, names: ['Forma Blueprint', 'Чертеж: Форма', 'Форма Чертеж'] }

// deps: catalogGet, marketItems, marketPrices, readLogTail, userData
function createRewardScanner(deps) {
  let candidates = null
  let running = null

  async function getCandidates(bySlug) {
    if (candidates) return candidates
    const relics = await deps.catalogGet(null, 'relics')
    if (!relics.ok) throw new Error('Каталог реликвий не загружен. Открой раздел «Реликвии» хотя бы раз с интернетом.')
    const seen = new Map([['forma', FORMA]])
    for (const relic of relics.data) {
      for (const r of relic.rewards) {
        const key = r.slug || r.name
        if (!key || seen.has(key) || /форм|forma/i.test(r.name)) continue
        const item = r.slug ? bySlug.get(r.slug) : null
        seen.set(key, { slug: r.slug, names: [item ? item.en : r.name, item && item.ru ? item.ru : r.name] })
      }
    }
    candidates = [...seen.values()]
    return candidates
  }

  async function scan(image) {
    const items = await deps.marketItems(null)
    const bySlug = new Map(items.ok ? items.data.map((i) => [i.slug, i]) : [])
    const lang = gameLanguageFromLog(await deps.readLogTail())
    const ocrDir = OCR_DIR(deps.userData)
    const columns = await readRewardColumns({ lang, cacheDir: ocrDir, debugFile: path.join(ocrDir, 'last-rewards.png'), image })
    const cands = await getCandidates(bySlug)
    const prices = await deps.marketPrices(null)
    const priceOf = (slug) => (prices.ok && slug && prices.data[slug] ? prices.data[slug].median : null)
    const found = columns
      .map((text) => ({ text, match: matchReward(text, cands) }))
      .filter((r) => r.match)
      .map(({ text, match }) => {
        const item = match.slug ? bySlug.get(match.slug) : null
        return {
          text,
          slug: match.slug,
          name: match.slug ? (item && (item.ru || item.en)) || match.name : 'Чертёж Формы',
          platinum: match.slug ? priceOf(match.slug) : 0,
          ducats: (item && item.ducats) || 0,
        }
      })
    return { ok: true, items: found, columns, lang, at: Date.now() }
  }

  // повторное нажатие пока идёт распознавание - ждём тот же результат
  function run(image) {
    if (!running) {
      running = scan(image)
        .catch((err) => ({ ok: false, error: err.message || 'Не получилось распознать', items: [], columns: [], at: Date.now() }))
        .finally(() => {
          running = null
        })
    }
    return running
  }

  return { run, reset: () => { candidates = null } }
}

module.exports = { createRewardScanner }

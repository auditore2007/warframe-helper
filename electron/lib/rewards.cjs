'use strict'

const MATCH_THRESHOLD = 0.75
const COLUMN_GAP = 0.03
const STRONG_CONFIDENCE = 50
// на сколько строк вверх/вниз от текста брать неуверенные слова
const WEAK_REACH = 1.5

// язык клиента из EE.log: "Using language: _ru" или "-language:ru" в командной строке
function gameLanguageFromLog(text) {
  if (typeof text !== 'string') return 'en'
  const m = /Using language: _([a-z]{2})/.exec(text) || /-language:([a-z]{2})\b/.exec(text)
  return m ? m[1] : 'en'
}

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/['’`]/g, '')
    .replace(/[^a-zа-я0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a, b) {
  if (a === b) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]
}

// слова сортируем, чтобы "Нейрооптика Сарина Прайм" == "Сарина Прайм: Нейрооптика"
function similarity(a, b) {
  const sa = normalizeName(a).split(' ').sort().join(' ')
  const sb = normalizeName(b).split(' ').sort().join(' ')
  const len = Math.max(sa.length, sb.length)
  if (!len) return 0
  return 1 - levenshtein(sa, sb) / len
}

// слова с координатами -> текст каждой награды. названия бывают в 2 строки, поэтому группируем по x.
// уверенные слова строят колонки, неуверенные только добавляются рядом с текстом
// (иначе мусор с иконок склеивает соседние награды)
function groupColumns(words, width) {
  const gap = width * COLUMN_GAP
  const strong = words.filter((w) => (w.confidence ?? 100) >= STRONG_CONFIDENCE)
  const weak = words.filter((w) => (w.confidence ?? 100) < STRONG_CONFIDENCE)
  const cols = []
  for (const w of [...strong].sort((a, b) => a.bbox.x0 - b.bbox.x0)) {
    const col = cols.find((c) => w.bbox.x0 <= c.x1 + gap && w.bbox.x1 >= c.x0 - gap)
    if (col) {
      col.words.push(w)
      col.x0 = Math.min(col.x0, w.bbox.x0)
      col.x1 = Math.max(col.x1, w.bbox.x1)
    } else {
      cols.push({ x0: w.bbox.x0, x1: w.bbox.x1, words: [w] })
    }
  }
  const used = new Set()
  for (const c of cols) {
    const lineH = Math.max(...c.words.map((w) => w.bbox.y1 - w.bbox.y0))
    const top = Math.min(...c.words.map((w) => w.bbox.y0)) - lineH * WEAK_REACH
    const bottom = Math.max(...c.words.map((w) => w.bbox.y1)) + lineH * WEAK_REACH
    c.extra = weak.filter((w) => !used.has(w) && w.bbox.x0 <= c.x1 + gap && w.bbox.x1 >= c.x0 - gap && w.bbox.y0 >= top && w.bbox.y1 <= bottom)
    c.extra.forEach((w) => used.add(w))
  }
  return cols
    .sort((a, b) => a.x0 - b.x0)
    .map((c) => {
      const all = [...c.words, ...c.extra]
      const half = Math.max(...all.map((w) => w.bbox.y1 - w.bbox.y0)) / 2
      return all
        .sort((a, b) => (Math.abs(a.bbox.y0 - b.bbox.y0) < half ? a.bbox.x0 - b.bbox.x0 : a.bbox.y0 - b.bbox.y0))
        .map((w) => w.text)
        .join(' ')
    })
}

// candidates: [{ slug, names: [en, ru] }]
function matchReward(text, candidates) {
  if (!normalizeName(text)) return null
  let best = null
  for (const c of candidates) {
    for (const name of c.names) {
      if (!name) continue
      const score = similarity(text, name)
      if (!best || score > best.score) best = { slug: c.slug, name: c.names[0], score }
    }
  }
  return best && best.score >= MATCH_THRESHOLD ? best : null
}

module.exports = { gameLanguageFromLog, normalizeName, similarity, groupColumns, matchReward }

'use strict'

const OVERFRAME = 'https://overframe.gg'
const API = `${OVERFRAME}/api/v1/builds/`
const LIST_LIMIT = 10
const MAX_DESCRIPTION = 2000

// статы фрейма из сборки, остальное не показываем
const FRAME_STATS = {
  AVATAR_ABILITY_STRENGTH: 'strength',
  AVATAR_ABILITY_DURATION: 'duration',
  AVATAR_ABILITY_RANGE: 'range',
  AVATAR_ABILITY_EFFICIENCY: 'efficiency',
  AVATAR_HEALTH_MAX: 'health',
  AVATAR_SHIELD_MAX: 'shield',
  AVATAR_ARMOUR: 'armor',
  AVATAR_POWER_MAX: 'energy',
}

const isBuildId = (id) => Number.isInteger(id) && id > 0

function listUrl(itemName) {
  if (typeof itemName !== 'string' || !itemName.trim() || itemName.length > 80) throw new Error('Пустое имя предмета')
  return `${API}?item_name=${encodeURIComponent(itemName.trim())}&ordering=-score&limit=${LIST_LIMIT}`
}

function detailUrl(id) {
  if (!isBuildId(id)) throw new Error('Неверный id сборки')
  return `${API}${id}/`
}

const fullUrl = (path) => (typeof path === 'string' && path.startsWith('/') ? OVERFRAME + path : OVERFRAME)

function slimBuildList(json) {
  const rows = json && Array.isArray(json.results) ? json.results : []
  return rows
    .filter((b) => b && isBuildId(b.id) && typeof b.title === 'string')
    .map((b) => ({
      id: b.id,
      title: b.title.trim(),
      score: Number(b.score) || 0,
      formas: Number(b.formas) || 0,
      author: b.author && typeof b.author.username === 'string' ? b.author.username : null,
      updated: typeof b.updated === 'string' ? b.updated.slice(0, 10) : null,
      url: fullUrl(b.url),
    }))
}

// markdown из описания в простой текст
function plainText(md) {
  if (typeof md !== 'string') return ''
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_DESCRIPTION)
}

function slimBuild(json) {
  if (!json || !isBuildId(json.id)) throw new Error('Пустой ответ Overframe')
  const stats = {}
  for (const [key, name] of Object.entries(FRAME_STATS)) {
    const v = json.stats && json.stats[key]
    if (typeof v === 'number' && Number.isFinite(v)) stats[name] = v
  }
  return {
    id: json.id,
    description: plainText(json.description),
    platinum: Number(json.platinum_cost) || 0,
    endo: Number(json.endo_cost) || 0,
    masteryRank: Number(json.mastery_rank) || 0,
    stats,
    totalDamage: typeof json.total_damage === 'number' ? json.total_damage : null,
    url: fullUrl(json.url),
  }
}

module.exports = { listUrl, detailUrl, slimBuildList, slimBuild, plainText }

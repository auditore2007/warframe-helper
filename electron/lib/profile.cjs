'use strict'

const ACCOUNT_ID_RE = /^[0-9a-f]{24}$/
const LOGIN_RE = /Logged in (.+?) \(([0-9a-f]{24})\)/g
const ACCOUNT_FIELD_RE = /AccountId"\s*:\s*"([0-9a-f]{24})"/g
// с конца 2026 в логе только ник, без id
const NAME_ONLY_RE = /Logged in ([^\s(]+)\s*$/gm

const PROFILE_HOSTS = {
  pc: 'https://content.warframe.com',
  ps4: 'https://content-ps4.warframe.com',
  xb1: 'https://content-xb1.warframe.com',
  swi: 'https://content-swi.warframe.com',
}

function isAccountId(value) {
  return typeof value === 'string' && ACCOUNT_ID_RE.test(value)
}

// последний аккаунт из EE.log, accountId = null если там только ник
function extractAccountFromLog(text) {
  if (typeof text !== 'string' || text.length === 0) return null
  let found = null
  for (const m of text.matchAll(LOGIN_RE)) {
    found = { accountId: m[2], displayName: m[1].trim(), index: m.index }
  }
  for (const m of text.matchAll(ACCOUNT_FIELD_RE)) {
    if (!found || m.index > found.index) found = { accountId: m[1], displayName: null, index: m.index }
  }
  for (const m of text.matchAll(NAME_ONLY_RE)) {
    if (!found || m.index > found.index) found = { accountId: null, displayName: m[1], index: m.index }
  }
  if (!found) return null
  return { accountId: found.accountId, displayName: found.displayName }
}

function profileUrls(accountId, platform = 'pc') {
  if (!isAccountId(accountId)) throw new Error('Неверный ID аккаунта')
  const host = PROFILE_HOSTS[platform] || PROFILE_HOSTS.pc
  return [
    `https://api.warframe.com/cdn/getProfileViewingData.php?playerId=${accountId}`,
    `${host}/dynamic/getProfileViewingData.php?playerId=${accountId}`,
  ]
}

function findKey(node, key, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 6) return undefined
  if (Object.prototype.hasOwnProperty.call(node, key)) return node[key]
  for (const value of Object.values(node)) {
    const hit = findKey(value, key, depth + 1)
    if (hit !== undefined) return hit
  }
  return undefined
}

// разбираем профиль
function parseProfile(json) {
  const root = json && Array.isArray(json.Results) ? json.Results[0] : json
  if (!root || typeof root !== 'object') throw new Error('Пустой ответ профиля')
  const xpInfo = findKey(root, 'XPInfo')
  const items = Array.isArray(xpInfo)
    ? xpInfo
        .filter((x) => x && typeof x.ItemType === 'string')
        .map((x) => ({ uniqueName: x.ItemType, xp: Number(x.XP) || 0 }))
    : []
  const level = findKey(root, 'PlayerLevel')
  const name = findKey(root, 'DisplayName')
  return {
    displayName: typeof name === 'string' ? name : null,
    masteryRank: Number.isFinite(Number(level)) ? Number(level) : null,
    items,
    syndicates: parseSyndicates(root.Affiliations),
    dailyStanding: parseDailyStanding(root),
  }
}

// Standing общий за все ранги, Title - текущий ранг
function parseSyndicates(list) {
  if (!Array.isArray(list)) return []
  return list
    .filter((a) => a && typeof a.Tag === 'string' && Number.isFinite(a.Standing) && Number.isFinite(a.Title))
    .map((a) => ({ tag: a.Tag, standing: a.Standing, rank: a.Title }))
}

// DailyAffiliationCetus: 27000 -> { Cetus: 27000 }
function parseDailyStanding(root) {
  const out = {}
  for (const [key, value] of Object.entries(root)) {
    const m = /^DailyAffiliation([A-Za-z]*)$/.exec(key)
    if (m && Number.isFinite(value)) out[m[1]] = value
  }
  return out
}

module.exports = { isAccountId, extractAccountFromLog, profileUrls, parseProfile }

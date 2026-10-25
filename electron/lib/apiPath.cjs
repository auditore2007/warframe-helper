'use strict'

const API_BASE = 'https://api.warframestat.us'
const ALLOWED_PREFIXES = ['/pc', '/warframes', '/weapons', '/mods', '/items', '/drops', '/sentinels', '/arcanes']
const SAFE_RE = /^\/[A-Za-z0-9/_\-%.?=&,+ ]{0,300}$/

function isAllowedApiPath(path) {
  if (typeof path !== 'string' || !SAFE_RE.test(path) || path.includes('..')) return false
  return ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p + '/') || path.startsWith(p + '?'))
}

function cacheFileName(path) {
  return path.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 120) + '.json'
}

const IMAGE_NAME_RE = /^[A-Za-z0-9._\- ]{1,120}\.(png|jpg|jpeg|webp)$/i

// имя картинки приходит из api, не пускаем выйти из папки
function isSafeImageName(name) {
  return typeof name === 'string' && IMAGE_NAME_RE.test(name) && !name.includes('..')
}

module.exports = { API_BASE, isAllowedApiPath, cacheFileName, isSafeImageName }

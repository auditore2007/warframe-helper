// @vitest-environment node
import { describe, it, expect } from 'vitest'
import profile from './profile.cjs'
import apiPath from './apiPath.cjs'
const { extractAccountFromLog, parseProfile, profileUrls, isAccountId, accountIdFromUserData } = profile
const { isAllowedApiPath, cacheFileName } = apiPath

const A = 'aaaaaaaaaaaaaaaaaaaaaaaa'
const B = 'bbbbbbbbbbbbbbbbbbbbbbbb'

describe('extractAccountFromLog', () => {
  it('returns null for empty or unrelated text', () => {
    expect(extractAccountFromLog('')).toBeNull()
    expect(extractAccountFromLog('nothing here')).toBeNull()
    expect(extractAccountFromLog(undefined)).toBeNull()
  })
  it('reads the login line with display name', () => {
    expect(extractAccountFromLog(`x Logged in Tenno123 (${A}) y`)).toEqual({ accountId: A, displayName: 'Tenno123' })
  })
  it('returns the name without id for the current log format', () => {
    expect(extractAccountFromLog('14.227 Sys [Info]: Logged in Tenno123\n15.8 next')).toEqual({ accountId: null, displayName: 'Tenno123' })
  })
  it('prefers the latest occurrence in the log', () => {
    const log = `Logged in Old (${A})\n... {"AccountId":"${B}","x":1}`
    expect(extractAccountFromLog(log)).toEqual({ accountId: B, displayName: null })
  })
})

describe('profileUrls', () => {
  it('builds platform urls and rejects bad ids', () => {
    expect(profileUrls(A)[0]).toBe(`https://api.warframe.com/cdn/getProfileViewingData.php?playerId=${A}`)
    expect(profileUrls(A, 'ps4')[1]).toContain('content-ps4')
    expect(() => profileUrls('nope')).toThrow()
    expect(isAccountId(A)).toBe(true)
  })
})

describe('parseProfile', () => {
  it('extracts mastery rank, name and xp items', () => {
    const json = { Results: [{ DisplayName: 'Tenno', PlayerLevel: 18, LoadOutInventory: { XPInfo: [{ ItemType: '/Lotus/X', XP: 900000 }, { bad: 1 }] } }] }
    expect(parseProfile(json)).toEqual({ displayName: 'Tenno', masteryRank: 18, items: [{ uniqueName: '/Lotus/X', xp: 900000 }], syndicates: [], dailyStanding: {} })
  })
  it('extracts syndicate standing and what is left of the daily cap', () => {
    const json = {
      Results: [{
        Affiliations: [{ Tag: 'CetusSyndicate', Standing: 318233, Title: 5 }, { Tag: 'PerrinSyndicate', Standing: -71000, Title: -2 }, { Tag: 7 }],
        DailyAffiliation: 0,
        DailyAffiliationCetus: 27000,
        DailyAffiliationBogus: 'x',
      }],
    }
    const p = parseProfile(json)
    expect(p.syndicates).toEqual([{ tag: 'CetusSyndicate', standing: 318233, rank: 5 }, { tag: 'PerrinSyndicate', standing: -71000, rank: -2 }])
    expect(p.dailyStanding).toEqual({ '': 0, Cetus: 27000 })
  })
  it('tolerates missing fields and throws on empty', () => {
    expect(parseProfile({ Results: [{}] })).toEqual({ displayName: null, masteryRank: null, items: [], syndicates: [], dailyStanding: {} })
    expect(() => parseProfile(null)).toThrow()
  })
})

describe('api path guard', () => {
  it('allows known endpoints only', () => {
    expect(isAllowedApiPath('/pc/?language=ru')).toBe(true)
    expect(isAllowedApiPath('/drops/search/neurodes')).toBe(true)
    expect(isAllowedApiPath('/../etc')).toBe(false)
    expect(isAllowedApiPath('https://evil.com')).toBe(false)
    expect(isAllowedApiPath('/admin')).toBe(false)
    expect(isAllowedApiPath(5)).toBe(false)
  })
  it('accepts only plain image file names', () => {
    expect(apiPath.isSafeImageName('SarynPrime.png')).toBe(true)
    expect(apiPath.isSafeImageName('kuva-bramma 2.jpg')).toBe(true)
    expect(apiPath.isSafeImageName('../secret.png')).toBe(false)
    expect(apiPath.isSafeImageName('a/b.png')).toBe(false)
    expect(apiPath.isSafeImageName('x.exe')).toBe(false)
    expect(apiPath.isSafeImageName(null)).toBe(false)
  })
  it('makes safe cache file names', () => {
    expect(cacheFileName('/warframes/?language=ru')).toBe('warframes_language_ru.json')
  })
})

describe('accountIdFromUserData', () => {
  it('reads user_id from the warframe.com user-data json', () => {
    expect(accountIdFromUserData(JSON.stringify({ user_id: A, email: 'x@y.z', other: B }))).toBe(A)
    expect(accountIdFromUserData(JSON.stringify({ data: { accountId: B } }))).toBe(B)
  })
  it('finds user_id in pasted text and ignores other ids', () => {
    expect(accountIdFromUserData(`garbage {"foo":"${B}","user_id":"${A}"} tail`)).toBe(A)
    expect(accountIdFromUserData(`  ${A.toUpperCase()}  `)).toBe(A)
  })
  it('returns null when there is no id', () => {
    expect(accountIdFromUserData('')).toBeNull()
    expect(accountIdFromUserData('{"user_id":null}')).toBeNull()
    expect(accountIdFromUserData(`{"x":"${A}","y":"${B}"}`)).toBeNull()
  })
})

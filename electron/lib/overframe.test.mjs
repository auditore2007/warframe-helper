// @vitest-environment node
import { describe, it, expect } from 'vitest'
import overframe from './overframe.cjs'

const { listUrl, detailUrl, slimBuildList, slimBuild, plainText } = overframe

describe('overframe', () => {
  it('builds safe urls', () => {
    expect(listUrl('Saryn Prime')).toBe('https://overframe.gg/api/v1/builds/?item_name=Saryn%20Prime&ordering=-score&limit=10')
    expect(() => listUrl('')).toThrow()
    expect(detailUrl(374539)).toBe('https://overframe.gg/api/v1/builds/374539/')
    expect(() => detailUrl('1/../x')).toThrow()
  })
  it('slims the build list', () => {
    const json = { results: [
      { id: 5, title: ' Spores ', score: 2960, formas: 4, author: { username: 'nin' }, updated: '2026-08-21T01:00:00Z', url: '/build/5/saryn/x/' },
      { id: 'bad', title: 'x' },
    ] }
    expect(slimBuildList(json)).toEqual([{ id: 5, title: 'Spores', score: 2960, formas: 4, author: 'nin', updated: '2026-08-21', url: 'https://overframe.gg/build/5/saryn/x/' }])
    expect(slimBuildList(null)).toEqual([])
  })
  it('keeps only frame stats from a build and cleans markdown', () => {
    const b = slimBuild({ id: 5, description: '**Strong** [link](http://x) build\n\n\n\nok', platinum_cost: 244, endo_cost: 1000, mastery_rank: 0,
      stats: { AVATAR_ABILITY_STRENGTH: 2.4, AVATAR_ARMOUR: 135, WEAPON_CLIP_MAX: null }, url: '/build/5/' })
    expect(b.stats).toEqual({ strength: 2.4, armor: 135 })
    expect(b.description).toBe('Strong link build\n\nok')
    expect(b.platinum).toBe(244)
    expect(() => slimBuild({})).toThrow()
    expect(plainText(null)).toBe('')
  })
})

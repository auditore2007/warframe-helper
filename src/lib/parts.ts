import type { Component } from './types'

const PART_PATH_RE = /\/(Recipes|Weapons|Powersuits)\//
const PART_NAME_RE = /(Blueprint|Chassis|Neuroptics|Systems|Barrel|Receiver|Stock|Blade|Blades|Handle|Hilt|Guard|Link|Capsule|Casing|Engine|Weapon Pod|Aspect|Harness|Wings)$/

// части (чертежи, стволы и т.д.) отмечаем по одной, ресурсы (сплавы, ячейки) нет
export function isResourceComponent(component: Pick<Component, 'name' | 'uniqueName'>): boolean {
  if (component.uniqueName && PART_PATH_RE.test(component.uniqueName)) return false
  if (PART_NAME_RE.test(component.name)) return false
  return true
}

import type { ModEffect } from '../lib/damage'

export type WeaponClass = 'rifle' | 'shotgun' | 'pistol' | 'melee'

export interface CalcMod extends ModEffect {
  /** англ. название, по нему ищем русское в каталоге модов */
  name: string
  /** моды из одной группы вместе не ставятся (обычная и прайм версия) */
  group?: string
}

const el = (element: ModEffect['element'], elementValue: number, status = 0): ModEffect => ({ element, elementValue, ...(status ? { status } : {}) })

export const CALC_MODS: Record<WeaponClass, CalcMod[]> = {
  rifle: [
    { name: 'Serration', damage: 1.65 },
    { name: 'Heavy Caliber', damage: 1.65 },
    { name: 'Split Chamber', multishot: 0.9 },
    { name: 'Vigilante Armaments', multishot: 0.6 },
    { name: 'Point Strike', critChance: 1.5 },
    { name: 'Critical Delay', critChance: 2, fireRate: -0.2 },
    { name: 'Vital Sense', critDamage: 1.2 },
    { name: 'Speed Trigger', fireRate: 0.6 },
    { name: 'Shred', fireRate: 0.3 },
    { name: 'Rifle Aptitude', status: 0.9 },
    { name: 'Hellfire', ...el('heat', 0.9) },
    { name: 'Cryo Rounds', ...el('cold', 0.9), group: 'cryo' },
    { name: 'Primed Cryo Rounds', ...el('cold', 1.65), group: 'cryo' },
    { name: 'Stormbringer', ...el('electricity', 0.9) },
    { name: 'Infected Clip', ...el('toxin', 0.9) },
    { name: 'Thermite Rounds', ...el('heat', 0.6, 0.6) },
    { name: 'Rime Rounds', ...el('cold', 0.6, 0.6) },
    { name: 'High Voltage', ...el('electricity', 0.6, 0.6) },
    { name: 'Malignant Force', ...el('toxin', 0.6, 0.6) },
  ],
  shotgun: [
    { name: 'Point Blank', damage: 0.9, group: 'pb' },
    { name: 'Primed Point Blank', damage: 1.65, group: 'pb' },
    { name: "Hell's Chamber", multishot: 1.2 },
    { name: 'Critical Deceleration', critChance: 2, fireRate: -0.2 },
    { name: 'Ravage', critDamage: 0.6, group: 'ravage' },
    { name: 'Primed Ravage', critDamage: 1.1, group: 'ravage' },
    { name: 'Blaze', damage: 0.6, ...el('heat', 0.6) },
    { name: 'Incendiary Coat', ...el('heat', 0.9) },
    { name: 'Chilling Grasp', ...el('cold', 0.9) },
    { name: 'Charged Shell', ...el('electricity', 0.9) },
    { name: 'Contagious Spread', ...el('toxin', 0.9) },
    { name: 'Scattering Inferno', ...el('heat', 0.6, 0.6) },
    { name: 'Frigid Blast', ...el('cold', 0.6, 0.6) },
    { name: 'Shell Shock', ...el('electricity', 0.6, 0.6) },
    { name: 'Toxic Barrage', ...el('toxin', 0.6, 0.6) },
  ],
  pistol: [
    { name: 'Hornet Strike', damage: 2.2 },
    { name: 'Barrel Diffusion', multishot: 1.2 },
    { name: 'Lethal Torrent', multishot: 0.6, fireRate: 0.6 },
    { name: 'Pistol Gambit', critChance: 1.2, group: 'gambit' },
    { name: 'Primed Pistol Gambit', critChance: 1.87, group: 'gambit' },
    { name: 'Creeping Bullseye', critChance: 2, fireRate: -0.2 },
    { name: 'Target Cracker', critDamage: 0.6, group: 'cracker' },
    { name: 'Primed Target Cracker', critDamage: 1.1, group: 'cracker' },
    { name: 'Heated Charge', ...el('heat', 0.9), group: 'heated' },
    { name: 'Primed Heated Charge', ...el('heat', 1.65), group: 'heated' },
    { name: 'Deep Freeze', ...el('cold', 0.9) },
    { name: 'Convulsion', ...el('electricity', 0.9) },
    { name: 'Pathogen Rounds', ...el('toxin', 0.9) },
    { name: 'Scorch', ...el('heat', 0.6, 0.6) },
    { name: 'Frostbite', ...el('cold', 0.6, 0.6) },
    { name: 'Jolt', ...el('electricity', 0.6, 0.6) },
    { name: 'Pistol Pestilence', ...el('toxin', 0.6, 0.6) },
  ],
  // условные моды (Blood Rush, Condition Overload, Weeping Wounds) не считаем: зависят от комбо и статусов
  melee: [
    { name: 'Pressure Point', damage: 1.2, group: 'pp' },
    { name: 'Primed Pressure Point', damage: 1.65, group: 'pp' },
    { name: 'Spoiled Strike', damage: 1, fireRate: -0.2 },
    { name: 'Organ Shatter', critDamage: 0.9 },
    { name: 'True Steel', critChance: 0.6 },
    { name: 'Fury', fireRate: 0.3, group: 'fury' },
    { name: 'Primed Fury', fireRate: 0.55, group: 'fury' },
    { name: 'Molten Impact', ...el('heat', 0.9) },
    { name: 'North Wind', ...el('cold', 0.9) },
    { name: 'Shocking Touch', ...el('electricity', 0.9) },
    { name: 'Fever Strike', ...el('toxin', 0.9) },
    { name: 'Volcanic Edge', ...el('heat', 0.6, 0.6) },
    { name: 'Vicious Frost', ...el('cold', 0.6, 0.6) },
    { name: 'Voltaic Strike', ...el('electricity', 0.6, 0.6) },
    { name: 'Virulent Scourge', ...el('toxin', 0.6, 0.6) },
  ],
}

export const MAX_MOD_SLOTS = 8

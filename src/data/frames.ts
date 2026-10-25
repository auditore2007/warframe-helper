export type Role = 'nuke' | 'tank' | 'support' | 'cc' | 'stealth' | 'loot' | 'speed' | 'boss' | 'afk'
export type Tier = 'S' | 'A' | 'B' | 'C'

export const ROLE_LABEL: Record<Role, string> = {
  nuke: 'Массовый урон',
  tank: 'Живучесть',
  support: 'Поддержка',
  cc: 'Контроль',
  stealth: 'Невидимость',
  loot: 'Фарм лута',
  speed: 'Скорость',
  boss: 'Одиночные цели',
  afk: 'Оборона / AFK',
}

export const ROLE_HINT: Record<Role, string> = {
  nuke: 'Выносит толпы врагов способностями - выживание, зачистка, Стальной путь',
  tank: 'Почти не умирает, норм для новичка',
  support: 'Лечит, баффает и даёт энергию команде',
  cc: 'Обездвиживает и обезоруживает врагов',
  stealth: 'Проходит шпионаж и спасение незамеченным',
  loot: 'Увеличивает количество выпадающих ресурсов',
  speed: 'Быстро пробегает миссии, капчуры, саботаж',
  boss: 'Сносит боссов, Эйдолонов, Архонтов',
  afk: 'Держит точку на обороне, перехвате и выживании',
}

export const TIER_HINT: Record<Tier, string> = {
  S: 'Тянет любой контент, включая Стальной путь',
  A: 'Очень силён в своей роли',
  B: 'Хорош при правильной сборке',
  C: 'Нишевый или сложный в освоении',
}

export interface FrameGuide {
  // англ. имя как на вики: Saryn
  key: string
  roles: Role[]
  tier: Tier
  summary: string
  howToGet?: string
  tips: string[]
  helminth?: string
  beginner?: boolean
}

export const FRAME_GUIDES: FrameGuide[] = [
  {
    key: 'Excalibur', roles: ['nuke', 'cc'], tier: 'B', beginner: true,
    summary: 'Стартовый мечник: ослепление и Exalted Blade, который режет толпы волнами энергии.',
    howToGet: 'Стартовый выбор. Части выпадают с Лейтенанта Лех Крила (War, Марс), чертёж продаётся в Маркете за кредиты.',
    tips: ['Radial Javelin + Radial Blind закрывают ранние миссии без оружия', 'Exalted Blade масштабируется от модов на ближний бой - ставь Primed Pressure Point и Condition Overload'],
  },
  {
    key: 'Mag', roles: ['nuke', 'cc'], tier: 'B', beginner: true,
    summary: 'Магнетизм: стягивает врагов и снимает щиты Корпуса.',
    howToGet: 'Стартовый выбор. Части выпадают с Сержанта (Iliad, Фобос).',
    tips: ['Polarize сносит щиты и броню, хорошо заходит против Корпуса', 'Magnetize копит урон и взрывается: стреляй в пузырь'],
  },
  {
    key: 'Volt', roles: ['speed', 'nuke', 'boss'], tier: 'A', beginner: true,
    summary: 'Электрический скороход. Speed ускоряет команду, Electric Shield удваивает урон проходящих сквозь него пуль.',
    howToGet: 'Стартовый выбор. Чертёж и части продаются в Маркете за кредиты.',
    tips: ['Electric Shield + снайперская винтовка - классика охоты на Эйдолонов', 'Пассивка копит электрический урон от бега - первый выстрел после спринта сильнее'],
  },
  {
    key: 'Rhino', roles: ['tank', 'support', 'cc'], tier: 'A', beginner: true,
    summary: 'Лучший первый фарм для новичка: Iron Skin делает почти бессмертным, Roar усиливает урон всей команды.',
    howToGet: 'Босс Шакал (Fossa, Венера) - доступен в первые часы игры.',
    tips: ['Ставь моды на силу (Intensify, Blind Rage) - Roar и Iron Skin от неё растут', 'Roar часто подселяют через Гельминта другим фреймам'],
    helminth: 'Roar - один из лучших баффов урона для подселения',
  },
  {
    key: 'Loki', roles: ['stealth', 'cc', 'speed'], tier: 'B',
    summary: 'Невидимка и обманщик. Radial Disarm обезоруживает всех вокруг.',
    howToGet: 'Стая Гиен (Psamathe, Нептун).',
    tips: ['Идеален для шпионажа и спасения', 'Switch Teleport спасает застрявших союзников и выводит из окружения'],
  },
  {
    key: 'Frost', roles: ['afk', 'cc', 'tank'], tier: 'B',
    summary: 'Ледяной защитник. Snow Globe держит объект обороны и замедляет врагов.',
    howToGet: 'Лейтенант Лех Крил и Капитан Вор (Exta, Церера).',
    tips: ['Snow Globe поглощает урон и набирает броню - идеален для мобильной обороны', 'Avalanche снимает броню врагам'],
  },
  {
    key: 'Ember', roles: ['nuke'], tier: 'B',
    summary: 'Огненный зачистник низкоуровневого контента, с переделки снимает броню огнём.',
    howToGet: 'Генерал Саргас Рук (Tethys, Сатурн).',
    tips: ['Fire Blast снимает броню - комбинируй с Inferno', 'Хороша для быстрого фарма ресурсов на планетах до Сатурна'],
  },
  {
    key: 'Saryn', roles: ['nuke', 'loot'], tier: 'S',
    summary: 'Королева зачистки. Споры распространяются по всей карте и разъедают толпы даже на Стальном пути.',
    howToGet: 'Кела Де Тайм (Merrow, Седна).',
    tips: ['Molt + Spores + Miasma - базовая ротация', 'Toxic Lash + быстрое оружие распространяют споры', 'Отличный фрейм для фарма опыта и ресурсов на выживании'],
  },
  {
    key: 'Nekros', roles: ['loot', 'tank'], tier: 'A',
    summary: 'Главный фармер: Desecrate даёт повторный шанс дропа с трупов.',
    howToGet: 'Лефантис (Orokin Derelict, убийство), также Magnacidium (Деймос).',
    tips: ['Ставь Desecrate в режим автопоиска и держи энергию - Arcane Energize', 'Shield of Shadows делает его очень живучим'],
  },
  {
    key: 'Trinity', roles: ['support'], tier: 'B',
    summary: 'Классический саппорт: энергия команде и снижение урона через Blessing.',
    howToGet: 'Амбулас (Hades, Плутон).',
    tips: ['Energy Vampire решает проблемы с энергией у всей группы'],
  },
  {
    key: 'Nova', roles: ['speed', 'nuke', 'cc'], tier: 'A',
    summary: 'Molecular Prime ускоряет или замедляет врагов и удваивает получаемый ими урон.',
    howToGet: 'Рапторы (Naamah, Европа).',
    tips: ['Отрицательная сила (Overextended) - враги быстрее идут к смерти на обороне', 'Worm Hole ускоряет команду в speedrun-миссиях'],
  },
  {
    key: 'Valkyr', roles: ['tank', 'nuke'], tier: 'B',
    summary: 'Берсерк с когтями Hysteria - неуязвима, пока в ярости.',
    howToGet: 'Алад V (Themisto, Юпитер).',
    tips: ['Hysteria пользуется модами ближнего боя', 'Warcry ускоряет атаки и даёт броню команде'],
    helminth: 'Warcry полезен на фреймах ближнего боя',
  },
  {
    key: 'Hydroid', roles: ['loot', 'cc'], tier: 'B',
    summary: 'Pilfering Swarm щупалец добавляет дополнительный дроп с убитых.',
    howToGet: 'Советник Вэй Хек (Oro, Земля).',
    tips: ['Аугмент Pilfering Swarm обязателен для фарма', 'Хорош в связке с Nekros на выживании'],
  },
  {
    key: 'Mesa', roles: ['boss', 'nuke'], tier: 'A',
    summary: 'Peacemaker автоматически наводится и стреляет во всё вокруг.',
    howToGet: 'Мутировавший Алад V (убийство, Эрида).',
    tips: ['Shatter Shield отражает большую часть пуль', 'Отлично справляется с Стальным путём при модах на пистолеты'],
  },
  {
    key: 'Atlas', roles: ['tank', 'cc'], tier: 'B',
    summary: 'Каменный кулачный боец: Petrify и Rubble дают броню.',
    howToGet: 'Голем Джордас (Jordas Verdict, Эрида) - через Симариса.',
    tips: ['Rubble от окаменевших врагов складывает броню'],
  },
  {
    key: 'Ash', roles: ['stealth', 'boss'], tier: 'B',
    summary: 'Ниндзя с Blade Storm - серийные финишеры по меткам.',
    howToGet: 'Награды за задания на Плутоне и Маньяки Гринир.',
    tips: ['Blade Storm использует моды оружия ближнего боя'],
  },
  {
    key: 'Banshee', roles: ['support', 'cc', 'stealth'], tier: 'B',
    summary: 'Sonar показывает слабые места и многократно усиливает урон по ним.',
    howToGet: 'Исследование в лаборатории Тэнно клана (додзё).',
    tips: ['Silence + Sound Quake для контроля толпы', 'Sonar особенно силён против боссов'],
  },
  {
    key: 'Nyx', roles: ['cc', 'tank'], tier: 'B',
    summary: 'Ментальный контроль: Chaos заставляет врагов драться друг с другом.',
    howToGet: 'Форид (заражённые вторжения).',
    tips: ['Absorb копит урон и выпускает взрывом'],
  },
  {
    key: 'Oberon', roles: ['support', 'tank'], tier: 'B',
    summary: 'Паладин: лечение, броня и Smite.',
    howToGet: 'Задания на Сатурне и Эксимусы.',
    tips: ['Iron Renewal + Hallowed Ground - хороший командный саппорт'],
  },
  {
    key: 'Limbo', roles: ['cc', 'afk'], tier: 'C',
    summary: 'Повелитель Разлома. Очень силён в обороне, но легко мешает команде.',
    howToGet: 'Квест «Теорема Лимбо» (Симарис).',
    tips: ['Cataclysm + Stasis держит любую оборону, но предупреждай группу'],
  },
  {
    key: 'Inaros', roles: ['tank'], tier: 'A', beginner: true,
    summary: 'Огромный запас здоровья и самолечение. Почти не умирает без всякой сборки.',
    howToGet: 'Квест «Пески Инароса» (ключ продаёт Баро Ки\'Тиир).',
    tips: ['Ставь моды на здоровье и броню - Vitality, Steel Fiber, Umbral Vitality'],
  },
  {
    key: 'Mirage', roles: ['nuke', 'boss'], tier: 'B',
    summary: 'Hall of Mirrors умножает урон твоего оружия клонами.',
    howToGet: 'Квест «Скрытые послания».',
    tips: ['Eclipse даёт огромный бонус урона на свету'],
  },
  {
    key: 'Chroma', roles: ['boss', 'tank'], tier: 'A',
    summary: 'Vex Armor копит броню и урон от входящего урона.',
    howToGet: 'Квест «Новая странность» (Симарис).',
    tips: ['Огненный вариант Vex Armor - один из лучших баффов урона', 'Популярен для Эйдолонов'],
  },
  {
    key: 'Equinox', roles: ['nuke', 'afk'], tier: 'A',
    summary: 'Maim копит урон и выпускает в бурю. Лучший фрейм для пассивной прокачки опыта.',
    howToGet: 'Тил Регор (Titania, Уран).',
    tips: ['Mend/Maim + Pacify/Provoke делают её универсальной'],
  },
  {
    key: 'Ivara', roles: ['stealth', 'loot'], tier: 'A',
    summary: 'Prowl ворует дроп с врагов без убийства - лучший способ фармить редкие моды и ресурсы.',
    howToGet: 'Шпионаж: ротация C на Церере, Европе, Юпитере, Сатурне.',
    tips: ['Navigator управляет стрелой Artemis Bow', 'Quiver Sleep Arrow усыпляет группы врагов'],
  },
  {
    key: 'Nezha', roles: ['tank', 'cc'], tier: 'B',
    summary: 'Warding Halo - щит, который поглощает урон.',
    howToGet: 'Исследование в лаборатории Тэнно (додзё).',
    tips: ['Fire Walker + аугмент даёт быстрое лечение команды'],
  },
  {
    key: 'Octavia', roles: ['afk', 'nuke', 'stealth'], tier: 'A',
    summary: 'Mallet притягивает огонь врагов и бьёт им же; Metronome даёт невидимость.',
    howToGet: 'Квест «Гимн Октавии».',
    tips: ['Ключевой фрейм для AFK-обороны и Стального пути'],
  },
  {
    key: 'Titania', roles: ['cc', 'speed'], tier: 'B',
    summary: 'Фея с Razorwing - летает и косит врагов Dex Pixia.',
    howToGet: 'Квест «Серебряная роща».',
    tips: ['Razorwing - быстро летать по открытым мирам'],
  },
  {
    key: 'Wukong', roles: ['tank', 'boss'], tier: 'A', beginner: true,
    summary: 'Celestial Twin дублирует урон, Defy даёт неуязвимость.',
    howToGet: 'Исследование в лаборатории Тэнно (додзё).',
    tips: ['Primal Fury сильна с модами ближнего боя'],
  },
  {
    key: 'Zephyr', roles: ['speed', 'tank'], tier: 'B',
    summary: 'Воздушный фрейм с Turbulence - пули отклоняются.',
    howToGet: 'Исследование в лаборатории Тэнно (додзё).',
    tips: ['Tornado + Airburst держат врагов в воздухе'],
  },
  {
    key: 'Harrow', roles: ['support'], tier: 'B',
    summary: 'Энергия и крит для команды через Thurible.',
    howToGet: 'Квест «Цепи Харроу» + разломы Бездны.',
    tips: ['Covenant даёт огромный крит по головам'],
  },
  {
    key: 'Nidus', roles: ['tank', 'nuke'], tier: 'A',
    summary: 'Заражённый фрейм, растущий в стаки. Почти бессмертен и стягивает врагов.',
    howToGet: 'Квест «Гамбит Гласта» + Утилизация (Oestrus, Эрида).',
    tips: ['Ларва стягивает врагов, Virulence их добивает'],
  },
  {
    key: 'Khora', roles: ['loot', 'cc'], tier: 'A',
    summary: 'Strangledome удерживает врагов, а Венари даёт лут.',
    howToGet: 'Натиск Святилища (Sanctuary Onslaught).',
    tips: ['Аугмент Pilfering Strangledome для фарма'],
  },
  {
    key: 'Gara', roles: ['tank', 'cc'], tier: 'B',
    summary: 'Стеклянный фрейм с Splinter Storm - снижение урона на команду.',
    howToGet: 'Задания Цетуса (Равнины Эйдолона).',
    tips: ['Splinter Storm снижает урон по тебе и союзникам - держи его всегда', 'Mass Vitrify создаёт стеклянное кольцо для обороны точки'],
  },
  {
    key: 'Revenant', roles: ['tank', 'cc', 'nuke'], tier: 'A',
    summary: 'Mesmer Skin поглощает удары, Reave крадёт жизнь.',
    howToGet: 'Квест «Маска Ревенанта» + задания Цетуса.',
    tips: ['Mesmer Skin позволяет стоять под огнём на Стальном пути'],
  },
  {
    key: 'Garuda', roles: ['nuke', 'tank'], tier: 'B',
    summary: 'Кровавая охотница: тратит здоровье на урон.',
    howToGet: 'Задания Солярис Вокс (Фортуна).',
    tips: ['Bloodletting превращает здоровье в энергию', 'Seeking Talons наносит огромный урон после зарядки'],
  },
  {
    key: 'Baruuk', roles: ['tank', 'cc'], tier: 'B',
    summary: 'Монах-усмиритель: чем меньше «сдерживания», тем больнее он бьёт.',
    howToGet: 'Синдикат Vox Solaris (Фортуна).',
    tips: ['Чем ниже шкала Сдержанности, тем сильнее Serene Storm', 'Elude делает неуязвимым к пулям, пока ты не стреляешь'],
  },
  {
    key: 'Hildryn', roles: ['tank', 'loot'], tier: 'A',
    summary: 'Тратит щиты вместо энергии, Pillage снимает щиты и броню.',
    howToGet: 'Сфера Эксплойтер (Фортуна) + Vox Solaris.',
    tips: ['Ставь моды на щиты и Redirection - щиты для неё и энергия, и защита', 'Haven даёт щиты союзникам'],
    helminth: 'Pillage - топовая ветка для снятия брони и щитов',
  },
  {
    key: 'Wisp', roles: ['support', 'speed', 'nuke'], tier: 'S',
    summary: 'Резервуары дают здоровье, скорость и оглушение. Breach Surge - разрушительный нюк.',
    howToGet: 'Ропалолист (Юпитер).',
    tips: ['Haste mote ускоряет атаки команде - почти обязателен в групповых играх'],
  },
  {
    key: 'Gauss', roles: ['speed', 'tank'], tier: 'A',
    summary: 'Скоростной фрейм: Mach Rush и батарея, которая снижает урон.',
    howToGet: 'Сбой (Kappa, Седна).',
    tips: ['Thermal Sunder переключается между огнём и холодом удержанием', 'Redline ускоряет атаки и перезарядку'],
  },
  {
    key: 'Grendel', roles: ['tank'], tier: 'B',
    summary: 'Проглатывает врагов и катится по карте.',
    howToGet: 'Миссии Европы с локаторами из магазина Арбитража.',
    tips: ['Nourish даёт энергию и вирусный урон - его часто подселяют другим', 'Pulverize превращает его в катящийся шар'],
  },
  {
    key: 'Protea', roles: ['support', 'nuke'], tier: 'A',
    summary: 'Изобретательница: Temporal Anchor и оборонительные гаджеты.',
    howToGet: 'Квест «Протокол Тупика» + Гранум Войд.',
    tips: ['Temporal Anchor откатывает время и возвращает потраченную энергию', 'Dispensary раскидывает сферы здоровья и энергии'],
  },
  {
    key: 'Xaku', roles: ['cc', 'tank'], tier: 'A',
    summary: 'Порченный фрейм Бездны: 75% уклонения и мощное обезоруживание.',
    howToGet: 'Квест «Сердце Деймоса» + задания Деймоса.',
    tips: ['The Lost меняет набор способностей - Grasp of Lohk крадёт оружие у врагов', 'Xata\'s Whisper - популярное подселение через Гельминта'],
  },
  {
    key: 'Lavos', roles: ['nuke', 'tank'], tier: 'A',
    summary: 'Алхимик без энергии - способности работают на перезарядках.',
    howToGet: 'Отец (Энтрати, Деймос) + Орфикс.',
    tips: ['Не тратит энергию: модь на сокращение перезарядки', 'Комбинируй стихии, задевая врагов несколькими способностями подряд'],
  },
  {
    key: 'Sevagoth', roles: ['nuke', 'tank'], tier: 'B',
    summary: 'Призрак с Тенью - вторая форма для ближнего боя.',
    howToGet: 'Квест «Зов Темпестарии» + Шторм Бездны.',
    tips: ['Gloom замедляет врагов и лечит - одна из лучших способностей для Гельминта', 'Exalted Shadow - отдельная форма с когтями'],
  },
  {
    key: 'Yareli', roles: ['speed', 'nuke'], tier: 'B',
    summary: 'Ездит на гидроцикле Merulina, неуязвима на нём.',
    howToGet: 'Квест «Укротитель волн».',
    tips: ['На Merulina Ярели почти неуязвима - катайся по карте и бей Riptide', 'Sea Snares удерживает и оглушает врагов'],
  },
  {
    key: 'Gyre', roles: ['nuke'], tier: 'B',
    summary: 'Электрический крит-нюкер.',
    howToGet: 'Заримань «Ноль Десять».',
    tips: ['Arcsphere наносит электрический урон, которым питается ульта', 'Ставь моды на шанс крита способностей'],
  },
  {
    key: 'Styanax', roles: ['nuke', 'tank'], tier: 'A',
    summary: 'Воин с копьями: Final Stand выкашивает толпы.',
    howToGet: 'Гарнизон Кала (Chipper).',
    tips: ['Final Stand бросает копья в весь радиус - главный нюк', 'Rally Point восполняет энергию и щиты союзникам'],
  },
  {
    key: 'Voruna', roles: ['stealth', 'boss'], tier: 'B',
    summary: 'Охотница с четырьмя волками: Lycath\'s Hunt и стелс.',
    howToGet: 'Луна: Circulus и Yuvarium.',
    tips: ['Каждый волк - своя способность; Lycath\'s Hunt даёт невидимость и сферы', 'Хороша для одиночных игр и стелса'],
  },
  {
    key: 'Citrine', roles: ['support'], tier: 'A',
    summary: 'Кристаллы усиливают статусы и защищают команду.',
    howToGet: 'Миссии Tyana Pass (Марс).',
    tips: ['Prismatic Gem накладывает огонь, холод, токсин и электричество, хорошо под Condition Overload', 'Fractured Blast поднимает шанс сфер здоровья и энергии'],
  },
  {
    key: 'Kullervo', roles: ['tank', 'boss'], tier: 'A',
    summary: 'Проклятый мечник Дувири, крит от способностей.',
    howToGet: 'Крепость Куллерво (Дувири).',
    tips: ['Wrathful Advance телепортирует к врагу и даёт крит', 'Нужны моды ближнего боя: ножи Куллерво используют их'],
  },
  {
    key: 'Dagath', roles: ['nuke'], tier: 'A',
    summary: 'Призрачный фрейм, бьёт по площади и ослабляет врагов.',
    tips: ['Wyrd Scythes автоматически ищут врагов и накладывают вирус', 'Grave Spirit спасает от смертельного удара'],
  },
  {
    key: 'Qorvex', roles: ['tank'], tier: 'A',
    summary: 'Радиационный танк.',
    howToGet: 'Лаборатории Альбрехта (Деймос).',
    tips: ['Disometric Guard защищает команду от статусов', 'Crucible Blast накладывает радиацию - враги взрываются'],
  },
  {
    key: 'Jade', roles: ['support'], tier: 'A',
    summary: 'Поддержка: лечение и усиление команды.',
    howToGet: 'Миссии Brutus (Уран) после квеста «Тени Джейд».',
    tips: ['Два слота ауры - ставь сразу две полезные ауры', 'Ophanim Eyes снимает броню и может поднимать союзников на расстоянии'],
  },
  {
    key: 'Caliban', roles: ['nuke', 'cc'], tier: 'B',
    summary: 'Сентиентский фрейм с адаптивной бронёй.',
    howToGet: 'Задания Цетуса и Орб Валлис.',
    tips: ['Lethal Progeny создаёт союзных Сентиентов', 'Sentient Wrath оглушает всех вокруг'],
  },
  {
    key: 'Dante', roles: ['support', 'nuke'], tier: 'S',
    summary: 'Библиотекарь: Pageflight, Wordwarden и сильная поддержка.',
    howToGet: 'Арматус (Деймос).',
    tips: ['Сначала прочитай Dark Verse и Light Verse, затем Final Verse - эффект зависит от порядка', 'Wordwarden даёт команде сверхзащиту'],
  },
  {
    key: 'Koumei', roles: ['support'], tier: 'B',
    summary: 'Предсказательница с жемчужинами удачи.',
    howToGet: 'Видения Сайи (Земля).',
    tips: ['Выпадение трёх шестёрок усиливает каждую способность - следи за кубиками', 'Omamori может превратить урон врагов в лечение'],
  },
  {
    key: 'Narin', roles: ['nuke', 'tank'], tier: 'A',
    summary: 'Ледяная фехтовальщица: копит лёд, восстанавливает щиты из статусов холода и танцует с мечом.',
    howToGet: 'Награды за задания Заримань (Halako Perimeter, The Greenway и др.).',
    tips: ['Naraemagi превращает статусы холода на врагах в щиты и сверхзащиту', 'Копи лёд убийствами, чтобы запустить Nurinarim', 'Оружие с холодом усиливает её пассивку'],
  },
  {
    key: 'Uriel', roles: ['nuke', 'tank'], tier: 'A',
    summary: 'Повелитель трёх демонов: огненная аура, лечение и кольцо серы, растущее с каждым попаданием.',
    howToGet: 'Части выпадают с Roathe.',
    tips: ['Remedium лечит Уриэля и воскрешает демонов', 'Заряжай Brimstone способностями демонов перед активацией', 'Урон по врагу в цепи Катенах переходит на всю цепь'],
  },
  {
    key: 'Temple', roles: ['nuke', 'support'], tier: 'A',
    summary: 'Рок-гитаристка: огненные способности, которые сильнее, если жать их в ритм метронома.',
    howToGet: 'Höllvania, Solstice Square.',
    tips: ['Попадай в ритм - способности становятся дешевле и сильнее', 'Overdrive в ритм удваивает шанс крита', 'Ripper\'s Wail даёт кратковременную неуязвимость и лечит'],
  },
  {
    key: 'Cyte-09', roles: ['boss', 'stealth'], tier: 'A',
    summary: 'Снайпер: подсвечивает слабые места, раздаёт стихийные патроны и стреляет из личной винтовки.',
    howToGet: 'Höllvania.',
    tips: ['Стреляй по слабым местам - пассивка копит шанс крита до конца миссии', 'Seek делает врагов видимыми сквозь стены', 'Evade даёт невидимость и лечит за убийства в слабые места'],
  },
  {
    key: 'Oraxia', roles: ['stealth', 'cc'], tier: 'B',
    summary: 'Паучиха: кокон из паутины, токсичные дротики и форма охотника, неуязвимая к статусам.',
    howToGet: 'Награды за вторжения Шёпота в Дувири.',
    tips: ['Зависни на стене - пассивка даёт невидимость', 'Webbed Embrace удерживает врагов и повышает урон по ним', 'Silken Stride защищает от всех статусов'],
  },
  {
    key: 'Nokko', roles: ['support', 'cc'], tier: 'B',
    summary: 'Грибной фрейм: усыпляющие споры, энергия команде и самовоскрешение.',
    howToGet: 'Награды за задания Нокко: Corporate Restructuring, Critter Liberation, Weed The Gardens.',
    tips: ['Brightbonnet раздаёт энергию и силу способностей', 'После смертельного урона прикоснись к грибу, чтобы ожить', 'Касание грибов удваивает их частоту'],
  },
  {
    key: 'Follie', roles: ['cc', 'support'], tier: 'B',
    summary: 'Художница: кляксы замедляют врагов и выбивают сферы, чернильный двойник поглощает урон.',
    howToGet: 'Ретранслятор Vesper (Венера).',
    tips: ['Почти каждая способность ставит Кляксы - враги с ними дают больше сфер', 'Self Portrait поглощает урон за команду'],
  },
  {
    key: 'Sirius', roles: ['support', 'nuke'], tier: 'A',
    summary: 'Два фрейма в одном: Сириус лечит и защищает, Орион атакует гравитацией. Переключение делает способности дешевле.',
    howToGet: 'Уран: Scoria\'s Angel и The Kuva Wytch.',
    tips: ['Чередуй Сириуса и Ориона - переключение даёт эффективность способностей', 'Light\'s Sanctuary лечит, поднимает союзников и снижает урон', 'Coronal Ejection собирает весь лут на своём пути'],
  },
]

export const FRAME_GUIDE_BY_KEY: Map<string, FrameGuide> = new Map(FRAME_GUIDES.map((g) => [g.key, g]))

/**
 * Progression, Leveling, Talent Tree & Roguelite Perks System
 * Handles persistent profile stats, localStorage saves, and in-run level-up perk generation.
 */
class UpgradeManager {
  static SAVE_KEY = 'DINO_3D_EVOLUTION_SAVE_V1';

  // Available Talent Tree / Permanent Meta-Upgrades
  static TALENTS = [
    {
      id: 'vitality',
      name: 'Skorupa Chitynowa',
      icon: '🛡️',
      desc: 'Zaczynasz każdy bieg z dodatkową tarczą ochronną pochłaniającą kolizję.',
      maxLevel: 4,
      costPerLevel: [15, 40, 90, 180],
      getEffect: (lvl) => `Rozpocznij z ${lvl} ${lvl === 1 ? 'tarczą' : 'tarczami'}`
    },
    {
      id: 'magnetism',
      name: 'Magnetyczny Ryk',
      icon: '🧲',
      desc: 'Przyciąga kryształy bursztynu DNA z sąsiednich torów.',
      maxLevel: 5,
      costPerLevel: [10, 25, 55, 110, 200],
      getEffect: (lvl) => `Zasięg przyciągania: ${(lvl * 1.5).toFixed(1)}m`
    },
    {
      id: 'double_jump',
      name: 'Skoczne Ścięgna',
      icon: '🦘',
      desc: 'Odblokowuje możliwość wykonania drugiego skoku w powietrzu.',
      maxLevel: 3,
      costPerLevel: [25, 60, 130],
      getEffect: (lvl) => lvl >= 1 ? `Odblokowano Podwójny Skok (+${lvl * 15}% siły)` : 'Zablokowane'
    },
    {
      id: 'dash_engine',
      name: 'Błyskawiczny Sprint',
      icon: '⚡',
      desc: 'Zmniejsza czas odnowienia sprintu i niszczy przeszkody podczas szarży.',
      maxLevel: 5,
      costPerLevel: [15, 35, 75, 140, 250],
      getEffect: (lvl) => `Czas odnowienia: ${(12 - lvl * 1.6).toFixed(1)}s`
    },
    {
      id: 'metabolism',
      name: 'Szybki Metabolizm',
      icon: '🧬',
      desc: 'Zwiększa ilość zdobywanego doświadczenia (XP) w biegu.',
      maxLevel: 5,
      costPerLevel: [12, 30, 65, 120, 220],
      getEffect: (lvl) => `+${lvl * 15}% bonusowego XP w biegu`
    },
    {
      id: 'amber_fortune',
      name: 'Pradawna Żyła',
      icon: '💎',
      desc: 'Szansa na znalezienie Podwójnego lub Potrójnego Bursztynu DNA.',
      maxLevel: 5,
      costPerLevel: [18, 45, 95, 170, 300],
      getEffect: (lvl) => `+${lvl * 18}% szansy na podwójny bursztyn`
    },
    {
      id: 'air_control',
      name: 'Zwinny Spadek',
      icon: '🪂',
      desc: 'Wślizg w powietrzu pozwala natychmiast uderzyć o ziemię i skrócić lot.',
      maxLevel: 3,
      costPerLevel: [20, 50, 100],
      getEffect: (lvl) => `+${lvl * 25}% szybkości opadania przy wślizgu`
    },
    {
      id: 'apex_frenzy',
      name: 'Szał Apex Rexa',
      icon: '🔥',
      desc: 'Zwiększa bazowy mnożnik punktów i wydłuża czas trwania perka Szału.',
      maxLevel: 4,
      costPerLevel: [30, 80, 160, 320],
      getEffect: (lvl) => `Mnożnik punktów: x${(1.0 + lvl * 0.25).toFixed(2)}`
    }
  ];

  // In-Run Roguelite Perk Catalog
  static RUN_PERKS = [
    {
      id: 'SHIELD_REPAIR',
      name: 'Chitynowa Regeneracja',
      icon: '🛡️',
      rarity: 'common',
      desc: 'Natychmiast przywraca 1 utraconą tarczę ochronną.',
      apply: (game) => {
        game.state.shields = Math.min(game.state.shields + 1, game.state.maxShields + 1);
      }
    },
    {
      id: 'MAGNET_AURA',
      name: 'Aura Przykrycia DNA',
      icon: '🧲',
      rarity: 'rare',
      desc: 'Przez kolejne 45 sekund zbierasz bursztyn ze wszystkich 3 torów.',
      apply: (game) => {
        game.state.magnetTimer = Math.max(game.state.magnetTimer, 45);
        game.addBuffUI('🧲', 'Aura Bursztynu', 45);
      }
    },
    {
      id: 'STOMP_SHOCKWAVE',
      name: 'Sejsmiczne Lądowanie',
      icon: '💥',
      rarity: 'rare',
      desc: 'Lądowanie ze skoku lub ślizgu generuje falę uderzeniową niszczącą kaktusy w promieniu 5m.',
      apply: (game) => {
        game.state.hasStompShockwave = true;
        game.addBuffUI('💥', 'Sejsmiczne Lądowanie');
      }
    },
    {
      id: 'DOUBLE_JUMP_PERK',
      name: 'Powietrzny Krok',
      icon: '🦘',
      rarity: 'rare',
      desc: 'Daje możliwość drugiego skoku w powietrzu (nawet bez talentu).',
      apply: (game) => {
        game.state.canDoubleJump = true;
        game.addBuffUI('🦘', 'Podwójny Skok');
      }
    },
    {
      id: 'SCORE_BOOST',
      name: 'Adrenalina Łowcy',
      icon: '📈',
      rarity: 'common',
      desc: 'Zwiększa bieżący mnożnik punktów o dodatkowe +1.0x na ten bieg.',
      apply: (game) => {
        game.state.scoreMultiplier += 1.0;
        game.addBuffUI('📈', 'Mnożnik +1.0x');
      }
    },
    {
      id: 'SLOW_MO',
      name: 'Dylatacja Czasu',
      icon: '⏳',
      rarity: 'epic',
      desc: 'Zmniejsza prędkość przeszkód o 15%, ale zachowuje pełen przyrost punktów.',
      apply: (game) => {
        game.state.timeDilationActive = true;
        game.addBuffUI('⏳', 'Dylatacja Czasu');
      }
    },
    {
      id: 'HYPER_DASH',
      name: 'Turbosprężarka',
      icon: '⚡',
      rarity: 'epic',
      desc: 'Skraca odnowienie sprintu o 35% i wydłuża czas jego trwania o 1 sekundę.',
      apply: (game) => {
        game.state.dashCooldownMax *= 0.65;
        game.state.dashDuration += 1.0;
        game.addBuffUI('⚡', 'Turbosprężarka');
      }
    },
    {
      id: 'AMBER_DOUBLER',
      name: 'Bursztynowa Gorączka',
      icon: '💰',
      rarity: 'rare',
      desc: 'Każdy zebrany kryształ bursztynu wart jest podwójnie do końca biegu.',
      apply: (game) => {
        game.state.amberMultiplier = (game.state.amberMultiplier || 1) * 2;
        game.addBuffUI('💰', 'Podwójny Bursztyn');
      }
    },
    {
      id: 'SECOND_WIND',
      name: 'Drugi Oddech',
      icon: '❤️‍🔥',
      rarity: 'legendary',
      desc: 'Śmiertelny cios przy braku tarcz nie zabija Rexa, lecz daje 4 sekundy nietykalności!',
      apply: (game) => {
        game.state.hasSecondWind = true;
        game.addBuffUI('❤️‍🔥', 'Drugi Oddech');
      }
    },
    {
      id: 'TITAN_AURA',
      name: 'Tytaniczna Szarża',
      icon: '🦏',
      rarity: 'legendary',
      desc: 'Zniszczenie przeszkody sprintem lub uderzeniem daje +500 punktów i +25 bursztynu!',
      apply: (game) => {
        game.state.titanSmashBonus = true;
        game.addBuffUI('🦏', 'Tytaniczna Szarża');
      }
    },
    {
      id: 'XP_HARVEST',
      name: 'Ewolucyjny Skok',
      icon: '🧬',
      rarity: 'common',
      desc: 'Natychmiast otrzymujesz +150 XP biegu oraz +30% do dalszego zbierania XP.',
      apply: (game) => {
        game.state.runXpBonusRate += 0.3;
        game.gainRunXp(150);
      }
    }
  ];

  constructor() {
    this.saveData = this.loadSave();
  }

  loadSave() {
    const defaultData = {
      profileLevel: 1,
      profileXp: 0,
      amberTotal: 0,
      highScore: 0,
      totalRuns: 0,
      totalDistance: 0,
      selectedSkin: 'classic',
      unlockedSkins: ['classic'],
      talents: {
        vitality: 0,
        magnetism: 0,
        double_jump: 0,
        dash_engine: 0,
        metabolism: 0,
        amber_fortune: 0,
        air_control: 0,
        apex_frenzy: 0
      }
    };

    try {
      const raw = localStorage.getItem(UpgradeManager.SAVE_KEY);
      if (!raw) return defaultData;
      const parsed = JSON.parse(raw);
      return {
        ...defaultData,
        ...parsed,
        talents: { ...defaultData.talents, ...(parsed.talents || {}) }
      };
    } catch (e) {
      console.warn('Błąd odczytu zapisu gry:', e);
      return defaultData;
    }
  }

  save() {
    try {
      localStorage.setItem(UpgradeManager.SAVE_KEY, JSON.stringify(this.saveData));
    } catch (e) {
      console.error('Błąd zapisu gry w localStorage:', e);
    }
  }

  getProfileXpNeeded(level) {
    return Math.floor(150 * Math.pow(1.22, level - 1));
  }

  addProfileXp(amount) {
    let leveledUp = false;
    this.saveData.profileXp += Math.floor(amount);

    while (this.saveData.profileXp >= this.getProfileXpNeeded(this.saveData.profileLevel)) {
      this.saveData.profileXp -= this.getProfileXpNeeded(this.saveData.profileLevel);
      this.saveData.profileLevel++;
      leveledUp = true;
      this.checkSkinUnlocks();
    }

    this.save();
    return { leveledUp, newLevel: this.saveData.profileLevel };
  }

  checkSkinUnlocks() {
    const lvl = this.saveData.profileLevel;
    for (const [id, skin] of Object.entries(ModelFactory.SKINS)) {
      if (lvl >= skin.unlockedAtLevel && !this.saveData.unlockedSkins.includes(id)) {
        this.saveData.unlockedSkins.push(id);
      }
    }
    this.save();
  }

  addAmber(amount) {
    this.saveData.amberTotal += Math.floor(amount);
    this.save();
    return this.saveData.amberTotal;
  }

  getTalentLevel(talentId) {
    return this.saveData.talents[talentId] || 0;
  }

  buyTalent(talentId) {
    const talent = UpgradeManager.TALENTS.find(t => t.id === talentId);
    if (!talent) return false;

    const currentLvl = this.getTalentLevel(talentId);
    if (currentLvl >= talent.maxLevel) return false;

    const cost = talent.costPerLevel[currentLvl];
    if (this.saveData.amberTotal < cost) return false;

    this.saveData.amberTotal -= cost;
    this.saveData.talents[talentId] = currentLvl + 1;
    this.save();
    return true;
  }

  resetTalents() {
    let refund = 0;
    for (const [talentId, lvl] of Object.entries(this.saveData.talents)) {
      const talent = UpgradeManager.TALENTS.find(t => t.id === talentId);
      if (talent && lvl > 0) {
        for (let i = 0; i < lvl; i++) {
          refund += talent.costPerLevel[i];
        }
      }
      this.saveData.talents[talentId] = 0;
    }
    this.saveData.amberTotal += refund;
    this.save();
    return refund;
  }

  setSkin(skinId) {
    if (this.saveData.unlockedSkins.includes(skinId)) {
      this.saveData.selectedSkin = skinId;
      this.save();
      return true;
    }
    return false;
  }

  // Generate 3 randomized Roguelite perks for in-run level up
  getRandomPerks(count = 3) {
    const pool = [...UpgradeManager.RUN_PERKS];
    const picked = [];

    // Weighted random selection based on rarity
    const rarityWeights = {
      common: 50,
      rare: 30,
      epic: 15,
      legendary: 5
    };

    while (picked.length < count && pool.length > 0) {
      // Calculate total weight
      const totalWeight = pool.reduce((acc, p) => acc + (rarityWeights[p.rarity] || 20), 0);
      let rand = Math.random() * totalWeight;
      let selectedIdx = 0;

      for (let i = 0; i < pool.length; i++) {
        rand -= rarityWeights[pool[i].rarity] || 20;
        if (rand <= 0) {
          selectedIdx = i;
          break;
        }
      }

      picked.push(pool[selectedIdx]);
      pool.splice(selectedIdx, 1);
    }

    return picked;
  }
}

window.upgradeManager = new UpgradeManager();

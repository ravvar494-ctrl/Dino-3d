/**
 * Leaderboard & Player Ranking System for Dino 3D Runner
 * Allows entering player name, comparing against other legendary runners,
 * saving personal match history, and local persistent storage.
 */
class LeaderboardManager {
  static STORAGE_KEY = 'DINO_3D_LEADERBOARD_DATA_V1';
  static PLAYER_NAME_KEY = 'DINO_3D_SAVED_PLAYER_NAME';

  // Default community scores to compete against
  static DEFAULT_RIVALS = [
    { name: 'ApexPredator_99', score: 145200, distance: 4890, skin: 'Kosmiczny Lewiatan', date: '2026-11-20', isPlayer: false },
    { name: 'CyberRex_2077', score: 112400, distance: 3980, skin: 'Cyber Rex 2077', date: '2026-11-19', isPlayer: false },
    { name: 'MagmaLord_PL', score: 86500, distance: 3120, skin: 'Wulkaniczny Tytan', date: '2026-11-18', isPlayer: false },
    { name: 'AmberSeeker', score: 64800, distance: 2450, skin: 'Raptor Pustynny', date: '2026-11-17', isPlayer: false },
    { name: 'DinoMistrz', score: 49200, distance: 1980, skin: 'Dino Klasyczny', date: '2026-11-16', isPlayer: false },
    { name: 'KaktusBuster', score: 38100, distance: 1540, skin: 'Raptor Pustynny', date: '2026-11-15', isPlayer: false },
    { name: 'PixelRaptor', score: 27900, distance: 1180, skin: 'Dino Klasyczny', date: '2026-11-14', isPlayer: false },
    { name: 'PteroHunter', score: 19400, distance: 890, skin: 'Dino Klasyczny', date: '2026-11-13', isPlayer: false },
    { name: 'PrehistoricNoob', score: 11200, distance: 540, skin: 'Dino Klasyczny', date: '2026-11-12', isPlayer: false },
    { name: 'MeteorDodger', score: 7500, distance: 390, skin: 'Dino Klasyczny', date: '2026-11-11', isPlayer: false }
  ];

  constructor() {
    this.playerName = localStorage.getItem(LeaderboardManager.PLAYER_NAME_KEY) || 'Młody Rex';
    this.scores = this.loadScores();
    this.playerHistory = this.loadHistory();
  }

  loadScores() {
    try {
      const raw = localStorage.getItem(LeaderboardManager.STORAGE_KEY);
      if (!raw) return [...LeaderboardManager.DEFAULT_RIVALS];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return [...LeaderboardManager.DEFAULT_RIVALS];
      }
      return parsed;
    } catch (e) {
      console.warn('Błąd ładowania rankingu:', e);
      return [...LeaderboardManager.DEFAULT_RIVALS];
    }
  }

  loadHistory() {
    try {
      const raw = localStorage.getItem('DINO_3D_PLAYER_HISTORY_V1');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  saveScores() {
    try {
      localStorage.setItem(LeaderboardManager.STORAGE_KEY, JSON.stringify(this.scores));
      localStorage.setItem('DINO_3D_PLAYER_HISTORY_V1', JSON.stringify(this.playerHistory));
    } catch (e) {
      console.error('Błąd zapisu rankingu:', e);
    }
  }

  getPlayerName() {
    return this.playerName;
  }

  setPlayerName(name) {
    if (!name || !name.trim()) return;
    this.playerName = name.trim().slice(0, 18);
    localStorage.setItem(LeaderboardManager.PLAYER_NAME_KEY, this.playerName);
  }

  /**
   * Submit a new run result to the leaderboard.
   * Returns: { rank: number, isHighScore: boolean, totalEntries: number }
   */
  submitScore(score, distance, skinName) {
    const today = new Date().toISOString().slice(0, 10);
    const entry = {
      name: this.playerName,
      score: Math.floor(score),
      distance: Math.floor(distance),
      skin: skinName || 'Dino Klasyczny',
      date: today,
      isPlayer: true,
      timestamp: Date.now()
    };

    // Save to player's personal history (last 20 runs)
    this.playerHistory.unshift(entry);
    if (this.playerHistory.length > 20) {
      this.playerHistory.pop();
    }

    // Add to global leaderboard and sort descending by score
    this.scores.push(entry);
    this.scores.sort((a, b) => b.score - a.score);

    // Keep top 25 overall
    if (this.scores.length > 25) {
      this.scores = this.scores.slice(0, 25);
    }

    this.saveScores();

    // Determine ranking position (1-indexed)
    const rank = this.scores.findIndex(e => e.timestamp === entry.timestamp) + 1;
    return {
      rank: rank > 0 ? rank : null,
      isHighScore: rank === 1,
      totalEntries: this.scores.length
    };
  }

  getTopScores(limit = 10) {
    return this.scores.slice(0, limit);
  }

  getPlayerBest() {
    const playerEntries = this.scores.filter(e => e.isPlayer);
    if (playerEntries.length === 0) return null;
    return playerEntries[0];
  }

  resetScores() {
    this.scores = [...LeaderboardManager.DEFAULT_RIVALS];
    this.playerHistory = [];
    this.saveScores();
  }
}

window.leaderboardManager = new LeaderboardManager();

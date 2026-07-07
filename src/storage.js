const STORAGE_KEY = "chibiQuestState:v1";
const CURRENT_MIGRATION_VERSION = 1;
const socialUnitIds = ["local_city", "local_work", "safety_life", "city_change"];
const englishUnitIds = [
  "hello",
  "how_are_you",
  "how_many",
  "i_like_blue",
  "what_do_you_like",
  "alphabet",
  "this_is_for_you",
  "whats_this",
  "who_are_you"
];
const scienceUnitIds = [
  "nature_observation",
  "plants_growth",
  "insects_growth",
  "wind_rubber",
  "sound",
  "animal_homes",
  "ground_sun",
  "sunlight",
  "electric_path",
  "magnets",
  "weight"
];

const defaultState = {
  migrationVersion: CURRENT_MIGRATION_VERSION,
  xp: 0,
  level: 1,
  lastQuestionIds: [],
  lastQuestionFamilies: [],
  unlockedUnits: [
    "multiplication_table",
    "division_basic",
    "addition_subtraction_written",
    "time_duration",
    "large_numbers",
    "kanji_reading",
    "dictionary",
    "kanji_onkun",
    "pronouns",
    "connectives",
    "romaji",
    "vocabulary",
    "story_reading",
    "local_city",
    "local_work",
    "safety_life",
    "city_change",
    ...englishUnitIds,
    ...scienceUnitIds
  ],
  selectedSubject: "math",
  answerHistory: [],
  daily: {
    lastCompletedDate: null,
    streak: 0,
    bestStreak: 0,
    today: null,
    inProgress: null
  },
  soccer: {
    packs: 0,
    owned: {},
    playerPacks: 0,
    players: {},
    team: {
      // 初期チームはスターター（れんしゅうせい）8人。GK→DF2→MF3→FW2 の順
      slots: ["st_101", "st_102", "st_103", "st_104", "st_105", "st_106", "st_107", "st_108"],
      equips: {}
    },
    battleTickets: 0,
    battle: {
      beaten: [],
      wins: 0,
      played: 0
    },
    league: {
      weekKey: null,
      standings: null,
      results: null,
      playedDays: [],
      lastRewardWeekKey: null,
      lastReward: null
    }
  }
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const saved = JSON.parse(raw);
    const loaded = { ...structuredClone(defaultState), ...saved };
    loaded.lastQuestionFamilies ??= [];
    loaded.daily = { ...structuredClone(defaultState.daily), ...(loaded.daily ?? {}) };
    loaded.soccer = { ...structuredClone(defaultState.soccer), ...(loaded.soccer ?? {}) };
    loaded.soccer.league = { ...structuredClone(defaultState.soccer.league), ...(loaded.soccer.league ?? {}) };
    const migrationVersion = Number.isFinite(saved.migrationVersion) ? saved.migrationVersion : 0;

    if (migrationVersion < 1) {
      const hasSocialUnits = loaded.unlockedUnits.some((unitId) => socialUnitIds.includes(unitId));
      if (!hasSocialUnits) {
        loaded.unlockedUnits = [...loaded.unlockedUnits, ...socialUnitIds];
      }
      const hasEnglishUnits = loaded.unlockedUnits.some((unitId) => englishUnitIds.includes(unitId));
      if (!hasEnglishUnits) {
        loaded.unlockedUnits = [...loaded.unlockedUnits, ...englishUnitIds];
      }
      const hasScienceUnits = loaded.unlockedUnits.some((unitId) => scienceUnitIds.includes(unitId));
      if (!hasScienceUnits) {
        loaded.unlockedUnits = [...loaded.unlockedUnits, ...scienceUnitIds];
      }
      loaded.migrationVersion = CURRENT_MIGRATION_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
    }

    return loaded;
  } catch {
    return structuredClone(defaultState);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return structuredClone(defaultState);
}

export function getLevelFromXp(xp) {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

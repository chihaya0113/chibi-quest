import { subjects } from "./curriculum.js?v=18";
import { getLevelFromXp, loadState, resetState, saveState } from "./storage.js?v=18";

const allQuestions = [
  ...(window.CHIBI_QUEST_QUESTIONS ?? []),
  ...(window.CHIBI_QUEST_JAPANESE_QUESTIONS ?? []),
  ...(window.CHIBI_QUEST_SOCIAL_QUESTIONS ?? []),
  ...(window.CHIBI_QUEST_ENGLISH_QUESTIONS ?? []),
  ...(window.CHIBI_QUEST_SCIENCE_QUESTIONS ?? [])
];
const soccerCards = window.CHIBI_QUEST_SOCCER_CARDS ?? [];
const soccerPlayers = window.CHIBI_QUEST_SOCCER_PLAYERS ?? [];
// パック・図鑑の対象（スターターれんしゅうせいは除く）
const collectiblePlayers = soccerPlayers.filter((player) => !player.starter);
const starterPlayers = soccerPlayers.filter((player) => player.starter);
// スロット順（GK,DF,DF,MF,MF,MF,FW,FW）に合わせたスターター初期配置
const STARTER_SLOT_FILL = ["st_101", "st_102", "st_103", "st_104", "st_105", "st_106", "st_107", "st_108"];
const RARITY_WEIGHTS = { 1: 6, 2: 3, 3: 1 };
const PLAYER_STAT_LABELS = [
  ["dribble", "ドリブル"],
  ["pass", "パス"],
  ["shoot", "シュート"],
  ["heading", "ヘディング"],
  ["defense", "まもり"],
  ["speed", "はやさ"]
];
const POSITION_ORDER = { FW: 0, MF: 1, DF: 2, GK: 3 };

// ---- 戦術・特性・勝率計算（データ基盤＋計算エンジン。UI配線は次フェーズ） ----

const TACTIC_LABELS = {
  forecheck: "フォアチェック",
  retreat: "リトリート",
  possession: "ポゼッション",
  counter: "カウンター",
  shortpass: "ショートパス",
  longpass: "ロングパス"
};

// 各戦術に対応する特性プール（1特性は必ず1戦術のみに属する）
const TACTIC_TRAIT_POOLS = {
  forecheck: ["ボール奪取", "スタミナ", "アグレッシブ", "プレッシャー", "飛び出し（GK）"],
  retreat: ["カバーリング", "空中戦", "守備ポジショニング", "対人守備", "GKセービング"],
  possession: ["パス精度", "トラップ", "視野", "ボールキープ", "ドリブル"],
  counter: ["スピード", "裏抜け", "決定力", "瞬発力", "オフザボール"],
  shortpass: ["ワンタッチパス", "スルーパス", "テクニック", "コントロールシュート", "敏捷性"],
  longpass: ["ロングフィード", "クロス精度", "ロングシュート", "ターゲットマン", "フィジカル"]
};

const TRAIT_TO_TACTIC = {};
for (const [tactic, traits] of Object.entries(TACTIC_TRAIT_POOLS)) {
  for (const trait of traits) TRAIT_TO_TACTIC[trait] = tactic;
}

// 守備⇄攻撃のクロス相性（4すくみ：forecheck→possession→retreat→counter→forecheck）。
// ビルドアップ（shortpass/longpass）は勝率の直接補正を持たず、特性プールの選択にのみ関わる。
const TACTIC_MATCHUP_BONUS = {
  forecheck_vs_possession: 5,
  forecheck_vs_counter: -5,
  retreat_vs_possession: -5,
  retreat_vs_counter: 5,
  possession_vs_forecheck: -5,
  possession_vs_retreat: 5,
  counter_vs_forecheck: 5,
  counter_vs_retreat: -5
};

const TRAIT_BONUS_CAP = 20;

// ダブり（凸）で解放済みの特性配列を返す。スターターは常に全解放。
function unlockedTraitsFor(player) {
  if (!player) return [];
  if (player.starter) return player.traits ?? [];
  const ownedCount = state.soccer.players[player.id] ?? 0;
  const traits = player.traits ?? [];
  return traits.slice(0, Math.max(0, Math.min(ownedCount, traits.length)));
}

// myXI/oppXI: 選手オブジェクトの配列。myTactics/oppTactics: { defense, attack, buildup }
function computeMatchupWinRate(myXI, myTactics, oppTactics) {
  const reasons = [];

  const defVsAtk = TACTIC_MATCHUP_BONUS[`${myTactics.defense}_vs_${oppTactics.attack}`] ?? 0;
  if (defVsAtk !== 0) {
    reasons.push({
      kind: "tactic",
      label: `${TACTIC_LABELS[myTactics.defense]}が${TACTIC_LABELS[oppTactics.attack]}に${defVsAtk > 0 ? "有利" : "不利"}`,
      value: defVsAtk
    });
  }

  const atkVsDef = TACTIC_MATCHUP_BONUS[`${myTactics.attack}_vs_${oppTactics.defense}`] ?? 0;
  if (atkVsDef !== 0) {
    reasons.push({
      kind: "tactic",
      label: `${TACTIC_LABELS[myTactics.attack]}が${TACTIC_LABELS[oppTactics.defense]}に${atkVsDef > 0 ? "有利" : "不利"}`,
      value: atkVsDef
    });
  }
  const tacticTotal = defVsAtk + atkVsDef;

  const activeTactics = [myTactics.defense, myTactics.attack, myTactics.buildup];
  const traitCounts = new Map();
  for (const player of myXI) {
    for (const trait of unlockedTraitsFor(player)) {
      if (!activeTactics.includes(TRAIT_TO_TACTIC[trait])) continue;
      traitCounts.set(trait, (traitCounts.get(trait) ?? 0) + 1);
    }
  }

  let traitTotalRaw = 0;
  for (const [trait, count] of traitCounts) {
    traitTotalRaw += count;
    reasons.push({ kind: "trait", label: `${trait} ×${count}`, value: count });
  }
  const traitTotal = Math.max(-TRAIT_BONUS_CAP, Math.min(TRAIT_BONUS_CAP, traitTotalRaw));
  if (traitTotalRaw !== traitTotal) {
    reasons.push({ kind: "cap", label: `特性補正の上限（±${TRAIT_BONUS_CAP}%）`, value: traitTotal - traitTotalRaw });
  }

  const rawPercent = 50 + tacticTotal + traitTotal;
  const finalPercent = Math.max(10, Math.min(90, rawPercent));

  return { finalPercent, tacticTotal, traitTotal, reasons };
}
// 11人制フォーメーション（GK1＋DF/MF/FWの組み合わせを3種から選べる）。slots配列は GK→DF→MF→FW の順
const FORMATIONS = {
  "4-3-3": { label: "4-3-3", df: 4, mf: 3, fw: 3 },
  "4-4-2": { label: "4-4-2", df: 4, mf: 4, fw: 2 },
  "3-4-3": { label: "3-4-3", df: 3, mf: 4, fw: 3 }
};
const DEFAULT_FORMATION = "4-3-3";

function formationSlots(formationKey) {
  const f = FORMATIONS[formationKey] ?? FORMATIONS[DEFAULT_FORMATION];
  const positions = ["GK", ...Array(f.df).fill("DF"), ...Array(f.mf).fill("MF"), ...Array(f.fw).fill("FW")];
  return positions.map((pos, index) => ({ index, pos }));
}

function formationRows(formationKey) {
  const slots = formationSlots(formationKey);
  const byPos = (pos) => slots.filter((slot) => slot.pos === pos).map((slot) => slot.index);
  return [
    { label: "FW", slotIndexes: byPos("FW") },
    { label: "MF", slotIndexes: byPos("MF") },
    { label: "DF", slotIndexes: byPos("DF") },
    { label: "GK", slotIndexes: byPos("GK") }
  ];
}

// 対戦ピッチ用の座標（%）。行ごとに均等配置し、自チームは左、あいては右にミラー
function formationPitchCoords(formationKey) {
  const f = FORMATIONS[formationKey] ?? FORMATIONS[DEFAULT_FORMATION];
  const spreadRow = (count, x) => {
    if (count === 1) return [{ x, y: 50 }];
    const coords = [];
    for (let i = 0; i < count; i += 1) coords.push({ x, y: 15 + (70 * i) / (count - 1) });
    return coords;
  };
  return [
    { x: 7, y: 50 },
    ...spreadRow(f.df, 20),
    ...spreadRow(f.mf, 34),
    ...spreadRow(f.fw, 46)
  ];
}
const CPU_PITCH_COORDS = formationPitchCoords("4-3-3");
// リーグ参加チーム（きみ以外の7チーム）。それぞれ得意な戦い方（スタイル）と実際の戦術（守備・攻撃・ビルドアップ）を持つ
const LEAGUE_CPU_TEAMS = [
  { id: "cpu_1", name: "たんぽぽFC", emoji: "🌼", style: "possession", mid: 3, def: 3, atk: 3, gk: 3, tactics: { defense: "retreat", attack: "possession", buildup: "shortpass" } },
  { id: "cpu_2", name: "かみなりSC", emoji: "⚡", style: "counter", mid: 5, def: 4, atk: 5, gk: 4, tactics: { defense: "forecheck", attack: "counter", buildup: "longpass" } },
  { id: "cpu_3", name: "ドラゴン学園", emoji: "🐉", style: "attacking", mid: 6, def: 6, atk: 6, gk: 6, tactics: { defense: "forecheck", attack: "possession", buildup: "shortpass" } },
  { id: "cpu_4", name: "ギャラクシーFC", emoji: "🌌", style: "possession", mid: 8, def: 7, atk: 8, gk: 7, tactics: { defense: "retreat", attack: "possession", buildup: "shortpass" } },
  { id: "cpu_5", name: "でんせつスターズ", emoji: "👑", style: "attacking", mid: 9, def: 9, atk: 9, gk: 9, tactics: { defense: "forecheck", attack: "possession", buildup: "longpass" } },
  { id: "cpu_6", name: "アイアンウォールFC", emoji: "🛡", style: "defensive", mid: 5, def: 8, atk: 4, gk: 7, tactics: { defense: "retreat", attack: "counter", buildup: "longpass" } },
  { id: "cpu_7", name: "ウィンドラッシュ", emoji: "🌪", style: "counter", mid: 6, def: 5, atk: 7, gk: 5, tactics: { defense: "forecheck", attack: "counter", buildup: "longpass" } }
];
const LEAGUE_STYLE_LABELS = {
  possession: "ポゼッション型",
  counter: "カウンター型",
  attacking: "攻撃型",
  defensive: "守備型"
};
// 8チーム総当たり（あなた＝team 0）の週間対戦表（円卓法で生成・検証済み）。
// schedule[team][day] = その日の対戦相手のteam index
const LEAGUE_SCHEDULE = [
  [7, 6, 5, 4, 3, 2, 1],
  [6, 4, 2, 7, 5, 3, 0],
  [5, 3, 1, 6, 4, 0, 7],
  [4, 2, 7, 5, 0, 1, 6],
  [3, 1, 6, 0, 2, 7, 5],
  [2, 7, 0, 3, 1, 6, 4],
  [1, 0, 4, 2, 7, 5, 3],
  [0, 5, 3, 1, 6, 4, 2]
];
// 戦術カード装備の対戦効果（カードID → 効果の種類）
const EQUIP_EFFECTS = {
  sc_001: "pass", sc_002: "break", sc_003: "shoot", sc_004: "break", sc_005: "pass",
  sc_006: "pass", sc_007: "pass", sc_008: "pass", sc_009: "pass", sc_010: "pass",
  sc_011: "def", sc_012: "def", sc_013: "def", sc_014: "def", sc_015: "rebound"
};
const BATTLE_EVENTS = 10;
let battleTimer = null;
const QUESTIONS_PER_SESSION = 10;
const QUESTIONS_PER_DAILY_SUBJECT = 10;
const DAILY_SUBJECT_ORDER = ["math", "japanese", "english", "science", "social"];
const RECENT_QUESTION_LIMIT = 120;
const RECENT_FAMILY_LIMIT = 80;
const WEAK_SCORE_BOOST = 100;
const DIFFICULTY_ORDER = [3, 3, 2, 3, 2, 3, 3, 2, 3, 2];
const app = document.querySelector("#app");

let state = loadState();
let session = null;
let soccerScreen = null;
let settingsOpen = false;
const questionById = new Map(allQuestions.map((question) => [question.id, question]));

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function normalizeNumberInput(value) {
  return String(value).trim().replace(/[０-９]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
  });
}

function isCorrectAnswer(question, selected) {
  if (question.questionType !== "numeric_input") {
    return selected === String(question.answer.value);
  }

  const selectedNumber = Number(normalizeNumberInput(selected));
  const correctNumber = Number(question.answer.value);
  return Number.isFinite(selectedNumber)
    && Number.isFinite(correctNumber)
    && selectedNumber === correctNumber;
}

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isCompletedToday() {
  return state.daily?.lastCompletedDate === dateKey();
}

function currentStreak() {
  const last = state.daily?.lastCompletedDate;
  if (!last) return 0;
  const yesterday = dateKey(new Date(Date.now() - 86400000));
  if (last === dateKey() || last === yesterday) return state.daily.streak ?? 0;
  return 0;
}

function currentSegment() {
  return session.segments[session.segmentIndex];
}

function currentQuestion() {
  return currentSegment().questions[session.index];
}

function isLastQuestionInSegment() {
  return session.index + 1 >= currentSegment().questions.length;
}

function isLastSegment() {
  return session.segmentIndex + 1 >= session.segments.length;
}

function render() {
  if (battleTimer) {
    window.clearInterval(battleTimer);
    battleTimer = null;
  }
  if (settingsOpen) {
    renderSettings();
    return;
  }
  if (soccerScreen) {
    renderSoccer();
    return;
  }
  if (!session) {
    renderHome();
    return;
  }
  if (session.mode === "result") {
    renderResult();
    return;
  }
  if (session.mode === "transition") {
    renderTransition();
    return;
  }
  renderQuestion();
}

function renderHome() {
  const dailyInProgress = getDailyInProgress();
  const subject = getCurrentSubject();
  const unlocked = new Set(state.unlockedUnits);
  const questions = getSubjectQuestions(subject.id);
  const availableQuestions = questions.filter((question) => unlocked.has(question.unit));
  const progress = state.xp % 100;
  const dailyButtonLabel = isCompletedToday() ? "もう一回やる" : dailyInProgress ? "つづきから" : "はじめる";

  const waiting = state.soccer.packs + state.soccer.playerPacks + state.soccer.battleTickets;

  app.innerHTML = `
    <main class="shell home">
      <section class="topbar">
        <div>
          <p class="eyebrow">ちびクエ</p>
          <h1>まいにち クエスト</h1>
        </div>
        <div class="levelBadge">
          <span>Lv.${state.level}</span>
          <small>${state.xp} XP</small>
        </div>
      </section>

      <section class="dailyCard ${isCompletedToday() ? "done" : ""}" aria-label="今日の日課">
        <div class="dailyCardMain">
          <p class="eyebrow">きょうの日課</p>
          <h2>${isCompletedToday() ? "今日はクリア！🎉" : "5教科 50問チャレンジ"}</h2>
          <p class="dailyStreak">🔥 れんぞく ${currentStreak()}日</p>
        </div>
        <button class="primaryButton" id="dailyButton">${dailyButtonLabel}</button>
      </section>

      <section class="homeCard practiceCard" aria-label="教科べつ れんしゅう">
        <p class="eyebrow">きょうの れんしゅう</p>
        <h2 class="homeCardTitle">教科べつ 10問</h2>
        <div class="subjectTabs" aria-label="教科を選ぶ">
          ${subjects.map((item) => `
            <button class="subjectTab ${item.id === subject.id ? "active" : ""}" data-subject="${item.id}">
              ${escapeHtml(item.label)}
            </button>
          `).join("")}
        </div>
        <div class="xpTrack" aria-label="次のレベルまでの経験値">
          <span style="width:${progress}%"></span>
        </div>
        <button class="primaryButton practiceStart" id="startButton" ${availableQuestions.length < QUESTIONS_PER_SESSION ? "disabled" : ""}>${escapeHtml(subject.label)}を 10問 スタート</button>
      </section>

      <button class="homeCard entryCard" id="soccerEntryButton" aria-label="サッカー">
        <div class="entryMain">
          <p class="eyebrow">⚽ サッカー</p>
          <h2 class="homeCardTitle">あそぶ・あつめる・たいせん</h2>
          <p class="entrySub">せんしゅ ${countOwnedPlayers()}/${collectiblePlayers.length}　カード ${countOwnedCards()}/${soccerCards.length}</p>
        </div>
        <span class="entryArrow">${waiting > 0 ? `<span class="entryBadge">${waiting}</span>` : ""}›</span>
      </button>

      <button class="settingsLink" id="settingsButton">⚙️ せってい・きろく</button>
    </main>
  `;

  document.querySelector("#startButton")?.addEventListener("click", startSession);
  document.querySelector("#dailyButton")?.addEventListener("click", startDaily);
  document.querySelector("#soccerEntryButton")?.addEventListener("click", () => {
    soccerScreen = { mode: "hub" };
    render();
  });
  document.querySelector("#settingsButton")?.addEventListener("click", () => {
    settingsOpen = true;
    render();
  });
  document.querySelectorAll(".subjectTab").forEach((button) => {
    button.addEventListener("click", () => switchSubject(button.dataset.subject));
  });
}

function subjectLabelOf(id) {
  return subjects.find((item) => item.id === id)?.label ?? id;
}

function analyticsFromHistory() {
  const history = state.answerHistory ?? [];
  const bySubject = new Map();
  const byUnit = new Map();
  const byDate = new Map();

  for (const answer of history) {
    const date = answer.answeredAt ? dateKey(new Date(answer.answeredAt)) : null;
    if (date) {
      const day = byDate.get(date) ?? { answers: 0, daily: false };
      day.answers += 1;
      if (String(answer.sessionId).endsWith("_daily")) day.daily = true;
      byDate.set(date, day);
    }
    const question = questionById.get(answer.questionId);
    if (!question) continue;

    const sub = bySubject.get(question.subject) ?? { correct: 0, total: 0 };
    sub.total += 1;
    if (answer.isCorrect) sub.correct += 1;
    bySubject.set(question.subject, sub);

    const unitKey = `${question.subject}:${question.unit}`;
    const unit = byUnit.get(unitKey) ?? {
      unit: question.unit,
      unitLabel: question.unitLabel,
      subject: question.subject,
      correct: 0,
      total: 0
    };
    unit.total += 1;
    if (answer.isCorrect) unit.correct += 1;
    byUnit.set(unitKey, unit);
  }

  return { bySubject, byUnit, byDate, count: history.length };
}

function accuracyTone(pct) {
  return pct >= 80 ? "high" : pct >= 60 ? "mid" : "low";
}

function renderSettings() {
  window.onkeydown = null;
  const stats = analyticsFromHistory();
  const totalCorrect = [...stats.bySubject.values()].reduce((sum, s) => sum + s.correct, 0);
  const overallPct = stats.count > 0 ? Math.round((totalCorrect / stats.count) * 100) : 0;

  // 直近14日のアクティビティ
  const activity = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date(Date.now() - offset * 86400000);
    const key = dateKey(date);
    const day = stats.byDate.get(key);
    activity.push({
      dayNum: date.getDate(),
      dow: ["日", "月", "火", "水", "木", "金", "土"][date.getDay()],
      state: day?.daily ? "daily" : day?.answers ? "some" : "none",
      isToday: key === dateKey()
    });
  }

  // 教科別せいせき（表示は5教科ぜんぶ、データ順は教科定義順）
  const subjectRows = subjects.map((subject) => {
    const s = stats.bySubject.get(subject.id) ?? { correct: 0, total: 0 };
    const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : null;
    return { label: subject.label, correct: s.correct, total: s.total, pct };
  });

  // 苦手な単元（4問以上こたえたもののみ、正答率の低い順）
  const weakUnits = [...stats.byUnit.values()]
    .filter((unit) => unit.total >= 4)
    .map((unit) => ({ ...unit, pct: Math.round((unit.correct / unit.total) * 100) }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5);

  const unlocked = new Set(state.unlockedUnits);

  app.innerHTML = `
    <main class="shell settingsShell">
      <section class="quizHeader">
        <button class="iconButton" id="homeButton" aria-label="ホームへ戻る">←</button>
        <strong class="packTitle">⚙️ せってい・きろく</strong>
        <span></span>
      </section>

      <section class="settingsCard">
        <p class="eyebrow">がくしゅうの きろく</p>
        <div class="statChips">
          <div class="statChip"><strong>🔥 ${currentStreak()}</strong><small>れんぞく日数</small></div>
          <div class="statChip"><strong>🏅 ${state.daily?.bestStreak ?? 0}</strong><small>さいこう記録</small></div>
          <div class="statChip"><strong>${stats.count}</strong><small>こたえた数</small></div>
          <div class="statChip"><strong>${overallPct}%</strong><small>正かい率</small></div>
        </div>
        <div class="activityStrip" aria-label="さいきん14日の学習">
          ${activity.map((d) => `
            <div class="activityDay ${d.state} ${d.isToday ? "today" : ""}" title="${d.dayNum}日">
              <span class="activityMark"></span>
              <span class="activityDow">${d.dow}</span>
            </div>
          `).join("")}
        </div>
        <p class="settingsNote">🟩 日課クリア　🟨 れんしゅうした日　⬜ おやすみ</p>
      </section>

      <section class="settingsCard">
        <p class="eyebrow">教科べつ せいせき</p>
        ${stats.count === 0 ? `<p class="settingsNote">まだ きろくが ないよ。日課や れんしゅうを やってみよう！</p>` : `
          <div class="subjectStats">
            ${subjectRows.map((row) => `
              <div class="subjectStatRow">
                <span class="subjectStatLabel">${escapeHtml(row.label)}</span>
                <span class="statTrack"><span class="statFill ${row.pct === null ? "" : accuracyTone(row.pct)}" style="width:${row.pct ?? 0}%"></span></span>
                <span class="subjectStatVal">${row.pct === null ? "—" : `${row.pct}%`}</span>
                <span class="subjectStatCount">${row.correct}/${row.total}</span>
              </div>
            `).join("")}
          </div>
        `}
      </section>

      <section class="settingsCard">
        <p class="eyebrow">にがてな 単元 ワースト5</p>
        ${weakUnits.length === 0 ? `<p class="settingsNote">4問いじょう こたえた単元が まだ ないよ。</p>` : `
          <div class="weakList">
            ${weakUnits.map((unit) => `
              <div class="weakRow">
                <span class="weakInfo">
                  <strong>${escapeHtml(unit.unitLabel)}</strong>
                  <small>${escapeHtml(subjectLabelOf(unit.subject))}</small>
                </span>
                <span class="statTrack"><span class="statFill ${accuracyTone(unit.pct)}" style="width:${unit.pct}%"></span></span>
                <span class="weakPct">${unit.pct}%</span>
              </div>
            `).join("")}
          </div>
          <p class="settingsNote">にがてな問題は 日課で 少し多めに 出題されます。</p>
        `}
      </section>

      <section class="settingsCard">
        <p class="eyebrow">単元の ロック / かいほう</p>
        <p class="settingsNote">オフにすると その単元は 出題されなくなります。</p>
        ${subjects.map((subject) => `
          <div class="unitManageGroup">
            <p class="unitManageSubject">${escapeHtml(subject.label)}</p>
            <div class="unitManageChips">
              ${subject.units.map((unit) => `
                <button class="unitChip ${unlocked.has(unit.id) ? "on" : "off"}" data-unit="${escapeHtml(unit.id)}">
                  ${escapeHtml(unit.label)} <span class="unitChipState">${unlocked.has(unit.id) ? "ON" : "OFF"}</span>
                </button>
              `).join("")}
            </div>
          </div>
        `).join("")}
        <div class="settingsActions">
          <button class="secondaryButton" id="unlockEverythingButton">ぜんぶ かいほう</button>
          <button class="secondaryButton danger" id="resetButton">きろくを リセット</button>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#homeButton").addEventListener("click", () => {
    settingsOpen = false;
    render();
  });
  document.querySelector("#unlockEverythingButton").addEventListener("click", unlockEverything);
  document.querySelector("#resetButton").addEventListener("click", resetAll);
  document.querySelectorAll(".unitChip").forEach((chip) => {
    chip.addEventListener("click", () => toggleUnit(chip.dataset.unit));
  });
}

function startSession() {
  const subject = getCurrentSubject();
  const unlocked = new Set(state.unlockedUnits);
  const recent = new Set(state.lastQuestionIds.slice(-RECENT_QUESTION_LIMIT));
  const recentFamilies = new Set((state.lastQuestionFamilies ?? []).slice(-RECENT_FAMILY_LIMIT));
  const pool = getSubjectQuestions(subject.id).filter((question) => unlocked.has(question.unit));
  const weakScores = getWeakQuestionScores(subject.id);
  const selected = pickBalancedQuestions(pool, QUESTIONS_PER_SESSION, recent, recentFamilies, weakScores);

  session = {
    kind: "challenge",
    mode: "question",
    segments: [{ subjectId: subject.id, subjectLabel: subject.label, questions: selected }],
    segmentIndex: 0,
    index: 0,
    answers: [],
    selectedValue: ""
  };
  render();
}

function startDaily() {
  if (!isCompletedToday() && resumeDailyIfPossible()) {
    render();
    return;
  }

  const recent = new Set(state.lastQuestionIds.slice(-RECENT_QUESTION_LIMIT));
  const recentFamilies = new Set((state.lastQuestionFamilies ?? []).slice(-RECENT_FAMILY_LIMIT));
  const unlocked = new Set(state.unlockedUnits);
  const segments = [];

  for (const subjectId of DAILY_SUBJECT_ORDER) {
    const subject = subjects.find((item) => item.id === subjectId);
    if (!subject) continue;
    const pool = getSubjectQuestions(subjectId).filter((question) => unlocked.has(question.unit));
    if (pool.length === 0) continue;
    const weakScores = getWeakQuestionScores(subjectId);
    const picked = pickBalancedQuestions(pool, QUESTIONS_PER_DAILY_SUBJECT, recent, recentFamilies, weakScores);
    segments.push({ subjectId, subjectLabel: subject.label, questions: picked });
  }

  if (segments.length === 0) return;

  session = {
    kind: "daily",
    mode: "question",
    segments,
    segmentIndex: 0,
    index: 0,
    answers: [],
    selectedValue: ""
  };
  render();
}

function getDailyInProgress() {
  const progress = state.daily?.inProgress;
  if (!progress) return null;

  if (progress.date !== dateKey()) {
    state.daily.inProgress = null;
    saveState(state);
    return null;
  }

  return progress;
}

function resumeDailyIfPossible() {
  const progress = getDailyInProgress();
  if (!progress) return false;

  const segments = progress.segments?.map((segment) => ({
    subjectId: segment.subjectId,
    subjectLabel: segment.subjectLabel,
    questions: (segment.questionIds ?? []).map(findQuestionById).filter(Boolean)
  })).filter((segment) => segment.questions.length > 0);

  if (!segments?.length) {
    state.daily.inProgress = null;
    saveState(state);
    return false;
  }

  const maxSegmentIndex = segments.length - 1;
  const segmentIndex = Math.min(Math.max(progress.segmentIndex ?? 0, 0), maxSegmentIndex);
  const maxQuestionIndex = segments[segmentIndex].questions.length - 1;
  const index = Math.min(Math.max(progress.index ?? 0, 0), maxQuestionIndex);

  session = {
    kind: "daily",
    mode: "question",
    segments,
    segmentIndex,
    index,
    answers: (progress.answers ?? []).map((answer) => {
      const question = findQuestionById(answer.questionId);
      if (!question) return null;
      return {
        question,
        selected: answer.selected,
        isCorrect: answer.isCorrect,
        subjectId: answer.subjectId
      };
    }).filter(Boolean),
    selectedValue: ""
  };
  return true;
}

function pickBalancedQuestions(pool, count, recent = new Set(), recentFamilies = new Set(), weakScores = new Map()) {
  const byUnit = groupByUnit(pool);
  const units = shuffle([...byUnit.keys()]);
  const quotaByUnit = getUnitQuotas(units, count);
  const picked = [];

  for (const unit of units) {
    const quota = quotaByUnit.get(unit);
    const unitQuestions = byUnit.get(unit) ?? [];
    picked.push(...pickFromUnit(unitQuestions, quota, picked, recent, recentFamilies, weakScores));
  }

  const rest = getDifficultyOrdered(pool, picked, recent, recentFamilies, weakScores)
    .filter((question) => !picked.includes(question))
    .slice(0, count - picked.length);

  return arrangeForVariety([...picked, ...rest]).slice(0, count);
}

function groupByUnit(pool) {
  const byUnit = new Map();
  for (const question of pool) {
    if (!byUnit.has(question.unit)) byUnit.set(question.unit, []);
    byUnit.get(question.unit).push(question);
  }
  return byUnit;
}

function getUnitQuotas(units, count) {
  const quotaByUnit = new Map();
  if (units.length === 0) return quotaByUnit;

  const base = Math.floor(count / units.length);
  const remainder = count % units.length;
  units.forEach((unit, index) => {
    quotaByUnit.set(unit, base + (index < remainder ? 1 : 0));
  });
  return quotaByUnit;
}

function pickFromUnit(unitQuestions, count, alreadyPicked, recent, recentFamilies, weakScores) {
  return getDifficultyOrdered(unitQuestions, alreadyPicked, recent, recentFamilies, weakScores).slice(0, count);
}

function getDifficultyOrdered(questions, alreadyPicked, recent, recentFamilies, weakScores = new Map()) {
  const pickedIds = new Set(alreadyPicked.map((question) => question.id));
  const pickedFamilies = new Set(alreadyPicked.map(getQuestionFamily));
  const fresh = questions.filter((question) => {
    return !recent.has(question.id)
      && !recentFamilies.has(getQuestionFamily(question))
      && !pickedIds.has(question.id)
      && !pickedFamilies.has(getQuestionFamily(question));
  });
  const notRecentId = questions.filter((question) => !recent.has(question.id) && !pickedIds.has(question.id));
  const fallback = questions.filter((question) => !pickedIds.has(question.id));
  const ordered = [];

  for (const difficulty of DIFFICULTY_ORDER) {
    ordered.push(...shuffle(fresh.filter((question) => question.difficulty === difficulty))
      .sort((a, b) => getQuestionPriority(b, weakScores) - getQuestionPriority(a, weakScores)));
  }
  ordered.push(...shuffle(fresh).sort((a, b) => getQuestionPriority(b, weakScores) - getQuestionPriority(a, weakScores)));
  ordered.push(...shuffle(notRecentId).sort((a, b) => getQuestionPriority(b, weakScores) - getQuestionPriority(a, weakScores)));
  ordered.push(...shuffle(fallback).sort((a, b) => getQuestionPriority(b, weakScores) - getQuestionPriority(a, weakScores)));

  return uniqueQuestionsByFamily(ordered);
}

function getQuestionPriority(question, weakScores) {
  return question.difficulty * 10 + (weakScores.get(question.id) ?? 0) * WEAK_SCORE_BOOST;
}

function getQuestionFamily(question) {
  return question.familyId ?? `${question.subject}:${question.unit}:${question.prompt}`;
}

function uniqueQuestionsByFamily(questions) {
  const seenIds = new Set();
  const seenFamilies = new Set();
  const preferred = [];
  const fallback = [];

  for (const question of questions) {
    const family = getQuestionFamily(question);
    if (seenIds.has(question.id)) continue;
    seenIds.add(question.id);

    if (seenFamilies.has(family)) {
      fallback.push(question);
    } else {
      seenFamilies.add(family);
      preferred.push(question);
    }
  }

  return [...preferred, ...fallback];
}

function arrangeForVariety(questions) {
  const remaining = [...questions];
  const arranged = [];

  while (remaining.length > 0) {
    const lastUnit = arranged.at(-1)?.unit;
    const index = remaining.findIndex((question) => question.unit !== lastUnit);
    arranged.push(remaining.splice(index >= 0 ? index : 0, 1)[0]);
  }

  return arranged;
}

function getWeakQuestionScores(subjectId) {
  const subjectQuestionIds = new Set(getSubjectQuestions(subjectId).map((question) => question.id));
  const stats = new Map();

  for (const answer of state.answerHistory ?? []) {
    if (!subjectQuestionIds.has(answer.questionId)) continue;
    const current = stats.get(answer.questionId) ?? {
      wrongCount: 0,
      correctStreak: 0,
      index: 0
    };

    current.index += 1;
    if (answer.isCorrect) {
      current.correctStreak += 1;
    } else {
      current.wrongCount += 1;
      current.correctStreak = 0;
    }
    stats.set(answer.questionId, current);
  }

  const scores = new Map();
  for (const [questionId, stat] of stats.entries()) {
    if (stat.wrongCount === 0 || stat.correctStreak >= 2) continue;
    scores.set(questionId, stat.wrongCount + (stat.correctStreak === 0 ? 2 : 1));
  }
  return scores;
}

function renderQuestion() {
  window.onkeydown = null;
  const question = currentQuestion();
  const questionNumber = session.index + 1;
  const total = currentSegment().questions.length;
  const dailyTag = session.kind === "daily"
    ? `<p class="dailyTag">${session.segmentIndex + 1}/${session.segments.length} ${currentSegment().subjectLabel}</p>`
    : "";

  app.innerHTML = `
    <main class="shell quizShell">
      <section class="quizHeader">
        <button class="iconButton" id="homeButton" aria-label="ホームへ戻る">←</button>
        <div class="questionMeter"><span style="width:${(questionNumber / total) * 100}%"></span></div>
        <strong>${questionNumber}/${total}</strong>
      </section>

      <section class="questionPanel">
        ${dailyTag}
        <p class="unitPill">${escapeHtml(question.unitLabel)}</p>
        <h1>${escapeHtml(question.prompt)}</h1>
        ${renderAnswerControl(question)}
        <div class="feedback" id="feedback"></div>
      </section>
    </main>
  `;

  document.querySelector("#homeButton").addEventListener("click", () => {
    quitQuiz();
  });

  if (question.questionType === "numeric_input") {
    const input = document.querySelector("#answerInput");
    input.focus();
    input.addEventListener("input", () => {
      session.selectedValue = input.value;
    });
    document.querySelector("#answerButton").addEventListener("click", submitAnswer);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") submitAnswer();
    });
  } else {
    const choiceButtons = [...document.querySelectorAll(".choiceButton")];
    choiceButtons.forEach((button) => {
      button.addEventListener("click", () => {
        session.selectedValue = button.dataset.value;
        submitAnswer();
      });
    });
    window.onkeydown = (event) => {
      if (!session.awaitingNext && /^[1-4]$/.test(event.key)) {
        choiceButtons[Number(event.key) - 1]?.click();
      }
    };
  }
}

function renderAnswerControl(question) {
  if (question.questionType === "numeric_input") {
    return `
      <div class="numberAnswer">
        <input id="answerInput" inputmode="numeric" pattern="[0-9]*" autocomplete="off" />
        <span>${escapeHtml(question.answer.unit ?? "")}</span>
        <button class="primaryButton" id="answerButton">こたえる</button>
      </div>
    `;
  }

  return `
    <div class="choiceGrid">
      ${shuffle(question.choices).map((choice, index) => `
        <button class="choiceButton" data-value="${escapeHtml(choice.text)}">
          <span class="choiceNumber">${index + 1}</span>
          <span>${escapeHtml(choice.text)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function submitAnswer() {
  if (session.awaitingNext) {
    goToNextQuestion();
    return;
  }

  const question = currentQuestion();
  const selected = String(session.selectedValue).trim();
  if (!selected) return;

  session.awaitingNext = true;
  const isCorrect = isCorrectAnswer(question, selected);
  session.answers.push({
    question,
    selected,
    isCorrect,
    subjectId: currentSegment().subjectId
  });
  document.querySelectorAll(".choiceButton, #answerButton, #answerInput").forEach((control) => {
    control.disabled = true;
  });

  const feedback = document.querySelector("#feedback");
  feedback.className = `feedback ${isCorrect ? "correct" : "incorrect"}`;
  feedback.innerHTML = `
    <strong>${isCorrect ? "せいかい！" : "おしい！"}</strong>
    <p>${escapeHtml(question.explanation)}</p>
    <button class="secondaryButton nextButton" id="nextButton">${nextButtonLabel()}</button>
  `;

  document.querySelector("#nextButton").addEventListener("click", goToNextQuestion);
  window.setTimeout(() => {
    window.onkeydown = (event) => {
      if (event.key === "Enter") goToNextQuestion();
    };
  }, 0);
}

function nextButtonLabel() {
  if (!isLastQuestionInSegment()) return "つぎへ";
  if (!isLastSegment()) return `つぎは ${session.segments[session.segmentIndex + 1].subjectLabel}`;
  return "結果を見る";
}

function goToNextQuestion() {
  if (!session?.awaitingNext) return;

  if (!isLastQuestionInSegment()) {
    session.index += 1;
    session.selectedValue = "";
    session.awaitingNext = false;
    renderQuestion();
    return;
  }

  if (!isLastSegment()) {
    window.onkeydown = null;
    session.mode = "transition";
    session.awaitingNext = false;
    render();
    return;
  }

  window.onkeydown = null;
  finishSession();
}

function quitQuiz() {
  if (!window.confirm("とちゅうでやめると、つづきから再開できるよ。やめる？")) return;

  if (session.kind === "daily") {
    saveDailyInProgress();
  }

  session = null;
  window.onkeydown = null;
  render();
}

function saveDailyInProgress() {
  const position = getDailySavePosition();
  state.daily.inProgress = {
    date: dateKey(),
    segments: session.segments.map((segment) => ({
      subjectId: segment.subjectId,
      subjectLabel: segment.subjectLabel,
      questionIds: segment.questions.map((question) => question.id)
    })),
    segmentIndex: position.segmentIndex,
    index: position.index,
    answers: session.answers.map((answer) => ({
      questionId: answer.question.id,
      selected: answer.selected,
      isCorrect: answer.isCorrect,
      subjectId: answer.subjectId
    }))
  };
  saveState(state);
}

function getDailySavePosition() {
  if (!session.awaitingNext) {
    return { segmentIndex: session.segmentIndex, index: session.index };
  }

  if (!isLastQuestionInSegment()) {
    return { segmentIndex: session.segmentIndex, index: session.index + 1 };
  }

  if (!isLastSegment()) {
    return { segmentIndex: session.segmentIndex + 1, index: 0 };
  }

  return { segmentIndex: session.segmentIndex, index: session.index };
}

function renderTransition() {
  window.onkeydown = null;
  const finished = currentSegment();
  const next = session.segments[session.segmentIndex + 1];
  const correctInSeg = session.answers.filter(
    (answer) => answer.subjectId === finished.subjectId && answer.isCorrect
  ).length;
  const totalInSeg = finished.questions.length;
  const doneCount = session.segmentIndex + 1;

  app.innerHTML = `
    <main class="shell resultShell">
      <section class="resultPanel">
        <p class="eyebrow">${doneCount}/${session.segments.length} 教科おわり</p>
        <h1>${escapeHtml(finished.subjectLabel)} おわり！</h1>
        <p class="xpGain">${correctInSeg}/${totalInSeg} せいかい</p>
        <p class="transitionNext">つぎは <strong>${escapeHtml(next.subjectLabel)}</strong></p>
        <button class="primaryButton" id="continueButton">${escapeHtml(next.subjectLabel)}へ すすむ</button>
      </section>
    </main>
  `;

  const advance = () => {
    session.segmentIndex += 1;
    session.index = 0;
    session.selectedValue = "";
    session.awaitingNext = false;
    session.mode = "question";
    window.onkeydown = null;
    render();
  };

  document.querySelector("#continueButton").addEventListener("click", advance);
  window.setTimeout(() => {
    window.onkeydown = (event) => {
      if (event.key === "Enter") advance();
    };
  }, 0);
}

function finishSession() {
  const allQuestionsInSession = session.segments.flatMap((segment) => segment.questions);
  const correctCount = session.answers.filter((answer) => answer.isCorrect).length;
  const totalQuestions = allQuestionsInSession.length;
  const base = session.kind === "daily" ? 50 : 10;
  const earnedXp = correctCount * 12 + base;
  const answeredAt = new Date().toISOString();
  const sessionId = `session_${Date.now()}_${session.kind}`;

  const perSubject = {};
  for (const segment of session.segments) {
    const segmentAnswers = session.answers.filter((answer) => answer.subjectId === segment.subjectId);
    perSubject[segment.subjectId] = {
      label: segment.subjectLabel,
      correct: segmentAnswers.filter((answer) => answer.isCorrect).length,
      total: segment.questions.length
    };
  }

  state.xp += earnedXp;
  state.level = getLevelFromXp(state.xp);
  state.lastQuestionIds = [
    ...state.lastQuestionIds,
    ...allQuestionsInSession.map((question) => question.id)
  ].slice(-RECENT_QUESTION_LIMIT);
  state.lastQuestionFamilies = [
    ...(state.lastQuestionFamilies ?? []),
    ...allQuestionsInSession.map(getQuestionFamily)
  ].slice(-RECENT_FAMILY_LIMIT);
  state.answerHistory = [
    ...state.answerHistory,
    ...session.answers.map((answer) => ({
      questionId: answer.question.id,
      answeredAt,
      isCorrect: answer.isCorrect,
      selectedAnswer: answer.selected,
      correctAnswer: String(answer.question.answer.value),
      sessionId
    }))
  ].slice(-500);

  let packEarned = false;
  if (session.kind === "daily") {
    packEarned = updateDailyProgress(perSubject, correctCount);
  }

  saveState(state);
  session = {
    ...session,
    mode: "result",
    correctCount,
    totalQuestions,
    earnedXp,
    perSubject,
    packEarned
  };
  render();
}

function updateDailyProgress(perSubject, totalCorrect) {
  const today = dateKey();
  const daily = state.daily;
  let packEarned = false;

  if (daily.lastCompletedDate !== today) {
    const yesterday = dateKey(new Date(Date.now() - 86400000));
    daily.streak = daily.lastCompletedDate === yesterday ? (daily.streak ?? 0) + 1 : 1;
    daily.lastCompletedDate = today;
    daily.bestStreak = Math.max(daily.bestStreak ?? 0, daily.streak);
    state.soccer.packs += 1;
    state.soccer.playerPacks += 1;
    state.soccer.battleTickets += 1;
    packEarned = true;
  }

  daily.today = { date: today, perSubject, totalCorrect };
  daily.inProgress = null;
  return packEarned;
}

function renderResult() {
  if (session.kind === "daily") {
    renderDailyResult();
    return;
  }

  const total = session.totalQuestions;
  const clearText = session.correctCount >= 8 ? `${currentSegment().subjectLabel}クエストクリア！` : "もう一回で強くなる！";

  app.innerHTML = `
    <main class="shell resultShell">
      <section class="resultPanel">
        <p class="eyebrow">結果</p>
        <h1>${escapeHtml(clearText)}</h1>
        <div class="scoreCircle">
          <strong>${session.correctCount}</strong>
          <span>/${total}</span>
        </div>
        <p class="xpGain">+${session.earnedXp} XP</p>
        <div class="resultActions">
          <button class="primaryButton" id="againButton">もう一回</button>
          <button class="secondaryButton" id="homeButton">ホーム</button>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#againButton").addEventListener("click", startSession);
  document.querySelector("#homeButton").addEventListener("click", () => {
    session = null;
    render();
  });
}

function renderDailyResult() {
  const total = session.totalQuestions;
  const ratio = total > 0 ? session.correctCount / total : 0;
  const chest = ratio >= 0.8 ? "🎁✨" : "🎁";
  const headline = ratio >= 0.8 ? "今日の日課クリア！" : "今日もよくがんばった！";
  const rows = Object.values(session.perSubject).map((subject) => `
    <div class="dailyRow">
      <span class="dailyRowLabel">${escapeHtml(subject.label)}</span>
      <span class="dailyRowScore">${subject.correct}/${subject.total}</span>
    </div>
  `).join("");

  app.innerHTML = `
    <main class="shell resultShell">
      <section class="resultPanel dailyResultPanel">
        <p class="eyebrow">きょうの日課</p>
        <div class="treasureChest">${chest}</div>
        <h1>${headline}</h1>
        <p class="xpGain">+${session.earnedXp} XP / 🔥 れんぞく ${currentStreak()}日</p>
        <div class="dailyBreakdown">${rows}</div>
        <div class="scoreCircle dailyScoreCircle">
          <strong>${session.correctCount}</strong>
          <span>/${total}</span>
        </div>
        ${session.packEarned ? `
          <div class="packBanner">
            <span class="packEmoji">🎴</span>
            <strong>パック2つ ＆ 🎟たいせん券を ゲット！</strong>
          </div>
        ` : ""}
        <div class="resultActions">
          ${(state.soccer.playerPacks > 0 || state.soccer.packs > 0) ? `<button class="primaryButton" id="openPacksButton">パックをあける</button>` : ""}
          <button class="secondaryButton" id="homeButton">ホームへ</button>
          <button class="secondaryButton" id="againButton">もう一回</button>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#openPacksButton")?.addEventListener("click", () => {
    session = null;
    // 選手パック → そのまま戦術パック の順で開封（片方だけならそれを）
    if (state.soccer.playerPacks > 0) {
      openPlayerPack();
    } else {
      openPack();
    }
  });
  document.querySelector("#againButton").addEventListener("click", startDaily);
  document.querySelector("#homeButton").addEventListener("click", () => {
    session = null;
    render();
  });
}

function countOwnedCards() {
  return soccerCards.filter((card) => (state.soccer.owned[card.id] ?? 0) > 0).length;
}

function drawCard() {
  const unowned = soccerCards.filter((card) => !(state.soccer.owned[card.id] > 0));
  const pool = unowned.length > 0 ? unowned : soccerCards;
  const totalWeight = pool.reduce((sum, card) => sum + (RARITY_WEIGHTS[card.rarity] ?? 1), 0);
  let roll = Math.random() * totalWeight;
  for (const card of pool) {
    roll -= RARITY_WEIGHTS[card.rarity] ?? 1;
    if (roll <= 0) return card;
  }
  return pool[pool.length - 1];
}

function openPack() {
  if (state.soccer.packs <= 0) return;
  const card = drawCard();
  session = null;
  soccerScreen = {
    mode: "quiz",
    card,
    choices: shuffle(card.choices),
    answered: false,
    isCorrect: false
  };
  render();
}

function renderSoccer() {
  if (soccerScreen.mode === "hub") {
    renderSoccerHub();
    return;
  }
  if (soccerScreen.mode === "quiz") {
    renderSoccerQuiz();
    return;
  }
  if (soccerScreen.mode === "reveal") {
    renderSoccerReveal();
    return;
  }
  if (soccerScreen.mode === "playerReveal") {
    renderPlayerReveal();
    return;
  }
  if (soccerScreen.mode === "playerDetail") {
    renderPlayerDetail();
    return;
  }
  if (soccerScreen.mode === "team") {
    renderTeam();
    return;
  }
  if (soccerScreen.mode === "pickPlayer") {
    renderPickPlayer();
    return;
  }
  if (soccerScreen.mode === "slotMenu") {
    renderSlotMenu();
    return;
  }
  if (soccerScreen.mode === "benchAssign") {
    renderBenchAssign();
    return;
  }
  if (soccerScreen.mode === "battleSelect") {
    renderBattleSelect();
    return;
  }
  if (soccerScreen.mode === "prematch") {
    renderPrematch();
    return;
  }
  if (soccerScreen.mode === "battle") {
    renderBattle();
    return;
  }
  renderSoccerDex();
}

function countOwnedPlayers() {
  return collectiblePlayers.filter((player) => (state.soccer.players[player.id] ?? 0) > 0).length;
}

function renderSoccerHub() {
  window.onkeydown = null;
  const s = state.soccer;

  const tile = (id, icon, title, sub, badge, disabled) => `
    <button class="hubTile" id="${id}" ${disabled ? "disabled" : ""}>
      <span class="hubIcon">${icon}</span>
      <span class="hubTileMain">
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(sub)}</small>
      </span>
      ${badge ? `<span class="hubBadge">${badge}</span>` : ""}
    </button>
  `;

  app.innerHTML = `
    <main class="shell">
      <section class="quizHeader">
        <button class="iconButton" id="homeButton" aria-label="ホームへ戻る">←</button>
        <strong class="packTitle">⚽ サッカー</strong>
        <span></span>
      </section>

      <section class="hubGrid">
        ${tile("hubPack", "🎴", "せんじゅつパック", `のこり ${s.packs}こ`, s.packs > 0 ? s.packs : "", s.packs <= 0)}
        ${tile("hubPlayerPack", "🧑", "せんしゅパック", `のこり ${s.playerPacks}こ`, s.playerPacks > 0 ? s.playerPacks : "", s.playerPacks <= 0)}
        ${tile("hubBattle", "🏆", "リーグ", `🎟 ${s.battleTickets}まい`, s.battleTickets > 0 ? s.battleTickets : "", false)}
        ${tile("hubTeam", "🧩", "チームへんせい", "せんしゅを ならべる", "", false)}
        ${tile("hubDex", "📖", "ずかん", `せんしゅ ${countOwnedPlayers()}/${collectiblePlayers.length}`, "", false)}
      </section>

      <p class="dexHint">パックとたいせん券は、日課をクリアするともらえるよ。</p>
    </main>
  `;

  document.querySelector("#homeButton").addEventListener("click", () => {
    soccerScreen = null;
    render();
  });
  document.querySelector("#hubPack")?.addEventListener("click", openPack);
  document.querySelector("#hubPlayerPack")?.addEventListener("click", openPlayerPack);
  document.querySelector("#hubBattle")?.addEventListener("click", () => {
    soccerScreen = { mode: "battleSelect" };
    render();
  });
  document.querySelector("#hubTeam")?.addEventListener("click", () => {
    soccerScreen = { mode: "team" };
    render();
  });
  document.querySelector("#hubDex")?.addEventListener("click", () => {
    soccerScreen = { mode: "dex", tab: "players" };
    render();
  });
}

function isPlayerAvailable(player) {
  return player.starter || (state.soccer.players[player.id] ?? 0) > 0;
}

function drawPlayer() {
  const unowned = collectiblePlayers.filter((player) => !(state.soccer.players[player.id] > 0));
  const pool = unowned.length > 0 ? unowned : collectiblePlayers;
  const totalWeight = pool.reduce((sum, player) => sum + (RARITY_WEIGHTS[player.rarity] ?? 1), 0);
  let roll = Math.random() * totalWeight;
  for (const player of pool) {
    roll -= RARITY_WEIGHTS[player.rarity] ?? 1;
    if (roll <= 0) return player;
  }
  return pool[pool.length - 1];
}

function openPlayerPack() {
  if (state.soccer.playerPacks <= 0) return;
  const player = drawPlayer();
  state.soccer.playerPacks = Math.max(0, state.soccer.playerPacks - 1);
  const previousCount = state.soccer.players[player.id] ?? 0;
  state.soccer.players[player.id] = previousCount + 1;
  saveState(state);

  session = null;
  soccerScreen = {
    mode: "playerReveal",
    player,
    isNew: previousCount === 0,
    count: previousCount + 1
  };
  render();
}

const FACE_SKIN = { light: "#f6cfa4", tan: "#e2a970", brown: "#9c6636" };
const FACE_HAIR = { black: "#23262c", darkbrown: "#4a2f18", brown: "#6e4a26", blond: "#e0b23e", ginger: "#c9702f" };

function faceCells(face) {
  const cells = [];
  const skin = FACE_SKIN[face.skin] ?? FACE_SKIN.light;
  const hair = FACE_HAIR[face.hairColor] ?? FACE_HAIR.black;
  const addRange = (r, c1, c2, color, alpha) => {
    for (let c = c1; c <= c2; c += 1) cells.push({ r, c, color, alpha });
  };

  // 顔（肌）
  addRange(2, 3, 6, skin);
  addRange(3, 2, 7, skin);
  for (let r = 4; r <= 6; r += 1) addRange(r, 1, 8, skin);
  addRange(7, 2, 7, skin);
  addRange(8, 3, 6, skin);

  // 髪
  const style = face.hair;
  if (style === "short" || style === "bun") {
    addRange(1, 2, 7, hair);
    addRange(2, 1, 8, hair);
    cells.push({ r: 3, c: 1, color: hair }, { r: 3, c: 8, color: hair });
  }
  if (style === "bun") addRange(0, 4, 5, hair);
  if (style === "buzz") addRange(2, 2, 7, hair);
  if (style === "curly") {
    [2, 4, 5, 7].forEach((c) => cells.push({ r: 0, c, color: hair }));
    addRange(1, 1, 8, hair);
    addRange(2, 1, 8, hair);
    cells.push({ r: 3, c: 1, color: hair }, { r: 3, c: 8, color: hair });
  }
  if (style === "long") {
    addRange(1, 2, 7, hair);
    addRange(2, 1, 8, hair);
    addRange(3, 0, 1, hair);
    addRange(3, 8, 9, hair);
    for (let r = 4; r <= 7; r += 1) {
      cells.push({ r, c: 0, color: hair }, { r, c: 9, color: hair });
    }
  }
  if (style === "spiky") {
    [2, 4, 6].forEach((c) => cells.push({ r: 0, c, color: hair }));
    addRange(1, 1, 8, hair);
    addRange(2, 1, 8, hair);
  }

  // 目
  cells.push({ r: 5, c: 3, color: "#1b1e24" }, { r: 5, c: 6, color: "#1b1e24" });

  // ひげ・口
  if (face.beard === "full") {
    cells.push({ r: 6, c: 1, color: hair }, { r: 6, c: 8, color: hair });
    addRange(7, 2, 7, hair);
    addRange(8, 3, 6, hair);
  } else if (face.beard === "stubble") {
    cells.push({ r: 7, c: 2, color: hair, alpha: 0.45 }, { r: 7, c: 7, color: hair, alpha: 0.45 });
    addRange(8, 3, 6, hair, 0.45);
    addRange(7, 4, 5, "#00000033");
  } else {
    addRange(7, 4, 5, "#00000033");
  }

  return cells;
}

function avatarHtml(player, size = 32) {
  if (!player?.face) return `<span class="avatarEmoji">${player?.emoji ?? "⚽"}</span>`;
  const px = size / 10;
  const rects = faceCells(player.face).map((cell) =>
    `<rect x="${cell.c * px}" y="${cell.r * px}" width="${px}" height="${px}" fill="${cell.color}"${cell.alpha ? ` fill-opacity="${cell.alpha}"` : ""}/>`
  ).join("");
  return `<svg class="pixelFace" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

function statLabelFor(player, key, label) {
  if (player.position === "GK" && key === "defense") return "セービング";
  return label;
}

function renderStatBars(player) {
  return PLAYER_STAT_LABELS.map(([key, label]) => {
    const value = player.stats[key] ?? 0;
    const tone = value >= 8 ? "high" : value >= 5 ? "mid" : "low";
    return `
      <div class="statRow">
        <span class="statLabel">${statLabelFor(player, key, label)}</span>
        <span class="statTrack"><span class="statFill ${tone}" style="width:${value * 10}%"></span></span>
        <span class="statValue">${value}</span>
      </div>
    `;
  }).join("");
}

function renderPlayerCardFace(player, options = {}) {
  const kira = options.kira && player.rarity >= 3 ? " kira" : "";
  return `
    <article class="playerCard pos-${player.position.toLowerCase()}${kira}">
      <header class="playerCardHead">
        <span class="posBadge">${escapeHtml(player.position)}</span>
        <span class="soccerCardStars">${rarityStars(player.rarity)}</span>
      </header>
      <div class="playerIdentity">
        <span class="playerAvatar">${avatarHtml(player, 46)}</span>
        <div>
          <h2 class="playerName">${escapeHtml(player.name)}</h2>
          <p class="playerMeta">${player.flag} ${escapeHtml(player.country)}</p>
          <p class="playerMeta playerClub">🏟 ${escapeHtml(player.club)}</p>
        </div>
      </div>
      <div class="playerStats">${renderStatBars(player)}</div>
    </article>
  `;
}

function renderPlayerReveal() {
  window.onkeydown = null;
  const { player, isNew, count } = soccerScreen;

  app.innerHTML = `
    <main class="shell resultShell">
      <section class="resultPanel soccerRevealPanel">
        <p class="eyebrow">🧑 せんしゅパック かいふう</p>
        <h1>${isNew ? "せんしゅ ゲット！" : "また 会えた！"}</h1>
        <div class="cardRevealWrap shine">
          ${renderPlayerCardFace(player, { kira: true })}
        </div>
        <p class="soccerRevealNote">
          ${isNew ? `<strong>NEW!</strong> ずかんに とうろくされたよ` : `${count}まい目！`}
        </p>
        <div class="resultActions">
          ${state.soccer.playerPacks > 0 ? `<button class="primaryButton" id="nextPlayerPackButton">もう1パック（のこり${state.soccer.playerPacks}）</button>` : ""}
          ${state.soccer.playerPacks <= 0 && state.soccer.packs > 0 ? `<button class="primaryButton" id="nextTacticPackButton">つぎは 🎴せんじゅつパック（のこり${state.soccer.packs}）</button>` : ""}
          <button class="secondaryButton" id="dexButton">図鑑を見る</button>
          <button class="secondaryButton" id="homeButton">ホーム</button>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#nextPlayerPackButton")?.addEventListener("click", () => {
    soccerScreen = null;
    openPlayerPack();
  });
  document.querySelector("#nextTacticPackButton")?.addEventListener("click", () => {
    soccerScreen = null;
    openPack();
  });
  document.querySelector("#dexButton").addEventListener("click", () => {
    soccerScreen = { mode: "dex", tab: "players" };
    render();
  });
  document.querySelector("#homeButton").addEventListener("click", () => {
    soccerScreen = null;
    render();
  });
}

function renderPlayerDetail() {
  window.onkeydown = null;
  const player = soccerPlayers.find((item) => item.id === soccerScreen.playerId);
  if (!player) {
    soccerScreen = { mode: "dex", tab: "players" };
    render();
    return;
  }
  const count = state.soccer.players[player.id] ?? 0;

  app.innerHTML = `
    <main class="shell resultShell">
      <section class="resultPanel soccerRevealPanel">
        <p class="eyebrow">🧑 せんしゅカード</p>
        <div class="cardRevealWrap">
          ${renderPlayerCardFace(player, { kira: true })}
        </div>
        <p class="soccerRevealNote">${count > 1 ? `${count}まい もっているよ` : ""}</p>
        <div class="resultActions">
          <button class="primaryButton" id="backButton">図鑑にもどる</button>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#backButton").addEventListener("click", () => {
    soccerScreen = { mode: "dex", tab: "players" };
    render();
  });
}

function rarityStars(rarity) {
  return "⭐".repeat(rarity);
}

function cardTypeIcon(type) {
  return { attack: "⚡", support: "🤝", defense: "🛡" }[type] ?? "⚽";
}

function renderSoccerQuiz() {
  window.onkeydown = null;
  const card = soccerScreen.card;

  app.innerHTML = `
    <main class="shell quizShell">
      <section class="quizHeader">
        <button class="iconButton" id="homeButton" aria-label="ホームへ戻る">←</button>
        <strong class="packTitle">🎴 パックかいふう</strong>
        <span></span>
      </section>

      <section class="questionPanel soccerQuizPanel">
        <p class="unitPill soccerPill">⚽ この場面、どう動く？</p>
        <h1>${escapeHtml(card.prompt)}</h1>
        <div class="choiceGrid">
          ${soccerScreen.choices.map((choice, index) => `
            <button class="choiceButton" data-value="${escapeHtml(choice.text)}">
              <span class="choiceNumber">${index + 1}</span>
              <span>${escapeHtml(choice.text)}</span>
            </button>
          `).join("")}
        </div>
        <div class="feedback" id="feedback"></div>
      </section>
    </main>
  `;

  document.querySelector("#homeButton").addEventListener("click", () => {
    if (!soccerScreen.answered && !window.confirm("パックはまだあいていないよ。あとであける？")) return;
    soccerScreen = null;
    window.onkeydown = null;
    render();
  });

  const choiceButtons = [...document.querySelectorAll(".choiceButton")];
  choiceButtons.forEach((button) => {
    button.addEventListener("click", () => submitSoccerAnswer(button.dataset.value));
  });
  window.onkeydown = (event) => {
    if (!soccerScreen.answered && /^[1-4]$/.test(event.key)) {
      choiceButtons[Number(event.key) - 1]?.click();
    }
  };
}

function submitSoccerAnswer(selected) {
  if (soccerScreen.answered) return;

  const card = soccerScreen.card;
  const isCorrect = selected === String(card.answer.value);
  soccerScreen.answered = true;
  soccerScreen.isCorrect = isCorrect;

  document.querySelectorAll(".choiceButton").forEach((control) => {
    control.disabled = true;
  });

  const feedback = document.querySelector("#feedback");
  feedback.className = `feedback ${isCorrect ? "correct" : "incorrect"}`;
  feedback.innerHTML = `
    <strong>${isCorrect ? "ナイスプレー！✨" : "おしい！"}</strong>
    <p>${escapeHtml(card.explanation)}</p>
    <button class="secondaryButton nextButton" id="receiveButton">カードをうけとる</button>
  `;

  document.querySelector("#receiveButton").addEventListener("click", receiveCard);
  window.setTimeout(() => {
    window.onkeydown = (event) => {
      if (event.key === "Enter") receiveCard();
    };
  }, 0);
}

function receiveCard() {
  if (!soccerScreen?.answered || soccerScreen.mode !== "quiz") return;

  const card = soccerScreen.card;
  state.soccer.packs = Math.max(0, state.soccer.packs - 1);
  const previousCount = state.soccer.owned[card.id] ?? 0;
  state.soccer.owned[card.id] = previousCount + 1;
  saveState(state);

  soccerScreen = {
    mode: "reveal",
    card,
    isCorrect: soccerScreen.isCorrect,
    isNew: previousCount === 0,
    count: previousCount + 1
  };
  window.onkeydown = null;
  render();
}

function renderCardFace(card, options = {}) {
  const kira = options.kira && card.rarity >= 3 ? " kira" : "";
  return `
    <article class="soccerCard type-${card.type}${kira}">
      <header class="soccerCardHead">
        <span class="soccerCardType">${cardTypeIcon(card.type)} ${escapeHtml(card.typeLabel)}</span>
        <span class="soccerCardStars">${rarityStars(card.rarity)}</span>
      </header>
      <h2 class="soccerCardName">${escapeHtml(card.name)}</h2>
      <p class="soccerCardNo">No.${String(card.cardNo).padStart(2, "0")}</p>
      <div class="soccerCardBody">
        <p class="soccerCardLabel">こう動く：</p>
        <p class="soccerCardText">${escapeHtml(card.answer.value)}</p>
      </div>
    </article>
  `;
}

function renderSoccerReveal() {
  window.onkeydown = null;
  const { card, isCorrect, isNew, count } = soccerScreen;
  const headline = isCorrect
    ? (isNew ? "カード ゲット！" : "また ゲット！")
    : "カードは もらえたよ";

  app.innerHTML = `
    <main class="shell resultShell">
      <section class="resultPanel soccerRevealPanel">
        <p class="eyebrow">🎴 パックかいふう</p>
        <h1>${headline}</h1>
        <div class="cardRevealWrap ${isCorrect ? "shine" : ""}">
          ${renderCardFace(card, { kira: isCorrect })}
        </div>
        <p class="soccerRevealNote">
          ${isNew ? `<strong>NEW!</strong> ずかんに とうろくされたよ` : `${count}まい目！`}
          ${isCorrect ? "" : "<br />つぎは せいかいすると キラキラ になるよ"}
        </p>
        <div class="resultActions">
          ${state.soccer.packs > 0 ? `<button class="primaryButton" id="nextPackButton">もう1パック（のこり${state.soccer.packs}）</button>` : ""}
          <button class="secondaryButton" id="dexButton">図鑑を見る</button>
          <button class="secondaryButton" id="homeButton">ホーム</button>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#nextPackButton")?.addEventListener("click", () => {
    soccerScreen = null;
    openPack();
  });
  document.querySelector("#dexButton").addEventListener("click", () => {
    soccerScreen = { mode: "dex" };
    render();
  });
  document.querySelector("#homeButton").addEventListener("click", () => {
    soccerScreen = null;
    render();
  });
}

function renderSoccerDex() {
  window.onkeydown = null;
  const tab = soccerScreen.tab === "cards" ? "cards" : "players";
  const title = tab === "cards"
    ? `🎴 せんじゅつ図鑑 ${countOwnedCards()}/${soccerCards.length}`
    : `🧑 せんしゅ図鑑 ${countOwnedPlayers()}/${collectiblePlayers.length}`;

  app.innerHTML = `
    <main class="shell">
      <section class="quizHeader">
        <button class="iconButton" id="homeButton" aria-label="ホームへ戻る">←</button>
        <strong class="packTitle">${title}</strong>
        <span></span>
      </section>

      <section class="dexTabs">
        <button class="subjectTab ${tab === "players" ? "active" : ""}" data-tab="players">🧑 せんしゅ</button>
        <button class="subjectTab ${tab === "cards" ? "active" : ""}" data-tab="cards">🎴 せんじゅつ</button>
      </section>

      <section class="dexGrid">
        ${tab === "cards" ? renderCardDexTiles() : renderPlayerDexTiles()}
      </section>

      <p class="dexHint">日課をクリアすると、あたらしいパックがもらえるよ！</p>
    </main>
  `;

  document.querySelector("#homeButton").addEventListener("click", () => {
    soccerScreen = null;
    render();
  });
  document.querySelectorAll(".dexTabs .subjectTab").forEach((button) => {
    button.addEventListener("click", () => {
      soccerScreen = { mode: "dex", tab: button.dataset.tab };
      render();
    });
  });
  document.querySelectorAll(".dexTile[data-player]").forEach((tile) => {
    tile.addEventListener("click", () => {
      soccerScreen = { mode: "playerDetail", playerId: tile.dataset.player };
      render();
    });
  });
}

function renderCardDexTiles() {
  return [...soccerCards].sort((a, b) => a.cardNo - b.cardNo).map((card) => {
    const count = state.soccer.owned[card.id] ?? 0;
    if (count === 0) {
      return `
        <article class="dexTile lockedCard">
          <span class="dexLockMark">？</span>
          <span class="dexLockNo">No.${String(card.cardNo).padStart(2, "0")}</span>
        </article>
      `;
    }
    return `
      <article class="dexTile type-${card.type}">
        <header class="dexTileHead">
          <span>${cardTypeIcon(card.type)}</span>
          <span class="soccerCardStars">${rarityStars(card.rarity)}</span>
        </header>
        <strong class="dexTileName">${escapeHtml(card.name)}</strong>
        <p class="dexTileText">${escapeHtml(card.answer.value)}</p>
        ${count > 1 ? `<span class="dexTileCount">×${count}</span>` : ""}
      </article>
    `;
  }).join("");
}

function renderPlayerDexTiles() {
  const sorted = [...collectiblePlayers].sort((a, b) => {
    const posDiff = (POSITION_ORDER[a.position] ?? 9) - (POSITION_ORDER[b.position] ?? 9);
    return posDiff !== 0 ? posDiff : a.playerNo - b.playerNo;
  });

  return sorted.map((player) => {
    const count = state.soccer.players[player.id] ?? 0;
    if (count === 0) {
      return `
        <article class="dexTile lockedCard">
          <span class="dexLockMark">？</span>
          <span class="dexLockNo">${escapeHtml(player.position)}のだれか</span>
        </article>
      `;
    }
    return `
      <article class="dexTile playerTile pos-${player.position.toLowerCase()}" data-player="${player.id}" role="button" tabindex="0">
        <header class="dexTileHead">
          <span class="posBadge">${escapeHtml(player.position)}</span>
          <span class="soccerCardStars">${rarityStars(player.rarity)}</span>
        </header>
        <div class="dexPlayerRow">
          <span class="dexPlayerAvatar">${avatarHtml(player, 28)}</span>
          <strong class="dexTileName">${escapeHtml(player.name)}</strong>
        </div>
        <p class="dexTileText">${player.flag} ${escapeHtml(player.country)}<br />🏟 ${escapeHtml(player.club)}</p>
        ${count > 1 ? `<span class="dexTileCount">×${count}</span>` : ""}
      </article>
    `;
  }).join("");
}

// 選手ID配列を新フォーメーションのマスへ振り直す（ポジション一致を優先、余りは空欄）
function remapPlayersToFormation(playerIds, formationKey) {
  const slotDefs = formationSlots(formationKey);
  const newSlots = new Array(slotDefs.length).fill(null);
  const remaining = [...playerIds];
  slotDefs.forEach((slotDef, index) => {
    const matchIdx = remaining.findIndex((id) => findPlayerById(id)?.position === slotDef.pos);
    if (matchIdx >= 0) {
      newSlots[index] = remaining[matchIdx];
      remaining.splice(matchIdx, 1);
    }
  });
  slotDefs.forEach((slotDef, index) => {
    if (newSlots[index] || remaining.length === 0) return;
    newSlots[index] = remaining.shift();
  });
  return newSlots;
}

function getTeam() {
  const team = state.soccer.team ?? {};
  if (!FORMATIONS[team.formation]) team.formation = DEFAULT_FORMATION;
  team.equips ??= {};
  const slotDefs = formationSlots(team.formation);
  if (!Array.isArray(team.slots) || team.slots.length !== slotDefs.length) {
    const previousIds = Array.isArray(team.slots) ? team.slots.filter(Boolean) : [];
    // スターター未所持ぶんを補って初期チームを組む（旧セーブや新規プレイ時）
    const fillerIds = previousIds.length > 0 ? previousIds : STARTER_SLOT_FILL.filter((id) => isPlayerAvailable(findPlayerById(id)));
    team.slots = remapPlayersToFormation(fillerIds, team.formation);
    team.equips = {};
    saveState(state);
  }
  state.soccer.team = team;
  return team;
}

function setFormation(formationKey) {
  if (!FORMATIONS[formationKey]) return;
  const team = getTeam();
  if (team.formation === formationKey) return;
  const previousIds = team.slots.filter(Boolean);
  team.formation = formationKey;
  team.slots = remapPlayersToFormation(previousIds, formationKey);
  team.equips = {};
  saveState(state);
}

function benchPlayers() {
  const team = getTeam();
  const placed = new Set(team.slots.filter(Boolean));
  return soccerPlayers.filter((player) => isPlayerAvailable(player) && !placed.has(player.id));
}

function findPlayerById(playerId) {
  return soccerPlayers.find((player) => player.id === playerId);
}

function findCardById(cardId) {
  return soccerCards.find((card) => card.id === cardId);
}

function playerPower(player) {
  const total = PLAYER_STAT_LABELS.reduce((sum, [key]) => sum + (player.stats[key] ?? 0), 0);
  return Math.round(total / PLAYER_STAT_LABELS.length);
}

function computeTeamPower() {
  const team = getTeam();
  let power = 0;
  team.slots.forEach((playerId, index) => {
    const player = playerId ? findPlayerById(playerId) : null;
    if (!player) return;
    power += playerPower(player);
    if (team.equips[index]) power += 2;
  });
  return power;
}

function placePlayer(slotIndex, playerId) {
  const team = getTeam();
  const existingIndex = team.slots.indexOf(playerId);
  if (existingIndex >= 0 && existingIndex !== slotIndex) {
    team.slots[existingIndex] = null;
    delete team.equips[existingIndex];
  }
  if (team.slots[slotIndex] !== playerId) {
    delete team.equips[slotIndex];
  }
  team.slots[slotIndex] = playerId;
  saveState(state);
}

function removeFromSlot(slotIndex) {
  const team = getTeam();
  team.slots[slotIndex] = null;
  delete team.equips[slotIndex];
  saveState(state);
}

function renderTeamSlot(slotIndex) {
  const team = getTeam();
  const slotPos = formationSlots(team.formation)[slotIndex].pos;
  const playerId = team.slots[slotIndex];
  const player = playerId ? findPlayerById(playerId) : null;

  if (!player) {
    return `
      <button class="teamSlot empty pos-${slotPos.toLowerCase()}" data-slot="${slotIndex}">
        <span class="teamSlotPos">${slotPos}</span>
        <span class="teamSlotAdd">＋</span>
      </button>
    `;
  }

  const equipped = team.equips[slotIndex] ? findCardById(team.equips[slotIndex]) : null;
  const mismatch = player.position !== slotPos;
  return `
    <button class="teamSlot filled pos-${slotPos.toLowerCase()} ${mismatch ? "mismatch" : ""}" data-slot="${slotIndex}">
      <span class="teamSlotAvatar">${avatarHtml(player, 32)}</span>
      <span class="teamSlotName">${escapeHtml(player.name.length > 6 ? `${player.name.slice(0, 6)}…` : player.name)}</span>
      ${equipped ? `<span class="teamSlotEquip">🎴</span>` : ""}
      ${mismatch ? `<span class="teamSlotWarn">${escapeHtml(player.position)}</span>` : ""}
    </button>
  `;
}

function renderTeam() {
  window.onkeydown = null;
  const team = getTeam();
  const memberCount = team.slots.filter(Boolean).length;
  const rows = formationRows(team.formation);
  const bench = benchPlayers();
  const returnTo = soccerScreen?.returnTo ?? null;

  app.innerHTML = `
    <main class="shell">
      <section class="quizHeader">
        <button class="iconButton" id="homeButton" aria-label="もどる">←</button>
        <strong class="packTitle">⚽ チームへんせい ${memberCount}/${formationSlots(team.formation).length}人</strong>
        <span class="teamPower">💪 ${computeTeamPower()}</span>
      </section>

      <section class="formationSwitch">
        ${Object.keys(FORMATIONS).map((key) => `
          <button class="formationChip ${team.formation === key ? "active" : ""}" data-formation="${key}">${FORMATIONS[key].label}</button>
        `).join("")}
      </section>

      <section class="pitchBoard">
        ${rows.map((row) => `
          <div class="pitchRow count-${row.slotIndexes.length}">
            ${row.slotIndexes.map((slotIndex) => renderTeamSlot(slotIndex)).join("")}
          </div>
        `).join("")}
      </section>

      <p class="dexHint">マスをタップして 選手をえらぼう。選手をタップすると 🎴せんじゅつカードを そうびできるよ。</p>

      <section class="benchBoard">
        <p class="eyebrow">🪑 ひかえ選手（タップで あいているマスへ）</p>
        ${bench.length === 0 ? `
          <p class="dexHint">ひかえの選手はいないよ。</p>
        ` : `
          <div class="benchRow">
            ${bench.map((player) => `
              <button class="benchTile pos-${player.position.toLowerCase()}" data-bench-player="${player.id}">
                <span class="teamSlotAvatar">${avatarHtml(player, 26)}</span>
                <span class="posBadge">${escapeHtml(player.position)}</span>
              </button>
            `).join("")}
          </div>
        `}
      </section>
    </main>
  `;

  document.querySelector("#homeButton").addEventListener("click", () => {
    soccerScreen = returnTo ? { mode: returnTo } : null;
    render();
  });
  document.querySelectorAll(".formationChip").forEach((chip) => {
    chip.addEventListener("click", () => {
      setFormation(chip.dataset.formation);
      render();
    });
  });
  document.querySelectorAll(".benchTile").forEach((tile) => {
    tile.addEventListener("click", () => {
      const playerId = tile.dataset.benchPlayer;
      const currentTeam = getTeam();
      const slotDefs = formationSlots(currentTeam.formation);
      const emptyMatchIndex = slotDefs.findIndex((slot, index) => !currentTeam.slots[index] && slot.pos === findPlayerById(playerId)?.position);
      const emptyAnyIndex = slotDefs.findIndex((slot, index) => !currentTeam.slots[index]);
      if (emptyMatchIndex >= 0) {
        placePlayer(emptyMatchIndex, playerId);
        render();
      } else if (emptyAnyIndex >= 0) {
        placePlayer(emptyAnyIndex, playerId);
        render();
      } else {
        soccerScreen = { mode: "benchAssign", playerId, returnTo };
        render();
      }
    });
  });
  document.querySelectorAll(".teamSlot").forEach((slot) => {
    slot.addEventListener("click", () => {
      const slotIndex = Number(slot.dataset.slot);
      const playerId = getTeam().slots[slotIndex];
      soccerScreen = playerId
        ? { mode: "slotMenu", slotIndex, returnTo }
        : { mode: "pickPlayer", slotIndex, returnTo };
      render();
    });
  });
}

function renderPickPlayer() {
  window.onkeydown = null;
  const slotIndex = soccerScreen.slotIndex;
  const returnTo = soccerScreen.returnTo ?? null;
  const team = getTeam();
  const slotPos = formationSlots(team.formation)[slotIndex].pos;
  const ownedPlayers = soccerPlayers.filter(isPlayerAvailable);
  const sorted = [...ownedPlayers].sort((a, b) => {
    const fitA = a.position === slotPos ? 0 : 1;
    const fitB = b.position === slotPos ? 0 : 1;
    if (fitA !== fitB) return fitA - fitB;
    return playerPower(b) - playerPower(a);
  });

  app.innerHTML = `
    <main class="shell">
      <section class="quizHeader">
        <button class="iconButton" id="backButton" aria-label="編成にもどる">←</button>
        <strong class="packTitle">${escapeHtml(slotPos)}マスに 入れる選手</strong>
        <span></span>
      </section>

      ${sorted.length === 0 ? `
        <p class="dexHint">まだ選手がいないよ。日課をクリアして 🧑せんしゅパックを あけよう！</p>
      ` : `
        <section class="pickList">
          ${sorted.map((player) => {
            const inSlot = team.slots.indexOf(player.id);
            const fit = player.position === slotPos;
            return `
              <button class="pickRow pos-${player.position.toLowerCase()}" data-player="${player.id}">
                <span class="dexPlayerAvatar">${avatarHtml(player, 28)}</span>
                <span class="pickRowMain">
                  <strong>${escapeHtml(player.name)}</strong>
                  <small>${player.flag} ${escapeHtml(player.club)}</small>
                </span>
                <span class="posBadge">${escapeHtml(player.position)}</span>
                <span class="pickRowPower">💪${playerPower(player)}</span>
                <span class="pickRowTag">${fit ? "✨ぴったり" : ""}${inSlot >= 0 ? " 出場中" : ""}</span>
              </button>
            `;
          }).join("")}
        </section>
      `}
      ${team.slots[slotIndex] ? `<button class="secondaryButton danger" id="clearSlotButton">このマスを からにする</button>` : ""}
    </main>
  `;

  document.querySelector("#backButton").addEventListener("click", () => {
    soccerScreen = { mode: "team", returnTo };
    render();
  });
  document.querySelector("#clearSlotButton")?.addEventListener("click", () => {
    removeFromSlot(slotIndex);
    soccerScreen = { mode: "team", returnTo };
    render();
  });
  document.querySelectorAll(".pickRow").forEach((row) => {
    row.addEventListener("click", () => {
      placePlayer(slotIndex, row.dataset.player);
      soccerScreen = { mode: "team", returnTo };
      render();
    });
  });
}

function renderSlotMenu() {
  window.onkeydown = null;
  const slotIndex = soccerScreen.slotIndex;
  const returnTo = soccerScreen.returnTo ?? null;
  const team = getTeam();
  const player = findPlayerById(team.slots[slotIndex]);
  if (!player) {
    soccerScreen = { mode: "team", returnTo };
    render();
    return;
  }
  const equippedId = team.equips[slotIndex] ?? null;
  const ownedCards = soccerCards.filter((card) => (state.soccer.owned[card.id] ?? 0) > 0);

  app.innerHTML = `
    <main class="shell resultShell">
      <section class="resultPanel soccerRevealPanel">
        <p class="eyebrow">⚽ ${escapeHtml(formationSlots(team.formation)[slotIndex].pos)}マスの選手</p>
        <div class="cardRevealWrap">
          ${renderPlayerCardFace(player, {})}
        </div>

        <div class="equipSection">
          <p class="equipTitle">🎴 せんじゅつカードを そうび（動きの質が変わる）</p>
          ${ownedCards.length === 0 ? `
            <p class="dexHint">まだカードがないよ。🎴せんじゅつパックで 手に入れよう！</p>
          ` : `
            <div class="equipChips">
              ${ownedCards.map((card) => `
                <button class="equipChip ${card.id === equippedId ? "equipped" : ""}" data-card="${card.id}">
                  ${cardTypeIcon(card.type)} ${escapeHtml(card.name)}
                </button>
              `).join("")}
            </div>
          `}
          ${equippedId ? `<p class="equipNote">そうび中：${escapeHtml(findCardById(equippedId)?.name ?? "")}（もう一回タップで はずす）</p>` : ""}
        </div>

        <div class="resultActions">
          <button class="secondaryButton" id="changeButton">選手をかえる</button>
          <button class="secondaryButton danger" id="removeButton">はずす</button>
          <button class="primaryButton" id="backButton">編成にもどる</button>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#backButton").addEventListener("click", () => {
    soccerScreen = { mode: "team", returnTo };
    render();
  });
  document.querySelector("#changeButton").addEventListener("click", () => {
    soccerScreen = { mode: "pickPlayer", slotIndex, returnTo };
    render();
  });
  document.querySelector("#removeButton").addEventListener("click", () => {
    removeFromSlot(slotIndex);
    soccerScreen = { mode: "team", returnTo };
    render();
  });
  document.querySelectorAll(".equipChip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const cardId = chip.dataset.card;
      if (team.equips[slotIndex] === cardId) {
        delete team.equips[slotIndex];
      } else {
        team.equips[slotIndex] = cardId;
      }
      saveState(state);
      soccerScreen = { mode: "slotMenu", slotIndex, returnTo };
      render();
    });
  });
}

function renderBenchAssign() {
  window.onkeydown = null;
  const playerId = soccerScreen.playerId;
  const returnTo = soccerScreen.returnTo ?? null;
  const player = findPlayerById(playerId);
  const team = getTeam();
  const slotDefs = formationSlots(team.formation);
  if (!player) {
    soccerScreen = { mode: "team", returnTo };
    render();
    return;
  }

  app.innerHTML = `
    <main class="shell">
      <section class="quizHeader">
        <button class="iconButton" id="backButton" aria-label="編成にもどる">←</button>
        <strong class="packTitle">${escapeHtml(player.name)}を どのマスに？</strong>
        <span></span>
      </section>
      <p class="dexHint">入れかえたいマスをタップしてね。</p>
      <section class="pickList">
        ${slotDefs.map((slotDef) => {
          const current = findPlayerById(team.slots[slotDef.index]);
          return `
            <button class="pickRow pos-${slotDef.pos.toLowerCase()}" data-slot="${slotDef.index}">
              <span class="dexPlayerAvatar">${current ? avatarHtml(current, 28) : "＋"}</span>
              <span class="pickRowMain">
                <strong>${current ? escapeHtml(current.name) : "（からのマス）"}</strong>
              </span>
              <span class="posBadge">${escapeHtml(slotDef.pos)}</span>
            </button>
          `;
        }).join("")}
      </section>
    </main>
  `;

  document.querySelector("#backButton").addEventListener("click", () => {
    soccerScreen = { mode: "team", returnTo };
    render();
  });
  document.querySelectorAll(".pickRow").forEach((row) => {
    row.addEventListener("click", () => {
      placePlayer(Number(row.dataset.slot), playerId);
      soccerScreen = { mode: "team", returnTo };
      render();
    });
  });
}

// ---- リーグ（8チーム総当たり・週間シーズン） ----

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function mondayDateKeyOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return dateKey(d);
}

function dayIndexInWeek(weekKey, date) {
  const monday = parseDateKey(weekKey);
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((today - monday) / 86400000);
}

function emptyStandingsRow() {
  return { points: 0, wins: 0, draws: 0, losses: 0, rests: 0, played: 0 };
}

function applyResultToStandings(standings, teamIndex, outcome) {
  const row = standings[teamIndex];
  if (outcome === "rest") {
    row.rests += 1;
    return;
  }
  row.played += 1;
  if (outcome === "win") { row.points += 3; row.wins += 1; }
  else if (outcome === "draw") { row.points += 1; row.draws += 1; }
  else if (outcome === "loss") { row.losses += 1; }
}

function simulateCpuVsCpuResult(teamA, teamB) {
  const strengthA = teamA.atk + teamA.mid + teamA.def + teamA.gk;
  const strengthB = teamB.atk + teamB.mid + teamB.def + teamB.gk;
  const drawChance = 0.22;
  const aWinChance = clampChance(0.5 + (strengthA - strengthB) * 0.025, 0.12, 0.85) * (1 - drawChance);
  const roll = Math.random();
  if (roll < drawChance) return "draw";
  return roll < drawChance + aWinChance ? "winA" : "winB";
}

function simulateCpuPairingsForDay(day) {
  const standings = state.soccer.league.standings;
  const done = new Set();
  for (let team = 1; team <= 7; team += 1) {
    if (done.has(team)) continue;
    const opp = LEAGUE_SCHEDULE[team][day];
    if (opp === 0) continue; // その日は「きみ」と対戦する予定＝ここでは処理しない
    done.add(team);
    done.add(opp);
    const outcome = simulateCpuVsCpuResult(LEAGUE_CPU_TEAMS[team - 1], LEAGUE_CPU_TEAMS[opp - 1]);
    if (outcome === "draw") {
      applyResultToStandings(standings, team, "draw");
      applyResultToStandings(standings, opp, "draw");
    } else if (outcome === "winA") {
      applyResultToStandings(standings, team, "win");
      applyResultToStandings(standings, opp, "loss");
    } else {
      applyResultToStandings(standings, team, "loss");
      applyResultToStandings(standings, opp, "win");
    }
  }
}

function grantLeagueReward(rank) {
  // 今の通貨だけで組んだ簡易版報酬（選手指名権・Tier確定パックは、ロースター改修後にアップグレード予定）
  let packs = 0;
  let playerPacks = 0;
  let ticket = 0;
  if (rank === 1) { packs = 3; playerPacks = 3; ticket = 1; }
  else if (rank === 2) { packs = 2; playerPacks = 2; }
  else if (rank === 3) { packs = 2; playerPacks = 1; }
  else if (rank === 4) { packs = 1; playerPacks = 1; }
  else { packs = 1; playerPacks = 0; }

  state.soccer.packs += packs;
  state.soccer.playerPacks += playerPacks;
  state.soccer.battleTickets += ticket;
  return { packs, playerPacks, ticket };
}

function finalizeLeagueWeek() {
  const league = state.soccer.league;
  if (!league.weekKey || !league.standings) return;
  const ranking = Object.entries(league.standings)
    .map(([team, row]) => ({ team: Number(team), ...row }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins || a.team - b.team);
  const myRank = ranking.findIndex((row) => row.team === 0) + 1;
  const reward = grantLeagueReward(myRank);
  league.lastRewardWeekKey = league.weekKey;
  league.lastReward = { rank: myRank, ...reward };
}

function startNewLeagueWeek(weekKey) {
  const standings = {};
  for (let team = 0; team < 8; team += 1) standings[team] = emptyStandingsRow();
  const league = state.soccer.league;
  league.weekKey = weekKey;
  league.standings = standings;
  league.playedDays = {};
  league.cpuDaysResolved = [];
}

function ensureLeagueWeek() {
  const league = state.soccer.league;
  const currentMonday = mondayDateKeyOf(new Date());
  if (league.weekKey !== currentMonday) {
    if (league.weekKey && league.standings) {
      for (let day = 0; day <= 6; day += 1) {
        if (!league.cpuDaysResolved.includes(day)) {
          simulateCpuPairingsForDay(day);
          league.cpuDaysResolved.push(day);
        }
        if (!league.playedDays[day]) league.playedDays[day] = { kind: "rest" };
      }
      finalizeLeagueWeek();
    }
    startNewLeagueWeek(currentMonday);
  }

  const todayIndex = dayIndexInWeek(league.weekKey, new Date());
  for (let day = 0; day < todayIndex; day += 1) {
    if (!league.cpuDaysResolved.includes(day)) {
      simulateCpuPairingsForDay(day);
      league.cpuDaysResolved.push(day);
    }
    if (!league.playedDays[day]) league.playedDays[day] = { kind: "rest" };
  }
  if (!league.cpuDaysResolved.includes(todayIndex)) {
    simulateCpuPairingsForDay(todayIndex);
    league.cpuDaysResolved.push(todayIndex);
  }
  saveState(state);
}

function todaysLeagueFixture() {
  const league = state.soccer.league;
  const dayIndex = dayIndexInWeek(league.weekKey, new Date());
  if (league.playedDays[dayIndex]) return null;
  const oppTeamIndex = LEAGUE_SCHEDULE[0][dayIndex];
  return { dayIndex, opponent: LEAGUE_CPU_TEAMS[oppTeamIndex - 1] };
}

function leagueRanking() {
  const league = state.soccer.league;
  const names = ["きみ", ...LEAGUE_CPU_TEAMS.map((team) => team.name)];
  const emojis = ["⚽", ...LEAGUE_CPU_TEAMS.map((team) => team.emoji)];
  return Object.entries(league.standings)
    .map(([team, row]) => ({ team: Number(team), name: names[Number(team)], emoji: emojis[Number(team)], ...row }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins || a.team - b.team);
}

function collectTeamForBattle() {
  const team = getTeam();
  const slotDefs = formationSlots(team.formation);
  const placed = [];
  team.slots.forEach((playerId, slotIndex) => {
    const player = playerId ? findPlayerById(playerId) : null;
    if (!player) return;
    const equip = team.equips[slotIndex] ? findCardById(team.equips[slotIndex]) : null;
    placed.push({ player, slotIndex, slotPos: slotDefs[slotIndex].pos, equip });
  });

  const boosts = { pass: 0, break: 0, shoot: 0, def: 0, rebound: 0 };
  for (const entry of placed) {
    if (!entry.equip) continue;
    const effect = EQUIP_EFFECTS[entry.equip.id];
    if (effect) boosts[effect] += 1;
  }

  const bySlotPos = (pos) => placed.filter((entry) => entry.slotPos === pos);
  const mfEntries = bySlotPos("MF");
  const dfEntries = bySlotPos("DF");
  const gkEntry = bySlotPos("GK")[0] ?? null;
  const mid = mfEntries.length > 0
    ? mfEntries.reduce((sum, e) => sum + (e.player.stats.pass + e.player.stats.dribble) / 2, 0) / mfEntries.length
    : 0;
  const def = dfEntries.length > 0
    ? dfEntries.reduce((sum, e) => sum + (e.player.stats.defense + e.player.stats.heading) / 2, 0) / dfEntries.length
    : 0;
  const gk = gkEntry ? gkEntry.player.stats.defense : 1;

  let attackers = [
    ...bySlotPos("FW").map((entry) => ({ entry, weight: 3 })),
    ...mfEntries.map((entry) => ({ entry, weight: 2 }))
  ];
  if (attackers.length === 0) attackers = placed.map((entry) => ({ entry, weight: 1 }));

  return { placed, boosts, mid: Math.max(mid, 0.5), def: Math.max(def, 0.5), gk, gkEntry, dfEntries, attackers };
}

function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.entry;
  }
  return items[items.length - 1]?.entry;
}

function clampChance(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function simulateMatch(cpu, matchBonus = 0) {
  const my = collectTeamForBattle();
  const bonus = clampChance(matchBonus, -0.3, 0.3);
  const lines = [];
  let myScore = 0;
  let cpuScore = 0;
  const push = (text, kind, extra = {}) => lines.push({
    text, kind, my: myScore, cpu: cpuScore,
    ball: extra.ball ?? 50,
    actor: extra.actor ?? null,
    flash: extra.flash ?? null
  });

  push(`しあいスタート！ きみのチーム 対 ${cpu.emoji}${cpu.name}！`, "info", { ball: 50 });

  for (let event = 0; event < BATTLE_EVENTS; event += 1) {
    if (event === BATTLE_EVENTS / 2) {
      push(`⏱ 前半おわり　${myScore} - ${cpuScore}`, "info", { ball: 50 });
    }

    const pAttack = clampChance(0.5 + (my.mid - cpu.mid) * 0.04 + my.boosts.pass * 0.04 + bonus * 0.4, 0.2, 0.8);
    if (Math.random() < pAttack) {
      const attacker = weightedPick(my.attackers);
      if (!attacker) continue;
      const player = attacker.player;
      const breakScore = Math.max(player.stats.dribble, player.stats.speed);
      const hasBreakEquip = attacker.equip && EQUIP_EFFECTS[attacker.equip.id] === "break";
      const breakChance = clampChance(0.4 + (breakScore - cpu.def) * 0.06 + my.boosts.break * 0.06 + bonus * 0.3, 0.15, 0.85);

      if (Math.random() >= breakChance) {
        push(`${player.emoji}${player.name}が しかけたが、${cpu.name}に とめられた！`, "chance", { ball: 65, actor: player.id });
        continue;
      }

      const flavor = hasBreakEquip ? `🎴${attacker.equip.name}！ ` : "";
      const useHeading = player.stats.heading > player.stats.shoot;
      const shootStat = useHeading ? player.stats.heading : player.stats.shoot;
      const goalChance = clampChance(0.35 + (shootStat - cpu.gk) * 0.07 + my.boosts.shoot * 0.07 + bonus * 0.3, 0.12, 0.8);

      if (Math.random() < goalChance) {
        myScore += 1;
        push(`${flavor}⚽ ゴーール！！ ${player.emoji}${player.name}が${useHeading ? " ヘディングで" : ""} きめた！`, "goal", { ball: 98, actor: player.id, flash: "goal" });
      } else {
        push(`${flavor}${player.emoji}${player.name}のシュート！ …キーパーに とめられた！`, "chance", { ball: 88, actor: player.id });
        if (my.boosts.rebound > 0 && Math.random() < 0.45) {
          const reboundEntry = my.placed.find((e) => e.equip && EQUIP_EFFECTS[e.equip.id] === "rebound") ?? attacker;
          if (Math.random() < 0.5) {
            myScore += 1;
            push(`🎴こぼれ球に反応！ ${reboundEntry.player.emoji}${reboundEntry.player.name}が おしこんだ！ ⚽`, "goal", { ball: 98, actor: reboundEntry.player.id, flash: "goal" });
          } else {
            push(`こぼれ球に とびこんだが、おしくも 入らない！`, "chance", { ball: 90, actor: reboundEntry.player.id });
          }
        }
      }
    } else {
      const breakChance = clampChance(0.4 + (cpu.atk - my.def) * 0.06 - my.boosts.def * 0.07 - bonus * 0.3, 0.15, 0.85);
      if (Math.random() >= breakChance) {
        const defender = my.dfEntries.length > 0 ? my.dfEntries[Math.floor(Math.random() * my.dfEntries.length)] : null;
        const defEquip = defender?.equip && EQUIP_EFFECTS[defender.equip.id] === "def" ? `🎴${defender.equip.name}！ ` : "";
        push(`${defEquip}ナイスまもり！ ${defender ? `${defender.player.emoji}${defender.player.name}` : "みんな"}が ボールをうばった！`, "good", { ball: 35, actor: defender?.player.id ?? null });
        continue;
      }
      const goalChance = clampChance(0.35 + (cpu.atk - my.gk) * 0.07 - bonus * 0.3, 0.12, 0.8);
      if (Math.random() < goalChance) {
        cpuScore += 1;
        push(`😱 ${cpu.emoji}${cpu.name}のシュートが きまってしまった…`, "danger", { ball: 2, flash: "danger" });
      } else {
        push(`あぶない！ でも ${my.gkEntry ? `${my.gkEntry.player.emoji}${my.gkEntry.player.name}` : "キーパー"}が ビッグセーブ！`, "good", { ball: 10, actor: my.gkEntry?.player.id ?? null });
      }
    }
  }

  push(`しあい しゅうりょう！　きみ ${myScore} - ${cpuScore} ${cpu.name}`, "info", { ball: 50 });

  const myCoords = formationPitchCoords(getTeam().formation);
  const tokens = my.placed.map((entry) => ({
    id: entry.player.id,
    emoji: entry.player.emoji,
    x: myCoords[entry.slotIndex].x,
    y: myCoords[entry.slotIndex].y
  }));

  return { lines, myScore, cpuScore, tokens };
}

function getMyTactics() {
  state.soccer.myTactics ??= { defense: "forecheck", attack: "possession", buildup: "shortpass" };
  return state.soccer.myTactics;
}

function setMyTacticField(kind, value) {
  getMyTactics()[kind] = value;
  saveState(state);
}

function myXIPlayers() {
  return getTeam().slots.map((playerId) => (playerId ? findPlayerById(playerId) : null)).filter(Boolean);
}

function playTodayLeagueMatch() {
  ensureLeagueWeek();
  const fixture = todaysLeagueFixture();
  if (!fixture || state.soccer.battleTickets <= 0) return;
  if (getTeam().slots.filter(Boolean).length === 0) return;

  const winRate = computeMatchupWinRate(myXIPlayers(), getMyTactics(), fixture.opponent.tactics);
  const matchBonus = (winRate.finalPercent - 50) / 100;
  const match = simulateMatch(fixture.opponent, matchBonus);
  state.soccer.battleTickets -= 1;

  let outcome = "loss";
  let reward = 10;
  let resultText = "まけちゃった… でも いい経験！";
  if (match.myScore > match.cpuScore) {
    outcome = "win";
    reward = 30;
    resultText = "🏆 しょうり！！";
  } else if (match.myScore === match.cpuScore) {
    outcome = "draw";
    reward = 15;
    resultText = "ひきわけ！ おしい！";
  }

  applyResultToStandings(state.soccer.league.standings, 0, outcome);
  state.soccer.league.playedDays[fixture.dayIndex] = { kind: outcome, myScore: match.myScore, cpuScore: match.cpuScore };

  state.xp += reward;
  state.level = getLevelFromXp(state.xp);
  saveState(state);

  soccerScreen = { mode: "battle", opponent: fixture.opponent, match, reward, resultText };
  render();
}

function renderBattleSelect() {
  window.onkeydown = null;
  ensureLeagueWeek();
  const placedCount = getTeam().slots.filter(Boolean).length;
  const league = state.soccer.league;
  const ranking = leagueRanking();
  const fixture = todaysLeagueFixture();
  const todayIndex = dayIndexInWeek(league.weekKey, new Date());
  const todayResult = league.playedDays[todayIndex];
  const dowLabels = ["月", "火", "水", "木", "金", "土", "日"];

  let todayBox = "";
  if (todayResult) {
    if (todayResult.kind === "rest") {
      todayBox = `<p class="dexHint">きょうは 試合なし（お休み）。あしたまた がんばろう！</p>`;
    } else {
      const labels = { win: "🏆 しょうり", draw: "🤝 ひきわけ", loss: "😢 まけ" };
      todayBox = `<p class="dexHint">きょうの結果：${labels[todayResult.kind]}（${todayResult.myScore} - ${todayResult.cpuScore}）</p>`;
    }
  } else if (fixture) {
    todayBox = `
      <section class="homeCard practiceCard">
        <p class="eyebrow">${dowLabels[fixture.dayIndex]}曜日の試合</p>
        <h2 class="homeCardTitle">${fixture.opponent.emoji} ${escapeHtml(fixture.opponent.name)}</h2>
        <p class="entrySub">${escapeHtml(LEAGUE_STYLE_LABELS[fixture.opponent.style] ?? "")}</p>
        <button class="primaryButton practiceStart" id="playLeagueButton" ${state.soccer.battleTickets > 0 && placedCount > 0 ? "" : "disabled"}>たいせんじゅんびへ（🎟${state.soccer.battleTickets}）</button>
      </section>
    `;
  }

  app.innerHTML = `
    <main class="shell">
      <section class="quizHeader">
        <button class="iconButton" id="homeButton" aria-label="ホームへ戻る">←</button>
        <strong class="packTitle">🏆 リーグ</strong>
        <span class="teamPower">🎟 ${state.soccer.battleTickets}</span>
      </section>

      <p class="dexHint">きみのチーム：${placedCount}/${formationSlots(getTeam().formation).length}人・💪${computeTeamPower()}　${placedCount === 0 ? "まず ⚽チームへんせいで 選手をおこう！" : ""}</p>

      ${todayBox}

      <section class="settingsCard">
        <p class="eyebrow">こんしゅうの じゅんい表</p>
        <div class="subjectStats">
          ${ranking.map((row, index) => `
            <div class="subjectStatRow leagueRow ${row.team === 0 ? "leagueRowMe" : ""}">
              <span class="subjectStatLabel">${index + 1}位 ${row.emoji}</span>
              <span class="leagueRowName">${escapeHtml(row.name)}</span>
              <span class="subjectStatVal">${row.points}pt</span>
              <span class="subjectStatCount">${row.wins}勝${row.draws}分${row.losses}敗${row.rests > 0 ? `・お休み${row.rests}` : ""}</span>
            </div>
          `).join("")}
        </div>
        <p class="settingsNote">日曜が終わると じゅんいに応じてパックがもらえるよ。勉強しなかった日は「負け」ではなく「お休み」になるよ。</p>
      </section>
    </main>
  `;

  document.querySelector("#homeButton").addEventListener("click", () => {
    soccerScreen = null;
    render();
  });
  document.querySelector("#playLeagueButton")?.addEventListener("click", () => {
    soccerScreen = { mode: "prematch" };
    render();
  });
}

function renderPrematch() {
  window.onkeydown = null;
  ensureLeagueWeek();
  const fixture = todaysLeagueFixture();
  if (!fixture) {
    soccerScreen = { mode: "battleSelect" };
    render();
    return;
  }
  const cpu = fixture.opponent;
  const team = getTeam();
  const placedCount = team.slots.filter(Boolean).length;
  const myTactics = getMyTactics();
  const winRate = computeMatchupWinRate(myXIPlayers(), myTactics, cpu.tactics);

  const tacticGroup = (kind, options) => `
    <div class="tacticGroup">
      <p class="tacticGroupLabel">${{ defense: "守備", attack: "攻撃", buildup: "ビルドアップ" }[kind]}</p>
      <div class="tacticChips">
        ${options.map((opt) => `
          <button class="tacticChip ${myTactics[kind] === opt ? "active" : ""}" data-kind="${kind}" data-value="${opt}">${TACTIC_LABELS[opt]}</button>
        `).join("")}
      </div>
    </div>
  `;

  app.innerHTML = `
    <main class="shell">
      <section class="quizHeader">
        <button class="iconButton" id="backButton" aria-label="リーグにもどる">←</button>
        <strong class="packTitle">たいせんじゅんび</strong>
        <span class="teamPower">🎟 ${state.soccer.battleTickets}</span>
      </section>

      <section class="homeCard practiceCard">
        <p class="eyebrow">きょうの相手</p>
        <h2 class="homeCardTitle">${cpu.emoji} ${escapeHtml(cpu.name)}</h2>
        <p class="entrySub">${escapeHtml(LEAGUE_STYLE_LABELS[cpu.style] ?? "")}・${TACTIC_LABELS[cpu.tactics.defense]}/${TACTIC_LABELS[cpu.tactics.attack]}/${TACTIC_LABELS[cpu.tactics.buildup]}</p>
      </section>

      <section class="settingsCard winRateCard">
        <p class="eyebrow">きみの チーム：${placedCount}/${formationSlots(team.formation).length}人・💪${computeTeamPower()}</p>
        <button class="secondaryButton" id="editTeamButton">チームをへんせいする（${FORMATIONS[team.formation].label}）</button>

        <p class="winRateBig">かちめ ${winRate.finalPercent}%</p>
        ${winRate.reasons.length === 0 ? `<p class="dexHint">とくにゆうりな組み合わせは ないよ。</p>` : `
          <ul class="winReasons">
            ${winRate.reasons.map((reason) => `<li class="winReason ${reason.value > 0 ? "plus" : "minus"}">${reason.value > 0 ? "＋" : ""}${reason.value}% ${escapeHtml(reason.label)}</li>`).join("")}
          </ul>
        `}

        ${tacticGroup("defense", ["forecheck", "retreat"])}
        ${tacticGroup("attack", ["possession", "counter"])}
        ${tacticGroup("buildup", ["shortpass", "longpass"])}
      </section>

      <button class="primaryButton practiceStart" id="fightButton" ${state.soccer.battleTickets > 0 && placedCount > 0 ? "" : "disabled"}>たたかう（🎟${state.soccer.battleTickets}）</button>
    </main>
  `;

  document.querySelector("#backButton").addEventListener("click", () => {
    soccerScreen = { mode: "battleSelect" };
    render();
  });
  document.querySelector("#editTeamButton").addEventListener("click", () => {
    soccerScreen = { mode: "team", returnTo: "prematch" };
    render();
  });
  document.querySelector("#fightButton")?.addEventListener("click", playTodayLeagueMatch);
  document.querySelectorAll(".tacticChip").forEach((chip) => {
    chip.addEventListener("click", () => {
      setMyTacticField(chip.dataset.kind, chip.dataset.value);
      render();
    });
  });
}

function renderBattle() {
  window.onkeydown = null;
  const cpu = soccerScreen.opponent;
  const match = soccerScreen.match;

  app.innerHTML = `
    <main class="shell">
      <section class="quizHeader">
        <button class="iconButton" id="homeButton" aria-label="ホームへ戻る">←</button>
        <strong class="packTitle battleScore" id="battleScore">きみ 0 - 0 ${cpu.emoji}${escapeHtml(cpu.name)}</strong>
        <button class="secondaryButton" id="skipButton">とばす</button>
      </section>

      <section class="battlePitch" id="battlePitch">
        <div class="battleGoal left"></div>
        <div class="battleGoal right"></div>
        <div class="battleHalfLine"></div>
        <div class="battleCenterCircle"></div>
        ${match.tokens.map((token) => `
          <span class="pitchToken mine" data-token="${token.id}" data-x="${token.x}" data-y="${token.y}" style="left:${token.x}%;top:${token.y}%"><span class="tokenBody" style="animation-duration:${(2.4 + Math.random() * 1.8).toFixed(2)}s;animation-delay:-${(Math.random() * 3).toFixed(2)}s">${avatarHtml(findPlayerById(token.id) ?? { emoji: token.emoji }, 26)}</span></span>
        `).join("")}
        ${CPU_PITCH_COORDS.map((coord) => `
          <span class="pitchToken cpu" data-x="${100 - coord.x}" data-y="${coord.y}" style="left:${100 - coord.x}%;top:${coord.y}%"><span class="tokenBody" style="animation-duration:${(2.4 + Math.random() * 1.8).toFixed(2)}s;animation-delay:-${(Math.random() * 3).toFixed(2)}s">${cpu.emoji}</span></span>
        `).join("")}
        <span class="pitchBall" id="pitchBall" style="left:50%"></span>
      </section>

      <section class="resultActions battleActions" id="battleActions" hidden>
        <p class="battleResultText">${escapeHtml(soccerScreen.resultText)} <span class="xpGain">+${soccerScreen.reward} XP</span></p>
        <button class="primaryButton" id="leagueBackButton">🏆 リーグ表を見る</button>
        <button class="secondaryButton" id="teamFixButton">チームをなおす</button>
        <button class="secondaryButton" id="backHomeButton">ホーム</button>
      </section>

      <section class="battleLog" id="battleLog"></section>
    </main>
  `;

  const log = document.querySelector("#battleLog");
  const score = document.querySelector("#battleScore");
  const actions = document.querySelector("#battleActions");
  const pitch = document.querySelector("#battlePitch");
  const ball = document.querySelector("#pitchBall");
  let revealed = 0;

  const lerp = (from, to, t) => from + (to - from) * t;
  const clampPct = (value, min, max) => Math.min(max, Math.max(min, value));

  const animatePitch = (line) => {
    ball.style.left = `${line.ball}%`;
    const isNeutral = line.kind === "info";

    // 「現在地から目標へ6割だけ寄る」補間で、駒どうしの動きをなめらかに連続させる。
    // 目標＝定位置＋ボール側へのドリフト（駒ごとに引っぱられ方が違う）。
    pitch.querySelectorAll(".pitchToken").forEach((token) => {
      const baseX = Number(token.dataset.x);
      const baseY = Number(token.dataset.y);
      const currentX = parseFloat(token.style.left) || baseX;
      const currentY = parseFloat(token.style.top) || baseY;

      const pull = 0.10 + Math.random() * 0.22;
      const targetX = isNeutral ? baseX : baseX + (line.ball - 50) * pull;
      const targetY = isNeutral ? baseY : baseY + (Math.random() - 0.5) * 9;

      token.classList.remove("act");
      token.style.left = `${clampPct(lerp(currentX, targetX, 0.6), 4, 94)}%`;
      token.style.top = `${clampPct(lerp(currentY, targetY, 0.6), 12, 88)}%`;
    });

    if (line.actor) {
      const actorToken = pitch.querySelector(`.pitchToken[data-token="${line.actor}"]`);
      if (actorToken) {
        actorToken.classList.add("act");
        // 活躍中の選手はボールへ走りこむ（こちらは目標へ強めに寄せる）
        const currentX = parseFloat(actorToken.style.left) || Number(actorToken.dataset.x);
        const currentY = parseFloat(actorToken.style.top) || Number(actorToken.dataset.y);
        const lungeX = line.ball + (line.ball < 50 ? 5 : -7);
        const lungeY = 50 + (Math.random() - 0.5) * 12;
        actorToken.style.left = `${clampPct(lerp(currentX, lungeX, 0.85), 4, 94)}%`;
        actorToken.style.top = `${clampPct(lerp(currentY, lungeY, 0.85), 12, 88)}%`;
      }
    }

    if (line.flash) {
      pitch.classList.remove("flash-goal", "flash-danger");
      void pitch.offsetWidth;
      pitch.classList.add(`flash-${line.flash}`);
    }
  };

  const revealLine = () => {
    const line = match.lines[revealed];
    if (!line) return finishReveal();
    const div = document.createElement("div");
    div.className = `battleLine ${line.kind}`;
    div.textContent = line.text;
    // 新しい実況を上に積む（画面が下へスクロールしていかないように）
    log.prepend(div);
    score.textContent = `きみ ${line.my} - ${line.cpu} ${cpu.emoji}${cpu.name}`;
    animatePitch(line);
    revealed += 1;
    if (revealed >= match.lines.length) finishReveal();
  };

  const finishReveal = () => {
    if (battleTimer) {
      window.clearInterval(battleTimer);
      battleTimer = null;
    }
    while (revealed < match.lines.length) revealLine();
    actions.hidden = false;
  };

  revealLine();
  battleTimer = window.setInterval(revealLine, 900);

  document.querySelector("#skipButton").addEventListener("click", finishReveal);
  document.querySelector("#homeButton").addEventListener("click", () => {
    soccerScreen = null;
    render();
  });
  document.querySelector("#leagueBackButton").addEventListener("click", () => {
    soccerScreen = { mode: "battleSelect" };
    render();
  });
  document.querySelector("#teamFixButton").addEventListener("click", () => {
    soccerScreen = { mode: "team" };
    render();
  });
  document.querySelector("#backHomeButton").addEventListener("click", () => {
    soccerScreen = null;
    render();
  });
}

function getCurrentSubject() {
  return subjects.find((subject) => subject.id === state.selectedSubject) ?? subjects[0];
}

function getSubjectQuestions(subjectId) {
  return allQuestions.filter((question) => question.subject === subjectId);
}

function findQuestionById(questionId) {
  return allQuestions.find((question) => question.id === questionId);
}

function switchSubject(subjectId) {
  state.selectedSubject = subjectId;
  saveState(state);
  renderHome();
}

function toggleUnit(unitId) {
  const unlocked = new Set(state.unlockedUnits);
  if (unlocked.has(unitId)) {
    unlocked.delete(unitId);
  } else {
    unlocked.add(unitId);
  }
  state.unlockedUnits = [...unlocked];
  saveState(state);
  render();
}

function unlockEverything() {
  const allUnitIds = subjects.flatMap((subject) => subject.units.map((unit) => unit.id));
  state.unlockedUnits = [...new Set([...state.unlockedUnits, ...allUnitIds])];
  saveState(state);
  render();
}

function resetAll() {
  if (!window.confirm("本当にぜんぶの記録を消しますか？")) return;
  state = resetState();
  session = null;
  soccerScreen = null;
  settingsOpen = false;
  render();
}

function shuffle(values) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

render();

import { subjects } from "./curriculum.js?v=40";
import { loadState, resetState, saveState } from "./storage.js?v=40";
import { selectHighlights, buildHighlightScenes } from "./battleHighlights.js?v=40";
import { START_TYPES } from "./data/soccer/highlightScenes.js?v=40";

const allQuestions = [
  ...(window.CHIBI_QUEST_QUESTIONS ?? []),
  ...(window.CHIBI_QUEST_JAPANESE_QUESTIONS ?? []),
  ...(window.CHIBI_QUEST_SOCIAL_QUESTIONS ?? []),
  ...(window.CHIBI_QUEST_ENGLISH_QUESTIONS ?? []),
  ...(window.CHIBI_QUEST_SCIENCE_QUESTIONS ?? [])
];
const soccerPlayers = window.CHIBI_QUEST_SOCCER_PLAYERS ?? [];
// パック・図鑑の対象（スターターれんしゅうせいは除く）
const collectiblePlayers = soccerPlayers.filter((player) => !player.starter);
const starterPlayers = soccerPlayers.filter((player) => player.starter);
// A以上かくていパックの排出対象（Tier S・Aのみ）
const guaranteedPlayerPool = collectiblePlayers.filter((player) => player.tier === "S" || player.tier === "A");
// 現在排出中の最新弾（既存プレイヤーの最大wave値）
const CURRENT_WAVE = collectiblePlayers.reduce((max, player) => Math.max(max, player.wave ?? 1), 1);
const PLAYER_PACK_DRAW_COUNT = 1;
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

// 戦術・特性のかんたんせつめい（❓ヒント表示用）
const TACTIC_HINTS = {
  forecheck: "前からすばやくボールをうばいにいく、守り方だよ。",
  retreat: "後ろにさがって、しっかり守るねばり強い守り方だよ。",
  possession: "パスをつないで、ボールを持ち続ける攻め方だよ。",
  counter: "すきをついて、いっきにスピードで攻める攻め方だよ。",
  shortpass: "近くの味方に、細かくパスをつなぐ組み立て方だよ。",
  longpass: "遠くまで、大きくボールを送る組み立て方だよ。"
};
const TRAIT_HINTS = {
  "ボール奪取": "相手からボールをうばうのが得意だよ。",
  "スタミナ": "さいごまで元気に走り続けられるよ。",
  "アグレッシブ": "強気にぶつかっていけるよ。",
  "プレッシャー": "相手にプレッシャーをかけて、あせらせるよ。",
  "飛び出し（GK）": "キーパーが前に出て、ピンチを防ぐよ。",
  "カバーリング": "味方の後ろを、しっかりカバーするよ。",
  "空中戦": "ジャンプして、ヘディングで競り勝つよ。",
  "守備ポジショニング": "守る場所どりが、うまいよ。",
  "対人守備": "1対1の守りに、強いよ。",
  "GKセービング": "キーパーがシュートを止めるのが、得意だよ。",
  "パス精度": "正確なパスを、味方に届けられるよ。",
  "トラップ": "ボールを、ピタッと止められるよ。",
  "視野": "まわりがよく見えていて、パスコースを見つけるよ。",
  "ボールキープ": "相手にボールを、取られにくいよ。",
  "ドリブル": "ボールを持って、相手をかわすのが得意だよ。",
  "スピード": "とにかく、足が速いよ。",
  "裏抜け": "相手の後ろへ、すばやく走りこむよ。",
  "決定力": "チャンスを、しっかりゴールに決めるよ。",
  "瞬発力": "一瞬で、トップスピードに入れるよ。",
  "オフザボール": "ボールがない時の動き方が、うまいよ。",
  "ワンタッチパス": "パスを止めずに、すぐつなげるよ。",
  "スルーパス": "相手の間を通す、鋭いパスが出せるよ。",
  "テクニック": "細かいボールさばきが、うまいよ。",
  "コントロールシュート": "ねらったところに、シュートを打てるよ。",
  "敏捷性": "すばやく、体の向きを変えられるよ。",
  "ロングフィード": "遠くの味方へ、正確に大きいパスを送れるよ。",
  "クロス精度": "サイドから、正確なクロスを上げられるよ。",
  "ロングシュート": "遠くからでも、強いシュートが打てるよ。",
  "ターゲットマン": "前線で、ボールを収めるのがうまいよ。",
  "フィジカル": "体が強くて、当たり負けしないよ。"
};

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
const BUILDUP_BONUS = 3;

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
  // ビルドアップ：自分と相手のタイプが違えば、自分のペースを押しつけやすい（対称。同じタイプは補正なし）
  const buildupBonus = myTactics.buildup !== oppTactics.buildup ? BUILDUP_BONUS : 0;
  if (buildupBonus !== 0) {
    reasons.push({
      kind: "tactic",
      label: `${TACTIC_LABELS[myTactics.buildup]}が${TACTIC_LABELS[oppTactics.buildup]}に有利`,
      value: buildupBonus
    });
  }
  const tacticTotal = defVsAtk + atkVsDef + buildupBonus;

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
// リーグ参加チーム（きみ以外の7チーム）。守備・攻撃・ビルドアップの組み合わせが7チームすべて異なり、
// ステータス配分もチームごとにはっきり尖らせてある（弱点が一目でわかるように）
const LEAGUE_CPU_TEAMS = [
  { id: "cpu_1", name: "ブレイブドラゴンズ", emoji: "🐲", blurb: "中盤支配の技巧派。両端はうすい", mid: 7, def: 3, atk: 6, gk: 3, tactics: { defense: "forecheck", attack: "possession", buildup: "shortpass" } },
  { id: "cpu_2", name: "コズミックFC", emoji: "🌌", blurb: "GK起点の大展開。守備ラインはうすい", mid: 6, def: 3, atk: 5, gk: 7, tactics: { defense: "forecheck", attack: "possession", buildup: "longpass" } },
  { id: "cpu_3", name: "サンダーボルトFC", emoji: "⚡", blurb: "一撃必殺の速攻。守りはガラス", mid: 5, def: 3, atk: 8, gk: 3, tactics: { defense: "forecheck", attack: "counter", buildup: "shortpass" } },
  { id: "cpu_4", name: "レジェンドクラウンズ", emoji: "👑", blurb: "弱点なしの最強格", mid: 5, def: 5, atk: 7, gk: 7, tactics: { defense: "forecheck", attack: "counter", buildup: "longpass" } },
  { id: "cpu_5", name: "のんびりフラワーズ", emoji: "🌼", blurb: "ひたすら崩れない。でもほぼ決めない", mid: 6, def: 6, atk: 2, gk: 5, tactics: { defense: "retreat", attack: "possession", buildup: "shortpass" } },
  { id: "cpu_6", name: "グレートウォールFC", emoji: "🛡", blurb: "攻撃力ほぼゼロ、伝説の鉄壁", mid: 3, def: 9, atk: 2, gk: 8, tactics: { defense: "retreat", attack: "counter", buildup: "shortpass" } },
  { id: "cpu_7", name: "トルネードランナーズ", emoji: "🌪", blurb: "一発の速さ頼み、脆さも一級品", mid: 3, def: 4, atk: 7, gk: 3, tactics: { defense: "retreat", attack: "counter", buildup: "longpass" } }
];
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
const BATTLE_EVENTS = 10;
let battleTimer = null;
const QUESTIONS_PER_SESSION = 10;
const QUESTIONS_PER_DAILY_SUBJECT = 10;
const DAILY_SUBJECT_ORDER = ["math", "japanese", "english", "science", "social"];
const RECENT_QUESTION_LIMIT = 120;
const RECENT_FAMILY_LIMIT = 80;
const POINTS_PER_PACK = 100;
// 1日に貯められるptの上限。日課の周回でのpt稼ぎすぎ（グラインド）を防ぐ
const DAILY_POINTS_CAP = 50;
// チーム編成の合計コスト上限（11人×平均コスト5.5相当）
const COST_BUDGET = 60;
const WEAK_SCORE_BOOST = 100;
// 出題優先度は最初に登場するdifficulty順(3→2→4→1)。刷新済み単元はd1〜d5を持つ
const DIFFICULTY_ORDER = [3, 3, 2, 3, 2, 4, 3, 2, 3, 1];
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
  const totalPoints = state.points ?? 0;
  const pointPacksAvailable = Math.floor(totalPoints / POINTS_PER_PACK);
  const barProgress = totalPoints % POINTS_PER_PACK;
  const dailyButtonLabel = isCompletedToday() ? "もう一回やる" : dailyInProgress ? "つづきから" : "はじめる";

  const waiting = state.soccer.playerPacks + state.soccer.battleTickets;

  app.innerHTML = `
    <main class="shell home">
      <section class="topbar">
        <div>
          <p class="eyebrow">ちびクエ</p>
          <h1>まいにち クエスト</h1>
        </div>
        <div class="levelBadge">
          <span>🎯 ${totalPoints}pt</span>
          <small>${pointPacksAvailable > 0 ? `パック${pointPacksAvailable}個 ひきかえOK！` : `あと${POINTS_PER_PACK - barProgress}ptで パック`}</small>
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
        <div class="xpTrack" aria-label="つぎのパックまでのポイント">
          <span style="width:${barProgress}%"></span>
        </div>
        <button class="primaryButton practiceStart" id="startButton" ${availableQuestions.length < QUESTIONS_PER_SESSION ? "disabled" : ""}>${escapeHtml(subject.label)}を 10問 スタート</button>
      </section>

      <button class="homeCard entryCard" id="soccerEntryButton" aria-label="サッカー">
        <div class="entryMain">
          <p class="eyebrow">⚽ サッカー</p>
          <h2 class="homeCardTitle">あそぶ・あつめる・たいせん</h2>
          <p class="entrySub">せんしゅ ${countOwnedPlayers()}/${collectiblePlayers.length}</p>
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
  const earnedPoints = correctCount;
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

  // ptは100を超えても自動でパックにはせず貯まり続ける。パックの受け取りはhubから手動で行う（openPointsPack）
  // ただし周回でのpt稼ぎすぎを防ぐため、1日に加算できるptにはDAILY_POINTS_CAPの上限がある
  const today = dateKey();
  if (state.pointsDaily?.date !== today) {
    state.pointsDaily = { date: today, earned: 0 };
  }
  const remainingDailyCap = Math.max(0, DAILY_POINTS_CAP - state.pointsDaily.earned);
  const awardedPoints = Math.min(earnedPoints, remainingDailyCap);
  const pointsCapped = awardedPoints < earnedPoints;
  state.pointsDaily.earned += awardedPoints;
  const previousPoints = state.points ?? 0;
  state.points = previousPoints + awardedPoints;
  const newPointPacksUnlocked = Math.floor(state.points / POINTS_PER_PACK) - Math.floor(previousPoints / POINTS_PER_PACK);
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
    earnedPoints: awardedPoints,
    pointsCapped,
    newPointPacksUnlocked,
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
        <p class="xpGain">+${session.earnedPoints}pt${session.newPointPacksUnlocked > 0 ? `　🎯 ポイントパックが引けるようになったよ！` : ""}</p>
        ${session.pointsCapped ? `<p class="ptCapNote">きょうのpt上限（${DAILY_POINTS_CAP}pt）に達したよ。また明日ためよう！</p>` : ""}
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
        <p class="xpGain">+${session.earnedPoints}pt / 🔥 れんぞく ${currentStreak()}日</p>
        ${session.pointsCapped ? `<p class="ptCapNote">きょうのpt上限（${DAILY_POINTS_CAP}pt）に達したよ。また明日ためよう！</p>` : ""}
        <div class="dailyBreakdown">${rows}</div>
        <div class="scoreCircle dailyScoreCircle">
          <strong>${session.correctCount}</strong>
          <span>/${total}</span>
        </div>
        ${session.packEarned ? `
          <div class="packBanner">
            <span class="packEmoji">🧑</span>
            <strong>せんしゅパック ＆ 🎟たいせん券を ゲット！</strong>
          </div>
        ` : ""}
        ${session.newPointPacksUnlocked > 0 ? `
          <div class="packBanner">
            <span class="packEmoji">🎯</span>
            <strong>100ptたっせい！ ポイントパックが引けるようになったよ！</strong>
          </div>
        ` : ""}
        <div class="resultActions">
          ${state.soccer.playerPacks > 0 ? `<button class="primaryButton" id="openPacksButton">パックをあける</button>` : ""}
          <button class="secondaryButton" id="homeButton">ホームへ</button>
          <button class="secondaryButton" id="againButton">もう一回</button>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#openPacksButton")?.addEventListener("click", () => {
    session = null;
    openPlayerPack();
  });
  document.querySelector("#againButton").addEventListener("click", startDaily);
  document.querySelector("#homeButton").addEventListener("click", () => {
    session = null;
    render();
  });
}

function renderSoccer() {
  if (soccerScreen.mode === "hub") {
    renderSoccerHub();
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
  if (soccerScreen.mode === "nominationPick") {
    renderNominationPick();
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
        ${tile("hubPlayerPack", "🧑", "せんしゅパック", `のこり ${s.playerPacks}こ`, s.playerPacks > 0 ? s.playerPacks : "", s.playerPacks <= 0)}
        ${pointPacksAvailable() > 0 ? tile("hubPointsPack", "🎯", "ポイントパック", `のこり ${pointPacksAvailable()}こ`, pointPacksAvailable(), false) : ""}
        ${(s.guaranteedPacks ?? 0) > 0 ? tile("hubGuaranteedPack", "🌟", "A以上かくていパック", `のこり ${s.guaranteedPacks}こ`, s.guaranteedPacks, false) : ""}
        ${(s.nominationRights ?? 0) > 0 ? tile("hubNomination", "👑", "せんしゅ指名権", `のこり ${s.nominationRights}こ`, s.nominationRights, false) : ""}
        ${tile("hubBattle", "🏆", "リーグ", `🎟 ${s.battleTickets}まい`, s.battleTickets > 0 ? s.battleTickets : "", false)}
        ${tile("hubTeam", "🧩", "チームへんせい", "せんしゅを ならべる", "", false)}
        ${tile("hubDex", "📖", "ずかん", `せんしゅ ${countOwnedPlayers()}/${collectiblePlayers.length}`, "", false)}
      </section>

      <p class="dexHint">いま排出中：<strong>第${CURRENT_WAVE}弾</strong>のカード。パックとたいせん券は、日課をクリアするともらえるよ。</p>
    </main>
  `;

  document.querySelector("#homeButton").addEventListener("click", () => {
    soccerScreen = null;
    render();
  });
  document.querySelector("#hubPlayerPack")?.addEventListener("click", openPlayerPack);
  document.querySelector("#hubPointsPack")?.addEventListener("click", openPointsPack);
  document.querySelector("#hubGuaranteedPack")?.addEventListener("click", openGuaranteedPack);
  document.querySelector("#hubNomination")?.addEventListener("click", () => {
    soccerScreen = { mode: "nominationPick" };
    render();
  });
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

function drawPlayer(pool = collectiblePlayers) {
  const unowned = pool.filter((player) => !(state.soccer.players[player.id] > 0));
  const drawPool = unowned.length > 0 ? unowned : pool;
  const totalWeight = drawPool.reduce((sum, player) => sum + (RARITY_WEIGHTS[player.rarity] ?? 1), 0);
  let roll = Math.random() * totalWeight;
  for (const player of drawPool) {
    roll -= RARITY_WEIGHTS[player.rarity] ?? 1;
    if (roll <= 0) return player;
  }
  return drawPool[drawPool.length - 1];
}

function drawAndOwnPlayer(pool = collectiblePlayers) {
  const player = drawPlayer(pool);
  const previousCount = state.soccer.players[player.id] ?? 0;
  state.soccer.players[player.id] = previousCount + 1;
  return { player, isNew: previousCount === 0, count: previousCount + 1 };
}

function openPlayerPack() {
  if (state.soccer.playerPacks <= 0) return;
  state.soccer.playerPacks = Math.max(0, state.soccer.playerPacks - 1);

  const results = [];
  for (let i = 0; i < PLAYER_PACK_DRAW_COUNT; i += 1) {
    results.push(drawAndOwnPlayer());
  }
  saveState(state);

  session = null;
  soccerScreen = { mode: "playerReveal", results };
  render();
}

function openGuaranteedPack() {
  if ((state.soccer.guaranteedPacks ?? 0) <= 0) return;
  state.soccer.guaranteedPacks -= 1;
  const results = [drawAndOwnPlayer(guaranteedPlayerPool)];
  saveState(state);

  session = null;
  soccerScreen = { mode: "playerReveal", results, guaranteed: true };
  render();
}

function pointPacksAvailable() {
  return Math.floor((state.points ?? 0) / POINTS_PER_PACK);
}

function openPointsPack() {
  if (pointPacksAvailable() <= 0) return;
  state.points -= POINTS_PER_PACK;
  const results = [drawAndOwnPlayer()];
  saveState(state);

  session = null;
  soccerScreen = { mode: "playerReveal", results };
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
  const traits = player.traits ?? [];
  const unlocked = new Set(unlockedTraitsFor(player));
  return `
    <article class="playerCard pos-${player.position.toLowerCase()}${kira}">
      <header class="playerCardHead">
        <span class="posBadge">${escapeHtml(player.position)}</span>
        ${player.wave ? `<span class="waveBadge">第${player.wave}弾</span>` : ""}
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
      ${traits.length > 0 ? `
        <div class="traitSection">
          <details class="hintDetails tacticHint">
            <summary class="traitTactic">🎯 得意戦術：${escapeHtml(TACTIC_LABELS[player.specialtyTactic] ?? "")} <span class="hintBadge">❓</span></summary>
            <p class="hintText">${escapeHtml(TACTIC_HINTS[player.specialtyTactic] ?? "")}</p>
          </details>
          <div class="traitChips">
            ${traits.map((trait) => {
              const isUnlocked = unlocked.has(trait);
              return `
                <details class="hintDetails traitChip ${isUnlocked ? "unlocked" : "locked"}">
                  <summary>${isUnlocked ? "✨" : "🔒"} ${escapeHtml(trait)} <span class="hintBadge">❓</span></summary>
                  <p class="hintText">${escapeHtml(TRAIT_HINTS[trait] ?? "")}</p>
                </details>
              `;
            }).join("")}
          </div>
        </div>
      ` : ""}
    </article>
  `;
}

function renderPlayerReveal() {
  window.onkeydown = null;
  const { results } = soccerScreen;
  const newCount = results.filter((entry) => entry.isNew).length;
  const headline = newCount === 0
    ? "また 会えた！"
    : results.length > 1 ? `せんしゅ ${results.length}人 ゲット！` : "せんしゅ ゲット！";

  app.innerHTML = `
    <main class="shell resultShell">
      <section class="resultPanel soccerRevealPanel">
        <p class="eyebrow">${soccerScreen.nominated ? "👑 せんしゅ指名権" : soccerScreen.guaranteed ? "🌟 A以上かくていパック かいふう" : `🧑 せんしゅパック かいふう（第${CURRENT_WAVE}弾）`}</p>
        <h1>${headline}</h1>
        <div class="packRevealGrid">
          ${results.map((entry) => `
            <div class="cardRevealWrap shine">
              ${renderPlayerCardFace(entry.player, { kira: true })}
              <p class="soccerRevealNote">
                ${entry.isNew ? `<strong>NEW!</strong> ずかんに とうろくされたよ` : `${entry.count}まい目！`}
              </p>
            </div>
          `).join("")}
        </div>
        <div class="resultActions">
          ${state.soccer.playerPacks > 0 ? `<button class="primaryButton" id="nextPlayerPackButton">もう1パック（のこり${state.soccer.playerPacks}）</button>` : ""}
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

function renderNominationPick() {
  window.onkeydown = null;
  if ((state.soccer.nominationRights ?? 0) <= 0) {
    soccerScreen = { mode: "hub" };
    render();
    return;
  }
  const sorted = [...collectiblePlayers].sort((a, b) => {
    const posDiff = (POSITION_ORDER[a.position] ?? 9) - (POSITION_ORDER[b.position] ?? 9);
    return posDiff !== 0 ? posDiff : a.playerNo - b.playerNo;
  });

  app.innerHTML = `
    <main class="shell">
      <section class="quizHeader">
        <button class="iconButton" id="backButton" aria-label="サッカーへもどる">←</button>
        <strong class="packTitle">👑 せんしゅ指名権</strong>
        <span></span>
      </section>
      <p class="dexHint">好きな選手を1人えらぼう。かならず その選手が手に入るよ！（のこり${state.soccer.nominationRights}こ）</p>
      <section class="pickList">
        ${sorted.map((player) => {
          const count = state.soccer.players[player.id] ?? 0;
          return `
            <button class="pickRow pos-${player.position.toLowerCase()}" data-player="${player.id}">
              <span class="dexPlayerAvatar">${avatarHtml(player, 28)}</span>
              <span class="pickRowMain">
                <strong>${escapeHtml(player.name)}</strong>
                <small>${player.flag} ${escapeHtml(player.club)}</small>
              </span>
              <span class="posBadge">${escapeHtml(player.position)}</span>
              <span class="pickRowPower">💪${playerPower(player)}</span>
              <span class="pickRowTag">${count > 0 ? `所持×${count}` : ""}</span>
            </button>
          `;
        }).join("")}
      </section>
    </main>
  `;

  document.querySelector("#backButton").addEventListener("click", () => {
    soccerScreen = { mode: "hub" };
    render();
  });
  document.querySelectorAll(".pickRow").forEach((row) => {
    row.addEventListener("click", () => {
      if ((state.soccer.nominationRights ?? 0) <= 0) return;
      const playerId = row.dataset.player;
      state.soccer.nominationRights -= 1;
      const previousCount = state.soccer.players[playerId] ?? 0;
      state.soccer.players[playerId] = previousCount + 1;
      saveState(state);
      soccerScreen = {
        mode: "playerReveal",
        results: [{ player: findPlayerById(playerId), isNew: previousCount === 0, count: previousCount + 1 }],
        nominated: true
      };
      render();
    });
  });
}

function rarityStars(rarity) {
  return "⭐".repeat(rarity);
}

function renderSoccerDex() {
  window.onkeydown = null;
  const title = `🧑 せんしゅ図鑑 ${countOwnedPlayers()}/${collectiblePlayers.length}`;

  app.innerHTML = `
    <main class="shell">
      <section class="quizHeader">
        <button class="iconButton" id="homeButton" aria-label="ホームへ戻る">←</button>
        <strong class="packTitle">${title}</strong>
        <span></span>
      </section>

      <section class="dexGrid">
        ${renderPlayerDexTiles()}
      </section>

      <p class="dexHint">日課をクリアすると、あたらしいパックがもらえるよ！</p>
    </main>
  `;

  document.querySelector("#homeButton").addEventListener("click", () => {
    soccerScreen = null;
    render();
  });
  document.querySelectorAll(".dexTile[data-player]").forEach((tile) => {
    tile.addEventListener("click", () => {
      soccerScreen = { mode: "playerDetail", playerId: tile.dataset.player };
      render();
    });
  });
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
  const slotDefs = formationSlots(team.formation);
  if (!Array.isArray(team.slots) || team.slots.length !== slotDefs.length) {
    const previousIds = Array.isArray(team.slots) ? team.slots.filter(Boolean) : [];
    // スターター未所持ぶんを補って初期チームを組む（旧セーブや新規プレイ時）
    const fillerIds = previousIds.length > 0 ? previousIds : STARTER_SLOT_FILL.filter((id) => isPlayerAvailable(findPlayerById(id)));
    team.slots = remapPlayersToFormation(fillerIds, team.formation);
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
  saveState(state);
}

function findPlayerById(playerId) {
  return soccerPlayers.find((player) => player.id === playerId);
}

function playerPower(player) {
  const total = PLAYER_STAT_LABELS.reduce((sum, [key]) => sum + (player.stats[key] ?? 0), 0);
  return Math.round(total / PLAYER_STAT_LABELS.length);
}

function computeTeamPower() {
  const team = getTeam();
  let power = 0;
  team.slots.forEach((playerId) => {
    const player = playerId ? findPlayerById(playerId) : null;
    if (!player) return;
    power += playerPower(player);
  });
  return power;
}

function computeTeamCost() {
  const team = getTeam();
  return team.slots.reduce((sum, playerId) => sum + (findPlayerById(playerId)?.cost ?? 0), 0);
}

// slotIndexにincomingPlayerIdを置いた場合の合計コスト（既存の同選手の重複や、入れ替え先の選手ぶんは除いて計算）
function projectedTeamCost(slotIndex, incomingPlayerId) {
  const team = getTeam();
  const incomingCost = findPlayerById(incomingPlayerId)?.cost ?? 0;
  let total = incomingCost;
  team.slots.forEach((playerId, idx) => {
    if (idx === slotIndex || playerId === incomingPlayerId) return;
    total += findPlayerById(playerId)?.cost ?? 0;
  });
  return total;
}

function placePlayer(slotIndex, playerId) {
  if (projectedTeamCost(slotIndex, playerId) > COST_BUDGET) return;
  const team = getTeam();
  const existingIndex = team.slots.indexOf(playerId);
  if (existingIndex >= 0 && existingIndex !== slotIndex) {
    team.slots[existingIndex] = null;
  }
  team.slots[slotIndex] = playerId;
  saveState(state);
}

function removeFromSlot(slotIndex) {
  const team = getTeam();
  team.slots[slotIndex] = null;
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

  const mismatch = player.position !== slotPos;
  return `
    <button class="teamSlot filled pos-${slotPos.toLowerCase()} ${mismatch ? "mismatch" : ""}" data-slot="${slotIndex}">
      <span class="teamSlotAvatar">${avatarHtml(player, 32)}</span>
      <span class="teamSlotName">${escapeHtml(player.name.length > 6 ? `${player.name.slice(0, 6)}…` : player.name)}</span>
      ${mismatch ? `<span class="teamSlotWarn">${escapeHtml(player.position)}</span>` : ""}
    </button>
  `;
}

function renderTeam() {
  window.onkeydown = null;
  const team = getTeam();
  const memberCount = team.slots.filter(Boolean).length;
  const rows = formationRows(team.formation);
  const returnTo = soccerScreen?.returnTo ?? null;

  app.innerHTML = `
    <main class="shell">
      <section class="quizHeader">
        <button class="iconButton" id="homeButton" aria-label="もどる">←</button>
        <strong class="packTitle">⚽ チームへんせい ${memberCount}/${formationSlots(team.formation).length}人</strong>
        <span class="teamPower">💪 ${computeTeamPower()}</span>
      </section>

      <p class="costBudget ${computeTeamCost() > COST_BUDGET ? "over" : ""}">💰 コスト ${computeTeamCost()}/${COST_BUDGET}</p>

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

      <p class="dexHint">マスをタップして 選手をえらぼう。</p>
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

      <p class="dexHint">💰 コスト ${computeTeamCost()}/${COST_BUDGET}</p>
      <p class="pickError" id="pickError" hidden></p>

      ${sorted.length === 0 ? `
        <p class="dexHint">まだ選手がいないよ。日課をクリアして 🧑せんしゅパックを あけよう！</p>
      ` : `
        <section class="pickList">
          ${sorted.map((player) => {
            const inSlot = team.slots.indexOf(player.id);
            const fit = player.position === slotPos;
            const overBudget = projectedTeamCost(slotIndex, player.id) > COST_BUDGET;
            return `
              <button class="pickRow pos-${player.position.toLowerCase()} ${overBudget ? "overBudget" : ""}" data-player="${player.id}" data-over-budget="${overBudget}">
                <span class="dexPlayerAvatar">${avatarHtml(player, 28)}</span>
                <span class="pickRowMain">
                  <strong>${escapeHtml(player.name)}</strong>
                  <small>${player.flag} ${escapeHtml(player.club)}</small>
                </span>
                <span class="posBadge">${escapeHtml(player.position)}</span>
                <span class="pickRowPower">💪${playerPower(player)}・💰${player.cost ?? 0}</span>
                <span class="pickRowTag">${overBudget ? "コストオーバー" : fit ? "✨ぴったり" : ""}${inSlot >= 0 ? " 出場中" : ""}</span>
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
      const playerId = row.dataset.player;
      if (row.dataset.overBudget === "true") {
        const player = findPlayerById(playerId);
        const projected = projectedTeamCost(slotIndex, playerId);
        const errorBox = document.querySelector("#pickError");
        errorBox.textContent = `💰 コストオーバー！ ${player?.name ?? ""}を入れると コストが ${projected}/${COST_BUDGET} になっちゃうよ。`;
        errorBox.hidden = false;
        row.classList.remove("shake");
        void row.offsetWidth;
        row.classList.add("shake");
        return;
      }
      placePlayer(slotIndex, playerId);
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
  app.innerHTML = `
    <main class="shell resultShell">
      <section class="resultPanel soccerRevealPanel">
        <p class="eyebrow">⚽ ${escapeHtml(formationSlots(team.formation)[slotIndex].pos)}マスの選手</p>
        <div class="cardRevealWrap">
          ${renderPlayerCardFace(player, {})}
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
  let playerPacks = 0;
  let guaranteedPacks = 0;
  let nominationRights = 0;
  if (rank === 1) { nominationRights = 1; guaranteedPacks = 1; playerPacks = 3; }
  else if (rank === 2) { guaranteedPacks = 1; playerPacks = 3; }
  else if (rank === 3) { playerPacks = 3; }
  else if (rank === 4) { playerPacks = 2; }
  else { playerPacks = 1; }

  state.soccer.playerPacks += playerPacks;
  state.soccer.guaranteedPacks = (state.soccer.guaranteedPacks ?? 0) + guaranteedPacks;
  state.soccer.nominationRights = (state.soccer.nominationRights ?? 0) + nominationRights;
  return { playerPacks, guaranteedPacks, nominationRights };
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
  return { dayIndex, oppTeamIndex, opponent: LEAGUE_CPU_TEAMS[oppTeamIndex - 1] };
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
    placed.push({ player, slotIndex, slotPos: slotDefs[slotIndex].pos });
  });

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

  return { placed, mid: Math.max(mid, 0.5), def: Math.max(def, 0.5), gk, gkEntry, dfEntries, attackers };
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
    flash: extra.flash ?? null,
    // ハイライト演出（battleHighlights.js）向けのメタデータ。試合結果の計算には一切使わない。
    attackingSide: extra.attackingSide ?? null,
    outcome: extra.outcome ?? null
  });

  push(`しあいスタート！ きみのチーム 対 ${cpu.emoji}${cpu.name}！`, "info", { ball: 50 });

  for (let event = 0; event < BATTLE_EVENTS; event += 1) {
    if (event === BATTLE_EVENTS / 2) {
      push(`⏱ 前半おわり　${myScore} - ${cpuScore}`, "info", { ball: 50 });
    }

    const pAttack = clampChance(0.5 + (my.mid - cpu.mid) * 0.04 + bonus * 0.4, 0.2, 0.8);
    if (Math.random() < pAttack) {
      const attacker = weightedPick(my.attackers);
      if (!attacker) continue;
      const player = attacker.player;
      const breakScore = Math.max(player.stats.dribble, player.stats.speed);
      const breakChance = clampChance(0.4 + (breakScore - cpu.def) * 0.06 + bonus * 0.3, 0.15, 0.85);

      if (Math.random() >= breakChance) {
        push(`${player.emoji}${player.name}が しかけたが、${cpu.name}に とめられた！`, "chance", { ball: 65, actor: player.id, attackingSide: "player", outcome: "tackle" });
        continue;
      }

      const useHeading = player.stats.heading > player.stats.shoot;
      const shootStat = useHeading ? player.stats.heading : player.stats.shoot;
      const goalChance = clampChance(0.35 + (shootStat - cpu.gk) * 0.07 + bonus * 0.3, 0.12, 0.8);

      if (Math.random() < goalChance) {
        myScore += 1;
        push(`⚽ ゴーール！！ ${player.emoji}${player.name}が${useHeading ? " ヘディングで" : ""} きめた！`, "goal", { ball: 98, actor: player.id, flash: "goal", attackingSide: "player", outcome: "goal" });
      } else {
        push(`${player.emoji}${player.name}のシュート！ …キーパーに とめられた！`, "chance", { ball: 88, actor: player.id, attackingSide: "player", outcome: "save" });
      }
    } else {
      const breakChance = clampChance(0.4 + (cpu.atk - my.def) * 0.06 - bonus * 0.3, 0.15, 0.85);
      if (Math.random() >= breakChance) {
        const defender = my.dfEntries.length > 0 ? my.dfEntries[Math.floor(Math.random() * my.dfEntries.length)] : null;
        push(`ナイスまもり！ ${defender ? `${defender.player.emoji}${defender.player.name}` : "みんな"}が ボールをうばった！`, "good", { ball: 35, actor: defender?.player.id ?? null, attackingSide: "cpu", outcome: "tackle" });
        continue;
      }
      const goalChance = clampChance(0.35 + (cpu.atk - my.gk) * 0.07 - bonus * 0.3, 0.12, 0.8);
      if (Math.random() < goalChance) {
        cpuScore += 1;
        push(`😱 ${cpu.emoji}${cpu.name}のシュートが きまってしまった…`, "danger", { ball: 2, flash: "danger", attackingSide: "cpu", outcome: "goal" });
      } else {
        push(`あぶない！ でも ${my.gkEntry ? `${my.gkEntry.player.emoji}${my.gkEntry.player.name}` : "キーパー"}が ビッグセーブ！`, "good", { ball: 10, actor: my.gkEntry?.player.id ?? null, attackingSide: "cpu", outcome: "save" });
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

  return { lines, myScore, cpuScore, tokens, placed: tagWidePlacements(my.placed, getTeam().formation) };
}

// 同じslotPos内でy座標が最小/最大の選手を「ワイド」とみなす（新規データフィールドを増やさずに左右サイドを判定するため）。
function tagWidePlacements(placed, formationKey) {
  const coords = formationPitchCoords(formationKey);
  const bySlotPos = new Map();
  placed.forEach((entry) => {
    const list = bySlotPos.get(entry.slotPos) ?? [];
    list.push(entry);
    bySlotPos.set(entry.slotPos, list);
  });

  const wideSlotIndexes = new Set();
  for (const group of bySlotPos.values()) {
    if (group.length < 2) continue;
    const ys = group.map((entry) => coords[entry.slotIndex].y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    group.forEach((entry) => {
      const y = coords[entry.slotIndex].y;
      if (y === minY || y === maxY) wideSlotIndexes.add(entry.slotIndex);
    });
  }

  return placed.map((entry) => ({ ...entry, wide: wideSlotIndexes.has(entry.slotIndex) }));
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
  match.highlights = buildHighlightScenes(selectHighlights(match.lines), match.placed, getMyTactics(), fixture.opponent);
  // Phase 1検証用: レンダリングには未接続。選定・組み立てが意図通りか目視確認するためのログ。
  console.debug("[battleHighlights]", match.highlights);
  state.soccer.battleTickets -= 1;

  let outcome = "loss";
  let oppOutcome = "win";
  let resultText = "まけちゃった… でも いい経験！";
  if (match.myScore > match.cpuScore) {
    outcome = "win";
    oppOutcome = "loss";
    resultText = "🏆 しょうり！！";
  } else if (match.myScore === match.cpuScore) {
    outcome = "draw";
    oppOutcome = "draw";
    resultText = "ひきわけ！ おしい！";
  }

  applyResultToStandings(state.soccer.league.standings, 0, outcome);
  applyResultToStandings(state.soccer.league.standings, fixture.oppTeamIndex, oppOutcome);
  state.soccer.league.playedDays[fixture.dayIndex] = { kind: outcome, myScore: match.myScore, cpuScore: match.cpuScore };

  saveState(state);

  soccerScreen = { mode: "battle", opponent: fixture.opponent, match, resultText };
  render();
}

function formatRewardBreakdown(reward) {
  const parts = [];
  if (reward.nominationRights > 0) parts.push(`👑 せんしゅ指名権×${reward.nominationRights}`);
  if (reward.guaranteedPacks > 0) parts.push(`🌟 A以上かくていパック×${reward.guaranteedPacks}`);
  if (reward.playerPacks > 0) parts.push(`🧑 通常パック×${reward.playerPacks}`);
  return parts.length > 0 ? parts.join("　") : "なし";
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
        <p class="entrySub">${escapeHtml(fixture.opponent.blurb ?? "")}</p>
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

      ${league.lastReward ? `
        <section class="settingsCard lastRewardCard">
          <p class="eyebrow">先週の じゅんい ほうしゅう</p>
          <p class="lastRewardRank">${league.lastReward.rank}位</p>
          <p class="lastRewardBreakdown">${formatRewardBreakdown(league.lastReward)}</p>
        </section>
      ` : ""}

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

  // この相手に対して、守備・攻撃それぞれどちらの選択肢が有利かを事前計算（選択前でも分かるヒント用）
  const bestOf = (options, oppValue) => options.reduce((best, opt) => {
    const bonus = TACTIC_MATCHUP_BONUS[`${opt}_vs_${oppValue}`] ?? 0;
    return bonus > best.bonus ? { opt, bonus } : best;
  }, { opt: null, bonus: 0 });
  const bestDef = bestOf(["forecheck", "retreat"], cpu.tactics.attack);
  const bestAtk = bestOf(["possession", "counter"], cpu.tactics.defense);
  // ビルドアップは対称ルールなので、相手と違うタイプが常に有利
  const bestBuildup = { opt: cpu.tactics.buildup === "shortpass" ? "longpass" : "shortpass", bonus: BUILDUP_BONUS };

  const tacticGroup = (kind, options, recommended) => `
    <div class="tacticGroup">
      <p class="tacticGroupLabel">${{ defense: "守備", attack: "攻撃", buildup: "ビルドアップ" }[kind]}</p>
      <div class="tacticChips">
        ${options.map((opt) => `
          <button class="tacticChip ${myTactics[kind] === opt ? "active" : ""}" data-kind="${kind}" data-value="${opt}">
            ${TACTIC_LABELS[opt]}${recommended === opt ? ` <span class="recommendBadge">💡</span>` : ""}
          </button>
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
        <p class="entrySub">${escapeHtml(cpu.blurb ?? "")}・${TACTIC_LABELS[cpu.tactics.defense]}/${TACTIC_LABELS[cpu.tactics.attack]}/${TACTIC_LABELS[cpu.tactics.buildup]}</p>
      </section>

      <section class="settingsCard matchupHint">
        <p class="matchupHintTitle">💡 この相手に有効な戦術</p>
        <p class="matchupHintLine">${bestDef.opt ? `守備は「${TACTIC_LABELS[bestDef.opt]}」が有利だよ（＋${bestDef.bonus}%）` : "守備はどちらでも大きな差はないよ"}</p>
        <p class="matchupHintLine">${bestAtk.opt ? `攻撃は「${TACTIC_LABELS[bestAtk.opt]}」が有利だよ（＋${bestAtk.bonus}%）` : "攻撃はどちらでも大きな差はないよ"}</p>
        <p class="matchupHintLine">ビルドアップは「${TACTIC_LABELS[bestBuildup.opt]}」が有利だよ（＋${bestBuildup.bonus}%）</p>
        <p class="matchupHintLine">🎯 選んだ戦術に合う特性を持つ選手を並べると、さらに有利になるよ</p>
      </section>

      <section class="settingsCard winRateCard">
        <p class="eyebrow">きみの チーム：${placedCount}/${formationSlots(team.formation).length}人・💪${computeTeamPower()}・💰${computeTeamCost()}/${COST_BUDGET}</p>
        <button class="secondaryButton" id="editTeamButton">チームをへんせいする（${FORMATIONS[team.formation].label}）</button>

        <p class="winRateBig">かちめ ${winRate.finalPercent}%</p>
        ${winRate.reasons.length === 0 ? `<p class="dexHint">とくにゆうりな組み合わせは ないよ。</p>` : `
          <ul class="winReasons">
            ${winRate.reasons.map((reason) => `<li class="winReason ${reason.value > 0 ? "plus" : "minus"}">${reason.value > 0 ? "＋" : ""}${reason.value}% ${escapeHtml(reason.label)}</li>`).join("")}
          </ul>
        `}

        ${tacticGroup("defense", ["forecheck", "retreat"], bestDef.opt)}
        ${tacticGroup("attack", ["possession", "counter"], bestAtk.opt)}
        ${tacticGroup("buildup", ["shortpass", "longpass"], bestBuildup.opt)}
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
        <div class="highlightOverlay" id="highlightOverlay" hidden></div>
      </section>

      <section class="resultActions battleActions" id="battleActions" hidden>
        <p class="battleResultText">${escapeHtml(soccerScreen.resultText)}</p>
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
  const overlay = document.querySelector("#highlightOverlay");
  let revealed = 0;
  let skipped = false;
  let inHighlight = false;
  let overlayTimer = null;
  const highlightByLineIndex = new Map((match.highlights ?? []).map((highlight) => [highlight.lineIndex, highlight]));

  const lerp = (from, to, t) => from + (to - from) * t;
  const clampPct = (value, min, max) => Math.min(max, Math.max(min, value));

  // lerpで寄せつつ、1ティックの移動量そのものに上限をかける（目標が大きく飛ぶ場面でも急ワープに見えないように）
  const stepToward = (currentX, currentY, targetX, targetY, t, maxStepX, maxStepY) => {
    const dx = clampPct(lerp(currentX, targetX, t) - currentX, -maxStepX, maxStepX);
    const dy = clampPct(lerp(currentY, targetY, t) - currentY, -maxStepY, maxStepY);
    return { x: clampPct(currentX + dx, 4, 94), y: clampPct(currentY + dy, 12, 88) };
  };

  const tokenPos = (token) => ({
    x: parseFloat(token.style.left) || Number(token.dataset.x),
    y: parseFloat(token.style.top) || Number(token.dataset.y)
  });

  const nearestTokens = (selector, fromX, fromY, exclude, count) => {
    return [...pitch.querySelectorAll(selector)]
      .filter((token) => token !== exclude)
      .map((token) => {
        const { x, y } = tokenPos(token);
        return { token, x, y, dist: Math.hypot(x - fromX, y - fromY) };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, count);
  };

  const animatePitch = (line) => {
    ball.style.left = `${line.ball}%`;
    const isNeutral = line.kind === "info";
    const myTactics = getMyTactics();
    // ポゼッションはコンパクトに寄り、カウンターは広がる（戦術差をドリフトの強さに少しだけ反映）
    const compactness = myTactics.attack === "possession" ? 1.3 : myTactics.attack === "counter" ? 0.75 : 1;
    const actorToken = line.actor ? pitch.querySelector(`.pitchToken[data-token="${line.actor}"]`) : null;
    const isEnemyGoal = line.kind === "danger" && !actorToken;

    // 「現在地から目標へ6割だけ寄る」補間で、駒どうしの動きをなめらかに連続させる。
    // 目標＝定位置＋ボール側へのドリフト（駒ごとに引っぱられ方が違う）。
    pitch.querySelectorAll(".pitchToken").forEach((token) => {
      if (token === actorToken) return;
      const baseX = Number(token.dataset.x);
      const baseY = Number(token.dataset.y);
      const { x: currentX, y: currentY } = tokenPos(token);
      const isMine = token.classList.contains("mine");

      const pull = (0.10 + Math.random() * 0.22) * (isMine ? compactness : 1);
      const targetX = isNeutral ? baseX : baseX + (line.ball - 50) * pull;
      const targetY = isNeutral ? baseY : baseY + (Math.random() - 0.5) * 9;

      token.classList.remove("act");
      const next = stepToward(currentX, currentY, targetX, targetY, 0.6, 14, 10);
      token.style.left = `${next.x}%`;
      token.style.top = `${next.y}%`;
    });

    // 周囲の選手も少しだけイベントに連動させる（近い味方はサポート、近い相手は寄せてリアクション）
    if (actorToken && !isNeutral) {
      const { x: actorX, y: actorY } = tokenPos(actorToken);
      nearestTokens(".pitchToken.mine", actorX, actorY, actorToken, 2).forEach(({ token, x, y }) => {
        const next = stepToward(x, y, line.ball, actorY, 0.35, 8, 6);
        token.style.left = `${next.x}%`;
        token.style.top = `${next.y}%`;
      });
      nearestTokens(".pitchToken.cpu", line.ball, actorY, actorToken, 1).forEach(({ token, x, y }) => {
        const next = stepToward(x, y, line.ball, actorY, 0.3, 8, 6);
        token.style.left = `${next.x}%`;
        token.style.top = `${next.y}%`;
      });
    }

    // 敵の得点はactorが立たない唯一の場面。ゴール前のCPUとGK付近だけ軽く反応させる
    if (isEnemyGoal) {
      nearestTokens(".pitchToken.cpu", line.ball, 50, null, 1).forEach(({ token, x, y }) => {
        const next = stepToward(x, y, line.ball, 50, 0.6, 12, 8);
        token.classList.add("act");
        token.style.left = `${next.x}%`;
        token.style.top = `${next.y}%`;
      });
      nearestTokens(".pitchToken.mine", 4, 50, null, 1).forEach(({ token, x, y }) => {
        const next = stepToward(x, y, 8, 50, 0.4, 8, 6);
        token.style.left = `${next.x}%`;
        token.style.top = `${next.y}%`;
      });
    }

    if (actorToken) {
      actorToken.classList.add("act");
      // 活躍中の選手はボールへ走りこむ（こちらは目標へ強めに寄せる。速い選手ほど踏み込みが大きい）
      const player = findPlayerById(line.actor);
      const speedBoost = player ? clampPct((player.stats.speed - 5) * 0.6, -3, 4) : 0;
      const { x: currentX, y: currentY } = tokenPos(actorToken);
      const lungeX = line.ball + (line.ball < 50 ? 5 + speedBoost : -7 - speedBoost);
      const lungeY = 50 + (Math.random() - 0.5) * 12;
      const next = stepToward(currentX, currentY, lungeX, lungeY, 0.85, 24, 16);
      actorToken.style.left = `${next.x}%`;
      actorToken.style.top = `${next.y}%`;
    }

    if (line.flash) {
      pitch.classList.remove("flash-goal", "flash-danger");
      void pitch.offsetWidth;
      pitch.classList.add(`flash-${line.flash}`);
    }
  };

  // ハイライト演出（Phase 5）: src/assets/soccer-scenes/ のアメコミ調イラストを表示する。
  // startTypeごとにキャプション文言を変える（assist型はクロス/パス役→決め手、単独型は同じ選手の持ち込み）。
  const captionForStep = (step, highlight) => {
    const player = step.playerId ? findPlayerById(step.playerId) : null;
    const name = player ? `${player.emoji}${player.name}` : (highlight.attackingSide === "cpu" ? `${cpu.emoji}${cpu.name}` : "みんな");
    const label = step.startType ? (START_TYPES[step.startType]?.label ?? "しかけ") : null;
    switch (step.action) {
      case "start": return `${name}の ${label}！`;
      case "windup": return `${name}、${label}！`;
      case "cpu_attack": return `${cpu.emoji}${cpu.name}の こうげき！`;
      case "parry": return "GKが はじき返す！";
      case "rebound": return `${name}が こぼれ球に つめる！`;
      default: return highlight.text;
    }
  };

  // 画像ファイル名（拡張子抜き）を決める。start/windupはstartType自体がファイル名と一致する。
  // 結果系（finish/concede/save/tackle/stopped）はoutcomeから決まるhighlight.artをそのまま使う。
  const artKeyForStep = (step, highlight) => {
    switch (step.action) {
      case "start":
      case "windup":
        return step.startType;
      case "cpu_attack":
        return "cpu_attack";
      case "parry":
        return "parry";
      case "rebound":
        return "rebound";
      default:
        return highlight.art;
    }
  };

  // gk_save/tackle_stopは自チーム・相手チーム両方の場面で使い回す画像なので、
  // どちらの選手を描いているかをactionから判定し、CSSの縁取り色（team-mine/team-cpu）で見分けられるようにする。
  const teamForStep = (step) => {
    switch (step.action) {
      case "start":
      case "windup":
      case "rebound":
        return "mine";
      case "cpu_attack":
      case "parry":
        return "cpu";
      case "finish":
        return "cpu"; // goalはgoal_net(人物なし)なので実質save時のみ意味を持つ＝相手GK
      case "stopped":
        return "cpu"; // 自分が攻めて相手に止められた
      case "save":
      case "tackle":
        return "mine"; // 相手が攻めて自分のGK/DFが止めた
      default:
        return "mine";
    }
  };

  const playHighlightScene = (highlight, onDone) => {
    const steps = highlight.sequence.length > 0 ? highlight.sequence : [{ action: "finish", role: null, playerId: highlight.actorId ?? null }];
    let stepIndex = 0;

    const renderStep = () => {
      const step = steps[stepIndex];
      const player = step.playerId ? findPlayerById(step.playerId) : null;
      const artKey = artKeyForStep(step, highlight);
      // goal_net.pngは人物が写らないので、自チーム/相手チームの縁取り色は付けない
      const teamClass = artKey && artKey !== "goal_net" ? ` team-${teamForStep(step)}` : "";
      const fallbackAvatar = avatarHtml(player ?? { emoji: highlight.attackingSide === "cpu" ? cpu.emoji : "⚽" }, 72);
      overlay.hidden = false;
      overlay.className = `highlightOverlay side-${highlight.side}${highlight.outcome === "goal" ? " isGoal" : ""}`;
      overlay.innerHTML = `
        <div class="highlightFrame">
          ${artKey ? `
            <span class="highlightArtWrap${teamClass}">
              <img class="highlightArt" src="./src/assets/soccer-scenes/${artKey}.png" alt="" draggable="false">
            </span>
          ` : `<span class="highlightAvatar">${fallbackAvatar}</span>`}
          <p class="highlightCaption">${escapeHtml(captionForStep(step, highlight))}</p>
        </div>
      `;
      // 画像が見つからない場合は選手アイコンにフォールバック（onerrorを属性文字列に埋め込むとSVGの二重引用符と衝突するため、ここで設定する）
      const artImg = overlay.querySelector(".highlightArt");
      if (artImg) {
        artImg.addEventListener("error", () => {
          artImg.closest(".highlightArtWrap").innerHTML = fallbackAvatar;
        }, { once: true });
      }
      void overlay.offsetWidth;
      overlay.classList.remove("stepIn");
      void overlay.offsetWidth;
      overlay.classList.add("stepIn");

      stepIndex += 1;
      if (stepIndex < steps.length) {
        overlayTimer = window.setTimeout(renderStep, 750);
      } else {
        overlayTimer = window.setTimeout(() => {
          overlay.hidden = true;
          overlay.innerHTML = "";
          onDone();
        }, 900);
      }
    };

    renderStep();
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
    const highlight = highlightByLineIndex.get(revealed);
    revealed += 1;

    if (highlight && !skipped) {
      inHighlight = true;
      if (battleTimer) {
        window.clearInterval(battleTimer);
        battleTimer = null;
      }
      playHighlightScene(highlight, () => {
        inHighlight = false;
        if (skipped) return;
        if (revealed >= match.lines.length) {
          finishReveal();
          return;
        }
        battleTimer = window.setInterval(revealLine, 900);
      });
      return;
    }

    if (revealed >= match.lines.length) finishReveal();
  };

  const finishReveal = () => {
    skipped = true;
    if (battleTimer) {
      window.clearInterval(battleTimer);
      battleTimer = null;
    }
    if (overlayTimer) {
      window.clearTimeout(overlayTimer);
      overlayTimer = null;
    }
    overlay.hidden = true;
    overlay.innerHTML = "";
    while (revealed < match.lines.length) revealLine();
    actions.hidden = false;
  };

  revealLine();
  if (!skipped && !inHighlight) battleTimer = window.setInterval(revealLine, 900);

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

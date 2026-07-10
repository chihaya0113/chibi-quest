import { writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";

const outFile = new URL("../src/data/soccer/players.js", import.meta.url);

const positionLabels = {
  FW: "フォワード",
  MF: "ミッドフィルダー",
  DF: "ディフェンダー",
  GK: "ゴールキーパー"
};

// ---- カードプール（全5弾・150人構成） ----
// EA SPORTS FC 能力値ランキング上位150人を、15人ずつ10グループ（グループ1が最上位）に分割。
// グループ＝コストが1:1で対応（グループ1→コスト10 … グループ10→コスト1、固定）。
// Tierは150人全体の順位で決定（コストとは独立の軸）：上位10%(グループ1)=S、次30%(グループ2-4)=A、残り60%(グループ5-10)=B。
// 全5弾構成で、各弾は各グループから3人ずつ（3×10=30人）を選出し、5弾で各グループ15人を使い切る。
// これにより、どの弾にも「世界的スター〜掘り出し物」が揃うようにしている。
//
// 所属は2025-26シーズン時点。移籍したらここを直して npm run generate:players
// stats: [dribble, pass, shoot, heading, defense, speed] 各1〜10。
// dribble/pass/shoot/defense/speed は EA SPORTS FC 26 の実データ・実際のプレースタイルをもとに変換。
// heading は対応する単一ステータスが無いため、空中戦の評判を参考にした判断値。
// rarity 3=Tier S(特性上限5) / 2=Tier A(上限4) / 1=Tier B(上限3)。cost はチーム編成用の予算値（1〜10、グループ固定）。
// specialtyTactic は6戦術のうちどの特性プールから引くか（実プレースタイル基準）。
// traits は解放される順番（Lv1で1個目から）。tier上限を超える分は生成時に自動で切り詰められる。

// 第1弾（30人）：グループ1〜10から3人ずつ
const wave1Players = [
  // グループ1（コスト10・Tier S）
  { no: 1, name: "エムバペ", emoji: "🐢", pos: "FW", club: "レアル・マドリード", country: "フランス", flag: "🇫🇷", rarity: 3, cost: 10, stats: [9, 8, 9, 5, 4, 10], specialtyTactic: "counter", traits: ["スピード", "裏抜け", "決定力", "瞬発力", "オフザボール"] },
  { no: 2, name: "ファン・ダイク", emoji: "🏰", pos: "DF", club: "リヴァプール", country: "オランダ", flag: "🇳🇱", rarity: 3, cost: 10, stats: [6, 7, 3, 10, 9, 7], specialtyTactic: "retreat", traits: ["空中戦", "カバーリング", "対人守備", "守備ポジショニング"] },
  { no: 3, name: "ドンナルンマ", emoji: "🧤", pos: "GK", club: "マンチェスター・シティ", country: "イタリア", flag: "🇮🇹", rarity: 3, cost: 10, stats: [2, 5, 1, 5, 9, 5], specialtyTactic: "retreat", traits: ["GKセービング", "カバーリング", "対人守備", "空中戦", "守備ポジショニング"] },
  // グループ2（コスト9・Tier A）
  { no: 4, name: "デ・ブライネ", emoji: "🧭", pos: "MF", club: "ナポリ", country: "ベルギー", flag: "🇧🇪", rarity: 2, cost: 9, stats: [8, 9, 8, 5, 5, 6], specialtyTactic: "shortpass", traits: ["スルーパス", "ワンタッチパス", "テクニック", "敏捷性"] },
  { no: 5, name: "ハキミ", emoji: "🚄", pos: "DF", club: "パリ・サンジェルマン", country: "モロッコ", flag: "🇲🇦", rarity: 2, cost: 9, stats: [8, 7, 6, 4, 8, 9], specialtyTactic: "counter", traits: ["スピード", "裏抜け", "瞬発力", "オフザボール"] },
  { no: 6, name: "サカ", emoji: "🏹", pos: "FW", club: "アーセナル", country: "イングランド", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", rarity: 2, cost: 9, stats: [8, 7, 7, 3, 3, 8], specialtyTactic: "possession", traits: ["ドリブル", "パス精度", "トラップ", "視野"] },
  // グループ3（コスト8・Tier A）
  { no: 7, name: "ネイマール", emoji: "🎩", pos: "FW", club: "サントス", country: "ブラジル", flag: "🇧🇷", rarity: 2, cost: 8, stats: [9, 8, 7, 2, 2, 6], specialtyTactic: "possession", traits: ["ドリブル", "ボールキープ", "トラップ", "視野"] },
  { no: 8, name: "ノイアー", emoji: "🦁", pos: "GK", club: "バイエルン・ミュンヘン", country: "ドイツ", flag: "🇩🇪", rarity: 2, cost: 8, stats: [3, 6, 1, 4, 9, 4], specialtyTactic: "forecheck", traits: ["飛び出し（GK）", "プレッシャー", "アグレッシブ", "スタミナ"] },
  { no: 9, name: "モドリッチ", emoji: "🎻", pos: "MF", club: "ACミラン", country: "クロアチア", flag: "🇭🇷", rarity: 2, cost: 8, stats: [8, 9, 6, 3, 5, 5], specialtyTactic: "shortpass", traits: ["スルーパス", "テクニック", "ワンタッチパス", "敏捷性"] },
  // グループ4（コスト7・Tier A）
  { no: 10, name: "三笘薫", emoji: "⚡", pos: "FW", club: "ブライトン", country: "日本", flag: "🇯🇵", rarity: 2, cost: 7, stats: [9, 8, 8, 3, 3, 9], specialtyTactic: "counter", traits: ["スピード", "裏抜け", "瞬発力", "オフザボール"] },
  { no: 11, name: "冨安健洋", emoji: "🧱", pos: "DF", club: "アーセナル", country: "日本", flag: "🇯🇵", rarity: 2, cost: 7, stats: [5, 6, 3, 7, 8, 6], specialtyTactic: "retreat", traits: ["対人守備", "空中戦", "守備ポジショニング"] },
  { no: 12, name: "久保建英", emoji: "🌀", pos: "MF", club: "レアル・ソシエダ", country: "日本", flag: "🇯🇵", rarity: 2, cost: 7, stats: [9, 8, 7, 2, 3, 8], specialtyTactic: "possession", traits: ["ドリブル", "パス精度", "トラップ"] },
  // グループ5（コスト6・Tier B）
  { no: 13, name: "アレクサンダー=アーノルド", emoji: "🎯", pos: "DF", club: "レアル・マドリード", country: "イングランド", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", rarity: 1, cost: 6, stats: [6, 9, 5, 3, 6, 7], specialtyTactic: "longpass", traits: ["ロングフィード", "クロス精度", "フィジカル"] },
  { no: 14, name: "ギョケレシュ", emoji: "🦏", pos: "FW", club: "アーセナル", country: "スウェーデン", flag: "🇸🇪", rarity: 1, cost: 6, stats: [6, 5, 9, 7, 3, 8], specialtyTactic: "longpass", traits: ["ターゲットマン", "ロングシュート", "フィジカル"] },
  { no: 15, name: "ライア", emoji: "🧢", pos: "GK", club: "アーセナル", country: "スペイン", flag: "🇪🇸", rarity: 1, cost: 6, stats: [4, 7, 1, 3, 8, 4], specialtyTactic: "retreat", traits: ["GKセービング", "カバーリング", "対人守備"] },
  // グループ6（コスト5・Tier B）
  { no: 16, name: "ソン・フンミン", emoji: "👑", pos: "FW", club: "LAFC", country: "韓国", flag: "🇰🇷", rarity: 1, cost: 5, stats: [8, 7, 8, 4, 3, 8], specialtyTactic: "counter", traits: ["スピード", "決定力", "オフザボール"] },
  { no: 17, name: "板倉滉", emoji: "🗻", pos: "DF", club: "ボルシアMG", country: "日本", flag: "🇯🇵", rarity: 1, cost: 5, stats: [6, 6, 3, 6, 8, 5], specialtyTactic: "retreat", traits: ["守備ポジショニング", "カバーリング", "対人守備"] },
  { no: 18, name: "鎌田大地", emoji: "🎨", pos: "MF", club: "クリスタル・パレス", country: "日本", flag: "🇯🇵", rarity: 1, cost: 5, stats: [7, 7, 6, 4, 4, 6], specialtyTactic: "shortpass", traits: ["テクニック", "ワンタッチパス", "スルーパス"] },
  // グループ7（コスト4・Tier B）
  { no: 19, name: "ベンゼマ", emoji: "🦅", pos: "FW", club: "アル・イテハド", country: "フランス", flag: "🇫🇷", rarity: 1, cost: 4, stats: [7, 7, 8, 6, 2, 5], specialtyTactic: "possession", traits: ["ドリブル", "トラップ", "ボールキープ"] },
  { no: 20, name: "リース・ジェームズ", emoji: "💥", pos: "DF", club: "チェルシー", country: "イングランド", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", rarity: 1, cost: 4, stats: [6, 7, 6, 4, 7, 7], specialtyTactic: "forecheck", traits: ["ボール奪取", "アグレッシブ", "プレッシャー"] },
  { no: 21, name: "バレッラ", emoji: "🔋", pos: "MF", club: "インテル", country: "イタリア", flag: "🇮🇹", rarity: 1, cost: 4, stats: [6, 7, 5, 4, 6, 7], specialtyTactic: "forecheck", traits: ["スタミナ", "プレッシャー", "ボール奪取"] },
  // グループ8（コスト3・Tier B）
  { no: 22, name: "イ・ガンイン", emoji: "🪄", pos: "MF", club: "パリ・サンジェルマン", country: "韓国", flag: "🇰🇷", rarity: 1, cost: 3, stats: [8, 7, 6, 2, 3, 6], specialtyTactic: "possession", traits: ["ドリブル", "パス精度", "視野"] },
  { no: 23, name: "チュアメニ", emoji: "🗿", pos: "MF", club: "レアル・マドリード", country: "フランス", flag: "🇫🇷", rarity: 1, cost: 3, stats: [5, 7, 4, 6, 8, 6], specialtyTactic: "forecheck", traits: ["ボール奪取", "スタミナ", "プレッシャー"] },
  { no: 24, name: "町田浩樹", emoji: "⛰", pos: "DF", club: "モナコ", country: "日本", flag: "🇯🇵", rarity: 1, cost: 3, stats: [4, 5, 2, 7, 7, 6], specialtyTactic: "retreat", traits: ["空中戦", "対人守備", "守備ポジショニング"] },
  // グループ9（コスト2・Tier B）
  { no: 25, name: "キム・ミンジェ", emoji: "🐘", pos: "DF", club: "バイエルン・ミュンヘン", country: "韓国", flag: "🇰🇷", rarity: 1, cost: 2, stats: [5, 5, 2, 9, 9, 7], specialtyTactic: "retreat", traits: ["空中戦", "対人守備", "カバーリング"] },
  { no: 26, name: "ホァン・ヒチャン", emoji: "🔥", pos: "FW", club: "ウォルバーハンプトン", country: "韓国", flag: "🇰🇷", rarity: 1, cost: 2, stats: [6, 5, 6, 5, 3, 8], specialtyTactic: "forecheck", traits: ["プレッシャー", "アグレッシブ", "スタミナ"] },
  { no: 27, name: "田中碧", emoji: "💎", pos: "MF", club: "リーズ・ユナイテッド", country: "日本", flag: "🇯🇵", rarity: 1, cost: 2, stats: [6, 7, 5, 4, 5, 6], specialtyTactic: "shortpass", traits: ["ワンタッチパス", "テクニック", "敏捷性"] },
  // グループ10（コスト1・Tier B）
  { no: 28, name: "エステヴァン", emoji: "🌟", pos: "FW", club: "チェルシー", country: "ブラジル", flag: "🇧🇷", rarity: 1, cost: 1, stats: [8, 6, 6, 2, 2, 7], specialtyTactic: "possession", traits: ["ドリブル", "トラップ", "視野"] },
  { no: 29, name: "高井幸大", emoji: "🌿", pos: "DF", club: "川崎フロンターレ", country: "日本", flag: "🇯🇵", rarity: 1, cost: 1, stats: [4, 5, 2, 6, 6, 5], specialtyTactic: "retreat", traits: ["対人守備", "空中戦", "守備ポジショニング"] },
  { no: 30, name: "松木玖生", emoji: "🚀", pos: "MF", club: "FC東京", country: "日本", flag: "🇯🇵", rarity: 1, cost: 1, stats: [5, 5, 4, 5, 5, 6], specialtyTactic: "forecheck", traits: ["ボール奪取", "プレッシャー", "スタミナ"] }
];

// 弾ごとの選手リストをここに追加していく（例: const wave2Players = [...]; ）
const players = [
  ...wave1Players.map((player) => ({ ...player, wave: 1 }))
];

// スターター（れんしゅうせい）: 最初からチームにいる低能力選手。
// パックからは出ず、図鑑にも数えない。
const starters = [
  { no: 101, name: "まもるくん", emoji: "🐣", pos: "GK", stats: [1, 2, 1, 2, 4, 2], specialtyTactic: "retreat", traits: ["GKセービング"] },
  { no: 102, name: "いわおくん", emoji: "🪨", pos: "DF", stats: [2, 2, 1, 3, 4, 2], specialtyTactic: "retreat", traits: ["対人守備"] },
  { no: 103, name: "たてじまくん", emoji: "🦓", pos: "DF", stats: [2, 3, 1, 3, 3, 3], specialtyTactic: "retreat", traits: ["空中戦"] },
  { no: 104, name: "ぐるぐるくん", emoji: "🐌", pos: "MF", stats: [3, 3, 2, 2, 2, 3], specialtyTactic: "possession", traits: ["ボールキープ"] },
  { no: 105, name: "ちょこまかくん", emoji: "🐿", pos: "MF", stats: [3, 3, 2, 1, 2, 4], specialtyTactic: "counter", traits: ["瞬発力"] },
  { no: 106, name: "のんびりくん", emoji: "🦥", pos: "MF", stats: [2, 4, 2, 2, 3, 1], specialtyTactic: "shortpass", traits: ["テクニック"] },
  { no: 107, name: "とっしんくん", emoji: "🐗", pos: "FW", stats: [3, 2, 4, 3, 1, 3], specialtyTactic: "forecheck", traits: ["アグレッシブ"] },
  { no: 108, name: "ぴょんたくん", emoji: "🐰", pos: "FW", stats: [3, 2, 3, 2, 1, 4], specialtyTactic: "counter", traits: ["スピード"] }
];

function pad(number) {
  return String(number).padStart(3, "0");
}

// ドット顔パラメータ: [肌の色, 髪型, 髪色, ひげ]
// 肌: light/tan/brown  髪型: short/buzz/curly/long/bun/spiky  髪色: black/darkbrown/brown/blond/ginger  ひげ: none/stubble/full
const faces = {
  1: ["brown", "short", "black", "none"],
  2: ["tan", "buzz", "black", "full"],
  3: ["light", "short", "black", "stubble"],
  4: ["light", "short", "blond", "stubble"],
  5: ["brown", "buzz", "black", "none"],
  6: ["brown", "short", "black", "none"],
  7: ["tan", "curly", "blond", "full"],
  8: ["light", "short", "darkbrown", "stubble"],
  9: ["light", "short", "darkbrown", "none"],
  10: ["light", "short", "black", "none"],
  11: ["light", "buzz", "black", "none"],
  12: ["light", "spiky", "black", "none"],
  13: ["light", "buzz", "brown", "stubble"],
  14: ["light", "short", "blond", "full"],
  15: ["tan", "short", "black", "full"],
  16: ["tan", "short", "black", "stubble"],
  17: ["light", "short", "black", "none"],
  18: ["light", "curly", "black", "none"],
  19: ["brown", "buzz", "black", "full"],
  20: ["brown", "short", "black", "none"],
  21: ["light", "curly", "brown", "stubble"],
  22: ["light", "spiky", "black", "none"],
  23: ["brown", "short", "black", "none"],
  24: ["light", "buzz", "black", "none"],
  25: ["tan", "buzz", "black", "stubble"],
  26: ["tan", "short", "black", "none"],
  27: ["light", "short", "black", "none"],
  28: ["brown", "short", "black", "none"],
  29: ["light", "buzz", "black", "none"],
  30: ["light", "spiky", "black", "none"]
};

const statKeys = ["dribble", "pass", "shoot", "heading", "defense", "speed"];
// tier上限：完凸時に解放される特性の最大数
const TIER_BY_RARITY = { 3: "S", 2: "A", 1: "B" };
const TRAIT_CAP_BY_TIER = { S: 5, A: 4, B: 3 };

function toStats(values) {
  const stats = {};
  statKeys.forEach((key, index) => {
    stats[key] = values[index];
  });
  return stats;
}

const output = [
  ...players.map((player) => {
    const tier = TIER_BY_RARITY[player.rarity];
    return {
      id: `pl_${pad(player.no)}`,
      playerNo: player.no,
      name: player.name,
      emoji: player.emoji,
      position: player.pos,
      positionLabel: positionLabels[player.pos],
      club: player.club,
      country: player.country,
      flag: player.flag,
      rarity: player.rarity,
      tier,
      cost: player.cost,
      wave: player.wave,
      stats: toStats(player.stats),
      specialtyTactic: player.specialtyTactic,
      traits: (player.traits ?? []).slice(0, TRAIT_CAP_BY_TIER[tier]),
      face: faces[player.no]
        ? { skin: faces[player.no][0], hair: faces[player.no][1], hairColor: faces[player.no][2], beard: faces[player.no][3] }
        : null,
      starter: false,
      status: "active"
    };
  }),
  ...starters.map((player) => ({
    id: `st_${pad(player.no)}`,
    playerNo: player.no,
    name: player.name,
    emoji: player.emoji,
    position: player.pos,
    positionLabel: positionLabels[player.pos],
    club: "ちびクエFC",
    country: "れんしゅうせい",
    flag: "🌱",
    rarity: 1,
    tier: "B",
    cost: 1,
    stats: toStats(player.stats),
    specialtyTactic: player.specialtyTactic,
    traits: player.traits ?? [],
    face: null,
    starter: true,
    status: "active"
  }))
];

const expectedTotal = players.length + starters.length;
if (output.length !== expectedTotal) {
  throw new Error(`Expected ${expectedTotal} players (${players.length} + ${starters.length} starters), got ${output.length}`);
}

for (const player of output) {
  for (const key of statKeys) {
    const value = player.stats[key];
    if (!Number.isInteger(value) || value < 1 || value > 10) {
      throw new Error(`Invalid stat ${key} for ${player.id}: ${value}`);
    }
  }
  if (!["FW", "MF", "DF", "GK"].includes(player.position)) {
    throw new Error(`Invalid position: ${player.id}`);
  }
  if (![1, 2, 3].includes(player.rarity)) {
    throw new Error(`Invalid rarity: ${player.id}`);
  }
  if (!Number.isInteger(player.cost) || player.cost < 1 || player.cost > 10) {
    throw new Error(`Invalid cost for ${player.id}: ${player.cost}`);
  }
  if (!player.starter && !Number.isInteger(player.wave)) {
    throw new Error(`Invalid wave for ${player.id}: ${player.wave}`);
  }
  if (!player.starter) {
    const cap = TRAIT_CAP_BY_TIER[player.tier];
    if (!player.specialtyTactic || player.traits.length === 0) {
      throw new Error(`Missing traits: ${player.id}`);
    }
    if (player.traits.length > cap) {
      throw new Error(`Too many traits for tier ${player.tier}: ${player.id}`);
    }
  }
}

const byPosition = output.reduce((acc, player) => {
  acc[player.position] = (acc[player.position] ?? 0) + 1;
  return acc;
}, {});
const byRarity = output.reduce((acc, player) => {
  acc[player.rarity] = (acc[player.rarity] ?? 0) + 1;
  return acc;
}, {});

await mkdir(new URL("../src/data/soccer/", import.meta.url), { recursive: true });
writeFileSync(outFile, `window.CHIBI_QUEST_SOCCER_PLAYERS = ${JSON.stringify(output, null, 2)};\n`);
console.log(`Generated ${output.length} players (wave 1: ${players.length})`, byPosition, byRarity);

import { writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";

const outFile = new URL("../src/data/soccer/players.js", import.meta.url);

const positionLabels = {
  FW: "フォワード",
  MF: "ミッドフィルダー",
  DF: "ディフェンダー",
  GK: "ゴールキーパー"
};

// 所属は2025-26シーズン時点。移籍したらここを直して npm run generate:players
// stats: [ドリブル, パス, シュート, ヘディング, まもり(GKはセービング), はやさ] 各1〜10
const players = [
  // ⭐⭐⭐ レジェンド
  { no: 1, name: "メッシ", emoji: "🐐", pos: "FW", club: "インテル・マイアミ", country: "アルゼンチン", flag: "🇦🇷", rarity: 3, stats: [10, 10, 9, 3, 2, 7] },
  { no: 2, name: "クリスティアーノ・ロナウド", emoji: "🚀", pos: "FW", club: "アル・ナスル", country: "ポルトガル", flag: "🇵🇹", rarity: 3, stats: [7, 7, 10, 10, 2, 7] },
  { no: 3, name: "エムバペ", emoji: "🐢", pos: "FW", club: "レアル・マドリード", country: "フランス", flag: "🇫🇷", rarity: 3, stats: [9, 7, 9, 5, 2, 10] },
  { no: 4, name: "ハーランド", emoji: "🤖", pos: "FW", club: "マンチェスター・シティ", country: "ノルウェー", flag: "🇳🇴", rarity: 3, stats: [6, 6, 10, 9, 3, 9] },
  { no: 5, name: "ラミン・ヤマル", emoji: "🌟", pos: "FW", club: "バルセロナ", country: "スペイン", flag: "🇪🇸", rarity: 3, stats: [10, 8, 8, 3, 2, 8] },
  { no: 6, name: "三笘薫", emoji: "⚡", pos: "FW", club: "ブライトン", country: "日本", flag: "🇯🇵", rarity: 3, stats: [9, 7, 7, 4, 4, 9] },
  // ⭐⭐ レア
  { no: 7, name: "ヴィニシウス", emoji: "🕺", pos: "FW", club: "レアル・マドリード", country: "ブラジル", flag: "🇧🇷", rarity: 2, stats: [9, 7, 8, 4, 2, 10] },
  { no: 8, name: "サラー", emoji: "👑", pos: "FW", club: "リヴァプール", country: "エジプト", flag: "🇪🇬", rarity: 2, stats: [8, 8, 9, 5, 3, 9] },
  { no: 9, name: "ハリー・ケイン", emoji: "🎯", pos: "FW", club: "バイエルン・ミュンヘン", country: "イングランド", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", rarity: 2, stats: [6, 8, 10, 8, 3, 5] },
  { no: 10, name: "ベリンガム", emoji: "😎", pos: "MF", club: "レアル・マドリード", country: "イングランド", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", rarity: 2, stats: [8, 8, 8, 7, 6, 7] },
  { no: 11, name: "ロドリ", emoji: "🧠", pos: "MF", club: "マンチェスター・シティ", country: "スペイン", flag: "🇪🇸", rarity: 2, stats: [6, 9, 6, 7, 8, 5] },
  { no: 12, name: "ペドリ", emoji: "🪄", pos: "MF", club: "バルセロナ", country: "スペイン", flag: "🇪🇸", rarity: 2, stats: [8, 9, 6, 3, 5, 6] },
  { no: 13, name: "デ・ブライネ", emoji: "🧭", pos: "MF", club: "ナポリ", country: "ベルギー", flag: "🇧🇪", rarity: 2, stats: [7, 10, 8, 4, 3, 5] },
  { no: 14, name: "久保建英", emoji: "🌀", pos: "MF", club: "レアル・ソシエダ", country: "日本", flag: "🇯🇵", rarity: 2, stats: [9, 8, 7, 3, 3, 8] },
  { no: 15, name: "ファン・ダイク", emoji: "🏰", pos: "DF", club: "リヴァプール", country: "オランダ", flag: "🇳🇱", rarity: 2, stats: [4, 7, 4, 10, 10, 6] },
  { no: 16, name: "ハキミ", emoji: "🚄", pos: "DF", club: "パリ・サンジェルマン", country: "モロッコ", flag: "🇲🇦", rarity: 2, stats: [8, 7, 6, 5, 7, 10] },
  { no: 17, name: "クルトワ", emoji: "🕷", pos: "GK", club: "レアル・マドリード", country: "ベルギー", flag: "🇧🇪", rarity: 2, stats: [1, 5, 1, 4, 10, 4] },
  { no: 18, name: "鈴木彩艶", emoji: "🔥", pos: "GK", club: "パルマ", country: "日本", flag: "🇯🇵", rarity: 2, stats: [2, 5, 1, 4, 8, 5] },
  // ⭐ きほん
  { no: 19, name: "モドリッチ", emoji: "🎻", pos: "MF", club: "ACミラン", country: "クロアチア", flag: "🇭🇷", rarity: 1, stats: [8, 9, 6, 3, 5, 5] },
  { no: 20, name: "遠藤航", emoji: "🛡", pos: "MF", club: "リヴァプール", country: "日本", flag: "🇯🇵", rarity: 1, stats: [5, 7, 4, 7, 9, 5] },
  { no: 21, name: "リュディガー", emoji: "🦾", pos: "DF", club: "レアル・マドリード", country: "ドイツ", flag: "🇩🇪", rarity: 1, stats: [4, 6, 3, 8, 9, 7] },
  { no: 22, name: "サリバ", emoji: "🧱", pos: "DF", club: "アーセナル", country: "フランス", flag: "🇫🇷", rarity: 1, stats: [5, 6, 2, 8, 9, 7] },
  { no: 23, name: "グヴァルディオル", emoji: "🐻", pos: "DF", club: "マンチェスター・シティ", country: "クロアチア", flag: "🇭🇷", rarity: 1, stats: [6, 7, 4, 7, 8, 7] },
  { no: 24, name: "板倉滉", emoji: "🗻", pos: "DF", club: "アヤックス", country: "日本", flag: "🇯🇵", rarity: 1, stats: [4, 6, 3, 8, 8, 5] },
  { no: 25, name: "アリソン", emoji: "🦅", pos: "GK", club: "リヴァプール", country: "ブラジル", flag: "🇧🇷", rarity: 1, stats: [2, 6, 1, 4, 9, 4] },
  { no: 26, name: "ドンナルンマ", emoji: "🧤", pos: "GK", club: "マンチェスター・シティ", country: "イタリア", flag: "🇮🇹", rarity: 1, stats: [1, 4, 1, 4, 9, 4] }
];

// スターター（れんしゅうせい）: 最初からチームにいる低能力選手。
// パックからは出ず、図鑑にも数えない。
const starters = [
  { no: 101, name: "まもるくん", emoji: "🐣", pos: "GK", stats: [1, 2, 1, 2, 4, 2] },
  { no: 102, name: "いわおくん", emoji: "🪨", pos: "DF", stats: [2, 2, 1, 3, 4, 2] },
  { no: 103, name: "たてじまくん", emoji: "🦓", pos: "DF", stats: [2, 3, 1, 3, 3, 3] },
  { no: 104, name: "ぐるぐるくん", emoji: "🐌", pos: "MF", stats: [3, 3, 2, 2, 2, 3] },
  { no: 105, name: "ちょこまかくん", emoji: "🐿", pos: "MF", stats: [3, 3, 2, 1, 2, 4] },
  { no: 106, name: "のんびりくん", emoji: "🦥", pos: "MF", stats: [2, 4, 2, 2, 3, 1] },
  { no: 107, name: "とっしんくん", emoji: "🐗", pos: "FW", stats: [3, 2, 4, 3, 1, 3] },
  { no: 108, name: "ぴょんたくん", emoji: "🐰", pos: "FW", stats: [3, 2, 3, 2, 1, 4] }
];

function pad(number) {
  return String(number).padStart(3, "0");
}

// ドット顔パラメータ: [肌の色, 髪型, 髪色, ひげ]
// 肌: light/tan/brown  髪型: short/buzz/curly/long/bun/spiky  ひげ: none/stubble/full
const faces = {
  1: ["light", "short", "brown", "full"],
  2: ["tan", "spiky", "black", "stubble"],
  3: ["brown", "buzz", "black", "none"],
  4: ["light", "bun", "blond", "none"],
  5: ["tan", "curly", "black", "none"],
  6: ["light", "short", "black", "none"],
  7: ["brown", "curly", "black", "none"],
  8: ["tan", "curly", "black", "full"],
  9: ["light", "short", "brown", "stubble"],
  10: ["brown", "short", "black", "none"],
  11: ["light", "short", "darkbrown", "stubble"],
  12: ["light", "curly", "darkbrown", "none"],
  13: ["light", "short", "ginger", "none"],
  14: ["light", "spiky", "black", "none"],
  15: ["brown", "bun", "black", "full"],
  16: ["tan", "short", "black", "stubble"],
  17: ["light", "short", "darkbrown", "stubble"],
  18: ["tan", "buzz", "black", "none"],
  19: ["light", "long", "brown", "none"],
  20: ["light", "buzz", "black", "stubble"],
  21: ["brown", "buzz", "black", "full"],
  22: ["brown", "short", "black", "stubble"],
  23: ["light", "short", "darkbrown", "none"],
  24: ["light", "curly", "black", "none"],
  25: ["light", "short", "brown", "full"],
  26: ["light", "short", "black", "stubble"]
};

const statKeys = ["dribble", "pass", "shoot", "heading", "defense", "speed"];

function toStats(values) {
  const stats = {};
  statKeys.forEach((key, index) => {
    stats[key] = values[index];
  });
  return stats;
}

const output = [
  ...players.map((player) => ({
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
    stats: toStats(player.stats),
    face: faces[player.no]
      ? { skin: faces[player.no][0], hair: faces[player.no][1], hairColor: faces[player.no][2], beard: faces[player.no][3] }
      : null,
    starter: false,
    status: "active"
  })),
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
    stats: toStats(player.stats),
    face: null,
    starter: true,
    status: "active"
  }))
];

if (output.length !== 34) {
  throw new Error(`Expected 34 players (26 + 8 starters), got ${output.length}`);
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
console.log(`Generated ${output.length} players`, byPosition, byRarity);

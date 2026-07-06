import { writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";

const outFile = new URL("../src/data/soccer/cards.js", import.meta.url);

const typeLabels = {
  attack: "こうげき",
  support: "サポート",
  defense: "守り"
};

// 選択肢は「長さ・具体度をそろえる」ルール（正解だけ長い/親切にしない）
const cards = [
  // ⚡ こうげき
  {
    no: 1, name: "顔を上げる", type: "attack", rarity: 1,
    prompt: "ボールをもらった。まず何をする？",
    correct: "顔を上げてまわりを見る",
    wrongs: ["下を向いてドリブルする", "その場で止まってしまう", "とりあえず前にける"],
    explanation: "もらったら顔を上げて、味方・敵・ゴールを見てから決めよう。"
  },
  {
    no: 2, name: "前へ運ぶ", type: "attack", rarity: 2,
    prompt: "前があいている。よこには味方もいる。どうする？",
    correct: "あいている前へドリブルで進む",
    wrongs: ["とりあえず味方にパスする", "後ろへボールを下げておく", "その場で止まって考えこむ"],
    explanation: "前があいている時はドリブルのチャンス。ふさがれたらパスにきりかえよう。"
  },
  {
    no: 3, name: "すみをねらう", type: "attack", rarity: 2,
    prompt: "ゴールの近くでボールをもらった。どうする？",
    correct: "おちついてゴールのすみへける",
    wrongs: ["思いきり強くけるだけにする", "キーパーの正面へけってしまう", "近くの味方にゆずってしまう"],
    explanation: "近くまで来たらおちついて、キーパーのいないすみをねらおう。"
  },
  {
    no: 4, name: "スペースへ走る", type: "attack", rarity: 3,
    prompt: "味方がボールを持っている。きみはどう動く？",
    correct: "敵のいないあいた所へ走る",
    wrongs: ["ボールのそばへ近づいていく", "その場で手をあげて待っている", "敵のうしろで止まっている"],
    explanation: "あいた所へ走りこむと、パスをもらえてチャンスが広がるよ。"
  },
  {
    no: 5, name: "あまった味方を使う", type: "attack", rarity: 3,
    prompt: "味方2人、あいて1人。どうせめる？",
    correct: "相手をひきつけて味方にパス",
    wrongs: ["二人ともドリブルでせめる", "すぐ強くシュートをうってみる", "一人でぬいて行こうとする"],
    explanation: "相手を自分にひきつけると、味方がフリーになる。2対1は数のゆうい！"
  },
  // 🤝 サポート
  {
    no: 6, name: "広がる", type: "support", rarity: 1,
    prompt: "みんながボールに集まっている。きみは？",
    correct: "ボールからはなれて広がる",
    wrongs: ["自分もボールに走っていく", "みんなのうしろで見ている", "敵のそばに立っておく"],
    explanation: "広がるとパスコースができる。だんごにならないのが強いチーム。"
  },
  {
    no: 7, name: "声を出す", type: "support", rarity: 1,
    prompt: "きみはフリー。パスがほしい。どうする？",
    correct: "「ここ！」と声を出して手をあげる",
    wrongs: ["だまってじっと待っている", "味方のそばへ走って止まる", "ボールと反対へ歩いていく"],
    explanation: "声を出せば味方が気づいてパスを出せるよ。"
  },
  {
    no: 8, name: "パスコースをつくる", type: "support", rarity: 2,
    prompt: "きみは敵のうしろにかくれている。どうする？",
    correct: "味方から見える所へ動く",
    wrongs: ["そのままかくれて待っている", "味方のま後ろへ動いていく", "ボールへまっすぐ近づく"],
    explanation: "敵のかげから出て見える所へ動くと、パスがもらえる。"
  },
  {
    no: 9, name: "近すぎず遠すぎず", type: "support", rarity: 2,
    prompt: "味方がボールを持った。どこにいるのがいい？",
    correct: "パスがとどく少しはなれた所",
    wrongs: ["味方のすぐよこにくっつく", "コートのはしのずっと遠く", "敵と同じ場所に立っておく"],
    explanation: "近すぎるといっしょにかこまれ、遠すぎるとパスがとどかない。"
  },
  {
    no: 10, name: "もどってサポート", type: "support", rarity: 2,
    prompt: "味方が前でつまっている。きみは？",
    correct: "少し下がってパスをもらえる所へ動く",
    wrongs: ["もっと前へ走っていってしまう", "敵といっしょに前へ行ってみる", "その場で見ているだけにする"],
    explanation: "前がだめでも、後ろにもどせば攻めを作りなおせる。"
  },
  // 🛡 守り
  {
    no: 11, name: "飛びこまない", type: "defense", rarity: 1,
    prompt: "相手がドリブルしてくる。すぐ足を出す？",
    correct: "飛びこまず正面で待って道をふさぐ",
    wrongs: ["思いきり足を出して飛びこむ", "こわいので目をつぶってしまう", "後ろを向いて走ってにげる"],
    explanation: "飛びこむとかわされる。待ってコースをせばめるのが強い守り。"
  },
  {
    no: 12, name: "マークを見る", type: "defense", rarity: 1,
    prompt: "自分の近くに相手がいる。守りで大事なのは？",
    correct: "近くの相手から目をはなさない",
    wrongs: ["ボールだけをずっと見ている", "相手を気にせず前へ行く", "その場にすわって休んでいる"],
    explanation: "マークする相手を見ておくと、パスをカットしやすくなる。"
  },
  {
    no: 13, name: "間に立つ", type: "defense", rarity: 2,
    prompt: "相手がボールを持ってゴールへ向かってくる。",
    correct: "相手とゴールの間に立つ",
    wrongs: ["後ろからただ追いかける", "ボールに思いきり飛びこむ", "ゴールの前でじっと待つ"],
    explanation: "相手とゴールの間に立てば、かんたんにシュートさせない。"
  },
  {
    no: 14, name: "みんなで追わない", type: "defense", rarity: 2,
    prompt: "味方が一人、ボールをうばいに行った。きみも行く？",
    correct: "自分はほかの相手を見ておく",
    wrongs: ["自分もボールへ走っていく", "ゴールの前にすわっておく", "相手を手でおさえておく"],
    explanation: "全員でボールに行くと、ほかの相手ががら空きになるよ。"
  },
  {
    no: 15, name: "こぼれ球に反応", type: "defense", rarity: 3,
    prompt: "シュートがはじかれてボールがころがった！",
    correct: "すばやく走って先にさわる",
    wrongs: ["味方がとるのを待っている", "その場で見ているだけにする", "ゴールのほうを見て止まる"],
    explanation: "こぼれ球に早く動いた方が勝ち。チャンスもピンチもここで決まる。"
  }
];

function pad(number) {
  return String(number).padStart(3, "0");
}

const questions = cards.map((card) => ({
  id: `sc_${pad(card.no)}`,
  cardNo: card.no,
  name: card.name,
  type: card.type,
  typeLabel: typeLabels[card.type],
  rarity: card.rarity,
  questionType: "multiple_choice",
  prompt: card.prompt,
  choices: [card.correct, ...card.wrongs].map((text, index) => ({
    id: String.fromCharCode(97 + index),
    text
  })),
  answer: { type: "choice", value: card.correct },
  explanation: card.explanation,
  skillTags: [typeLabels[card.type], "はんだん"],
  sourcePolicy: {
    basis: ["ジュニアサッカーの基礎原則"],
    originalContent: true
  },
  status: "active"
}));

if (questions.length !== 15) {
  throw new Error(`Expected 15 soccer cards, got ${questions.length}`);
}

for (const question of questions) {
  const texts = question.choices.map((choice) => choice.text);
  if (texts.length !== 4 || new Set(texts).size !== 4 || !texts.includes(question.answer.value)) {
    throw new Error(`Invalid choices: ${question.id}`);
  }
  if (![1, 2, 3].includes(question.rarity)) {
    throw new Error(`Invalid rarity: ${question.id}`);
  }
}

const rarityCounts = questions.reduce((acc, card) => {
  acc[card.rarity] = (acc[card.rarity] ?? 0) + 1;
  return acc;
}, {});

await mkdir(new URL("../src/data/soccer/", import.meta.url), { recursive: true });
writeFileSync(outFile, `window.CHIBI_QUEST_SOCCER_CARDS = ${JSON.stringify(questions, null, 2)};\n`);
console.log(`Generated ${questions.length} soccer cards`, rarityCounts);

import { writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";

const outFile = new URL("../src/data/questions/grade3/math/questions.js", import.meta.url);

const unitLabels = {
  multiplication_table: "九九の表とかけ算",
  division_basic: "わり算",
  addition_subtraction_written: "たし算とひき算の筆算",
  time_duration: "時こくと時間",
  large_numbers: "一万をこえる数"
};

const area = "A 数と計算";

function pad(number) {
  return String(number).padStart(3, "0");
}

function q(unit, index, difficulty, questionType, prompt, answer, explanation, extra = {}) {
  const adjustedDifficulty = Math.max(2, difficulty);
  return {
    id: `g3_math_${unit}_${pad(index)}`,
    version: 1,
    grade: 3,
    subject: "math",
    unit,
    unitLabel: unitLabels[unit],
    curriculumArea: unit === "time_duration" ? "C 測定" : area,
    difficulty: adjustedDifficulty,
    questionType,
    prompt,
    choices: extra.choices ?? [],
    answer,
    explanation,
    estimatedSeconds: extra.estimatedSeconds ?? 45,
    skillTags: extra.skillTags ?? [unitLabels[unit]],
    sourcePolicy: {
      basis: ["学習指導要領", "教科書目次"],
      usesTextbookText: false,
      originalContent: true
    },
    status: "active"
  };
}

function numberAnswer(value, unit = "") {
  return { type: "number", value, unit };
}

function textChoices(correct, wrongs) {
  const values = [...new Set([correct, ...wrongs].map(String))];
  const fallback = ["もう一度考える", "わからない", "そのほか"];
  for (const item of fallback) {
    if (values.length >= 4) break;
    if (!values.includes(item)) values.push(item);
  }
  return values.slice(0, 4).map((text, index) => ({ id: String.fromCharCode(97 + index), text }));
}

function choiceAnswer(text) {
  return { type: "choice", value: String(text) };
}

function makeMultiplication() {
  const questions = [];
  let i = 1;
  for (let a = 2; a <= 9 && questions.length < 24; a += 1) {
    for (let b = 2; b <= 9 && questions.length < 24; b += 1) {
      questions.push(q(
        "multiplication_table",
        i++,
        1,
        "numeric_input",
        `${a} × ${b} はいくつ？`,
        numberAnswer(a * b),
        `${a}を${b}こ分あわせるので、${a} × ${b} = ${a * b} です。`,
        { skillTags: ["九九", "かけ算"] }
      ));
    }
  }
  const pairs = [[3, 6], [4, 7], [5, 8], [6, 9], [7, 8], [8, 9], [9, 4], [6, 6], [7, 7], [8, 5], [9, 3], [4, 8], [2, 9]];
  for (const [a, b] of pairs) {
    questions.push(q(
      "multiplication_table",
      i++,
      2,
      "expression_choice",
      `${a}こ入りのふくろが${b}ふくろあります。ぜんぶで何こかをもとめる式はどれ？`,
      choiceAnswer(`${a} × ${b}`),
      `${a}こ入りが${b}ふくろあるので、${a} × ${b} です。`,
      {
        choices: textChoices(`${a} × ${b}`, [`${a} + ${b}`, `${b} - ${a}`, `${a} ÷ ${b}`]),
        skillTags: ["かけ算", "式を選ぶ"]
      }
    ));
  }
  for (let n = 2; questions.length < 50; n += 1) {
    const a = (n % 8) + 2;
    const b = ((n * 3) % 8) + 2;
    questions.push(q(
      "multiplication_table",
      i++,
      2,
      "numeric_input",
      `同じ数ずつならんだカードがあります。${a}まいの列が${b}列あります。カードはぜんぶで何まい？`,
      numberAnswer(a * b, "まい"),
      `${a}まいの列が${b}列あるので、${a} × ${b} = ${a * b} です。`,
      { skillTags: ["かけ算", "文章題"] }
    ));
  }
  return questions;
}

function makeDivision() {
  const questions = [];
  let i = 1;
  for (let divisor = 2; divisor <= 9 && questions.length < 28; divisor += 1) {
    for (let quotient = 2; quotient <= 9 && questions.length < 28; quotient += 1) {
      const total = divisor * quotient;
      questions.push(q(
        "division_basic",
        i++,
        1,
        "numeric_input",
        `${total} ÷ ${divisor} はいくつ？`,
        numberAnswer(quotient),
        `${divisor} × ${quotient} = ${total} なので、${total} ÷ ${divisor} = ${quotient} です。`,
        { skillTags: ["わり算", "九九を使う"] }
      ));
    }
  }
  for (let n = 0; questions.length < 48; n += 1) {
    const people = (n % 8) + 2;
    const each = ((n * 2) % 7) + 2;
    const total = people * each;
    questions.push(q(
      "division_basic",
      i++,
      2,
      "numeric_input",
      `${total}このシールを、${people}人で同じ数ずつ分けます。1人分は何こ？`,
      numberAnswer(each, "こ"),
      `${total} ÷ ${people} = ${each} なので、1人分は${each}こです。`,
      { skillTags: ["わり算", "等分", "文章題"] }
    ));
  }
  for (let n = 0; questions.length < 60; n += 1) {
    const each = (n % 8) + 2;
    const boxes = ((n * 3) % 7) + 3;
    const total = each * boxes;
    questions.push(q(
      "division_basic",
      i++,
      3,
      "numeric_input",
      `${total}このクッキーを、1はこに${each}こずつ入れます。何はこできますか？`,
      numberAnswer(boxes, "はこ"),
      `${total} ÷ ${each} = ${boxes} なので、${boxes}はこできます。`,
      { skillTags: ["わり算", "包含除", "文章題"] }
    ));
  }
  return questions;
}

function makeAdditionSubtraction() {
  const questions = [];
  let i = 1;
  for (let n = 0; questions.length < 24; n += 1) {
    const a = 126 + n * 17;
    const b = 238 + n * 13;
    questions.push(q(
      "addition_subtraction_written",
      i++,
      1,
      "numeric_input",
      `${a} + ${b} はいくつ？`,
      numberAnswer(a + b),
      `一の位、十の位、百の位をそろえて計算します。答えは${a + b}です。`,
      { skillTags: ["筆算", "たし算"] }
    ));
  }
  for (let n = 0; questions.length < 44; n += 1) {
    const b = 146 + n * 11;
    const a = b + 213 + n * 7;
    questions.push(q(
      "addition_subtraction_written",
      i++,
      2,
      "numeric_input",
      `${a} - ${b} はいくつ？`,
      numberAnswer(a - b),
      `位をそろえてひきます。${a} - ${b} = ${a - b} です。`,
      { skillTags: ["筆算", "ひき算"] }
    ));
  }
  for (let n = 0; questions.length < 60; n += 1) {
    const start = 320 + n * 18;
    const add = 125 + n * 9;
    const sold = 98 + n * 6;
    const answer = start + add - sold;
    questions.push(q(
      "addition_subtraction_written",
      i++,
      3,
      "numeric_input",
      `本が${start}さつありました。${add}さつふえて、${sold}さつかし出しました。今は何さつありますか？`,
      numberAnswer(answer, "さつ"),
      `ふえた分をたして、かし出した分をひきます。${start} + ${add} - ${sold} = ${answer} です。`,
      { skillTags: ["筆算", "文章題", "たし算とひき算"] }
    ));
  }
  return questions;
}

function makeTime() {
  const questions = [];
  let i = 1;
  const starts = [[7, 10], [8, 20], [9, 35], [10, 45], [13, 5], [14, 30], [15, 50], [16, 15]];
  const adds = [15, 20, 25, 30, 35, 40, 45, 50, 55, 70];
  for (let n = 0; questions.length < 18; n += 1) {
    const [h, m] = starts[n % starts.length];
    const add = adds[n % adds.length];
    const total = h * 60 + m + add;
    const ah = Math.floor(total / 60);
    const am = total % 60;
    questions.push(q(
      "time_duration",
      i++,
      1,
      "multiple_choice",
      `${h}時${m}分の${add}分後は何時何分？`,
      choiceAnswer(`${ah}時${am}分`),
      `${m}分に${add}分をたすと${m + add}分です。60分をこえたら1時間くり上げます。`,
      {
        choices: textChoices(`${ah}時${am}分`, [`${h + 1}時${(m + add) % 60}分`, `${ah + 1}時${am}分`, `${ah}時${(am + 10) % 60}分`, `${Math.max(0, ah - 1)}時${am}分`]).slice(0, 4),
        skillTags: ["時こく", "時間"]
      }
    ));
  }
  for (let n = 0; questions.length < 32; n += 1) {
    const startH = 8 + (n % 5);
    const startM = [0, 10, 20, 30, 40][n % 5];
    const duration = [35, 45, 50, 65, 80, 95, 110][n % 7];
    const end = startH * 60 + startM + duration;
    const endH = Math.floor(end / 60);
    const endM = end % 60;
    questions.push(q(
      "time_duration",
      i++,
      2,
      "numeric_input",
      `${startH}時${startM}分から${endH}時${endM}分までは何分？`,
      numberAnswer(duration, "分"),
      `始まりから終わりまでを分で数えると${duration}分です。`,
      { skillTags: ["時こく", "時間の長さ"] }
    ));
  }
  for (let n = 0; questions.length < 40; n += 1) {
    const minutes = [75, 90, 100, 120, 135, 150, 180, 195][n % 8];
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const wrongs = [
      `${h}時間${m + 10}分`,
      `${h + 1}時間${m}分`,
      `${Math.max(0, h - 1)}時間${m}分`,
      `${h}時間${(m + 30) % 60}分`
    ];
    questions.push(q(
      "time_duration",
      i++,
      3,
      "multiple_choice",
      `${minutes}分は、何時間何分？`,
      choiceAnswer(`${h}時間${m}分`),
      `60分で1時間です。${minutes}分は${h}時間${m}分です。`,
      {
        choices: textChoices(`${h}時間${m}分`, wrongs),
        skillTags: ["時間", "単位変換"]
      }
    ));
  }
  return questions;
}

function makeLargeNumbers() {
  const questions = [];
  let i = 1;

  const placeValues = [
    [34820, "3万と4千と8百と2十", ["3千と4百と8十と2", "3万と4百と8十と2", "3万と4千と8十と2"]],
    [52006, "5万と2千と6", ["5千と2百と6", "5万と2百と6", "5万と2千と6十"]],
    [70940, "7万と9百と4十", ["7千と9百と4十", "7万と9千と4十", "7万と9十と4"]],
    [86105, "8万と6千と1百と5", ["8千と6百と1十と5", "8万と6千と1十と5", "8万と6百と1百と5"]],
    [43070, "4万と3千と7十", ["4千と3百と7十", "4万と3十と7", "4万と3千と7百"]],
    [90508, "9万と5百と8", ["9千と5百と8", "9万と5千と8", "9万と5十と8"]],
    [67890, "6万と7千と8百と9十", ["6千と7百と8十と9", "6万と7千と8十と9", "6万と8千と7百と9十"]],
    [10450, "1万と4百と5十", ["1千と4百と5十", "1万と4千と5十", "1万と4百と5"]],
    [30009, "3万と9", ["3千と9", "3万と9十", "3万と9百"]],
    [25080, "2万と5千と8十", ["2千と5百と8十", "2万と5百と8十", "2万と5千と8百"]]
  ];

  for (const [value, correct, wrongs] of placeValues) {
    questions.push(q(
      "large_numbers",
      i++,
      3,
      "multiple_choice",
      `${value} の表し方として正しいものはどれ？`,
      choiceAnswer(correct),
      `${value} は、万・千・百・十・一の位に分けて考えます。`,
      {
        choices: textChoices(correct, wrongs),
        skillTags: ["大きな数", "位取り", "数の構成"]
      }
    ));
  }

  const digitQuestions = [
    [48251, "万の位", 4],
    [73508, "万の位", 7],
    [60842, "千の位", 0],
    [91630, "百の位", 6],
    [25047, "十の位", 4],
    [80905, "一の位", 5],
    [34012, "万の位", 3],
    [19080, "千の位", 9],
    [50076, "百の位", 0],
    [76003, "一の位", 3]
  ];

  for (const [value, place, answer] of digitQuestions) {
    questions.push(q(
      "large_numbers",
      i++,
      2,
      "numeric_input",
      `${value} の ${place} の数字はいくつ？`,
      numberAnswer(answer),
      `${value} を位ごとに見ると、${place} の数字は ${answer} です。`,
      { skillTags: ["大きな数", "位取り"] }
    ));
  }

  const comparisonPairs = [
    [34820, 38420],
    [52006, 50260],
    [70940, 70490],
    [86105, 81650],
    [43070, 40370],
    [90508, 95080],
    [67890, 68790],
    [10450, 10045],
    [30009, 30900],
    [25080, 20580]
  ];

  for (const [a, b] of comparisonPairs) {
    const correct = a > b ? `${a} > ${b}` : `${a} < ${b}`;
    const wrongs = a > b
      ? [`${a} < ${b}`, `${a} = ${b}`, `${b} > ${a}`]
      : [`${a} > ${b}`, `${a} = ${b}`, `${b} < ${a}`];
    questions.push(q(
      "large_numbers",
      i++,
      2,
      "multiple_choice",
      `${a} と ${b} の大小をくらべます。正しいのはどれ？`,
      choiceAnswer(correct),
      `万、千、百の位の順にくらべます。正しいのは ${correct} です。`,
      {
        choices: textChoices(correct, wrongs),
        skillTags: ["大きな数", "大小比較"]
      }
    ));
  }

  const changes = [
    [24800, 1000, "たす"],
    [50600, 10000, "たす"],
    [73200, 1000, "ひく"],
    [91050, 100, "ひく"],
    [45980, 10, "たす"],
    [68000, 10000, "ひく"],
    [29900, 100, "たす"],
    [80420, 1000, "ひく"],
    [12090, 10, "ひく"],
    [39000, 1000, "たす"]
  ];

  for (const [base, amount, operation] of changes) {
    const answer = operation === "たす" ? base + amount : base - amount;
    questions.push(q(
      "large_numbers",
      i++,
      3,
      "numeric_input",
      `${base} に ${amount} を${operation}といくつ？`,
      numberAnswer(answer),
      `${base} に ${amount} を${operation}ので、答えは ${answer} です。位がどう変わるかを考えます。`,
      { skillTags: ["大きな数", "位取り", "計算"] }
    ));
  }

  const wordProblems = [
    ["図書館に本が 24850 さつあります。新しく 1000 さつ入りました。全部で何さつ？", 25850, "24850 に 1000 をたすと 25850 です。"],
    ["店にカードが 36200 まいあります。2000 まい売れました。残りは何まい？", 34200, "36200 から 2000 をひくと 34200 です。"],
    ["A町の人口は 50340 人、B町は 53040 人です。多い方はどれ？", "B町", "万の位が同じなので、千の位から順にくらべます。B町の方が多いです。", ["A町", "同じ", "くらべられない"]],
    ["85000 は 80000 よりいくつ大きい？", 5000, "85000 と 80000 の差は 5000 です。"],
    ["4万、6千、3百を合わせた数はいくつ？", 46300, "4万=40000、6千=6000、3百=300 なので 46300 です。"],
    ["70200 は 70000 とあといくつ？", 200, "70200 は 70000 より 200 大きい数です。"],
    ["9990 に 10 をたすと、位が変わっていくつ？", 10000, "9990 に 10 をたすと 10000 になります。"],
    ["59000 に 1000 をたすと、何万になる？", "6万", "59000 + 1000 = 60000 なので 6万です。", ["5万", "59万", "6000"]],
    ["数直線で 30000 と 40000 のちょうどまん中はどれ？", 35000, "30000 と 40000 のまん中は 35000 です。"],
    ["72000、70200、70020 を大きい順にした最初の数はどれ？", 72000, "万の位、千の位、百の位の順にくらべると 72000 がいちばん大きいです。"]
  ];

  for (const [prompt, answer, explanation, wrongs = ["A町", "同じ", "くらべられない"]] of wordProblems) {
    const isNumber = typeof answer === "number";
    questions.push(q(
      "large_numbers",
      i++,
      3,
      isNumber ? "numeric_input" : "multiple_choice",
      prompt,
      isNumber ? numberAnswer(answer) : choiceAnswer(answer),
      explanation,
      isNumber
        ? { skillTags: ["大きな数", "文章題", "位取り"] }
        : {
          choices: textChoices(answer, wrongs.filter((value) => value !== answer)),
          skillTags: ["大きな数", "文章題", "大小比較"]
        }
    ));
  }

  return questions;
}

const questions = [
  ...makeMultiplication(),
  ...makeDivision(),
  ...makeAdditionSubtraction(),
  ...makeTime(),
  ...makeLargeNumbers()
];

if (questions.length !== 260) {
  throw new Error(`Expected 260 questions, got ${questions.length}`);
}

await mkdir(new URL("../src/data/questions/grade3/math/", import.meta.url), { recursive: true });
writeFileSync(outFile, `window.CHIBI_QUEST_QUESTIONS = ${JSON.stringify(questions, null, 2)};\n`);
console.log(`Generated ${questions.length} questions`);

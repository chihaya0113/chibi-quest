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

// division_basic は chibique-question-design-core 準拠の刷新版(パイロット単元)。
// IDは101番台(旧001-060の解答履歴と混ざらないよう再利用しない)。
// difficultyは5軸(knowledge/info/steps/format/choices 各1-3)の合計から算出する。
function difficultyFromAxes(axes) {
  const sum = axes.knowledge + axes.info + axes.steps + axes.format + axes.choices;
  if (sum <= 6) return 1;
  if (sum <= 8) return 2;
  if (sum <= 10) return 3;
  if (sum <= 12) return 4;
  return 5;
}

function makeDivision() {
  const questions = [];
  let index = 101;

  // family単位の共通メタデータを1回だけ書き、各問題に展開する
  const fam = (meta, items) => {
    for (const item of items) {
      questions.push({
        id: `g3_math_division_basic_${pad(index++)}`,
        version: 2,
        grade: 3,
        subject: "math",
        unit: "division_basic",
        unitLabel: unitLabels.division_basic,
        curriculumArea: area,
        difficulty: difficultyFromAxes(item.axes),
        difficultyAxes: item.axes,
        questionType: item.questionType,
        prompt: item.prompt,
        choices: item.choices ?? [],
        answer: item.answer,
        explanation: item.explanation,
        estimatedSeconds: item.estimatedSeconds ?? meta.estimatedSeconds,
        skillTags: item.soccer ? [...meta.skillTags, "soccer_context"] : meta.skillTags,
        familyId: meta.familyId,
        learningObjective: meta.learningObjective,
        funMechanic: meta.funMechanic,
        commonMistake: meta.commonMistake,
        sourcePolicy: {
          basis: ["学習指導要領", "教科書目次"],
          usesTextbookText: false,
          originalContent: true
        },
        status: "active"
      });
    }
  };

  const drillAxes = { knowledge: 1, info: 1, steps: 1, format: 1, choices: 1 };

  // F1 九九で商を求める(drill, d1)
  fam({
    familyId: "div_fact",
    funMechanic: "drill",
    learningObjective: "九九を使って、わり算の答えを求められる",
    commonMistake: "九九のだんを取りちがえて、商を1ずれで答える",
    estimatedSeconds: 30,
    skillTags: ["わり算", "九九を使う"]
  }, [
    [18, 6], [28, 4], [45, 9], [56, 7], [72, 8]
  ].map(([total, divisor]) => ({
    axes: drillAxes,
    questionType: "numeric_input",
    prompt: `${total} ÷ ${divisor} はいくつ？`,
    answer: numberAnswer(total / divisor),
    explanation: `${divisor} × ${total / divisor} = ${total} なので、${total} ÷ ${divisor} = ${total / divisor} です。`
  })));

  // F2 0と1のわり算(drill, d1)
  fam({
    familyId: "div_special",
    funMechanic: "drill",
    learningObjective: "0や1がまじったわり算のきまりがわかる",
    commonMistake: "0 ÷ 6 を 6 と答える(わる数をそのまま書く)",
    estimatedSeconds: 30,
    skillTags: ["わり算", "0と1のわり算"]
  }, [
    { prompt: "0 ÷ 6 はいくつ？", answer: numberAnswer(0), explanation: "0をどんな数でわっても、答えは0です。" },
    { prompt: "8 ÷ 8 はいくつ？", answer: numberAnswer(1), explanation: "同じ数でわると、答えはいつも1です。8 ÷ 8 = 1 です。" },
    { prompt: "9 ÷ 1 はいくつ？", answer: numberAnswer(9), explanation: "1でわっても数は変わりません。9 ÷ 1 = 9 です。" },
    { prompt: "5 ÷ 5 はいくつ？", answer: numberAnswer(1), explanation: "同じ数でわると、答えはいつも1です。5 ÷ 5 = 1 です。" }
  ].map((item) => ({ ...item, axes: drillAxes, questionType: "numeric_input" })));

  // F3 かけ算の□を求める(drill, d1)
  fam({
    familyId: "div_inverse_blank",
    funMechanic: "drill",
    learningObjective: "かけ算の式の□を、わり算で求められる",
    commonMistake: "□を求めずに、見えている2つの数をかけてしまう",
    estimatedSeconds: 45,
    skillTags: ["わり算", "かけ算とわり算"]
  }, [
    { prompt: "□ × 4 = 32。□に入る数はいくつ？", answer: numberAnswer(8), explanation: "32 ÷ 4 = 8 なので、□は8です。8 × 4 = 32 でたしかめられます。" },
    { prompt: "6 × □ = 42。□に入る数はいくつ？", answer: numberAnswer(7), explanation: "42 ÷ 6 = 7 なので、□は7です。6 × 7 = 42 でたしかめられます。" },
    { prompt: "□ × 9 = 54。□に入る数はいくつ？", answer: numberAnswer(6), explanation: "54 ÷ 9 = 6 なので、□は6です。6 × 9 = 54 でたしかめられます。" }
  ].map((item) => ({ ...item, axes: { knowledge: 1, info: 1, steps: 1, format: 2, choices: 1 }, questionType: "numeric_input" })));

  const wordAxes = { knowledge: 1, info: 2, steps: 3, format: 1, choices: 1 };

  // F4 同じ数ずつ分ける(等分除の文章題, drill, d2)
  fam({
    familyId: "div_equal_share",
    funMechanic: "drill",
    learningObjective: "同じ数ずつ分ける場面を、わり算の式に表せる",
    commonMistake: "分ける人数のほうを答えにしてしまう",
    estimatedSeconds: 60,
    skillTags: ["わり算", "等分", "文章題"]
  }, [
    { prompt: "いちごが24こあります。4人で同じ数ずつ分けると、1人分は何こ？", answer: numberAnswer(6, "こ"), explanation: "24 ÷ 4 = 6 なので、1人分は6こです。" },
    { prompt: "色紙が35まいあります。5人で同じ数ずつ分けると、1人分は何まい？", answer: numberAnswer(7, "まい"), explanation: "35 ÷ 5 = 7 なので、1人分は7まいです。" },
    { prompt: "えんぴつが54本あります。6人で同じ数ずつ分けると、1人分は何本？", answer: numberAnswer(9, "本"), explanation: "54 ÷ 6 = 9 なので、1人分は9本です。" },
    { prompt: "シールが63まいあります。7人で同じ数ずつ分けると、1人分は何まい？", answer: numberAnswer(9, "まい"), explanation: "63 ÷ 7 = 9 なので、1人分は9まいです。" },
    { prompt: "サッカーボールが16こあります。2チームで同じ数ずつ分けると、1チーム分は何こ？", answer: numberAnswer(8, "こ"), explanation: "16 ÷ 2 = 8 なので、1チーム分は8こです。", soccer: true }
  ].map((item) => ({ ...item, axes: wordAxes, questionType: "numeric_input" })));

  // F5 いくつ分を求める(包含除の文章題, drill, d2)
  fam({
    familyId: "div_grouping",
    funMechanic: "drill",
    learningObjective: "「いくつ分できるか」を求める場面を、わり算の式に表せる",
    commonMistake: "1人分を求める分け方と混同して、答えの単位をまちがえる",
    estimatedSeconds: 60,
    skillTags: ["わり算", "包含除", "文章題"]
  }, [
    { prompt: "あめが30こあります。1人に6こずつくばると、何人にくばれる？", answer: numberAnswer(5, "人"), explanation: "30 ÷ 6 = 5 なので、5人にくばれます。" },
    { prompt: "ドーナツが28こあります。1はこに7こずつ入れると、何はこできる？", answer: numberAnswer(4, "はこ"), explanation: "28 ÷ 7 = 4 なので、4はこできます。" },
    { prompt: "花が48本あります。8本ずつたばにすると、何たばできる？", answer: numberAnswer(6, "たば"), explanation: "48 ÷ 8 = 6 なので、6たばできます。" },
    { prompt: "36ページの本を、1日に4ページずつ読みます。何日で読み終わる？", answer: numberAnswer(9, "日"), explanation: "36 ÷ 4 = 9 なので、9日で読み終わります。" },
    { prompt: "20人で、1チーム5人のミニゲームをします。チームはいくつできる？", answer: numberAnswer(4, "チーム"), explanation: "20 ÷ 5 = 4 なので、4チームできます。", soccer: true }
  ].map((item) => ({ ...item, axes: wordAxes, questionType: "numeric_input" })));

  // F6 場面に合う式を選ぶ(best_choice, d2)
  fam({
    familyId: "div_expression",
    funMechanic: "best_choice",
    learningObjective: "場面から正しいわり算の式を選べる",
    commonMistake: "わられる数とわる数を反対にした式を選ぶ",
    estimatedSeconds: 60,
    skillTags: ["わり算", "式を選ぶ"]
  }, [
    { prompt: "27まいのカードを、9人で同じ数ずつ分けます。1人分をもとめる式はどれ？", correct: "27 ÷ 9", wrongs: ["9 ÷ 27", "27 × 9", "27 - 9"], explanation: "ぜんぶの数を人数で分けるので、27 ÷ 9 です。" },
    { prompt: "40このあめを、1ふくろに8こずつ入れます。ふくろの数をもとめる式はどれ？", correct: "40 ÷ 8", wrongs: ["8 ÷ 40", "40 × 8", "40 - 8"], explanation: "ぜんぶの数を1ふくろ分の数で分けるので、40 ÷ 8 です。" },
    { prompt: "ジュースが18本あります。3人で同じ数ずつ分けます。1人分をもとめる式はどれ？", correct: "18 ÷ 3", wrongs: ["3 ÷ 18", "18 × 3", "18 + 3"], explanation: "ぜんぶの数を人数で分けるので、18 ÷ 3 です。" },
    { prompt: "シュートれんしゅうをぜんぶで42回します。1日に7回ずつやると、何日かかるかをもとめる式はどれ？", correct: "42 ÷ 7", wrongs: ["7 ÷ 42", "42 × 7", "42 - 7"], explanation: "ぜんぶの回数を1日分の回数で分けるので、42 ÷ 7 です。", soccer: true }
  ].map((item) => ({
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 },
    questionType: "expression_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation,
    soccer: item.soccer
  })));

  // F7 どの九九のだんを使うか(rule_discovery, d2)
  fam({
    familyId: "div_which_row",
    funMechanic: "rule_discovery",
    learningObjective: "わり算の答えは、わる数のだんの九九で見つけられることがわかる",
    commonMistake: "わる数ではなく、答えの数のだんを選んでしまう",
    estimatedSeconds: 45,
    skillTags: ["わり算", "九九を使う"]
  }, [
    { prompt: "54 ÷ 9 の答えを見つけるには、九九のどのだんを使う？", correct: "9のだん", wrongs: ["5のだん", "4のだん", "6のだん"], explanation: "わる数は9なので、9のだんで54になる九九をさがします。9 × 6 = 54 です。" },
    { prompt: "32 ÷ 4 の答えを見つけるには、九九のどのだんを使う？", correct: "4のだん", wrongs: ["3のだん", "2のだん", "8のだん"], explanation: "わる数は4なので、4のだんで32になる九九をさがします。4 × 8 = 32 です。" },
    { prompt: "63 ÷ 7 の答えを見つけるには、九九のどのだんを使う？", correct: "7のだん", wrongs: ["6のだん", "3のだん", "9のだん"], explanation: "わる数は7なので、7のだんで63になる九九をさがします。7 × 9 = 63 です。" },
    { prompt: "48 ÷ 6 の答えを見つけるには、九九のどのだんを使う？", correct: "6のだん", wrongs: ["4のだん", "8のだん", "7のだん"], explanation: "わる数は6なので、6のだんで48になる九九をさがします。6 × 8 = 48 です。" }
  ].map((item) => ({
    axes: { knowledge: 1, info: 1, steps: 2, format: 3, choices: 1 },
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F8 かくれた数を当てる(inference, d3)
  fam({
    familyId: "div_hidden_number",
    funMechanic: "inference",
    learningObjective: "わり算とかけ算の関係を使って、かくれた数を求められる",
    commonMistake: "問題に見えている2つの数を、そのままわってしまう",
    estimatedSeconds: 75,
    skillTags: ["わり算", "かけ算とわり算", "文章題"]
  }, [
    { prompt: "30このあめを、何人かで同じ数ずつ分けたら、1人分がちょうど5こになりました。何人で分けた？", answer: numberAnswer(6, "人"), explanation: "30 ÷ 5 = 6 なので、6人で分けました。" },
    { prompt: "えんぴつを4人で同じ数ずつ分けたら、1人分がちょうど6本になりました。えんぴつはぜんぶで何本あった？", answer: numberAnswer(24, "本"), explanation: "1人分6本が4人分なので、6 × 4 = 24 で、ぜんぶで24本です。" },
    { prompt: "ヒント1：九九の7のだんの答えです。ヒント2：6でわると7になります。この数はいくつ？", answer: numberAnswer(42), explanation: "6でわると7になる数は、6 × 7 = 42 です。42は7 × 6 なので、7のだんの答えでもあります。" },
    { prompt: "ヒント1：九九の8のだんの答えです。ヒント2：40より大きくて、50より小さいです。この数はいくつ？", answer: numberAnswer(48), explanation: "8のだんで40より大きくて50より小さいのは、8 × 6 = 48 だけです。" },
    { prompt: "ボールを3つのかごに同じ数ずつ入れたら、1つのかごがちょうど9こになりました。ボールはぜんぶで何こ？", answer: numberAnswer(27, "こ"), explanation: "1かご9こが3かご分なので、9 × 3 = 27 で、ぜんぶで27こです。", soccer: true }
  ].map((item) => ({ ...item, axes: { knowledge: 1, info: 2, steps: 3, format: 2, choices: 1 }, questionType: "numeric_input" })));

  // F9 まちがい見つけ(find_mistake, d3)
  fam({
    familyId: "div_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "わり算の答えをかけ算でたしかめて、まちがいを見つけられる",
    commonMistake: "九九の近くの答え(1ずれ)を正しいと思いこむ",
    estimatedSeconds: 90,
    skillTags: ["わり算", "たしかめ"]
  }, [
    { prompt: "まちがっている計算は、どれ？", correct: "63 ÷ 9 = 8", wrongs: ["24 ÷ 6 = 4", "45 ÷ 5 = 9", "16 ÷ 2 = 8"], explanation: "9 × 8 = 72 なので、63 ÷ 9 = 8 はまちがいです。正しくは 9 × 7 = 63 で、答えは7です。" },
    { prompt: "まちがっている計算は、どれ？", correct: "36 ÷ 4 = 8", wrongs: ["21 ÷ 3 = 7", "40 ÷ 8 = 5", "18 ÷ 9 = 2"], explanation: "4 × 8 = 32 なので、36 ÷ 4 = 8 はまちがいです。正しくは 4 × 9 = 36 で、答えは9です。" },
    { prompt: "まちがっている計算は、どれ？", correct: "64 ÷ 8 = 7", wrongs: ["49 ÷ 7 = 7", "54 ÷ 6 = 9", "30 ÷ 5 = 6"], explanation: "8 × 7 = 56 なので、64 ÷ 8 = 7 はまちがいです。正しくは 8 × 8 = 64 で、答えは8です。" },
    { prompt: "みおさんは「0 ÷ 8 = 8」と答えました。正しい直し方はどれ？", correct: "0をどんな数でわっても0だから、答えは0", wrongs: ["みおさんの答えで正しい", "0でわるのと同じだから、答えは1", "0 + 8 = 8 だから、答えは8"], explanation: "0をどんな数でわっても、答えは0です。0 ÷ 8 = 0 です。" },
    { prompt: "コーチが「ボール18こを6人で分けると、1人4こ」と言いました。正しく直すと、1人何こ？", correct: "1人3こ", wrongs: ["1人4こで正しい", "1人2こ", "1人6こ"], explanation: "18 ÷ 6 = 3 なので、1人3こです。6 × 4 = 24 になってしまうので、4こはまちがいです。", soccer: true }
  ].map((item) => ({
    axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 2 },
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation,
    soccer: item.soccer
  })));

  // F10 どっちの言い分が正しい？(judge_claim, d3)
  const judgeChoices = ["二人とも正しい", "はるとだけ正しい", "みおだけ正しい", "二人ともまちがい"];
  fam({
    familyId: "div_judge_claim",
    funMechanic: "judge_claim",
    learningObjective: "わり算の意味を、分け方のちがう2つの場面や別の考え方で説明できる",
    commonMistake: "わり算の意味を1つの場面だけと思いこむ",
    estimatedSeconds: 90,
    skillTags: ["わり算", "意味の理解"]
  }, [
    { prompt: "はると「12 ÷ 3 は、12こを3人で同じ数ずつ分けた1人分」。みお「12 ÷ 3 は、12こを3こずつ分けたときの人数」。正しいのはどっち？", correct: "二人とも正しい", explanation: "わり算には「同じ数ずつ分ける」と「いくつ分できるか」の2つの意味があります。どちらも 12 ÷ 3 = 4 です。" },
    { prompt: "はると「7 ÷ 7 = 1 だよ」。みお「7 ÷ 7 = 0 だよ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "同じ数でわると答えは1です。7 ÷ 7 = 1 なので、はるとが正しいです。" },
    { prompt: "はると「56 ÷ 8 は、8のだんの九九で見つける」。みお「56 ÷ 8 は、5のだんの九九で見つける」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "わる数のだんを使います。8のだんで 8 × 7 = 56 なので、答えは7です。" },
    { prompt: "20 ÷ 4 について。はると「答えは、20から4を何回ひけるかと同じ」。みお「答えは、4のだんの九九で見つけられる」。正しいのはどっち？", correct: "二人とも正しい", explanation: "20から4を5回ひくと0になり、4 × 5 = 20 でも見つけられます。どちらの考え方でも答えは5です。" }
  ].map((item) => ({
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 },
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, judgeChoices.filter((choice) => choice !== item.correct)),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F11 どっちが多い？を予想してたしかめる(predict_check, d4)
  fam({
    familyId: "div_predict_compare",
    funMechanic: "predict_check",
    learningObjective: "わり算の答えの大きさを予想して、計算でたしかめられる",
    commonMistake: "わる数が大きいほど、答えも大きくなると思いこむ",
    estimatedSeconds: 90,
    skillTags: ["わり算", "大小比較"]
  }, [
    { prompt: "30このクッキーを5人で分けるときと、6人で分けるとき。1人分が多いのはどっち？", correct: "5人で分けるとき", wrongs: ["6人で分けるとき", "どちらも同じ", "くらべられない"], explanation: "30 ÷ 5 = 6、30 ÷ 6 = 5 です。分ける人数が少ないほど、1人分は多くなります。" },
    { prompt: "24まいの色紙を3人で分けるときと、36まいの色紙を6人で分けるとき。1人分が多いのはどっち？", correct: "24まいを3人で分けるとき", wrongs: ["36まいを6人で分けるとき", "どちらも同じ", "くらべられない"], explanation: "24 ÷ 3 = 8、36 ÷ 6 = 6 です。ぜんぶの数が少なくても、1人分が多いことがあります。" },
    { prompt: "48本のジュースを、6本ずつはこに入れるときと、8本ずつはこに入れるとき。はこの数が多いのはどっち？", correct: "6本ずつ入れるとき", wrongs: ["8本ずつ入れるとき", "どちらも同じ", "くらべられない"], explanation: "48 ÷ 6 = 8、48 ÷ 8 = 6 です。1はこに入れる数が少ないほど、はこの数は多くなります。" },
    { prompt: "63このみかんを、9こずつはこに入れるときと、7こずつはこに入れるとき。はこの数が少なくてすむのはどっち？", correct: "9こずつ入れるとき", wrongs: ["7こずつ入れるとき", "どちらも同じ", "くらべられない"], explanation: "63 ÷ 9 = 7、63 ÷ 7 = 9 です。1はこにたくさん入れるほど、はこの数は少なくてすみます。" }
  ].map((item) => ({
    axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 1 },
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F12 きまり・ならびを見つける(rule_discovery, d3-d4)
  fam({
    familyId: "div_rule_pattern",
    funMechanic: "rule_discovery",
    learningObjective: "わり算のならびからきまりを見つけて、次の答えを求められる",
    commonMistake: "ならびのきまりを見ずに、1つ前の答えをそのまま書く",
    estimatedSeconds: 90,
    skillTags: ["わり算", "きまり見つけ"]
  }, [
    { prompt: "6 ÷ 3 = 2、12 ÷ 3 = 4、18 ÷ 3 = 6。このならびのつぎ、24 ÷ 3 はいくつ？", answer: numberAnswer(8), explanation: "わられる数が6ふえるごとに、答えは2ずつふえています。24 ÷ 3 = 8 です。", axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 1 } },
    { prompt: "10 ÷ 2 = 5、20 ÷ 2 = 10、30 ÷ 2 = 15。このならびのつぎ、40 ÷ 2 はいくつ？", answer: numberAnswer(20), explanation: "答えは5ずつふえています。40 ÷ 2 = 20 です。10のまとまりで考えると、4 ÷ 2 = 2 から20とわかります。", axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 1 } },
    { prompt: "81 ÷ 9 = 9、72 ÷ 9 = 8、63 ÷ 9 = 7。このならびのつぎ、54 ÷ 9 はいくつ？", answer: numberAnswer(6), explanation: "わられる数が9へるごとに、答えは1ずつへっています。54 ÷ 9 = 6 です。", axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 1 } },
    { prompt: "10のまとまりで考えます。80 ÷ 4 はいくつ？", answer: numberAnswer(20), explanation: "80は10が8こです。8 ÷ 4 = 2 なので、10のまとまりが2こで20です。", axes: { knowledge: 3, info: 1, steps: 2, format: 2, choices: 1 } }
  ].map((item) => ({ ...item, questionType: "numeric_input" })));

  // F13 解き方をくらべる(compare_methods, d3-d5)
  fam({
    familyId: "div_compare_methods",
    funMechanic: "compare_methods",
    learningObjective: "ちがう式や考え方でも、同じ答えになることをたしかめられる",
    commonMistake: "式の形がちがうと、答えもちがうと思いこむ",
    estimatedSeconds: 90,
    skillTags: ["わり算", "解き方くらべ"]
  }, [
    {
      prompt: "56 ÷ 7 と同じ答えになる式は、どれ？",
      correct: "64 ÷ 8", wrongs: ["49 ÷ 7", "54 ÷ 6", "42 ÷ 7"],
      explanation: "56 ÷ 7 = 8 です。64 ÷ 8 = 8 なので、同じ答えになります。ほかの式の答えは7、9、6です。",
      axes: { knowledge: 2, info: 2, steps: 3, format: 2, choices: 3 }, questionType: "multiple_choice"
    },
    {
      prompt: "36 ÷ 4 を、はるとは「4 × □ = 36 の□をさがす」で、みおは「36から4を何回ひけるか数える」で考えました。二人の答えはどうなる？",
      correct: "二人とも9になる", wrongs: ["はるとだけ9になる", "みおだけ9になる", "二人ともちがう答えになる"],
      explanation: "4 × 9 = 36 で、36から4は9回ひけます。考え方がちがっても、答えは同じ9です。",
      axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }, questionType: "multiple_choice"
    },
    {
      prompt: "24このあめを「4人で分けて、その1人分をさらに2人で分ける」のと、「はじめから8人で分ける」の。さいごの1人分はどうなる？",
      correct: "どちらも3こで同じ", wrongs: ["4人→2人のほうが多い", "8人で分けるほうが多い", "くらべられない"],
      explanation: "24 ÷ 4 = 6、6 ÷ 2 = 3 です。24 ÷ 8 = 3 なので、どちらも3こになります。",
      axes: { knowledge: 3, info: 3, steps: 3, format: 2, choices: 2 }, questionType: "multiple_choice"
    },
    {
      prompt: "72 ÷ 8 の答えの見つけ方として、正しいものはどれ？",
      correct: "8のだんで、答えが72になる九九をさがす", wrongs: ["72のだんの九九をさがす", "72から8をたしていく", "8 × 72 を計算する"],
      explanation: "わる数8のだんで72になる九九をさがすと、8 × 9 = 72 です。答えは9です。",
      axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 2 }, questionType: "multiple_choice"
    }
  ].map((item) => ({
    axes: item.axes,
    questionType: item.questionType,
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F14 2つの手がかりでとくパズル(inference, d4)
  fam({
    familyId: "div_multi_step",
    funMechanic: "inference",
    learningObjective: "わり算を2回、またはわり算とかけ算を組み合わせて、答えまでの道すじを自分で組み立てられる",
    commonMistake: "1回目のわり算で計算をやめてしまう",
    estimatedSeconds: 120,
    skillTags: ["わり算", "文章題", "組み合わせ"]
  }, [
    { prompt: "ある数を6でわると、答えは7です。同じ「ある数」を7でわると、答えはいくつ？", answer: numberAnswer(6), explanation: "6でわると7になる数は 6 × 7 = 42 です。42 ÷ 7 = 6 です。" },
    { prompt: "クッキーが同じ数ずつ入ったはこが4つあり、ぜんぶで32こです。はこ1つ分を2人で分けると、1人何こ？", answer: numberAnswer(4, "こ"), explanation: "32 ÷ 4 = 8 で、1はこ8こです。8 ÷ 2 = 4 なので、1人4こです。" },
    { prompt: "18人を、同じ人数の3チームに分けます。1チームの中で2人ずつのペアを作ると、ペアはいくつできる？", answer: numberAnswer(3, "ペア"), explanation: "18 ÷ 3 = 6 で、1チーム6人です。6 ÷ 2 = 3 なので、ペアは3つできます。", soccer: true },
    { prompt: "同じねだんのシール8まいで、ぜんぶで72円でした。このシールを3まい買うと、何円？", answer: numberAnswer(27, "円"), explanation: "72 ÷ 8 = 9 で、1まい9円です。9 × 3 = 27 なので、27円です。" }
  ].map((item) => ({ ...item, axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 1 }, questionType: "numeric_input" })));

  if (questions.length !== 60) {
    throw new Error(`division_basic: expected 60 questions, got ${questions.length}`);
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

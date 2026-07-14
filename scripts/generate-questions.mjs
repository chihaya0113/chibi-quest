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

// 全単元共通のfamilyビルダー(chibique-question-design-core準拠)。
// IDは101番台から振る(旧IDの解答履歴と混ざらないよう再利用しない)。
function makeFamilyBuilder(unit, startIndex = 101) {
  const questions = [];
  let index = startIndex;
  const fam = (meta, items) => {
    for (const item of items) {
      questions.push({
        id: `g3_math_${unit}_${pad(index++)}`,
        version: 2,
        grade: 3,
        subject: "math",
        unit,
        unitLabel: unitLabels[unit],
        curriculumArea: unit === "time_duration" ? "C 測定" : area,
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
  return { questions, fam };
}

// difficultyは5軸(knowledge/info/steps/format/choices 各1-3)の合計から算出する。
function difficultyFromAxes(axes) {
  const sum = axes.knowledge + axes.info + axes.steps + axes.format + axes.choices;
  if (sum <= 6) return 1;
  if (sum <= 8) return 2;
  if (sum <= 10) return 3;
  if (sum <= 12) return 4;
  return 5;
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
  const { questions, fam } = makeFamilyBuilder("multiplication_table");

  const drillAxes = { knowledge: 1, info: 1, steps: 1, format: 1, choices: 1 };

  // F1 九九そのまま(drill, d1)
  fam({
    familyId: "mul_fact",
    funMechanic: "drill",
    learningObjective: "九九の答えをすぐに出せる",
    commonMistake: "となりのだんの九九と混同して1ずれで答える",
    estimatedSeconds: 30,
    skillTags: ["九九", "かけ算"]
  }, [
    [7, 6], [8, 4], [9, 7], [6, 6], [3, 9]
  ].map(([a, b]) => ({
    axes: drillAxes,
    questionType: "numeric_input",
    prompt: `${a} × ${b} はいくつ？`,
    answer: numberAnswer(a * b),
    explanation: `${a}を${b}こ分あわせるので、${a} × ${b} = ${a * b} です。`
  })));

  // F2 九九の□をうめる(drill, d1)
  fam({
    familyId: "mul_gap",
    funMechanic: "drill",
    learningObjective: "九九の式の□に入る数を見つけられる",
    commonMistake: "□をとばして、見えている2つの数をかけてしまう",
    estimatedSeconds: 45,
    skillTags: ["九九", "かけ算"]
  }, [
    { prompt: "6 × □ = 48。□に入る数はいくつ？", answer: numberAnswer(8), explanation: "6のだんで48になるのは 6 × 8 = 48 です。□は8です。" },
    { prompt: "□ × 7 = 35。□に入る数はいくつ？", answer: numberAnswer(5), explanation: "5 × 7 = 35 なので、□は5です。" },
    { prompt: "9 × □ = 81。□に入る数はいくつ？", answer: numberAnswer(9), explanation: "9 × 9 = 81 なので、□は9です。" },
    { prompt: "□ × 3 = 24。□に入る数はいくつ？", answer: numberAnswer(8), explanation: "8 × 3 = 24 なので、□は8です。" },
    { prompt: "8 × □ = 56。□に入る数はいくつ？", answer: numberAnswer(7), explanation: "8 × 7 = 56 なので、□は7です。" }
  ].map((item) => ({ ...item, axes: { knowledge: 1, info: 1, steps: 1, format: 2, choices: 1 }, questionType: "numeric_input" })));

  // F3 ならび・まとまりの文章題(drill, d2)
  fam({
    familyId: "mul_array_word",
    funMechanic: "drill",
    learningObjective: "「1つ分×いくつ分」の場面をかけ算の式に表せる",
    commonMistake: "かけ算にせず、2つの数をたしてしまう",
    estimatedSeconds: 60,
    skillTags: ["かけ算", "文章題"]
  }, [
    { prompt: "1れつに6人ずつ、4れつにならびます。ぜんぶで何人？", answer: numberAnswer(6 * 4, "人"), explanation: "6人の4れつ分なので、6 × 4 = 24 です。" },
    { prompt: "1週間は7日です。3週間は何日？", answer: numberAnswer(7 * 3, "日"), explanation: "7日が3つ分なので、7 × 3 = 21 です。" },
    { prompt: "1はこに8こ入りのチョコが5はこあります。ぜんぶで何こ？", answer: numberAnswer(8 * 5, "こ"), explanation: "8こが5はこ分なので、8 × 5 = 40 です。" },
    { prompt: "自転車が9台あります。タイヤは1台に2つずつです。タイヤはぜんぶでいくつ？", answer: numberAnswer(2 * 9, "つ"), explanation: "2つが9台分なので、2 × 9 = 18 です。" },
    { prompt: "シュートれんしゅうを1日に4回ずつ、6日間しました。ぜんぶで何回？", answer: numberAnswer(4 * 6, "回"), explanation: "4回が6日分なので、4 × 6 = 24 です。", soccer: true }
  ].map((item) => ({ ...item, axes: { knowledge: 1, info: 2, steps: 3, format: 1, choices: 1 }, questionType: "numeric_input" })));

  // F4 「〜ばい」の文章題(drill, d2)
  fam({
    familyId: "mul_times_word",
    funMechanic: "drill",
    learningObjective: "「〜ばい」の大きさをかけ算で求められる",
    commonMistake: "ばいの数をかけずに、たしてしまう(5+3など)",
    estimatedSeconds: 60,
    skillTags: ["かけ算", "ばい", "文章題"]
  }, [
    { prompt: "赤いリボンは5cmです。青いリボンは赤の3ばいの長さです。青いリボンは何cm？", answer: numberAnswer(5 * 3, "cm"), explanation: "5cmの3ばいなので、5 × 3 = 15 です。" },
    { prompt: "みかんが4こあります。りんごはみかんの2ばいの数です。りんごは何こ？", answer: numberAnswer(4 * 2, "こ"), explanation: "4この2ばいなので、4 × 2 = 8 です。" },
    { prompt: "弟は6さいです。お父さんの年れいは弟の6ばいです。お父さんは何さい？", answer: numberAnswer(6 * 6, "さい"), explanation: "6さいの6ばいなので、6 × 6 = 36 です。" },
    { prompt: "白いテープは7cmです。黒いテープは白の4ばいの長さです。黒いテープは何cm？", answer: numberAnswer(7 * 4, "cm"), explanation: "7cmの4ばいなので、7 × 4 = 28 です。" },
    { prompt: "水そうに金魚が3びきいます。メダカは金魚の5ばいの数です。メダカは何びき？", answer: numberAnswer(3 * 5, "ひき"), explanation: "3びきの5ばいなので、3 × 5 = 15 です。" }
  ].map((item) => ({ ...item, axes: { knowledge: 1, info: 2, steps: 3, format: 1, choices: 1 }, questionType: "numeric_input" })));

  // F5 場面に合う式を選ぶ(best_choice, d2)
  fam({
    familyId: "mul_expression",
    funMechanic: "best_choice",
    learningObjective: "かけ算を使う場面かどうかを判断して式を選べる",
    commonMistake: "「ずつ」「ばい」の場面でもたし算の式を選んでしまう",
    estimatedSeconds: 60,
    skillTags: ["かけ算", "式を選ぶ"]
  }, [
    { prompt: "1ふくろ6こ入りのあめが7ふくろあります。ぜんぶの数をもとめる式はどれ？", correct: "6 × 7", wrongs: ["6 + 7", "7 - 6", "6 + 6"], explanation: "6こが7ふくろ分なので、6 × 7 です。" },
    { prompt: "8人に3まいずつカードをくばります。いるカードの数をもとめる式はどれ？", correct: "3 × 8", wrongs: ["3 + 8", "8 - 3", "3 + 3"], explanation: "1人分3まいが8人分なので、3 × 8 です。" },
    { prompt: "1チームは5人です。4チームぶんの人数をもとめる式はどれ？", correct: "5 × 4", wrongs: ["5 + 4", "5 + 5 + 5", "5 - 4"], explanation: "5人が4チーム分なので、5 × 4 です。5 + 5 + 5 は3チーム分になってしまいます。", soccer: true },
    { prompt: "1しあいで2点ずつ、5しあいで取った点の数をもとめる式はどれ？", correct: "2 × 5", wrongs: ["2 + 5", "5 - 2", "2 + 2"], explanation: "2点が5しあい分なので、2 × 5 です。", soccer: true }
  ].map((item) => ({
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 },
    questionType: "expression_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation,
    soccer: item.soccer
  })));

  // F6 入れかえ・ならびのきまり(rule_discovery, d2-d3)
  fam({
    familyId: "mul_swap_rule",
    funMechanic: "rule_discovery",
    learningObjective: "かけられる数とかける数を入れかえても答えが同じきまりに気づく",
    commonMistake: "入れかえると答えも変わると思いこむ",
    estimatedSeconds: 60,
    skillTags: ["かけ算", "きまり見つけ"]
  }, [
    { prompt: "6 × 8 = 48 です。計算しないで答えられるかな。8 × 6 はいくつ？", answer: numberAnswer(48), explanation: "かけられる数とかける数を入れかえても、答えは同じです。8 × 6 = 48 です。", axes: { knowledge: 1, info: 1, steps: 2, format: 3, choices: 1 }, questionType: "numeric_input" },
    { prompt: "九九の表で、3 × 7 と同じ答えになる九九はどれ？", correct: "7 × 3", wrongs: ["3 × 8", "4 × 7", "7 × 7"], explanation: "入れかえた 7 × 3 も答えは21で同じです。", axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 2 }, questionType: "multiple_choice" },
    { prompt: "7 × 4、4 × 7、7 + 4 のうち、答えがほかとちがうのはどれ？", correct: "7 + 4", wrongs: ["7 × 4", "4 × 7", "どれも同じ"], explanation: "7 × 4 と 4 × 7 はどちらも28ですが、7 + 4 は11です。", axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 2 }, questionType: "multiple_choice" },
    { prompt: "5のだんの九九の答え(5、10、15…)の一の位に、いつも出てくる数字はどれとどれ？", correct: "0と5", wrongs: ["1と5", "0と2", "5だけ"], explanation: "5、10、15、20…と、一の位は5と0がくりかえし出てきます。", axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 2 }, questionType: "multiple_choice" }
  ].map((item) => ({
    axes: item.axes,
    questionType: item.questionType,
    prompt: item.prompt,
    choices: item.correct ? textChoices(item.correct, item.wrongs) : [],
    answer: item.correct ? choiceAnswer(item.correct) : item.answer,
    explanation: item.explanation
  })));

  // F7 かける数が1ふえると(rule_discovery, d3)
  fam({
    familyId: "mul_add_one",
    funMechanic: "rule_discovery",
    learningObjective: "かける数が1ふえると、答えはかけられる数だけふえるきまりがわかる",
    commonMistake: "答えが1だけふえると思いこむ",
    estimatedSeconds: 75,
    skillTags: ["かけ算", "きまり見つけ"]
  }, [
    { prompt: "7 × 5 = 35 です。7 × 6 の答えは、35にいくつたした数？", answer: numberAnswer(7), explanation: "かける数が1ふえると、答えはかけられる数の7だけふえます。", axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 1 } },
    { prompt: "9 × 4 = 36 です。36にたして考えると、9 × 5 はいくつ？", answer: numberAnswer(45), explanation: "9 × 5 は 9 × 4 より9大きいので、36 + 9 = 45 です。", axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 1 } },
    { prompt: "6 × 7 = 42 です。42から考えると、6 × 6 はいくつ？", answer: numberAnswer(36), explanation: "かける数が1へると、答えは6だけへります。42 - 6 = 36 です。", axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 1 } },
    { prompt: "8 × 3 と 8 × 4 の答えのちがいはいくつ？", answer: numberAnswer(8), explanation: "8 × 3 = 24、8 × 4 = 32 で、ちがいは8です。かける数が1ちがうと、答えはかけられる数だけちがいます。", axes: { knowledge: 1, info: 2, steps: 3, format: 3, choices: 1 } }
  ].map((item) => ({ ...item, questionType: "numeric_input" })));

  // F8 まちがい見つけ(find_mistake, d3-d4)
  fam({
    familyId: "mul_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "九九のまちがいを、きまりやたしかめで見つけられる",
    commonMistake: "近いだんの答えを正しいと思いこむ",
    estimatedSeconds: 90,
    skillTags: ["かけ算", "たしかめ"]
  }, [
    { prompt: "まちがっている計算は、どれ？", correct: "7 × 8 = 54", wrongs: ["6 × 4 = 24", "9 × 3 = 27", "5 × 6 = 30"], explanation: "7 × 8 = 56 です。54は 6 × 9 の答えです。", axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 2 } },
    { prompt: "まちがっている計算は、どれ？", correct: "6 × 9 = 56", wrongs: ["8 × 8 = 64", "4 × 9 = 36", "3 × 7 = 21"], explanation: "6 × 9 = 54 です。56は 7 × 8 の答えです。", axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 2 } },
    { prompt: "みおさんは「どんな数に0をかけても、答えはその数のまま」と言いました。正しい直し方はどれ？", correct: "どんな数に0をかけても、答えは0", wrongs: ["みおさんの言うとおりで正しい", "答えは1になる", "答えは10になる"], explanation: "0が何こ分あっても0なので、どんな数に0をかけても答えは0です。", axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 2 } },
    { prompt: "はるとさんは 3 × 9 を「3 × 10 = 30 だから、30 + 3 で 33」と考えました。正しい直し方はどれ？", correct: "3 × 9 は 3 × 10 より3小さいから、30 - 3 で27", wrongs: ["30 + 3 = 33 で正しい", "30のままでよい", "3 × 9 は九九の表にないので計算できない"], explanation: "かける数が10から9に1へると、答えは3へります。30 - 3 = 27 です。", axes: { knowledge: 2, info: 2, steps: 3, format: 3, choices: 2 } }
  ].map((item) => ({
    axes: item.axes,
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F9 どっちの言い分が正しい？(judge_claim, d3-d4)
  const judgeChoices = ["二人とも正しい", "はるとだけ正しい", "みおだけ正しい", "二人ともまちがい"];
  fam({
    familyId: "mul_judge_claim",
    funMechanic: "judge_claim",
    learningObjective: "かけ算のきまりについての主張を、計算でたしかめて判断できる",
    commonMistake: "形がちがう式は答えもちがうと思いこむ",
    estimatedSeconds: 90,
    skillTags: ["かけ算", "きまり見つけ"]
  }, [
    { prompt: "はると「0 × 7 = 0」。みお「7 × 0 = 7」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "0に何をかけても、何に0をかけても答えは0です。7 × 0 = 0 なので、みおはまちがいです。", axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 } },
    { prompt: "はると「6 × 9 は、9 × 6 と同じ答え」。みお「6 × 9 は、6 × 10 より6小さい」。正しいのはどっち？", correct: "二人とも正しい", explanation: "9 × 6 = 54 で同じです。6 × 10 = 60 から6ひくと54なので、みおの考え方も正しいです。", axes: { knowledge: 2, info: 2, steps: 3, format: 3, choices: 1 } },
    { prompt: "はると「九九の表で、答えが12になる九九は1つだけ」。みお「2つ以上ある」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "2 × 6、6 × 2、3 × 4、4 × 3 など、答えが12になる九九はいくつもあります。", axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 } },
    { prompt: "はると「そんなきまりはないよ」。みお「4 × 8 の答えは、4 × 4 の答えを2ばいした数と同じ」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "4 × 4 = 16 で、16の2ばいは32。4 × 8 = 32 なので同じです。かける数を半分にして2ばいしても答えは同じです。", axes: { knowledge: 2, info: 2, steps: 3, format: 3, choices: 1 } }
  ].map((item) => ({
    axes: item.axes,
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, judgeChoices.filter((choice) => choice !== item.correct)),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F10 どっちが大きい？を予想してたしかめる(predict_check, d3)
  fam({
    familyId: "mul_predict_compare",
    funMechanic: "predict_check",
    learningObjective: "かけ算の答えの大きさを予想して、たしかめられる",
    commonMistake: "かける数が大きいほうが答えも大きいと思いこむ",
    estimatedSeconds: 75,
    skillTags: ["かけ算", "大小比較"]
  }, [
    { prompt: "6 × 9 と 7 × 8。答えが大きいのはどっち？(予想してからたしかめよう)", correct: "7 × 8", wrongs: ["6 × 9", "どちらも同じ", "くらべられない"], explanation: "6 × 9 = 54、7 × 8 = 56 なので、7 × 8 のほうが大きいです。" },
    { prompt: "5 × 7 と 6 × 6。答えが大きいのはどっち？", correct: "6 × 6", wrongs: ["5 × 7", "どちらも同じ", "くらべられない"], explanation: "5 × 7 = 35、6 × 6 = 36 なので、6 × 6 のほうが1大きいです。" },
    { prompt: "3 × 8 と 4 × 6。答えはどうなる？", correct: "どちらも同じ", wrongs: ["3 × 8 が大きい", "4 × 6 が大きい", "くらべられない"], explanation: "3 × 8 = 24、4 × 6 = 24 で、どちらも同じ24です。" }
  ].map((item) => ({
    axes: { knowledge: 2, info: 2, steps: 3, format: 2, choices: 1 },
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F11 ヒントから数を当てる(inference, d4)
  fam({
    familyId: "mul_hidden_number",
    funMechanic: "inference",
    learningObjective: "ヒントから九九の答えをしぼりこめる",
    commonMistake: "ヒントの1つだけで答えを決めてしまう",
    estimatedSeconds: 120,
    skillTags: ["かけ算", "推理"]
  }, [
    { prompt: "ヒント1：九九の6のだんの答えです。ヒント2：50より大きいです。この数はいくつ？", answer: numberAnswer(54), explanation: "6のだんで50より大きいのは 6 × 9 = 54 だけです。" },
    { prompt: "ヒント1：3のだんにも4のだんにも出てくる答えです。ヒント2：20より小さいです。この数はいくつ？", answer: numberAnswer(12), explanation: "3 × 4 = 12、4 × 3 = 12 で、どちらのだんにもある20より小さい数は12です。" },
    { prompt: "ヒント1：九九の5のだんの答えです。ヒント2：30より大きくて、40より小さいです。この数はいくつ？", answer: numberAnswer(35), explanation: "5のだんで30より大きく40より小さいのは 5 × 7 = 35 だけです。" },
    { prompt: "ある数に4をかけると32になります。同じ「ある数」に6をかけると、いくつ？", answer: numberAnswer(48), explanation: "4をかけて32になる数は8です。8 × 6 = 48 です。" }
  ].map((item) => ({ ...item, axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 1 }, questionType: "numeric_input" })));

  // F12 かけ算を2回使うパズル(inference, d4)
  fam({
    familyId: "mul_multi_step",
    funMechanic: "inference",
    learningObjective: "かけ算を2回組み合わせて、ぜんぶの数を求められる",
    commonMistake: "1回のかけ算で計算をやめてしまう",
    estimatedSeconds: 120,
    skillTags: ["かけ算", "文章題", "組み合わせ"]
  }, [
    { prompt: "1はこに2こずつ入ったガムが、1ふくろに3はこ入っています。2ふくろでは、ガムは何こ？", answer: numberAnswer(12, "こ"), explanation: "1ふくろ分は 2 × 3 = 6 こです。2ふくろで 6 × 2 = 12 こです。" },
    { prompt: "1チーム5人のチームが4つあります。全員に2まいずつカードをくばると、カードは何まい？", answer: numberAnswer(40, "まい"), explanation: "全員で 5 × 4 = 20 人です。カードは 20 × 2 = 40 まいです。", soccer: true },
    { prompt: "たてに3こ、横に3れつでクッキーをならべたお皿が、2まいあります。クッキーはぜんぶで何こ？", answer: numberAnswer(18, "こ"), explanation: "1まい分は 3 × 3 = 9 こです。2まいで 9 × 2 = 18 こです。" }
  ].map((item) => ({ ...item, axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 1 }, questionType: "numeric_input" })));

  if (questions.length !== 50) {
    throw new Error(`multiplication_table: expected 50 questions, got ${questions.length}`);
  }
  return questions;
}

// division_basic は chibique-question-design-core 準拠の刷新版(パイロット単元)。
function makeDivision() {
  const { questions, fam } = makeFamilyBuilder("division_basic");

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
    { prompt: "はると「7 ÷ 7 = 0 だよ」。みお「7 ÷ 7 = 1 だよ」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "同じ数でわると答えは1です。7 ÷ 7 = 1 なので、みおが正しいです。" },
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
  const { questions, fam } = makeFamilyBuilder("addition_subtraction_written");

  const calcAxes = { knowledge: 1, info: 1, steps: 2, format: 1, choices: 1 };
  const wordAxes = { knowledge: 1, info: 2, steps: 3, format: 1, choices: 1 };

  // F1 たし算の筆算(drill, d1)
  fam({
    familyId: "add_calc",
    funMechanic: "drill",
    learningObjective: "くり上がりのある3けたのたし算を筆算でできる",
    commonMistake: "くり上がりの1をたし忘れる",
    estimatedSeconds: 60,
    skillTags: ["筆算", "たし算"]
  }, [
    [358, 264], [189, 276], [347, 285], [296, 417], [158, 563]
  ].map(([a, b]) => ({
    axes: calcAxes,
    questionType: "numeric_input",
    prompt: `${a} + ${b} はいくつ？`,
    answer: numberAnswer(a + b),
    explanation: `一の位、十の位、百の位をそろえて、くり上がりに気をつけて計算します。${a} + ${b} = ${a + b} です。`
  })));

  // F2 ひき算の筆算(drill, d1)
  fam({
    familyId: "add_sub_calc",
    funMechanic: "drill",
    learningObjective: "くり下がりのある3けたのひき算を筆算でできる",
    commonMistake: "くり下がりのあとに、へった数をひき忘れる",
    estimatedSeconds: 60,
    skillTags: ["筆算", "ひき算"]
  }, [
    [624, 258], [512, 178], [730, 274], [405, 138], [811, 345]
  ].map(([a, b]) => ({
    axes: calcAxes,
    questionType: "numeric_input",
    prompt: `${a} - ${b} はいくつ？`,
    answer: numberAnswer(a - b),
    explanation: `位をそろえて、くり下がりに気をつけてひきます。${a} - ${b} = ${a - b} です。`
  })));

  // F3 たし算の文章題(drill, d2)
  fam({
    familyId: "add_word_plus",
    funMechanic: "drill",
    learningObjective: "「あわせて」「〜より多い」の場面をたし算の式に表せる",
    commonMistake: "「多い」という言葉だけを見て、ひき算にしてしまう",
    estimatedSeconds: 75,
    skillTags: ["筆算", "たし算", "文章題"]
  }, [
    { prompt: "なわとびを、きのう156回、きょう178回とびました。あわせて何回？", answer: numberAnswer(156 + 178, "回"), explanation: "あわせた数なのでたし算です。156 + 178 = 334 です。" },
    { prompt: "どんぐりを208こ、くりを194こひろいました。あわせて何こ？", answer: numberAnswer(208 + 194, "こ"), explanation: "あわせた数なのでたし算です。208 + 194 = 402 です。" },
    { prompt: "えきの前に自転車が316台、車が285台とまっています。あわせて何台？", answer: numberAnswer(316 + 285, "台"), explanation: "あわせた数なのでたし算です。316 + 285 = 601 です。" },
    { prompt: "花だんに赤い花が127本さいています。白い花は赤より165本多いです。白い花は何本？", answer: numberAnswer(127 + 165, "本"), explanation: "赤より165本多いので、127 + 165 = 292 です。" },
    { prompt: "サッカーの大会に、1日目は246人、2日目は259人が来ました。あわせて何人？", answer: numberAnswer(246 + 259, "人"), explanation: "あわせた数なのでたし算です。246 + 259 = 505 です。", soccer: true }
  ].map((item) => ({ ...item, axes: wordAxes, questionType: "numeric_input" })));

  // F4 ひき算の文章題(drill, d2)
  fam({
    familyId: "add_word_minus",
    funMechanic: "drill",
    learningObjective: "「のこり」「ちがい」の場面をひき算の式に表せる",
    commonMistake: "大きい数から小さい数をひかず、式の順番をまちがえる",
    estimatedSeconds: 75,
    skillTags: ["筆算", "ひき算", "文章題"]
  }, [
    { prompt: "シールを412まい持っています。165まい使うと、のこりは何まい？", answer: numberAnswer(412 - 165, "まい"), explanation: "のこりなのでひき算です。412 - 165 = 247 です。" },
    { prompt: "500円玉で274円のおかしを買うと、おつりは何円？", answer: numberAnswer(500 - 274, "円"), explanation: "500円から代金をひきます。500 - 274 = 226 です。" },
    { prompt: "学校の本は634さつ、うちの本は158さつです。ちがいは何さつ？", answer: numberAnswer(634 - 158, "さつ"), explanation: "ちがいなのでひき算です。634 - 158 = 476 です。" },
    { prompt: "電車に305人乗っています。えきで127人おりました。今、何人乗っている？", answer: numberAnswer(305 - 127, "人"), explanation: "おりた分をひきます。305 - 127 = 178 です。" },
    { prompt: "あきかんを250こ集めます。もう183こ集めました。あと何こ？", answer: numberAnswer(250 - 183, "こ"), explanation: "目ひょうから集めた分をひきます。250 - 183 = 67 です。" }
  ].map((item) => ({ ...item, axes: wordAxes, questionType: "numeric_input" })));

  // F5 たすかひくかを選ぶ(best_choice, d2)
  fam({
    familyId: "add_expression",
    funMechanic: "best_choice",
    learningObjective: "場面から、たし算かひき算かを判断して式を選べる",
    commonMistake: "数字の順番だけ見て、場面に合わない式を選ぶ",
    estimatedSeconds: 60,
    skillTags: ["筆算", "式を選ぶ"]
  }, [
    { prompt: "スタジアムに425人いて、137人帰りました。今の人数をもとめる式はどれ？", correct: "425 - 137", wrongs: ["425 + 137", "137 - 425", "425 × 137"], explanation: "帰った分をひくので、425 - 137 です。" },
    { prompt: "きのうまでに268このつるを折りました。きょう75こ折りました。ぜんぶの数をもとめる式はどれ？", correct: "268 + 75", wrongs: ["268 - 75", "75 - 268", "268 × 75"], explanation: "ふえた分をたすので、268 + 75 です。" },
    { prompt: "350ページの本を、128ページまで読みました。のこりのページをもとめる式はどれ？", correct: "350 - 128", wrongs: ["350 + 128", "128 - 350", "128 + 128"], explanation: "ぜんぶから読んだ分をひくので、350 - 128 です。" },
    { prompt: "赤いテープは421cm、青いテープは386cmです。ちがいをもとめる式はどれ？", correct: "421 - 386", wrongs: ["421 + 386", "386 - 421", "421 × 386"], explanation: "ちがいは、大きい数から小さい数をひいてもとめます。421 - 386 です。" }
  ].map((item) => ({
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 },
    questionType: "expression_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F6 答えの大きさを予想する(predict_check, d3)
  fam({
    familyId: "add_estimate",
    funMechanic: "predict_check",
    learningObjective: "計算する前に答えのだいたいの大きさを予想できる",
    commonMistake: "予想せずに計算して、大きなまちがいに気づかない",
    estimatedSeconds: 75,
    skillTags: ["筆算", "見積もり"]
  }, [
    { prompt: "298 + 304 の答えは、600より大きい？小さい？", correct: "600より大きい", wrongs: ["600より小さい", "ちょうど600", "くらべられない"], explanation: "だいたい300と300で600くらい。くわしく計算すると602で、600より大きいです。" },
    { prompt: "512 - 189 の答えは、300より大きい？小さい？", correct: "300より大きい", wrongs: ["300より小さい", "ちょうど300", "くらべられない"], explanation: "だいたい500 - 200 = 300くらい。くわしくは323で、300より大きいです。" },
    { prompt: "195 + 402 の答えは、600より大きい？小さい？", correct: "600より小さい", wrongs: ["600より大きい", "ちょうど600", "くらべられない"], explanation: "だいたい200 + 400 = 600くらい。くわしくは597で、600より少し小さいです。" },
    { prompt: "703 - 315 の答えは、400より大きい？小さい？", correct: "400より小さい", wrongs: ["400より大きい", "ちょうど400", "くらべられない"], explanation: "だいたい700 - 300 = 400くらい。くわしくは388で、400より小さいです。" }
  ].map((item) => ({
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 },
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F7 まちがい直し(find_mistake, d3)
  fam({
    familyId: "add_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "筆算のよくあるまちがいに気づいて、正しく直せる",
    commonMistake: "くり上がり・くり下がりのわすれに気づかない",
    estimatedSeconds: 90,
    skillTags: ["筆算", "たしかめ"]
  }, [
    { prompt: "みおさんは 500 - 137 を「463」と計算しました(くり下がりをわすれたようです)。正しい答えはいくつ？", answer: numberAnswer(500 - 137), explanation: "500からのくり下がりに気をつけると、500 - 137 = 363 です。" },
    { prompt: "はるとさんは 246 + 178 を「314」と計算しました(くり上がりをわすれたようです)。正しい答えはいくつ？", answer: numberAnswer(246 + 178), explanation: "一の位と十の位のくり上がりをたすと、246 + 178 = 424 です。" },
    { prompt: "みおさんは 632 - 458 を、位ごとに大きい数から小さい数をひいて「226」としました。正しい答えはいくつ？", answer: numberAnswer(632 - 458), explanation: "ひき算は上の数から下の数をひきます。くり下がりを使うと 632 - 458 = 174 です。" },
    { prompt: "はるとさんは 57 + 368 を、位をそろえずに「938」と計算しました。正しい答えはいくつ？", answer: numberAnswer(57 + 368), explanation: "一の位どうしをそろえてたすと、57 + 368 = 425 です。" },
    { prompt: "みおさんは 800 - 406 を「494」と計算しました。正しい答えはいくつ？", answer: numberAnswer(800 - 406), explanation: "800 - 400 = 400、400 - 6 = 394 です。答えは394です。" }
  ].map((item) => ({ ...item, axes: { knowledge: 1, info: 2, steps: 3, format: 3, choices: 1 }, questionType: "numeric_input" })));

  // F8 虫食い筆算(inference, d3-d4)
  fam({
    familyId: "add_hidden_digit",
    funMechanic: "inference",
    learningObjective: "筆算のしくみを使って、かくれた数字を見つけられる",
    commonMistake: "くり上がり・くり下がりを考えずに□を決めてしまう",
    estimatedSeconds: 120,
    skillTags: ["筆算", "虫食い算", "推理"]
  }, [
    { prompt: "3□6 + 258 = 614。□に入る数字はいくつ？", answer: numberAnswer(5), explanation: "356 + 258 = 614 になります。□は5です。", axes: { knowledge: 1, info: 2, steps: 3, format: 3, choices: 1 } },
    { prompt: "47□ + 216 = 693。□に入る数字はいくつ？", answer: numberAnswer(7), explanation: "477 + 216 = 693 になります。□は7です。", axes: { knowledge: 1, info: 2, steps: 3, format: 3, choices: 1 } },
    { prompt: "□24 - 158 = 466。□に入る数字はいくつ？", answer: numberAnswer(6), explanation: "466 + 158 = 624 なので、□24は624。□は6です。", axes: { knowledge: 2, info: 2, steps: 3, format: 3, choices: 1 } },
    { prompt: "5□2 - 236 = 296。□に入る数字はいくつ？", answer: numberAnswer(3), explanation: "296 + 236 = 532 なので、5□2は532。□は3です。", axes: { knowledge: 2, info: 2, steps: 3, format: 3, choices: 1 } },
    { prompt: "638 - 2□5 = 393。□に入る数字はいくつ？", answer: numberAnswer(4), explanation: "638 - 393 = 245 なので、2□5は245。□は4です。", axes: { knowledge: 2, info: 2, steps: 3, format: 3, choices: 1 } }
  ].map((item) => ({ ...item, questionType: "numeric_input" })));

  // F9 どっちの言い分が正しい？(judge_claim, d3-d4)
  const judgeChoices = ["二人とも正しい", "はるとだけ正しい", "みおだけ正しい", "二人ともまちがい"];
  fam({
    familyId: "add_judge_claim",
    funMechanic: "judge_claim",
    learningObjective: "たし算・ひき算のきまりについての主張を、計算でたしかめて判断できる",
    commonMistake: "たし算のきまりが、ひき算にもそのまま使えると思いこむ",
    estimatedSeconds: 90,
    skillTags: ["筆算", "きまり見つけ"]
  }, [
    { prompt: "はると「ひき算も、ひくじゅんばんを入れかえても答えが同じ」。みお「たし算は、たすじゅんばんを入れかえても答えが同じ」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "たし算は入れかえても同じですが、ひき算は入れかえると答えが変わります(たとえば 5 - 3 と 3 - 5)。", axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 } },
    { prompt: "325 + 175 について。はると「答えはちょうど500」。みお「答えは501」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "325 + 175 = 500 です。ちょうど500になります。", axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 1 } },
    { prompt: "はると「どんな数に0をたしても、数は変わらない」。みお「どんな数から0をひいても、数は変わらない」。正しいのはどっち？", correct: "二人とも正しい", explanation: "0をたしても0をひいても、数は変わりません。", axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 } },
    { prompt: "600 - 299 について。はると「600 - 300 = 300 で、そのまま300が答え」。みお「600 - 300 = 300 で、さらに1をひいて299」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "299は300より1小さいので、300をひくと1ひきすぎです。ひきすぎた1をたして301が正しい答えです。", axes: { knowledge: 2, info: 2, steps: 3, format: 3, choices: 1 } }
  ].map((item) => ({
    axes: item.axes,
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, judgeChoices.filter((choice) => choice !== item.correct)),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F10 3つの数の文章題(inference, d3)
  fam({
    familyId: "add_three_term",
    funMechanic: "inference",
    learningObjective: "ふえたりへったりする場面を、じゅんに式に表して計算できる",
    commonMistake: "とちゅうの計算だけで答えにしてしまう",
    estimatedSeconds: 90,
    skillTags: ["筆算", "文章題", "組み合わせ"]
  }, [
    { prompt: "バスに26人乗っていました。バスていで13人おりて、8人乗ってきました。今、何人？", answer: numberAnswer(26 - 13 + 8, "人"), explanation: "26 - 13 = 13、13 + 8 = 21 です。じゅんに計算します。" },
    { prompt: "シールを135まい持っていました。妹に47まいあげて、お母さんから60まいもらいました。今、何まい？", answer: numberAnswer(135 - 47 + 60, "まい"), explanation: "135 - 47 = 88、88 + 60 = 148 です。" },
    { prompt: "図書室に本が248さつありました。あたらしく75さつ入り、36さつかし出されました。今、何さつ？", answer: numberAnswer(248 + 75 - 36, "さつ"), explanation: "248 + 75 = 323、323 - 36 = 287 です。" },
    { prompt: "おこづかいが500円あります。180円のノートと120円のえんぴつを買いました。のこりは何円？", answer: numberAnswer(500 - 180 - 120, "円"), explanation: "500 - 180 = 320、320 - 120 = 200 です。" },
    { prompt: "チケットが350まいありました。きのう127まい、きょう96まい売れました。のこりは何まい？", answer: numberAnswer(350 - 127 - 96, "まい"), explanation: "350 - 127 = 223、223 - 96 = 127 です。" }
  ].map((item) => ({ ...item, axes: { knowledge: 1, info: 3, steps: 3, format: 1, choices: 1 }, questionType: "numeric_input" })));

  // F11 たしかめの式(compare_methods, d3-d4)
  fam({
    familyId: "add_check_method",
    funMechanic: "compare_methods",
    learningObjective: "たし算とひき算の関係を使って、答えのたしかめができる",
    commonMistake: "たしかめの式で、どの数を使えばよいか迷う",
    estimatedSeconds: 90,
    skillTags: ["筆算", "たしかめ"]
  }, [
    { prompt: "486 - 217 = 269 が正しいか、たしかめる式はどれ？", correct: "269 + 217", wrongs: ["269 - 217", "486 + 217", "486 + 269"], explanation: "ひき算の答えにひいた数をたして、もとの数にもどれば正しいです。269 + 217 = 486 でぴったりです。", axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }, questionType: "multiple_choice" },
    { prompt: "358 + 164 = 522 が正しいか、たしかめる式はどれ？", correct: "522 - 164", wrongs: ["522 + 164", "358 - 164", "522 + 358"], explanation: "たし算の答えから、たした数をひいて、もとの数にもどれば正しいです。522 - 164 = 358 でぴったりです。", axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }, questionType: "multiple_choice" },
    { prompt: "705 - 428 = 277 のたしかめとして、277 + 428 を計算すると、いくつになれば正しい？", answer: numberAnswer(705), explanation: "もとの数の705にもどれば正しいです。277 + 428 = 705 でぴったりです。", axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }, questionType: "numeric_input" },
    { prompt: "433 + 199 = 632 です。この式を使うと、632 - 199 の答えはどれ？", correct: "433", wrongs: ["434", "432", "443"], explanation: "たし算とひき算は反対の関係なので、632 - 199 = 433 と計算しなくてもわかります。", axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 3 }, questionType: "multiple_choice" }
  ].map((item) => ({
    axes: item.axes,
    questionType: item.questionType,
    prompt: item.prompt,
    choices: item.correct ? textChoices(item.correct, item.wrongs) : [],
    answer: item.correct ? choiceAnswer(item.correct) : item.answer,
    explanation: item.explanation
  })));

  // F12 かくれた数を当てる(inference, d3)
  fam({
    familyId: "add_hidden_number",
    funMechanic: "inference",
    learningObjective: "たし算とひき算の関係を使って、かくれた数を求められる",
    commonMistake: "問題の数をそのままたしたりひいたりしてしまう",
    estimatedSeconds: 90,
    skillTags: ["筆算", "推理"]
  }, [
    { prompt: "ある数から265をひくと、148になります。ある数はいくつ？", answer: numberAnswer(148 + 265), explanation: "ひく前にもどすには、たします。148 + 265 = 413 です。" },
    { prompt: "ある数に180をたすと、520になります。ある数はいくつ？", answer: numberAnswer(520 - 180), explanation: "たす前にもどすには、ひきます。520 - 180 = 340 です。" },
    { prompt: "はこにビー玉が何こか入っています。125こたしたら、ぜんぶで312こになりました。はじめに何こ入っていた？", answer: numberAnswer(312 - 125, "こ"), explanation: "312 - 125 = 187 なので、はじめは187こです。" },
    { prompt: "ジュースが何本かありました。86本くばったら、のこりが214本でした。はじめに何本あった？", answer: numberAnswer(214 + 86, "本"), explanation: "くばった分をのこりにたすと、214 + 86 = 300 で、はじめは300本です。" }
  ].map((item) => ({ ...item, axes: { knowledge: 2, info: 2, steps: 3, format: 2, choices: 1 }, questionType: "numeric_input" })));

  // F13 計算のくふう(rule_discovery, d3)
  fam({
    familyId: "add_smart_calc",
    funMechanic: "rule_discovery",
    learningObjective: "きりのよい数を使った計算のくふうができる",
    commonMistake: "100たしたあとの1のちょうせいを、たすかひくか逆にする",
    estimatedSeconds: 90,
    skillTags: ["筆算", "計算のくふう"]
  }, [
    { prompt: "456 + 99 を、456 + 100 - 1 とくふうして計算すると、いくつ？", answer: numberAnswer(456 + 99), explanation: "100をたしてから、たしすぎた1をひきます。556 - 1 = 555 です。" },
    { prompt: "327 + 198 を、327 + 200 - 2 とくふうして計算すると、いくつ？", answer: numberAnswer(327 + 198), explanation: "200をたしてから、たしすぎた2をひきます。527 - 2 = 525 です。" },
    { prompt: "634 - 99 を、634 - 100 + 1 とくふうして計算すると、いくつ？", answer: numberAnswer(634 - 99), explanation: "100をひいてから、ひきすぎた1をたします。534 + 1 = 535 です。" },
    { prompt: "700 - 356 と 699 - 355 は、同じ答えになります。699 - 355 はいくつ？", answer: numberAnswer(699 - 355), explanation: "どちらの数も1ずつ小さくしても、ちがいは変わりません。答えは344です。" },
    { prompt: "250 + 250 = 500 を使って考えます。251 + 249 はいくつ？", answer: numberAnswer(251 + 249), explanation: "251は250より1大きく、249は250より1小さいので、答えは同じ500です。" }
  ].map((item) => ({ ...item, axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }, questionType: "numeric_input" })));

  if (questions.length !== 60) {
    throw new Error(`addition_subtraction_written: expected 60 questions, got ${questions.length}`);
  }
  return questions;
}

function makeTime() {
  const { questions, fam } = makeFamilyBuilder("time_duration");

  // F1 〜分後の時こく(drill, d2)
  fam({
    familyId: "time_after",
    funMechanic: "drill",
    learningObjective: "ある時こくから何分後の時こくを求められる",
    commonMistake: "60分をこえたときに、時間へのくり上げをわすれる(9時70分など)",
    estimatedSeconds: 60,
    skillTags: ["時こく", "時間"]
  }, [
    { prompt: "7時40分の30分後は、何時何分？", correct: "8時10分", wrongs: ["7時70分", "8時20分", "7時10分"], explanation: "40分 + 30分 = 70分。60分で1時間くり上げて、8時10分です。" },
    { prompt: "9時15分の50分後は、何時何分？", correct: "10時5分", wrongs: ["9時65分", "10時15分", "9時55分"], explanation: "15分 + 50分 = 65分。60分をくり上げて、10時5分です。" },
    { prompt: "11時35分の40分後は、何時何分？", correct: "12時15分", wrongs: ["11時75分", "12時5分", "12時35分"], explanation: "35分 + 40分 = 75分。60分をくり上げて、12時15分です。" },
    { prompt: "6時20分の45分後は、何時何分？", correct: "7時5分", wrongs: ["6時65分", "7時15分", "6時5分"], explanation: "20分 + 45分 = 65分。60分をくり上げて、7時5分です。" }
  ].map((item) => ({
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 },
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F2 〜分前の時こく(drill, d2)
  fam({
    familyId: "time_before",
    funMechanic: "drill",
    learningObjective: "ある時こくから何分前の時こくを求められる",
    commonMistake: "「前」なのに分をたしてしまう",
    estimatedSeconds: 60,
    skillTags: ["時こく", "時間"]
  }, [
    { prompt: "8時10分の20分前は、何時何分？", correct: "7時50分", wrongs: ["8時30分", "7時30分", "7時40分"], explanation: "10分から20分はひけないので、1時間くり下げます。7時70分 - 20分 = 7時50分です。" },
    { prompt: "3時5分の15分前は、何時何分？", correct: "2時50分", wrongs: ["3時20分", "2時40分", "2時55分"], explanation: "5分から15分はひけないので、2時65分と考えて、65 - 15 = 50。2時50分です。" },
    { prompt: "12時ちょうどの25分前は、何時何分？", correct: "11時35分", wrongs: ["12時25分", "11時25分", "11時45分"], explanation: "12時は11時60分と同じです。60 - 25 = 35 で、11時35分です。" }
  ].map((item) => ({
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 },
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F3 時間の長さ(drill, d2)
  fam({
    familyId: "time_duration_len",
    funMechanic: "drill",
    learningObjective: "2つの時こくの間の時間を求められる",
    commonMistake: "時こくの数字どうしをそのままひいてしまう",
    estimatedSeconds: 60,
    skillTags: ["時こく", "時間の長さ"]
  }, [
    { prompt: "8時10分から8時55分までは、何分？", answer: numberAnswer(45, "分"), explanation: "55 - 10 = 45 で、45分です。" },
    { prompt: "9時40分から10時20分までは、何分？", answer: numberAnswer(40, "分"), explanation: "9時40分から10時までが20分、10時から10時20分までが20分。あわせて40分です。" },
    { prompt: "11時50分から12時30分までは、何分？", answer: numberAnswer(40, "分"), explanation: "11時50分から12時までが10分、12時から12時30分までが30分。あわせて40分です。" },
    { prompt: "2時35分から4時5分までは、何分？", answer: numberAnswer(90, "分"), explanation: "2時35分から3時35分までが60分、3時35分から4時5分までが30分。あわせて90分です。" },
    { prompt: "6時15分から7時ちょうどまでは、何分？", answer: numberAnswer(45, "分"), explanation: "60 - 15 = 45 で、45分です。" }
  ].map((item) => ({ ...item, axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 1 }, questionType: "numeric_input" })));

  // F4 単位の変かん(drill, d2-d3)
  fam({
    familyId: "time_convert",
    funMechanic: "drill",
    learningObjective: "分と秒、時間と分の関係(1分=60秒、1時間=60分)を使って表しかえられる",
    commonMistake: "60ではなく100で計算してしまう(1分=100秒など)",
    estimatedSeconds: 60,
    skillTags: ["時間", "単位変換"]
  }, [
    { prompt: "1分 = 60秒です。2分は何秒？", answer: numberAnswer(120, "秒"), explanation: "60秒の2つ分なので、60 × 2 = 120秒です。", axes: { knowledge: 2, info: 1, steps: 2, format: 1, choices: 1 }, questionType: "numeric_input" },
    { prompt: "90秒は、何分何秒？", correct: "1分30秒", wrongs: ["9分0秒", "1分20秒", "0分90秒"], explanation: "90秒 = 60秒 + 30秒 なので、1分30秒です。", axes: { knowledge: 2, info: 1, steps: 2, format: 1, choices: 2 }, questionType: "multiple_choice" },
    { prompt: "80分は、何時間何分？", correct: "1時間20分", wrongs: ["8時間0分", "1時間40分", "2時間20分"], explanation: "80分 = 60分 + 20分 なので、1時間20分です。", axes: { knowledge: 2, info: 1, steps: 2, format: 1, choices: 2 }, questionType: "multiple_choice" },
    { prompt: "1時間45分は、何分？", answer: numberAnswer(105, "分"), explanation: "1時間 = 60分 なので、60 + 45 = 105分です。", axes: { knowledge: 2, info: 1, steps: 2, format: 1, choices: 1 }, questionType: "numeric_input" }
  ].map((item) => ({
    axes: item.axes,
    questionType: item.questionType,
    prompt: item.prompt,
    choices: item.correct ? textChoices(item.correct, item.wrongs) : [],
    answer: item.correct ? choiceAnswer(item.correct) : item.answer,
    explanation: item.explanation
  })));

  // F5 まちがい直し(find_mistake, d3)
  fam({
    familyId: "time_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "時こく・時間のよくあるまちがいに気づいて、正しく直せる",
    commonMistake: "60進法を10進法と混同する(9時70分、1時間=100分など)",
    estimatedSeconds: 90,
    skillTags: ["時こく", "たしかめ"]
  }, [
    { prompt: "はるとさんは「9時50分の20分後は9時70分」と言いました。正しく直すと？", correct: "10時10分", wrongs: ["9時70分で正しい", "10時20分", "9時30分"], explanation: "70分は1時間10分なので、9時70分ではなく10時10分です。" },
    { prompt: "みおさんは「1時間30分は130分」と言いました。正しく直すと？", correct: "90分", wrongs: ["130分で正しい", "60分", "100分"], explanation: "1時間 = 60分 なので、60 + 30 = 90分です。" },
    { prompt: "はるとさんは「2分 = 100秒」と言いました。正しく直すと？", correct: "120秒", wrongs: ["100秒で正しい", "200秒", "60秒"], explanation: "1分 = 60秒 なので、2分は 60 × 2 = 120秒です。" },
    { prompt: "みおさんは「3時40分の30分後は3時10分」と言いました(時こくがもどってしまいました)。正しく直すと？", correct: "4時10分", wrongs: ["3時10分で正しい", "4時40分", "3時70分"], explanation: "40分 + 30分 = 70分で、1時間くり上がります。4時10分です。" }
  ].map((item) => ({
    axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 2 },
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F6 どっちの言い分が正しい？(judge_claim, d3)
  const judgeChoices = ["二人とも正しい", "はるとだけ正しい", "みおだけ正しい", "二人ともまちがい"];
  fam({
    familyId: "time_judge_claim",
    funMechanic: "judge_claim",
    learningObjective: "時間の単位のきまりについての主張を判断できる",
    commonMistake: "時間の単位を10進法で考えてしまう",
    estimatedSeconds: 90,
    skillTags: ["時間", "単位のきまり"]
  }, [
    { prompt: "はると「1時間は100分」。みお「1分は100秒」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "1時間は60分、1分は60秒です。時間も分も、60ずつで次の単位にくり上がります。", axes: { knowledge: 2, info: 2, steps: 1, format: 3, choices: 1 } },
    { prompt: "100分について。はると「1時間より短い」。みお「1時間40分と同じ」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "100分 = 60分 + 40分 = 1時間40分です。1時間(60分)より長いです。", axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 } },
    { prompt: "はると「午前は10時間、午後は14時間」。みお「1日は20時間」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "午前12時間と午後12時間をあわせて、1日は24時間です。", axes: { knowledge: 2, info: 2, steps: 1, format: 3, choices: 1 } },
    { prompt: "はると「時計の長いはりが1まわりすると1時間」。みお「時計のみじかいはりが1まわりすると1時間」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "長いはり(分しん)は1まわりで60分 = 1時間。みじかいはり(時しん)は1まわりで12時間です。", axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 } }
  ].map((item) => ({
    axes: item.axes,
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, judgeChoices.filter((choice) => choice !== item.correct)),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F7 予定を組み立てる(inference, d3-d4)
  fam({
    familyId: "time_schedule",
    funMechanic: "inference",
    learningObjective: "目当ての時こくから逆算したり、時間をつないだりして予定を考えられる",
    commonMistake: "逆算なのに、時こくに時間をたしてしまう",
    estimatedSeconds: 120,
    skillTags: ["時こく", "時間", "文章題"]
  }, [
    { prompt: "4時までに、40分かかる宿題を終わらせたい。おそくとも何時何分までに始めればいい？", correct: "3時20分", wrongs: ["3時40分", "4時40分", "3時0分"], explanation: "4時の40分前なので、3時20分までに始めます。", axes: { knowledge: 2, info: 2, steps: 3, format: 2, choices: 1 } },
    { prompt: "学校まで15分かかります。8時ちょうどに着きたいとき、家を出るのは何時何分？", correct: "7時45分", wrongs: ["8時15分", "7時55分", "7時30分"], explanation: "8時の15分前なので、7時45分に出ます。", axes: { knowledge: 2, info: 2, steps: 3, format: 2, choices: 1 } },
    { prompt: "50分の映画(えいが)が、3時10分に終わりました。始まったのは何時何分？", correct: "2時20分", wrongs: ["4時0分", "2時40分", "3時0分"], explanation: "3時10分の50分前です。2時70分と考えて、70 - 50 = 20。2時20分です。", axes: { knowledge: 2, info: 2, steps: 3, format: 2, choices: 2 } },
    { prompt: "サッカーのれんしゅうは4時30分から始まり、1時間10分やります。終わるのは何時何分？", correct: "5時40分", wrongs: ["5時30分", "5時50分", "4時40分"], explanation: "4時30分の1時間後が5時30分、さらに10分後で5時40分です。", axes: { knowledge: 2, info: 2, steps: 3, format: 2, choices: 2 }, soccer: true },
    { prompt: "9時40分から20分休けいして、そのあと30分本を読みます。読み終わるのは何時何分？", correct: "10時30分", wrongs: ["10時10分", "10時50分", "9時90分"], explanation: "9時40分 + 20分 = 10時。10時 + 30分 = 10時30分です。", axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 2 } }
  ].map((item) => ({
    axes: item.axes,
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation,
    soccer: item.soccer
  })));

  // F8 どっちが長い？を予想してたしかめる(predict_check, d3)
  fam({
    familyId: "time_compare",
    funMechanic: "predict_check",
    learningObjective: "ちがう単位の時間を、同じ単位にそろえてくらべられる",
    commonMistake: "数字の大きさだけでくらべてしまう(90秒 > 2分 など)",
    estimatedSeconds: 90,
    skillTags: ["時間", "大小比較"]
  }, [
    { prompt: "80分と1時間15分。長いのはどっち？", correct: "80分", wrongs: ["1時間15分", "どちらも同じ", "くらべられない"], explanation: "1時間15分 = 75分 なので、80分のほうが長いです。" },
    { prompt: "1時間30分と100分。長いのはどっち？", correct: "100分", wrongs: ["1時間30分", "どちらも同じ", "くらべられない"], explanation: "1時間30分 = 90分 なので、100分のほうが長いです。" },
    { prompt: "2分と90秒。長いのはどっち？", correct: "2分", wrongs: ["90秒", "どちらも同じ", "くらべられない"], explanation: "2分 = 120秒 なので、2分のほうが長いです。" },
    { prompt: "150秒と2分30秒。どうなる？", correct: "どちらも同じ", wrongs: ["150秒が長い", "2分30秒が長い", "くらべられない"], explanation: "2分30秒 = 120秒 + 30秒 = 150秒 で、同じ長さです。" },
    { prompt: "45分の番組1つと、30分の番組2つ(つづけて見る)。長いのはどっち？", correct: "30分の番組2つ", wrongs: ["45分の番組1つ", "どちらも同じ", "くらべられない"], explanation: "30分 × 2 = 60分 なので、30分の番組2つのほうが長いです。" }
  ].map((item) => ({
    axes: { knowledge: 2, info: 2, steps: 3, format: 2, choices: 1 },
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F9 時間の感かく(best_choice, d2)
  fam({
    familyId: "time_sense",
    funMechanic: "best_choice",
    learningObjective: "身のまわりのことにかかる時間を、単位をえらんで見当づけられる",
    commonMistake: "秒・分・時間のどれを使うか、けたちがいの単位を選んでしまう",
    estimatedSeconds: 45,
    skillTags: ["時間", "量感"]
  }, [
    { prompt: "歯みがきにかかる時間として、いちばん近いのはどれ？", correct: "3分", wrongs: ["3秒", "3時間", "30時間"], explanation: "歯みがきはだいたい3分くらいです。3秒ではみじかすぎ、3時間では長すぎます。" },
    { prompt: "夜にねむる時間として、いちばん近いのはどれ？", correct: "9時間", wrongs: ["9分", "9秒", "90時間"], explanation: "夜のすいみんはだいたい9時間くらいです。" },
    { prompt: "カップラーメンができるまでにまつ時間として、いちばん近いのはどれ？", correct: "3分", wrongs: ["3秒", "30秒", "3時間"], explanation: "カップラーメンはだいたい3分まちます。" },
    { prompt: "学校のじゅぎょう1回の長さとして、いちばん近いのはどれ？", correct: "45分", wrongs: ["45秒", "4時間", "5分"], explanation: "じゅぎょう1回はだいたい45分です。" }
  ].map((item) => ({
    axes: { knowledge: 1, info: 1, steps: 2, format: 3, choices: 1 },
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F10 ならべ替え(reorder, d5: 単元の仕上げ)
  fam({
    familyId: "time_reorder",
    funMechanic: "reorder",
    learningObjective: "ちがう単位の時間を、ぜんぶ同じ単位にそろえてならべられる",
    commonMistake: "一部だけ単位をそろえて、のこりは数字のままくらべてしまう",
    estimatedSeconds: 120,
    skillTags: ["時間", "大小比較", "ならべ替え"]
  }, [
    { prompt: "90秒、2分、1時間、65分を、みじかいじゅんにならべたものとして正しいのはどれ？", correct: "90秒 → 2分 → 1時間 → 65分", wrongs: ["90秒 → 2分 → 65分 → 1時間", "2分 → 90秒 → 1時間 → 65分", "65分 → 1時間 → 2分 → 90秒"], explanation: "90秒 = 1分30秒、2分、1時間 = 60分、65分。みじかいじゅんは 90秒 → 2分 → 1時間 → 65分 です。" },
    { prompt: "100分、1時間30分、2時間を、長いじゅんにならべたものとして正しいのはどれ？", correct: "2時間 → 100分 → 1時間30分", wrongs: ["100分 → 2時間 → 1時間30分", "1時間30分 → 100分 → 2時間", "2時間 → 1時間30分 → 100分"], explanation: "2時間 = 120分、100分、1時間30分 = 90分。長いじゅんは 2時間 → 100分 → 1時間30分 です。" }
  ].map((item) => ({
    axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 2 },
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  if (questions.length !== 40) {
    throw new Error(`time_duration: expected 40 questions, got ${questions.length}`);
  }
  return questions;
}

function makeLargeNumbers() {
  const { questions, fam } = makeFamilyBuilder("large_numbers");

  // F1 数を組み立てる(drill, d2)
  fam({
    familyId: "num_compose",
    funMechanic: "drill",
    learningObjective: "万・千・百・十・一を組み合わせた数を書ける",
    commonMistake: "ない位に0を書きわすれる(7万と5百と9を759にするなど)",
    estimatedSeconds: 60,
    skillTags: ["大きな数", "位取り", "数の構成"]
  }, [
    { prompt: "4万と6千と3百を合わせた数は？", answer: numberAnswer(46300), explanation: "40000 + 6000 + 300 = 46300 です。" },
    { prompt: "7万と5百と9を合わせた数は？", answer: numberAnswer(70509), explanation: "千の位と十の位には何もないので0を書きます。70509です。" },
    { prompt: "2万と8千と4十を合わせた数は？", answer: numberAnswer(28040), explanation: "百の位と一の位は0です。28040です。" },
    { prompt: "9万と9を合わせた数は？", answer: numberAnswer(90009), explanation: "千・百・十の位はぜんぶ0です。90009です。" },
    { prompt: "5万と1千と6百と2十と3を合わせた数は？", answer: numberAnswer(51623), explanation: "位のじゅんにならべると51623です。" }
  ].map((item) => ({ ...item, axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 1 }, questionType: "numeric_input" })));

  // F2 位の数字を読み取る(drill, d1)
  fam({
    familyId: "num_digit",
    funMechanic: "drill",
    learningObjective: "5けたの数の、それぞれの位の数字を読み取れる",
    commonMistake: "位を1つずらして読んでしまう",
    estimatedSeconds: 45,
    skillTags: ["大きな数", "位取り"]
  }, [
    { prompt: "35062 の千の位の数字はいくつ？", answer: numberAnswer(5), explanation: "35062は、3万5千62です。千の位は5です。" },
    { prompt: "80417 の万の位の数字はいくつ？", answer: numberAnswer(8), explanation: "5けたの数は、いちばん左が万の位です。80417の万の位は8です。" },
    { prompt: "62950 の十の位の数字はいくつ？", answer: numberAnswer(5), explanation: "右から2ばんめが十の位です。5です。" },
    { prompt: "49006 の百の位の数字はいくつ？", answer: numberAnswer(0), explanation: "右から3ばんめが百の位です。0です。" }
  ].map((item) => ({ ...item, axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 1 }, questionType: "numeric_input" })));

  // F3 表し方を選ぶ(drill, d2)
  fam({
    familyId: "num_compose_choice",
    funMechanic: "drill",
    learningObjective: "数を万・千・百・十・一の組み合わせで表せる",
    commonMistake: "0のある位をとばして、となりの位とまちがえる",
    estimatedSeconds: 60,
    skillTags: ["大きな数", "位取り", "数の構成"]
  }, [
    { prompt: "52006 の表し方として正しいのはどれ？", correct: "5万と2千と6", wrongs: ["5万と2百と6", "5万と2千と6十", "5千と2百と6"], explanation: "52006は、5万と2千と6です。百の位と十の位は0です。" },
    { prompt: "70940 の表し方として正しいのはどれ？", correct: "7万と9百と4十", wrongs: ["7万と9千と4十", "7千と9百と4十", "7万と9十と4"], explanation: "70940は、7万と9百と4十です。千の位は0です。" },
    { prompt: "30009 の表し方として正しいのはどれ？", correct: "3万と9", wrongs: ["3万と9十", "3万と9百", "3千と9"], explanation: "30009は、3万と9です。あいだの位はぜんぶ0です。" }
  ].map((item) => ({
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 },
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, item.wrongs),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F4 大小くらべ(drill, d2)
  fam({
    familyId: "num_compare",
    funMechanic: "drill",
    learningObjective: "大きな数を、上の位からじゅんにくらべられる",
    commonMistake: "とちゅうの大きい数字だけを見てくらべてしまう",
    estimatedSeconds: 60,
    skillTags: ["大きな数", "大小比較"]
  }, [
    { a: 34820, b: 38420 }, { a: 52006, b: 50260 }, { a: 67890, b: 68790 }, { a: 10450, b: 10045 }
  ].map(({ a, b }) => ({
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 1 },
    questionType: "multiple_choice",
    prompt: `${a} と ${b}。大きいのはどっち？`,
    choices: textChoices(String(Math.max(a, b)), [String(Math.min(a, b)), "同じ", "くらべられない"]),
    answer: choiceAnswer(String(Math.max(a, b))),
    explanation: `万の位からじゅんにくらべます。大きいのは ${Math.max(a, b)} です。`
  })));

  // F5 数直線・数のならび(inference, d3)
  fam({
    familyId: "num_number_line",
    funMechanic: "inference",
    learningObjective: "数直線やならびの中で、数の位置をつかめる",
    commonMistake: "1めもりの大きさをたしかめずに数える",
    estimatedSeconds: 90,
    skillTags: ["大きな数", "数直線"]
  }, [
    { prompt: "30000 と 40000 のちょうどまん中の数は？", answer: numberAnswer(35000), explanation: "30000と40000の間は10000。その半分の5000をたして35000です。" },
    { prompt: "数直線で、1めもりは1000です。47000から右へ3めもり進んだ数は？", answer: numberAnswer(50000), explanation: "1000が3つ分で3000ふえます。47000 + 3000 = 50000 です。" },
    { prompt: "0から100000までを、同じ長さで10に分けた数直線があります。1めもりの大きさは？", answer: numberAnswer(10000), explanation: "100000を10に分けると、1めもりは10000です。" },
    { prompt: "69000 より 1000 大きい数は？", answer: numberAnswer(70000), explanation: "69000 + 1000 = 70000 です。千の位がくり上がって万の位が変わります。" },
    { prompt: "100000 より 1 小さい数は？", answer: numberAnswer(99999), explanation: "100000の1つ前の数は99999です。" }
  ].map((item) => ({ ...item, axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 1 }, questionType: "numeric_input" })));

  // F6 10ばい・10でわる(rule_discovery, d2-d3)
  fam({
    familyId: "num_times10",
    funMechanic: "rule_discovery",
    learningObjective: "10ばい・100ばい・10でわると位が動くきまりがわかる",
    commonMistake: "10ばいで0を2つつけるなど、0の数をまちがえる",
    estimatedSeconds: 75,
    skillTags: ["大きな数", "10ばい"]
  }, [
    { prompt: "25 を10ばいすると、いくつ？", answer: numberAnswer(250), explanation: "10ばいすると位が1つ上がり、右に0が1つつきます。250です。", axes: { knowledge: 2, info: 1, steps: 2, format: 2, choices: 1 } },
    { prompt: "25 を100ばいすると、いくつ？", answer: numberAnswer(2500), explanation: "100ばいは10ばいの10ばい。右に0が2つついて2500です。", axes: { knowledge: 2, info: 1, steps: 2, format: 2, choices: 1 } },
    { prompt: "380 を10でわると、いくつ？", answer: numberAnswer(38), explanation: "10でわると位が1つ下がり、一の位の0が1つとれます。38です。", axes: { knowledge: 2, info: 1, steps: 2, format: 2, choices: 1 } },
    { prompt: "7 を10ばいして、さらに10ばいすると、いくつ？", answer: numberAnswer(700), explanation: "7 → 70 → 700 と、0が1つずつふえます。700です。", axes: { knowledge: 2, info: 2, steps: 3, format: 2, choices: 1 } },
    { prompt: "10ばいすると位が1つ上がるきまりを使うと、60 の10ばいは？", answer: numberAnswer(600), explanation: "60の右に0が1つついて600です。", axes: { knowledge: 2, info: 1, steps: 2, format: 2, choices: 1 } }
  ].map((item) => ({ ...item, questionType: "numeric_input" })));

  // F7 まちがい直し(find_mistake, d3)
  fam({
    familyId: "num_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "大きな数の読み方・くらべ方のまちがいに気づいて直せる",
    commonMistake: "0のある位をとばして読んでしまう",
    estimatedSeconds: 90,
    skillTags: ["大きな数", "たしかめ"]
  }, [
    { prompt: "みおさんは 70086 を「七万八百六十」と読みました。正しい読み方はどれ？", correct: "七万八十六", wrongs: ["七万八百六十で正しい", "七万八千六", "七千八十六"], explanation: "70086は、7万と80と6なので「七万八十六」です。", questionType: "multiple_choice" },
    { prompt: "はるとさんは「3万と300をあわせると3300」と言いました。正しい数はいくつ？", answer: numberAnswer(30300), explanation: "30000 + 300 = 30300 です。千の位と十の位、一の位は0です。", questionType: "numeric_input" },
    { prompt: "みおさんは「41000より39800のほうが大きい。9は4より大きいから」と言いました。正しいのはどれ？", correct: "41000のほうが大きい。まず万の位でくらべるから", wrongs: ["39800のほうが大きいで正しい", "同じ大きさ", "くらべられない"], explanation: "くらべるときは、いちばん上の万の位から見ます。4万と3万で、41000のほうが大きいです。", questionType: "multiple_choice" },
    { prompt: "はるとさんは 99999 に 1 をたして「99100」と言いました。正しい答えはいくつ？", answer: numberAnswer(100000), explanation: "99999 + 1 = 100000(十万)です。ぜんぶの位がくり上がります。", questionType: "numeric_input" },
    { prompt: "みおさんは「60000 は 600 を10ばいした数」と言いました。正しくは、600を何ばいした数？", answer: numberAnswer(100), explanation: "600の10ばいは6000です。60000は600の100ばいです。", questionType: "numeric_input" }
  ].map((item) => ({
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: item.correct ? 2 : 1 },
    questionType: item.questionType,
    prompt: item.prompt,
    choices: item.correct ? textChoices(item.correct, item.wrongs) : [],
    answer: item.correct ? choiceAnswer(item.correct) : item.answer,
    explanation: item.explanation
  })));

  // F8 どっちの言い分が正しい？(judge_claim, d3)
  const judgeChoices = ["二人とも正しい", "はるとだけ正しい", "みおだけ正しい", "二人ともまちがい"];
  fam({
    familyId: "num_judge_claim",
    funMechanic: "judge_claim",
    learningObjective: "大きな数の見方(いくつ集めた数か)について判断できる",
    commonMistake: "「1000を〜こ」と「100を〜こ」を混同する",
    estimatedSeconds: 90,
    skillTags: ["大きな数", "数の構成"]
  }, [
    { prompt: "はると「10000 は、9999 より1大きい数」。みお「10000 は、1000 を10こ集めた数」。正しいのはどっち？", correct: "二人とも正しい", explanation: "9999 + 1 = 10000 で、1000 × 10 = 10000。どちらも10000の正しい見方です。" },
    { prompt: "48000 について。はると「1000 を4こ集めた数」。みお「100 を48こ集めた数」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "48000は1000を48こ集めた数です。1000を4こ集めても4000にしかならず、100を48こ集めても4800にしかなりません。" },
    { prompt: "はると「一万円さつ1まいは、千円さつ5まい分」。みお「一万円さつ1まいは、百円玉10こ分」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "一万円は千円さつ10まい分(1000 × 10 = 10000)、また百円玉100こ分(100 × 100 = 10000)です。" },
    { prompt: "70000 と 68999。はると「けたの数が同じだから同じ大きさ」。みお「68999は9がたくさんあるから大きい」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "けたの数が同じでも、大きさは同じとはかぎりません。万の位でくらべると7と6なので、70000のほうが大きいです。9の数は関係ありません。" },
    { prompt: "0、2、5、7、9 のカードで作れるいちばん大きい5けたの数。はると「97520」。みお「92750」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "大きいじゅんに左からならべると 97520 です。" }
  ].map((item) => ({
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 },
    questionType: "multiple_choice",
    prompt: item.prompt,
    choices: textChoices(item.correct, judgeChoices.filter((choice) => choice !== item.correct)),
    answer: choiceAnswer(item.correct),
    explanation: item.explanation
  })));

  // F9 カードで数作り(inference, d4-d5)
  fam({
    familyId: "num_make_number",
    funMechanic: "inference",
    learningObjective: "条件に合う数を、数字カードの組み合わせで作れる",
    commonMistake: "いちばん小さい数を作るとき、0を先頭に置いてしまう",
    estimatedSeconds: 120,
    skillTags: ["大きな数", "数作り", "推理"]
  }, [
    { prompt: "1、3、6、8 の4まいのカードをぜんぶ使って、いちばん大きい4けたの数を作ると？", answer: numberAnswer(8631), explanation: "大きい数字から左にならべます。8631です。", axes: { knowledge: 2, info: 2, steps: 3, format: 3, choices: 1 } },
    { prompt: "1、3、6、8 の4まいのカードをぜんぶ使って、いちばん小さい4けたの数を作ると？", answer: numberAnswer(1368), explanation: "小さい数字から左にならべます。1368です。", axes: { knowledge: 2, info: 2, steps: 3, format: 3, choices: 1 } },
    { prompt: "0、2、4、7 の4まいのカードをぜんぶ使って、いちばん小さい4けたの数を作ると？", answer: numberAnswer(2047), explanation: "0は先頭に置けないので、2を先頭にして、つぎに0を置きます。2047です。", axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 1 } },
    { prompt: "2、5、9 の3まいのカードをぜんぶ使って作れる3けたの数のうち、2ばんめに大きい数は？", answer: numberAnswer(925), explanation: "いちばん大きいのは952。2ばんめは925です。", axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 1 } },
    { prompt: "0、1、5、8 の4まいのカードをぜんぶ使って、5000にいちばん近い4けたの数を作ると？", answer: numberAnswer(5018), explanation: "5000より大きい数では5018がいちばん近いです(ちがいは18)。5000より小さい数は1850までしか作れません。", axes: { knowledge: 3, info: 3, steps: 3, format: 3, choices: 1 } }
  ].map((item) => ({ ...item, questionType: "numeric_input" })));

  // F10 数当てリドル(inference, d4)
  fam({
    familyId: "num_riddle",
    funMechanic: "inference",
    learningObjective: "位のヒントから数をしぼりこめる",
    commonMistake: "ヒントの一部だけで数を決めてしまう",
    estimatedSeconds: 120,
    skillTags: ["大きな数", "推理"]
  }, [
    { prompt: "ヒント1：5けたの数。ヒント2：万の位は3、千の位は0。ヒント3：のこりの位はぜんぶ7。この数は？", answer: numberAnswer(30777), explanation: "万の位3、千の位0、百・十・一の位が7で、30777です。" },
    { prompt: "ヒント1：40000より大きくて50000より小さい。ヒント2：千の位は9。ヒント3：百・十・一の位はぜんぶ0。この数は？", answer: numberAnswer(49000), explanation: "40000と50000の間なので万の位は4です。千の位が9、あとは0で、49000です。" },
    { prompt: "ある数を10ばいしたら 35000 になりました。ある数はいくつ？", answer: numberAnswer(3500), explanation: "10ばいのぎゃくは10でわることです。35000 ÷ 10 = 3500 です。" },
    { prompt: "1000 を10こ集めた数に、100 を5こ集めた数をたすと、いくつ？", answer: numberAnswer(10500), explanation: "1000 × 10 = 10000、100 × 5 = 500。あわせて10500です。" },
    { prompt: "ヒント1：一の位が0の5けたの数。ヒント2：10でわると 6070 になる。この数は？", answer: numberAnswer(60700), explanation: "10でわって6070になる数は、6070の10ばいで60700です。" }
  ].map((item) => ({ ...item, axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 1 }, questionType: "numeric_input" })));

  // F11 きりのよい数の計算(drill, d2)
  fam({
    familyId: "num_unit_calc",
    funMechanic: "drill",
    learningObjective: "何千・何万のまとまりで、たし算・ひき算ができる",
    commonMistake: "0の数をまちがえて、位がずれた答えを書く",
    estimatedSeconds: 60,
    skillTags: ["大きな数", "計算"]
  }, [
    { prompt: "48000 + 3000 はいくつ？", answer: numberAnswer(48000 + 3000), explanation: "1000のまとまりで考えると、48 + 3 = 51 で、51000です。" },
    { prompt: "26000 - 4000 はいくつ？", answer: numberAnswer(26000 - 4000), explanation: "1000のまとまりで考えると、26 - 4 = 22 で、22000です。" },
    { prompt: "70000 + 30000 はいくつ？", answer: numberAnswer(70000 + 30000), explanation: "1万のまとまりで考えると、7 + 3 = 10 で、100000(十万)です。" },
    { prompt: "9000 + 5000 はいくつ？", answer: numberAnswer(9000 + 5000), explanation: "1000のまとまりで考えると、9 + 5 = 14 で、14000です。" }
  ].map((item) => ({ ...item, axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 1 }, questionType: "numeric_input" })));

  if (questions.length !== 50) {
    throw new Error(`large_numbers: expected 50 questions, got ${questions.length}`);
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

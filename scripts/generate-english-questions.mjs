import { writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";

const outFile = new URL("../src/data/questions/grade3/english/questions.js", import.meta.url);

const unitLabels = {
  hello: "Hello!",
  how_are_you: "How are you?",
  how_many: "How many?",
  i_like_blue: "I like blue.",
  what_do_you_like: "What do you like?",
  alphabet: "ALPHABET",
  this_is_for_you: "This is for you.",
  whats_this: "What's this?",
  who_are_you: "Who are you?"
};

function pad(number) {
  return String(number).padStart(3, "0");
}

function textChoices(correct, wrongs) {
  const values = [...new Set([correct, ...wrongs].map(String))];
  return values.slice(0, 4).map((text, index) => ({
    id: String.fromCharCode(97 + index),
    text
  }));
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

// 全単元共通のfamilyビルダー(chibique-question-design-core準拠)。
function makeFamilyBuilder(unit, startIndex = 101) {
  const questions = [];
  let index = startIndex;
  const fam = (meta, items) => {
    for (const item of items) {
      questions.push({
        id: `g3_en_${unit}_${pad(index++)}`,
        version: 2,
        grade: 3,
        subject: "english",
        unit,
        unitLabel: unitLabels[unit],
        curriculumArea: "外国語活動",
        difficulty: difficultyFromAxes(item.axes ?? meta.axes),
        difficultyAxes: item.axes ?? meta.axes,
        questionType: "multiple_choice",
        prompt: item.prompt,
        choices: textChoices(item.correct, item.wrongs ?? judgeWrongs(item.correct)),
        answer: { type: "choice", value: String(item.correct) },
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

const JUDGE = ["二人とも正しい", "はるとだけ正しい", "みおだけ正しい", "二人ともまちがい"];
const judgeWrongs = (correct) => JUDGE.filter((choice) => choice !== correct);

// ---------------------------------------------------------------- Hello!(30)
function makeHello() {
  const { questions, fam } = makeFamilyBuilder("hello");

  // F1 場面に合うあいさつ(drill, d2)
  fam({
    familyId: "en_hello_greeting",
    funMechanic: "drill",
    learningObjective: "時間帯や場面に合うあいさつの英語を選べる",
    commonMistake: "朝・昼・夜のあいさつを取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["あいさつ", "会話"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "朝、友だちに会いました。合う英語はどれ？", correct: "Good morning.", wrongs: ["Good night.", "Goodbye.", "Thank you."], explanation: "朝のあいさつは Good morning. です。" },
    { prompt: "昼ごろに使いやすいあいさつはどれ？", correct: "Good afternoon.", wrongs: ["Good night.", "I'm sad.", "How many?"], explanation: "昼から午後のあいさつは Good afternoon. です。" },
    { prompt: "夜、寝る前のあいさつはどれ？", correct: "Good night.", wrongs: ["Good afternoon.", "Hello.", "See you."], explanation: "寝る前は Good night. を使います。" },
    { prompt: "別れるときに合う英語はどれ？", correct: "See you.", wrongs: ["Hello.", "Good morning.", "I'm happy."], explanation: "別れる時は See you. が自然です。" },
    { prompt: "友だちに会ったときの一番ふつうのあいさつはどれ？", correct: "Hello.", wrongs: ["Thank you.", "See you.", "Twelve."], explanation: "会ったときのあいさつは Hello. です。" }
  ]);

  // F2 会話のキャッチボール(drill, d3)
  fam({
    familyId: "en_hello_exchange",
    funMechanic: "drill",
    learningObjective: "あいさつや自己しょうかいのやりとりに、合う返事を選べる",
    commonMistake: "相手の発話と関係ない返事を選んでしまう",
    estimatedSeconds: 45,
    skillTags: ["あいさつ", "会話"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "A: Hello. B: ____ に入る返事はどれ？", correct: "Hello.", wrongs: ["Ten.", "Blue.", "A dog."], explanation: "Hello. には Hello. と返せます。" },
    { prompt: "A: Nice to meet you. B: ____", correct: "Nice to meet you, too.", wrongs: ["Good night.", "It's blue.", "Five pencils."], explanation: "はじめましてと言われたら too を付けて返せます。" },
    { prompt: "Thank you. と言われた時の返事はどれ？", correct: "You're welcome.", wrongs: ["I'm sleepy.", "I like pizza.", "It's an onion."], explanation: "ありがとうへの返事は You're welcome. です。" },
    { prompt: "はじめて会う友だちに言う英語として合うものはどれ？", correct: "Nice to meet you.", wrongs: ["See you.", "I'm fine.", "How many?"], explanation: "はじめて会う時は Nice to meet you. が合います。" },
    { prompt: "A: See you. B: ____ に入る自然な返事はどれ？", correct: "See you.", wrongs: ["Nice to meet you.", "Seven.", "It's a cat."], explanation: "See you. には See you. と返せます。" }
  ]);

  // F3 自己しょうかい(best_choice, d2)
  fam({
    familyId: "en_hello_self",
    funMechanic: "best_choice",
    learningObjective: "自分の名前を言う言い方を選べる",
    commonMistake: "I'm と You're を取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["あいさつ", "自己しょうかい"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "名前を言うときに合う英語はどれ？", correct: "I'm Yuta.", wrongs: ["You're welcome.", "It's a cat.", "I like red."], explanation: "自分の名前を言う時は I'm ... を使います。" },
    { prompt: "相手に名前をたずねる英語はどれ？", correct: "What's your name?", wrongs: ["How many?", "What's this?", "Who are you?"], explanation: "名前をたずねる時は What's your name? です。" },
    { prompt: "「わたしはミナです」を英語で言うと？", correct: "I'm Mina.", wrongs: ["You're Mina.", "It's Mina.", "Mina is you."], explanation: "自分の名前は I'm ... で言います。" },
    { prompt: "「わたしはケンタです」を英語で言うと？", correct: "I'm Kenta.", wrongs: ["You're Kenta.", "It's Kenta.", "Kenta is you."], explanation: "自分の名前は I'm ... で言います。" },
    { prompt: "「あなたの名前は何ですか」を英語で言うと？", correct: "What's your name?", wrongs: ["What's this?", "How are you?", "Who is your name?"], explanation: "名前をたずねる決まった言い方は What's your name? です。" }
  ]);

  // F4 気持ちを聞き分ける(inference, d3)
  fam({
    familyId: "en_hello_infer",
    funMechanic: "inference",
    learningObjective: "会話の流れから、次に来る自然な言葉を予想できる",
    commonMistake: "英語の意味を考えず、日本語での思いつきで選んでしまう",
    estimatedSeconds: 60,
    skillTags: ["あいさつ", "会話", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: Good morning! How are you? B: I'm fine, thank you. And you? Aの次の返事として自然なものはどれ？", correct: "I'm fine, too.", wrongs: ["Good night.", "Twelve.", "It's a pen."], explanation: "同じように調子を聞かれたら、自分の調子を答えるのが自然です。" },
    { prompt: "A: Nice to meet you. B: Nice to meet you, too. この会話の場面として合うものはどれ？", correct: "はじめて会ったとき", wrongs: ["別れるとき", "ものをわたすとき", "数をたずねるとき"], explanation: "Nice to meet you. は、はじめて会ったときのあいさつです。" },
    { prompt: "A: Good night. B: Good night. See you tomorrow. この会話の場面として合うものはどれ？", correct: "夜、別れるとき", wrongs: ["朝、出会ったとき", "食べ物をもらったとき", "数をかぞえるとき"], explanation: "Good night. は夜、別れるときのあいさつです。" },
    { prompt: "A: Hello! I'm Sora. B: Hello! I'm Yui. Nice to meet you. この会話で行われていることはどれ？", correct: "はじめて会って、名前を言い合っている", wrongs: ["別れのあいさつをしている", "数をかぞえている", "好きな色を話している"], explanation: "お互いに名前を言い、Nice to meet you. とあいさつしています。" },
    { prompt: "A: Good afternoon! B: Good afternoon! How are you? この会話が行われている時間帯として合うものはどれ？", correct: "昼すぎ", wrongs: ["朝早く", "夜ねる前", "真夜中"], explanation: "Good afternoon. は昼すぎに使うあいさつです。" }
  ]);

  // F4b お礼の会話を読み取る(inference, d3)
  fam({
    familyId: "en_hello_thanks_infer",
    funMechanic: "inference",
    learningObjective: "お礼のやりとりの会話から場面を読み取れる",
    commonMistake: "会話の一部だけを見て、場面全体を考えない",
    estimatedSeconds: 60,
    skillTags: ["あいさつ", "お礼", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: Thank you for the card! B: You're welcome. この会話が行われている場面として合うものはどれ？", correct: "カードをもらってお礼を言っている", wrongs: ["名前をたずねている", "数をかぞえている", "別れのあいさつをしている"], explanation: "カードのお礼を言い、You're welcome. と返しています。" }
  ]);

  // F5 あいさつのなかまはずれ(rule_discovery, d3)
  fam({
    familyId: "en_hello_odd",
    funMechanic: "rule_discovery",
    learningObjective: "あいさつの言葉を、使う時間帯や場面でなかま分けできる",
    commonMistake: "音の似た言葉だけでなかまを判断する",
    estimatedSeconds: 60,
    skillTags: ["あいさつ", "なかま分け"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "なかまはずれの言葉はどれ？（Good morning. ・Good afternoon. ・Good night. ・Thank you.）", correct: "Thank you.", wrongs: ["Good morning.", "Good afternoon.", "Good night."], explanation: "Good morning./afternoon./night. は時間帯のあいさつですが、Thank you. はお礼の言葉です。" },
    { prompt: "なかまはずれの言葉はどれ？（Hello. ・See you. ・Nice to meet you. ・How many?）", correct: "How many?", wrongs: ["Hello.", "See you.", "Nice to meet you."], explanation: "Hello./See you./Nice to meet you. はあいさつですが、How many? は数をたずねる質問です。" },
    { prompt: "なかまはずれの言葉はどれ？（Good morning. ・Good night. ・You're welcome. ・Good afternoon.）", correct: "You're welcome.", wrongs: ["Good morning.", "Good night.", "Good afternoon."], explanation: "Good morning./night./afternoon. は時間帯のあいさつですが、You're welcome. はお礼への返事です。" },
    { prompt: "なかまはずれの言葉はどれ？（I'm Yuta. ・What's your name? ・I'm Mina. ・Seven.）", correct: "Seven.", wrongs: ["I'm Yuta.", "What's your name?", "I'm Mina."], explanation: "I'm Yuta./I'm Mina./What's your name? は名前に関する言葉ですが、Seven. は数を表す言葉です。" },
    { prompt: "なかまはずれの言葉はどれ？（Hello. ・Nice to meet you. ・Good morning. ・What's this?）", correct: "What's this?", wrongs: ["Hello.", "Nice to meet you.", "Good morning."], explanation: "Hello./Nice to meet you./Good morning. はあいさつですが、What's this? はものの名前をたずねる質問です。" }
  ]);

  // F6 あいさつの言い分(judge_claim, d3)
  fam({
    familyId: "en_hello_judge",
    funMechanic: "judge_claim",
    learningObjective: "あいさつの使い方についての主張を判断できる",
    commonMistake: "似た場面のあいさつを同じだと思いこむ",
    estimatedSeconds: 60,
    skillTags: ["あいさつ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「Good night. は朝には使わない」。みお「Good morning. は夜には使わない」。正しいのはどっち？", correct: "二人とも正しい", explanation: "あいさつは時間帯によって使い分けます。" },
    { prompt: "はると「See you. は初対面のあいさつだ」。みお「See you. は別れるときのあいさつだ」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "See you. は別れるときに使うあいさつです。初対面には Nice to meet you. を使います。" },
    { prompt: "はると「You're welcome. はお礼を言われたときの返事だ」。みお「You're welcome. は自分からお礼を言うときの言葉だ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "You're welcome. はThank you.と言われたときの返事です。自分からお礼を言うときはThank you.を使います。" },
    { prompt: "はると「What's your name? には『はい』か『いいえ』で答える」。みお「What's your name? には数で答える」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "What's your name? は名前をたずねる質問なので、名前で答えます。はい・いいえや数では答えません。" }
  ]);

  if (questions.length !== 30) throw new Error(`hello: expected 30, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- How are you?(30)
function makeHowAreYou() {
  const { questions, fam } = makeFamilyBuilder("how_are_you");

  // F1 気分・体調の単語(drill, d2)
  fam({
    familyId: "en_feel_word",
    funMechanic: "drill",
    learningObjective: "気分や体調を表す英語の単語がわかる",
    commonMistake: "happy と sad、hungry と sleepy など反対の意味を取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["気分", "体調"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "How are you? と聞かれました。元気ならどれ？", correct: "I'm fine.", wrongs: ["I'm a cat.", "It's red.", "This is for you."], explanation: "気分や体調を答える時は I'm ... を使います。" },
    { prompt: "眠いと答える英語はどれ？", correct: "I'm sleepy.", wrongs: ["I'm happy.", "I'm hungry.", "I'm fine."], explanation: "眠いは sleepy です。ねむい時に I'm sleepy. と言います。" },
    { prompt: "お腹がすいた時の答えはどれ？", correct: "I'm hungry.", wrongs: ["I'm sad.", "I'm sleepy.", "I'm great."], explanation: "お腹がすいたは hungry です。" },
    { prompt: "悲しい気持ちを表す英語はどれ？", correct: "I'm sad.", wrongs: ["I'm happy.", "I'm fine.", "I'm great."], explanation: "悲しいは sad です。反対に、うれしいは happy です。" },
    { prompt: "とても調子がよい時の答えはどれ？", correct: "I'm great.", wrongs: ["I'm tired.", "I'm sad.", "I'm a dog."], explanation: "とてもよい調子なら I'm great. が合います。" }
  ]);

  // F2 意味を日本語に直す(drill, d2)
  fam({
    familyId: "en_feel_meaning",
    funMechanic: "drill",
    learningObjective: "気分・体調の英語を聞いて、日本語の意味がわかる",
    commonMistake: "似た音の単語(sad/sleepy)の意味を混同する",
    estimatedSeconds: 30,
    skillTags: ["気分", "体調"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "A: I'm happy. に近い意味はどれ？", correct: "うれしい", wrongs: ["ねむい", "かなしい", "つかれた"], explanation: "happy はうれしいという意味です。" },
    { prompt: "A: How are you? B: I'm tired. Bの気分は？", correct: "つかれている", wrongs: ["うれしい", "お腹がすいた", "元気いっぱい"], explanation: "tired はつかれているという意味です。" },
    { prompt: "A: I'm hungry. に近い意味はどれ？", correct: "お腹がすいた", wrongs: ["ねむい", "元気", "かなしい"], explanation: "hungry はお腹がすいたという意味です。" }
  ]);

  // F3 質問と返事(best_choice, d2)
  fam({
    familyId: "en_feel_ask",
    funMechanic: "best_choice",
    learningObjective: "調子をたずねる表現と、その答え方を区別できる",
    commonMistake: "たずねる文と答える文を混同する",
    estimatedSeconds: 45,
    skillTags: ["気分", "会話"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "相手の調子をたずねる英語はどれ？", correct: "How are you?", wrongs: ["How many?", "What's this?", "I like blue."], explanation: "調子をたずねる時は How are you? です。" },
    { prompt: "How are you? の自然な返事ではないものはどれ？", correct: "It's a pencil.", wrongs: ["I'm fine.", "I'm sleepy.", "I'm hungry."], explanation: "It's a pencil. は物を説明する文です。" },
    { prompt: "A: How are you? B: ____. 「少しつかれた」と言いたい時は？", correct: "I'm tired.", wrongs: ["I'm a book.", "I like cats.", "This is red."], explanation: "つかれたは tired です。つかれた時に I'm tired. と言います。" }
  ]);

  // F4 会話から気持ちを読み取る(inference, d3)
  fam({
    familyId: "en_feel_infer",
    funMechanic: "inference",
    learningObjective: "短い会話から、相手の気持ちや理由を考えられる",
    commonMistake: "会話の一部だけを見て、全体の流れを考えない",
    estimatedSeconds: 75,
    skillTags: ["気分", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: How are you? B: I'm sleepy. I went to bed late. Bが眠い理由は？", correct: "夜おそくねたから", wrongs: ["朝ごはんを食べたから", "サッカーをしたから", "本を読んだから"], explanation: "I went to bed late.(夜おそくねた)が理由です。" },
    { prompt: "A: How are you? B: I'm great! I got a new soccer ball. Bが調子いい理由は？", correct: "新しいサッカーボールをもらったから", wrongs: ["ねむいから", "お腹がすいたから", "かなしいから"], explanation: "I got a new soccer ball.(新しいサッカーボールをもらった)が理由です。", soccer: true },
    { prompt: "A: How are you? B: I'm sad. I lost my pencil. Bがかなしい理由は？", correct: "えんぴつをなくしたから", wrongs: ["ねむいから", "お腹がすいたから", "うれしいから"], explanation: "I lost my pencil.(えんぴつをなくした)が理由です。" },
    { prompt: "A: How are you? B: I'm hungry. It's lunch time! Bがお腹がすいている理由は？", correct: "お昼の時間だから", wrongs: ["ねむいから", "かなしいから", "つかれたから"], explanation: "It's lunch time!(お昼の時間だ)が理由です。" }
  ]);

  // F5 どっちの気持ちが合う？(judge_claim, d3)
  fam({
    familyId: "en_feel_judge",
    funMechanic: "judge_claim",
    learningObjective: "気分の単語の使い方についての主張を判断できる",
    commonMistake: "似た意味の単語の細かいちがいを気にしない",
    estimatedSeconds: 60,
    skillTags: ["気分"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「happy と great はどちらも良い気分を表す」。みお「happy と sad は反対の意味」。正しいのはどっち？", correct: "二人とも正しい", explanation: "happy と great はどちらも良い気分、happy と sad は反対の意味です。" },
    { prompt: "はると「sleepy はお腹がすいたという意味」。みお「hungry がお腹がすいたという意味」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "hungry がお腹がすいた、sleepy は眠いという意味です。" },
    { prompt: "はると「great は fine よりもっと調子が良いことを表す」。みお「sad は fine より調子が良くない気持ちを表す」。正しいのはどっち？", correct: "二人とも正しい", explanation: "great は fine よりさらに良い調子を表し、sad は fine より良くない気持ちを表します。" }
  ]);

  // F6 気分のなかまはずれ(rule_discovery, d3)
  fam({
    familyId: "en_feel_odd",
    funMechanic: "rule_discovery",
    learningObjective: "良い気分と悪い気分の言葉をなかま分けできる",
    commonMistake: "単語の意味を確かめずに、音の響きでなかまを判断する",
    estimatedSeconds: 60,
    skillTags: ["気分", "なかま分け"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "なかまはずれの言葉はどれ？（happy ・great ・fine ・sad）", correct: "sad", wrongs: ["happy", "great", "fine"], explanation: "happy/great/fineは良い気分の言葉ですが、sadは悪い気分の言葉です。" },
    { prompt: "なかまはずれの言葉はどれ？（sleepy ・hungry ・tired ・happy）", correct: "happy", wrongs: ["sleepy", "hungry", "tired"], explanation: "sleepy/hungry/tiredは体の状態を表す言葉ですが、happyは良い気分の言葉です。" }
  ]);

  // F7 気分をたずねる会話(inference, d4)
  fam({
    familyId: "en_feel_infer2",
    funMechanic: "inference",
    learningObjective: "会話の中で複数の気分の変化を読み取れる",
    commonMistake: "会話の最初の部分だけを見て、変化に気づかない",
    estimatedSeconds: 90,
    skillTags: ["気分", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: How are you? B: I was tired, but now I'm great! I had lunch. Bの今の気分は？", correct: "great(とても良い)", wrongs: ["tired(つかれた)のまま", "sad(かなしい)", "sleepy(ねむい)"], explanation: "was tired(つかれていた)が、had lunch(お昼を食べた)ので今はgreatです。" },
    { prompt: "A: How are you? B: I'm sleepy now, but I'll be great after I sleep. Bが今どんな気分か？", correct: "sleepy(ねむい)", wrongs: ["great(とても良い)", "hungry(お腹がすいた)", "sad(かなしい)"], explanation: "sleepy now(今ねむい)と言っています。great になるのはねむったあとです。" }
  ]);

  // F8 サッカーの試合と気分(inference, d4)
  fam({
    familyId: "en_feel_soccer",
    funMechanic: "inference",
    learningObjective: "サッカーの場面での気分の理由を読み取れる",
    commonMistake: "場面の設定を無視して、単語だけで気分を判断する",
    estimatedSeconds: 90,
    skillTags: ["気分", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: How are you? B: I'm great! My team won the game! Bが調子いい理由は？", correct: "チームが試合に勝ったから", wrongs: ["ねむいから", "お腹がすいたから", "かなしいから"], explanation: "My team won the game!(チームが試合に勝った)が理由です。", soccer: true },
    { prompt: "A: How are you? B: I'm sad. We lost the soccer game. Bがかなしい理由は？", correct: "サッカーの試合に負けたから", wrongs: ["試合に勝ったから", "お腹がすいたから", "ねむいから"], explanation: "We lost the soccer game.(サッカーの試合に負けた)が理由です。", soccer: true },
    { prompt: "A: How are you? B: I'm tired. I played soccer all day. Bがつかれている理由は？", correct: "1日中サッカーをしたから", wrongs: ["ねむったから", "食べすぎたから", "本を読んだから"], explanation: "I played soccer all day.(1日中サッカーをした)が理由です。", soccer: true }
  ]);

  // F9 気分にあう返事を選ぶ(best_choice, d3)
  fam({
    familyId: "en_feel_response",
    funMechanic: "best_choice",
    learningObjective: "相手の気分に合わせた自然な返事を選べる",
    commonMistake: "相手の気分と関係ない返事を選んでしまう",
    estimatedSeconds: 60,
    skillTags: ["気分", "会話"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: I'm sad. I lost my dog. Bの返事として合うものはどれ？", correct: "Oh no, I'm sorry.", wrongs: ["That's great!", "Me, too!", "How many?"], explanation: "相手がかなしいときは、なぐさめる言葉が自然です。" },
    { prompt: "A: I'm great! I got a new bike! Bの返事として合うものはどれ？", correct: "That's great!", wrongs: ["I'm sorry.", "Good night.", "How many?"], explanation: "相手がうれしいときは、いっしょによろこぶ言葉が自然です。" },
    { prompt: "A: I'm hungry. Bの返事として合うものはどれ？", correct: "Let's eat lunch!", wrongs: ["Let's sleep!", "I'm sorry for you.", "See you tomorrow."], explanation: "お腹がすいたと言われたら、食事にさそうのが自然です。" },
    { prompt: "A: I'm sleepy. Bの返事として合うものはどれ？", correct: "Let's take a rest.", wrongs: ["Let's play soccer!", "I'm hungry, too.", "Nice to meet you."], explanation: "ねむいと言われたら、休むことをすすめるのが自然です。" },
    { prompt: "A: I'm tired. I studied all day. Bの返事として合うものはどれ？", correct: "You did a great job!", wrongs: ["I don't like you.", "How many?", "It's an apple."], explanation: "がんばった相手には、ねぎらいの言葉をかけるのが自然です。" }
  ]);

  if (questions.length !== 30) throw new Error(`how_are_you: expected 30, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- How many?(30)
function makeHowMany() {
  const { questions, fam } = makeFamilyBuilder("how_many");

  // F1 数字を読む(drill, d1)
  fam({
    familyId: "en_number_read",
    funMechanic: "drill",
    learningObjective: "1〜20の数を表す英語がわかる",
    commonMistake: "似た音の数(thirteen/thirty、fifteen/fifty)を混同する",
    estimatedSeconds: 30,
    skillTags: ["数", "How many"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "nine の意味はどれ？", correct: "9", wrongs: ["5", "7", "19"], explanation: "nine は9です。eight の次、ten の前の数です。" },
    { prompt: "fifteen の意味はどれ？", correct: "15", wrongs: ["5", "50", "13"], explanation: "fifteen は15です。14の次の数です。" },
    { prompt: "20を表す英語はどれ？", correct: "twenty", wrongs: ["twelve", "two", "ten"], explanation: "20は twenty です。10が2つ分で twenty です。" },
    { prompt: "13を表す英語はどれ？", correct: "thirteen", wrongs: ["thirty", "three", "thirteenth"], explanation: "13は thirteen です。thirty(30)と音が似ているので注意します。" },
    { prompt: "18を表す英語はどれ？", correct: "eighteen", wrongs: ["eighty", "eight", "eleven"], explanation: "18は eighteen です。8(eight)に teen がついた形です。" }
  ]);

  // F1b さらに数字を読む(drill, d2)
  fam({
    familyId: "en_number_read2",
    funMechanic: "drill",
    learningObjective: "16などteen付きの数を表す英語がわかる",
    commonMistake: "sixteenとsixtyを混同する",
    estimatedSeconds: 30,
    skillTags: ["数", "How many"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "16を表す英語はどれ？", correct: "sixteen", wrongs: ["sixty", "six", "sixteenth"], explanation: "16は sixteen です。6(six)に teen がついた形です。" }
  ]);

  // F2 場面で数を答える(drill, d2)
  fam({
    familyId: "en_number_answer",
    funMechanic: "drill",
    learningObjective: "How many? の質問に、正しい数で答えられる",
    commonMistake: "ものの名前で答えてしまい、数で答えていない",
    estimatedSeconds: 45,
    skillTags: ["数", "会話"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 }
  }, [
    { prompt: "How many apples? と聞かれて、りんごが7こあります。答えはどれ？", correct: "Seven.", wrongs: ["Seventeen.", "Three.", "Red."], explanation: "数を答える時は Seven. のように数で答えます。" },
    { prompt: "How many pencils? えんぴつが12本ならどれ？", correct: "Twelve.", wrongs: ["Two.", "Twenty.", "Yellow."], explanation: "12は twelve です。eleven の次の数です。" },
    { prompt: "A: How many books? B: ____. 本が3さつなら？", correct: "Three.", wrongs: ["This is a book.", "I'm fine.", "I like books."], explanation: "数を聞かれたら、One や Two のように数で答えます。" },
    { prompt: "How many balls? ボールが6こなら？", correct: "Six.", wrongs: ["Sixteen.", "Sixty.", "Blue."], explanation: "6は six です。数を答えるときは数字だけで答えます。", soccer: true },
    { prompt: "How many cats? ねこが4ひきなら？", correct: "Four.", wrongs: ["Fourteen.", "Forty.", "White."], explanation: "4は four です。数を答えるときは数字だけで答えます。" }
  ]);

  // F3 数の並びを見つける(rule_discovery, d3)
  fam({
    familyId: "en_number_pattern",
    funMechanic: "rule_discovery",
    learningObjective: "英語の数のならびのきまりに気づける",
    commonMistake: "teen(13〜19)がつく数を、十の位の数と混同する",
    estimatedSeconds: 60,
    skillTags: ["数", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "eleven, twelve, ____。次に来る数は？", correct: "thirteen", wrongs: ["three", "twenty", "ten"], explanation: "11, 12, 13 は eleven, twelve, thirteen です。" },
    { prompt: "five と fifteen のちがいとして正しいものはどれ？", correct: "fiveは5、fifteenは15", wrongs: ["どちらも5", "fiveは15、fifteenは50", "どちらも50"], explanation: "teen が付く数（13〜19）は、十の位がある数です。" },
    { prompt: "seven, eight, nine, ____。次に来る数は？", correct: "ten", wrongs: ["seventeen", "nineteen", "eleven"], explanation: "7, 8, 9 の次は10で、tenです。" },
    { prompt: "ten, twenty, ____。10ずつ大きくなるなら、次に来る数は？", correct: "thirty", wrongs: ["eleven", "twelve", "thirteen"], explanation: "10, 20の次は10ずつ大きい30(thirty)です。" }
  ]);

  // F4 質問の形を選ぶ(best_choice, d2)
  fam({
    familyId: "en_number_question",
    funMechanic: "best_choice",
    learningObjective: "数をたずねる表現とその他の質問表現を区別できる",
    commonMistake: "たずねる内容(数・気分・名前など)を混同する",
    estimatedSeconds: 45,
    skillTags: ["数", "会話"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "数をたずねる英語はどれ？", correct: "How many?", wrongs: ["How are you?", "What's this?", "I like blue."], explanation: "数をたずねる時は How many? を使います。" },
    { prompt: "How many? の答えとして合わないものはどれ？", correct: "I'm happy.", wrongs: ["One.", "Eight.", "Ten."], explanation: "How many? は数を聞いています。" },
    { prompt: "How many pens do you have? への答えとして自然なものはどれ？", correct: "I have five pens.", wrongs: ["I like pens.", "It's a pen.", "I'm a pen."], explanation: "数をたずねられたら、I have ... の形で数を答えられます。" }
  ]);

  // F5 数の推理パズル(inference, d3)
  fam({
    familyId: "en_number_infer",
    funMechanic: "inference",
    learningObjective: "ヒントから英語で表された数をしぼりこめる",
    commonMistake: "1つのヒントだけで数を決めてしまう",
    estimatedSeconds: 75,
    skillTags: ["数", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "ヒント1：ten より大きい。ヒント2：fourteen より小さい。ヒント3：twelve ではない。この数を英語で言うと？", correct: "thirteen", wrongs: ["eleven", "fifteen", "twelve"], explanation: "10より大きく14より小さく、12でない数は13(thirteen)です。" },
    { prompt: "ヒント1：seven の2ばい。この数を英語で言うと？", correct: "fourteen", wrongs: ["seventeen", "seven", "twelve"], explanation: "7の2ばいは14で、fourteenです。" },
    { prompt: "ヒント1：five より大きい。ヒント2：ten より小さい。ヒント3：sixではない。この数を英語で言うと？", correct: "seven", wrongs: ["six", "eight", "eleven"], explanation: "5より大きく10より小さく、6でない数は、7(seven)か8(eight)か9(nine)ですが、選択肢の中ではsevenです。" }
  ]);

  // F6 サッカーの数を数える(inference, d3)
  fam({
    familyId: "en_number_soccer",
    funMechanic: "inference",
    learningObjective: "サッカーの場面で使われる数を、英語で理解できる",
    commonMistake: "文全体を読まず、数字だけを拾って答える",
    estimatedSeconds: 60,
    skillTags: ["数", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: How many players are on a soccer team? B: Eleven. サッカー1チームの人数は？", correct: "11人", wrongs: ["10人", "12人", "9人"], explanation: "eleven は11です。サッカーは1チーム11人です。", soccer: true },
    { prompt: "A: How many goals did you score? B: Three! この人が決めたゴールの数は？", correct: "3点", wrongs: ["2点", "4点", "13点"], explanation: "Three. は3です。数を聞かれたら数字だけで答えます。", soccer: true }
  ]);

  // F7 数のなかまはずれ(rule_discovery, d3)
  fam({
    familyId: "en_number_odd",
    funMechanic: "rule_discovery",
    learningObjective: "数字とそれ以外の英単語をなかま分けできる",
    commonMistake: "似た音を持つ単語をすべて数字だと思いこむ",
    estimatedSeconds: 60,
    skillTags: ["数", "なかま分け"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "なかまはずれの言葉はどれ？（seven ・eight ・nine ・blue）", correct: "blue", wrongs: ["seven", "eight", "nine"], explanation: "seven/eight/nineは数字ですが、blueは色を表す言葉です。" },
    { prompt: "なかまはずれの言葉はどれ？（eleven ・twelve ・thirteen ・happy）", correct: "happy", wrongs: ["eleven", "twelve", "thirteen"], explanation: "eleven/twelve/thirteenは数字ですが、happyは気分を表す言葉です。" }
  ]);

  // F8 場面に合う数の質問(best_choice, d3)
  fam({
    familyId: "en_number_scene",
    funMechanic: "best_choice",
    learningObjective: "何を数えているかによって、正しい数え方の質問を選べる",
    commonMistake: "How many? と How much? などの区別を考えずに選ぶ",
    estimatedSeconds: 60,
    skillTags: ["数", "会話"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "友だちが持っているカードの数を知りたいとき、たずねる英語はどれ？", correct: "How many cards do you have?", wrongs: ["How are you?", "What's this?", "Who are you?"], explanation: "数をたずねるときは How many ... ? を使います。" },
    { prompt: "教室にある机の数を知りたいとき、たずねる英語はどれ？", correct: "How many desks are there?", wrongs: ["How are you?", "What's your name?", "I like desks."], explanation: "数をたずねるときは How many ... ? を使います。" },
    { prompt: "友だちが飼っている魚の数を知りたいとき、たずねる英語はどれ？", correct: "How many fish do you have?", wrongs: ["What do you like?", "Who are you?", "This is for you."], explanation: "数をたずねるときは How many ... ? を使います。" },
    { prompt: "サッカーの試合で入ったゴールの数を知りたいとき、たずねる英語はどれ？", correct: "How many goals?", wrongs: ["How are you?", "What's this?", "I like soccer."], explanation: "数をたずねるときは How many ... ? を使います。", soccer: true },
    { prompt: "本だなにある本の数を知りたいとき、たずねる英語はどれ？", correct: "How many books are there?", wrongs: ["What's your name?", "How are you?", "I like books."], explanation: "数をたずねるときは How many ... ? を使います。" }
  ]);

  if (questions.length !== 30) throw new Error(`how_many: expected 30, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- I like blue.(30)
function makeILikeBlue() {
  const { questions, fam } = makeFamilyBuilder("i_like_blue");

  // F1 色の単語(drill, d2)
  fam({
    familyId: "en_color_word",
    funMechanic: "drill",
    learningObjective: "色を表す英語の単語がわかる",
    commonMistake: "black と white、purple と pink などを取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["色"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "青が好きと言う英語はどれ？", correct: "I like blue.", wrongs: ["I like red.", "I am blue.", "This is blue."], explanation: "好きな色を言う時は I like ... を使います。" },
    { prompt: "赤が好きと言う英語はどれ？", correct: "I like red.", wrongs: ["I like blue.", "I like yellow.", "I'm red."], explanation: "赤は red です。トマトやいちごの色です。" },
    { prompt: "緑が好きならどれ？", correct: "I like green.", wrongs: ["I like black.", "I like white.", "I like pink."], explanation: "緑は green です。葉っぱや草の色です。" },
    { prompt: "白が好きと言う英語はどれ？", correct: "I like white.", wrongs: ["I like black.", "I like brown.", "I like orange."], explanation: "白は white です。反対に、黒は black です。" },
    { prompt: "オレンジ色が好きと言う英語はどれ？", correct: "I like orange.", wrongs: ["I like purple.", "I like brown.", "I like green."], explanation: "オレンジ色は orange です。みかんの色です。" }
  ]);

  // F1b さらに色の単語(drill, d2)
  fam({
    familyId: "en_color_word2",
    funMechanic: "drill",
    learningObjective: "ピンクなど、その他の色を表す英語がわかる",
    commonMistake: "pinkとpurpleを取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["色"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "ピンク色が好きと言う英語はどれ？", correct: "I like pink.", wrongs: ["I like purple.", "I like orange.", "I like brown."], explanation: "ピンク色は pink です。さくらの花のような色です。" }
  ]);

  // F2 色の意味を日本語で(drill, d2)
  fam({
    familyId: "en_color_meaning",
    funMechanic: "drill",
    learningObjective: "色の英単語を聞いて、日本語の色がわかる",
    commonMistake: "black/brownのようにつづりが似た単語を混同する",
    estimatedSeconds: 30,
    skillTags: ["色"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "I like yellow. の意味はどれ？", correct: "黄色が好きです。", wrongs: ["青が好きです。", "黄色です。", "黄色はいくつですか。"], explanation: "I like ... は ... が好きです、という意味です。" },
    { prompt: "I like black. の black は何色？", correct: "黒", wrongs: ["白", "茶色", "紫"], explanation: "black は黒です。反対に、白は white です。" },
    { prompt: "I like purple. に近い意味はどれ？", correct: "紫が好きです。", wrongs: ["紫はいりません。", "私は紫です。", "紫は何ですか。"], explanation: "purple は紫です。赤と青をまぜた色です。" },
    { prompt: "I like brown. の brown は何色？", correct: "茶色", wrongs: ["黒", "灰色", "紫"], explanation: "brown は茶色です。木や土のような色です。" },
    { prompt: "I like orange. の orange は何色？", correct: "オレンジ色", wrongs: ["黄色", "赤色", "茶色"], explanation: "orange はオレンジ色です。みかんの色です。" }
  ]);

  // F3 好きなものの言い方(best_choice, d3)
  fam({
    familyId: "en_like_form",
    funMechanic: "best_choice",
    learningObjective: "「〜が好きです」の正しい語順を選べる",
    commonMistake: "英語の語順(主語→動詞→目的語)を日本語の語順のまま考える",
    estimatedSeconds: 45,
    skillTags: ["好きなもの", "語順"],
    axes: { knowledge: 2, info: 1, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "好きなものを言う形として正しいものはどれ？", correct: "I like soccer.", wrongs: ["I soccer like.", "Like I soccer.", "Soccer I."], explanation: "I like ... の順で言います。", soccer: true },
    { prompt: "「わたしはねこが好きです」の正しい英語はどれ？", correct: "I like cats.", wrongs: ["Cats I like.", "Like I cats.", "I cats like."], explanation: "I like ... の順で言います。" },
    { prompt: "「わたしは紫が好きです」の正しい英語はどれ？", correct: "I like purple.", wrongs: ["Purple I like.", "Like I purple.", "I purple like."], explanation: "I like ... の順で言います。" }
  ]);

  // F4 会話のやりとり(inference, d3)
  fam({
    familyId: "en_like_exchange",
    funMechanic: "inference",
    learningObjective: "好きなものについての会話から、内容を読み取れる",
    commonMistake: "Me, too. の意味を考えず、形だけで覚える",
    estimatedSeconds: 60,
    skillTags: ["好きなもの", "会話", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: I like blue. B: Me, too. Bの意味に近いものは？", correct: "私もです。", wrongs: ["私はちがいます。", "それは何ですか。", "いくつありますか。"], explanation: "Me, too. は私もです、という返事です。" },
    { prompt: "I like blue. の返事として自然なものはどれ？", correct: "Me, too.", wrongs: ["Good night.", "Seven.", "It's an onion."], explanation: "同じなら Me, too. と返せます。" },
    { prompt: "A: I like green. B: I don't like green. I like red. この会話からわかることはどれ？", correct: "AとBは好きな色がちがう", wrongs: ["AとBは好きな色が同じ", "Aは色がきらい", "Bは色を知らない"], explanation: "I don't like green.(緑は好きじゃない)と言っているので、色がちがいます。" }
  ]);

  // F5 2つのものをつなげる(rule_discovery, d3)
  fam({
    familyId: "en_like_and",
    funMechanic: "rule_discovery",
    learningObjective: "and を使って好きなものを2つつなげられる",
    commonMistake: "and を使わずに単語を並べてしまう",
    estimatedSeconds: 60,
    skillTags: ["好きなもの", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "好きなものを2つ言う文として自然なものはどれ？", correct: "I like dogs and cats.", wrongs: ["I like dogs many cats.", "Dogs cats I like.", "How dogs and cats?"], explanation: "and で「〜と〜」のように2つのものをつなげます。" },
    { prompt: "「赤と青が好きです」の正しい英語はどれ？", correct: "I like red and blue.", wrongs: ["I like red many blue.", "Red blue I like.", "I like red, blue how."], explanation: "赤(red)と青(blue)の2色を and でつなげます。" },
    { prompt: "「緑と黄色が好きです」の正しい英語はどれ？", correct: "I like green and yellow.", wrongs: ["I like green many yellow.", "Green yellow I like.", "I like green, yellow how."], explanation: "緑(green)と黄色(yellow)の2色を and でつなげます。" }
  ]);

  // F6 好き・きらいを聞き分ける(judge_claim, d3)
  fam({
    familyId: "en_like_judge",
    funMechanic: "judge_claim",
    learningObjective: "like と don't like の意味のちがいを判断できる",
    commonMistake: "don't like の否定の意味を読み落とす",
    estimatedSeconds: 60,
    skillTags: ["好きなもの"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「I like blue. は青が好きという意味」。みお「I don't like blue. も青が好きという意味」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "I don't like blue. は「青が好きではない」という意味です。" },
    { prompt: "はると「Me, too. はお別れのあいさつという意味」。みお「Me, too. は反対という意味」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "Me, too. は「わたしも」という意味で、相手と同じ気持ちを表します。反対の意味やお別れのあいさつではありません。" }
  ]);

  // F7 好きな色となかまはずれ(rule_discovery, d3)
  fam({
    familyId: "en_like_odd",
    funMechanic: "rule_discovery",
    learningObjective: "色の言葉とそれ以外の言葉をなかま分けできる",
    commonMistake: "色の言葉ではない単語も、なんとなく色だと思いこむ",
    estimatedSeconds: 60,
    skillTags: ["色", "なかま分け"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "なかまはずれの言葉はどれ？（red ・blue ・green ・happy）", correct: "happy", wrongs: ["red", "blue", "green"], explanation: "red/blue/greenは色を表す言葉ですが、happyは気分を表す言葉です。" },
    { prompt: "なかまはずれの言葉はどれ？（black ・white ・purple ・seven）", correct: "seven", wrongs: ["black", "white", "purple"], explanation: "black/white/purpleは色を表す言葉ですが、sevenは数字です。" }
  ]);

  // F8 チームカラーを考える(inference, d4)
  fam({
    familyId: "en_like_team_color",
    funMechanic: "inference",
    learningObjective: "サッカーチームの色についての会話から、内容を読み取れる",
    commonMistake: "会話の一部だけを読んで、全体の内容を考えない",
    estimatedSeconds: 75,
    skillTags: ["色", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: What color do you like for our team? B: I like blue. Let's be the Blue Team! Bが提案しているチームカラーは？", correct: "青", wrongs: ["赤", "緑", "黄色"], explanation: "I like blue.(青が好き)と言い、Blue Team(青チーム)を提案しています。", soccer: true },
    { prompt: "A: I like red. B: Me, too! Let's wear red shirts. 二人が着ることにしたシャツの色は？", correct: "赤", wrongs: ["青", "白", "黒"], explanation: "I like red.とMe, too!から、二人とも赤が好きで、赤いシャツを着ることにしました。", soccer: true }
  ]);

  // F9 色をたずねる会話(best_choice, d3)
  fam({
    familyId: "en_like_ask_color",
    funMechanic: "best_choice",
    learningObjective: "相手の好きな色をたずねる表現を選べる",
    commonMistake: "たずねる文と答える文を混同する",
    estimatedSeconds: 60,
    skillTags: ["色", "会話"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "相手に好きな色をたずねる英語として合うものはどれ？", correct: "What color do you like?", wrongs: ["I like blue.", "How many?", "Who are you?"], explanation: "好きな色をたずねるときは What color do you like? を使います。" },
    { prompt: "A: What color do you like? B: ____ 「わたしは黄色が好きです」と答えるなら？", correct: "I like yellow.", wrongs: ["Yellow do you like?", "You like yellow.", "It's yellow color."], explanation: "好きな色は I like ... で答えます。" },
    { prompt: "A: What color do you like? B: ____ 「わたしは緑が好きです」と答えるなら？", correct: "I like green.", wrongs: ["Green do you like?", "You like green.", "It's green color."], explanation: "好きな色は I like ... で答えます。" },
    { prompt: "A: What color do you like? B: ____ 「わたしはピンクが好きです」と答えるなら？", correct: "I like pink.", wrongs: ["Pink do you like?", "You like pink.", "It's pink color."], explanation: "好きな色は I like ... で答えます。" }
  ]);

  if (questions.length !== 30) throw new Error(`i_like_blue: expected 30, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- What do you like?(30)
function makeWhatDoYouLike() {
  const { questions, fam } = makeFamilyBuilder("what_do_you_like");

  // F1 好きなものを答える(drill, d2)
  fam({
    familyId: "en_wdyl_answer",
    funMechanic: "drill",
    learningObjective: "好きなものをたずねられたとき、正しい形で答えられる",
    commonMistake: "It's ... と I like ... を混同する",
    estimatedSeconds: 30,
    skillTags: ["好きなもの", "質問"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "What do you like? と聞かれて、ピザが好きならどれ？", correct: "I like pizza.", wrongs: ["It's pizza.", "I'm pizza.", "How many pizza?"], explanation: "好きなものは I like ... で答えます。" },
    { prompt: "サッカーが好きと答える英語はどれ？", correct: "I like soccer.", wrongs: ["I like blue.", "I am soccer.", "This is soccer."], explanation: "スポーツも I like ... で言えます。", soccer: true },
    { prompt: "犬が好きならどれ？", correct: "I like dogs.", wrongs: ["I like cats.", "I am a dog.", "What's dogs?"], explanation: "犬が好きなら I like dogs. が自然です。" },
    { prompt: "すしが好きならどれ？", correct: "I like sushi.", wrongs: ["I'm sushi.", "It's sushi.", "How many sushi?"], explanation: "好きな食べ物も I like ... で言います。" },
    { prompt: "野球が好きならどれ？", correct: "I like baseball.", wrongs: ["I'm baseball.", "It's baseball.", "How many baseball?"], explanation: "好きなスポーツも I like ... で言います。" }
  ]);

  // F2 質問文を選ぶ(drill, d2)
  fam({
    familyId: "en_wdyl_question",
    funMechanic: "drill",
    learningObjective: "好きなものをたずねる質問文がわかる",
    commonMistake: "What do you like? と How are you? を取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["好きなもの", "質問"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "相手に好きなものをたずねる英語はどれ？", correct: "What do you like?", wrongs: ["How are you?", "Who are you?", "This is for you."], explanation: "What do you like? は、好きなものをたずねる時の表現です。" },
    { prompt: "What do you like? の意味はどれ？", correct: "何が好きですか。", wrongs: ["何個ありますか。", "これは何ですか。", "元気ですか。"], explanation: "What do you like? は、好きなものをたずねる表現です。" },
    { prompt: "友だちに好きなスポーツをたずねる英語として自然なものはどれ？", correct: "What sport do you like?", wrongs: ["How many sport?", "I like sport.", "This is a sport."], explanation: "「何のスポーツが好き？」は What sport do you like? です。", soccer: true },
    { prompt: "What do you like? の答え方として自然なものはどれ？", correct: "I like ... の形で答える", wrongs: ["It's ... の形で答える", "How many ... の形で答える", "Who ... の形で答える"], explanation: "好きなものをたずねられたら I like ... の形で答えます。" }
  ]);

  // F3 会話の内容を読み取る(inference, d3)
  fam({
    familyId: "en_wdyl_infer",
    funMechanic: "inference",
    learningObjective: "会話から、相手が好きなものを読み取れる",
    commonMistake: "答えの英単語の意味を確かめずに選んでしまう",
    estimatedSeconds: 60,
    skillTags: ["好きなもの", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: What do you like? B: I like cats. Bが好きなものは？", correct: "ねこ", wrongs: ["犬", "色", "数"], explanation: "cats はねこです。1ぴきなら cat、たくさんなら cats です。" },
    { prompt: "I like apples. に合う日本語はどれ？", correct: "りんごが好きです。", wrongs: ["りんごはいくつですか。", "これはりんごです。", "りんごをあげます。"], explanation: "I like apples. はりんごが好きです。" },
    { prompt: "A: I like pizza. B: I like pizza, too. Bはどういう意味？", correct: "Bもピザが好き", wrongs: ["Bはピザがきらい", "Bは眠い", "Bは数を聞いている"], explanation: "too は「も」という意味で使えます。" },
    { prompt: "A: What do you like? B: I like soccer. I play it every day. Bが毎日していることは？", correct: "サッカー", wrongs: ["野球", "すいえい", "読書"], explanation: "I play it every day.(毎日それをする)のitはsoccerをさします。", soccer: true },
    { prompt: "A: What do you like? B: I like dogs. I have two dogs at home. Bが家で飼っている数は？", correct: "2ひき", wrongs: ["1ぴき", "3びき", "10ぴき"], explanation: "I have two dogs.(2ひき飼っている)と言っています。" }
  ]);

  // F4 まちがい直し(find_mistake, d3)
  fam({
    familyId: "en_wdyl_fix",
    funMechanic: "find_mistake",
    learningObjective: "会話の受け答えとしておかしい返事に気づける",
    commonMistake: "文が英語として正しければ、会話としても自然だと思ってしまう",
    estimatedSeconds: 60,
    skillTags: ["好きなもの", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "What do you like? の答えとして合わないものはどれ？", correct: "I'm sleepy.", wrongs: ["I like sushi.", "I like baseball.", "I like cats."], explanation: "I'm sleepy. は気分の答えです。" },
    { prompt: "A: What do you like? B: You're welcome. この返事はおかしいです。正しい返事はどれ？", correct: "I like tennis.", wrongs: ["You're welcome.で正しい", "How many?", "Good night."], explanation: "好きなものを聞かれたら I like ... で答えます。You're welcome. はお礼への返事です。" },
    { prompt: "A: What do you like? B: Seven. この返事はおかしいです。正しい返事はどれ？", correct: "I like apples.", wrongs: ["Seven.で正しい", "Good morning.", "I'm a cat."], explanation: "好きなものを聞かれたら I like ... で答えます。Seven. は数の答えです。" }
  ]);

  // F5 好きなものを2つ言う(best_choice, d3)
  fam({
    familyId: "en_wdyl_two",
    funMechanic: "best_choice",
    learningObjective: "好きなものを複数言う表現を選べる",
    commonMistake: "1つのものにしか使えない表現を、複数のものに使ってしまう",
    estimatedSeconds: 60,
    skillTags: ["好きなもの", "語順"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "「わたしは犬とねこが好きです」の正しい英語はどれ？", correct: "I like dogs and cats.", wrongs: ["I like dogs many cats.", "Dogs cats I like.", "How dogs and cats?"], explanation: "2つのものは and でつなげます。" },
    { prompt: "「わたしは野球とサッカーが好きです」の正しい英語はどれ？", correct: "I like baseball and soccer.", wrongs: ["I like baseball soccer.", "Baseball and soccer I like.", "I baseball like and soccer."], explanation: "2つのスポーツを and でつなげます。", soccer: true },
    { prompt: "「わたしはすしとピザが好きです」の正しい英語はどれ？", correct: "I like sushi and pizza.", wrongs: ["I like sushi many pizza.", "Sushi and pizza I like.", "I sushi like and pizza."], explanation: "2つの食べ物を and でつなげます。" }
  ]);

  // F6 好きな理由をたずねる(inference, d4)
  fam({
    familyId: "en_wdyl_reason",
    funMechanic: "inference",
    learningObjective: "好きな理由を説明する短い会話を理解できる",
    commonMistake: "理由の部分(because)を読み飛ばしてしまう",
    estimatedSeconds: 75,
    skillTags: ["好きなもの", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: What do you like? B: I like soccer because it's fun. Bがサッカーを好きな理由は？", correct: "楽しいから", wrongs: ["かんたんだから", "つまらないから", "ねむいから"], explanation: "because it's fun(楽しいから)が理由です。", soccer: true },
    { prompt: "A: What do you like? B: I like dogs because they are cute. Bが犬を好きな理由は？", correct: "かわいいから", wrongs: ["大きいから", "こわいから", "うるさいから"], explanation: "because they are cute(かわいいから)が理由です。" }
  ]);

  // F7 好きなものをさがす推理(inference, d4)
  fam({
    familyId: "en_wdyl_search",
    funMechanic: "inference",
    learningObjective: "複数のヒントから、好きなものをしぼりこめる",
    commonMistake: "1つのヒントだけで答えを決めてしまう",
    estimatedSeconds: 90,
    skillTags: ["好きなもの", "推理"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 2 }
  }, [
    { prompt: "ヒント1：スポーツです。ヒント2：ボールを足でけります。ヒント3：11人でチームを作ります。これは何？", correct: "soccer", wrongs: ["baseball", "tennis", "basketball"], explanation: "足でけるボールのスポーツで、11人チームなのはサッカーです。", soccer: true },
    { prompt: "ヒント1：食べ物です。ヒント2：丸くて、いろいろな具がのっています。ヒント3：イタリアから来ました。これは何？", correct: "pizza", wrongs: ["sushi", "curry", "salad"], explanation: "丸くて具がのっている、イタリア発祥の食べ物はピザです。" }
  ]);

  // F8 場面に合う質問を作る(best_choice, d3)
  fam({
    familyId: "en_wdyl_question_scene",
    funMechanic: "best_choice",
    learningObjective: "何について好きかをたずねる、いろいろな質問を選べる",
    commonMistake: "What do you like? とWhat + 名詞 + do you like?のちがいを区別しない",
    estimatedSeconds: 60,
    skillTags: ["好きなもの", "質問"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "友だちに好きな食べ物をたずねる英語として合うものはどれ？", correct: "What food do you like?", wrongs: ["How many food?", "I like food.", "This is food."], explanation: "「何の食べ物が好き？」は What food do you like? です。" },
    { prompt: "友だちに好きな動物をたずねる英語として合うものはどれ？", correct: "What animal do you like?", wrongs: ["How many animal?", "I like animal.", "This is animal."], explanation: "「何の動物が好き？」は What animal do you like? です。" },
    { prompt: "友だちに好きな色をたずねる英語として合うものはどれ？", correct: "What color do you like?", wrongs: ["How many color?", "I like color.", "This is color."], explanation: "「何色が好き？」は What color do you like? です。" }
  ]);

  // F9 好きなものの一致を確認(judge_claim, d3)
  fam({
    familyId: "en_wdyl_judge",
    funMechanic: "judge_claim",
    learningObjective: "会話に出てきた好きなものの一致・不一致を判断できる",
    commonMistake: "会話をよく読まずに、なんとなく同じだと判断する",
    estimatedSeconds: 60,
    skillTags: ["好きなもの"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "A: I like cats. B: I like cats, too. はると「AとBは同じものが好き」。みお「AとBはちがうものが好き」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "I like cats, too.は「わたしもねこが好き」という意味なので、同じものが好きです。" },
    { prompt: "A: I like soccer. B: I don't like soccer. I like tennis. はると「AとBは同じスポーツが好き」。みお「AとBはちがうスポーツが好き」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "I don't like soccer.(サッカーは好きじゃない)なので、ちがうスポーツが好きです。", soccer: true },
    { prompt: "A: I like blue. B: I like blue, too. はると「AとBはどちらも色の話をしていない」。みお「AとBはちがう色が好き」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "I like blue, too.(わたしも青が好き)なので、AとBは同じ色(青)が好きです。" }
  ]);

  if (questions.length !== 30) throw new Error(`what_do_you_like: expected 30, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- ALPHABET(30)
function makeAlphabet() {
  const { questions, fam } = makeFamilyBuilder("alphabet");

  // F1 大文字→小文字(drill, d2)
  fam({
    familyId: "en_alpha_case",
    funMechanic: "drill",
    learningObjective: "アルファベットの大文字と小文字を対応させられる",
    commonMistake: "形の似た小文字(b/d/p/q)を取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["アルファベット", "文字"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "大文字 A の小文字はどれ？", correct: "a", wrongs: ["b", "d", "e"], explanation: "A の小文字は a です。大文字と小文字をセットでおぼえましょう。" },
    { prompt: "大文字 B の小文字はどれ？", correct: "b", wrongs: ["d", "p", "q"], explanation: "B の小文字は b です。形が少しにているので気をつけます。" },
    { prompt: "大文字 G の小文字はどれ？", correct: "g", wrongs: ["q", "p", "j"], explanation: "G の小文字は g です。形がちがうので気をつけます。" },
    { prompt: "大文字と小文字の組み合わせが正しいものはどれ？", correct: "G - g", wrongs: ["G - q", "G - p", "G - j"], explanation: "G の小文字は g です。大文字と小文字で形がちがいます。" },
    { prompt: "大文字 R の小文字はどれ？", correct: "r", wrongs: ["n", "v", "k"], explanation: "R の小文字は r です。形が少しにています。" }
  ]);

  // F2 まぎらわしい文字(find_mistake, d3)
  fam({
    familyId: "en_alpha_confusable",
    funMechanic: "find_mistake",
    learningObjective: "形の似たアルファベットを見分けられる",
    commonMistake: "鏡文字のようなb/dやp/qを、向きを気にせず読む",
    estimatedSeconds: 45,
    skillTags: ["アルファベット", "文字", "たしかめ"],
    axes: { knowledge: 2, info: 1, steps: 1, format: 2, choices: 2 }
  }, [
    { prompt: "小文字 p と形がまぎらわしい文字はどれ？", correct: "q", wrongs: ["a", "m", "t"], explanation: "p と q は向きが似ているので注意します。" },
    { prompt: "小文字 b と形がまぎらわしい文字はどれ？", correct: "d", wrongs: ["c", "e", "f"], explanation: "b と d は向きが似ているので注意します。" },
    { prompt: "大文字 M と形がまぎらわしい文字はどれ？", correct: "W", wrongs: ["N", "V", "K"], explanation: "M と W は上下を逆にすると似た形になるので注意します。" },
    { prompt: "小文字 n と形がまぎらわしい文字はどれ？", correct: "m", wrongs: ["h", "r", "u"], explanation: "n と m は形が似ているので注意します(mはnの山が1つ多い形)。" }
  ]);

  // F3 単語の最初の文字(drill, d2)
  fam({
    familyId: "en_alpha_initial",
    funMechanic: "drill",
    learningObjective: "単語の最初の音から、対応する文字を選べる",
    commonMistake: "文字の名前(ビー)と音(ブ)を混同する",
    estimatedSeconds: 30,
    skillTags: ["アルファベット", "文字"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "cat の最初の文字はどれ？", correct: "c", wrongs: ["k", "s", "t"], explanation: "cat は c で始まります。最初の音から文字を考えます。" },
    { prompt: "dog の最初の文字はどれ？", correct: "d", wrongs: ["b", "g", "p"], explanation: "dog は d で始まります。最初の音から文字を考えます。" },
    { prompt: "apple の最初の音に合う文字はどれ？", correct: "A", wrongs: ["B", "C", "D"], explanation: "apple は A/a で始まります。" },
    { prompt: "book の最初の音に合う文字はどれ？", correct: "B", wrongs: ["D", "P", "Q"], explanation: "book は B/b で始まります。" },
    { prompt: "soccer の最初の文字はどれ？", correct: "s", wrongs: ["c", "z", "x"], explanation: "soccer は s で始まります。", soccer: true }
  ]);

  // F3b さらに最初の文字(drill, d2)
  fam({
    familyId: "en_alpha_initial2",
    funMechanic: "drill",
    learningObjective: "単語の最初の音から、対応する文字を選べる",
    commonMistake: "母音の文字(a,e,i,o,u)を取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["アルファベット", "文字"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "egg の最初の文字はどれ？", correct: "e", wrongs: ["a", "i", "o"], explanation: "egg は e で始まります。母音の文字の1つです。" }
  ]);

  // F4 アルファベットの順番(rule_discovery, d3)
  fam({
    familyId: "en_alpha_order",
    funMechanic: "rule_discovery",
    learningObjective: "アルファベット26文字の順番のきまりに気づける",
    commonMistake: "似た形の文字の順番を覚え間違える",
    estimatedSeconds: 60,
    skillTags: ["アルファベット", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "A, B, C, ____。次に来る文字は？", correct: "D", wrongs: ["E", "G", "P"], explanation: "A, B, C の次は D です。アルファベットは26文字あります。" },
    { prompt: "M の次の文字はどれ？", correct: "N", wrongs: ["L", "O", "W"], explanation: "M の次は N です。アルファベットの順をおぼえましょう。" },
    { prompt: "X, Y, ____。次に来る文字は？アルファベットの最後の文字です。", correct: "Z", wrongs: ["A", "W", "V"], explanation: "アルファベットは A から Z までの26文字で、Z が最後です。" },
    { prompt: "アルファベットの最初の文字はどれ？", correct: "A", wrongs: ["Z", "M", "N"], explanation: "アルファベットは A から始まり Z で終わります。" }
  ]);

  // F5 単語の中の文字を推理(inference, d4)
  fam({
    familyId: "en_alpha_infer",
    funMechanic: "inference",
    learningObjective: "アルファベットの位置関係から、文字を推理できる",
    commonMistake: "アルファベットの並びを見ずに、勘で答える",
    estimatedSeconds: 90,
    skillTags: ["アルファベット", "推理"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 2 }
  }, [
    { prompt: "ヒント1：Aから数えて5番目の文字です。ヒント2：appleの最初の文字ではありません。この文字はどれ？", correct: "E", wrongs: ["A", "D", "F"], explanation: "A,B,C,D,Eで5番目はEです。appleの最初はAなので、Eが答えです。" },
    { prompt: "M と O の間にある文字はどれ？", correct: "N", wrongs: ["L", "P", "K"], explanation: "M, N, O の順なので、間の文字はNです。" },
    { prompt: "ヒント1：Cの次の文字です。ヒント2：dogの最初の文字と同じです。この文字はどれ？", correct: "D", wrongs: ["B", "E", "F"], explanation: "Cの次はDで、dogもDで始まります。" }
  ]);

  // F6 単語の中の文字さがし(find_mistake, d3)
  fam({
    familyId: "en_alpha_find",
    funMechanic: "find_mistake",
    learningObjective: "単語のスペルの中の文字のまちがいに気づける",
    commonMistake: "似た形の文字を見分けずに読み飛ばす",
    estimatedSeconds: 60,
    skillTags: ["アルファベット", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは cat を「dat」と書きました。正しいつづりはどれ？", correct: "cat", wrongs: ["datで正しい", "kat", "cad"], explanation: "cat の最初の文字は c です。d と間違えないように気をつけます。" },
    { prompt: "みおさんは dog を「bog」と書きました。正しいつづりはどれ？", correct: "dog", wrongs: ["bogで正しい", "dob", "dop"], explanation: "dog の最初の文字は d です。b と間違えないように気をつけます。" }
  ]);

  // F7 大文字を使う場面(rule_discovery, d3)
  fam({
    familyId: "en_alpha_capital",
    funMechanic: "rule_discovery",
    learningObjective: "文の最初や名前の最初に大文字を使うきまりに気づける",
    commonMistake: "文のどこにでも大文字を使ってよいと思いこむ",
    estimatedSeconds: 60,
    skillTags: ["アルファベット", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "大文字を使う場面として正しいものはどれ？", correct: "文の最初の文字", wrongs: ["文の真ん中の文字", "文の最後の文字", "どこでもよい"], explanation: "英語の文は、最初の文字を大文字で書きます。" },
    { prompt: "「I'm Yuta.」の I が大文字なのはなぜ？", correct: "「わたしは」を表す I はいつも大文字で書くから", wrongs: ["文の最後だから", "短い単語だから", "特に理由はない"], explanation: "「わたしは」を表す I は、文の中のどこにあってもいつも大文字で書きます。" },
    { prompt: "人の名前(Yuta, Minaなど)の最初の文字はどう書く？", correct: "大文字で書く", wrongs: ["小文字で書く", "書かない", "数字で書く"], explanation: "人の名前の最初の文字は、いつも大文字で書きます。" }
  ]);

  // F8 アルファベットの数え方(inference, d3)
  fam({
    familyId: "en_alpha_count",
    funMechanic: "inference",
    learningObjective: "アルファベットの並びの位置関係から、文字の数を数えられる",
    commonMistake: "文字を数えるときに、1つずれて数えてしまう",
    estimatedSeconds: 75,
    skillTags: ["アルファベット", "推理"],
    axes: { knowledge: 2, info: 2, steps: 3, format: 3, choices: 2 }
  }, [
    { prompt: "A から数えて3番目の文字はどれ？", correct: "C", wrongs: ["B", "D", "E"], explanation: "A(1番目), B(2番目), C(3番目)です。" },
    { prompt: "A から E までは、ぜんぶで何文字ある？", correct: "5文字", wrongs: ["4文字", "6文字", "3文字"], explanation: "A, B, C, D, Eの5文字です。" },
    { prompt: "Z から数えて2つ前の文字はどれ？", correct: "X", wrongs: ["Y", "W", "V"], explanation: "Zの1つ前はY、2つ前はXです。うしろから数えます。" }
  ]);

  if (questions.length !== 30) throw new Error(`alphabet: expected 30, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- This is for you.(30)
function makeThisIsForYou() {
  const { questions, fam } = makeFamilyBuilder("this_is_for_you");

  // F1 わたす・もらう表現(drill, d2)
  fam({
    familyId: "en_gift_phrase",
    funMechanic: "drill",
    learningObjective: "ものを渡すとき・お礼を言うときの表現がわかる",
    commonMistake: "This is for you. と Thank you. を取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["贈り物", "お礼"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "カードをわたす時に合う英語はどれ？", correct: "This is for you.", wrongs: ["How many?", "I'm sleepy.", "What's this?"], explanation: "相手にものを渡す時に This is for you. と言えます。" },
    { prompt: "プレゼントをもらった時の返事はどれ？", correct: "Thank you.", wrongs: ["How many?", "I'm sad.", "It's a dog."], explanation: "もらったら Thank you. と言えます。" },
    { prompt: "Thank you. と言われた時の返事はどれ？", correct: "You're welcome.", wrongs: ["I'm hungry.", "What do you like?", "Twelve."], explanation: "Thank you.（ありがとう）への返事です。" },
    { prompt: "A: This is for you. B: ____", correct: "Thank you.", wrongs: ["Good night.", "How many?", "I'm a cat."], explanation: "ものをもらったら Thank you. が自然です。" },
    { prompt: "花をわたす時に合う英語はどれ？", correct: "This is for you.", wrongs: ["How are you?", "What's this?", "Who are you?"], explanation: "花などをわたす時にも This is for you. が使えます。" }
  ]);

  // F2 意味の読み取り(drill, d2)
  fam({
    familyId: "en_gift_meaning",
    funMechanic: "drill",
    learningObjective: "This is for you. の意味を正しく理解できる",
    commonMistake: "forの意味(〜のために/へ)を考えずに訳す",
    estimatedSeconds: 30,
    skillTags: ["贈り物"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "This is for you. の意味はどれ？", correct: "これはあなたへのものです。", wrongs: ["これは何ですか。", "私は元気です。", "何が好きですか。"], explanation: "for you は「あなたへ」という意味です。" },
    { prompt: "for you の意味に近いものはどれ？", correct: "あなたへ", wrongs: ["私から私へ", "いくつ", "これは何"], explanation: "for you はあなたへ、という意味です。" },
    { prompt: "This is for Mom. の意味はどれ？", correct: "これはお母さんへのものです。", wrongs: ["これはお母さんです。", "お母さんは元気です。", "お母さんはいくつですか。"], explanation: "for Mom は「お母さんへ」という意味です。" },
    { prompt: "This is for my friend. の意味はどれ？", correct: "これは友だちへのものです。", wrongs: ["これは友だちです。", "友だちが好きです。", "友だちはいくつですか。"], explanation: "for my friend は「わたしの友だちへ」という意味です。" }
  ]);

  // F3 場面を選ぶ(best_choice, d3)
  fam({
    familyId: "en_gift_scene",
    funMechanic: "best_choice",
    learningObjective: "This is for you. を使う場面を判断できる",
    commonMistake: "似た響きの別表現(Who are you?など)の場面と混同する",
    estimatedSeconds: 45,
    skillTags: ["贈り物", "会話"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "相手にカードを作ったことを伝える場面で合うものはどれ？", correct: "This is for you.", wrongs: ["Who are you?", "How are you?", "I like blue."], explanation: "This is for you. は、相手にものを渡す時の表現です。" },
    { prompt: "This is for you. と言う場面として合うものはどれ？", correct: "友だちにカードをわたす", wrongs: ["数を数える", "眠いと答える", "名前を聞く"], explanation: "カードやプレゼントを渡す時に使えます。" },
    { prompt: "誕生日にプレゼントをわたす場面で合う表現はどれ？", correct: "This is for you. Happy birthday!", wrongs: ["How many?", "Who are you?", "See you."], explanation: "プレゼントをわたす時に This is for you. が使えます。" }
  ]);

  // F4 会話の流れを読み取る(inference, d3)
  fam({
    familyId: "en_gift_flow",
    funMechanic: "inference",
    learningObjective: "会話全体の流れ(渡す→お礼→返事)を理解できる",
    commonMistake: "1文だけを見て、会話全体のつながりを見ない",
    estimatedSeconds: 60,
    skillTags: ["贈り物", "会話", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: Thank you. B: You're welcome. この会話の流れは？", correct: "お礼と返事", wrongs: ["数の質問", "好きな色", "動物の名前"], explanation: "Thank you. と You're welcome. はお礼の会話です。" },
    { prompt: "A: This is for you. B: Thank you! この会話の場面として合うものはどれ？", correct: "プレゼントをわたして、お礼を言われている", wrongs: ["名前をたずねられている", "数をかぞえている", "別れのあいさつをしている"], explanation: "ものを渡され、お礼を言っている場面です。" },
    { prompt: "A: This is for you. I made it. B: Wow, thank you! Aがしたことは？", correct: "ものを作ってわたした", wrongs: ["何かを買った", "何も言わなかった", "あやまった"], explanation: "I made it.(わたしが作った)と言い、それをわたしています。" }
  ]);

  // F5 短い表現を選ぶ(best_choice, d3)
  fam({
    familyId: "en_gift_short",
    funMechanic: "best_choice",
    learningObjective: "カードなどに書く短い英語表現を選べる",
    commonMistake: "文法的に不自然な語順を選んでしまう",
    estimatedSeconds: 45,
    skillTags: ["贈り物", "語順"],
    axes: { knowledge: 2, info: 1, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "カードに書く短い英語として自然なものはどれ？", correct: "For you.", wrongs: ["How many you.", "Sleepy you.", "Many this."], explanation: "カードでは For you. と短く書くことがあります。" },
    { prompt: "誕生日カードに書く短い英語として自然なものはどれ？", correct: "Happy birthday!", wrongs: ["How many birthday?", "Birthday you.", "Sleepy birthday."], explanation: "誕生日カードには Happy birthday! と書くことが多いです。" }
  ]);

  // F6 お礼の言い分(judge_claim, d3)
  fam({
    familyId: "en_gift_judge",
    funMechanic: "judge_claim",
    learningObjective: "ものをわたす・お礼を言う表現の使い方についての主張を判断できる",
    commonMistake: "Thank you. と You're welcome. の役割を逆にする",
    estimatedSeconds: 60,
    skillTags: ["贈り物", "お礼"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「Thank you. はものをもらった人が言う」。みお「You're welcome. はものをわたした人が言う」。正しいのはどっち？", correct: "二人とも正しい", explanation: "もらった人がThank you.、わたした人がYou're welcome.と言います。" },
    { prompt: "はると「This is for you. はものをわたす人が言う」。みお「This is for you. はものをもらう人が言う」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "This is for you. はものをわたす人が言う表現です。" },
    { prompt: "はると「Thank you. と You're welcome. は同じ人が言う」。みお「Thank you. と You're welcome. はちがう人が言う」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "Thank you.はお礼を言う人、You're welcome.はそれに答える別の人が言います。" }
  ]);

  // F7 プレゼントのなかまはずれ(rule_discovery, d3)
  fam({
    familyId: "en_gift_odd",
    funMechanic: "rule_discovery",
    learningObjective: "贈り物・お礼に関する表現とそれ以外を区別できる",
    commonMistake: "似た場面の表現をすべて同じなかまだと思いこむ",
    estimatedSeconds: 60,
    skillTags: ["贈り物", "なかま分け"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "なかまはずれの言葉はどれ？（This is for you. ・Thank you. ・You're welcome. ・How many?）", correct: "How many?", wrongs: ["This is for you.", "Thank you.", "You're welcome."], explanation: "This is for you./Thank you./You're welcome. は贈り物のやりとりの言葉ですが、How many? は数をたずねる言葉です。" },
    { prompt: "なかまはずれの言葉はどれ？（This is for you. ・You're welcome. ・I made it. ・What's your name?）", correct: "What's your name?", wrongs: ["This is for you.", "You're welcome.", "I made it."], explanation: "This is for you./You're welcome./I made it. は贈り物の場面の言葉ですが、What's your name? は名前をたずねる言葉です。" }
  ]);

  // F8 だれのためのプレゼント？(inference, d4)
  fam({
    familyId: "en_gift_who_for",
    funMechanic: "inference",
    learningObjective: "だれに何をわたす場面かを、会話から読み取れる",
    commonMistake: "登場人物が複数いる会話で、だれが何を言ったか混同する",
    estimatedSeconds: 90,
    skillTags: ["贈り物", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: This is for you, Mom. Happy birthday! B: Thank you! Aが作ったものをわたした相手はだれ？", correct: "お母さん", wrongs: ["お父さん", "友だち", "先生"], explanation: "This is for you, Mom.(お母さんへ)なので、お母さんにわたしています。" },
    { prompt: "A: This is for you, Sora. I made a card. B: Wow, thank you, Yui! カードを作ったのはだれ？", correct: "Yui", wrongs: ["Sora", "先生", "お母さん"], explanation: "AがI made a card.(カードを作った)と言い、BがYui(A)にお礼を言っています。" }
  ]);

  // F9 わたす・もらうの立場(best_choice, d3)
  fam({
    familyId: "en_gift_role_choice",
    funMechanic: "best_choice",
    learningObjective: "わたす側ともらう側、それぞれの立場で使う表現を選べる",
    commonMistake: "わたす側の表現ともらう側の表現を逆に使う",
    estimatedSeconds: 60,
    skillTags: ["贈り物", "会話"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "あなたが友だちにプレゼントをわたすとき、言う英語はどれ？", correct: "This is for you.", wrongs: ["Thank you.", "You're welcome.", "How many?"], explanation: "わたす側は This is for you. と言います。" },
    { prompt: "あなたが友だちからプレゼントをもらったとき、言う英語はどれ？", correct: "Thank you.", wrongs: ["This is for you.", "You're welcome.", "Who are you?"], explanation: "もらった側は Thank you. と言います。" },
    { prompt: "あなたが友だちにThank you.と言われたとき、返す英語はどれ？", correct: "You're welcome.", wrongs: ["This is for you.", "Thank you.", "How are you?"], explanation: "お礼を言われたら You're welcome. と返します。" }
  ]);

  // F10 サッカーカードをわたす場面(inference, d4)
  fam({
    familyId: "en_gift_soccer_card",
    funMechanic: "inference",
    learningObjective: "サッカーカードを交かんする会話から内容を読み取れる",
    commonMistake: "「あげる」と「交かんする」を混同する",
    estimatedSeconds: 75,
    skillTags: ["贈り物", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: This is for you. It's my soccer card. B: Thank you! I love this player! Aがわたしたものは？", correct: "サッカーカード", wrongs: ["ボール", "ユニフォーム", "くつ"], explanation: "It's my soccer card.(これはわたしのサッカーカード)と言っています。", soccer: true },
    { prompt: "A: I have two soccer cards. This is for you! B: Wow, thank you so much! Aが持っていたカードの数は？", correct: "2まい", wrongs: ["1まい", "3まい", "10まい"], explanation: "I have two soccer cards.(サッカーカードを2まい持っている)と言っています。", soccer: true },
    { prompt: "A: This is for you. I drew a picture of a dog. B: Thank you! It's cute! Aがかいた絵の中身は？", correct: "犬", wrongs: ["ねこ", "鳥", "魚"], explanation: "a picture of a dog(犬の絵)をかいたと言っています。" }
  ]);

  if (questions.length !== 30) throw new Error(`this_is_for_you: expected 30, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- What's this?(25)
function makeWhatsThis() {
  const { questions, fam } = makeFamilyBuilder("whats_this");

  // F1 ものの名前を答える(drill, d2)
  fam({
    familyId: "en_thing_answer",
    funMechanic: "drill",
    learningObjective: "What's this? に、ものの名前で正しく答えられる",
    commonMistake: "It's a ... と I'm a ... を取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["身近なもの", "What's this"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "A: What's this? B: It's a pencil. これは何？", correct: "えんぴつ", wrongs: ["消しゴム", "犬", "りんご"], explanation: "pencil はえんぴつです。It's a pencil. のように答えます。" },
    { prompt: "物の名前を答える文として正しいものはどれ？", correct: "It's a book.", wrongs: ["I'm a book.", "How book?", "I like book?"], explanation: "物を説明する時は It's a ... を使えます。" },
    { prompt: "What's this? の答えとして合うものはどれ？", correct: "It's a cat.", wrongs: ["I'm fine.", "Seven.", "I like red."], explanation: "これは何かを聞かれているので It's a ... で答えます。" },
    { prompt: "A: What's this? B: It's a ball. これは何？", correct: "ボール", wrongs: ["本", "ペン", "いす"], explanation: "ball はボールです。It's a ball. のように答えます。", soccer: true }
  ]);

  // F2 a と an の使い分け(rule_discovery, d3)
  fam({
    familyId: "en_thing_article",
    funMechanic: "rule_discovery",
    learningObjective: "母音で始まる単語には an を使うきまりに気づける",
    commonMistake: "すべての単語に a をつけてしまう",
    estimatedSeconds: 60,
    skillTags: ["身近なもの", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "A: What's this? B: It's an onion. これは何？", correct: "玉ねぎ", wrongs: ["にんじん", "ねこ", "本"], explanation: "onion は玉ねぎです。母音で始まるので an onion と言います。" },
    { prompt: "apple の前につける言葉として自然なのはどれ？", correct: "an", wrongs: ["a", "the many", "am"], explanation: "母音で始まる apple には an を使います。" },
    { prompt: "book の前につける言葉として自然なのはどれ？", correct: "a", wrongs: ["an", "am", "are"], explanation: "子音で始まる book には a を使います。" },
    { prompt: "It's an egg. の意味はどれ？", correct: "それは卵です。", wrongs: ["それは犬です。", "私は卵が好きです。", "卵はいくつですか。"], explanation: "egg は卵です。母音で始まるので an egg と言います。" },
    { prompt: "umbrella の前につける言葉として自然なのはどれ？", correct: "an", wrongs: ["a", "am", "are"], explanation: "母音で始まる umbrella には an を使います。" }
  ]);

  // F2b さらにaとanの使い分け(rule_discovery, d3)
  fam({
    familyId: "en_thing_article2",
    funMechanic: "rule_discovery",
    learningObjective: "子音で始まる単語には a を使うきまりに気づける",
    commonMistake: "母音で始まる単語にもaをつけてしまう",
    estimatedSeconds: 60,
    skillTags: ["身近なもの", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "cat の前につける言葉として自然なのはどれ？", correct: "a", wrongs: ["an", "am", "are"], explanation: "子音で始まる cat には a を使います。" }
  ]);

  // F3 質問の種類を見分ける(best_choice, d3)
  fam({
    familyId: "en_thing_compare_q",
    funMechanic: "best_choice",
    learningObjective: "What's this? と他の質問表現のちがいを判断できる",
    commonMistake: "whatで始まる質問はすべて同じ内容だと思いこむ",
    estimatedSeconds: 60,
    skillTags: ["身近なもの", "質問"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "What's this? の意味はどれ？", correct: "これは何ですか。", wrongs: ["何が好きですか。", "何個ありますか。", "元気ですか。"], explanation: "What's this? は、物の名前をたずねる表現です。" },
    { prompt: "What's this? と What do you like? の違いはどれ？", correct: "前者は物の名前、後者は好きなものを聞く", wrongs: ["どちらも数を聞く", "どちらも気分を聞く", "どちらも別れのあいさつ"], explanation: "what の後の言葉で聞いていることが変わります。" },
    { prompt: "What's this? と Who are you? の違いはどれ？", correct: "前者は物の名前、後者は人やなりきる役を聞く", wrongs: ["どちらも同じ質問", "どちらも数を聞く", "どちらも色を聞く"], explanation: "What's this?は物、Who are you?は人や役をたずねます。" }
  ]);

  // F4 生きものの名前を答える(inference, d3)
  fam({
    familyId: "en_thing_infer",
    funMechanic: "inference",
    learningObjective: "ヒントから、What's this? の答えを推理できる",
    commonMistake: "ヒントを読まずに、思いついた単語を答える",
    estimatedSeconds: 60,
    skillTags: ["身近なもの", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: What's this? B: ____ 「それは海月です」と答えるなら？", correct: "It's a jellyfish.", wrongs: ["I'm jellyfish.", "I like jellyfish.", "How many jellyfish?"], explanation: "物の名前は It's a ... で答えます。" },
    { prompt: "ヒント：赤くて丸い果物です。木になります。What's this? の答えはどれ？", correct: "It's an apple.", wrongs: ["It's a banana.", "It's an onion.", "It's a book."], explanation: "赤くて丸い果物はりんごです。appleは母音で始まるのでanをつけます。" }
  ]);

  // F5 まちがい直し(find_mistake, d3)
  fam({
    familyId: "en_thing_fix",
    funMechanic: "find_mistake",
    learningObjective: "a/anの使い方や答え方のまちがいに気づける",
    commonMistake: "全部の単語にaをつけて、anが必要な場合を見落とす",
    estimatedSeconds: 60,
    skillTags: ["身近なもの", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「It's a orange.」と言いました。正しい言い方はどれ？", correct: "It's an orange.", wrongs: ["It's a orange.で正しい", "It's the orange.", "It's orange a."], explanation: "orangeは母音で始まるので、anを使います。" },
    { prompt: "みおさんは「It's an dog.」と言いました。正しい言い方はどれ？", correct: "It's a dog.", wrongs: ["It's an dog.で正しい", "It's the dog.", "It's dog a."], explanation: "dogは子音で始まるので、aを使います。" }
  ]);

  // F6 なぞなぞで当てる(inference, d4)
  fam({
    familyId: "en_thing_riddle",
    funMechanic: "inference",
    learningObjective: "複数のヒントから、What's this?の答えをしぼりこめる",
    commonMistake: "最後まで読まずに、途中のヒントだけで答える",
    estimatedSeconds: 90,
    skillTags: ["身近なもの", "推理"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 2 }
  }, [
    { prompt: "ヒント1：丸いです。ヒント2：けってあそびます。ヒント3：サッカーで使います。What's this?", correct: "It's a ball.", wrongs: ["It's a book.", "It's an egg.", "It's a pencil."], explanation: "丸くてけって遊ぶ、サッカーで使うものはボールです。", soccer: true },
    { prompt: "ヒント1：黄色いです。ヒント2：長い形です。ヒント3：さるが好きな食べ物です。What's this?", correct: "It's a banana.", wrongs: ["It's an apple.", "It's an egg.", "It's a lemon."], explanation: "黄色くて長い、さるが好きな食べ物はバナナです。" },
    { prompt: "ヒント1：小さいです。ヒント2：本を読むときに使います。ヒント3：字を書く道具です。What's this?", correct: "It's a pencil.", wrongs: ["It's a book.", "It's a ball.", "It's an eraser."], explanation: "字を書く道具はえんぴつです。pencilと言います。" }
  ]);

  // F7 いろいろな身近なもの(drill, d2)
  fam({
    familyId: "en_thing_more",
    funMechanic: "drill",
    learningObjective: "身近なものを表す英語の単語がわかる",
    commonMistake: "似た形のもの(book/desk)の単語を混同する",
    estimatedSeconds: 30,
    skillTags: ["身近なもの"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "A: What's this? B: It's an eraser. これは何？", correct: "消しゴム", wrongs: ["えんぴつ", "ノート", "つくえ"], explanation: "eraser は消しゴムです。母音で始まるのでan eraserと言います。" },
    { prompt: "A: What's this? B: It's a bag. これは何？", correct: "かばん", wrongs: ["いす", "つくえ", "まど"], explanation: "bag はかばんです。ものを入れて持ち運ぶ道具です。" },
    { prompt: "A: What's this? B: It's a desk. これは何？", correct: "つくえ", wrongs: ["いす", "かばん", "本"], explanation: "desk はつくえです。教室にある勉強机のことです。" },
    { prompt: "A: What's this? B: It's a chair. これは何？", correct: "いす", wrongs: ["つくえ", "かばん", "まど"], explanation: "chair はいすです。すわるための道具です。" },
    { prompt: "A: What's this? B: It's a window. これは何？", correct: "まど", wrongs: ["ドア", "かべ", "ゆか"], explanation: "window はまどです。部屋の明かりとりに使います。" }
  ]);

  if (questions.length !== 25) throw new Error(`whats_this: expected 25, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- Who are you?(25)
function makeWhoAreYou() {
  const { questions, fam } = makeFamilyBuilder("who_are_you");

  // F1 なりきり表現(drill, d2)
  fam({
    familyId: "en_who_role",
    funMechanic: "drill",
    learningObjective: "Who are you? に、なりきった役や動物で答えられる",
    commonMistake: "I'm a ... と It's a ... を取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["人物", "動物", "Who are you"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "犬になりきって答えるならどれ？", correct: "I'm a dog.", wrongs: ["It's a dog.", "I like dog.", "How many dogs?"], explanation: "自分が何かを言う時は I'm a ... です。" },
    { prompt: "Who are you? の答えとして合うものはどれ？", correct: "I'm a rabbit.", wrongs: ["It's an onion.", "Ten.", "I like blue."], explanation: "だれかを聞かれているので I'm a ... が合います。" },
    { prompt: "自分の役を言う文として自然なものはどれ？", correct: "I'm a teacher.", wrongs: ["It's a teacher.", "How teacher?", "Teacher many."], explanation: "自分が何者かを言う時は I'm a ... です。" },
    { prompt: "サッカー選手になりきって答えるならどれ？", correct: "I'm a soccer player.", wrongs: ["It's a soccer player.", "I like soccer player.", "How many soccer player?"], explanation: "自分が何かになりきる時は I'm a ... です。", soccer: true }
  ]);

  // F2 動物の名前を聞き取る(drill, d2)
  fam({
    familyId: "en_who_animal",
    funMechanic: "drill",
    learningObjective: "動物を表す英単語を聞いて、日本語がわかる",
    commonMistake: "似た響きの動物の名前(mouse/horse)を混同する",
    estimatedSeconds: 30,
    skillTags: ["動物"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "A: Who are you? B: I'm a cat. Bは何？", correct: "ねこ", wrongs: ["犬", "鳥", "魚"], explanation: "cat はねこです。I'm a cat. でねこになりきって言えます。" },
    { prompt: "I'm a bird. の意味はどれ？", correct: "私は鳥です。", wrongs: ["これは鳥です。", "鳥が好きです。", "鳥はいくつですか。"], explanation: "I'm a ... は私は...です、という意味です。" },
    { prompt: "I'm a mouse. の mouse はどれ？", correct: "ねずみ", wrongs: ["ねこ", "馬", "鳥"], explanation: "mouse はねずみです。小さな動物の名前です。" },
    { prompt: "A: Who are you? B: I'm a tiger. Bは何になりきっている？", correct: "トラ", wrongs: ["ねこ", "犬", "うさぎ"], explanation: "tiger はトラです。I'm a tiger. でトラになりきって言えます。" },
    { prompt: "I'm an elephant. の意味はどれ？", correct: "私はゾウです。", wrongs: ["これはゾウです。", "ゾウが好きです。", "ゾウはいくつですか。"], explanation: "I'm a/an ... は私は...です、という意味です。elephantは母音で始まるのでanを使います。" }
  ]);

  // F2b さらに動物の名前(drill, d2)
  fam({
    familyId: "en_who_animal2",
    funMechanic: "drill",
    learningObjective: "動物を表す英単語を聞いて、日本語がわかる",
    commonMistake: "似た響きの動物の名前を混同する",
    estimatedSeconds: 30,
    skillTags: ["動物"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "A: Who are you? B: I'm a fish. Bは何になりきっている？", correct: "魚", wrongs: ["鳥", "犬", "ねこ"], explanation: "fish は魚です。水の中で泳ぐ生き物です。" }
  ]);

  // F3 Who と What のちがい(rule_discovery, d3)
  fam({
    familyId: "en_who_vs_what",
    funMechanic: "rule_discovery",
    learningObjective: "Who(だれ)とWhat(何)の使い分けのきまりに気づける",
    commonMistake: "who と what を同じ意味だと思いこむ",
    estimatedSeconds: 60,
    skillTags: ["Who are you", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "Who と What の違いとして正しいものはどれ？", correct: "Whoはだれ、Whatは何", wrongs: ["どちらも数", "どちらも色", "どちらも気分"], explanation: "Who は人や役、What は物を聞く時に使います。" },
    { prompt: "Who are you? の意味はどれ？", correct: "あなたはだれですか。", wrongs: ["これは何ですか。", "何個ありますか。", "何が好きですか。"], explanation: "who は「だれ」という意味で、人や正体をたずねます。" },
    { prompt: "Who are you? と聞く場面として合うものはどれ？", correct: "相手の役や正体をたずねる", wrongs: ["数を数える", "色を答える", "カードを渡す"], explanation: "Who are you? は相手がだれかをたずねます。" },
    { prompt: "What is this? と Who are you? を使い分けるきまりはどれ？", correct: "ものにはWhat、人や役にはWhoを使う", wrongs: ["どちらもものに使う", "どちらも人に使う", "きまりはない"], explanation: "ものをたずねるときはWhat、人や役をたずねるときはWhoを使います。" }
  ]);

  // F4 劇のせりふを考える(decide_then_verify, d4)
  fam({
    familyId: "en_who_decide",
    funMechanic: "decide_then_verify",
    learningObjective: "動物のなりきり劇で、自分ならどう答えるか考えてから確かめられる",
    commonMistake: "I'm a ... の形を使わず、単語だけで答えてしまう",
    estimatedSeconds: 75,
    skillTags: ["Who are you", "判断"],
    axes: { knowledge: 2, info: 2, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "劇でうさぎ役になりました。Who are you? と聞かれたら、自分ならどう答える？考えてから正しい形を確かめよう。正しい答えはどれ？", correct: "I'm a rabbit.", wrongs: ["Rabbit.", "It's a rabbit.", "Rabbit I am."], explanation: "自分がなりきる役は I'm a ... の形で答えます。" },
    { prompt: "劇でライオン役になりました。Who are you? と聞かれたら、自分ならどう答える？考えてから正しい形を確かめよう。正しい答えはどれ？", correct: "I'm a lion.", wrongs: ["Lion.", "It's a lion.", "I lion am."], explanation: "自分がなりきる役は I'm a ... の形で答えます。" },
    { prompt: "劇でサッカーせん手役になりました。Who are you? と聞かれたら、自分ならどう答える？考えてから正しい形を確かめよう。正しい答えはどれ？", correct: "I'm a soccer player.", wrongs: ["Soccer player.", "It's a soccer player.", "I soccer player am."], explanation: "自分がなりきる役は I'm a ... の形で答えます。", soccer: true }
  ]);

  // F5 動物なぞなぞ(inference, d4)
  fam({
    familyId: "en_who_riddle",
    funMechanic: "inference",
    learningObjective: "ヒントから、なりきっている動物を推理できる",
    commonMistake: "英語のヒントを読まず、絵や想像だけで答える",
    estimatedSeconds: 90,
    skillTags: ["動物", "推理"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 2 }
  }, [
    { prompt: "ヒント1：大きい動物です。ヒント2：鼻が長いです。ヒント3：アフリカにいます。Who are you?", correct: "I'm an elephant.", wrongs: ["I'm a mouse.", "I'm a lion.", "I'm a bird."], explanation: "大きくて鼻が長い動物はゾウです。elephantは母音で始まるのでanを使います。" },
    { prompt: "ヒント1：小さい動物です。ヒント2：チーズが好きです。ヒント3：ねこににげます。Who are you?", correct: "I'm a mouse.", wrongs: ["I'm an elephant.", "I'm a tiger.", "I'm a dog."], explanation: "小さくてチーズが好き、ねこに逃げる動物はねずみです。" }
  ]);

  // F6 会話でだれかを当てる(inference, d4)
  fam({
    familyId: "en_who_conversation",
    funMechanic: "inference",
    learningObjective: "会話の内容から、なりきっている役や動物を読み取れる",
    commonMistake: "会話の一部だけを読んで、全体をふまえずに答える",
    estimatedSeconds: 75,
    skillTags: ["Who are you", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "A: Who are you? B: I'm a bird. I can fly! Bになりきっている動物は？", correct: "鳥", wrongs: ["魚", "犬", "うさぎ"], explanation: "I'm a bird.(わたしは鳥です)と言い、I can fly!(飛べる)と続けています。" },
    { prompt: "A: Who are you? B: I'm a fish. I live in the sea. Bになりきっている動物は？", correct: "魚", wrongs: ["鳥", "犬", "うさぎ"], explanation: "I'm a fish.(わたしは魚です)と言い、I live in the sea.(海に住んでいる)と続けています。" }
  ]);

  // F7 役のなかまはずれ(rule_discovery, d3)
  fam({
    familyId: "en_who_odd",
    funMechanic: "rule_discovery",
    learningObjective: "動物・人の役と、それ以外の言葉をなかま分けできる",
    commonMistake: "音の似た言葉だけでなかまを判断する",
    estimatedSeconds: 60,
    skillTags: ["Who are you", "なかま分け"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "なかまはずれの言葉はどれ？（cat ・dog ・rabbit ・blue）", correct: "blue", wrongs: ["cat", "dog", "rabbit"], explanation: "cat/dog/rabbitは動物ですが、blueは色を表す言葉です。" },
    { prompt: "なかまはずれの言葉はどれ？（teacher ・doctor ・soccer player ・seven）", correct: "seven", wrongs: ["teacher", "doctor", "soccer player"], explanation: "teacher/doctor/soccer playerは人の役ですが、sevenは数字です。" }
  ]);

  // F8 自分の役を選ぶ(best_choice, d3)
  fam({
    familyId: "en_who_choose_role",
    funMechanic: "best_choice",
    learningObjective: "場面に合わせて、自分がなりきる役や動物を選べる",
    commonMistake: "場面の説明を読まずに答えを選ぶ",
    estimatedSeconds: 60,
    skillTags: ["Who are you", "会話"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "海の中の生き物になりきる劇で、あなたが選ぶ答えとして自然なものはどれ？", correct: "I'm a fish.", wrongs: ["I'm a rabbit.", "I'm a bird.", "I'm a tiger."], explanation: "海の中の生き物なので、fish(魚)がぴったりです。" },
    { prompt: "空をとぶ生き物になりきる劇で、あなたが選ぶ答えとして自然なものはどれ？", correct: "I'm a bird.", wrongs: ["I'm a fish.", "I'm a mouse.", "I'm a dog."], explanation: "空をとぶ生き物なので、bird(鳥)がぴったりです。" }
  ]);

  if (questions.length !== 25) throw new Error(`who_are_you: expected 25, got ${questions.length}`);
  return questions;
}

const questions = [
  ...makeHello(),
  ...makeHowAreYou(),
  ...makeHowMany(),
  ...makeILikeBlue(),
  ...makeWhatDoYouLike(),
  ...makeAlphabet(),
  ...makeThisIsForYou(),
  ...makeWhatsThis(),
  ...makeWhoAreYou()
];

if (questions.length !== 260) {
  throw new Error(`Expected 260 English questions, got ${questions.length}`);
}

await mkdir(new URL("../src/data/questions/grade3/english/", import.meta.url), { recursive: true });
writeFileSync(outFile, `window.CHIBI_QUEST_ENGLISH_QUESTIONS = ${JSON.stringify(questions, null, 2)};\n`);
console.log(`Generated ${questions.length} English questions`);

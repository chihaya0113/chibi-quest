import { writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";

const outFile = new URL("../src/data/questions/grade3/japanese/questions.js", import.meta.url);

const unitLabels = {
  kanji_reading: "漢字の読み",
  dictionary: "国語辞典",
  kanji_onkun: "漢字の音と訓",
  pronouns: "こそあど言葉",
  connectives: "つなぎ言葉",
  romaji: "ローマ字",
  vocabulary: "言葉の意味",
  story_reading: "物語を読む"
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
// IDは101番台から振る(旧IDの解答履歴と混ざらないよう再利用しない)。
function makeFamilyBuilder(unit, startIndex = 101) {
  const questions = [];
  let index = startIndex;
  const fam = (meta, items) => {
    for (const item of items) {
      questions.push({
        id: `g3_ja_${unit}_${pad(index++)}`,
        version: 2,
        grade: 3,
        subject: "japanese",
        unit,
        unitLabel: unitLabels[unit],
        curriculumArea: meta.curriculumArea ?? "知識及び技能",
        difficulty: difficultyFromAxes(item.axes ?? meta.axes),
        difficultyAxes: item.axes ?? meta.axes,
        questionType: "multiple_choice",
        prompt: item.prompt,
        // wrongs省略時は judge_claim 用の4択(二人とも正しい/はるとだけ/みおだけ/二人ともまちがい)を使う
        choices: textChoices(item.correct, item.wrongs ?? judgeWrongs(item.correct)),
        answer: { type: "choice", value: String(item.correct) },
        explanation: item.explanation,
        estimatedSeconds: item.estimatedSeconds ?? meta.estimatedSeconds,
        skillTags: meta.skillTags,
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

// ---------------------------------------------------------------- 漢字の読み(50)
function makeKanjiReading() {
  const { questions, fam } = makeFamilyBuilder("kanji_reading");

  // F1 読み方を選ぶ(drill, d1)
  fam({
    familyId: "ja_read_word",
    funMechanic: "drill",
    learningObjective: "3年生で習う漢字の読み方がわかる",
    commonMistake: "形のにた漢字の読みと混同する",
    estimatedSeconds: 30,
    skillTags: ["漢字", "読み"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "「悪い」の読み方はどれ？", correct: "わるい", wrongs: ["つよい", "くらい", "にがい"], explanation: "「悪い」は「わるい」と読みます。「天気が悪い」のように使います。" },
    { prompt: "「安全」の読み方はどれ？", correct: "あんぜん", wrongs: ["あんない", "かんぜん", "あんしん"], explanation: "「安全」は「あんぜん」と読みます。「安全にわたる」のように使います。" },
    { prompt: "「育つ」の読み方はどれ？", correct: "そだつ", wrongs: ["はこぶ", "すすむ", "ならぶ"], explanation: "「育つ」は「そだつ」と読みます。「ぐんぐん育つ」のように使います。" },
    { prompt: "「軽い」の読み方はどれ？", correct: "かるい", wrongs: ["おもい", "まるい", "ゆるい"], explanation: "「軽い」は「かるい」と読みます。「軽いかばん」のように使います。" },
    { prompt: "「湖」の読み方はどれ？", correct: "みずうみ", wrongs: ["いずみ", "うみべ", "みなと"], explanation: "「湖」は「みずうみ」と読みます。「大きな湖」のように使います。" }
  ]);

  // F2 文の中の読み(drill, d2)
  fam({
    familyId: "ja_read_sentence",
    funMechanic: "drill",
    learningObjective: "文の中で使われた漢字を正しく読める",
    commonMistake: "送りがなのにた別の言葉と読みまちがえる",
    estimatedSeconds: 45,
    skillTags: ["漢字", "読み", "文の中で読む"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "「にもつを運ぶ」の「運ぶ」の読み方はどれ？", correct: "はこぶ", wrongs: ["あそぶ", "えらぶ", "ならぶ"], explanation: "「運ぶ」は「はこぶ」と読みます。「にもつを運ぶ」のように使います。" },
    { prompt: "「川の岸を歩く」の「岸」の読み方はどれ？", correct: "きし", wrongs: ["いし", "はし", "みち"], explanation: "「岸」は「きし」と読みます。川や海のふちのことです。" },
    { prompt: "「朝早く起きる」の「起きる」の読み方はどれ？", correct: "おきる", wrongs: ["おりる", "おちる", "おこる"], explanation: "「起きる」は「おきる」と読みます。「朝起きる」のように使います。" },
    { prompt: "「くすりは苦い」の「苦い」の読み方はどれ？", correct: "にがい", wrongs: ["からい", "しぶい", "くさい"], explanation: "「苦い」は「にがい」と読みます。くすりやコーヒーの味に使います。" },
    { prompt: "「駅で電車を待つ」の「駅」の読み方はどれ？", correct: "えき", wrongs: ["まち", "みせ", "いえ"], explanation: "「駅」は「えき」と読みます。電車がとまる場所です。" }
  ]);

  // F3 読みから漢字を選ぶ(drill, d2)
  fam({
    familyId: "ja_write_kanji",
    funMechanic: "drill",
    learningObjective: "言葉に合う漢字を選べる",
    commonMistake: "形のにた漢字を選んでしまう",
    estimatedSeconds: 45,
    skillTags: ["漢字", "書き"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 2, choices: 2 }
  }, [
    { prompt: "「プールでおよぐ」の「およぐ」を漢字で書くと、どれ？", correct: "泳ぐ", wrongs: ["遊ぐ", "送ぐ", "流ぐ"], explanation: "「およぐ」は「泳ぐ」と書きます。さんずい(氵)がつきます。" },
    { prompt: "「家へいそぐ」の「いそぐ」を漢字で書くと、どれ？", correct: "急ぐ", wrongs: ["息ぐ", "追ぐ", "意ぐ"], explanation: "「いそぐ」は「急ぐ」と書きます。「急行」の「急」と同じ漢字です。" },
    { prompt: "「冬はさむい」の「さむい」を漢字で書くと、どれ？", correct: "寒い", wrongs: ["暑い", "実い", "客い"], explanation: "「さむい」は「寒い」と書きます。「暑い」は反対の「あつい」です。" },
    { prompt: "「水をのむ」の「のむ」を漢字で書くと、どれ？", correct: "飲む", wrongs: ["次む", "決む", "氷む"], explanation: "「のむ」は「飲む」と書きます。食べるものではなく、水やお茶に使います。" },
    { prompt: "「やくそくをまもる」の「まもる」を漢字で書くと、どれ？", correct: "守る", wrongs: ["安る", "定る", "家る"], explanation: "「まもる」は「守る」と書きます。うかんむりの漢字です。" }
  ]);

  // F4 じゅく語の読み(drill, d2)
  fam({
    familyId: "ja_read_jukugo",
    funMechanic: "drill",
    learningObjective: "漢字2字以上の言葉を正しく読める",
    commonMistake: "1字ずつの読みをそのままつなげて読んでしまう",
    estimatedSeconds: 45,
    skillTags: ["漢字", "読み", "じゅく語"],
    axes: { knowledge: 2, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "「図書館」の読み方はどれ？", correct: "としょかん", wrongs: ["ずしょかん", "としょけん", "とかん"], explanation: "「図書館」は「としょかん」と読みます。" },
    { prompt: "「階段」の読み方はどれ？", correct: "かいだん", wrongs: ["かいがん", "けいだん", "かだん"], explanation: "「階段」は「かいだん」と読みます。「階段をのぼる」のように使います。" },
    { prompt: "「研究」の読み方はどれ？", correct: "けんきゅう", wrongs: ["けんしゅう", "げんきゅう", "けんきょう"], explanation: "「研究」は「けんきゅう」と読みます。" },
    { prompt: "「世界」の読み方はどれ？", correct: "せかい", wrongs: ["せいかい", "せっかい", "せいけい"], explanation: "「世界」は「せかい」と読みます。「世界の国々」のように使います。" },
    { prompt: "「中央」の読み方はどれ？", correct: "ちゅうおう", wrongs: ["ちゅうしん", "ちゅうおん", "ちゅうよう"], explanation: "「中央」は「ちゅうおう」と読みます。まん中のことです。" }
  ]);

  // F5 まちがい読み直し(find_mistake, d3)
  fam({
    familyId: "ja_fix_misreading",
    funMechanic: "find_mistake",
    learningObjective: "まちがえやすい読みに気づいて、正しく直せる",
    commonMistake: "1字ずつの音をつなげた読みを正しいと思いこむ",
    estimatedSeconds: 60,
    skillTags: ["漢字", "読み", "たしかめ"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "みおさんは「去年」を「きょうねん」と読みました。正しい読み方はどれ？", correct: "きょねん", wrongs: ["きょうねんで正しい", "さくねん", "こねん"], explanation: "「去年」は「きょねん」と読みます。のばさずに読みます。" },
    { prompt: "はるとさんは「屋根」を「おくね」と読みました。正しい読み方はどれ？", correct: "やね", wrongs: ["おくねで正しい", "やこん", "おくこん"], explanation: "「屋根」は「やね」と読みます。「おくね」とは読みません。" },
    { prompt: "みおさんは「絵が下手だ」の「下手」を「したて」と読みました。正しい読み方はどれ？", correct: "へた", wrongs: ["したてで正しい", "げしゅ", "しもて"], explanation: "この文の「下手」は「へた」と読みます。とくべつな読み方です。" },
    { prompt: "はるとさんは「真っ赤」を「しんっか」と読みました。正しい読み方はどれ？", correct: "まっか", wrongs: ["しんっかで正しい", "まあか", "しんあか"], explanation: "「真っ赤」は「まっか」と読みます。とくべつな読み方の言葉です。" },
    { prompt: "みおさんは「一人で帰る」の「一人」を「いちにん」と読みました。正しい読み方はどれ？", correct: "ひとり", wrongs: ["いちにんで正しい", "いちじん", "ひとにん"], explanation: "この文の「一人」は「ひとり」と読みます。とくべつな読み方です。" }
  ]);

  // F6 文に合う漢字を選ぶ(best_choice, d3)
  fam({
    familyId: "ja_context_kanji",
    funMechanic: "best_choice",
    learningObjective: "文の意味に合う漢字を選べる",
    commonMistake: "読みが同じ・にている別の漢字を選んでしまう",
    estimatedSeconds: 60,
    skillTags: ["漢字", "使い分け"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "文に合う言葉はどれ？「くすりはとても___。」", correct: "苦い", wrongs: ["暗い", "重い", "悪い"], explanation: "味のことなので「苦い(にがい)」が合います。" },
    { prompt: "文に合う言葉はどれ？「持ち上げられないほど___にもつ。」", correct: "重い", wrongs: ["軽い", "丸い", "太い"], explanation: "持ち上げられないので「重い(おもい)」が合います。" },
    { prompt: "文に合う言葉はどれ？「夜道はとても___。」", correct: "暗い", wrongs: ["寒い", "深い", "苦い"], explanation: "夜道は光が少ないので「暗い(くらい)」が合います。" },
    { prompt: "文に合う言葉はどれ？「氷のように___水。」", correct: "冷たい", wrongs: ["温かい", "短い", "軽い"], explanation: "氷のようなので「冷たい(つめたい)」が合います。" },
    { prompt: "文に合う言葉はどれ？「兄は足が___。」", correct: "速い", wrongs: ["早い", "遠い", "長い"], explanation: "スピードのことは「速い」と書きます。「早い」は時間が前のときに使います。" }
  ]);

  // F7 仲間はずれさがし(rule_discovery, d4)
  fam({
    familyId: "ja_odd_one_out",
    funMechanic: "rule_discovery",
    learningObjective: "漢字の読みの共通点を見つけて、なかま分けできる",
    commonMistake: "形のにた漢字を同じ読みだと思いこむ",
    estimatedSeconds: 90,
    skillTags: ["漢字", "読み", "なかま分け"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "読み方に「カン」がない漢字は、どれ？", correct: "軽", wrongs: ["寒", "感", "館"], explanation: "寒(カン)、感(カン)、館(カン)ですが、軽は「ケイ」と読みます。" },
    { prompt: "読み方に「コウ」がない漢字は、どれ？", correct: "銀", wrongs: ["向", "幸", "港"], explanation: "向(コウ)、幸(コウ)、港(コウ)ですが、銀は「ギン」と読みます。" },
    { prompt: "音読みが「キュウ」でない漢字は、どれ？", correct: "局", wrongs: ["急", "球", "宮"], explanation: "急・球・宮は「キュウ」ですが、局は「キョク」と読みます。" },
    { prompt: "読み方に「ショウ」がない漢字は、どれ？", correct: "深", wrongs: ["商", "勝", "昭"], explanation: "商(ショウ)、勝(ショウ)、昭(ショウ)ですが、深は「シン」と読みます。" },
    { prompt: "ふだん、音読みだけで使うことが多い漢字は、どれ？", correct: "駅", wrongs: ["山", "川", "花"], explanation: "山(やま)、川(かわ)、花(はな)には訓読みがありますが、駅は「エキ」と音読みで使います。" }
  ]);

  // F8 読みの推理(inference, d4)
  fam({
    familyId: "ja_infer_reading",
    funMechanic: "inference",
    learningObjective: "知っている読みを手がかりに、じゅく語の読みを考えられる",
    commonMistake: "訓読みをそのままじゅく語にあてはめてしまう",
    estimatedSeconds: 90,
    skillTags: ["漢字", "読み", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "「安」は「アン」と読みます。では「安心」の読み方はどれ？", correct: "あんしん", wrongs: ["やすしん", "あんこころ", "あんじん"], explanation: "「安(アン)」+「心(シン)」で「あんしん」です。" },
    { prompt: "「泳」は「エイ」と読みます。では「水泳」の読み方はどれ？", correct: "すいえい", wrongs: ["みずえい", "すいおよ", "すいえん"], explanation: "「水(スイ)」+「泳(エイ)」で「すいえい」です。" },
    { prompt: "「開」は「カイ」と読みます。では「開店」の読み方はどれ？", correct: "かいてん", wrongs: ["ひらてん", "かいみせ", "けいてん"], explanation: "「開(カイ)」+「店(テン)」で「かいてん」です。" },
    { prompt: "「重」は「ジュウ」と読みます。では「体重」の読み方はどれ？", correct: "たいじゅう", wrongs: ["たいおも", "たいちょう", "からじゅう"], explanation: "「体(タイ)」+「重(ジュウ)」で「たいじゅう」です。" },
    { prompt: "「族」は「ゾク」と読みます。では「家族」の読み方はどれ？", correct: "かぞく", wrongs: ["いえぞく", "けぞく", "かやから"], explanation: "「家(カ)」+「族(ゾク)」で「かぞく」です。" }
  ]);

  // F9 どっちの読みが正しい？(judge_claim, d3)
  fam({
    familyId: "ja_judge_reading",
    funMechanic: "judge_claim",
    learningObjective: "漢字にはいくつかの読み方があることを知り、正しく判断できる",
    commonMistake: "漢字の読み方は1つだけだと思いこむ",
    estimatedSeconds: 60,
    skillTags: ["漢字", "読み"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "「幸せ」の読み方。はると「しあわせ」。みお「さいわせ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "「幸せ」は「しあわせ」と読みます。「幸い」なら「さいわい」です。" },
    { prompt: "「ドアが開く」の読み方。はると「ひらく」。みお「あく」。正しいのはどっち？", correct: "二人とも正しい", explanation: "「開く」には「ひらく」と「あく」の2つの読み方があり、この文ではどちらでも読めます。" },
    { prompt: "「九月八日」の「八日」。はると「はちにち」。みお「ようか」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "日づけの「八日」は「ようか」と読みます。とくべつな読み方です。" },
    { prompt: "「二十日」の読み方。はると「にじゅうにち」。みお「はつか」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "日づけの「二十日」は「はつか」と読みます。" },
    { prompt: "「坂を下る」の読み方。はると「のぼる」。みお「さがる」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "「下る」は「くだる」と読みます。「さがる」と読むのは「下がる」、「のぼる」は「上る」です。" }
  ]);

  // F10 送りがな(best_choice, d2)
  fam({
    familyId: "ja_okurigana",
    funMechanic: "best_choice",
    learningObjective: "漢字と送りがなの正しい組み合わせを選べる",
    commonMistake: "送りがなを多くつけすぎたり、足りなかったりする",
    estimatedSeconds: 60,
    skillTags: ["漢字", "送りがな"],
    axes: { knowledge: 1, info: 1, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "「あたたかい」を漢字と送りがなで書くと、どれ？", correct: "温かい", wrongs: ["温たかい", "温い", "温かかい"], explanation: "「あたたかい」は「温かい」と書きます。" },
    { prompt: "「おこなう」を漢字と送りがなで書くと、どれ？", correct: "行う", wrongs: ["行なう", "行こなう", "行"], explanation: "「おこなう」は「行う」と書きます。「いく」と読む「行く」と同じ漢字です。" },
    { prompt: "「きめる」を漢字と送りがなで書くと、どれ？", correct: "決める", wrongs: ["決る", "決きめる", "決め"], explanation: "「きめる」は「決める」と書きます。送りがなは「める」です。" },
    { prompt: "「ひらく」を漢字と送りがなで書くと、どれ？", correct: "開く", wrongs: ["開らく", "開いく", "開"], explanation: "「ひらく」は「開く」と書きます。送りがなは「く」だけです。" },
    { prompt: "「くるしい」を漢字と送りがなで書くと、どれ？", correct: "苦しい", wrongs: ["苦るしい", "苦い", "苦しいい"], explanation: "「くるしい」は「苦しい」です。「苦い」だと「にがい」になってしまいます。" }
  ]);

  if (questions.length !== 50) throw new Error(`kanji_reading: expected 50, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- 国語辞典(30)
function makeDictionary() {
  const { questions, fam } = makeFamilyBuilder("dictionary");

  // F1 いちばん先に出てくる言葉(drill, d2)
  fam({
    familyId: "ja_dict_first",
    funMechanic: "drill",
    learningObjective: "五十音順で言葉のならびを考えられる",
    commonMistake: "2文字目からくらべてしまう",
    estimatedSeconds: 45,
    skillTags: ["国語辞典", "五十音順"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 }
  }, [
    { prompt: "国語辞典で、いちばん先に出てくる言葉はどれ？", correct: "あさ", wrongs: ["いす", "うみ", "えき"], explanation: "国語辞典は五十音順です。「あ」で始まる「あさ」がいちばん先です。" },
    { prompt: "五十音順で、いちばん早くならぶ言葉はどれ？", correct: "かさ", wrongs: ["くつ", "こま", "さる"], explanation: "か→く→こ→さ の順なので、「かさ」がいちばん早いです。" },
    { prompt: "国語辞典を引くと、最初に出てくる言葉はどれ？", correct: "たこ", wrongs: ["つき", "てら", "とり"], explanation: "た→つ→て→と の順なので、「たこ」が最初です。" },
    { prompt: "あいうえお順で、いちばん前になる言葉はどれ？", correct: "まち", wrongs: ["みず", "むし", "もり"], explanation: "ま→み→む→も の順なので、「まち」がいちばん前です。" }
  ]);

  // F2 2文字目・にごる音のきまり(rule_discovery, d3)
  fam({
    familyId: "ja_dict_order_rule",
    funMechanic: "rule_discovery",
    learningObjective: "1文字目が同じときは2文字目、清音とだく音のならびのきまりがわかる",
    commonMistake: "だく音(ば)や半だく音(ぱ)のならびをでたらめに考える",
    estimatedSeconds: 75,
    skillTags: ["国語辞典", "五十音順", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "「かさ」と「かき」。辞典で先に出てくるのはどっち？", correct: "かき", wrongs: ["かさ", "同時に出てくる", "きまりはない"], explanation: "1文字目が同じときは2文字目でくらべます。「き」は「さ」より先です。" },
    { prompt: "「はし」と「ばし」。辞典で先に出てくるのはどっち？", correct: "はし", wrongs: ["ばし", "同時に出てくる", "きまりはない"], explanation: "「は」と「ば」では、点々のない清音「は」が先にならびます。" },
    { prompt: "「きって」と「きつね」。辞典で先に出てくるのはどっち？", correct: "きって", wrongs: ["きつね", "同時に出てくる", "きまりはない"], explanation: "小さい「っ」は「つ」として見ます。3文字目の「て」と「ね」では「て」が先です。" },
    { prompt: "「ふた」と「ぶた」。辞典で先に出てくるのはどっち？", correct: "ふた", wrongs: ["ぶた", "同時に出てくる", "きまりはない"], explanation: "清音「ふ」→だく音「ぶ」の順なので、「ふた」が先です。" }
  ]);

  // F3 見出し語の形(drill, d2)
  fam({
    familyId: "ja_dict_lookup_form",
    funMechanic: "drill",
    learningObjective: "言葉を言い切りの形に直して辞典を引ける",
    commonMistake: "文の中の形(走った・高かった)のままさがしてしまう",
    estimatedSeconds: 60,
    skillTags: ["国語辞典", "見出し語"],
    axes: { knowledge: 2, info: 1, steps: 2, format: 1, choices: 2 }
  }, [
    { prompt: "「走った」を辞典で調べます。見出し語はどれ？", correct: "走る", wrongs: ["走った", "走り", "走"], explanation: "辞典には言い切りの形「走る」でのっています。" },
    { prompt: "「泳いで」を辞典で調べます。見出し語はどれ？", correct: "泳ぐ", wrongs: ["泳いで", "泳ぎ", "泳いだ"], explanation: "辞典には言い切りの形でのっているので、「泳ぐ」でさがします。" },
    { prompt: "「高かった」を辞典で調べます。見出し語はどれ？", correct: "高い", wrongs: ["高かった", "高く", "高さ"], explanation: "辞典には言い切りの形でのっているので、「高い」でさがします。" },
    { prompt: "「読みます」を辞典で調べます。見出し語はどれ？", correct: "読む", wrongs: ["読みます", "読み", "読んだ"], explanation: "辞典には言い切りの形でのっているので、「読む」でさがします。" }
  ]);

  // F4 言葉の意味(drill, d2)
  fam({
    familyId: "ja_dict_meaning",
    funMechanic: "drill",
    learningObjective: "辞典にのっている言葉の意味がわかる",
    commonMistake: "音のにた別の言葉の意味と取りちがえる",
    estimatedSeconds: 45,
    skillTags: ["国語辞典", "言葉の意味"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "「しずか」の意味として合うものはどれ？", correct: "音や声が少ないようす", wrongs: ["色が明るいようす", "数が多いようす", "水が冷たいようす"], explanation: "「しずか」は、音や声が少ないようすを表します。" },
    { prompt: "「くふう」の意味として合うものはどれ？", correct: "よくなるように考えること", wrongs: ["すぐわすれること", "同じ場所にいること", "声を小さくすること"], explanation: "「くふう」は、よくなるようにあれこれ考えることです。" },
    { prompt: "「りゆう」の意味として合うものはどれ？", correct: "そうなるわけ", wrongs: ["ものの色", "人の名前", "短い歌"], explanation: "「りゆう」は、そうなる「わけ」のことです。" },
    { prompt: "「はっけん」の意味として合うものはどれ？", correct: "知らなかったことを見つけること", wrongs: ["なくすこと", "ねむること", "ならべること"], explanation: "「はっけん」は、まだ知らなかったことを見つけることです。" }
  ]);

  // F5 いくつもの意味(inference, d3-d4)
  fam({
    familyId: "ja_dict_multi_meaning",
    funMechanic: "inference",
    learningObjective: "1つの言葉にいくつもの意味があるとき、文に合う意味を選べる",
    commonMistake: "辞典の最初にのっている意味をいつも選んでしまう",
    estimatedSeconds: 90,
    skillTags: ["国語辞典", "多義語"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "辞典の「あがる」には、①上へ行く ②きんちょうする、があります。「発表であがってしまった」の「あがる」はどっち？", correct: "②きんちょうする", wrongs: ["①上へ行く", "どちらでもない", "両方"], explanation: "発表のときの「あがる」は、きんちょうするという意味です。" },
    { prompt: "辞典の「あまい」には、①さとうのような味 ②きびしくない、があります。「あまい作せん」の「あまい」はどっち？", correct: "②きびしくない", wrongs: ["①さとうのような味", "どちらでもない", "両方"], explanation: "作せんが「あまい」は、考えがきびしくないという意味です。" },
    { prompt: "辞典の「たつ」には、①立ち上がる ②時間がすぎる、があります。「三年がたつ」の「たつ」はどっち？", correct: "②時間がすぎる", wrongs: ["①立ち上がる", "どちらでもない", "両方"], explanation: "「三年がたつ」は、三年の時間がすぎたという意味です。" },
    { prompt: "辞典の「とる」には、①手に持つ ②写真をうつす、があります。「集合写真をとる」の「とる」はどっち？", correct: "②写真をうつす", wrongs: ["①手に持つ", "どちらでもない", "両方"], explanation: "写真の「とる」は、うつすという意味です。" },
    { prompt: "辞典の「かたい」には、①力を入れてもつぶれない ②まじめすぎる、があります。「かたい石」の「かたい」はどっち？", correct: "①力を入れてもつぶれない", wrongs: ["②まじめすぎる", "どちらでもない", "両方"], explanation: "石の「かたい」は、つぶれないという意味です。" }
  ]);

  // F6 辞典の順ならべ(reorder, d4)
  fam({
    familyId: "ja_dict_reorder",
    funMechanic: "reorder",
    learningObjective: "3つ以上の言葉を五十音順にならべられる",
    commonMistake: "1文字目だけ見て、2文字目のくらべわすれをする",
    estimatedSeconds: 90,
    skillTags: ["国語辞典", "五十音順", "ならべ替え"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 2 }
  }, [
    { prompt: "「あめ」「いぬ」「うた」を辞典の順にならべたものはどれ？", correct: "あめ → いぬ → うた", wrongs: ["いぬ → あめ → うた", "うた → いぬ → あめ", "あめ → うた → いぬ"], explanation: "あ→い→う の順なので、あめ→いぬ→うた です。" },
    { prompt: "「かき」「かい」「かさ」を辞典の順にならべたものはどれ？", correct: "かい → かき → かさ", wrongs: ["かき → かい → かさ", "かさ → かき → かい", "かい → かさ → かき"], explanation: "1文字目が同じなので2文字目でくらべます。い→き→さ の順です。" },
    { prompt: "「ぱん」「はと」「ばら」を辞典の順にならべたものはどれ？", correct: "はと → ばら → ぱん", wrongs: ["ぱん → ばら → はと", "ばら → はと → ぱん", "はと → ぱん → ばら"], explanation: "清音「は」→だく音「ば」→半だく音「ぱ」の順にならびます。" },
    { prompt: "「すいか」「せかい」「さかな」を辞典の順にならべたものはどれ？", correct: "さかな → すいか → せかい", wrongs: ["すいか → さかな → せかい", "せかい → すいか → さかな", "さかな → せかい → すいか"], explanation: "さ→す→せ の順なので、さかな→すいか→せかい です。" },
    { prompt: "「ねこ」「のり」「にじ」を辞典の順にならべたものはどれ？", correct: "にじ → ねこ → のり", wrongs: ["ねこ → にじ → のり", "のり → ねこ → にじ", "にじ → のり → ねこ"], explanation: "に→ね→の の順なので、にじ→ねこ→のり です。" }
  ]);

  // F7 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "ja_dict_judge",
    funMechanic: "judge_claim",
    learningObjective: "国語辞典の使い方のきまりを正しく判断できる",
    commonMistake: "漢字辞典の引き方(画数)と混同する",
    estimatedSeconds: 75,
    skillTags: ["国語辞典", "使い方"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「『ぱん』は『はん』『ばん』より後ろに出てくる」。みお「『ぱん』がいちばん前」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "は→ば→ぱ の順なので、「ぱん」はいちばん後ろです。" },
    { prompt: "はると「カタカナの言葉はのっていない」。みお「カタカナの言葉も国語辞典にのっている」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "「テレビ」「パン」のようなカタカナの言葉ものっています。" },
    { prompt: "「食べる」の調べ方。はると「『べ』の場所でさがす」。みお「漢字の画数でさがす」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "国語辞典は言葉の最初の音の順にならんでいるので、「食べる」は「た」の場所でさがします。画数で引くのは漢字辞典です。" },
    { prompt: "はると「同じ言葉に意味がいくつものっていることがある」。みお「国語辞典では、言葉が五十音じゅんにならんでいる」。正しいのはどっち？", correct: "二人とも正しい", explanation: "「あがる」のように1つの言葉に意味がいくつものっていることがあり、また国語辞典では言葉が五十音じゅんにならんでいます。" }
  ]);

  if (questions.length !== 30) throw new Error(`dictionary: expected 30, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- 漢字の音と訓(30)
function makeOnKun() {
  const { questions, fam } = makeFamilyBuilder("kanji_onkun");

  // F1 音読み(drill, d2)
  fam({
    familyId: "ja_onkun_on",
    funMechanic: "drill",
    learningObjective: "漢字の音読みがわかる",
    commonMistake: "訓読みを音読みだと思って選ぶ",
    estimatedSeconds: 45,
    skillTags: ["漢字", "音読み"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "「運」の音読みはどれ？", correct: "ウン", wrongs: ["はこぶ", "カイ", "アン"], explanation: "「運」の音読みは「ウン」です。「運動(うんどう)」のように使います。" },
    { prompt: "「泳」の音読みはどれ？", correct: "エイ", wrongs: ["およぐ", "セン", "キュウ"], explanation: "「泳」の音読みは「エイ」です。「水泳(すいえい)」のように使います。" },
    { prompt: "「開」の音読みはどれ？", correct: "カイ", wrongs: ["ひらく", "アン", "ケイ"], explanation: "「開」の音読みは「カイ」です。「開店(かいてん)」のように使います。" },
    { prompt: "「急」の音読みはどれ？", correct: "キュウ", wrongs: ["いそぐ", "コウ", "キョク"], explanation: "「急」の音読みは「キュウ」です。「急行(きゅうこう)」のように使います。" },
    { prompt: "「決」の音読みはどれ？", correct: "ケツ", wrongs: ["きめる", "ケン", "コウ"], explanation: "「決」の音読みは「ケツ」です。「決定(けってい)」のように使います。" }
  ]);

  // F2 訓読み(drill, d2)
  fam({
    familyId: "ja_onkun_kun",
    funMechanic: "drill",
    learningObjective: "漢字の訓読みがわかる",
    commonMistake: "音読みを訓読みだと思って選ぶ",
    estimatedSeconds: 45,
    skillTags: ["漢字", "訓読み"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "「暗」の訓読みはどれ？", correct: "くらい", wrongs: ["アン", "さむい", "にがい"], explanation: "「暗」の訓読みは「くらい」です。訓読みは聞いて意味がわかる読み方です。" },
    { prompt: "「寒」の訓読みはどれ？", correct: "さむい", wrongs: ["カン", "くらい", "かるい"], explanation: "「寒」の訓読みは「さむい」です。聞いただけで意味がわかる読み方です。" },
    { prompt: "「起」の訓読みはどれ？", correct: "おきる", wrongs: ["キ", "おりる", "はしる"], explanation: "「起」の訓読みは「おきる」です。音読みは「キ」です。" },
    { prompt: "「軽」の訓読みはどれ？", correct: "かるい", wrongs: ["ケイ", "おもい", "はやい"], explanation: "「軽」の訓読みは「かるい」です。音読みは「ケイ」です。" },
    { prompt: "「向」の訓読みはどれ？", correct: "むく", wrongs: ["コウ", "いく", "なく"], explanation: "「向」の訓読みは「むく」です。音読みは「コウ」です。" }
  ]);

  // F3 音か訓かを見分ける(rule_discovery, d3)
  fam({
    familyId: "ja_onkun_classify",
    funMechanic: "rule_discovery",
    learningObjective: "「聞いて意味がわかるのが訓読み」というきまりで見分けられる",
    commonMistake: "ひらがなかカタカナかだけで判断してしまう",
    estimatedSeconds: 75,
    skillTags: ["漢字", "音と訓", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "「山(やま)」の「やま」は、音読み？訓読み？", correct: "訓読み", wrongs: ["音読み", "どちらでもない", "読み方ではない"], explanation: "「やま」と聞いただけで意味がわかるので訓読みです。音読みは「サン」です。" },
    { prompt: "「学校(ガッコウ)」の読み方は、音読み？訓読み？", correct: "音読み", wrongs: ["訓読み", "どちらでもない", "読み方ではない"], explanation: "「ガク」「コウ」は中国から伝わった音読みです。" },
    { prompt: "聞いただけで意味がわかることが多いのは、どっちの読み方？", correct: "訓読み", wrongs: ["音読み", "どちらも同じ", "どちらもわからない"], explanation: "訓読みは日本の言葉に合わせた読み方なので、聞いて意味がわかります。" },
    { prompt: "中国から伝わった読み方は、どっち？", correct: "音読み", wrongs: ["訓読み", "どちらも日本生まれ", "どちらも中国生まれ"], explanation: "音読みは中国の発音がもとになった読み方です。" }
  ]);

  // F4 音訓ペアの推理(inference, d3-d4)
  fam({
    familyId: "ja_onkun_pair",
    funMechanic: "inference",
    learningObjective: "音と訓の両方を使って、じゅく語の読みを考えられる",
    commonMistake: "じゅく語でも訓読みのまま読んでしまう",
    estimatedSeconds: 90,
    skillTags: ["漢字", "音と訓", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "「海」の訓は「うみ」、音は「カイ」。では「海水」の読み方はどれ？", correct: "かいすい", wrongs: ["うみみず", "かいみず", "うみすい"], explanation: "じゅく語では音読みどうしで「かいすい」と読みます。" },
    { prompt: "「山」の訓は「やま」、音は「サン」。では「火山」の読み方はどれ？", correct: "かざん", wrongs: ["ひやま", "かやま", "ひざん"], explanation: "音読みどうしで「かざん」です。「サン」がにごって「ザン」になります。" },
    { prompt: "「空」の訓は「そら」、音は「クウ」。では「空気」の読み方はどれ？", correct: "くうき", wrongs: ["そらき", "くうけ", "そらけ"], explanation: "音読みどうしで「くうき」と読みます。" },
    { prompt: "「花」の訓は「はな」、音は「カ」。では「花だん」の読み方はどれ？", correct: "かだん", wrongs: ["はなだん", "けだん", "ばなだん"], explanation: "「花だん」は音読みで「かだん」と読みます。" }
  ]);

  // F5 まちがい直し(find_mistake, d3)
  fam({
    familyId: "ja_onkun_fix",
    funMechanic: "find_mistake",
    learningObjective: "音読み・訓読みの見分けのまちがいに気づける",
    commonMistake: "じゅく語は全部音読みだと思いこむ",
    estimatedSeconds: 75,
    skillTags: ["漢字", "音と訓", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「山道(やまみち)」を音読みの言葉だと言いました。正しいのはどれ？", correct: "訓読みと訓読みの言葉", wrongs: ["音読みで正しい", "音読みと訓読みの言葉", "漢字の言葉ではない"], explanation: "「やま」も「みち」も聞いて意味がわかる訓読みです。" },
    { prompt: "みおさんは「雨(あめ)」を音読みだと言いました。正しいのはどれ？", correct: "訓読み", wrongs: ["音読みで正しい", "どちらでもない", "特別な読み方"], explanation: "「あめ」は訓読みです。音読みは「ウ」で、「雨天(うてん)」のように使います。" },
    { prompt: "はるとさんは「音楽(おんがく)」を訓読みだと言いました。正しいのはどれ？", correct: "音読み", wrongs: ["訓読みで正しい", "どちらでもない", "特別な読み方"], explanation: "「オン」「ガク」はどちらも音読みです。" },
    { prompt: "みおさんは「朝日(あさひ)」を音読みだと言いました。正しいのはどれ？", correct: "訓読み", wrongs: ["音読みで正しい", "どちらでもない", "外国の言葉"], explanation: "「あさ」も「ひ」も、聞いて意味がわかる訓読みです。" }
  ]);

  // F6 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "ja_onkun_judge",
    funMechanic: "judge_claim",
    learningObjective: "音と訓のきまりについての主張を判断できる",
    commonMistake: "漢字の読み方は1つだけだと思いこむ",
    estimatedSeconds: 75,
    skillTags: ["漢字", "音と訓"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「1つの漢字に音と訓の両方があることが多い」。みお「どの漢字も読み方は1つだけ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "「山(サン・やま)」のように、多くの漢字に音と訓があります。" },
    { prompt: "「生」について。はると「『いきる』と読める」。みお「『セイ』と読める」。正しいのはどっち？", correct: "二人とも正しい", explanation: "「生きる(いきる)」は訓、「生活(せいかつ)」の「セイ」は音です。" },
    { prompt: "はると「辞典では音読みも訓読みもひらがなで書く」。みお「辞典では音読みも訓読みもカタカナで書く」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "辞典では音読みをカタカナ、訓読みをひらがなで書き分けることが多いです。" },
    { prompt: "「字」について。はると「音読みは『ジ』」。みお「訓読みがない漢字もある」。正しいのはどっち？", correct: "二人とも正しい", explanation: "「字」の音読みは「ジ」で、ふだん使う訓読みはありません。そういう漢字もあります。" }
  ]);

  // F7 音・訓の組み合わせの言葉選び(best_choice, d4)
  fam({
    familyId: "ja_onkun_combo",
    funMechanic: "best_choice",
    learningObjective: "言葉が音読みどうしか、訓読みどうしかを見分けられる",
    commonMistake: "1文字だけ見て言葉ぜんたいを判断してしまう",
    estimatedSeconds: 90,
    skillTags: ["漢字", "音と訓", "なかま分け"],
    axes: { knowledge: 2, info: 2, steps: 3, format: 3, choices: 2 }
  }, [
    { prompt: "音読みどうしの組み合わせの言葉は、どれ？", correct: "学級(がっきゅう)", wrongs: ["山道(やまみち)", "朝日(あさひ)", "花火(はなび)"], explanation: "「ガク」「キュウ」はどちらも音読みです。ほかは訓読みどうしです。" },
    { prompt: "訓読みどうしの組み合わせの言葉は、どれ？", correct: "花火(はなび)", wrongs: ["研究(けんきゅう)", "学級(がっきゅう)", "安全(あんぜん)"], explanation: "「はな」「ひ」はどちらも訓読みです。ほかは音読みどうしです。" },
    { prompt: "訓読みどうしの組み合わせの言葉は、どれ？", correct: "青空(あおぞら)", wrongs: ["図書(としょ)", "教室(きょうしつ)", "世界(せかい)"], explanation: "「あお」「そら」はどちらも訓読みです。" },
    { prompt: "音読みどうしの組み合わせの言葉は、どれ？", correct: "病院(びょういん)", wrongs: ["手紙(てがみ)", "雨戸(あまど)", "朝日(あさひ)"], explanation: "「ビョウ」「イン」はどちらも音読みです。ほかは訓読みどうしです。" }
  ]);

  if (questions.length !== 30) throw new Error(`kanji_onkun: expected 30, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- こそあど言葉(30)
function makePronouns() {
  const { questions, fam } = makeFamilyBuilder("pronouns");

  // F1 基本の使い分け(drill, d2)
  fam({
    familyId: "ja_koso_basic",
    funMechanic: "drill",
    learningObjective: "こ・そ・あ・どを、さすものとの近さで使い分けられる",
    commonMistake: "自分との近さと、相手との近さを取りちがえる",
    estimatedSeconds: 45,
    skillTags: ["こそあど言葉"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "話している人の近くにあるものを表す言葉はどれ？", correct: "これ", wrongs: ["それ", "あれ", "どれ"], explanation: "自分の近くのものは「これ」でさします。" },
    { prompt: "聞いている人の近くにあるものを表す言葉はどれ？", correct: "それ", wrongs: ["これ", "あれ", "どれ"], explanation: "相手の近くのものは「それ」でさします。" },
    { prompt: "話している人からも聞いている人からも遠いものを表す言葉はどれ？", correct: "あれ", wrongs: ["これ", "それ", "どれ"], explanation: "どちらからも遠いものは「あれ」でさします。" },
    { prompt: "話している人の近くの場所を表す言葉はどれ？", correct: "ここ", wrongs: ["そこ", "あそこ", "どこ"], explanation: "自分の近くの場所は「ここ」でさします。「こ」の仲間です。" },
    { prompt: "場所をたずねる言葉はどれ？", correct: "どこ", wrongs: ["ここ", "そこ", "あそこ"], explanation: "わからない場所をたずねるときは「どこ」を使います。" }
  ]);

  // F2 文の中で使う(drill, d2)
  fam({
    familyId: "ja_koso_sentence",
    funMechanic: "drill",
    learningObjective: "場面に合わせて、こそあど言葉の入った文を作れる",
    commonMistake: "遠くのものに「これ」を使ってしまう",
    estimatedSeconds: 60,
    skillTags: ["こそあど言葉", "文の中で使う"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 }
  }, [
    { prompt: "目の前の本をさして言うとき、合う文はどれ？", correct: "これはおもしろい本です。", wrongs: ["それはおもしろい本です。", "あれはおもしろい本です。", "どれはおもしろい本です。"], explanation: "自分の目の前にあるので「これ」を使います。" },
    { prompt: "友だちの近くのえんぴつをさすとき、合う文はどれ？", correct: "それを貸してね。", wrongs: ["これを貸してね。", "あれを貸してね。", "どれを貸してね。"], explanation: "相手の近くにあるので「それ」を使います。" },
    { prompt: "校庭の向こうの木をさすとき、合う文はどれ？", correct: "あれが大きな木です。", wrongs: ["これが大きな木です。", "それが大きな木です。", "どれが大きな木です。"], explanation: "どちらからも遠いので「あれ」を使います。" },
    { prompt: "どの席にすわるかたずねるとき、合う文はどれ？", correct: "どこにすわればいいですか。", wrongs: ["ここにすわればいいですか。", "そこにすわればいいですか。", "あそこにすわればいいですか。"], explanation: "わからない場所をたずねるので「どこ」を使います。" },
    { prompt: "聞いている人のそばのかばんをさすとき、合う文はどれ？", correct: "そのかばんは重いですか。", wrongs: ["このかばんは重いですか。", "あのかばんは重いですか。", "どのかばんは重いですか。"], explanation: "相手のそばにあるので「その」を使います。" }
  ]);

  // F3 何をさしているか(inference, d3-d4)
  fam({
    familyId: "ja_koso_what_points",
    funMechanic: "inference",
    learningObjective: "文章の中のこそあど言葉が何をさしているか読み取れる",
    commonMistake: "直前の言葉ではなく、文の最初の言葉をさしていると思いこむ",
    estimatedSeconds: 90,
    skillTags: ["こそあど言葉", "読解"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "「きのう公園で子犬を見ました。それはとても小さくて、白い毛でした。」の「それ」がさすものはどれ？", correct: "子犬", wrongs: ["公園", "きのう", "白い毛"], explanation: "小さくて白い毛なのは子犬です。「それ」は前に出てきた子犬をさします。" },
    { prompt: "「駅の前に古い時計があります。あれは100年前から動いているそうです。」の「あれ」がさすものはどれ？", correct: "古い時計", wrongs: ["駅", "100年前", "駅の前の道"], explanation: "100年前から動いているのは古い時計です。" },
    { prompt: "「はるとはボールをけりました。それはゴールに入りました。」の「それ」がさすものはどれ？", correct: "ボール", wrongs: ["はると", "ゴール", "足"], explanation: "ゴールに入ったのはボールです。「それ」は直前のボールをさしています。" },
    { prompt: "「わたしは水族館へ行きました。そこで大きなカメを見ました。」の「そこ」がさすものはどれ？", correct: "水族館", wrongs: ["カメ", "家", "海"], explanation: "カメを見た場所は水族館です。「そこ」は場所をさします。" },
    { prompt: "「母がケーキを焼きました。わたしはそれを半分食べました。」の「それ」がさすものはどれ？", correct: "ケーキ", wrongs: ["母", "半分", "おさら"], explanation: "半分食べたのはケーキです。「それ」は母が焼いたケーキをさしています。" }
  ]);

  // F4 まちがい直し(find_mistake, d3)
  fam({
    familyId: "ja_koso_fix",
    funMechanic: "find_mistake",
    learningObjective: "場面に合わないこそあど言葉に気づいて直せる",
    commonMistake: "遠近のちがいに気づかず、そのまま正しいと思う",
    estimatedSeconds: 75,
    skillTags: ["こそあど言葉", "たしかめ"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは、遠くの山を見て「これは高い山だね」と言いました。正しい言い方はどれ？", correct: "あれは高い山だね", wrongs: ["これは高い山だねで正しい", "それは高い山だね", "どれは高い山だね"], explanation: "遠くに見えるものをさすので「あれ」を使います。" },
    { prompt: "みおさんは、自分が手に持っている本を「あれはおもしろいよ」と言いました。正しい言い方はどれ？", correct: "これはおもしろいよ", wrongs: ["あれはおもしろいよで正しい", "どれはおもしろいよ", "あちらはおもしろいよ"], explanation: "自分の手にあるものは「これ」でさします。" },
    { prompt: "はるとさんは、友だちのそばのかばんを「このかばん、すてきだね」と言いました。正しい言い方はどれ？", correct: "そのかばん、すてきだね", wrongs: ["このかばんで正しい", "あのかばん、すてきだね", "どのかばん、すてきだね"], explanation: "相手のそばのものは「その」でさします。" },
    { prompt: "みおさんは、トイレの場所を知らないのに「トイレはそこですか」と言いました。正しい言い方はどれ？", correct: "トイレはどこですか", wrongs: ["トイレはそこですかで正しい", "トイレはここですか", "トイレはあそこですか"], explanation: "わからない場所をたずねるときは「どこ」を使います。" }
  ]);

  // F5 会話の穴うめ(best_choice, d3)
  fam({
    familyId: "ja_koso_dialogue",
    funMechanic: "best_choice",
    learningObjective: "会話の場面から、合うこそあど言葉を選べる",
    commonMistake: "話し手と聞き手のどちらの近くかを考えずに選ぶ",
    estimatedSeconds: 75,
    skillTags: ["こそあど言葉", "会話"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "相手がかぶっているぼうしをほめます。「___ぼうし、すてきだね。」に入る言葉はどれ？", correct: "その", wrongs: ["この", "あの", "どの"], explanation: "相手が身につけているものは「その」でさします。" },
    { prompt: "電話で友だちに、今いる場所をたずねます。「今、___にいるの？」に入る言葉はどれ？", correct: "どこ", wrongs: ["ここ", "そこ", "あそこ"], explanation: "相手のいる場所がわからないので「どこ」でたずねます。" },
    { prompt: "遠くに上がった花火を見て言います。「___、きれいだね。」に入る言葉はどれ？", correct: "あれ", wrongs: ["これ", "それ", "どれ"], explanation: "遠くのものをさすので「あれ」を使います。" },
    { prompt: "目の前のケーキを指して聞きます。「___、食べてもいい？」に入る言葉はどれ？", correct: "これ", wrongs: ["それ", "あれ", "どれ"], explanation: "自分の目の前にあるものは「これ」でさします。" }
  ]);

  // F6 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "ja_koso_judge",
    funMechanic: "judge_claim",
    learningObjective: "こそあど言葉のきまりについての主張を判断できる",
    commonMistake: "「これ」と「それ」の使い分けをあいまいにおぼえている",
    estimatedSeconds: 75,
    skillTags: ["こそあど言葉"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「自分の近くのものは『これ』」。みお「相手の近くのものは『それ』」。正しいのはどっち？", correct: "二人とも正しい", explanation: "近さによって「これ」「それ」を使い分けます。二人とも正しいです。" },
    { prompt: "はると「『どれ』はわからないものをたずねる言葉」。みお「『あれ』もたずねる言葉」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "たずねるのは「ど」の仲間です。「あれ」は遠くのものをさす言葉です。" },
    { prompt: "はると「こそあど言葉を使うと、何を指しているかいつも分かりにくくなる」。みお「使うと文はかならず長くなる」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "こそあど言葉を使うと同じ言葉のくり返しをさけられ、文はむしろ短くなります。何を指すかは前後の文で分かるようにします。" }
  ]);

  // F7 こそあどのきまり(rule_discovery, d3)
  fam({
    familyId: "ja_koso_rule",
    funMechanic: "rule_discovery",
    learningObjective: "こ・そ・あ・どの4つの仲間の共通点を見つけられる",
    commonMistake: "「あ」と「ど」の仲間のはたらきを混同する",
    estimatedSeconds: 75,
    skillTags: ["こそあど言葉", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "「ど」のつくこそあど言葉(どれ・どこ・どちら)に共通することはどれ？", correct: "たずねるときに使う", wrongs: ["近くのものをさす", "遠くのものをさす", "自分をさす"], explanation: "「ど」の仲間は、わからないものをたずねるときに使います。" },
    { prompt: "近い→遠いの順にならんでいるのはどれ？", correct: "これ → それ → あれ", wrongs: ["あれ → それ → これ", "それ → これ → あれ", "これ → あれ → それ"], explanation: "自分の近く「これ」、相手の近く「それ」、どちらからも遠い「あれ」の順です。" },
    { prompt: "「あ」の仲間の言葉を集めたものはどれ？", correct: "あれ・あそこ・あちら", wrongs: ["これ・ここ・こちら", "それ・そこ・そちら", "どれ・どこ・どちら"], explanation: "「あ」で始まる、遠くをさす仲間です。" },
    { prompt: "話し手からも聞き手からも遠いものをさすのは、どの仲間？", correct: "「あ」の仲間", wrongs: ["「こ」の仲間", "「そ」の仲間", "「ど」の仲間"], explanation: "どちらからも遠いものは「あれ」「あそこ」など「あ」の仲間でさします。" }
  ]);

  if (questions.length !== 30) throw new Error(`pronouns: expected 30, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- つなぎ言葉(35)
function makeConnectives() {
  const { questions, fam } = makeFamilyBuilder("connectives");
  const area = "読むこと・書くこと";

  // F1 だから(順接)(drill, d2)
  fam({
    curriculumArea: area,
    familyId: "ja_conn_because",
    funMechanic: "drill",
    learningObjective: "理由→結果のつながりに「だから」を使える",
    commonMistake: "反対の内容なのに「だから」を選んでしまう",
    estimatedSeconds: 60,
    skillTags: ["接続語", "文のつながり"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 }
  }, [
    { prompt: "（　）に入るつなぎ言葉はどれ？ 雨がふってきました。（　）、外で遊ぶのをやめました。", correct: "だから", wrongs: ["しかし", "たとえば", "それとも"], explanation: "前の文が理由、後の文が結果なので「だから」が合います。" },
    { prompt: "（　）に入るつなぎ言葉はどれ？ たくさん練習しました。（　）、しあいで勝つことができました。", correct: "だから", wrongs: ["しかし", "なぜなら", "それとも"], explanation: "練習が理由で勝てたので「だから」が合います。" },
    { prompt: "（　）に入るつなぎ言葉はどれ？ 雪がたくさんふりました。（　）、学校が休みになりました。", correct: "だから", wrongs: ["しかし", "なぜなら", "たとえば"], explanation: "雪が理由で休みになったので「だから」が合います。" },
    { prompt: "（　）に入るつなぎ言葉はどれ？ 電気を消しました。（　）、部屋が暗くなりました。", correct: "だから", wrongs: ["しかし", "なぜなら", "それとも"], explanation: "消したことが理由で暗くなったので「だから」が合います。" },
    { prompt: "（　）に入るつなぎ言葉はどれ？ のどがかわきました。（　）、水を飲みました。", correct: "だから", wrongs: ["しかし", "たとえば", "それとも"], explanation: "かわいたことが理由で飲んだので「だから」が合います。" }
  ]);

  // F2 しかし(逆接)(drill, d2)
  fam({
    curriculumArea: area,
    familyId: "ja_conn_but",
    funMechanic: "drill",
    learningObjective: "前と反対の内容が続くとき「しかし」を使える",
    commonMistake: "順当な結果なのに「しかし」を選んでしまう",
    estimatedSeconds: 60,
    skillTags: ["接続語", "文のつながり"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 }
  }, [
    { prompt: "（　）に入るつなぎ言葉はどれ？ 走って学校へ行きました。（　）、少しおくれてしまいました。", correct: "しかし", wrongs: ["だから", "そして", "なぜなら"], explanation: "走ったのにおくれた、と反対の内容が続くので「しかし」が合います。" },
    { prompt: "（　）に入るつなぎ言葉はどれ？ 早く家を出ました。（　）、電車にまにあいませんでした。", correct: "しかし", wrongs: ["だから", "そして", "たとえば"], explanation: "早く出たのに間に合わない、と反対の結果なので「しかし」が合います。" },
    { prompt: "（　）に入るつなぎ言葉はどれ？ 一生けんめい走りました。（　）、一番にはなれませんでした。", correct: "しかし", wrongs: ["だから", "そして", "また"], explanation: "がんばったのに一番になれない、と反対の結果なので「しかし」が合います。" },
    { prompt: "（　）に入るつなぎ言葉はどれ？ 空は晴れていました。（　）、風はとても冷たかったです。", correct: "しかし", wrongs: ["だから", "なぜなら", "それとも"], explanation: "晴れなのに冷たい、と反対の内容が続くので「しかし」が合います。" },
    { prompt: "（　）に入るつなぎ言葉はどれ？ 何回もさがしました。（　）、かぎは見つかりませんでした。", correct: "しかし", wrongs: ["だから", "そして", "たとえば"], explanation: "さがしたのに見つからない、と反対の結果なので「しかし」が合います。" }
  ]);

  // F3 そのほかのつなぎ言葉(drill, d2)
  fam({
    curriculumArea: area,
    familyId: "ja_conn_others",
    funMechanic: "drill",
    learningObjective: "そして・なぜなら・それとも・たとえばを場面に合わせて使える",
    commonMistake: "「なぜなら」と「だから」の向きを逆にする",
    estimatedSeconds: 60,
    skillTags: ["接続語", "文のつながり"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 }
  }, [
    { prompt: "（　）に入るつなぎ言葉はどれ？ 朝ごはんを食べました。（　）、歯をみがきました。", correct: "そして", wrongs: ["しかし", "なぜなら", "それとも"], explanation: "したことを順につなぐので「そして」が合います。" },
    { prompt: "（　）に入るつなぎ言葉はどれ？ ぼくは犬が好きです。（　）、毎日さんぽをするのが楽しいからです。", correct: "なぜなら", wrongs: ["だから", "しかし", "そして"], explanation: "後の文が理由を説明しているので「なぜなら」が合います。" },
    { prompt: "（　）に入るつなぎ言葉はどれ？ りんごにしますか。（　）、みかんにしますか。", correct: "それとも", wrongs: ["だから", "しかし", "そして"], explanation: "どちらかを選ぶときは「それとも」が合います。" },
    { prompt: "（　）に入るつなぎ言葉はどれ？ くだものが好きです。（　）、りんごやみかんです。", correct: "たとえば", wrongs: ["しかし", "だから", "それとも"], explanation: "れいをあげて説明するので「たとえば」が合います。" }
  ]);

  // F4 続きの文を選ぶ(inference, d3)
  fam({
    curriculumArea: area,
    familyId: "ja_conn_continuation",
    funMechanic: "inference",
    learningObjective: "つなぎ言葉から、続く内容を予想して選べる",
    commonMistake: "つなぎ言葉を見ずに、ありそうな文を選んでしまう",
    estimatedSeconds: 90,
    skillTags: ["接続語", "文のつながり", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "続きに合う文はどれ？ 「雨がふってきた。だから、___」", correct: "かさをさした。", wrongs: ["雨がやんだ。", "かさをなくした。", "雨は音がする。"], explanation: "「だから」の後には、雨がふった結果としてすることが続きます。" },
    { prompt: "続きに合う文はどれ？ 「たくさん練習した。しかし、___」", correct: "しあいに負けてしまった。", wrongs: ["しあいに勝てた。", "練習は大事だ。", "もっと練習した。"], explanation: "「しかし」の後には、練習したのに、という反対の結果が続きます。" },
    { prompt: "続きに合う文はどれ？ 「宿題が終わった。そして、___」", correct: "おふろに入った。", wrongs: ["宿題がむずかしい。", "宿題が始まった。", "まだ終わらない。"], explanation: "「そして」の後には、次にしたことが順番に続きます。" },
    { prompt: "続きに合う文はどれ？ 「ぼくは犬をかいたい。なぜなら、___」", correct: "動物が大すきだからだ。", wrongs: ["犬は走るのが速い。", "ねこもかわいい。", "きのう公園に行った。"], explanation: "「なぜなら」の後には理由が続き、「〜からだ」で終わることが多いです。" },
    { prompt: "続きに合う文はどれ？ 「公園に行く？それとも、___」", correct: "家であそぶ？", wrongs: ["公園は広い。", "きのう行ったよ。", "くつをはこう。"], explanation: "「それとも」の後には、もう1つのえらぶ内容が続きます。" }
  ]);

  // F5 まちがい直し(find_mistake, d3)
  fam({
    curriculumArea: area,
    familyId: "ja_conn_fix",
    funMechanic: "find_mistake",
    learningObjective: "文の内容に合わないつなぎ言葉に気づいて直せる",
    commonMistake: "文のつながりを読まずに、そのまま正しいと思う",
    estimatedSeconds: 90,
    skillTags: ["接続語", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "「大雨がふった。しかし、遠足は中止になった。」のつなぎ言葉を正しく直すと、どれ？", correct: "だから", wrongs: ["しかしで正しい", "たとえば", "それとも"], explanation: "大雨が理由で中止という順当な結果なので「だから」です。" },
    { prompt: "「ねぼうした。だから、学校にまにあった。」のつなぎ言葉を正しく直すと、どれ？", correct: "しかし", wrongs: ["だからで正しい", "なぜなら", "たとえば"], explanation: "ねぼうしたのに間に合った、と反対の結果なので「しかし」です。" },
    { prompt: "「わたしはねこが好きだ。それとも、毛がふわふわだからだ。」のつなぎ言葉を正しく直すと、どれ？", correct: "なぜなら", wrongs: ["それともで正しい", "しかし", "そして"], explanation: "後の文が理由なので「なぜなら」です。" },
    { prompt: "「くだものが好きだ。しかし、りんごやバナナだ。」のつなぎ言葉を正しく直すと、どれ？", correct: "たとえば", wrongs: ["しかしで正しい", "それとも", "なぜなら"], explanation: "れいをあげているので「たとえば」です。" },
    { prompt: "「手をあらった。なぜなら、ごはんを食べた。」のつなぎ言葉を正しく直すと、どれ？", correct: "そして", wrongs: ["なぜならで正しい", "しかし", "それとも"], explanation: "したことが順につながっているので「そして」です。" }
  ]);

  // F6 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    curriculumArea: area,
    familyId: "ja_conn_judge",
    funMechanic: "judge_claim",
    learningObjective: "つなぎ言葉のはたらきについての主張を判断できる",
    commonMistake: "「だから」と「なぜなら」のはたらきを混同する",
    estimatedSeconds: 90,
    skillTags: ["接続語"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「『だから』の前には理由がくる」。みお「『しかし』の前と後は反対の内容になる」。正しいのはどっち？", correct: "二人とも正しい", explanation: "「だから」は理由→結果、「しかし」は反対の内容をつなぎます。" },
    { prompt: "「そして」について。はると「前と後で反対のことをつなぐ」。みお「ものごとを順につなぐ」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "「そして」は順につなぐ言葉です。反対をつなぐのは「しかし」です。" },
    { prompt: "はると「『なぜなら』の後は『〜からです』で終わることが多い」。みお「『なぜなら』の後に理由を書いてはいけない」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "「なぜなら」の後には理由がきて、「〜からです」で終わることが多いです。" },
    { prompt: "はると「どのつなぎ言葉を使っても意味は同じ」。みお「つなぎ言葉をかえると、文の意味が変わることがある」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "「だから勝った」と「しかし負けた」のように、つなぎ言葉で意味が変わります。" }
  ]);

  // F7 2つの文をつなぐ順(reorder, d4)
  fam({
    curriculumArea: area,
    familyId: "ja_conn_reorder",
    funMechanic: "reorder",
    learningObjective: "理由→結果の順を考えて、2つの文をつなげられる",
    commonMistake: "結果を先に、理由を後に置いてしまう",
    estimatedSeconds: 90,
    skillTags: ["接続語", "ならべ替え"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 2 }
  }, [
    { prompt: "「大雪がふった」「学校が休みになった」を「だから」でつなぐとき、正しいのはどれ？", correct: "大雪がふった。だから、学校が休みになった。", wrongs: ["学校が休みになった。だから、大雪がふった。", "どちらの順でも正しい", "この2つはつなげない"], explanation: "理由(大雪)が先、結果(休み)が後です。" },
    { prompt: "「ねつが出た」「学校を休んだ」を「だから」でつなぐとき、正しいのはどれ？", correct: "ねつが出た。だから、学校を休んだ。", wrongs: ["学校を休んだ。だから、ねつが出た。", "どちらの順でも正しい", "この2つはつなげない"], explanation: "理由(ねつ)が先、結果(休んだ)が後です。" },
    { prompt: "「スイッチをおした」「電気がついた」を「だから」でつなぐとき、正しいのはどれ？", correct: "スイッチをおした。だから、電気がついた。", wrongs: ["電気がついた。だから、スイッチをおした。", "どちらの順でも正しい", "この2つはつなげない"], explanation: "スイッチをおしたのが理由で、電気がついたのが結果です。理由が先にきます。" }
  ]);

  // F8 つなぎ言葉のはたらき(rule_discovery, d3)
  fam({
    curriculumArea: area,
    familyId: "ja_conn_rule",
    funMechanic: "rule_discovery",
    learningObjective: "つなぎ言葉のはたらき(理由・れい・反対・選ぶ)を整理できる",
    commonMistake: "「たとえば」の後に理由を続けてしまう",
    estimatedSeconds: 75,
    skillTags: ["接続語", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "「たとえば」のあとに続くものはどれ？", correct: "具体的なれい", wrongs: ["理由", "反対のこと", "あいさつ"], explanation: "「たとえば」は、れいをあげて説明するときに使います。" },
    { prompt: "「なぜなら」のあとに続くものはどれ？", correct: "理由", wrongs: ["具体的なれい", "反対のこと", "次にしたこと"], explanation: "「なぜなら」のあとには理由が続きます。" },
    { prompt: "前の文と反対の内容をつなぐ言葉はどれ？", correct: "しかし", wrongs: ["だから", "そして", "たとえば"], explanation: "反対の内容をつなぐのは「しかし」です。" },
    { prompt: "二つのうちどちらかを選ぶときに使う言葉はどれ？", correct: "それとも", wrongs: ["だから", "また", "なぜなら"], explanation: "「AにしますかそれともBにしますか」のように、選ぶときに使います。" }
  ]);

  if (questions.length !== 35) throw new Error(`connectives: expected 35, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- ローマ字(35)
function makeRomaji() {
  const { questions, fam } = makeFamilyBuilder("romaji");

  // F1 ローマ字→ひらがな(drill, d1)
  fam({
    familyId: "ja_roma_read",
    funMechanic: "drill",
    learningObjective: "ローマ字1文字分をひらがなに直せる",
    commonMistake: "同じ行のちがう段と読みまちがえる",
    estimatedSeconds: 30,
    skillTags: ["ローマ字", "読み"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "ローマ字「ka」の読みはどれ？", correct: "か", wrongs: ["き", "く", "け"], explanation: "kaは「か」です。k+aで、か行のあ段の音になります。" },
    { prompt: "ローマ字「shi」の読みはどれ？", correct: "し", wrongs: ["さ", "す", "せ"], explanation: "shiは「し」です。siと書くこともあります。" },
    { prompt: "ローマ字「tsu」の読みはどれ？", correct: "つ", wrongs: ["た", "ち", "て"], explanation: "tsuは「つ」です。tuと書くこともあります。" },
    { prompt: "ローマ字「fu」の読みはどれ？", correct: "ふ", wrongs: ["は", "ひ", "ほ"], explanation: "fuは「ふ」です。huと書くこともあります。" },
    { prompt: "ローマ字「no」の読みはどれ？", correct: "の", wrongs: ["な", "ぬ", "ね"], explanation: "noは「の」です。n+oで、な行のお段の音になります。" }
  ]);

  // F2 ひらがな→ローマ字(drill, d1)
  fam({
    familyId: "ja_roma_write",
    funMechanic: "drill",
    learningObjective: "ひらがな1文字をローマ字で書ける",
    commonMistake: "母音(a,i,u,e,o)を取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["ローマ字", "書き"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "「に」をローマ字で書くと、どれ？", correct: "ni", wrongs: ["na", "nu", "ne"], explanation: "「に」はniです。n+iで書きます。" },
    { prompt: "「ほ」をローマ字で書くと、どれ？", correct: "ho", wrongs: ["ha", "he", "hu"], explanation: "「ほ」はhoです。h+oで書きます。" },
    { prompt: "「め」をローマ字で書くと、どれ？", correct: "me", wrongs: ["ma", "mi", "mo"], explanation: "「め」はmeです。m+eで書きます。" },
    { prompt: "「ろ」をローマ字で書くと、どれ？", correct: "ro", wrongs: ["ra", "ru", "re"], explanation: "「ろ」はroです。r+oで書きます。" },
    { prompt: "「わ」をローマ字で書くと、どれ？", correct: "wa", wrongs: ["wo", "ya", "a"], explanation: "「わ」はwaです。w+aで書きます。" }
  ]);

  // F3 単語を読む(drill, d2)
  fam({
    familyId: "ja_roma_read_word",
    funMechanic: "drill",
    learningObjective: "ローマ字で書かれた言葉を読める",
    commonMistake: "1文字ずつ区切らず、まとめて読みまちがえる",
    estimatedSeconds: 60,
    skillTags: ["ローマ字", "読み", "単語"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 }
  }, [
    { prompt: "ローマ字「neko」と書いてある言葉はどれ？", correct: "ねこ", wrongs: ["ねく", "なこ", "のこ"], explanation: "ne(ね)+ko(こ)で「ねこ」です。" },
    { prompt: "ローマ字「inu」と書いてある言葉はどれ？", correct: "いぬ", wrongs: ["いね", "うぬ", "えぬ"], explanation: "i(い)+nu(ぬ)で「いぬ」です。" },
    { prompt: "ローマ字「sora」と書いてある言葉はどれ？", correct: "そら", wrongs: ["さら", "すり", "せろ"], explanation: "so(そ)+ra(ら)で「そら」です。" },
    { prompt: "ローマ字「umi」と書いてある言葉はどれ？", correct: "うみ", wrongs: ["いみ", "うま", "おみ"], explanation: "u(う)+mi(み)で「うみ」です。" }
  ]);

  // F4 正しいつづりを選ぶ(best_choice, d2-d3)
  fam({
    familyId: "ja_roma_spelling",
    funMechanic: "best_choice",
    learningObjective: "言葉の正しいローマ字のつづりを選べる",
    commonMistake: "母音をぬかしたり、じゅんばんを入れかえたりする",
    estimatedSeconds: 75,
    skillTags: ["ローマ字", "書き", "単語"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "「さかな」の正しい書き方はどれ？", correct: "sakana", wrongs: ["sakena", "sagana", "skana"], explanation: "sa+ka+naで「sakana」です。" },
    { prompt: "「たいこ」の正しい書き方はどれ？", correct: "taiko", wrongs: ["teiko", "taika", "taigo"], explanation: "ta+i+koで「taiko」です。" },
    { prompt: "「ひまわり」の正しい書き方はどれ？", correct: "himawari", wrongs: ["himawali", "hemawari", "himaweri"], explanation: "hi+ma+wa+riで「himawari」です。「り」はraの仲間のriです。" },
    { prompt: "「くるま」の正しい書き方はどれ？", correct: "kuruma", wrongs: ["kurama", "koruma", "kurumo"], explanation: "ku+ru+maで「kuruma」です。" },
    { prompt: "「ゆき」の正しい書き方はどれ？", correct: "yuki", wrongs: ["yugi", "uki", "yuke"], explanation: "yu(ゆ)+ki(き)で「yuki」と書きます。" }
  ]);

  // F5 つまる音・はねる音(inference, d3-d4)
  fam({
    familyId: "ja_roma_special",
    funMechanic: "inference",
    learningObjective: "小さい「っ」やはねる音「ん」のローマ字のきまりを使って書ける",
    commonMistake: "小さい「っ」を書きわすれる(kite=きて)",
    estimatedSeconds: 90,
    skillTags: ["ローマ字", "つまる音", "はねる音"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "「きって」の正しい書き方はどれ？", correct: "kitte", wrongs: ["kite", "kitute", "kito"], explanation: "小さい「っ」は、次の文字(t)を重ねて書きます。kitteです。" },
    { prompt: "「ほん」の正しい書き方はどれ？", correct: "hon", wrongs: ["ho", "honn", "hn"], explanation: "はねる音「ん」はnで書きます。ho+nで「hon」です。" },
    { prompt: "「てんき」の正しい書き方はどれ？", correct: "tenki", wrongs: ["teki", "tennki", "tenke"], explanation: "「ん」はn1つで書きます。te+n+kiで「tenki」です。" },
    { prompt: "「らっぱ」の正しい書き方はどれ？", correct: "rappa", wrongs: ["rapa", "ratsupa", "rappo"], explanation: "小さい「っ」は、次の文字(p)を重ねます。rappaです。" },
    { prompt: "「きんぎょ」の正しい書き方はどれ？", correct: "kingyo", wrongs: ["kingo", "kinngyo", "kigyo"], explanation: "「ぎょ」はgyoと書きます。ki+n+gyoで「kingyo」です。" }
  ]);

  // F6 まちがい直し(find_mistake, d3)
  fam({
    familyId: "ja_roma_fix",
    funMechanic: "find_mistake",
    learningObjective: "ローマ字の書きまちがいに気づいて直せる",
    commonMistake: "文字のじゅんばんの入れかわりに気づかない",
    estimatedSeconds: 90,
    skillTags: ["ローマ字", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「さかな」を「sakena」と書きました。正しく直すと、どれ？", correct: "sakana", wrongs: ["sakenaで正しい", "sagana", "sakina"], explanation: "「か」はkaです。sakanaが正しいです。" },
    { prompt: "みおさんは「かに」を「kain」と書きました。正しく直すと、どれ？", correct: "kani", wrongs: ["kainで正しい", "kian", "kni"], explanation: "ka+niの順で「kani」です。文字のじゅんばんに気をつけます。" },
    { prompt: "はるとさんは「あめ」を「mae」と書きました。正しく直すと、どれ？", correct: "ame", wrongs: ["maeで正しい", "eam", "aem"], explanation: "a(あ)+me(め)で「ame」です。maeだと「まえ」になってしまいます。" },
    { prompt: "みおさんは「うさぎ」を「usaji」と書きました。正しく直すと、どれ？", correct: "usagi", wrongs: ["usajiで正しい", "usagy", "uzagi"], explanation: "「ぎ」はgiです。jiだと「じ」になってしまいます。" }
  ]);

  // F7 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "ja_roma_judge",
    funMechanic: "judge_claim",
    learningObjective: "ローマ字には書き方が2つある文字があることを知っている",
    commonMistake: "shi/siのどちらかをまちがいだと思いこむ",
    estimatedSeconds: 75,
    skillTags: ["ローマ字", "きまり"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "「し」の書き方。はると「『し』はローマ字では書けない」。みお「shiだけが正しい」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "「し」はsiとshiの2つの書き方があり、どちらも使われます。" },
    { prompt: "はると「のばす音には記号(^など)をつけて書くことがある」。みお「のばす音は書かなくてよい」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "「おかあさん」のようなのばす音は、記号をつけて表すことがあります。" },
    { prompt: "はると「ローマ字は日本語には使えない」。みお「ローマ字で書けるのは英語だけ」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "ローマ字は日本語の音を書き表す文字なので、地名や人の名前も書けます。" }
  ]);

  // F8 行と段のきまり(rule_discovery, d3)
  fam({
    familyId: "ja_roma_rule",
    funMechanic: "rule_discovery",
    learningObjective: "ローマ字の行(子音)と段(母音)のしくみに気づける",
    commonMistake: "行と段の組み合わせを1つずつ丸おぼえしようとする",
    estimatedSeconds: 75,
    skillTags: ["ローマ字", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "ma、mi、mu、me、mo に共通して入っている文字はどれ？", correct: "m", wrongs: ["a", "i", "o"], explanation: "ま行はぜんぶmで始まります。行ごとに決まった文字があります。" },
    { prompt: "ka、ki、ku、ke、ko のならびは、ひらがなのどの行？", correct: "か行", wrongs: ["さ行", "た行", "は行"], explanation: "kで始まるのはか行(か・き・く・け・こ)です。" },
    { prompt: "ka、sa、ta、na のように「a」で終わる音は、五十音のどの段？", correct: "「あ」の段", wrongs: ["「い」の段", "「う」の段", "「お」の段"], explanation: "aで終わる音は、か・さ・た・なのような「あ」の段です。" },
    { prompt: "「く」はku、「む」はmu、「ふ」はfuです。この3つに共通する文字はどれ？", correct: "u", wrongs: ["k", "m", "f"], explanation: "どれも「う」の段なので、uで終わります。" }
  ]);

  if (questions.length !== 35) throw new Error(`romaji: expected 35, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- 言葉の意味(25)
function makeVocabulary() {
  const { questions, fam } = makeFamilyBuilder("vocabulary");

  // F1 言葉の仲間分け(drill, d2)
  fam({
    familyId: "ja_vocab_kind",
    funMechanic: "drill",
    learningObjective: "言葉を、気持ち・動き・形などの仲間に分けられる",
    commonMistake: "言葉の意味ではなく、音のひびきで仲間を選ぶ",
    estimatedSeconds: 45,
    skillTags: ["語彙", "言葉の仲間"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "「うれしい」はどんな仲間の言葉？", correct: "気持ちを表す言葉", wrongs: ["動きを表す言葉", "形を表す言葉", "数を表す言葉"], explanation: "「うれしい」は心の中のようすを表す、気持ちの言葉です。" },
    { prompt: "「走る」はどんな仲間の言葉？", correct: "動きを表す言葉", wrongs: ["気持ちを表す言葉", "色を表す言葉", "場所を表す言葉"], explanation: "「走る」は体の動きを表す言葉です。「歩く」「とぶ」も同じ仲間です。" },
    { prompt: "「丸い」はどんな仲間の言葉？", correct: "形を表す言葉", wrongs: ["動きを表す言葉", "時を表す言葉", "人を表す言葉"], explanation: "「丸い」はものの形を表す言葉です。「四角い」「細長い」も同じ仲間です。" },
    { prompt: "「あした」はどんな仲間の言葉？", correct: "時を表す言葉", wrongs: ["形を表す言葉", "動きを表す言葉", "気持ちを表す言葉"], explanation: "「あした」はいつのことかを表す、時の言葉です。" },
    { prompt: "「校庭」はどんな仲間の言葉？", correct: "場所を表す言葉", wrongs: ["時を表す言葉", "色を表す言葉", "気持ちを表す言葉"], explanation: "「校庭」はどこかを表す、場所の言葉です。" }
  ]);

  // F2 にた意味の言葉(drill, d2)
  fam({
    familyId: "ja_vocab_similar",
    funMechanic: "drill",
    learningObjective: "にた意味の言葉(るいぎ語)を見つけられる",
    commonMistake: "反対の意味の言葉を選んでしまう",
    estimatedSeconds: 45,
    skillTags: ["語彙", "にた意味"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "「きれい」とにた意味の言葉はどれ？", correct: "うつくしい", wrongs: ["きたない", "おおきい", "まるい"], explanation: "「きれい」と「うつくしい」はにた意味です。" },
    { prompt: "「びっくりする」とにた意味の言葉はどれ？", correct: "おどろく", wrongs: ["わらう", "ねむる", "おこる"], explanation: "「びっくりする」と「おどろく」はにた意味です。" },
    { prompt: "「しゃべる」とにた意味の言葉はどれ？", correct: "話す", wrongs: ["聞く", "書く", "だまる"], explanation: "「しゃべる」と「話す」はにた意味です。" },
    { prompt: "「こわい」とにた意味の言葉はどれ？", correct: "おそろしい", wrongs: ["たのしい", "やさしい", "めずらしい"], explanation: "「こわい」と「おそろしい」はにた意味です。" },
    { prompt: "「たいせつ」とにた意味の言葉はどれ？", correct: "だいじ", wrongs: ["じゃま", "ふつう", "きけん"], explanation: "「たいせつ」と「だいじ」はにた意味です。" }
  ]);

  // F3 ようすの言葉(オノマトペ)(best_choice, d3)
  fam({
    familyId: "ja_vocab_onomatopoeia",
    funMechanic: "best_choice",
    learningObjective: "場面に合うようすの言葉(オノマトペ)を選べる",
    commonMistake: "音のようすと光のようすの言葉を混同する",
    estimatedSeconds: 60,
    skillTags: ["語彙", "ようすの言葉"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "文に合う言葉はどれ？「雨が___と、はげしくふってきた。」", correct: "ざあざあ", wrongs: ["しとしと", "ぱらぱら", "ちらちら"], explanation: "はげしい雨は「ざあざあ」です。「しとしと」は静かな雨に使います。" },
    { prompt: "文に合う言葉はどれ？「星が___と光っている。」", correct: "きらきら", wrongs: ["ざらざら", "べたべた", "ごろごろ"], explanation: "光がまたたくようすは「きらきら」と表します。" },
    { prompt: "文に合う言葉はどれ？「かみなりが___と鳴っている。」", correct: "ごろごろ", wrongs: ["きらきら", "さらさら", "ふわふわ"], explanation: "かみなりの音は「ごろごろ」と表します。" },
    { prompt: "文に合う言葉はどれ？「風船が___とうかんでいる。」", correct: "ふわふわ", wrongs: ["ごつごつ", "どんどん", "ぺこぺこ"], explanation: "軽くうかぶようすは「ふわふわ」です。" }
  ]);

  // F4 仲間はずれさがし(rule_discovery, d3)
  fam({
    familyId: "ja_vocab_odd",
    funMechanic: "rule_discovery",
    learningObjective: "言葉の共通点を見つけて、仲間はずれに気づける",
    commonMistake: "見た目や音のにた言葉を同じ仲間だと思う",
    estimatedSeconds: 75,
    skillTags: ["語彙", "なかま分け", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "仲間はずれの言葉はどれ？（うれしい・楽しい・かなしい・つくえ）", correct: "つくえ", wrongs: ["うれしい", "楽しい", "かなしい"], explanation: "「つくえ」だけがものの名前で、ほかは気持ちを表す言葉です。" },
    { prompt: "仲間はずれの言葉はどれ？（走る・とぶ・およぐ・赤い）", correct: "赤い", wrongs: ["走る", "とぶ", "およぐ"], explanation: "「赤い」だけが色を表す言葉で、ほかは動きを表す言葉です。" },
    { prompt: "仲間はずれの言葉はどれ？（りんご・バナナ・みかん・くだもの）", correct: "くだもの", wrongs: ["りんご", "バナナ", "みかん"], explanation: "「くだもの」は仲間ぜんたいの名前で、ほかは1つ1つの名前です。" }
  ]);

  // F5 文から意味を考える(inference, d4)
  fam({
    familyId: "ja_vocab_infer",
    funMechanic: "inference",
    learningObjective: "文の前後から、言葉の意味を推測できる",
    commonMistake: "知らない言葉が出ると考えずにあきらめてしまう",
    estimatedSeconds: 90,
    skillTags: ["語彙", "文脈", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "「妹はピアノがけっこううまい」の「けっこう」の意味に近いのはどれ？", correct: "なかなか", wrongs: ["まったく", "すこしも", "ぜんぜん"], explanation: "「けっこううまい」は「なかなかうまい」という意味です。" },
    { prompt: "「雨があがったので外に出た」の「あがる」の意味に近いのはどれ？", correct: "やむ", wrongs: ["ふりはじめる", "つよくなる", "上にのぼる"], explanation: "「雨があがる」は「雨がやむ」という意味です。" },
    { prompt: "「時間をまもって集合する」の「まもる」の意味に近いのはどれ？", correct: "やくそくどおりにする", wrongs: ["たたかう", "かくす", "わすれる"], explanation: "「時間をまもる」は、決めた時間のとおりにすることです。" },
    { prompt: "「そうじを手つだってと、姉に手をかす」の「手をかす」の意味に近いのはどれ？", correct: "手つだう", wrongs: ["手をあらう", "手をにぎる", "手をたたく"], explanation: "「手をかす」は「手つだう」という意味の言い方です。" }
  ]);

  // F6 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "ja_vocab_judge",
    funMechanic: "judge_claim",
    learningObjective: "言葉の意味についての主張を判断できる",
    commonMistake: "同じ音の言葉は意味も1つだと思いこむ",
    estimatedSeconds: 75,
    skillTags: ["語彙"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "「ながめる」の意味。はると「ちらっと見ること」。みお「ゆっくりと見ること」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "「ながめる」は、けしきなどをゆっくり見ることです。" },
    { prompt: "「こしょう」の意味。はると「きかいがこわれて動かないこと」。みお「りょうりに使う、からいこな」。正しいのはどっち？", correct: "二人とも正しい", explanation: "「こしょう」には、こわれる意味と、こなの調味料の意味の両方があります。" }
  ]);

  // F7 使い方のまちがいさがし(find_mistake, d4)
  fam({
    familyId: "ja_vocab_fix",
    funMechanic: "find_mistake",
    learningObjective: "言葉の使い方がおかしい文に気づける",
    commonMistake: "文の形が正しければ意味も正しいと思ってしまう",
    estimatedSeconds: 90,
    skillTags: ["語彙", "たしかめ"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "言葉の使い方がまちがっている文はどれ？", correct: "ざあざあと星が光る。", wrongs: ["うつくしい花がさく。", "おいしいケーキを食べる。", "つめたい水を飲む。"], explanation: "「ざあざあ」ははげしい雨の音です。星が光るのは「きらきら」です。" },
    { prompt: "「かるい」の使い方がまちがっている文はどれ？", correct: "かるい水を飲む。", wrongs: ["かるいかばんを持つ。", "かるい気持ちで言う。", "かるい石ころをひろう。"], explanation: "水の味やようすに「かるい」は使いません。重さのあるものに使います。" }
  ]);

  if (questions.length !== 25) throw new Error(`vocabulary: expected 25, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- 物語を読む(25)
function makeStoryReading() {
  const { questions, fam } = makeFamilyBuilder("story_reading");
  const area = "読むこと";

  const MINA = "ミナは新しいノートを持って学校へ行きました。休み時間、となりの席の友だちがノートをわすれて困っていました。ミナは少しまよいましたが、自分のノートを半分使っていいよと言いました。";
  const SOTA = "朝、ソウタは金魚にえさをあげる係でした。ところが、急いでいてわすれてしまいました。帰ってから気づいたソウタは、金魚の前で小さな声でごめんねと言いました。";
  const RIKO = "リコは発表の前に手が少しふるえました。でも、練習した紙を見て深呼吸をしました。名前を呼ばれると、リコは前を向いて一歩進みました。";
  const KEN = "ケンは雨の日があまり好きではありませんでした。でも、庭の葉に雨つぶが光っているのを見つけると、少しだけ雨の日もいいなと思いました。";
  const NAO = "ナオは友だちと同じ本を読みました。友だちはおもしろかったと言いましたが、ナオは少しむずかしいと思いました。二人は好きな場面を話し合うことにしました。";
  const HARUKA = "ハルカは家族と山にのぼりました。とちゅうで足がいたくなりましたが、山の上から見えた海がとてもきれいで、のぼってよかったと思いました。";
  const TAKESHI = "タケシは弟とつみ木で高いとうを作っていました。あと少しで完成という時、とうがくずれてしまいました。タケシはがっかりしましたが、弟が「もう一回作ろう」と言ったので、二人でまた作り始めました。";
  const AYA = "アヤは新しいクラスでまだ友だちがいませんでした。休み時間、となりの子が「いっしょに本を読もう」とさそってくれました。アヤはうれしくて、少し元気が出ました。";
  const YUTO = "ユウトは金曜日にわすれ物をしないよう、前の夜にランドセルをじゅんびしました。次の朝、あわてずに家を出ることができました。";
  const SAKI = "サキは絵をかくのが苦手でした。でも、先生が「線が生き生きしているね」とほめてくれたので、もっとかいてみたくなりました。";
  const KEITA = "雨の日、ケイタは長ぐつをはいて学校へ行きました。水たまりをよけて歩いていると、小さなカエルが道にいました。ケイタはカエルをそっと草むらへにがしました。";
  const RYO = "リョウはリレーの選手に選ばれました。うれしい気持ちの一方で、うまく走れるか少し心配にもなりました。それでも、毎日少しずつ練習することにしました。";

  const meta = (familyId, funMechanic, learningObjective, commonMistake, axes, estimatedSeconds = 90) => ({
    curriculumArea: area,
    familyId,
    funMechanic,
    learningObjective,
    commonMistake,
    estimatedSeconds,
    skillTags: ["物語読解"],
    axes
  });

  // F1 気持ちの読み取り(inference, d3)
  fam(meta(
    "ja_story_feeling", "inference",
    "登場人物の気持ちを、行動やようすから読み取れる",
    "自分の気持ちを、登場人物の気持ちだと思って答える",
    { knowledge: 1, info: 3, steps: 2, format: 2, choices: 2 }
  ), [
    { prompt: `${MINA}\n\nミナの気持ちとしていちばん近いものはどれ？`, correct: "友だちを助けたい", wrongs: ["ノートをかくしたい", "早く帰りたい", "遊びたくない"], explanation: "友だちが困っているのを見て、ミナは助けようとしています。" },
    { prompt: `${RIKO}\n\nリコのようすとして合うものはどれ？`, correct: "きんちょうしながらもがんばろうとしている", wrongs: ["発表をまったく気にしていない", "友だちを笑わせたい", "すぐに帰りたい"], explanation: "手がふるえているのできんちょうしていますが、前に進んでいます。" },
    { prompt: `${HARUKA}\n\nハルカの気持ちとして合うものはどれ？`, correct: "がんばってのぼってよかった", wrongs: ["早く帰りたかった", "山がきらいになった", "海を見たくなかった"], explanation: "足がいたくても、きれいな海を見て「よかった」と感じています。" },
    { prompt: `${SAKI}\n\n先生にほめられて、サキはどう思った？`, correct: "もっとかいてみたい", wrongs: ["もう絵をやめたい", "先生がこわい", "早く帰りたい"], explanation: "ほめられたことで、サキはもっとかきたくなっています。" },
    { prompt: `${RYO}\n\nリョウのようすとして合うものはどれ？`, correct: "うれしさと心配の両方を感じている", wrongs: ["まったく気にしていない", "走るのをやめたい", "おこっている"], explanation: "うれしい気持ちと心配な気持ちの両方をもっています。" }
  ]);

  // F2 理由の読み取り(inference, d3)
  fam(meta(
    "ja_story_reason", "inference",
    "登場人物がそうした理由を、文章から読み取れる",
    "書かれていない理由を想像でおぎなってしまう",
    { knowledge: 1, info: 3, steps: 2, format: 2, choices: 2 }
  ), [
    { prompt: `${SOTA}\n\nソウタはどうして「ごめんね」と言ったの？`, correct: "えさをあげるのをわすれたから", wrongs: ["金魚を見つけたから", "朝早く起きたから", "友だちに会ったから"], explanation: "係だったのにえさをあげわすれたので、もうしわけなく思っています。" },
    { prompt: `${YUTO}\n\nユウトが前の夜にランドセルをじゅんびしたのはなぜ？`, correct: "わすれ物をしないため", wrongs: ["早くねるため", "友だちに会うため", "そうじをするため"], explanation: "わすれ物をしないように、前の夜にじゅんびしています。" },
    { prompt: "ゆうごはんの前、ミカは音を立てずにそっと戸をしめました。となりのへやで、あかちゃんがねむっていたからです。\n\nミカが音を立てなかったのはなぜ？", correct: "あかちゃんがねむっていたから", wrongs: ["戸がこわれていたから", "おなかがすいていたから", "音が好きではないから"], explanation: "あかちゃんを起こさないように、そっと戸をしめました。" },
    { prompt: "タクはかさを2本持って出かけました。1本は自分のため、もう1本は、かさを持っていない友だちに会うかもしれないと思ったからです。\n\nタクが2本目のかさを持ったのはなぜ？", correct: "友だちにかすため", wrongs: ["自分が2本使うため", "売るため", "こわれたときのため"], explanation: "かさのない友だちに会ったらかそうと考えています。" },
    { prompt: "レンはこわれた時計を直そうとしましたが、直せませんでした。それでもレンは笑って「中のしくみがよくわかったから、いいや」と言いました。\n\n直せなかったのに、レンが笑ったのはなぜ？", correct: "時計のしくみがわかってうれしかったから", wrongs: ["時計がきらいだったから", "本当は直せたから", "あたらしい時計を買ったから"], explanation: "直せなくても、しくみがわかったことをよろこんでいます。" }
  ]);

  // F3 できごとの読み取り(drill, d2)
  fam(meta(
    "ja_story_fact", "drill",
    "文章に書かれたできごとを正しく読み取れる",
    "さいごまで読まずに、とちゅうの内容で答える",
    { knowledge: 1, info: 3, steps: 1, format: 1, choices: 2 }, 75
  ), [
    { prompt: `${NAO}\n\n二人は次に何をすることにした？`, correct: "好きな場面を話し合う", wrongs: ["本をすてる", "けんかをする", "すぐ家に帰る"], explanation: "さいごの文に、好きな場面を話し合うことにしたとあります。" },
    { prompt: `${TAKESHI}\n\nとうがくずれたあと、二人はどうした？`, correct: "もう一度作り始めた", wrongs: ["つみ木をかたづけた", "けんかをした", "外へ遊びに行った"], explanation: "弟の言葉で、二人はまた作り始めています。" },
    { prompt: `${KEITA}\n\nケイタはカエルをどうした？`, correct: "草むらへにがした", wrongs: ["家へ持って帰った", "水たまりに入れた", "見ないで通りすぎた"], explanation: "ケイタはカエルをそっと草むらへにがしています。" }
  ]);

  // F4 根きょの言葉さがし(best_choice, d4)
  fam(meta(
    "ja_story_evidence", "best_choice",
    "気持ちやようすの根きょになる言葉を、文章の中から見つけられる",
    "答えの根きょではなく、印象にのこった言葉を選ぶ",
    { knowledge: 2, info: 3, steps: 2, format: 3, choices: 2 }, 120
  ), [
    { prompt: `${MINA}\n\nミナがまよったことがわかる言葉はどれ？`, correct: "少しまよいましたが", wrongs: ["新しいノート", "休み時間", "となりの席"], explanation: "「少しまよいましたが」という言葉から、まよったことがわかります。" },
    { prompt: `${RIKO}\n\nリコがきんちょうしていたことがわかる言葉はどれ？`, correct: "手が少しふるえました", wrongs: ["練習した紙", "名前を呼ばれると", "一歩進みました"], explanation: "手がふるえるのは、きんちょうしているようすです。" },
    { prompt: `${KEN}\n\nケンの気持ちが変わったきっかけはどれ？`, correct: "雨つぶが光っているのを見つけた", wrongs: ["雨の日が好きではなかった", "庭に出た", "雨がやんだ"], explanation: "雨つぶの光を見つけたことがきっかけで、気持ちが変わりました。" },
    { prompt: `${AYA}\n\nアヤに元気が出たきっかけはどれ？`, correct: "「いっしょに本を読もう」とさそわれた", wrongs: ["新しいクラスになった", "休み時間になった", "本を買った"], explanation: "となりの子にさそわれたことがきっかけで、元気が出ました。" }
  ]);

  // F5 できごとの順ならべ(reorder, d4)
  fam(meta(
    "ja_story_order", "reorder",
    "お話のできごとを、起きた順にならべられる",
    "文章に出てきた順ではなく、思いついた順にならべる",
    { knowledge: 2, info: 3, steps: 3, format: 3, choices: 2 }, 120
  ), [
    { prompt: "アオイは春にあさがおのたねをまき、毎日水をやりました。夏になると、青い花がたくさんさきました。秋、アオイはたねを取って、来年もまくことにしました。\n\nできごとの順として正しいのはどれ？", correct: "たねをまく → 花がさく → たねを取る", wrongs: ["花がさく → たねをまく → たねを取る", "たねを取る → たねをまく → 花がさく", "たねをまく → たねを取る → 花がさく"], explanation: "春にまく→夏にさく→秋に取る、の順です。" },
    { prompt: "ヒロは図書室できょうりゅうの本をかりました。家でゆっくり読むと、知らないことがたくさん書いてありました。次の日、ヒロはその本を友だちに教えてあげました。\n\nできごとの順として正しいのはどれ？", correct: "本をかりる → 家で読む → 友だちに教える", wrongs: ["家で読む → 本をかりる → 友だちに教える", "友だちに教える → 本をかりる → 家で読む", "本をかりる → 友だちに教える → 家で読む"], explanation: "かりる→読む→教える、の順に書かれています。" },
    { prompt: "ソラは公園で子ねこを見つけました。けがをしていたので、動物のお医者さんにつれて行きました。元気になった子ねこに、ソラは新しいかい主さんを見つけてあげました。\n\nできごとの順として正しいのはどれ？", correct: "見つける → お医者さんへ → かい主をさがす", wrongs: ["お医者さんへ → 見つける → かい主をさがす", "かい主をさがす → 見つける → お医者さんへ", "見つける → かい主をさがす → お医者さんへ"], explanation: "見つけて→治して→かい主を見つける、の順です。" }
  ]);

  // F6 あらすじのまちがいさがし(find_mistake, d4)
  fam(meta(
    "ja_story_summary_mistake", "find_mistake",
    "お話の内容と合わない説明に気づける",
    "書かれていないが、ありそうなことを正しいと思ってしまう",
    { knowledge: 2, info: 3, steps: 2, format: 3, choices: 2 }, 120
  ), [
    { prompt: `${TAKESHI}\n\nこのお話と合わないものはどれ？`, correct: "弟はあきらめて遊びに行った", wrongs: ["とうはあと少しで完成だった", "タケシはがっかりした", "二人はまた作り始めた"], explanation: "弟はあきらめず「もう一回作ろう」と言っています。" },
    { prompt: `${HARUKA}\n\nこのお話と合わないものはどれ？`, correct: "ハルカはとちゅうで山を下りた", wrongs: ["家族と山にのぼった", "とちゅうで足がいたくなった", "山の上から海が見えた"], explanation: "足がいたくなっても、ハルカは山の上までのぼっています。" },
    { prompt: `${SOTA}\n\nこのお話と合わないものはどれ？`, correct: "ソウタは朝、金魚にえさをあげた", wrongs: ["ソウタはえさやりの係だった", "ソウタは急いでいた", "ソウタは金魚にあやまった"], explanation: "ソウタは朝、えさをあげるのをわすれてしまいました。" }
  ]);

  // F7 解しゃくのどっちが正しい？(judge_claim, d4)
  fam(meta(
    "ja_story_judge", "judge_claim",
    "お話の内容を根きょに、どの読み方が正しいか判断できる",
    "文章にもどらず、印象だけで判断する",
    { knowledge: 2, info: 3, steps: 2, format: 3, choices: 1 }, 120
  ), [
    { prompt: `${KEN}\n\nはると「ケンは雨の日がきらいなまま終わった」。みお「ケンは雨の日が少し好きになった」。お話に合うのはどっち？`, correct: "みおだけ正しい", explanation: "さいごに「少しだけ雨の日もいいな」と思ったので、気持ちが変わっています。" },
    { prompt: `${NAO}\n\nはると「二人は同じ本を読んで、感じ方がちがった」。みお「二人とも本をむずかしいと思った」。お話に合うのはどっち？`, correct: "はるとだけ正しい", explanation: "友だちは「おもしろかった」、ナオは「むずかしい」と、感じ方がちがいました。" }
  ]);

  if (questions.length !== 25) throw new Error(`story_reading: expected 25, got ${questions.length}`);
  return questions;
}

const questions = [
  ...makeKanjiReading(),
  ...makeDictionary(),
  ...makeOnKun(),
  ...makePronouns(),
  ...makeConnectives(),
  ...makeRomaji(),
  ...makeVocabulary(),
  ...makeStoryReading()
];

if (questions.length !== 260) {
  throw new Error(`Expected 260 questions, got ${questions.length}`);
}

await mkdir(new URL("../src/data/questions/grade3/japanese/", import.meta.url), { recursive: true });
writeFileSync(outFile, `window.CHIBI_QUEST_JAPANESE_QUESTIONS = ${JSON.stringify(questions, null, 2)};\n`);
console.log(`Generated ${questions.length} Japanese questions`);

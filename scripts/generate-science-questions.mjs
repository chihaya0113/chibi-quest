import { writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";

const outFile = new URL("../src/data/questions/grade3/science/questions.js", import.meta.url);

const unitLabels = {
  nature_observation: "しぜんのかんさつ",
  plants_growth: "植物の育ち方",
  insects_growth: "こん虫の育ち方",
  wind_rubber: "ゴムと風の力",
  sound: "音のふしぎ",
  animal_homes: "動物のすみか",
  ground_sun: "地面のようすと太陽",
  sunlight: "太陽の光",
  electric_path: "電気の通り道",
  magnets: "じしゃくのふしぎ",
  weight: "ものの重さ"
};

const unitAreas = {
  nature_observation: "生命・地球",
  plants_growth: "生命",
  insects_growth: "生命",
  wind_rubber: "エネルギー",
  sound: "エネルギー",
  animal_homes: "生命",
  ground_sun: "地球",
  sunlight: "エネルギー・地球",
  electric_path: "エネルギー",
  magnets: "エネルギー",
  weight: "粒子"
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
        id: `g3_science_${unit}_${pad(index++)}`,
        version: 2,
        grade: 3,
        subject: "science",
        unit,
        unitLabel: unitLabels[unit],
        curriculumArea: unitAreas[unit],
        difficulty: difficultyFromAxes(item.axes ?? meta.axes),
        difficultyAxes: item.axes ?? meta.axes,
        questionType: "multiple_choice",
        prompt: item.prompt,
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

// ---------------------------------------------------------------- しぜんのかんさつ(25)
function makeNatureObservation() {
  const { questions, fam } = makeFamilyBuilder("nature_observation");

  // F1 観察の基本(drill, d2)
  fam({
    familyId: "sci_obs_basic",
    funMechanic: "drill",
    learningObjective: "自然観察の基本的な方法や道具の使い方がわかる",
    commonMistake: "虫めがねで太陽を見るなど、危険な使い方をしてしまう",
    estimatedSeconds: 30,
    skillTags: ["観察", "自然"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "虫めがねを使うときにしてはいけないことはどれ？", correct: "太陽を直接見る", wrongs: ["葉のもようを見る", "小さな虫を見る", "花の形を見る"], explanation: "虫めがねで太陽を見ると目を傷めるので危険です。" },
    { prompt: "観察したことを残す方法としてよいものはどれ？", correct: "日時・場所・気づいたことを書く", wrongs: ["好きな色だけ書く", "何も書かない", "友だちの名前だけ書く"], explanation: "日時や場所も書くと、後でくらべやすくなります。" },
    { prompt: "植物の高さを調べる時に使う道具はどれ？", correct: "ものさし", wrongs: ["方位磁針", "虫めがねだけ", "磁石"], explanation: "植物の高さは、ものさしやまきじゃくで測れます。" },
    { prompt: "観察で安全に気をつける行動はどれ？", correct: "知らない植物や虫にむやみにさわらない", wrongs: ["何でも口に入れる", "一人で遠くに行く", "道路に飛び出す"], explanation: "安全に観察するため、危ない行動は避けます。" }
  ]);

  // F1b 観察の記録(drill, d2)
  fam({
    familyId: "sci_obs_record",
    funMechanic: "drill",
    learningObjective: "観察の記録に必要な情報がわかる",
    commonMistake: "観察の記録に、あとで比べるために必要な情報を書き忘れる",
    estimatedSeconds: 30,
    skillTags: ["観察", "自然"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "春の生き物のようすを調べるとき見るとよいものはどれ？", correct: "芽・花・虫の動き", wrongs: ["机の数だけ", "ゲームの点数だけ", "時計の色だけ"], explanation: "季節の生き物の様子を見ると自然の変化が分かります。" },
    { prompt: "観察カードに絵をかくときに大切なことはどれ？", correct: "見たとおりの色や形をかく", wrongs: ["すきな色でかく", "何もかかない", "想像でかく"], explanation: "観察カードは、実際に見たとおりに記録することが大切です。" }
  ]);

  // F2 事実と予想の見分け(rule_discovery, d3)
  fam({
    familyId: "sci_obs_fact_predict",
    funMechanic: "rule_discovery",
    learningObjective: "観察で得られた「事実」と、まだ確かめていない「予想」を区別できる",
    commonMistake: "予想したことを、確かめた事実のように書いてしまう",
    estimatedSeconds: 60,
    skillTags: ["観察", "事実と予想", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "観察で『事実』に近いものはどれ？", correct: "葉の長さが5cmだった", wrongs: ["きっと明日大きくなる", "たぶん好きだと思う", "かっこいい気がする"], explanation: "実際に見たり測ったりしたことが事実です。" },
    { prompt: "観察で『予想』に近いものはどれ？", correct: "雨の後は虫が多いかもしれない", wrongs: ["虫が3びきいた", "花は黄色だった", "葉は丸かった"], explanation: "予想は、調べる前に考える見通しです。" },
    { prompt: "「明日は今日より花が多くさくだろう」は、事実と予想のどちらに近い？", correct: "予想", wrongs: ["事実", "どちらでもない", "両方"], explanation: "まだ起きていないことを考えているので、予想です。" },
    { prompt: "「花びらが5まいあった」は、事実と予想のどちらに近い？", correct: "事実", wrongs: ["予想", "どちらでもない", "両方"], explanation: "実際に数えて確かめたことなので、事実です。" }
  ]);

  // F3 同じ場所を続けて見る意味(inference, d3)
  fam({
    familyId: "sci_obs_repeat",
    funMechanic: "inference",
    learningObjective: "同じ場所を何度も観察することの意味を考えられる",
    commonMistake: "1回見ただけで、その場所のすべてがわかったと思いこむ",
    estimatedSeconds: 60,
    skillTags: ["観察", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "しぜんを観察するとき、同じ場所を何度か見るよさはどれ？", correct: "変化に気づきやすい", wrongs: ["早く帰れる", "記録しなくてよい", "虫がいなくなる"], explanation: "同じ場所を続けて見ると、季節や時間による変化に気づけます。" },
    { prompt: "春に花がさいていた場所を、夏にもう一度見に行く理由として合うものはどれ？", correct: "季節によって様子がどう変わるか知りたいから", wrongs: ["同じ景色を見飽きたから", "花がもうないと決まっているから", "特に理由はない"], explanation: "同じ場所を季節ごとに観察すると、季節による変化がわかります。" },
    { prompt: "毎週同じ木を観察していたら、葉の色が少しずつ変わってきました。この記録から考えられることはどれ？", correct: "季節が進むにつれて木の様子が変化している", wrongs: ["木が急に別のしゅるいに変わった", "観察の記録がまちがっている", "葉の色はいつも同じはず"], explanation: "続けて観察することで、少しずつの変化に気づくことができます。" }
  ]);

  // F4 くらべる観察のきまり(rule_discovery, d3)
  fam({
    familyId: "sci_obs_compare",
    funMechanic: "rule_discovery",
    learningObjective: "2つの場所や生き物をくらべるとき、見方をそろえる大切さに気づける",
    commonMistake: "くらべる相手によって、見るポイントを変えてしまう",
    estimatedSeconds: 60,
    skillTags: ["観察", "くらべる", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "花の色をくらべるとき、正しい調べ方はどれ？", correct: "同じように見て、記録する", wrongs: ["一つだけ見て全部決める", "見ないで予想だけ書く", "色を変えてから見る"], explanation: "くらべる時は、同じ見方で記録します。" },
    { prompt: "二つの場所の自然をくらべるとき大切なことはどれ？", correct: "見るポイントをそろえる", wrongs: ["場所の名前をかくす", "片方だけ記録する", "時間を全部忘れる"], explanation: "見るポイントをそろえると違いが分かりやすくなります。" },
    { prompt: "校庭と公園の生き物の数をくらべたいとき、同じにそろえるとよいことはどれ？", correct: "調べる時間の長さ", wrongs: ["場所の名前", "天気予報の内容", "先生の名前"], explanation: "調べる時間の長さをそろえないと、見つかる数を公平にくらべられません。" }
  ]);

  // F5 生き物とのつきあい方(judge_claim, d3)
  fam({
    familyId: "sci_obs_care",
    funMechanic: "judge_claim",
    learningObjective: "自然観察のときの安全や生き物への配慮について判断できる",
    commonMistake: "観察のためなら何をしてもよいと考えてしまう",
    estimatedSeconds: 60,
    skillTags: ["観察", "安全", "生き物への配慮"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「観察した生き物は全部持ち帰ってよい」。みお「観察した生き物はもとの場所にもどす」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "生き物のくらしを守るため、むやみに持ち帰らずもとの場所にもどします。" },
    { prompt: "はると「知らない植物や虫にはむやみにさわらない」。みお「知らない生き物ほどさわって確かめるべきだ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "安全に観察するため、知らない生き物にむやみにさわらないことが大切です。" },
    { prompt: "はると「観察のときは道路に飛び出さないよう気をつける」。みお「観察に夢中なら道路のことは気にしなくてよい」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "観察に夢中になっても、交通安全には常に気をつける必要があります。" }
  ]);

  // F6 季節の生き物の予想(predict_check, d4)
  fam({
    familyId: "sci_obs_season_predict",
    funMechanic: "predict_check",
    learningObjective: "季節による自然の変化を予想し、実際の観察と照らし合わせられる",
    commonMistake: "季節ごとの変化を考えず、いつも同じ景色だと思いこむ",
    estimatedSeconds: 75,
    skillTags: ["観察", "季節", "予想"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "春の校庭を観察する前に予想してみよう。春に見られやすい生き物や植物の様子はどれ？", correct: "芽が出たり、花がさいたりしている", wrongs: ["葉がすべて落ちている", "雪が積もっている", "虫がまったくいない"], explanation: "春は芽が出て花がさく季節で、虫も活発になり始めます。" },
    { prompt: "秋の校庭を観察する前に予想してみよう。秋に見られやすい植物の様子はどれ？", correct: "葉の色が変わったり、実がなったりしている", wrongs: ["すべての花が満開になっている", "雪が積もっている", "たねがまだまかれていない"], explanation: "秋は紅葉や木の実が見られやすい季節です。" },
    { prompt: "冬の校庭を観察する前に予想してみよう。冬に見られやすい生き物の様子はどれ？", correct: "虫の姿があまり見られなくなる", wrongs: ["虫がいちばん多く見られる", "花がいちばんたくさんさく", "葉がいちばん青々としげる"], explanation: "冬は気温が下がり、多くの虫は活動が少なくなります。" }
  ]);

  // F7 記録から変化を読み取る(inference, d4)
  fam({
    familyId: "sci_obs_change_infer",
    funMechanic: "inference",
    learningObjective: "複数回の観察記録をくらべて、変化を読み取れる",
    commonMistake: "1回分の記録だけを見て、変化の流れを考えない",
    estimatedSeconds: 75,
    skillTags: ["観察", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "4月は5cm、5月は12cm、6月は20cmだった植物の高さの記録から分かることはどれ？", correct: "だんだん高くなっている", wrongs: ["だんだん低くなっている", "まったく変化していない", "記録がまちがっている"], explanation: "月ごとの記録をくらべると、植物が育っている様子がわかります。" },
    { prompt: "同じ場所で見つかる虫の数を、春・夏・秋で記録したら、夏がいちばん多かった。この記録から考えられることはどれ？", correct: "夏は虫の活動がさかんな季節かもしれない", wrongs: ["虫の数は季節と関係ない", "記録の仕方がまちがっている", "夏はいつも虫がいない"], explanation: "季節ごとの記録をくらべることで、虫の活動と季節の関係を考えられます。" },
    { prompt: "同じ木の葉の数を、5月と9月で記録したら、9月の方が少なかった。この記録から考えられることはどれ？", correct: "季節の変化で葉が落ち始めているかもしれない", wrongs: ["木が別の種類に変わった", "記録がすべてまちがっている", "葉の数は季節と関係ない"], explanation: "季節が進むと、葉の数が変化する木があります。" }
  ]);

  if (questions.length !== 25) throw new Error(`nature_observation: expected 25, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- 植物の育ち方(30)
function makePlantsGrowth() {
  const { questions, fam } = makeFamilyBuilder("plants_growth");

  // F1 植物のからだと成長(drill, d2)
  fam({
    familyId: "sci_plant_body",
    funMechanic: "drill",
    learningObjective: "植物のからだのつくり(根・くき・葉・花)がわかる",
    commonMistake: "根とくきのはたらきを取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["植物", "からだのつくり"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "ホウセンカのからだを分けると、主な部分はどれ？", correct: "根・くき・葉・花", wrongs: ["足・羽・口・目", "電池・豆電球・導線", "北極・南極"], explanation: "植物には根、くき、葉、花などのつくりがあります。" },
    { prompt: "根のはたらきとして合うものはどれ？", correct: "水を取り入れ、体を支える", wrongs: ["音を出す", "電気を通す", "空を飛ぶ"], explanation: "根は水や養分を取り入れ、植物のからだを支えます。" },
    { prompt: "たねから芽が出ることを何という？", correct: "発芽", wrongs: ["発電", "反射", "磁化"], explanation: "たねから芽が出ることを発芽といいます。" },
    { prompt: "くきのはたらきとして合うものはどれ？", correct: "根から吸った水を運び、からだを支える", wrongs: ["音を出す", "電気を通す", "光を反射する"], explanation: "くきは水を運ぶ通り道になり、植物のからだを支えます。" }
  ]);

  // F1b 植物の花とたね(drill, d2)
  fam({
    familyId: "sci_plant_flower",
    funMechanic: "drill",
    learningObjective: "花がさいたあとにたねができることがわかる",
    commonMistake: "花とたねの関係を知らずに、別々のものだと思う",
    estimatedSeconds: 30,
    skillTags: ["植物", "花とたね"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "花がさいたあとにできるものはどれ？", correct: "たね", wrongs: ["根", "土", "水"], explanation: "花がさいたあと、たねができることが多いです。" },
    { prompt: "ホウセンカの花の色として、教科書でよく出てくるものはどれ？", correct: "赤やピンク", wrongs: ["黒", "青だけ", "透明"], explanation: "ホウセンカは赤やピンクなど、色とりどりの花がさきます。" },
    { prompt: "実の中には、多くの場合何が入っている？", correct: "たね", wrongs: ["水だけ", "空気だけ", "石"], explanation: "多くの植物の実の中には、次の世代のたねが入っています。" }
  ]);

  // F2 育つために必要なもの(drill, d2)
  fam({
    familyId: "sci_plant_needs",
    funMechanic: "drill",
    learningObjective: "植物が育つために必要なもの(水・空気・日光)がわかる",
    commonMistake: "植物の成長に関係ないものを必要なものと思いこむ",
    estimatedSeconds: 30,
    skillTags: ["植物", "成長の条件"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "植物が育つために必要なものとして合うものはどれ？", correct: "水・空気・日光など", wrongs: ["砂糖だけ", "暗い箱だけ", "音楽だけ"], explanation: "多くの植物は水、空気、日光などを使って育ちます。" },
    { prompt: "葉が多くついている植物について考えられることはどれ？", correct: "日光を受けやすくしている", wrongs: ["音を大きくする", "電池になる", "磁石になる"], explanation: "葉は日光を受けて、植物が育つための養分をつくります。" },
    { prompt: "植物にとって、空気が必要な理由として考えられることはどれ？", correct: "呼吸や養分づくりに使われるから", wrongs: ["重さを増やすためだけ", "色をつけるためだけ", "音を出すため"], explanation: "植物も空気を使って呼吸したり、養分をつくったりします。" }
  ]);

  // F3 実験の条件をそろえる(rule_discovery, d3)
  fam({
    familyId: "sci_plant_condition",
    funMechanic: "rule_discovery",
    learningObjective: "何が成長に影響したか調べるには、変える条件を1つにするきまりに気づける",
    commonMistake: "調べたい条件以外もいっしょに変えてしまう",
    estimatedSeconds: 60,
    skillTags: ["植物", "実験の条件", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "同じ植物の育ち方をくらべる実験で、変える条件はどうする？", correct: "調べたい条件だけ変える", wrongs: ["全部の条件を変える", "記録をしない", "毎回場所も水も土も変える"], explanation: "何が影響したか分かるよう、変える条件は一つにします。" },
    { prompt: "水の量が成長に関係するか調べたいとき、水以外の条件はどうする？", correct: "同じにそろえる", wrongs: ["水といっしょに全部変える", "毎回ちがう鉢に植える", "そろえなくてよい"], explanation: "水の量だけを変えて、他の条件をそろえないと、水の影響かどうかわかりません。" },
    { prompt: "日光が成長に関係するか調べたいとき、正しい実験の進め方はどれ？", correct: "日光の当たる鉢と当たらない鉢を用意し、水の量は同じにする", wrongs: ["日光も水も土もすべて変える", "1つの鉢だけで実験する", "記録をとらずに見た目だけで比べる"], explanation: "日光の条件だけを変えて、他の条件をそろえることで、日光の影響がわかります。" }
  ]);

  // F4 成長の予想とたしかめ(predict_check, d3)
  fam({
    familyId: "sci_plant_predict",
    funMechanic: "predict_check",
    learningObjective: "植物の様子から、これからどうなるか予想して結果とくらべられる",
    commonMistake: "予想せずに、結果だけを見て終わらせる",
    estimatedSeconds: 75,
    skillTags: ["植物", "予想"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "葉がしおれた植物を見つけました。予想してから理由を確かめよう。まず考えるべき理由はどれ？", correct: "水が足りないかもしれない", wrongs: ["磁石が弱い", "電池が逆", "音が小さい"], explanation: "植物の様子から、必要な条件を考えます。" },
    { prompt: "日光の当たらない場所に植物を置いたら、どうなると予想できる？予想してから確かめよう。予想として合うものはどれ？", correct: "元気に育ちにくくなるかもしれない", wrongs: ["いつもよりよく育つ", "色が変わらず同じまま育つ", "たねの数が増える"], explanation: "多くの植物は日光を使って育つので、日光が足りないと育ちにくくなります。" },
    { prompt: "水をあげすぎた植物は、どうなると予想できる？予想してから確かめよう。予想として合うものはどれ？", correct: "根がくさって元気がなくなることがある", wrongs: ["いつもより速く大きく育つ", "花の色がこくなる", "たねが増える"], explanation: "水をあげすぎると根がくさってしまい、植物が弱ることがあります。" }
  ]);

  // F5 成長の順番(reorder, d3)
  fam({
    familyId: "sci_plant_order",
    funMechanic: "reorder",
    learningObjective: "植物が育つ順番(発芽→成長→開花)を理解できる",
    commonMistake: "花がさいてからたねができることを逆に考える",
    estimatedSeconds: 60,
    skillTags: ["植物", "成長の順番", "ならべ替え"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "植物の成長を説明する順番として合うものはどれ？", correct: "たね → 発芽 → 葉がふえる → 花がさく", wrongs: ["花 → たね → 電池 → 磁石", "葉 → こん虫 → 音 → 太陽", "電気 → 風 → 重さ → 花"], explanation: "植物はたねから芽を出し、葉や花をつけて育ちます。" },
    { prompt: "ホウセンカの一生の順番として合うものはどれ？", correct: "たねをまく → 発芽する → 葉がふえる → 花がさく → たねができる", wrongs: ["花がさく → たねをまく → 発芽する → たねができる", "たねができる → たねをまく → 花がさく → 発芽する", "発芽する → たねをまく → たねができる → 花がさく"], explanation: "たねをまいてから発芽し、育って花がさき、またたねができます。" },
    { prompt: "アサガオの成長を早い順にならべたものはどれ？", correct: "たねをまく → 子葉が出る → 本葉が出る → つるがのびる → 花がさく", wrongs: ["花がさく → たねをまく → 本葉が出る → つるがのびる", "つるがのびる → たねをまく → 花がさく → 子葉が出る", "本葉が出る → 子葉が出る → たねをまく → 花がさく"], explanation: "たねから子葉、本葉の順に育ち、つるがのびて花がさきます。" }
  ]);

  // F6 まちがい直し(find_mistake, d3)
  fam({
    familyId: "sci_plant_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "植物の成長についてのまちがった考えに気づける",
    commonMistake: "植物はどんな環境でも同じように育つと思いこむ",
    estimatedSeconds: 75,
    skillTags: ["植物", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「植物は水がなくても元気に育つ」と言いました。正しい説明はどれ？", correct: "植物の多くは水がないと育ちにくい", wrongs: ["水がなくても育つで正しい", "植物に水は関係ない", "水が多いほど必ずよい"], explanation: "多くの植物は水を使って育つので、水がないと育ちにくくなります。" },
    { prompt: "みおさんは「根は花にだけ栄養を送る」と言いました。正しい説明はどれ？", correct: "根は植物のからだ全体を支え、水や養分を取り入れる", wrongs: ["花にだけ送るで正しい", "根は何もしない", "根は葉から栄養をもらう"], explanation: "根は水や養分を取り入れ、植物全体のからだを支えます。" },
    { prompt: "はるとさんは「たねをまいたその日にすぐ花がさく」と言いました。正しい説明はどれ？", correct: "発芽してから花がさくまでには時間がかかる", wrongs: ["その日に花がさくで正しい", "花はたねから直接できる", "花はいつまでもさかない"], explanation: "たねから発芽し、育って花がさくまでには数週間以上かかることが多いです。" }
  ]);

  // F7 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "sci_plant_judge",
    funMechanic: "judge_claim",
    learningObjective: "植物の成長についての主張を、学んだ知識で判断できる",
    commonMistake: "植物の種類によるちがいを考えず、すべて同じだと決めつける",
    estimatedSeconds: 75,
    skillTags: ["植物"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「同じ種類の植物でも、育つ環境がちがうと大きさが変わることがある」。みお「日光や水の量によって、育ち方の速さも変わることがある」。正しいのはどっち？", correct: "二人とも正しい", explanation: "日光や水などの条件によって、同じ種類の植物でも大きさや育つ速さにちがいが出ることがあります。" },
    { prompt: "はると「日光が強いほど、植物はかならず早くかれてしまう」。みお「植物は日光の代わりに、月の光でも同じように育つ」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "植物は日光を使って育つための養分をつくります。日光が強いからといって必ずかれるわけではなく、月の光だけでは日光の代わりになりません。" },
    { prompt: "はると「植物の高さは、たねをまいてすぐに大人と同じ高さになる」。みお「植物の高さは、たねをまいた日からずっと同じ」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "植物はたねをまいてすぐに大きくなるのではなく、時間とともに少しずつ成長して高さが変わっていきます。" }
  ]);

  // F8 花のつくりを調べる(inference, d4)
  fam({
    familyId: "sci_plant_flower_infer",
    funMechanic: "inference",
    learningObjective: "花のつくりから、たねができるまでの過程を考えられる",
    commonMistake: "花とたねのつながりを考えず、別々のものだと思う",
    estimatedSeconds: 75,
    skillTags: ["植物", "花のつくり", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "ホウセンカの花がしぼんだあと、しばらくするとふくらんだ部分ができました。これは何になると考えられる？", correct: "たねが入ったみ(実)", wrongs: ["新しい根", "新しい葉", "新しいくき"], explanation: "花がさいたあと、たねの入った実ができることが多いです。" },
    { prompt: "ヒマワリの種をとりたいとき、いつ実を集めるとよいと考えられる？", correct: "花がしおれて、実が茶色くなったころ", wrongs: ["花がさき始めたばかりのころ", "たねをまいたその日", "芽が出たばかりのころ"], explanation: "花がしおれて実が熟したころに、たねを収穫します。" }
  ]);

  // F9 植物どうしをくらべる(compare_methods, d4)
  fam({
    familyId: "sci_plant_compare",
    funMechanic: "compare_methods",
    learningObjective: "ちがう種類の植物の育ち方を、共通点と相違点でくらべられる",
    commonMistake: "植物ごとのちがいだけに注目し、共通するところを見落とす",
    estimatedSeconds: 90,
    skillTags: ["植物", "くらべる"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "ホウセンカとヒマワリは、どちらも根・くき・葉・花をもっています。この2つの植物に共通することはどれ？", correct: "からだの主なつくりが同じ", wrongs: ["花の色が必ず同じ", "高さが必ず同じ", "たねの形が必ず同じ"], explanation: "植物の種類がちがっても、根・くき・葉・花という基本のつくりは共通しています。" },
    { prompt: "ホウセンカはくきが細く、ヒマワリはくきが太いです。この違いから考えられることはどれ？", correct: "植物の種類によって、からだのつくりの大きさや形がちがう", wrongs: ["どちらかが植物ではない", "くきの太さは重要ではない", "必ずどちらかがまちがっている"], explanation: "植物の種類によって、からだのつくりの特徴は異なります。" },
    { prompt: "ヒマワリは大きく育ち、ホウセンカは小さめに育ちます。この2つを同じ土の量で育てたら、どちらがより多くの水を必要とすると考えられる？", correct: "大きく育つヒマワリの方が多くの水を必要とすると考えられる", wrongs: ["小さいホウセンカの方が多く必要", "どちらも水は必要ない", "大きさと水の量は関係ない"], explanation: "からだが大きい植物ほど、育つために多くの水を必要とすることが多いです。" }
  ]);

  if (questions.length !== 30) throw new Error(`plants_growth: expected 30, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- こん虫の育ち方(25)
function makeInsectsGrowth() {
  const { questions, fam } = makeFamilyBuilder("insects_growth");

  // F1 こん虫のからだのつくり(drill, d2)
  fam({
    familyId: "sci_insect_body",
    funMechanic: "drill",
    learningObjective: "こん虫のからだのつくり(頭・むね・はら、足6本)がわかる",
    commonMistake: "こん虫の足の本数や、ついている場所を混同する",
    estimatedSeconds: 30,
    skillTags: ["昆虫", "からだのつくり"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "こん虫のからだは主にいくつに分かれている？", correct: "3つ", wrongs: ["2つ", "4つ", "6つ"], explanation: "こん虫のからだは頭・むね・はらの3つに分かれます。" },
    { prompt: "こん虫の足は主にどこについている？", correct: "むね", wrongs: ["頭", "はら", "羽だけ"], explanation: "こん虫の6本の足はむねについています。" },
    { prompt: "こん虫の足は、ぜんぶで何本ある？", correct: "6本", wrongs: ["4本", "8本", "10本"], explanation: "こん虫の足は6本あります。バッタもチョウも同じです。" },
    { prompt: "こん虫のはらの主なはたらきとして合うものはどれ？", correct: "呼吸や消化をする", wrongs: ["歩くための足がある", "目や口がある", "羽がついている"], explanation: "はらには呼吸や消化に関わる器官が入っています。" }
  ]);

  // F2 育ち方の順番(reorder, d3)
  fam({
    familyId: "sci_insect_order",
    funMechanic: "reorder",
    learningObjective: "チョウなどの完全変態の順番(卵→幼虫→さなぎ→成虫)がわかる",
    commonMistake: "さなぎと幼虫の順番を逆にする",
    estimatedSeconds: 45,
    skillTags: ["昆虫", "成長", "ならべ替え"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 }
  }, [
    { prompt: "モンシロチョウの育ち方として合う順番はどれ？", correct: "卵 → 幼虫 → さなぎ → 成虫", wrongs: ["卵 → 成虫 → さなぎ → 幼虫", "成虫 → さなぎ → 卵 → 幼虫", "幼虫 → 卵 → 成虫 → さなぎ"], explanation: "チョウは卵、幼虫、さなぎ、成虫の順に育ちます。" },
    { prompt: "カブトムシの育ち方として合う順番はどれ？", correct: "卵 → 幼虫 → さなぎ → 成虫", wrongs: ["幼虫 → 卵 → さなぎ → 成虫", "成虫 → 幼虫 → 卵 → さなぎ", "さなぎ → 卵 → 幼虫 → 成虫"], explanation: "カブトムシもチョウと同じ、卵、幼虫、さなぎ、成虫の順に育ちます。" },
    { prompt: "チョウのさなぎの時期について正しいものはどれ？", correct: "大きく形を変える時期", wrongs: ["たねを作る時期", "電気を流す時期", "土をとかす時期"], explanation: "さなぎの中で成虫の体へ変わっていきます。" }
  ]);

  // F3 育ち方のちがい(rule_discovery, d3)
  fam({
    familyId: "sci_insect_type",
    funMechanic: "rule_discovery",
    learningObjective: "こん虫によって、さなぎになるものとならないものがあることに気づける",
    commonMistake: "すべてのこん虫がさなぎの時期をもつと思いこむ",
    estimatedSeconds: 60,
    skillTags: ["昆虫", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "バッタの育ち方として合うものはどれ？", correct: "幼虫が成虫に近い形で育つ", wrongs: ["必ずさなぎになる", "電池で育つ", "根から育つ"], explanation: "バッタはチョウのようなさなぎにはなりません。" },
    { prompt: "こん虫ではないものを選ぶ見方としてよいものはどれ？", correct: "足の数や体の分かれ方を見る", wrongs: ["色だけで決める", "大きさだけで決める", "名前の長さで決める"], explanation: "こん虫かどうかは体のつくりで考えます。" },
    { prompt: "トンボの育ち方として合うものはどれ？", correct: "幼虫(ヤゴ)は水の中で育ち、さなぎにはならない", wrongs: ["幼虫は土の中で育ち、さなぎになる", "卵の時期がない", "成虫になったあとにさなぎになる"], explanation: "トンボの幼虫はヤゴといい、水の中で育ちます。バッタと同じでさなぎにはなりません。" }
  ]);

  // F4 すみかと食べ物の関係(inference, d3)
  fam({
    familyId: "sci_insect_habitat",
    funMechanic: "inference",
    learningObjective: "こん虫の食べ物やすみかから、くらしの様子を考えられる",
    commonMistake: "こん虫と食べ物・すみかの関係を無視して考える",
    estimatedSeconds: 75,
    skillTags: ["昆虫", "すみか", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "モンシロチョウの幼虫が、キャベツの葉によくいる理由として考えられることはどれ？", correct: "幼虫がキャベツの葉を食べるから", wrongs: ["キャベツが磁石だから", "音が出るから", "太陽が近いから"], explanation: "モンシロチョウの幼虫はキャベツなどアブラナ科の葉を食べます。" },
    { prompt: "アゲハの幼虫が、ミカンの葉によくいる理由として考えられることはどれ？", correct: "幼虫がミカンの葉を食べるから", wrongs: ["ミカンの木が磁石だから", "音が出るから", "太陽が近いから"], explanation: "アゲハの幼虫はミカンやサンショウなどの葉を食べます。" },
    { prompt: "アリがよく見られる場所として考えやすいものはどれ？", correct: "土の近くやえさのある場所", wrongs: ["空の上", "火の中", "電池の中"], explanation: "アリは土の近くやえさのある場所で見つかりやすいです。" },
    { prompt: "アリの行列を観察すると分かりやすいことはどれ？", correct: "えさや巣との関係", wrongs: ["太陽の温度だけ", "磁石の力だけ", "重さだけ"], explanation: "アリの動きは、えさや巣の場所と関係します。" },
    { prompt: "セミの幼虫が土の中で長い時間をすごす理由として考えられることはどれ？", correct: "土の中で育つのに時間がかかるから", wrongs: ["土が音を消すから", "土が磁石だから", "特に理由はない"], explanation: "セミの幼虫は土の中で数年かけて育ちます。" }
  ]);

  // F5 まちがい直し(find_mistake, d3)
  fam({
    familyId: "sci_insect_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "こん虫の育ち方についてのまちがった考えに気づける",
    commonMistake: "1種類のこん虫の育ち方が、すべてのこん虫に当てはまると思いこむ",
    estimatedSeconds: 75,
    skillTags: ["昆虫", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「すべてのこん虫はさなぎになる」と言いました。正しい説明はどれ？", correct: "バッタなどさなぎにならないこん虫もいる", wrongs: ["すべてなるで正しい", "こん虫はさなぎだけで一生を過ごす", "さなぎになるこん虫はいない"], explanation: "チョウのようにさなぎになるこん虫もいれば、バッタのようにならないこん虫もいます。" },
    { prompt: "みおさんは「こん虫の足はどこについていてもよい」と言いました。正しい説明はどれ？", correct: "こん虫の足はむねについている", wrongs: ["どこでもよいで正しい", "足は頭についている", "足ははらについている"], explanation: "こん虫の6本の足は、からだの中央にあるむねについています。" },
    { prompt: "はるとさんは「バッタもチョウと同じようにさなぎになる」と言いました。正しい説明はどれ？", correct: "バッタはさなぎにならず、幼虫が成虫に近い形で育つ", wrongs: ["さなぎになるで正しい", "バッタは卵から育たない", "バッタは成虫にならない"], explanation: "バッタはチョウとちがい、さなぎの時期がありません。" }
  ]);

  // F6 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "sci_insect_judge",
    funMechanic: "judge_claim",
    learningObjective: "こん虫の育ち方や分類についての主張を判断できる",
    commonMistake: "見た目の似ているものを同じなかまだと思いこむ",
    estimatedSeconds: 75,
    skillTags: ["昆虫"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「クモは足が8本だからこん虫だ」。みお「クモはこん虫ではない」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "こん虫は足が6本ですが、クモは足が8本なのでこん虫ではありません。" },
    { prompt: "はると「幼虫が食べるものは、こん虫のくらしを知る手がかりになる」。みお「こん虫は育つ間に、すがたが大きく変わることがある」。正しいのはどっち？", correct: "二人とも正しい", explanation: "食べ物はくらしと関係があり、また多くのこん虫はよう虫からせい虫になる間にすがたが大きく変わります。" }
  ]);

  // F7 育ち方をくらべる(compare_methods, d4)
  fam({
    familyId: "sci_insect_compare",
    funMechanic: "compare_methods",
    learningObjective: "完全変態(さなぎになる)と不完全変態(さなぎにならない)のこん虫をくらべられる",
    commonMistake: "育ち方のちがいを、こん虫の種類と結びつけて考えない",
    estimatedSeconds: 90,
    skillTags: ["昆虫", "くらべる"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "チョウとバッタの育ち方をくらべたとき、大きくちがう点はどれ？", correct: "チョウはさなぎになるが、バッタはさなぎにならない", wrongs: ["チョウは卵を産まないが、バッタは卵を産む", "チョウは足がないが、バッタは足がある", "チョウは幼虫にならないが、バッタは幼虫になる"], explanation: "チョウはさなぎの時期がありますが、バッタにはさなぎの時期がありません。" },
    { prompt: "カブトムシとトンボの育ち方に共通することはどれ？", correct: "どちらも卵から幼虫がかえる", wrongs: ["どちらも水の中で成虫になる", "どちらもさなぎにならない", "どちらも足が8本ある"], explanation: "カブトムシもトンボも、卵から幼虫がかえって育ちます(さなぎになるかはちがいます)。" }
  ]);

  // F8 こん虫の予想とたしかめ(predict_check, d3)
  fam({
    familyId: "sci_insect_predict",
    funMechanic: "predict_check",
    learningObjective: "こん虫の育ち方や様子を予想し、観察結果と照らし合わせられる",
    commonMistake: "予想せずに、いきなり観察結果だけを見る",
    estimatedSeconds: 75,
    skillTags: ["昆虫", "予想"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "モンシロチョウの卵を観察していたら、数日後に小さな幼虫が出てきました。この前に、卵の中でどんな変化が起きていたと考えられる？", correct: "卵の中で幼虫のからだができていた", wrongs: ["卵の中では何も変化していなかった", "卵が急に幼虫に変わった", "卵はさなぎになっていた"], explanation: "卵の中では、目に見えなくても少しずつ幼虫のからだができています。" },
    { prompt: "幼虫がさなぎになる前、あまり食べ物を食べなくなり、じっとしていることが増えました。次に起きることとして予想できるのはどれ？", correct: "さなぎになる準備をしている", wrongs: ["卵にもどる", "すぐに死んでしまう", "急に大きな成虫になる"], explanation: "さなぎになる前は、動きが少なくなることがあります。" },
    { prompt: "さなぎの色や形が変わってきました。羽化(成虫になること)が近いと予想できるのはどれ？", correct: "さなぎのからが少しすき通って、中の色が見えてきたとき", wrongs: ["さなぎになったばかりのとき", "卵からかえったばかりのとき", "幼虫が食事をたくさんしているとき"], explanation: "羽化が近づくと、さなぎのからを通して中の成虫の色が見えることがあります。" }
  ]);

  if (questions.length !== 25) throw new Error(`insects_growth: expected 25, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- ゴムと風の力(25)
function makeWindRubber() {
  const { questions, fam } = makeFamilyBuilder("wind_rubber");

  // F1 ゴムと風の基本(drill, d2)
  fam({
    familyId: "sci_wind_rubber_basic",
    funMechanic: "drill",
    learningObjective: "ゴムや風にものを動かす力があることがわかる",
    commonMistake: "ゴムの力と風の力の性質を混同する",
    estimatedSeconds: 30,
    skillTags: ["風", "ゴム", "力"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "風の力を利用しているものはどれ？", correct: "風車", wrongs: ["電池", "磁石", "ものさし"], explanation: "風車は風の力で回ります。風にはものを動かすはたらきがあります。" },
    { prompt: "風が強いと帆の車はどうなりやすい？", correct: "遠くまで進みやすい", wrongs: ["必ず止まる", "軽くなる", "磁石になる"], explanation: "風が強いほど、帆を押す力が大きくなります。" },
    { prompt: "ゴムの力で動く車のおもちゃとして正しいしくみはどれ？", correct: "ゴムを引っぱって、もとにもどる力で走る", wrongs: ["ゴムをあたためて走る", "ゴムを凍らせて走る", "ゴムの色で走る"], explanation: "ゴムを引っぱりもとにもどろうとする力を利用して車を走らせます。" }
  ]);

  // F2 ゴムの力のきまり(rule_discovery, d3)
  fam({
    familyId: "sci_rubber_rule",
    funMechanic: "rule_discovery",
    learningObjective: "ゴムを引く強さと、もとにもどろうとする力の関係に気づける",
    commonMistake: "ゴムの伸びと力の大きさが関係ないと考える",
    estimatedSeconds: 60,
    skillTags: ["ゴム", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "ゴムを強く引いた車がよく進んだ。考えられる理由はどれ？", correct: "ゴムがもとにもどろうとする力が大きいから", wrongs: ["車が軽くなったからだけ", "音が出たから", "日光が強いから"], explanation: "ゴムは伸びるほど、もとにもどろうとする力が大きくなります。" },
    { prompt: "ゴムをねじった時も力が生まれるのはなぜ？", correct: "もとの形にもどろうとするから", wrongs: ["水になるから", "光るから", "重さがなくなるから"], explanation: "ゴムは形を変えると、もとの形にもどろうとします。" },
    { prompt: "ゴムを長く伸ばすほど、車の進むきょりはどうなりやすい？", correct: "遠くまで進みやすくなる", wrongs: ["近くで止まりやすくなる", "きょりは変わらない", "後ろに進む"], explanation: "ゴムを長く伸ばすほど、もとにもどろうとする力が大きくなります。" }
  ]);

  // F3 帆の大きさと風の力(inference, d3)
  fam({
    familyId: "sci_wind_sail",
    funMechanic: "inference",
    learningObjective: "帆の大きさと風の力を受ける量の関係を考えられる",
    commonMistake: "帆の大きさが風の受け方に関係ないと考える",
    estimatedSeconds: 60,
    skillTags: ["風", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "帆を大きくすると車が進みやすい理由として考えられるものはどれ？", correct: "風を受ける面が大きくなるから", wrongs: ["車が透明になるから", "音が消えるから", "電気が流れるから"], explanation: "風を受ける面が大きいと、押される力も大きくなりやすいです。" },
    { prompt: "うちわで風を強く送ると、帆の車はどうなると考えられる？", correct: "より遠くまで進みやすくなる", wrongs: ["進まなくなる", "後ろに下がる", "きょりは変わらない"], explanation: "風が強くなるほど、車を押す力が大きくなります。" }
  ]);

  // F4 実験の条件をそろえる(rule_discovery, d3)
  fam({
    familyId: "sci_wind_rubber_condition",
    funMechanic: "rule_discovery",
    learningObjective: "風やゴムの力を調べる実験で、条件をそろえる大切さに気づける",
    commonMistake: "調べたい力以外の条件も一緒に変えてしまう",
    estimatedSeconds: 60,
    skillTags: ["風", "ゴム", "実験の条件", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "風で車を動かす実験で、くらべる時に大切なことはどれ？", correct: "風の強さ以外の条件をそろえる", wrongs: ["毎回車を変える", "記録しない", "走らせる場所を毎回変える"], explanation: "条件をそろえると、風の強さの影響が分かりやすくなります。" },
    { prompt: "ゴム車の実験で公平にくらべるには？", correct: "同じ車でゴムの引き方だけ変える", wrongs: ["車もゴムも場所も全部変える", "片方だけ坂道にする", "片方だけ押して走らせる"], explanation: "調べたい条件だけを変えるのが大切です。" },
    { prompt: "風の強さと車の進むきょりの関係を調べたい。正しい実験の進め方はどれ？", correct: "同じ車、同じ床で、風の強さだけ変える", wrongs: ["車も床も風もすべて変える", "1回だけ試してすぐ結論を出す", "床のかたむきを毎回変える"], explanation: "調べたい条件(風の強さ)だけを変え、他はそろえます。" }
  ]);

  // F5 予想してたしかめる(predict_check, d3)
  fam({
    familyId: "sci_wind_rubber_predict",
    funMechanic: "predict_check",
    learningObjective: "ゴムの伸ばし方や風の強さから、車の進む距離を予想できる",
    commonMistake: "予想せずにすぐ実験結果だけを見る",
    estimatedSeconds: 75,
    skillTags: ["風", "ゴム", "予想"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "ゴムを5cm伸ばした時と10cm伸ばした時、どちらの車が遠くまで進むか予想してみよう。予想として合うものはどれ？", correct: "10cm伸ばした方が遠くまで進みやすい", wrongs: ["5cm伸ばした方が遠くまで進む", "どちらも同じきょり", "ゴムの伸びは関係ない"], explanation: "ゴムを大きく伸ばすほど、もとにもどろうとする力が大きくなります。" },
    { prompt: "弱い風と強い風、どちらの方が帆の車が遠くまで進むか予想してみよう。予想として合うものはどれ？", correct: "強い風の方が遠くまで進みやすい", wrongs: ["弱い風の方が遠くまで進む", "どちらも同じきょり", "風の強さは関係ない"], explanation: "風が強いほど、帆を押す力が大きくなります。" },
    { prompt: "ゴムを2本使うのと1本使うのでは、どちらの方が車が遠くまで進むか予想してみよう。予想として合うものはどれ？", correct: "2本使う方が遠くまで進みやすい", wrongs: ["1本使う方が遠くまで進む", "どちらも同じきょり", "本数は関係ない"], explanation: "ゴムを2本にすると、もとにもどろうとする力が大きくなりやすいです。" }
  ]);

  // F6 結果のばらつきへの対応(compare_methods, d4)
  fam({
    familyId: "sci_wind_rubber_trials",
    funMechanic: "compare_methods",
    learningObjective: "実験結果がばらついたときの、適切な対応のしかたを判断できる",
    commonMistake: "1回だけの結果で、すべてを決めつけてしまう",
    estimatedSeconds: 90,
    skillTags: ["風", "ゴム", "実験の進め方"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "同じ強さでゴムを引いたのに、車の進んだきょりが毎回少しちがいました。正しい対応はどれ？", correct: "何回か行って、平均や傾向を見る", wrongs: ["一番よい結果だけ残す", "一回だけで結論を出す", "実験をやめる"], explanation: "実験は何回か行うと、結果の傾向が見えやすくなります。" },
    { prompt: "風の強さを3段階で試して車のきょりを調べたら、2回目だけ大きく外れました。どう考えるのがよい？", correct: "もう一度その条件で試して確かめる", wrongs: ["2回目の結果を無視して消す", "2回目だけを正しいと決める", "実験をそこでやめる"], explanation: "外れた結果が出たら、条件にミスがなかったか確かめるためもう一度試すとよいです。" }
  ]);

  // F7 まちがい直し(find_mistake, d3)
  fam({
    familyId: "sci_wind_rubber_fix",
    funMechanic: "find_mistake",
    learningObjective: "風やゴムの力についてのまちがった考えに気づける",
    commonMistake: "力の大きさと結果(きょり・速さ)の関係を逆に考える",
    estimatedSeconds: 75,
    skillTags: ["風", "ゴム", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「ゴムを強く引くほど、車はあまり進まなくなる」と言いました。正しい説明はどれ？", correct: "ゴムを強く引くほど、車はよく進む", wrongs: ["あまり進まなくなるで正しい", "ゴムの引き方は関係ない", "強く引くと車が止まる"], explanation: "ゴムを強く引くほど、もとにもどろうとする力が大きくなり、車はよく進みます。" },
    { prompt: "みおさんは「風が弱いほど帆の車は遠くまで進む」と言いました。正しい説明はどれ？", correct: "風が強いほど帆の車は遠くまで進みやすい", wrongs: ["弱いほど進むで正しい", "風の強さは車に関係ない", "風がなくても同じ距離進む"], explanation: "風が強いほど、帆を押す力が大きくなり、車は遠くまで進みやすくなります。" }
  ]);

  // F8 力の大きさと動きの関係(rule_discovery, d3)
  fam({
    familyId: "sci_wind_rubber_relation",
    funMechanic: "rule_discovery",
    learningObjective: "力の大きさと物の動き方を関係づけて考えられる",
    commonMistake: "力の大きさと動きの変化を、別々の現象として考える",
    estimatedSeconds: 60,
    skillTags: ["風", "ゴム", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "風やゴムの学習で大切な考え方はどれ？", correct: "力の大きさと動き方を関係づける", wrongs: ["見た目だけで決める", "記録しない", "好きな結果を選ぶ"], explanation: "力が大きいと動き方がどう変わるかを考えます。" },
    { prompt: "ゴムの力を調べる実験で測るとよいものはどれ？", correct: "進んだきょり", wrongs: ["色の名前", "音の高さだけ", "太陽の向き"], explanation: "進んだ距離を測ると、力の違いをくらべられます。" }
  ]);

  // F9 実験結果からの推理(inference, d4)
  fam({
    familyId: "sci_wind_rubber_result_infer",
    funMechanic: "inference",
    learningObjective: "実験の結果の表やグラフから、力ときょりの関係を読み取れる",
    commonMistake: "表の数字を読まずに、なんとなくの印象で結論を出す",
    estimatedSeconds: 90,
    skillTags: ["風", "ゴム", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "ゴムを5cm伸ばすと2m、10cm伸ばすと4m、15cm伸ばすと6m進みました。この結果から言えることはどれ？", correct: "ゴムを伸ばすほど、車の進むきょりが長くなる", wrongs: ["ゴムの伸びと進むきょりは関係ない", "ゴムを伸ばすほど進むきょりは短くなる", "いつも同じきょりしか進まない"], explanation: "伸ばす長さが2倍、3倍になると、進むきょりも2倍、3倍に増えています。" },
    { prompt: "弱い風で1m、中くらいの風で3m、強い風で6m車が進みました。この結果から言えることはどれ？", correct: "風が強いほど、車の進むきょりが長くなる", wrongs: ["風の強さと進むきょりは関係ない", "風が強いほど進むきょりは短くなる", "風の強さはいつも同じ結果になる"], explanation: "風が強くなるほど、車の進むきょりが長くなっています。" }
  ]);

  // F10 力の向きを考える(inference, d4)
  fam({
    familyId: "sci_wind_direction_infer",
    funMechanic: "inference",
    learningObjective: "風を受ける向きと、車が進む向きの関係を考えられる",
    commonMistake: "風の向きと車が動く向きの関係を考えずに答える",
    estimatedSeconds: 75,
    skillTags: ["風", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "帆に前から風を当てると、車はどちらに進むと考えられる？", correct: "後ろに進む", wrongs: ["前に進む", "その場で止まる", "横に進む"], explanation: "帆が前から風を受けると、その力で車は後ろに押されて進みます。" },
    { prompt: "帆に横から風を当てると、車の進み方はどうなると考えられる？", correct: "まっすぐ進みにくく、横にそれることがある", wrongs: ["いつもよりまっすぐ進む", "後ろに進む", "動かなくなる"], explanation: "横から風を受けると、車がまっすぐ進みにくくなることがあります。" },
    { prompt: "うちわであおぐ風の向きを変えると、車の進む向きはどうなると考えられる？", correct: "風を当てる向きに合わせて変わる", wrongs: ["いつも同じ向きに進む", "風の向きとは関係ない", "必ず止まる"], explanation: "車は、風を受ける向きに応じて進む方向が変わります。" }
  ]);

  if (questions.length !== 25) throw new Error(`wind_rubber: expected 25, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- 音のふしぎ(20)
function makeSound() {
  const { questions, fam } = makeFamilyBuilder("sound");

  // F1 音とふるえの基本(drill, d2)
  fam({
    familyId: "sci_sound_basic",
    funMechanic: "drill",
    learningObjective: "音が物のふるえ(しんどう)によって出ることがわかる",
    commonMistake: "音が出る理由をふるえ以外のものと考える",
    estimatedSeconds: 30,
    skillTags: ["音", "ふるえ"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "音が出ている物をさわると、どんな様子が多い？", correct: "ふるえている", wrongs: ["必ず冷たい", "必ず光る", "必ず重くなる"], explanation: "音は物のふるえ（しんどう）によって出ます。" },
    { prompt: "輪ゴムをはじくと音が出る理由はどれ？", correct: "輪ゴムがふるえるから", wrongs: ["輪ゴムが磁石になるから", "輪ゴムが水になるから", "輪ゴムが太陽になるから"], explanation: "はじかれた輪ゴムがふるえて音が出ます。" },
    { prompt: "トライアングルをたたくと音が出る理由はどれ？", correct: "トライアングルがふるえるから", wrongs: ["トライアングルが軽くなるから", "トライアングルが冷たくなるから", "トライアングルが光るから"], explanation: "たたかれたトライアングルがふるえて音が出ます。" }
  ]);

  // F2 音の大きさとふるえの関係(rule_discovery, d3)
  fam({
    familyId: "sci_sound_size",
    funMechanic: "rule_discovery",
    learningObjective: "たたく強さとふるえの大きさ、音の大きさの関係に気づける",
    commonMistake: "音の大きさとふるえの大きさが無関係だと考える",
    estimatedSeconds: 60,
    skillTags: ["音", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "太鼓を強くたたくと音はどうなりやすい？", correct: "大きくなる", wrongs: ["必ず低くなる", "消える", "電気になる"], explanation: "強くたたくとふるえが大きくなり、音も大きくなりやすいです。" },
    { prompt: "音が小さくなった理由として考えられるものはどれ？", correct: "ふるえが小さくなった", wrongs: ["太陽が動いた", "水が増えた", "磁石がついた"], explanation: "ふるえが小さくなると音も小さくなります。" },
    { prompt: "音を止めるにはどうすればよい？", correct: "ふるえを止める", wrongs: ["明るくする", "重さを測る", "方位を調べる"], explanation: "音はふるえから出るので、ふるえを止めると音も止まります。" },
    { prompt: "太鼓の皮に手をそえると、音がすぐに止まりました。この理由として正しいものはどれ？", correct: "手がふるえを止めたから", wrongs: ["手が磁石になったから", "太鼓が消えたから", "音が水になったから"], explanation: "手でふるえを止めることで、音も止まります。" }
  ]);

  // F3 音が伝わるしくみ(inference, d3)
  fam({
    familyId: "sci_sound_travel",
    funMechanic: "inference",
    learningObjective: "音が空気などを伝わって耳に届くしくみを考えられる",
    commonMistake: "音は何もなくても伝わると考える",
    estimatedSeconds: 60,
    skillTags: ["音", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "音が伝わることを調べる道具として合うものはどれ？", correct: "糸電話", wrongs: ["磁石", "方位磁針", "虫めがね"], explanation: "糸電話では、糸のふるえで音が伝わります。" },
    { prompt: "音が空気中を伝わる例はどれ？", correct: "友だちの声が聞こえる", wrongs: ["磁石が鉄につく", "水がしみこむ", "影ができる"], explanation: "声の音は空気のふるえとして伝わり、耳に届きます。" },
    { prompt: "糸電話の糸をぴんと張らずにゆるめると、声はどう聞こえやすい？", correct: "聞こえにくくなる", wrongs: ["もっとよく聞こえる", "変わらない", "色が変わる"], explanation: "糸がたるむとふるえがうまく伝わらず、声が聞こえにくくなります。" }
  ]);

  // F4 音の高さの予想とたしかめ(predict_check, d4)
  fam({
    familyId: "sci_sound_pitch",
    funMechanic: "predict_check",
    learningObjective: "ゴムの張り方やものの大きさから、音の高さを予想できる",
    commonMistake: "音の大きさと音の高さを混同する",
    estimatedSeconds: 75,
    skillTags: ["音", "予想"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "輪ゴムをきつく張った時とゆるく張った時、どちらの音が高くなるか予想してみよう。予想として合うものはどれ？", correct: "きつく張った方が高い音になりやすい", wrongs: ["ゆるく張った方が高い音になる", "どちらも同じ高さ", "張り方は音の高さに関係ない"], explanation: "きつく張るとふるえ方が変わり、高い音になりやすいです。" },
    { prompt: "高い音や低い音を調べる時に見るとよいことはどれ？", correct: "ふるえ方のちがい", wrongs: ["色だけ", "においだけ", "重さだけ"], explanation: "音の高さもふるえ方と関係があります。" },
    { prompt: "短い輪ゴムと長い輪ゴム、はじいたときの音の高さがちがうか予想してみよう。予想として合うものはどれ？", correct: "長さによって音の高さが変わる", wrongs: ["長さは音の高さに関係ない", "どちらも必ず同じ高さになる", "長い方が必ず大きい音になる"], explanation: "輪ゴムの長さや張り方によって、ふるえ方が変わり音の高さも変わります。" }
  ]);

  // F5 事実と考察を見分ける(rule_discovery, d3)
  fam({
    familyId: "sci_sound_fact",
    funMechanic: "rule_discovery",
    learningObjective: "実験で観察した「結果」と、そこから考えた「考察」を区別できる",
    commonMistake: "考察(自分で考えたこと)を結果のように書いてしまう",
    estimatedSeconds: 60,
    skillTags: ["音", "実験の進め方", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "音の学習で『結果』に近い文はどれ？", correct: "強くたたくと大きな音がした", wrongs: ["たぶん大きいと思う", "明日は晴れる", "好きな音だった"], explanation: "実際に観察したことが結果で、そこから考えたことが考察です。" },
    { prompt: "音をくらべる実験で大切なことはどれ？", correct: "たたく強さなど条件をそろえる", wrongs: ["毎回道具を変える", "記録しない", "音を聞かない"], explanation: "条件をそろえると違いの理由を考えやすくなります。" }
  ]);

  // F6 音の伝わり方をくらべる(compare_methods, d4)
  fam({
    familyId: "sci_sound_compare",
    funMechanic: "compare_methods",
    learningObjective: "音が伝わる速さや伝わり方を、いくつかの方法でくらべられる",
    commonMistake: "音の伝わり方は、いつでもどこでも同じだと思いこむ",
    estimatedSeconds: 75,
    skillTags: ["音", "くらべる"],
    axes: { knowledge: 2, info: 2, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "糸電話と、糸をたるませた電話で、声の伝わり方をくらべる実験で大切なことはどれ？", correct: "コップの大きさや糸の長さなど、糸のたるみ以外の条件をそろえる", wrongs: ["コップも糸もすべて変える", "1回だけ試して終わりにする", "声の大きさを毎回変える"], explanation: "調べたい条件(糸のたるみ)だけを変えて、他はそろえます。" }
  ]);

  // F7 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "sci_sound_judge",
    funMechanic: "judge_claim",
    learningObjective: "音のふるえについての主張を判断できる",
    commonMistake: "音の大きさと高さのちがいを混同する",
    estimatedSeconds: 60,
    skillTags: ["音"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「ふるえが大きいほど音は必ず高くなる」。みお「ふるえが大きいほど音は大きくなる」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "ふるえの大きさは音の大きさに関係し、ふるえの速さが音の高さに関係します。" },
    { prompt: "はると「ふるえがなくても、音が出ることがある」。みお「ふるえていれば、かならず大きな音が出る」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "音が出るものは必ずふるえていますが、ふるえていても音の大きさはふるえ方によって変わるので、必ず大きな音になるわけではありません。" }
  ]);

  // F8 まちがい直し(find_mistake, d3)
  fam({
    familyId: "sci_sound_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "音についてのまちがった考えに気づける",
    commonMistake: "音は物がなくても、どこでも同じように伝わると思いこむ",
    estimatedSeconds: 60,
    skillTags: ["音", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「音はふるえがなくても出る」と言いました。正しい説明はどれ？", correct: "音はふるえによって出る", wrongs: ["ふるえがなくても出るで正しい", "音は光でできている", "音は磁石でできている"], explanation: "音は物のふるえによって出ます。ふるえがないと音はしません。" },
    { prompt: "みおさんは「太鼓を強くたたくと音が低くなる」と言いました。正しい説明はどれ？", correct: "強くたたくと音は大きくなる(高さは変わらないことが多い)", wrongs: ["低くなるで正しい", "音が消える", "太鼓の色が変わる"], explanation: "たたく強さは主に音の大きさに関係し、低くなるとは限りません。" }
  ]);

  if (questions.length !== 20) throw new Error(`sound: expected 20, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- 動物のすみか(25)
function makeAnimalHomes() {
  const { questions, fam } = makeFamilyBuilder("animal_homes");

  // F1 すみかの基本(drill, d2)
  fam({
    familyId: "sci_home_basic",
    funMechanic: "drill",
    learningObjective: "生き物のすみかと、食べ物・かくれ場所などの関係がわかる",
    commonMistake: "すみかと生き物のくらしが無関係だと考える",
    estimatedSeconds: 30,
    skillTags: ["動物", "すみか"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "生き物のすみかを調べるとき見るとよいものはどれ？", correct: "食べ物・かくれる場所・水", wrongs: ["色だけ", "名前の長さだけ", "鳴き声だけ"], explanation: "すみかは、食べ物や身を守る場所などと関係があります。" },
    { prompt: "ダンゴムシがよくいる場所として考えやすいものはどれ？", correct: "しめった落ち葉の下", wrongs: ["強い日光の下だけ", "火の中", "電池の中"], explanation: "ダンゴムシはしめった暗い場所で見つかりやすいです。" },
    { prompt: "メダカがよくいる場所として考えやすいものはどれ？", correct: "小川や池などの水の中", wrongs: ["土の中だけ", "木の上だけ", "石の下だけ"], explanation: "メダカは水の中でくらす生き物です。エラで呼吸します。" },
    { prompt: "生き物のすみかを調べるとき、記録に残すとよいものはどれ？", correct: "見つけた場所・日づけ・数", wrongs: ["好きな給食だけ", "友だちの名前だけ", "テレビ番組の名前"], explanation: "場所や日づけ、数を記録すると、あとで比べやすくなります。" }
  ]);

  // F2 すみかと生き物の関係を考える(inference, d3)
  fam({
    familyId: "sci_home_relation",
    funMechanic: "inference",
    learningObjective: "生き物がその場所にいる理由を、食べ物やかくれ場所から考えられる",
    commonMistake: "生き物とすみかの理由を、見た目だけで判断する",
    estimatedSeconds: 75,
    skillTags: ["動物", "すみか", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "池の近くに多い生き物を調べる理由はどれ？", correct: "水と生き物のくらしが関係するから", wrongs: ["磁石になるから", "音が消えるから", "重さがなくなるから"], explanation: "水のある場所には水を利用する生き物がすみやすいです。" },
    { prompt: "鳥が木にいる理由として考えやすいものはどれ？", correct: "巣やえさ、休む場所があるから", wrongs: ["木が電池だから", "木が磁石だから", "木が音を消すから"], explanation: "木は鳥にとってすみかやえさ場になります。" },
    { prompt: "同じ虫でも場所によって数が違う理由として考えられるものはどれ？", correct: "食べ物やかくれ場所が違うから", wrongs: ["空の色だけが違うから", "名前が違うから", "時計が違うから"], explanation: "すみかの条件が生き物の数に関係します。" },
    { prompt: "石の下に多くの生き物が見つかる理由として考えられることはどれ？", correct: "しめっていて、敵から見つかりにくいから", wrongs: ["石が電池だから", "石がいちばん明るいから", "石は音を出すから"], explanation: "石の下はしめっていて、敵から身をかくしやすい場所です。" }
  ]);

  // F3 体の色とすみかの関係(inference, d4)
  fam({
    familyId: "sci_home_color",
    funMechanic: "inference",
    learningObjective: "体の色がすみかの環境に似ていることの意味を考えられる",
    commonMistake: "体の色とすみかの関係を、偶然だと考える",
    estimatedSeconds: 75,
    skillTags: ["動物", "からだの色", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "動物の体の色がすみかに似ていることのよさは？", correct: "敵に見つかりにくい", wrongs: ["必ず速く走れる", "重さがなくなる", "電気を通す"], explanation: "体の色は身を守ることに関係する場合があります。" },
    { prompt: "バッタが緑色をしていることが多い理由として考えられることはどれ？", correct: "草むらにまぎれて敵に見つかりにくいから", wrongs: ["緑色が一番目立つ色だから", "植物と同じ仲間だから", "特に理由はない"], explanation: "草の色に似ていることで、敵から見つかりにくくなります。" },
    { prompt: "冬に体の色が白く変わる動物がいる理由として考えられることはどれ？", correct: "雪の中で敵に見つかりにくくするため", wrongs: ["寒さで色が消えるから", "白い方がおしゃれだから", "特に理由はない"], explanation: "雪の多い地域では、体の色が雪に近い白色に変わる動物がいます。" }
  ]);

  // F4 調べ方の工夫(rule_discovery, d3)
  fam({
    familyId: "sci_home_method",
    funMechanic: "rule_discovery",
    learningObjective: "すみか調べで条件をそろえる大切さや、記録の工夫に気づける",
    commonMistake: "調べる時刻や場所をそろえずに結果をくらべてしまう",
    estimatedSeconds: 60,
    skillTags: ["動物", "調べ方", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "すみか調べで同じ時刻に調べる意味はどれ？", correct: "条件をそろえて比べやすくする", wrongs: ["早く終わるからだけ", "何も記録しないため", "虫を増やすため"], explanation: "条件をそろえると、場所の違いを考えやすくなります。" },
    { prompt: "生き物のすみかを地図にまとめるよさはどれ？", correct: "どこに多いか比べやすい", wrongs: ["記録が消える", "全部同じに見える", "場所が分からなくなる"], explanation: "地図にすると場所ごとの違いが見えやすくなります。" },
    { prompt: "校庭のいろいろな場所で生き物を調べるとき、大切な進め方はどれ？", correct: "同じ広さ・同じ時間で調べてくらべる", wrongs: ["場所ごとに調べる時間を変える", "好きな場所だけ調べる", "記録をとらない"], explanation: "条件をそろえて調べると、場所ごとのちがいを正しくくらべられます。" }
  ]);

  // F5 生き物への配慮(judge_claim, d3)
  fam({
    familyId: "sci_home_care",
    funMechanic: "judge_claim",
    learningObjective: "生き物のすみかを観察するときの、生き物への配慮について判断できる",
    commonMistake: "観察のためなら、すみかをこわしてもよいと考えてしまう",
    estimatedSeconds: 60,
    skillTags: ["動物", "配慮"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「観察した生き物は、むやみに持ち帰らずすみかを守る」。みお「観察したら全部集めてよい」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "生き物のくらしを守ることが大切です。" },
    { prompt: "はると「石をひっくり返して観察したら、もとにもどす」。みお「もどさなくてよい」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "生き物のすみかをこわさないよう、もとの状態にもどすことが大切です。" }
  ]);

  // F6 まちがい直し(find_mistake, d3)
  fam({
    familyId: "sci_home_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "生き物のすみかについてのまちがった考えに気づける",
    commonMistake: "すみかを1つの条件だけで決めつける",
    estimatedSeconds: 75,
    skillTags: ["動物", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「生き物のすみかは、どこでも同じ数だけ見つかる」と言いました。正しい説明はどれ？", correct: "場所の条件によって、見つかる数がちがう", wrongs: ["どこでも同じで正しい", "すみかは関係ない", "生き物は数えられない"], explanation: "食べ物やかくれ場所などの条件によって、見つかる生き物の数は場所ごとに違います。" }
  ]);

  // F7 予想してたしかめる(predict_check, d3)
  fam({
    familyId: "sci_home_predict",
    funMechanic: "predict_check",
    learningObjective: "生き物のすみかについて予想し、実際の観察と照らし合わせられる",
    commonMistake: "予想せずに、すぐに観察結果だけを見る",
    estimatedSeconds: 75,
    skillTags: ["動物", "予想"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "校庭の日なたと日かげ、どちらにダンゴムシが多くいるか予想してみよう。予想として合うものはどれ？", correct: "日かげの方に多くいると予想できる", wrongs: ["日なたの方に多くいる", "どちらも同じ数", "場所は関係ない"], explanation: "ダンゴムシはしめった暗い場所を好むため、日かげに多く見られやすいです。" },
    { prompt: "校庭の花だんと砂場、どちらにミミズが多くいるか予想してみよう。予想として合うものはどれ？", correct: "花だんの方に多くいると予想できる", wrongs: ["砂場の方に多くいる", "どちらも同じ数", "場所は関係ない"], explanation: "ミミズは土がしめっていて養分の多い場所を好みます。" }
  ]);

  // F8 生き物どうしのつながり(inference, d4)
  fam({
    familyId: "sci_home_food_chain",
    funMechanic: "inference",
    learningObjective: "生き物どうしの食べる・食べられるの関係を考えられる",
    commonMistake: "生き物どうしのつながりを、バラバラの存在として考える",
    estimatedSeconds: 90,
    skillTags: ["動物", "つながり", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "花だんに虫が多いと、その虫を食べる鳥も集まりやすくなります。この理由として考えられることはどれ？", correct: "鳥にとって虫が食べ物になるから", wrongs: ["鳥が花だんの色を好むから", "鳥は虫と友だちだから", "特に理由はない"], explanation: "虫を食べ物とする鳥にとって、虫が多い場所はえさ場になります。" },
    { prompt: "池のメダカが減ると、メダカを食べる鳥はどうなると考えられる？", correct: "えさが減り、その場所にいづらくなるかもしれない", wrongs: ["メダカが減っても鳥には関係ない", "鳥が増える", "鳥がメダカに変わる"], explanation: "食べ物が減ると、その生き物を食べる生き物のくらしにも影響します。" },
    { prompt: "落ち葉が多い場所にダンゴムシが多く、そのダンゴムシを食べる鳥もその場所によく来ます。この関係から考えられることはどれ？", correct: "落ち葉→ダンゴムシ→鳥という食べ物のつながりがある", wrongs: ["落ち葉と鳥には関係がない", "ダンゴムシは鳥を食べる", "鳥は落ち葉を食べる"], explanation: "落ち葉を利用するダンゴムシ、そのダンゴムシを食べる鳥という食べ物のつながりが考えられます。" }
  ]);

  // F9 どっちの言い分が正しい？2(judge_claim, d3)
  fam({
    familyId: "sci_home_judge2",
    funMechanic: "judge_claim",
    learningObjective: "生き物のすみかについての主張を、観察をもとに判断できる",
    commonMistake: "自分の身近な体験だけで、すべての場所を決めつける",
    estimatedSeconds: 75,
    skillTags: ["動物"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「生き物のすみかは、食べ物やかくれ場所と関係がある」。みお「生き物によって、すみかにする場所はちがう」。正しいのはどっち？", correct: "二人とも正しい", explanation: "生き物のすみかは食べ物やかくれ場所などの条件と関係があり、また生き物のしゅるいによってすみかにする場所もちがいます。" },
    { prompt: "はると「生き物の体の色は、すべて敵をおどろかすためについている」。みお「体の色はすみかとまったく関係ない」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "体の色がすみかの環境に似ていると敵に見つかりにくくなることがありますが、色の理由はそれだけではなく、すべてが敵をおどろかすためというわけでもありません。" },
    { prompt: "はると「観察のためなら生き物のすみかをこわしてもよい」。みお「すみかを観察するときも、生き物への配慮が必要だ」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "観察をするときも、生き物のくらしやすみかを大切にすることが必要です。" }
  ]);

  if (questions.length !== 25) throw new Error(`animal_homes: expected 25, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- 地面のようすと太陽(25)
function makeGroundSun() {
  const { questions, fam } = makeFamilyBuilder("ground_sun");

  // F1 太陽と影の基本(drill, d2)
  fam({
    familyId: "sci_sun_basic",
    funMechanic: "drill",
    learningObjective: "太陽の位置と影のでき方の関係がわかる",
    commonMistake: "影は太陽と同じ側にできると思いこむ",
    estimatedSeconds: 30,
    skillTags: ["太陽", "影"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "太陽と影の関係として正しいものはどれ？", correct: "影は太陽と反対側にできる", wrongs: ["影は太陽の中にできる", "影は必ず北だけ", "影は物がなくてもできる"], explanation: "光を物がさえぎると、反対側に影ができます。" },
    { prompt: "昼ごろの太陽は朝に比べてどう見えやすい？", correct: "高い位置に見える", wrongs: ["必ず西に沈む直前", "地面の下にある", "見えない"], explanation: "太陽は一日の中で見える位置が変わります。" },
    { prompt: "太陽が動くように見える理由として、小学校で習う考え方に合うものはどれ？", correct: "地球から見ると太陽の位置が変わって見えるから", wrongs: ["太陽が毎日形を変えるから", "太陽が消えたり現れたりするから", "雲が太陽を運んでいるから"], explanation: "地球の動きによって、太陽の見える位置が一日の中で変わって見えます。" },
    { prompt: "太陽がのぼる方角として正しいものはどれ？", correct: "東", wrongs: ["西", "南", "北"], explanation: "太陽は東からのぼり、南の空を通って西にしずみます。" }
  ]);

  // F2 日なたと日かげのちがい(rule_discovery, d3)
  fam({
    familyId: "sci_sun_shade",
    funMechanic: "rule_discovery",
    learningObjective: "日なたと日かげで、地面の温度がちがうきまりに気づける",
    commonMistake: "日なたと日かげで温度に差がないと考える",
    estimatedSeconds: 60,
    skillTags: ["太陽", "地面", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "日なたの地面が温まりやすい理由はどれ？", correct: "太陽の光が当たるから", wrongs: ["電気が流れるから", "水が増えるから", "音が大きいから"], explanation: "太陽の光が当たると地面は温まりやすいです。" },
    { prompt: "日かげの地面の特徴として考えやすいものはどれ？", correct: "日なたより温度が低いことがある", wrongs: ["必ず光る", "必ず電気が通る", "必ず重くなる"], explanation: "日光が当たりにくい場所は温まり方が違います。" },
    { prompt: "同じ日の午前と午後で、日なたの地面の温度をくらべると、午後の方が高くなりやすい理由はどれ？", correct: "午前中から日光が当たり続けて、地面があたたまってきたから", wrongs: ["午後は太陽が見えなくなるから", "午後は必ず雨がふるから", "地面の色が変わるから"], explanation: "日光が当たる時間が長くなるほど、地面はあたたまっていきます。" }
  ]);

  // F3 影の向きの予想とたしかめ(predict_check, d3)
  fam({
    familyId: "sci_sun_shadow_predict",
    funMechanic: "predict_check",
    learningObjective: "太陽の位置の変化から、影の向きの変化を予想できる",
    commonMistake: "太陽の動きと影の動きの関係を考えずに予想する",
    estimatedSeconds: 75,
    skillTags: ["太陽", "影", "予想"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "朝、影が西の方にできていました。太陽が動くと、昼の影はどちらの向きに近づくか予想してみよう。予想として合うものはどれ？", correct: "北の方に近づく", wrongs: ["東の方に近づく", "南の方に近づく", "動かない"], explanation: "朝から昼にかけて太陽は東から南の空へ動き、影はその反対の北寄りに動きます。" },
    { prompt: "朝から昼にかけて、影の向きが変わる理由はどれ？", correct: "太陽の見える位置が変わるから", wrongs: ["地面が磁石になるから", "影が生き物だから", "ものの重さが変わるから"], explanation: "太陽の位置が変わると影の向きも変わります。" },
    { prompt: "昼から夕方にかけて、影の長さはどう変わっていくと予想できる？予想してから確かめよう。予想として合うものはどれ？", correct: "だんだん長くなっていく", wrongs: ["だんだん短くなっていく", "変わらない", "急になくなる"], explanation: "太陽が低くなるにつれて、影は長くなっていきます。" }
  ]);

  // F4 実験の条件をそろえる(rule_discovery, d3)
  fam({
    familyId: "sci_sun_condition",
    funMechanic: "rule_discovery",
    learningObjective: "影の長さや地面の温度を調べるとき、条件をそろえる大切さに気づける",
    commonMistake: "調べるたびに道具や測る場所を変えてしまう",
    estimatedSeconds: 60,
    skillTags: ["太陽", "実験の条件", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "影の長さを調べるとき大切なことはどれ？", correct: "同じ棒で時刻を変えて記録する", wrongs: ["毎回棒を変える", "時刻を書かない", "影を見ない"], explanation: "同じ棒で時刻ごとに測ると変化が分かります。" },
    { prompt: "地面の温度を比べる実験でそろえる条件はどれ？", correct: "測る時刻や測り方", wrongs: ["片方だけ長く測る", "場所名を消す", "温度計を使わない"], explanation: "条件をそろえると比べやすくなります。" },
    { prompt: "日なたと日かげの温度をくらべる実験で、同じ時こくに測る理由はどれ？", correct: "時こくによって気温も変わるので、条件をそろえるため", wrongs: ["時こくは温度に関係ないから", "早く終わらせるためだけ", "記録をしなくてよいから"], explanation: "時こくがちがうと気温そのものも変わるため、同じ時こくで比べることが大切です。" }
  ]);

  // F5 記録のしかた(best_choice, d3)
  fam({
    familyId: "sci_sun_record",
    funMechanic: "best_choice",
    learningObjective: "太陽の動きや温度を記録するときに、必要な情報を選べる",
    commonMistake: "記録に時刻や方向など、比べるために必要な情報を書き忘れる",
    estimatedSeconds: 60,
    skillTags: ["太陽", "記録"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "太陽の動きを調べるとき記録するとよいものはどれ？", correct: "時刻・見える方向・高さ", wrongs: ["好きな色だけ", "給食の名前", "磁石の重さ"], explanation: "時刻と位置を記録すると太陽の動きが分かります。" },
    { prompt: "温度計を使う時に大切なことはどれ？", correct: "目盛りを正しく読む", wrongs: ["ふり回す", "目盛りを見ない", "太陽を虫めがねで見る"], explanation: "温度計は、目の高さで目盛りを正しく読みます。" }
  ]);

  // F6 まちがい直し(find_mistake, d3)
  fam({
    familyId: "sci_sun_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "太陽の動きや影についてのまちがった考えに気づける",
    commonMistake: "太陽が動く向きや、影ができる仕組みを逆に考える",
    estimatedSeconds: 75,
    skillTags: ["太陽", "影", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「影は太陽と同じ側にできる」と言いました。正しい説明はどれ？", correct: "影は太陽と反対側にできる", wrongs: ["同じ側にできるで正しい", "影は太陽の中にできる", "影は必ず動かない"], explanation: "光をものがさえぎると、その反対側に影ができます。" },
    { prompt: "みおさんは「日かげはいつも日なたより温度が高い」と言いました。正しい説明はどれ？", correct: "日かげは日なたより温度が低いことが多い", wrongs: ["日かげの方が高いで正しい", "温度に違いはない", "日かげは氷になる"], explanation: "日光が当たりにくい日かげは、日なたより温度が低いことが多いです。" }
  ]);

  // F7 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "sci_sun_judge",
    funMechanic: "judge_claim",
    learningObjective: "太陽と地面の様子についての主張を判断できる",
    commonMistake: "太陽の位置と影・気温の関係を、無関係だと考える",
    estimatedSeconds: 75,
    skillTags: ["太陽", "地面"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「影の向きは太陽の位置と関係ない」。みお「太陽の位置が変わると影の向きも変わる」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "太陽の位置が変わると、影の向きも変わります。" },
    { prompt: "はると「日光が当たる時間が長いほど地面はあたたまりやすい」。みお「地面の温度は、時こくによって変わることがある」。正しいのはどっち？", correct: "二人とも正しい", explanation: "日光が長く当たるほど地面はあたたまりやすく、また太陽の高さが変わる時こくによって地面の温度も変わります。" }
  ]);

  // F8 影の動きから太陽の動きを推理(inference, d4)
  fam({
    familyId: "sci_sun_infer",
    funMechanic: "inference",
    learningObjective: "影の動きの記録から、太陽の動きを推理できる",
    commonMistake: "影の記録から、太陽の動きへの関連づけをせずに終わる",
    estimatedSeconds: 90,
    skillTags: ["太陽", "影", "推理"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "棒の影が朝は西の方に長くのび、昼は短くなり、夕方は東の方に長くのびていました。この記録から考えられる太陽の動きはどれ？", correct: "朝は東の空、昼は高い空、夕方は西の空に太陽がある", wrongs: ["太陽は一日中同じ位置にある", "太陽は地面の下を動いている", "太陽の動きと影は関係ない"], explanation: "影は太陽の反対側にできるので、影の向きの変化から太陽の動きを考えられます。" },
    { prompt: "午前9時に短かった影が、午後3時にはまた長くなっていました。この理由として考えられることはどれ？", correct: "太陽の高さが低くなってきたから", wrongs: ["太陽が近づいてきたから", "影が重くなったから", "気温が下がったから"], explanation: "太陽の高さが低くなると、影は長くなります。" }
  ]);

  // F9 太陽と地面の様子をくらべる(compare_methods, d4)
  fam({
    familyId: "sci_sun_compare",
    funMechanic: "compare_methods",
    learningObjective: "コンクリートと土など、地面の材料による温まり方のちがいをくらべられる",
    commonMistake: "地面の材料によって温まり方が変わることを考えない",
    estimatedSeconds: 90,
    skillTags: ["太陽", "地面", "くらべる"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "同じ日光を当てても、砂場とコンクリートの地面で温まり方がちがうことがあります。正しく比べるために大切なことはどれ？", correct: "同じ時こく、同じ日光の当たり方で両方を測る", wrongs: ["砂場だけ長く日光に当てる", "コンクリートだけ日かげに置く", "測る時こくをそれぞれ変える"], explanation: "材料によるちがいを正しく比べるには、時こくや日光の条件をそろえます。" }
  ]);

  // F10 太陽の動きの予想2(predict_check, d3)
  fam({
    familyId: "sci_sun_predict2",
    funMechanic: "predict_check",
    learningObjective: "太陽の1日の動きから、次の時刻の位置を予想できる",
    commonMistake: "太陽の動く向きを考えず、思いつきで予想する",
    estimatedSeconds: 75,
    skillTags: ["太陽", "予想"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "朝9時に東の空にあった太陽は、正午にどこに見えると予想できる？", correct: "南の高い空", wrongs: ["北の空", "西のひくい空", "地面の下"], explanation: "太陽は東からのぼり、正午ごろ南の高い空に見えます。" },
    { prompt: "正午に南の高い空にあった太陽は、夕方にどこに見えると予想できる？", correct: "西のひくい空", wrongs: ["東の高い空", "北の空", "地面の下"], explanation: "太陽は南の空を通って、夕方には西にしずんでいきます。" },
    { prompt: "朝、東の空に太陽が見えました。この太陽が沈む方角として予想できるものはどれ？", correct: "西", wrongs: ["東", "北", "南"], explanation: "太陽は東からのぼり、南の空を通って西にしずみます。" }
  ]);

  if (questions.length !== 25) throw new Error(`ground_sun: expected 25, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- 太陽の光(20)
function makeSunlight() {
  const { questions, fam } = makeFamilyBuilder("sunlight");

  // F1 反射の基本(drill, d2)
  fam({
    familyId: "sci_light_basic",
    funMechanic: "drill",
    learningObjective: "光が鏡ではね返る(反射する)ことがわかる",
    commonMistake: "反射という言葉の意味を、光を吸収することと混同する",
    estimatedSeconds: 30,
    skillTags: ["日光", "反射"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "鏡で日光をはね返すことを何という？", correct: "反射", wrongs: ["発芽", "磁化", "伝導"], explanation: "光が鏡などではね返ることを反射といいます。" },
    { prompt: "日光を集めると明るさや温かさはどうなりやすい？", correct: "強くなる", wrongs: ["必ず弱くなる", "音になる", "磁石になる"], explanation: "日光を集めると、明るさや温かさが強くなります。" },
    { prompt: "虫めがねは日光をどうすることができる道具？", correct: "一点に集める", wrongs: ["音にする", "磁石にする", "重さをなくす"], explanation: "虫めがねはレンズのはたらきで、日光を一点に集めることができます。" },
    { prompt: "日光が当たっている場所は、日かげにくらべてどうなりやすい？", correct: "あたたかくなりやすい", wrongs: ["冷たくなりやすい", "暗くなりやすい", "重くなりやすい"], explanation: "日光が当たる場所は、光のエネルギーであたたまりやすくなります。" }
  ]);

  // F2 反射の向きを考える(inference, d3)
  fam({
    familyId: "sci_light_direction",
    funMechanic: "inference",
    learningObjective: "鏡の向きと、反射した光が進む方向の関係を考えられる",
    commonMistake: "鏡の向きを変えても、光の進む向きは変わらないと考える",
    estimatedSeconds: 60,
    skillTags: ["日光", "反射", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "鏡で日光を当てる場所を変えるには？", correct: "鏡の向きを変える", wrongs: ["紙の名前を変える", "重さを測る", "音を出す"], explanation: "鏡の向きを変えると、反射した光の進む向きが変わります。" },
    { prompt: "鏡を2枚使うと明るさが変わる理由として考えられるものは？", correct: "光を重ねて当てられるから", wrongs: ["鏡が重くなるから", "音が出るから", "水が増えるから"], explanation: "複数の鏡で光を同じ場所に集めると明るくなります。" },
    { prompt: "鏡で日光を反射させて壁に当てたとき、鏡を少し上に向けると、壁の光の位置はどうなる？", correct: "上の方に動く", wrongs: ["下の方に動く", "動かない", "消える"], explanation: "鏡の向きを変えると、反射する光の向きも変わります。" }
  ]);

  // F3 色と温まり方の予想(predict_check, d4)
  fam({
    familyId: "sci_light_color_predict",
    funMechanic: "predict_check",
    learningObjective: "紙の色によって温まり方がちがうことを予想し、たしかめられる",
    commonMistake: "色と光の吸収の関係を考えず、色は見た目だけの違いだと思う",
    estimatedSeconds: 75,
    skillTags: ["日光", "色", "予想"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "黒い紙と白い紙に同じように日光を当てたら、どちらが温まりやすいか予想してみよう。予想として合うものはどれ？", correct: "黒い紙の方が温まりやすい", wrongs: ["白い紙の方が温まりやすい", "どちらも同じ", "色は関係ない"], explanation: "色によって光の吸収のされ方が違うことがあります。" },
    { prompt: "日光が当たった黒い紙と白い紙を比べると？", correct: "黒い紙の方が温まりやすいことがある", wrongs: ["白い紙だけが必ず燃える", "どちらも温度が下がる", "色は関係なく必ず同じ"], explanation: "色によって光の吸収のされ方が違うことがあります。" },
    { prompt: "黒い服と白い服、夏に着るとどちらの方が暑く感じやすいか予想してみよう。予想として合うものはどれ？", correct: "黒い服の方が暑く感じやすい", wrongs: ["白い服の方が暑く感じやすい", "どちらも同じ", "服の色は関係ない"], explanation: "黒は光を多く吸収するため、あたたかくなりやすい性質があります。" }
  ]);

  // F4 安全な使い方(judge_claim, d3)
  fam({
    familyId: "sci_light_safety",
    funMechanic: "judge_claim",
    learningObjective: "日光を集める実験での安全な行動について判断できる",
    commonMistake: "実験の楽しさだけを考え、目や人への危険を軽視する",
    estimatedSeconds: 60,
    skillTags: ["日光", "安全"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「集めた日光を人や目に向けてはいけない」。みお「集めた日光は友だちに見せてもよい」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "集めた日光は強いので、人や目に向けてはいけません。" },
    { prompt: "はると「集めた光をじっくり見て確かめるとよい」。みお「虫めがねで日光を集めるとき、強い光を直接見てはいけない」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "強い光を直接見ると目に危険なので、見ないようにします。" },
    { prompt: "はると「反射させた日光も、人の目に向けてはいけない」。みお「反射した光は弱いので、人に向けても平気だ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "反射した光でも、目に入ると危険なことがあるので、人に向けないようにします。" }
  ]);

  // F5 実験の道具選び(best_choice, d3)
  fam({
    familyId: "sci_light_tool",
    funMechanic: "best_choice",
    learningObjective: "光や温度を調べる実験に合った道具を選べる",
    commonMistake: "調べたい内容と道具の役目が合っていない組み合わせを選ぶ",
    estimatedSeconds: 60,
    skillTags: ["日光", "道具"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "日光を集める実験で温度を比べるなら何を使う？", correct: "温度計", wrongs: ["方位磁針", "磁石", "糸電話"], explanation: "ものの温まり方は、温度計を使って調べられます。" },
    { prompt: "日光の進み方を調べるときに見ることはどれ？", correct: "光がどこに当たるか", wrongs: ["紙のにおい", "磁石の極", "豆電球の明るさだけ"], explanation: "光が当たる場所を見ると進み方を考えられます。" }
  ]);

  // F6 まちがい直し(find_mistake, d3)
  fam({
    familyId: "sci_light_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "日光の反射や集め方についてのまちがった考えに気づける",
    commonMistake: "光は鏡の向きに関係なく、いつも同じ方向に反射すると思いこむ",
    estimatedSeconds: 75,
    skillTags: ["日光", "反射", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「鏡の向きを変えても、反射する光の向きは変わらない」と言いました。正しい説明はどれ？", correct: "鏡の向きを変えると、反射する光の向きも変わる", wrongs: ["変わらないで正しい", "鏡はいつも同じ光を出す", "鏡は光を作り出している"], explanation: "鏡の向きを変えると、反射した光が進む向きも変わります。" }
  ]);

  // F7 光と熱の関係を考える(inference, d4)
  fam({
    familyId: "sci_light_heat",
    funMechanic: "inference",
    learningObjective: "日光が集まる場所ほど、あたたかくなりやすいことを考えられる",
    commonMistake: "光の明るさと温度の関係を考えない",
    estimatedSeconds: 75,
    skillTags: ["日光", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "虫めがねで日光を集めた場所に紙を置くと、しばらくして紙のどんな変化が見られやすい？", correct: "こげたり、けむりが出たりする", wrongs: ["紙が冷たくなる", "紙が青くなる", "何も起こらない"], explanation: "日光を集めた場所は温度が非常に高くなり、紙がこげることがあります。" },
    { prompt: "虫めがねの大きさを大きくすると、集められる日光の量はどうなると考えられる？", correct: "多くなり、より熱くなりやすい", wrongs: ["少なくなる", "変わらない", "光が消える"], explanation: "レンズが大きいほど、より多くの日光を集めることができます。" }
  ]);

  // F8 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "sci_light_judge",
    funMechanic: "judge_claim",
    learningObjective: "日光の反射・集光についての主張を判断できる",
    commonMistake: "レンズや鏡の大きさと、光の量の関係を考えない",
    estimatedSeconds: 75,
    skillTags: ["日光"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「虫めがねが大きいほど、多くの日光を集められる」。みお「虫めがねで集めた日光を紙に当てると、紙があつくなることがある」。正しいのはどっち？", correct: "二人とも正しい", explanation: "レンズが大きいほど多くの日光を集められ、集めた日光を当てた紙はあつくなり、こげることもあります。" },
    { prompt: "はると「白い紙のほうが黒い紙より日光を吸収しやすい」。みお「紙の色は日光の吸収に関係ない」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "黒い色は光を多く吸収してあたたまりやすく、白い色は光を反射しやすいので、黒い紙のほうが日光を吸収しやすいです。" }
  ]);

  if (questions.length !== 20) throw new Error(`sunlight: expected 20, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- 電気の通り道(25)
function makeElectricPath() {
  const { questions, fam } = makeFamilyBuilder("electric_path");

  // F1 電気を通す・通さないもの(drill, d2)
  fam({
    familyId: "sci_electric_material",
    funMechanic: "drill",
    learningObjective: "金属は電気を通しやすく、ゴムなどは通しにくいことがわかる",
    commonMistake: "見た目が金属っぽいかどうかだけで、電気を通すか判断する",
    estimatedSeconds: 30,
    skillTags: ["電気", "材料"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "電気を通しやすいものはどれ？", correct: "金属", wrongs: ["紙", "木", "ゴム"], explanation: "金属は電気を通しやすいものが多いです。" },
    { prompt: "電気を通しにくいものはどれ？", correct: "ゴム", wrongs: ["鉄", "銅", "アルミニウム"], explanation: "ゴムは電気を通しにくいもの（絶縁体）です。" },
    { prompt: "回路の学習で『導体』に近いものはどれ？", correct: "電気を通しやすいもの", wrongs: ["音を出すもの", "水を吸うもの", "太陽を動かすもの"], explanation: "導体は金属など、電気を通しやすいものです。" },
    { prompt: "電気を通しやすい金属として、教科書によく出てくるものはどれ？", correct: "銅", wrongs: ["ガラス", "プラスチック", "木"], explanation: "銅は電気を通しやすい金属で、導線によく使われます。" }
  ]);

  // F2 回路のしくみ(rule_discovery, d3)
  fam({
    familyId: "sci_electric_circuit",
    funMechanic: "rule_discovery",
    learningObjective: "電気が輪のようにつながって流れる(回路になる)きまりに気づける",
    commonMistake: "導線が1本つながっているだけで回路が完成すると思いこむ",
    estimatedSeconds: 60,
    skillTags: ["電気", "回路", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "豆電球を光らせるために必要なものはどれ？", correct: "電気の通り道が輪のようにつながること", wrongs: ["導線が一本だけ空中にあること", "電池をかくすこと", "磁石を近づけるだけ"], explanation: "電気が通る道がつながると豆電球が光ります。" },
    { prompt: "導線のビニル部分をつないでも光らない理由は？", correct: "ビニルは電気を通しにくいから", wrongs: ["ビニルが重いから", "ビニルが光るから", "ビニルが北を向くから"], explanation: "導線のビニル部分は電気を通しにくいので、明かりはつきません。" },
    { prompt: "電池と豆電球を1本の導線だけでつないでも、豆電球はつきません。この理由として合うものはどれ？", correct: "輪のようにつながっていないと電気が流れないから", wrongs: ["導線が短すぎるから", "電池が新しすぎるから", "豆電球が大きすぎるから"], explanation: "電気が流れるには、電池から豆電球を通ってまた電池にもどる輪の形が必要です。" }
  ]);

  // F3 まちがい直し(find_mistake, d3)
  fam({
    familyId: "sci_electric_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "豆電球がつかないときの原因を考え、まちがいに気づける",
    commonMistake: "豆電球がつかない原因を、回路以外の場所にばかり探してしまう",
    estimatedSeconds: 75,
    skillTags: ["電気", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "豆電球がつかない時に考えることはどれ？", correct: "回路が切れていないか調べる", wrongs: ["太陽の高さだけ見る", "虫の数を数える", "紙を温める"], explanation: "回路が切れていると電気が通らず光りません。" },
    { prompt: "はるとさんは「豆電球がつかないのは、豆電球が古いからにちがいない」と決めつけました。まず確かめるべきことはどれ？", correct: "導線がすべてきちんとつながっているか", wrongs: ["豆電球の値段", "豆電球の色", "電池の色"], explanation: "まず回路がきちんとつながっているかを確かめます。" },
    { prompt: "みおさんは「電池の向きは豆電球の明るさに関係ない」と言いました。正しい説明はどれ？", correct: "電池の向きは回路のつながり方に関係する", wrongs: ["関係ないで正しい", "電池の向きは色を変えるだけ", "電池の向きは無意味"], explanation: "電池の向きによって、回路がつながるかどうかが変わることがあります。" }
  ]);

  // F4 スイッチと電池のはたらき(drill, d2)
  fam({
    familyId: "sci_electric_switch",
    funMechanic: "drill",
    learningObjective: "スイッチや電池の向きが回路にどう関わるかわかる",
    commonMistake: "スイッチのはたらきを、回路をつなぐことだけだと思い、切ることを忘れる",
    estimatedSeconds: 45,
    skillTags: ["電気", "回路"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "スイッチの役目はどれ？", correct: "電気の通り道をつなげたり切ったりする", wrongs: ["日光を集める", "音を高くする", "水を吸う"], explanation: "スイッチは回路をつないだり切ったりします。" },
    { prompt: "乾電池の向きを変えると調べられることはどれ？", correct: "電流の向きとつながり", wrongs: ["植物の高さ", "虫のすみか", "影の長さだけ"], explanation: "電池のつなぎ方は回路の働きに関係します。" },
    { prompt: "回路の途中にスイッチを入れておくよさはどれ？", correct: "必要なときだけ電気を流せる", wrongs: ["電池がいらなくなる", "豆電球が明るくなる", "導線が短くなる"], explanation: "スイッチがあると、使わないときは回路を切って電気を止められます。" }
  ]);

  // F5 材料をくらべる実験(compare_methods, d3)
  fam({
    familyId: "sci_electric_test",
    funMechanic: "compare_methods",
    learningObjective: "いろいろな材料が電気を通すかどうかを、条件をそろえて調べられる",
    commonMistake: "調べる材料ごとに、回路や電池を変えてしまう",
    estimatedSeconds: 75,
    skillTags: ["電気", "実験の進め方"],
    axes: { knowledge: 2, info: 2, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "電気が通るか調べる実験で大切なことは？", correct: "同じ回路で材料だけ変える", wrongs: ["毎回電池も豆電球も変える", "記録しない", "結果を見ない"], explanation: "材料だけを変えると、電気を通すか比べやすくなります。" },
    { prompt: "10円玉と消しゴムのどちらが電気を通すか調べたい。正しい調べ方はどれ？", correct: "同じ回路にそれぞれをつないで、豆電球がつくか見る", wrongs: ["見た目の色だけで判断する", "重さをくらべて判断する", "におうかどうかで判断する"], explanation: "回路につないで、実際に豆電球がつくかどうかで電気を通すか調べます。" },
    { prompt: "アルミはくとゴムひも、どちらが電気を通すか調べたい。公平にくらべるために大切なことはどれ？", correct: "同じ回路・同じ電池で、材料だけ変えてつなぐ", wrongs: ["それぞれ別の電池を使う", "見た目だけで決める", "回路を毎回作り直して条件を変える"], explanation: "材料以外の条件をそろえることで、正しく比べることができます。" }
  ]);

  // F6 豆電球がついたことから考える(inference, d3)
  fam({
    familyId: "sci_electric_infer",
    funMechanic: "inference",
    learningObjective: "豆電球がついた・つかなかった結果から、回路の状態を推理できる",
    commonMistake: "結果から原因を考えず、結果だけを記録して終わる",
    estimatedSeconds: 60,
    skillTags: ["電気", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "豆電球が光ったということから分かることは？", correct: "電気の通り道がつながっている", wrongs: ["植物が育った", "影が短い", "磁石のN極だけがある"], explanation: "光ることは回路がつながった手がかりです。" },
    { prompt: "ある材料を回路につないだら豆電球がついた。この材料について分かることはどれ？", correct: "電気を通す材料である", wrongs: ["磁石である", "植物である", "電気を通さない材料である"], explanation: "豆電球がついたことから、その材料が電気を通すことが分かります。" }
  ]);

  // F7 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "sci_electric_judge",
    funMechanic: "judge_claim",
    learningObjective: "電気の通り道についての主張を判断できる",
    commonMistake: "見た目が金属っぽいかどうかだけで、電気を通すか判断してしまう",
    estimatedSeconds: 75,
    skillTags: ["電気"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「金属はすべて電気を通さない」。みお「金属はほとんど電気を通す」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "鉄・銅・アルミニウムなど、多くの金属は電気を通します。" },
    { prompt: "はると「回路が切れていても、電池が新しければ豆電球はつく」。みお「回路の一部が切れていても豆電球はつく」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "回路がどこか1か所でも切れていると電気は流れず、電池が新しくても豆電球はつきません。" }
  ]);

  // F8 電気を通すもの探し(inference, d4)
  fam({
    familyId: "sci_electric_search",
    funMechanic: "inference",
    learningObjective: "身の回りのものが電気を通すかどうかを、材料の性質から予想できる",
    commonMistake: "見た目の色や重さだけで、電気を通すか判断してしまう",
    estimatedSeconds: 75,
    skillTags: ["電気", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "スプーンには金属製とプラスチック製があります。電気を通しやすいのはどちらと予想できる？", correct: "金属製のスプーン", wrongs: ["プラスチック製のスプーン", "どちらも同じ", "スプーンは電気を通さない"], explanation: "金属は電気を通しやすい性質があります。" },
    { prompt: "はさみの持ち手はプラスチック、刃は金属でできています。回路にはさみをつないだとき、電気が通る部分はどこと予想できる？", correct: "金属の刃の部分", wrongs: ["プラスチックの持ち手の部分", "どちらも通る", "どちらも通らない"], explanation: "金属は電気を通しますが、プラスチックは電気を通しにくい材料です。" }
  ]);

  // F9 回路の組み方をくらべる(compare_methods, d4)
  fam({
    familyId: "sci_electric_circuit_compare",
    funMechanic: "compare_methods",
    learningObjective: "豆電球のつなぎ方による明るさのちがいを考えられる",
    commonMistake: "豆電球の数と明るさの関係を考えない",
    estimatedSeconds: 90,
    skillTags: ["電気", "くらべる"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "同じ電池に、豆電球を1個つないだ回路と2個つないだ回路をつくりました。それぞれの豆電球の明るさをくらべる実験で大切なことはどれ？", correct: "同じ種類の電池と豆電球を使い、数だけ変える", wrongs: ["電池の種類も豆電球の種類も変える", "1回しか実験しない", "見た目の印象だけで比べる"], explanation: "豆電球の数以外の条件をそろえることで、正しく明るさを比べられます。" }
  ]);

  // F10 予想してたしかめる(predict_check, d3)
  fam({
    familyId: "sci_electric_predict",
    funMechanic: "predict_check",
    learningObjective: "回路のつなぎ方から、豆電球がつくかどうかを予想できる",
    commonMistake: "予想せずに、すぐ実験結果だけを見る",
    estimatedSeconds: 75,
    skillTags: ["電気", "予想"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "電池・豆電球・導線を輪のようにつなぐ前に予想してみよう。正しくつなげたら、豆電球はどうなると予想できる？", correct: "つく", wrongs: ["つかない", "こわれる", "音が出る"], explanation: "電気の通り道が輪のようにつながると、豆電球はつきます。" },
    { prompt: "導線の途中を紙で置きかえてつないだら、豆電球はどうなると予想できる？", correct: "つかない", wrongs: ["いつもよりよくつく", "音が出る", "光の色が変わる"], explanation: "紙は電気を通しにくいので、回路がつながらず豆電球はつきません。" }
  ]);

  if (questions.length !== 25) throw new Error(`electric_path: expected 25, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- じしゃくのふしぎ(20)
function makeMagnets() {
  const { questions, fam } = makeFamilyBuilder("magnets");

  // F1 磁石につくもの(drill, d2)
  fam({
    familyId: "sci_magnet_material",
    funMechanic: "drill",
    learningObjective: "磁石が鉄などの金属を引きつけることがわかる",
    commonMistake: "すべての金属が磁石につくと思いこむ",
    estimatedSeconds: 30,
    skillTags: ["磁石", "材料"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "磁石につきやすいものはどれ？", correct: "鉄のくぎ", wrongs: ["木の板", "紙", "ゴム"], explanation: "鉄は磁石につきやすい金属です。木や紙、ゴムはつきません。" },
    { prompt: "鉄のクリップが磁石についた理由はどれ？", correct: "磁石が鉄を引きつけたから", wrongs: ["クリップが植物だから", "光が反射したから", "音が出たから"], explanation: "磁石は鉄などの金属を引きつける性質があります。" },
    { prompt: "磁石にアルミニウムを近づけるとどうなる？", correct: "つかないことが多い", wrongs: ["必ずつく", "音が出る", "磁石が消える"], explanation: "アルミニウムは鉄とちがい、磁石につきにくい金属です。" },
    { prompt: "磁石に鉄のスプーンを近づけるとどうなる？", correct: "つく", wrongs: ["つかない", "こわれる", "色が変わる"], explanation: "鉄でできたスプーンは、磁石につきます。" }
  ]);

  // F2 極どうしの関係(rule_discovery, d3)
  fam({
    familyId: "sci_magnet_poles",
    funMechanic: "rule_discovery",
    learningObjective: "磁石の同じ極どうしはしりぞけ合い、ちがう極どうしは引き合うきまりに気づける",
    commonMistake: "極の組み合わせに関わらず、磁石どうしは必ずくっつくと思いこむ",
    estimatedSeconds: 60,
    skillTags: ["磁石", "極", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "磁石の同じ極どうしを近づけるとどうなる？", correct: "しりぞけ合う", wrongs: ["必ずくっつく", "消える", "水になる"], explanation: "同じ極どうし（N極とN極など）はしりぞけ合います。" },
    { prompt: "磁石のちがう極どうしを近づけるとどうなる？", correct: "引き合う", wrongs: ["しりぞけ合うだけ", "音になる", "重さがなくなる"], explanation: "ちがう極（N極とS極）どうしは引き合います。" },
    { prompt: "棒磁石のN極とS極を、教科書でよく見る色で表すとどうなっている？", correct: "N極が赤、S極が青(または白)で色分けされる", wrongs: ["N極もS極も同じ色", "N極が緑、S極が黄色", "色の決まりはない"], explanation: "多くの教材で、N極を赤、S極を青(または白)で色分けして表します。" }
  ]);

  // F3 磁石の力の強さ(inference, d3)
  fam({
    familyId: "sci_magnet_strength",
    funMechanic: "inference",
    learningObjective: "磁石の場所によって、鉄を引きつける力の強さがちがうことを考えられる",
    commonMistake: "磁石のどこでも同じ強さで引きつけると思いこむ",
    estimatedSeconds: 60,
    skillTags: ["磁石", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "磁石の力が強い場所としてよく見られるのは？", correct: "極の近く", wrongs: ["真ん中だけ", "紙の上だけ", "水の中だけ"], explanation: "磁石は極の近くでよく鉄を引きつけます。" },
    { prompt: "方位磁針が北を指すのは何と関係がある？", correct: "地球の磁石のようなはたらき", wrongs: ["植物の根", "音のふるえ", "ゴムの力"], explanation: "方位磁針は磁石の性質を利用しています。" },
    { prompt: "磁石を使った道具として合うものはどれ？", correct: "方位磁針", wrongs: ["虫めがね", "温度計", "ものさし"], explanation: "方位磁針は、磁石が南北を向く性質を利用しています。" },
    { prompt: "磁石を自由に動けるようにしてしばらく待つと、どうなる？", correct: "北と南の方向を向いて止まる", wrongs: ["東西の方向を向いて止まる", "回り続ける", "落ちてしまう"], explanation: "磁石は地球の磁力の影響で、自由に動けるようにすると北と南を指して止まります。" }
  ]);

  // F4 材料をくらべる実験(compare_methods, d3)
  fam({
    familyId: "sci_magnet_test",
    funMechanic: "compare_methods",
    learningObjective: "いろいろな材料が磁石につくかどうかを、条件をそろえて調べられる",
    commonMistake: "材料ごとに磁石との近づけ方を変えて、正しく比べられなくなる",
    estimatedSeconds: 75,
    skillTags: ["磁石", "実験の進め方"],
    axes: { knowledge: 2, info: 2, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "磁石につくか調べる時に大切な方法は？", correct: "いろいろな材料を同じように近づける", wrongs: ["一つだけ見て決める", "名前で決める", "色だけで決める"], explanation: "材料を同じ条件で比べると分かりやすいです。" },
    { prompt: "アルミ缶が磁石につかないことがある理由は？", correct: "鉄ではない材料だから", wrongs: ["必ず電池だから", "音が小さいから", "太陽が低いから"], explanation: "磁石につくかどうかは材料によって違います。" },
    { prompt: "10円玉(銅)と1円玉(アルミニウム)、どちらも磁石につくか調べたい。正しい調べ方はどれ？", correct: "同じ磁石で同じように近づけて、両方をたしかめる", wrongs: ["10円玉だけ強く近づける", "1円玉だけ遠くから近づける", "見た目だけで判断する"], explanation: "同じ条件で近づけることで、正しく比べられます。" }
  ]);

  // F5 磁石の学習のまとめ(judge_claim, d3)
  fam({
    familyId: "sci_magnet_judge",
    funMechanic: "judge_claim",
    learningObjective: "磁石の性質についての主張を、学んだ知識で判断できる",
    commonMistake: "磁石の力は材料や極に関わらず一定だと考える",
    estimatedSeconds: 60,
    skillTags: ["磁石"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「磁石の働きは、近づける材料や極によって変わる」。みお「磁石は、はなれていても鉄を引きつけることがある」。正しいのはどっち？", correct: "二人とも正しい", explanation: "磁石の働きは近づける材料や極によって変わり、また少しはなれていても鉄を引きつけることがあります。" }
  ]);

  // F6 まちがい直し(find_mistake, d3)
  fam({
    familyId: "sci_magnet_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "磁石の極についてのまちがった考えに気づける",
    commonMistake: "極どうしの関係(しりぞけ合う・引き合う)を逆に覚える",
    estimatedSeconds: 75,
    skillTags: ["磁石", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「N極とN極を近づけると引き合う」と言いました。正しい説明はどれ？", correct: "N極とN極は同じ極なので、しりぞけ合う", wrongs: ["引き合うで正しい", "何も起こらない", "音が出る"], explanation: "同じ極どうし(N極とN極、S極とS極)はしりぞけ合います。" }
  ]);

  // F7 磁石で動くものを予想する(predict_check, d4)
  fam({
    familyId: "sci_magnet_predict",
    funMechanic: "predict_check",
    learningObjective: "磁石に近づけたときの動きを予想し、実際とくらべられる",
    commonMistake: "予想せずに、実際に近づけた結果だけを見る",
    estimatedSeconds: 75,
    skillTags: ["磁石", "予想"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "方位磁針のN極に、棒磁石のN極を近づけると、方位磁針の針はどうなると予想できる？", correct: "方位磁針の針がしりぞけられて動く", wrongs: ["ぴったりくっつく", "何も起こらない", "針が消える"], explanation: "同じ極どうしはしりぞけ合うので、方位磁針の針が動きます。" },
    { prompt: "2つの棒磁石のN極とS極を近づけると、どうなると予想できる？", correct: "引き合ってくっつく", wrongs: ["しりぞけ合う", "何も起こらない", "磁石が消える"], explanation: "ちがう極どうしは引き合います。同じ極どうしはしりぞけ合います。" }
  ]);

  // F8 磁石になかまはずれ探し(rule_discovery, d3)
  fam({
    familyId: "sci_magnet_odd",
    funMechanic: "rule_discovery",
    learningObjective: "磁石につく材料とつかない材料をなかま分けできる",
    commonMistake: "金属という共通点だけで、すべて磁石につくと考える",
    estimatedSeconds: 60,
    skillTags: ["磁石", "なかま分け"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "磁石につかないものはどれ？（鉄のくぎ・鉄のクリップ・アルミニウムはく・鉄のスプーン）", correct: "アルミニウムはく", wrongs: ["鉄のくぎ", "鉄のクリップ", "鉄のスプーン"], explanation: "鉄でできたものは磁石につきますが、アルミニウムは磁石につきにくい金属です。" }
  ]);

  // F9 磁石の力が届く距離(inference, d4)
  fam({
    familyId: "sci_magnet_distance",
    funMechanic: "inference",
    learningObjective: "磁石と鉄との距離によって、引きつける力の強さが変わることを考えられる",
    commonMistake: "磁石の力はどんなに離れていても同じ強さだと思いこむ",
    estimatedSeconds: 75,
    skillTags: ["磁石", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "磁石を鉄のクリップに少しずつ近づけていくと、クリップが動き出すのはどんなときと考えられる？", correct: "磁石がある程度近づいたとき", wrongs: ["磁石がとても遠いとき", "距離に関係なくいつも動く", "磁石が見えなくなったとき"], explanation: "磁石の力は、ある程度近づかないと鉄を引きつけるほど強くはたらきません。" }
  ]);

  if (questions.length !== 20) throw new Error(`magnets: expected 20, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- ものの重さ(20)
function makeWeight() {
  const { questions, fam } = makeFamilyBuilder("weight");

  // F1 重さの基本(drill, d2)
  fam({
    familyId: "sci_weight_basic",
    funMechanic: "drill",
    learningObjective: "ものの重さを、はかりや単位を使って正しく調べられる",
    commonMistake: "重さを手ざわりや見た目だけで比べようとする",
    estimatedSeconds: 30,
    skillTags: ["重さ", "測定"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "物の重さを調べる道具はどれ？", correct: "はかり", wrongs: ["方位磁針", "虫めがね", "糸電話"], explanation: "ものの重さは、はかりを使って調べます。" },
    { prompt: "重さを記録するときに必要なものはどれ？", correct: "数と単位", wrongs: ["色だけ", "名前だけ", "好き嫌い"], explanation: "重さは g などの単位と一緒に記録します。" },
    { prompt: "重さの単位として、小学校でよく使うものはどれ？", correct: "g(グラム)", wrongs: ["m(メートル)", "℃(度)", "L(リットル)"], explanation: "重さはgやkgという単位で表します。" },
    { prompt: "1000gを表す単位はどれ？", correct: "1kg", wrongs: ["1mg", "1L", "1m"], explanation: "1000gは1kg(キログラム)と表せます。" }
  ]);

  // F2 形を変えても重さは変わらない(rule_discovery, d3)
  fam({
    familyId: "sci_weight_conservation",
    funMechanic: "rule_discovery",
    learningObjective: "ものの形を変えても、量が変わらなければ重さは変わらないきまりに気づける",
    commonMistake: "形が変わると、ものの重さも変わると思いこむ",
    estimatedSeconds: 60,
    skillTags: ["重さ", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "同じ形のねん土を丸めても重さはどうなる？", correct: "形を変えても重さは変わらない", wrongs: ["必ず軽くなる", "必ず重くなる", "消える"], explanation: "形を変えても、物の量が同じなら重さは変わりません。" },
    { prompt: "ねん土を小さく分けた後、全部合わせた重さは？", correct: "分ける前と同じ", wrongs: ["必ず半分", "必ず2倍", "なくなる"], explanation: "分けても全部合わせれば物の量は同じです。" },
    { prompt: "重さが変わらない例として合うものはどれ？", correct: "紙を折っても同じ紙なら重さは同じ", wrongs: ["水をこぼしても同じ", "半分捨てても同じ", "一部を切ってなくしても同じ"], explanation: "物の量が変わらなければ、形が変わっても重さは同じです。" },
    { prompt: "アルミはくを丸めて小さくすると、重さはどうなる？", correct: "変わらない", wrongs: ["軽くなる", "重くなる", "0になる"], explanation: "形を変えるだけで材料の量は変わらないので、重さも変わりません。" }
  ]);

  // F3 同じ体積でも重さがちがう(predict_check, d4)
  fam({
    familyId: "sci_weight_material_predict",
    funMechanic: "predict_check",
    learningObjective: "同じ大きさでも、材料によって重さがちがうことを予想しくらべられる",
    commonMistake: "同じ大きさなら重さも同じだと思いこむ",
    estimatedSeconds: 75,
    skillTags: ["重さ", "予想"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "同じ大きさの鉄の玉と発ぽうスチロールの玉、どちらが重いか予想してみよう。予想として合うものはどれ？", correct: "鉄の玉の方が重い", wrongs: ["発ぽうスチロールの方が重い", "どちらも同じ重さ", "大きさが同じなら材料は関係ない"], explanation: "同じ体積でも、材料によって重さが違うことがあります。" },
    { prompt: "同じ体積でも材料が違うと重さはどうなる？", correct: "材料によって変わる", wrongs: ["必ず同じ", "必ず0になる", "必ず軽くなる"], explanation: "同じ大きさでも材料が違うと重さが違うことがあります。" },
    { prompt: "同じ大きさの木の玉と鉄の玉、どちらが軽いか予想してみよう。予想として合うものはどれ？", correct: "木の玉の方が軽い", wrongs: ["鉄の玉の方が軽い", "どちらも同じ重さ", "大きさが同じなら重さも同じ"], explanation: "同じ体積でも、木は鉄より軽い材料です。" }
  ]);

  // F4 公平な比べ方(compare_methods, d3)
  fam({
    familyId: "sci_weight_compare",
    funMechanic: "compare_methods",
    learningObjective: "重さを公平にくらべる方法(同じはかり・単位)を選べる",
    commonMistake: "手で持った感覚だけで、正確な重さをくらべようとする",
    estimatedSeconds: 60,
    skillTags: ["重さ", "実験の進め方"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "重さを公平にくらべる方法はどれ？", correct: "同じはかりで測る", wrongs: ["片方だけ手で持つ", "目分量だけで決める", "毎回単位を変える"], explanation: "同じ道具と単位で測ると比べやすいです。" },
    { prompt: "重い・軽いを正確に比べたい時に大切なことは？", correct: "はかりで数値を調べる", wrongs: ["手ざわりだけ", "色だけ", "においだけ"], explanation: "正確に比べるには、はかりで数値（グラム）を測ります。" },
    { prompt: "2つのボールの重さをくらべたい。正しい比べ方はどれ？", correct: "同じはかりで、それぞれ順番に測る", wrongs: ["片方だけ手で持って軽そうと判断する", "見た目の大きさだけで判断する", "色で判断する"], explanation: "同じはかりで数値を測ることで、正確にくらべられます。" }
  ]);

  // F5 入れ物の重さに注意(find_mistake, d3)
  fam({
    familyId: "sci_weight_container",
    funMechanic: "find_mistake",
    learningObjective: "袋や入れ物ごと測るとき、入れ物の重さも含まれることに気づける",
    commonMistake: "入れ物の重さを考えず、中身だけの重さだと思いこむ",
    estimatedSeconds: 60,
    skillTags: ["重さ", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "同じ物を袋に入れて測る時に気をつけることは？", correct: "袋の重さも入ること", wrongs: ["袋は必ず0gになる", "袋は見えない", "袋は磁石になる"], explanation: "入れ物も一緒に測ると、その重さも含まれます。" },
    { prompt: "みおさんは「はかりで測った100gがすべてビー玉の重さだ」と言いましたが、ビー玉は入れ物に入れて測りました。正しい考え方はどれ？", correct: "100gから入れ物の重さを引いた分がビー玉の重さ", wrongs: ["100gがすべてビー玉の重さで正しい", "入れ物の重さは無視してよい", "ビー玉の重さは分からない"], explanation: "入れ物ごと測った重さから、入れ物の重さを引くとビー玉だけの重さがわかります。" }
  ]);

  // F6 重さの推理(inference, d4)
  fam({
    familyId: "sci_weight_infer",
    funMechanic: "inference",
    learningObjective: "全体の重さと一部の重さから、残りの重さを推理できる",
    commonMistake: "全体と部分の重さの関係を考えず、計算せずに答える",
    estimatedSeconds: 75,
    skillTags: ["重さ", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "箱と中身をあわせて300gでした。箱だけの重さが50gだとわかっているとき、中身の重さはどう求める？", correct: "300gから50gを引く", wrongs: ["300gに50gをたす", "300gを50gでわる", "50gだけで考える"], explanation: "全体の重さから、箱の重さを引くと中身の重さがわかります。" },
    { prompt: "同じ大きさのねん土を2つに分けたら、一方が60gでした。分ける前の重さが100gだったとすると、もう一方は何g？", correct: "40g", wrongs: ["60g", "100g", "160g"], explanation: "100gから60gを引くと、もう一方は40gです。" }
  ]);

  // F7 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "sci_weight_judge",
    funMechanic: "judge_claim",
    learningObjective: "ものの重さについての主張を、学んだ知識で判断できる",
    commonMistake: "形や見た目が変わると、重さも変わると考えてしまう",
    estimatedSeconds: 75,
    skillTags: ["重さ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「形を変えても、ものの量が同じなら重さは変わらない」。みお「ねん土をいくつかに分けても、全部集めると重さは同じ」。正しいのはどっち？", correct: "二人とも正しい", explanation: "形を変えても量が同じなら重さは変わらず、分けて集めても全体の重さは変わりません。" },
    { prompt: "はると「重さは、ものの形を見ただけで正確にわかる」。みお「同じ体積なら材料が何でも重さは同じ」。正しいのはどっち？", correct: "二人ともまちがい", explanation: "同じ体積でも材料によって重さはちがうことがあり、重さは形を見ただけでは正確にはわからず、はかりで調べる必要があります。" }
  ]);

  if (questions.length !== 20) throw new Error(`weight: expected 20, got ${questions.length}`);
  return questions;
}

const questions = [
  ...makeNatureObservation(),
  ...makePlantsGrowth(),
  ...makeInsectsGrowth(),
  ...makeWindRubber(),
  ...makeSound(),
  ...makeAnimalHomes(),
  ...makeGroundSun(),
  ...makeSunlight(),
  ...makeElectricPath(),
  ...makeMagnets(),
  ...makeWeight()
];

if (questions.length !== 260) {
  throw new Error(`Expected 260 Science questions, got ${questions.length}`);
}

await mkdir(new URL("../src/data/questions/grade3/science/", import.meta.url), { recursive: true });
writeFileSync(outFile, `window.CHIBI_QUEST_SCIENCE_QUESTIONS = ${JSON.stringify(questions, null, 2)};\n`);
console.log(`Generated ${questions.length} Science questions`);

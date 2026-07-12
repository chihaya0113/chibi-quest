import { writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";

const outFile = new URL("../src/data/questions/grade3/social/questions.js", import.meta.url);

const unitLabels = {
  local_city: "私たちの住むまちや市",
  local_work: "まちではたらく人びと",
  safety_life: "みんなのくらしを守る",
  city_change: "市と生活のうつりかわり"
};

const unitAreas = {
  local_city: "地域社会",
  local_work: "地域の仕事",
  safety_life: "安全を守る働き",
  city_change: "市の移り変わり"
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
        id: `g3_social_${unit}_${pad(index++)}`,
        version: 2,
        grade: 3,
        subject: "social",
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

// ---------------------------------------------------------------- 私たちの住むまちや市(60)
function makeLocalCity() {
  const { questions, fam } = makeFamilyBuilder("local_city");

  // F1 地図記号(drill, d1)
  fam({
    familyId: "soc_map_symbol",
    funMechanic: "drill",
    learningObjective: "地図記号が表すしせつがわかる",
    commonMistake: "形のにた地図記号を取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["地図", "地図記号"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "文の記号(文の中に「文」と書かれた地図記号)は何を表す？", correct: "学校", wrongs: ["病院", "郵便局", "工場"], explanation: "「文」の記号は学校を表します。むかしの「文部省」からきています。" },
    { prompt: "十字の記号(＋)は何を表す？", correct: "病院", wrongs: ["学校", "神社", "図書館"], explanation: "十字の記号は病院を表します。赤十字のマークがもとになっています。" },
    { prompt: "〒の記号は何を表す？", correct: "郵便局", wrongs: ["消防署", "交番", "市役所"], explanation: "〒の記号は郵便局を表します。むかしの逓信省の「テ」からきています。" },
    { prompt: "本を開いた形の記号は何を表す？", correct: "図書館", wrongs: ["学校", "工場", "病院"], explanation: "本を開いた形の記号は図書館を表します。" },
    { prompt: "歯車の形の記号は何を表す？", correct: "工場", wrongs: ["田", "畑", "果樹園"], explanation: "歯車の形の記号は工場を表します。機械を使うものづくりの場所を表しています。" }
  ]);

  // F2 方位・地図の見方(drill, d2)
  fam({
    familyId: "soc_map_direction",
    funMechanic: "drill",
    learningObjective: "地図の方位記号を使って、東西南北を読み取れる",
    commonMistake: "地図の上がいつも北だと思いこみ、方位記号を見ない",
    estimatedSeconds: 45,
    skillTags: ["地図", "方位"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "地図の方位記号で、ふつう上を向いた矢印が表す方位はどれ？", correct: "北", wrongs: ["南", "東", "西"], explanation: "地図の方位記号は、ふつう上向きの矢印が北を表します。" },
    { prompt: "地図で、東はどちらの方位から見て決まる？", correct: "北を向いたときの右手側", wrongs: ["北を向いたときの左手側", "南を向いたときの右手側", "どこでも同じ"], explanation: "北を向いたとき、右手側が東、左手側が西です。" },
    { prompt: "方位記号を見ないで地図を読むと、どんな問題が起きやすい？", correct: "場所の方角をまちがえやすい", wrongs: ["色をまちがえる", "字が読めなくなる", "何も問題は起きない"], explanation: "方位記号を見ないと、東西南北をまちがえてしまいます。" },
    { prompt: "「学校の北がわに公園がある」とき、公園から見て学校はどちらにある？", correct: "南がわ", wrongs: ["北がわ", "東がわ", "西がわ"], explanation: "学校の北に公園があるので、公園から見ると学校は反対の南にあります。" }
  ]);

  // F3 土地の使われ方(drill, d2)
  fam({
    familyId: "soc_land_use",
    funMechanic: "drill",
    learningObjective: "土地の使われ方(住宅地・商店・田畑など)の特色がわかる",
    commonMistake: "住宅地と商店がい・工業地の特色を混同する",
    estimatedSeconds: 45,
    skillTags: ["土地の使われ方", "地域"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "住宅地の特徴として合うものはどれ？", correct: "人がくらす家が多い", wrongs: ["工場だけがならぶ", "畑しかない", "港だけがある"], explanation: "住宅地は、家やマンションなど人がくらす建物が多い場所です。" },
    { prompt: "駅の近くに店が多い理由として考えやすいものはどれ？", correct: "人が集まりやすいから", wrongs: ["海が必ずあるから", "山が高いから", "雨が降らないから"], explanation: "駅の近くは人が行き来しやすく、店が集まりやすい場所です。" },
    { prompt: "田や畑が多い場所の特徴として合うものはどれ？", correct: "自然が多く、作物を育てている", wrongs: ["高いビルばかりならぶ", "電車の駅がとても多い", "工場だけがある"], explanation: "田畑が多い場所は、自然を生かして作物を育てています。" },
    { prompt: "高い建物が多い場所について考えられることはどれ？", correct: "人や仕事が集まりやすい場所かもしれない", wrongs: ["人がまったくいない", "必ず田畑だけがある", "道路が一本もない"], explanation: "建物の高さや集まり方から、土地の使われ方を考えられます。" },
    { prompt: "市の中に住宅地・商店がい・田畑がある理由として合うものはどれ？", correct: "場所によって、くらしに必要なものがちがうから", wrongs: ["どの場所も同じにするため", "地図をわかりやすくするためだけ", "土地があまっているから"], explanation: "住む・買い物する・作物を育てるなど、目的に合わせて土地が使われています。" }
  ]);

  // F4 まち探検の進め方(best_choice, d2)
  fam({
    familyId: "soc_survey_method",
    funMechanic: "best_choice",
    learningObjective: "まち探検・調べ学習で気をつけることを判断できる",
    commonMistake: "調べる内容ではなく、楽しさだけを基準に選んでしまう",
    estimatedSeconds: 60,
    skillTags: ["まち調べ", "調べ方"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "まちを歩いて調べるとき、いちばん大切なことはどれ？", correct: "安全に気をつけて、見たことを記録する", wrongs: ["走って早く終わらせる", "知らない場所に一人で入る", "見たことを覚えない"], explanation: "まち調べでは、安全に気をつけながら、見たことを記録します。" },
    { prompt: "市の様子を調べる資料として合うものはどれ？", correct: "地図や写真、聞き取りメモ", wrongs: ["ゲームの点数", "給食の献立だけ", "えんぴつの長さ"], explanation: "社会では、地図・写真・聞き取りなど複数の資料から調べます。" },
    { prompt: "まち探検の後にするとよいことはどれ？", correct: "分かったことを地図や表にまとめる", wrongs: ["メモをすぐ捨てる", "友だちの話を聞かない", "場所の名前を全部消す"], explanation: "調べたことは、地図や表にまとめると分かりやすくなります。" },
    { prompt: "学校のまわりを調べるときに見るとよいものはどれ？", correct: "道路や店、公園、家のようす", wrongs: ["テレビ番組だけ", "遠い国のニュースだけ", "昨日の給食だけ"], explanation: "身近な地域のようすを、実際に見たり地図で調べたりします。" }
  ]);

  // F5 資料の読み取り(inference, d3)
  fam({
    familyId: "soc_map_reading",
    funMechanic: "inference",
    learningObjective: "地図から場所どうしの関係を読み取れる",
    commonMistake: "地図上の距離感を無視して、記号の数だけで判断する",
    estimatedSeconds: 90,
    skillTags: ["地図", "読み取り"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "地図で「駅の東に学校、駅の西に病院」とあります。学校から病院へ行くには、どちらへ進む？", correct: "西へ進む", wrongs: ["東へ進む", "南へ進む", "北へ進む"], explanation: "学校は駅の東、病院は駅の西なので、学校から病院へは西へ進みます。" },
    { prompt: "地図に工場の記号が川ぞいに多いことがわかりました。この理由として考えやすいものはどれ？", correct: "水を使う仕事に便利だから", wrongs: ["川があるとさびしいから", "工場は水がきらいだから", "たまたま記号がにているだけ", ], explanation: "工場は水を多く使うことがあり、川の近くに建てられることがあります。" },
    { prompt: "地図で、商店がいが駅の近くに集まっているとわかりました。この理由として考えやすいものはどれ？", correct: "電車で来る人が買い物しやすいから", wrongs: ["駅は静かな場所だから", "店は電車の音が好きだから", "駅の近くしか土地がないから"], explanation: "駅の近くは人の行き来が多く、買い物に便利なので店が集まりやすいです。" },
    { prompt: "地図で学校の近くに公園が多いことに気づきました。この理由として考えやすいものはどれ？", correct: "子どもたちが遊んだり集まったりしやすいから", wrongs: ["公園は学校の一部だから", "学校の先生が公園を作るから", "たまたまである"], explanation: "学校の近くに公園があると、子どもたちが利用しやすくなります。" }
  ]);

  // F6 まちがい直し(find_mistake, d3)
  fam({
    familyId: "soc_city_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "地図や土地利用についてのまちがった説明に気づける",
    commonMistake: "自分の知っている場所だけを基準に、市全体を決めつける",
    estimatedSeconds: 75,
    skillTags: ["地図", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「市の中はどこも同じ建物だけでできている」と言いました。正しい説明はどれ？", correct: "場所によって住宅地・商店がい・田畑などがある", wrongs: ["どこも同じで正しい", "市には建物がまったくない", "市には道路がまったくない"], explanation: "市の中には、住宅地・商店がい・田畑など、いろいろな土地の使われ方があります。" },
    { prompt: "みおさんは「地図の方位記号は南を向いた矢印だ」と言いました。正しい説明はどれ？", correct: "地図の方位記号は、ふつう北を表す", wrongs: ["南を表すで正しい", "方位記号に決まりはない", "方位記号は東を表す"], explanation: "地図の方位記号は、ふつう上向きの矢印で北を表します。" },
    { prompt: "はるとさんは「工場の地図記号は本の形だ」と言いました。正しい説明はどれ？", correct: "工場の地図記号は歯車の形", wrongs: ["本の形で正しい", "工場に記号はない", "工場の記号は十字の形"], explanation: "本の形は図書館の記号です。工場は歯車の形の記号です。" }
  ]);

  // F7 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "soc_city_judge",
    funMechanic: "judge_claim",
    learningObjective: "まちの様子についての主張を、資料をもとに判断できる",
    commonMistake: "自分の経験だけをもとに、根きょなく判断してしまう",
    estimatedSeconds: 75,
    skillTags: ["まち調べ", "資料活用"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「駅の近くは店が多い」。みお「駅から遠い所は田畑が多い」。地図を見て、二人とも正しいと言えるのはどんなとき？", correct: "地図でそのとおりの様子が見られるとき", wrongs: ["いつでも正しい", "地図を見なくても正しい", "多数決で決める"], explanation: "社会の学習では、地図や資料で実さいの様子をたしかめてから判断します。" },
    { prompt: "はると「地図記号を覚えれば、地図がすぐ読める」。みお「地図記号だけでなく、方位や場所の関係も見る必要がある」。正しいのはどっち？", correct: "みおだけ正しい", explanation: "地図を読むには、記号だけでなく方位や場所どうしの関係も見ます。" },
    { prompt: "はると「まち探検では、見たことをその場でメモするとよい」。みお「あとで思い出せるから、メモは不要」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "その場でメモすることで、正確な記録がのこせます。" }
  ]);

  // F8 まちの様子ならべ替え(reorder, d4)
  fam({
    familyId: "soc_city_reorder",
    funMechanic: "reorder",
    learningObjective: "駅からのきょりと、施設の集まりやすさの関係を考えられる",
    commonMistake: "きょりを考えずに、思いつきでならべる",
    estimatedSeconds: 90,
    skillTags: ["地図", "土地の使われ方", "ならべ替え"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 2 }
  }, [
    { prompt: "駅に近いほうから「店が多い場所」「住宅が多い場所」「田畑が多い場所」の順にならべたものはどれ？", correct: "店が多い場所 → 住宅が多い場所 → 田畑が多い場所", wrongs: ["田畑が多い場所 → 住宅が多い場所 → 店が多い場所", "住宅が多い場所 → 店が多い場所 → 田畑が多い場所", "店が多い場所 → 田畑が多い場所 → 住宅が多い場所"], explanation: "多くの市では、駅の近くに店、その外に住宅、さらに外に田畑が広がることが多いです。" },
    { prompt: "「まちを調べる」ときの正しい進め方の順はどれ？", correct: "計画を立てる → 実際に歩いて調べる → まとめる", wrongs: ["まとめる → 計画を立てる → 実際に歩いて調べる", "実際に歩いて調べる → まとめる → 計画を立てる", "計画を立てる → まとめる → 実際に歩いて調べる"], explanation: "調べ学習は、計画→調査→まとめの順で進めます。" }
  ]);

  // F9 地図記号の使い分け2(drill, d2)
  fam({
    familyId: "soc_map_symbol2",
    funMechanic: "drill",
    learningObjective: "地図記号と、それが表すしせつを正しく結びつけられる",
    commonMistake: "形がにている記号(神社と寺など)を取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["地図", "地図記号"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "鳥居の形の記号は何を表す？", correct: "神社", wrongs: ["寺", "病院", "工場"], explanation: "鳥居の形の記号は神社を表します。神社の入口にある鳥居がもとになっています。" },
    { prompt: "まんじの形（卍）の記号は何を表す？", correct: "寺", wrongs: ["神社", "郵便局", "図書館"], explanation: "まんじの形の記号は寺を表します。仏教で使われる印がもとになっています。" },
    { prompt: "たて棒2本の記号は何を表す？", correct: "市役所", wrongs: ["消防署", "警察署", "学校"], explanation: "たて棒2本の記号は市役所などの役所を表します。" },
    { prompt: "さすまた(Y)の形の記号は何を表す？", correct: "消防署", wrongs: ["警察署", "病院", "郵便局"], explanation: "さすまたの形の記号は消防署を表します。むかしの火消し道具からきています。" },
    { prompt: "けいぼうが交わった形の記号は何を表す？", correct: "警察署", wrongs: ["消防署", "市役所", "学校"], explanation: "けいぼうが交わった形の記号は警察署を表します。" }
  ]);

  // F10 昔と今のまちの変化を予想する(predict_check, d3)
  fam({
    familyId: "soc_city_predict",
    funMechanic: "predict_check",
    learningObjective: "地図の変化から、まちの様子が今後どうなるか予想できる",
    commonMistake: "根きょなく思いつきだけで予想してしまう",
    estimatedSeconds: 75,
    skillTags: ["地図", "まちの変化"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "駅の近くに新しいマンションがたくさん建ち始めました。この先どうなると予想できる？", correct: "住む人が増えて、店ももっと増えるかもしれない", wrongs: ["田畑がもっと広がる", "駅がなくなる", "何も変わらない"], explanation: "住む人が増えると、それに合わせて店や施設も増えることが多いです。" },
    { prompt: "田畑だった場所に新しい道路が通ることになりました。この先どうなると予想できる？", correct: "車で来やすくなり、店や住宅が増えるかもしれない", wrongs: ["田畑がもっと増える", "だれも住まなくなる", "駅がなくなる"], explanation: "道路が整うと、その周辺に店や住宅が増えることがあります。" },
    { prompt: "商店がいのお店が少しずつ減ってきています。この先どんなことが起きると考えられる？", correct: "買い物のできる場所が変わるかもしれない", wrongs: ["店が急に増える", "駅が新しくできる", "何も変わらない"], explanation: "店が減ると、買い物する場所や方法が変わっていく可能性があります。" },
    { prompt: "小学校の近くに新しい公園ができることになりました。この先どうなると予想できる？", correct: "子どもたちが遊んだり集まったりする場所が増える", wrongs: ["子どもが遊べなくなる", "学校がなくなる", "田畑が増える"], explanation: "公園ができると、子どもたちの遊び場や交流の場が増えます。" }
  ]);

  // F11 まちの様子を説明する(best_choice, d3)
  fam({
    familyId: "soc_city_explain",
    funMechanic: "best_choice",
    learningObjective: "地図や写真をもとに、まちの様子を説明する言い方を選べる",
    commonMistake: "資料にない情報を、勝手に付け加えて説明してしまう",
    estimatedSeconds: 60,
    skillTags: ["まち調べ", "説明"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "地図に田や畑がたくさん見られるとき、説明として合うものはどれ？", correct: "自然を生かした仕事が行われている地域だと考えられる", wrongs: ["だれも住んでいない地域だ", "店しかない地域だ", "海の近くの地域にちがいない"], explanation: "田畑が多いことから、農業が行われている地域だと考えられます。" },
    { prompt: "地図に工場の記号がたくさん見られるとき、説明として合うものはどれ？", correct: "ものを作る仕事がさかんな地域だと考えられる", wrongs: ["田畑しかない地域だ", "だれも働いていない地域だ", "学校しかない地域だ"], explanation: "工場が多いことから、ものづくりの仕事がさかんな地域だと考えられます。" },
    { prompt: "地図に住宅の記号が多く、店や工場がほとんどないとき、説明として合うものはどれ？", correct: "人がくらすことを中心とした地域だと考えられる", wrongs: ["だれも住んでいない地域だ", "工業がさかんな地域だ", "田畑しかない地域だ"], explanation: "住宅が多いことから、くらしを中心とした地域だと考えられます。" }
  ]);

  // F12 地図記号のなかまはずれ(rule_discovery, d3)
  fam({
    familyId: "soc_map_odd",
    funMechanic: "rule_discovery",
    learningObjective: "地図記号の共通点を見つけて、なかま分けできる",
    commonMistake: "記号の形ではなく、名前の音のにかたで分けてしまう",
    estimatedSeconds: 75,
    skillTags: ["地図", "地図記号", "なかま分け"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "なかまはずれの地図記号はどれ？（学校・病院・郵便局・田）", correct: "田", wrongs: ["学校", "病院", "郵便局"], explanation: "学校・病院・郵便局は建物の記号ですが、田は土地の使われ方を表す記号です。" },
    { prompt: "なかまはずれの地図記号はどれ？（消防署・警察署・市役所・果樹園）", correct: "果樹園", wrongs: ["消防署", "警察署", "市役所"], explanation: "消防署・警察署・市役所は公共しせつの記号ですが、果樹園は土地の使われ方の記号です。" },
    { prompt: "なかまはずれの地図記号はどれ？（神社・寺・図書館・畑）", correct: "畑", wrongs: ["神社", "寺", "図書館"], explanation: "神社・寺・図書館は建物の記号ですが、畑は土地の使われ方の記号です。" }
  ]);

  // F13 昔と今のまちのちがい(inference, d4)
  fam({
    familyId: "soc_city_then_now",
    funMechanic: "inference",
    learningObjective: "地図の変化から、まちの成り立ちを考えられる",
    commonMistake: "今の様子だけを見て、昔の様子を考えない",
    estimatedSeconds: 90,
    skillTags: ["地図", "まちの変化", "推理"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "今は住宅が多い地域だが、古い地図では田畑ばかりでした。この地域について考えられることはどれ？", correct: "田畑から住宅地へと土地の使われ方が変わった", wrongs: ["昔から今までずっと住宅地だった", "これから田畑にもどる予定だ", "土地の使われ方はいつも同じだ"], explanation: "古い地図と今の地図を比べることで、土地の使われ方の変化がわかります。" },
    { prompt: "今は大きな道路がある場所が、古い地図ではせまい道だけでした。この場所について考えられることはどれ？", correct: "交通の変化に合わせて道路が広げられた", wrongs: ["道路はいつも同じ広さだった", "道路は今後なくなる", "せまい道の方が今も使われている"], explanation: "車の交通量が増えるなどして、道路が広げられることがあります。" }
  ]);

  // F14 施設の役目を選ぶ(best_choice, d2)
  fam({
    familyId: "soc_facility_role",
    funMechanic: "best_choice",
    learningObjective: "地域の施設が、どんな役目をもっているか説明できる",
    commonMistake: "施設の名前は知っていても、役目を説明できない",
    estimatedSeconds: 45,
    skillTags: ["地域", "しせつ"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 }
  }, [
    { prompt: "図書館の役目として合うものはどれ？", correct: "本を貸したり、調べものをする場所を提供する", wrongs: ["野菜を売る", "火を消す", "手紙をとどける"], explanation: "図書館は、本を貸したり調べものをしたりできる場所です。" },
    { prompt: "市役所の役目として合うものはどれ？", correct: "地域のくらしに関わる仕事をする", wrongs: ["本を貸す", "火を消す", "商品を作る"], explanation: "市役所は、住民のくらしに関わるさまざまな仕事をしています。" },
    { prompt: "公園の役目として合うものはどれ？", correct: "遊んだり、体を動かしたりする場所を提供する", wrongs: ["本を売る", "火を消す", "手紙を配る"], explanation: "公園は、遊びや運動、休けいのための場所です。" },
    { prompt: "郵便局の役目として合うものはどれ？", correct: "手紙や荷物をとどける", wrongs: ["本を貸す", "火を消す", "野菜を育てる"], explanation: "郵便局は、手紙や荷物を全国にとどける仕事をしています。" },
    { prompt: "公民館の役目として合うものはどれ？", correct: "地域の人たちが集まって活動する場所を提供する", wrongs: ["本を貸すだけ", "火を消す", "商品を売る"], explanation: "公民館は、地域の人が集まって学んだり活動したりする場所です。" }
  ]);

  // F15 地図から場所をさがす(inference, d3)
  fam({
    familyId: "soc_map_locate",
    funMechanic: "inference",
    learningObjective: "地図の記号と方位を組み合わせて、目的の場所をさがせる",
    commonMistake: "方位だけ、または記号だけで考えて、両方を組み合わせない",
    estimatedSeconds: 75,
    skillTags: ["地図", "方位", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "駅の北に学校、学校の東に病院があります。駅から見て、病院はどちらの方向にある？", correct: "北東", wrongs: ["南西", "北西", "南東"], explanation: "駅から北へ行くと学校、そこから東へ行くと病院なので、駅から見て病院は北東です。" },
    { prompt: "市役所の南に公園、公園の西に図書館があります。市役所から見て、図書館はどちらの方向にある？", correct: "南西", wrongs: ["北東", "北西", "南東"], explanation: "市役所から南へ行くと公園、そこから西へ行くと図書館なので、南西の方向です。" },
    { prompt: "学校の東に病院、病院の北に消防署があります。学校から見て、消防署はどちらの方向にある？", correct: "北東", wrongs: ["南西", "北西", "南東"], explanation: "学校から東へ行くと病院、そこから北へ行くと消防署なので、北東の方向です。" }
  ]);

  // F16 まちのようすの言い分(judge_claim, d3)
  fam({
    familyId: "soc_city_judge2",
    funMechanic: "judge_claim",
    learningObjective: "まちの様子や地図記号についての主張を、資料をもとに判断できる",
    commonMistake: "見た目のイメージだけで、資料をたしかめずに判断する",
    estimatedSeconds: 75,
    skillTags: ["地図", "まち調べ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「地図記号は国じゅうで同じものが使われている」。みお「地図記号は地図ごとにちがう」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "地図記号は全国共通の決まった形で使われています。" },
    { prompt: "はると「田と畑の地図記号はちがう形をしている」。みお「田と畑の記号は同じ形だ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "田は稲を刈ったあとの形、畑は植物の芽の形で、ちがう記号です。" },
    { prompt: "はると「市役所は地域のくらしに関わる仕事をしている」。みお「市役所は店の一種だ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "市役所は住民のくらしに関わる仕事をする公共のしせつで、店ではありません。" },
    { prompt: "はると「地図を見れば、実際に行かなくてもまちの様子がある程度わかる」。みお「地図では何もわからない」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "地図からは、土地の使われ方や施設の場所など多くのことがわかります。" },
    { prompt: "はると「同じ市の中でも、場所によって様子がちがう」。みお「同じ市ならどこも同じ様子だ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "住宅地・商店がい・田畑など、場所によって様子はちがいます。" }
  ]);

  if (questions.length !== 60) throw new Error(`local_city: expected 60, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- まちではたらく人びと(80)
function makeLocalWork() {
  const { questions, fam } = makeFamilyBuilder("local_work");

  // F1 店の工夫(drill, d2)
  fam({
    familyId: "soc_shop_effort",
    funMechanic: "drill",
    learningObjective: "店で働く人の工夫がわかる",
    commonMistake: "店の工夫を「お客のため」ではなく「店員が楽になるため」と考える",
    estimatedSeconds: 45,
    skillTags: ["仕事", "店"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "店で働く人が大切にしていることはどれ？", correct: "お客さんが買いやすいようにすること", wrongs: ["商品をかくすこと", "店をいつも暗くすること", "値段を見えなくすること"], explanation: "店では、お客さんが商品を選びやすいように工夫しています。" },
    { prompt: "スーパーで商品が種類ごとに並べられている理由はどれ？", correct: "お客さんが探しやすいから", wrongs: ["店員さんが遊ぶため", "商品を少なく見せるため", "入口をふさぐため"], explanation: "分類して並べると、必要なものを探しやすくなります。" },
    { prompt: "店がちらしや看板を使う理由はどれ？", correct: "商品やサービスを知らせるため", wrongs: ["道を迷わせるため", "商品を見えなくするため", "仕事をやめるため"], explanation: "ちらしや看板は、お客さんに情報を知らせる工夫です。" },
    { prompt: "レジの近くにお菓子など小さな商品が置かれている理由として考えやすいものはどれ？", correct: "会計を待つ間に目にとまりやすいから", wrongs: ["レジの人が食べるため", "商品をかくすため", "たまたま置き場所がないから"], explanation: "レジ前は、待っている間にお客さんの目にとまりやすい場所です。" },
    { prompt: "品物にねふだがついている理由はどれ？", correct: "お客さんが値段を確かめられるようにするため", wrongs: ["商品を重くするため", "商品の色を変えるため", "店員の名前を書くため"], explanation: "ねふだで、お客さんはすぐに値段を確かめられます。" }
  ]);

  // F2 いろいろな仕事(drill, d2)
  fam({
    familyId: "soc_various_work",
    funMechanic: "drill",
    learningObjective: "農業・工業などいろいろな仕事の特徴がわかる",
    commonMistake: "仕事の種類ごとの特徴を混同する",
    estimatedSeconds: 45,
    skillTags: ["仕事", "農業", "工業"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "田や畑の仕事で大切なことはどれ？", correct: "天気や季節に合わせて世話をする", wrongs: ["毎日同じ時間に必ず雨を降らせる", "土を見ない", "育つ前に全部とる"], explanation: "農家の人は、天気や季節、作物の様子を見ながら仕事をします。" },
    { prompt: "工場の仕事の特徴として合うものはどれ？", correct: "材料から品物を作る", wrongs: ["魚だけを育てる", "道を直すだけ", "本を読むだけ"], explanation: "工場では、材料を加工して製品を作ります。" },
    { prompt: "工場で安全に仕事をするための工夫はどれ？", correct: "決まりを守り、道具を正しく使う", wrongs: ["走り回る", "注意を読まない", "機械に勝手にさわる"], explanation: "工場では安全のための決まりや点検があります。" },
    { prompt: "農家が種をまく時期を考える理由として合うものはどれ？", correct: "作物によって育ちやすい季節がちがうから", wrongs: ["いつでも同じでよいから", "種の数を合わせるため", "土の色を変えるため"], explanation: "作物ごとに、よく育つ季節や気温がちがいます。" }
  ]);

  // F3 商品が届くまで(drill, d2-d3)
  fam({
    familyId: "soc_product_flow",
    funMechanic: "drill",
    learningObjective: "商品が作られてから家に届くまでの流れがわかる",
    commonMistake: "作る・運ぶ・売るの仕事を1つにまとめて考えてしまう",
    estimatedSeconds: 60,
    skillTags: ["仕事", "商品の流れ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 1, choices: 2 }
  }, [
    { prompt: "店の商品が家に届くまでに関わる人として合うものはどれ？", correct: "作る人、運ぶ人、売る人", wrongs: ["見るだけの人だけ", "遊ぶ人だけ", "ねむる人だけ"], explanation: "商品は、生産・運送・販売など多くの仕事で届けられます。" },
    { prompt: "産地を調べると分かることはどれ？", correct: "商品がどこで作られたか", wrongs: ["店の音楽の名前", "レジの色だけ", "買った人の名前"], explanation: "産地を見ると、品物が作られた場所が分かります。" },
    { prompt: "トラックが商品を運ぶ仕事は、どの役目にあたる？", correct: "運ぶ仕事", wrongs: ["作る仕事", "売る仕事", "食べる仕事"], explanation: "トラックで商品を店に運ぶのは、運送(うんそう)の仕事です。" },
    { prompt: "地元で作られた商品を買うよさとして考えられることはどれ？", correct: "地域の仕事を応援できる", wrongs: ["必ず無料になる", "すべて遠くから来る", "店がなくなる"], explanation: "地元の商品を買うことは、地域の仕事を支えることにつながります。" }
  ]);

  // F4 仕事の関係を考える(inference, d3)
  fam({
    familyId: "soc_work_relation",
    funMechanic: "inference",
    learningObjective: "いろいろな仕事どうしのつながりを考えられる",
    commonMistake: "1つの仕事だけを見て、ほかの仕事とのつながりに気づかない",
    estimatedSeconds: 90,
    skillTags: ["仕事", "つながり", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "パン工場でパンをたくさん作るには、何がたくさん必要になる？", correct: "小麦粉などの材料", wrongs: ["店のちらしだけ", "レジの数だけ", "工場の窓の数"], explanation: "パンを多く作るには、材料の小麦粉などが多く必要です。" },
    { prompt: "スーパーの野菜売り場に新鮮な野菜がとどくために、朝早くから働く人はどんな仕事の人？", correct: "農家や運送の人", wrongs: ["学校の先生", "消防の人", "図書館の人"], explanation: "新鮮な野菜を届けるには、農家で収かくしてすぐに運ぶ人が朝早くから働きます。" },
    { prompt: "工場でつくられた製品が店にならぶまでに、どんな仕事の人が関わっている？", correct: "運送の人と店の人", wrongs: ["消防の人だけ", "警察の人だけ", "だれも関わらない"], explanation: "工場から店まで運ぶ人、店でならべる人など、多くの仕事がつながっています。" },
    { prompt: "魚屋に新鮮な魚がとどくために大切なことは何？", correct: "とれてからできるだけ早く運ぶこと", wrongs: ["魚をゆっくり運ぶこと", "魚を暖かい場所に置くこと", "魚を長い時間放置すること"], explanation: "魚を新鮮なまま届けるには、すばやく運ぶ工夫が大切です。" }
  ]);

  // F5 聞き取りの工夫(best_choice, d3)
  fam({
    familyId: "soc_interview",
    funMechanic: "best_choice",
    learningObjective: "働く人への聞き取りで、学びにつながる質問を選べる",
    commonMistake: "仕事と関係のない質問を選んでしまう",
    estimatedSeconds: 60,
    skillTags: ["仕事", "聞き取り"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "働く人に聞き取りをするときによい質問はどれ？", correct: "仕事で気をつけていることは何ですか", wrongs: ["好きなゲームは何ですかだけ", "昨日の夕食だけ", "答えたくないことを何度も聞く"], explanation: "社会科の聞き取りでは、仕事の工夫や願いを聞くと学びが深まります。" },
    { prompt: "農家の人への聞き取りで、学びにつながる質問はどれ？", correct: "作物を育てるときに工夫していることは何ですか", wrongs: ["きょう何時に起きましたか", "好きな色は何ですか", "家族は何人ですか"], explanation: "仕事の工夫を聞くことで、農業の学習が深まります。" },
    { prompt: "工場の人への聞き取りで、学びにつながる質問はどれ？", correct: "安全のためにどんな工夫をしていますか", wrongs: ["休みの日は何をしますか", "好きな給食は何ですか", "電話番号は何番ですか"], explanation: "工場での工夫や安全対策を聞くと、学習が深まります。" }
  ]);

  // F6 まちがい直し(find_mistake, d3)
  fam({
    familyId: "soc_work_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "仕事についてのまちがった説明に気づける",
    commonMistake: "自分のイメージだけで仕事の内容を決めつける",
    estimatedSeconds: 75,
    skillTags: ["仕事", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「工場では材料をまったく使わずに製品ができる」と言いました。正しい説明はどれ？", correct: "工場では材料から製品を作る", wrongs: ["材料を使わないで正しい", "工場に人はいらない", "工場では何も作らない"], explanation: "工場は、材料を加工して製品を作る場所です。" },
    { prompt: "みおさんは「野菜はいつでも同じ季節に育つ」と言いました。正しい説明はどれ？", correct: "野菜には育ちやすい季節がある", wrongs: ["いつでも同じで正しい", "野菜は育てなくても実る", "季節は関係ない"], explanation: "野菜や作物には、それぞれ育ちやすい季節があります。" },
    { prompt: "はるとさんは「店の商品はすべて店の人が自分で作っている」と言いました。正しい説明はどれ？", correct: "多くの商品は工場や農家で作られ、店は仕入れて売る", wrongs: ["店の人が作るで正しい", "商品はどこからも来ない", "商品は自然にできる"], explanation: "スーパーなどの商品は、工場や農家など別の場所で作られ、店が仕入れて売っています。" }
  ]);

  // F7 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "soc_work_judge",
    funMechanic: "judge_claim",
    learningObjective: "仕事についての主張を、学んだ内容をもとに判断できる",
    commonMistake: "一部の仕事だけを見て、仕事全体を決めつける",
    estimatedSeconds: 75,
    skillTags: ["仕事"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「店で働く人は、お客さんが買いやすいように工夫している」。みお「工場で働く人は、安全に気をつけて仕事をしている」。正しいのはどっち？", correct: "二人とも正しい", explanation: "店でも工場でも、それぞれの目的に合わせた工夫や気配りがあります。" },
    { prompt: "はると「農家の仕事は天気に左右される」。みお「工場の仕事は天気とまったく関係ない」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "農業は天気の影響を強く受けます。工場も気温などの管理が必要な場合があります。" },
    { prompt: "はると「地元の商品を買うと、地域の仕事を応援できる」。みお「どこで作られた商品を買っても同じ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "地元の商品を買うことは、その地域の生産者や店を支えることにつながります。" }
  ]);

  // F8 商品の流れをならべる(reorder, d4)
  fam({
    familyId: "soc_work_reorder",
    funMechanic: "reorder",
    learningObjective: "商品が作られてから店にならぶまでの流れを順序立てて考えられる",
    commonMistake: "運ぶ・売るの順番を逆にする",
    estimatedSeconds: 90,
    skillTags: ["仕事", "商品の流れ", "ならべ替え"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 2 }
  }, [
    { prompt: "パンが店にならぶまでの正しい順はどれ？", correct: "材料を仕入れる → 工場で作る → 店に運ぶ → 店にならべる", wrongs: ["店にならべる → 工場で作る → 材料を仕入れる → 店に運ぶ", "工場で作る → 材料を仕入れる → 店にならべる → 店に運ぶ", "店に運ぶ → 材料を仕入れる → 工場で作る → 店にならべる"], explanation: "材料を仕入れて作り、運んでからならべる、という順です。" },
    { prompt: "野菜が食たくにとどくまでの正しい順はどれ？", correct: "農家で育てる → しゅうかくする → 店に運ぶ → 買って食べる", wrongs: ["買って食べる → 農家で育てる → しゅうかくする → 店に運ぶ", "しゅうかくする → 農家で育てる → 買って食べる → 店に運ぶ", "農家で育てる → 店に運ぶ → しゅうかくする → 買って食べる"], explanation: "育てて、収穫して、運んでから、買って食べる順です。" }
  ]);

  // F9 生産者と消費者(drill, d2)
  fam({
    familyId: "soc_work_producer",
    funMechanic: "drill",
    learningObjective: "作る人(生産者)と使う人(消費者)の関係がわかる",
    commonMistake: "生産者と消費者の役目を取りちがえる",
    estimatedSeconds: 45,
    skillTags: ["仕事", "生産と消費"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "野菜を育てて売る人を何という？", correct: "生産者", wrongs: ["消費者", "運送業者", "小売業者"], explanation: "ものを作ったり育てたりする人を生産者といいます。" },
    { prompt: "お店で野菜を買って食べる人を何という？", correct: "消費者", wrongs: ["生産者", "運送業者", "製造業者"], explanation: "ものを買って使う人を消費者といいます。" },
    { prompt: "工場でパンを作る人は、生産者と消費者のどちらにあたる？", correct: "生産者", wrongs: ["消費者", "どちらでもない", "両方同時"], explanation: "パンという商品を作っているので、生産者にあたります。" },
    { prompt: "スーパーで買い物をする人は、生産者と消費者のどちらにあたる？", correct: "消費者", wrongs: ["生産者", "どちらでもない", "両方同時"], explanation: "商品を買って使うので、消費者にあたります。" },
    { prompt: "魚をとって売る漁師さんは、生産者と消費者のどちらにあたる？", correct: "生産者", wrongs: ["消費者", "どちらでもない", "両方同時"], explanation: "魚をとって商品にするので、生産者にあたります。" }
  ]);

  // F10 仕事にかかる時間や手間(drill, d2)
  fam({
    familyId: "soc_work_effort",
    funMechanic: "drill",
    learningObjective: "商品ができるまでにかかる手間や工夫がわかる",
    commonMistake: "商品はすぐに簡単にできると思いこむ",
    estimatedSeconds: 45,
    skillTags: ["仕事", "工夫"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "米づくりで、田植えの前にする大切な作業はどれ？", correct: "田に水を入れて土を整える", wrongs: ["すぐに稲をかりとる", "田をかわかしたままにする", "何もしない"], explanation: "田植えの前には、田に水を入れて土を整える作業が必要です。" },
    { prompt: "パン工場で、生地を発酵させる目的はどれ？", correct: "パンをふっくらさせるため", wrongs: ["色をつけるため", "早く固くするため", "味をなくすため"], explanation: "発酵させることで、パンがふっくらとやわらかくなります。" },
    { prompt: "野菜を新鮮なまま運ぶための工夫として合うものはどれ？", correct: "温度を低く保って運ぶ", wrongs: ["長い時間あたためる", "日なたに置いておく", "何も工夫しない"], explanation: "野菜は温度を低く保つことで、新鮮さを長く保てます。" },
    { prompt: "牛を育てる牧場で、毎日えさやりや健康チェックをする理由はどれ？", correct: "牛が元気に育つように世話をするため", wrongs: ["牛を早く売るため", "牛を運びやすくするため", "特に理由はない"], explanation: "牛が元気に育つように、毎日ていねいに世話をしています。" }
  ]);

  // F11 品質と安全のチェック(drill, d3)
  fam({
    familyId: "soc_work_check",
    funMechanic: "drill",
    learningObjective: "商品の安全や品質を守るための仕組みがわかる",
    commonMistake: "チェックの仕組みは一部の商品だけと思いこむ",
    estimatedSeconds: 60,
    skillTags: ["仕事", "安全", "品質"],
    axes: { knowledge: 2, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "食品工場で働く人が身につける、白い服やぼうしの目的はどれ？", correct: "髪の毛やよごれが食品に入らないようにするため", wrongs: ["おしゃれのため", "暑さをふせぐため", "重さを軽くするため"], explanation: "衛生に気をつけて、食品にごみや髪が入らないようにしています。" },
    { prompt: "商品のパッケージに賞味期限が書かれている理由はどれ？", correct: "安全に食べられる期間を知らせるため", wrongs: ["値段を高くするため", "色をきれいにするため", "会社の名前を書くため"], explanation: "賞味期限は、安全においしく食べられる期間を表しています。" },
    { prompt: "工場で製品を検査する人の役目はどれ？", correct: "きずや不良品がないかたしかめる", wrongs: ["製品の値段を決める", "製品を運ぶ", "製品を売る"], explanation: "検査の仕事は、製品に問題がないかをたしかめることです。" },
    { prompt: "食品工場で、材料が届いたときに行う検査の目的はどれ？", correct: "材料が安全で新鮮かどうかたしかめる", wrongs: ["材料の値段を上げる", "材料の色を変える", "材料を捨てるため"], explanation: "材料の安全性を最初にたしかめることで、安心して製品を作れます。" }
  ]);

  // F12 仕事と道具・機械(inference, d3)
  fam({
    familyId: "soc_work_tools",
    funMechanic: "inference",
    learningObjective: "仕事で使われる道具や機械が、どう役立っているか考えられる",
    commonMistake: "機械を使う理由を考えず、単に「便利だから」で終わらせる",
    estimatedSeconds: 90,
    skillTags: ["仕事", "道具", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "田植え機を使うと、手で植えるのに比べてどんなよいことがある？", correct: "短い時間で広い田に植えられる", wrongs: ["稲がよりおいしくなる", "水がいらなくなる", "田が広くなる"], explanation: "機械を使うことで、作業にかかる時間を大はばに短くできます。" },
    { prompt: "工場でロボットが製品を組み立てると、どんなよいことがある？", correct: "同じ品質のものを早く、たくさん作れる", wrongs: ["製品の値段が必ず上がる", "働く人がまったくいらなくなる", "製品の色が変わる"], explanation: "ロボットは、正確で速い作業をくり返し行うことができます。" },
    { prompt: "冷とう車で食品を運ぶと、どんなよいことがある？", correct: "遠くまで新鮮な状態で運べる", wrongs: ["運ぶ時間が長くなる", "食品の味がなくなる", "重さが軽くなる"], explanation: "冷やしながら運ぶことで、新鮮さを保ったまま遠くまで運べます。" }
  ]);

  // F13 仕事のまちがい直し2(find_mistake, d3)
  fam({
    familyId: "soc_work_find_mistake2",
    funMechanic: "find_mistake",
    learningObjective: "仕事の工夫についてのまちがった説明に気づける",
    commonMistake: "自分の身近な体験だけで仕事の内容を決めつける",
    estimatedSeconds: 75,
    skillTags: ["仕事", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「消費者は商品を作る人のことだ」と言いました。正しい説明はどれ？", correct: "消費者は商品を買って使う人のことだ", wrongs: ["作る人で正しい", "運ぶ人のことだ", "だれのことでもない"], explanation: "商品を買って使う人が消費者、作る人は生産者です。" },
    { prompt: "みおさんは「賞味期限は値段を表している」と言いました。正しい説明はどれ？", correct: "賞味期限は安全に食べられる期間を表している", wrongs: ["値段を表すで正しい", "会社の名前を表す", "重さを表す"], explanation: "賞味期限は、おいしく安全に食べられる期間を表しています。" },
    { prompt: "はるとさんは「機械を使うと、いつも同じ品質のものは作れない」と言いました。正しい説明はどれ？", correct: "機械を使うと、同じ品質のものを安定して作りやすい", wrongs: ["作れないで正しい", "機械は品質と関係ない", "手作業の方がいつも同じになる"], explanation: "機械は正確な作業をくり返せるので、品質を安定させやすくなります。" }
  ]);

  // F14 どっちの言い分が正しい？2(judge_claim, d3)
  fam({
    familyId: "soc_work_judge2",
    funMechanic: "judge_claim",
    learningObjective: "仕事の工夫や仕組みについての主張を判断できる",
    commonMistake: "一方の意見だけを聞いて、もう一方を確かめずに判断する",
    estimatedSeconds: 75,
    skillTags: ["仕事"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「食品工場では衛生に気をつけて作業している」。みお「服そうは何でもよい」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "食品工場では、白い服やぼうしなどで衛生に気をつけています。" },
    { prompt: "はると「野菜は新鮮なうちに運ぶ工夫がされている」。みお「野菜はいつ運んでも同じ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "新鮮さを保つために、温度管理やすばやい輸送などの工夫がされています。" },
    { prompt: "はると「機械を使う仕事にも、人の手が必要な部分がある」。みお「機械があれば人の仕事は一切いらない」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "機械化が進んでも、点検や管理など人の手が必要な仕事があります。" }
  ]);

  // F15 仕事の関わりをならべる(reorder, d4)
  fam({
    familyId: "soc_work_reorder2",
    funMechanic: "reorder",
    learningObjective: "商品ができるまでの、より詳しい流れを順序立てて考えられる",
    commonMistake: "検査や出荷などの工程を飛ばして考える",
    estimatedSeconds: 90,
    skillTags: ["仕事", "商品の流れ", "ならべ替え"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 2 }
  }, [
    { prompt: "牛乳が家庭にとどくまでの正しい順はどれ？", correct: "牛の乳をしぼる → 工場で処理する → 検査する → 店にならぶ", wrongs: ["検査する → 牛の乳をしぼる → 工場で処理する → 店にならぶ", "工場で処理する → 検査する → 牛の乳をしぼる → 店にならぶ", "店にならぶ → 牛の乳をしぼる → 工場で処理する → 検査する"], explanation: "しぼった乳を工場で処理し、検査してから店にならびます。" },
    { prompt: "洋服が店にならぶまでの正しい順はどれ？", correct: "布を作る → ぬい合わせる → 検査する → 店に運ぶ", wrongs: ["検査する → 布を作る → ぬい合わせる → 店に運ぶ", "店に運ぶ → 布を作る → ぬい合わせる → 検査する", "ぬい合わせる → 布を作る → 検査する → 店に運ぶ"], explanation: "布を作ってからぬい合わせ、検査してから店に運びます。" }
  ]);

  // F16 仕事を選ぶ理由(decide_then_verify, d4)
  fam({
    familyId: "soc_work_decide",
    funMechanic: "decide_then_verify",
    learningObjective: "働く人の立場で考えてから、実際の工夫と照らし合わせて考えられる",
    commonMistake: "働く人の視点ではなく、自分が客としての視点だけで考える",
    estimatedSeconds: 90,
    skillTags: ["仕事", "判断"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "もしあなたが八百屋さんなら、売れ残った野菜をどうする？考えてから、実際によくある工夫を確かめよう。実際の工夫として合うものはどれ？", correct: "値段を安くして早く売り切る", wrongs: ["すぐに全部すてる", "値段を高くする", "商品をかくす"], explanation: "売れ残りそうな野菜は、値段を下げて売り切る工夫がされることがあります。" },
    { prompt: "もしあなたが工場の人なら、事故を防ぐためにどうする？考えてから、実際の工夫を確かめよう。実際の工夫として合うものはどれ？", correct: "安全のきまりを作り、みんなで守る", wrongs: ["きまりを作らない", "だれも注意しない", "早く終わらせることだけ考える"], explanation: "工場では、安全のきまりを作りみんなで守ることで事故を防いでいます。" },
    { prompt: "もしあなたがパン屋さんなら、お客さんに新鮮なパンを買ってもらうためにどうする？考えてから、実際の工夫を確かめよう。実際の工夫として合うものはどれ？", correct: "焼きたての時間に合わせて店にならべる", wrongs: ["何日も前に焼いておく", "パンをかくしておく", "値段をとても高くする"], explanation: "焼きたてを店にならべることで、新鮮なパンを買ってもらう工夫をしています。" }
  ]);

  // F17 仕事のなかまはずれ(rule_discovery, d3)
  fam({
    familyId: "soc_work_odd",
    funMechanic: "rule_discovery",
    learningObjective: "仕事の共通点を見つけて、なかま分けできる",
    commonMistake: "仕事の名前の音や見た目のイメージだけで分けてしまう",
    estimatedSeconds: 75,
    skillTags: ["仕事", "なかま分け"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "なかまはずれの仕事はどれ？（米作り・野菜作り・くだもの作り・パンを売る）", correct: "パンを売る", wrongs: ["米作り", "野菜作り", "くだもの作り"], explanation: "米作り・野菜作り・くだもの作りは農業ですが、パンを売るのは商業(店の仕事)です。" },
    { prompt: "なかまはずれの仕事はどれ？（パン工場・自動車工場・お花屋さん・かばん工場）", correct: "お花屋さん", wrongs: ["パン工場", "自動車工場", "かばん工場"], explanation: "パン工場・自動車工場・かばん工場は材料から製品を作る工業ですが、お花屋さんは花を売る商業です。" },
    { prompt: "なかまはずれの仕事はどれ？（八百屋・魚屋・パン屋・工場で働く人）", correct: "工場で働く人", wrongs: ["八百屋", "魚屋", "パン屋"], explanation: "八百屋・魚屋・パン屋は商品を売る店の仕事ですが、工場で働く人はものを作る仕事です。" }
  ]);

  // F18 仕事の工夫の理由(inference, d4)
  fam({
    familyId: "soc_work_reason",
    funMechanic: "inference",
    learningObjective: "仕事の工夫の理由を、お客さんや作る人の立場から考えられる",
    commonMistake: "工夫の理由を考えず、「そういう決まりだから」で終わらせる",
    estimatedSeconds: 90,
    skillTags: ["仕事", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "スーパーが開店時間や閉店時間を店の前に大きく表示している理由として考えられることはどれ？", correct: "お客さんが買い物できる時間をわかりやすくするため", wrongs: ["店員が休むため", "商品を見えなくするため", "何となく表示しているだけ"], explanation: "開閉店時間を知らせることで、お客さんが計画的に買い物できるようにしています。" },
    { prompt: "工場が製品にシリアル番号(せいぞう番号)をつける理由として考えられることはどれ？", correct: "問題があったときに、どの製品かすぐ調べられるようにするため", wrongs: ["製品を高く見せるため", "重さを軽くするため", "特に意味はない"], explanation: "番号をつけておくと、不具合があったときに製品を特定しやすくなります。" }
  ]);

  // F19 仕事とくらしのつながり(judge_claim, d4)
  fam({
    familyId: "soc_work_life_connection",
    funMechanic: "judge_claim",
    learningObjective: "仕事とくらしがどうつながっているか判断できる",
    commonMistake: "仕事とくらしを別々のものとして考え、つながりに気づかない",
    estimatedSeconds: 90,
    skillTags: ["仕事", "くらしとのつながり"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「もし農家の人がいなかったら、お米や野菜が手に入りにくくなる」。みお「農家がいなくてもくらしは変わらない」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "農家の仕事は、わたしたちの食生活を支える大切な仕事です。" },
    { prompt: "はると「運送の仕事がなければ、遠くで作られた商品を買えない」。みお「運送は仕事のうちに入らない」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "運送の仕事のおかげで、遠くの産地で作られた商品を近くの店で買うことができます。" }
  ]);

  // F20 産地当てクイズ(inference, d3)
  fam({
    familyId: "soc_work_origin_quiz",
    funMechanic: "inference",
    learningObjective: "地図や資料から、商品の産地を考えられる",
    commonMistake: "産地とはあまり関係のない特徴で答えを決めてしまう",
    estimatedSeconds: 75,
    skillTags: ["仕事", "産地", "推理"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "「広い海に面した町で、魚を多くとっています」。この町でさかんな仕事は何？", correct: "漁業", wrongs: ["林業", "工業", "牧場の仕事"], explanation: "海に面していて魚を多くとる町では、漁業がさかんです。" },
    { prompt: "「山が多く、木がたくさん生えている地域です」。この地域でさかんな仕事は何？", correct: "林業", wrongs: ["漁業", "工業", "田づくり"], explanation: "山や森が多い地域では、木を育てて使う林業がさかんなことがあります。" },
    { prompt: "「広い工業団地があり、たくさんの工場が集まっています」。この地域でさかんな仕事は何？", correct: "工業", wrongs: ["漁業", "農業", "林業"], explanation: "工場が多く集まる地域は、工業がさかんな地域です。" }
  ]);

  // F21 仕事の願い(inference, d4)
  fam({
    familyId: "soc_work_wish",
    funMechanic: "inference",
    learningObjective: "働く人の願いや目標を、仕事の内容から考えられる",
    commonMistake: "働く人の願いを考えず、作業内容だけを覚える",
    estimatedSeconds: 90,
    skillTags: ["仕事", "働く人の思い", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "農家の人が「安全でおいしい野菜を届けたい」と考えて仕事をしているとき、大切にしていることはどれ？", correct: "農薬をできるだけ少なくしたり、育て方を工夫したりすること", wrongs: ["できるだけ早く売り切ること", "見た目だけをよくすること", "値段を高くすること"], explanation: "安全でおいしい野菜のために、育て方や農薬の使い方を工夫しています。" },
    { prompt: "パン職人が「毎日ちがう焼きたてのパンを届けたい」と考えているとき、大切にしていることはどれ？", correct: "お客さんに喜んでもらえるよう、工夫を重ねること", wrongs: ["同じパンだけを作り続けること", "できるだけ安く材料を使うこと", "パンを長く保存すること"], explanation: "お客さんに喜んでもらうために、工夫を重ねてパンを作っています。" }
  ]);

  // F22 リサイクル・ごみとくらし(drill, d2)
  fam({
    familyId: "soc_work_recycle",
    funMechanic: "best_choice",
    learningObjective: "ごみやリサイクルに関わる仕事の役目がわかる",
    commonMistake: "ごみを集める仕事と、資源をリサイクルする仕事を混同する",
    estimatedSeconds: 45,
    skillTags: ["仕事", "ごみ", "リサイクル"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "ごみ収集車の仕事として合うものはどれ？", correct: "家や店から出たごみを集めて運ぶ", wrongs: ["ごみを作る", "商品を売る", "野菜を育てる"], explanation: "ごみ収集車は、地域から出たごみを集めて処理場まで運びます。" },
    { prompt: "アルミかんをリサイクルすると、何に生まれ変わる？", correct: "新しいアルミ製品", wrongs: ["紙", "ガラス", "土"], explanation: "アルミかんはとかされて、新しいアルミ製品に生まれ変わります。" },
    { prompt: "ごみを分別して出す理由として合うものはどれ？", correct: "リサイクルしやすくするため", wrongs: ["ごみを増やすため", "収集車を困らせるため", "特に意味はない"], explanation: "分別することで、資源として再利用しやすくなります。" },
    { prompt: "古紙(古い紙)をリサイクルすると、何に生まれ変わる？", correct: "新しい紙製品", wrongs: ["金属", "ガラス", "プラスチック"], explanation: "古紙は、とかしてすいてから、新しい紙製品に生まれ変わります。" }
  ]);

  // F23 交通と仕事(drill, d3)
  fam({
    familyId: "soc_work_transport",
    funMechanic: "drill",
    learningObjective: "交通機関(電車・トラックなど)が仕事にどう関わっているかわかる",
    commonMistake: "交通機関は「移動のためだけ」と考え、仕事とのつながりに気づかない",
    estimatedSeconds: 60,
    skillTags: ["仕事", "交通"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 1, choices: 2 }
  }, [
    { prompt: "トラックが商品を店に運ぶときの役目はどれ？", correct: "工場や産地から店まで商品を届ける", wrongs: ["商品を作る", "商品を売る", "商品を食べる"], explanation: "トラックは、商品を作られた場所から店まで運ぶ役目をしています。" },
    { prompt: "船で荷物を運ぶときのよい点として合うものはどれ？", correct: "一度に多くの荷物を運べる", wrongs: ["とても速く着く", "道路を使う", "荷物が小さくなる"], explanation: "船は一度にたくさんの荷物を運べるので、大量の輸送に向いています。" },
    { prompt: "飛行機で商品を運ぶときのよい点として合うものはどれ？", correct: "遠い場所まで速く届けられる", wrongs: ["安く運べる", "たくさん運べる", "ゆっくり運べる"], explanation: "飛行機は速さが特徴で、新鮮さが大切な商品などを遠くまで速く運べます。" },
    { prompt: "電車で人が通勤・通学するときの、電車のよい点として合うものはどれ？", correct: "決まった時間に多くの人を一度に運べる", wrongs: ["一人しか乗れない", "道路と同じ速さになる", "荷物しか運べない"], explanation: "電車は決まった時刻表にそって、多くの人を一度に運べます。" }
  ]);

  // F24 仕事の未来を考える(predict_check, d4)
  fam({
    familyId: "soc_work_future",
    funMechanic: "predict_check",
    learningObjective: "これからの仕事の変化を予想できる",
    commonMistake: "今の仕事の様子がずっと変わらないと思いこむ",
    estimatedSeconds: 90,
    skillTags: ["仕事", "未来"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "インターネットで買い物をする人が増えてきています。この先、店の仕事はどう変わっていくと考えられる？", correct: "商品を家に届けるサービスがもっと増えるかもしれない", wrongs: ["店がまったくなくなる", "何も変わらない", "商品の種類がへる"], explanation: "インターネット注文の増加にあわせて、配送サービスが発展していくと考えられます。" },
    { prompt: "工場でロボットを使う仕事が増えてきています。この先、働く人の仕事はどう変わっていくと考えられる？", correct: "ロボットの点検や管理をする仕事が増えるかもしれない", wrongs: ["人の仕事は完全になくなる", "何も変わらない", "ロボットが仕事をやめる"], explanation: "ロボット化が進んでも、それを管理したり点検したりする人の仕事が必要です。" }
  ]);

  // F25 仕事の一日の流れ(reorder, d3)
  fam({
    familyId: "soc_work_day_flow",
    funMechanic: "reorder",
    learningObjective: "働く人の一日の流れを、順序立てて考えられる",
    commonMistake: "仕事の準備・本番・片付けの順を考えずに答える",
    estimatedSeconds: 75,
    skillTags: ["仕事", "一日の流れ", "ならべ替え"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "スーパーの店員さんの朝の仕事として、正しい順はどれ？", correct: "商品がとどく → 品物をならべる → 開店する", wrongs: ["開店する → 商品がとどく → 品物をならべる", "品物をならべる → 開店する → 商品がとどく", "開店する → 品物をならべる → 商品がとどく"], explanation: "商品がとどいてからならべ、その後お店を開けます。" },
    { prompt: "農家の人の一日として、正しい順はどれ？", correct: "畑の見回り → 世話をする → しゅうかくする", wrongs: ["しゅうかくする → 畑の見回り → 世話をする", "世話をする → しゅうかくする → 畑の見回り", "しゅうかくする → 世話をする → 畑の見回り"], explanation: "見回って様子を確認し、世話をしてから、育ったらしゅうかくします。" },
    { prompt: "パン屋さんの朝の仕事として、正しい順はどれ？", correct: "生地を作る → 発酵させる → 焼く", wrongs: ["焼く → 生地を作る → 発酵させる", "発酵させる → 焼く → 生地を作る", "焼く → 発酵させる → 生地を作る"], explanation: "生地を作ってから発酵させ、その後焼きます。" }
  ]);

  if (questions.length !== 80) throw new Error(`local_work: expected 80, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- みんなのくらしを守る(70)
function makeSafetyLife() {
  const { questions, fam } = makeFamilyBuilder("safety_life");

  // F1 通報番号・きほん知識(drill, d1)
  fam({
    familyId: "soc_safety_basic",
    funMechanic: "drill",
    learningObjective: "火事や事件のときに連絡する番号がわかる",
    commonMistake: "119番と110番を取りちがえる",
    estimatedSeconds: 30,
    skillTags: ["安全", "消防", "警察"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "火事を見つけたときに連絡する番号はどれ？", correct: "119番", wrongs: ["110番", "117番", "177番"], explanation: "火事や救急のときは119番に連絡します。" },
    { prompt: "事件や事故を見つけたときに連絡する番号はどれ？", correct: "110番", wrongs: ["119番", "117番", "177番"], explanation: "事件や事故で警察に知らせるときは110番です。" },
    { prompt: "消防署の仕事として合うものはどれ？", correct: "火事を消したり、救急で人を助けたりする", wrongs: ["商品を売る", "作物を育てる", "本を貸す"], explanation: "消防署は火事や救急などからくらしを守ります。" },
    { prompt: "警察の仕事として合うものはどれ？", correct: "事故や事件を防ぎ、安全を守る", wrongs: ["パンを焼く", "野菜を育てる", "電車を作る"], explanation: "警察は交通安全や防犯などに関わります。" },
    { prompt: "119番に電話すると、つながる先として合うものはどれ？", correct: "消防や救急のれんらく先", wrongs: ["天気よほうのれんらく先", "郵便局のれんらく先", "学校のれんらく先"], explanation: "119番は消防・救急につながる番号です。" }
  ]);

  // F2 事故・災害を防ぐ行動(drill, d2)
  fam({
    familyId: "soc_safety_prevent",
    funMechanic: "drill",
    learningObjective: "交通事故や火事を防ぐための行動がわかる",
    commonMistake: "きまりを守ることより、急ぐことを優先してしまう",
    estimatedSeconds: 45,
    skillTags: ["安全", "防災"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "交通事故を防ぐために大切なことはどれ？", correct: "信号や横断歩道のきまりを守る", wrongs: ["道路で急に遊ぶ", "左右を見ない", "赤信号でわたる"], explanation: "交通のきまりを守ることが事故を防ぐことにつながります。" },
    { prompt: "火事を防ぐための行動として合うものはどれ？", correct: "火を使う場所を大人と確認する", wrongs: ["コンロの近くで紙を置く", "火遊びをする", "煙を見ても知らせない"], explanation: "火を安全に使い、危ない時は大人に知らせることが大切です。" },
    { prompt: "地域の防災訓練の目的はどれ？", correct: "災害のときに安全に行動できるようにする", wrongs: ["遊び道具を増やす", "道を分からなくする", "水を使わないため"], explanation: "訓練をしておくと、災害時に落ち着いて行動しやすくなります。" },
    { prompt: "災害に備えて家で確認するとよいことはどれ？", correct: "避難場所や連絡方法", wrongs: ["好きなテレビだけ", "お菓子の味だけ", "えんぴつの色だけ"], explanation: "災害前に避難場所や連絡方法を家族で確認しておくと安心です。" }
  ]);

  // F3 安全マップ・地域の見守り(drill, d2)
  fam({
    familyId: "soc_safety_map",
    funMechanic: "drill",
    learningObjective: "安全マップに書く内容や、地域の見守り活動の目的がわかる",
    commonMistake: "「安全」に関係ないものも安全マップに書いてしまう",
    estimatedSeconds: 45,
    skillTags: ["安全", "地域"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "安全マップに書くとよいものはどれ？", correct: "危ない場所や避難場所", wrongs: ["好きな食べ物だけ", "ゲームの名前だけ", "家の中の本だけ"], explanation: "安全マップには、危険な場所や助けを求められる場所をまとめます。" },
    { prompt: "地域の人が見守り活動をする理由はどれ？", correct: "子どもや地域の安全を守るため", wrongs: ["道をふさぐため", "店の商品を増やすため", "雨を降らせるため"], explanation: "地域の安全は、警察や消防だけでなく地域の人にも支えられています。" },
    { prompt: "「こども110番の家」の役目として合うものはどれ？", correct: "こまったときにかけこめる場所", wrongs: ["おかしを売る店", "ゲームをする場所", "電車の乗り場"], explanation: "「こども110番の家」は、こまったときにかけこんで助けをもとめられる場所です。" }
  ]);

  // F4 仕事どうしの協力(inference, d3)
  fam({
    familyId: "soc_safety_cooperation",
    funMechanic: "inference",
    learningObjective: "安全を守るために、いろいろな人や仕事が協力していることを考えられる",
    commonMistake: "安全は警察や消防だけの仕事だと思いこむ",
    estimatedSeconds: 90,
    skillTags: ["安全", "協力", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "大きな火事のとき、消防だけでなく警察も出動することがあります。警察の役目として考えられることはどれ？", correct: "交通整理をして、消防車が早く着けるようにする", wrongs: ["消防車の代わりに水をかける", "火を大きくする", "何もしない"], explanation: "警察は交通整理などで、消防の活動がしやすいように協力します。" },
    { prompt: "地震のときに、学校の先生・地域の人・消防が協力する理由として考えられることはどれ？", correct: "一人ではできないことも、協力すれば早く安全に対応できるから", wrongs: ["みんなでおしゃべりするため", "だれか一人にまかせればよいから", "協力する意味はない"], explanation: "災害時は、多くの人が協力することで、より早く安全に対応できます。" },
    { prompt: "「こども110番の家」に協力するお店や家庭が多いと、どんなよいことがある？", correct: "こまったときにかけこめる場所が増える", wrongs: ["お店の売り上げが減る", "地域の安全とは関係ない", "こどもが外出しにくくなる"], explanation: "協力する場所が多いほど、こどもが安心してかけこめる場所が増えます。" }
  ]);

  // F5 まちがい直し(find_mistake, d3)
  fam({
    familyId: "soc_safety_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "安全を守るしくみについてのまちがった説明に気づける",
    commonMistake: "警察と消防の役目を取りちがえる",
    estimatedSeconds: 75,
    skillTags: ["安全", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「火事のときは110番に連絡する」と言いました。正しい説明はどれ？", correct: "火事のときは119番に連絡する", wrongs: ["110番で正しい", "どちらでもよい", "連絡はしなくてよい"], explanation: "火事や救急は119番、事件や事故は110番です。" },
    { prompt: "みおさんは「警察の仕事は火事を消すことだ」と言いました。正しい説明はどれ？", correct: "火事を消すのは消防の仕事", wrongs: ["警察の仕事で正しい", "だれの仕事でもない", "学校の先生の仕事"], explanation: "火事を消すのは消防の仕事です。警察は事件や事故、交通安全に関わります。" },
    { prompt: "はるとさんは「安全マップは危ない場所だけを書く」と言いました。正しい説明はどれ？", correct: "危ない場所だけでなく、避難場所やこども110番の家も書く", wrongs: ["危ない場所だけで正しい", "何も書かなくてよい", "好きな場所だけ書く"], explanation: "安全マップには、危ない場所と、助けを求められる場所の両方を書きます。" }
  ]);

  // F6 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "soc_safety_judge",
    funMechanic: "judge_claim",
    learningObjective: "安全を守るしくみについての主張を判断できる",
    commonMistake: "自分の身近な経験だけで判断してしまう",
    estimatedSeconds: 75,
    skillTags: ["安全"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「安全は警察や消防だけでなく、地域の人にも支えられている」。みお「安全を守るのは警察や消防だけの仕事」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "見守り活動やこども110番の家のように、地域の人も安全を支えています。" },
    { prompt: "はると「訓練をしておくと、実さいの災害のときに落ち着いて行動しやすい」。みお「訓練をしてもしなくても同じ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "訓練をしておくことで、いざというときに落ち着いて行動しやすくなります。" },
    { prompt: "はると「交通のきまりを守ることは、自分だけでなく周りの安全も守ることになる」。みお「交通のきまりは自分には関係ない」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "きまりを守ることは、自分自身だけでなく周りの人の安全にもつながります。" }
  ]);

  // F7 災害時の行動を考える(decide_then_verify, d4)
  fam({
    familyId: "soc_safety_decide",
    funMechanic: "decide_then_verify",
    learningObjective: "災害時にどう行動すべきか考えて、正しい行動を選べる",
    commonMistake: "自分の思いつきだけで行動し、決められた避難行動を確認しない",
    estimatedSeconds: 90,
    skillTags: ["安全", "防災", "判断"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "学校で大きな地震が起きました。まず自分ならどうする？その後、正しい行動を確認しよう。地震のときに正しい行動はどれ？", correct: "先生の指示にしたがい、机の下にかくれてから避難する", wrongs: ["すぐに外へ走って飛び出す", "エレベーターに乗って避難する", "その場でじっと立ちつくす"], explanation: "地震のときは、まず机の下などでみを守り、その後先生の指示で落ち着いて避難します。" },
    { prompt: "下校中に大雨と雷が始まりました。自分ならどうする？その後、正しい行動を確認しよう。正しい行動はどれ？", correct: "近くの安全な建物に入って、雨や雷がおさまるのを待つ", wrongs: ["木の下でずっと雨宿りする", "そのまま急いで橋をわたる", "川の様子を見に行く"], explanation: "雷は高い木に落ちやすいため危険です。安全な建物の中で待つのが正しい行動です。" },
    { prompt: "町で「こまっている人」を見かけました。自分ならどうする？その後、正しい行動を確認しよう。正しい行動はどれ？", correct: "近くの大人や「こども110番の家」に知らせる", wrongs: ["だまって通りすぎる", "一人で全部解決しようとする", "知らない人についていく"], explanation: "自分だけで対応せず、周りの大人や助けを求められる場所に知らせることが大切です。" }
  ]);

  // F8 標識・マークを読み取る(drill, d2)
  fam({
    familyId: "soc_safety_sign",
    funMechanic: "drill",
    learningObjective: "安全のための標識やマークの意味がわかる",
    commonMistake: "形のにた標識(注意と禁止など)を取りちがえる",
    estimatedSeconds: 45,
    skillTags: ["安全", "標識"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "三角の中にびっくりマークがある標識の意味はどれ？", correct: "注意しましょう", wrongs: ["入ってはいけません", "止まらなくてよい", "自由に使えます"], explanation: "三角にびっくりマークの標識は「注意」を表します。" },
    { prompt: "丸の中に斜め線が入った標識の意味はどれ？", correct: "禁止(してはいけません)", wrongs: ["注意しましょう", "どうぞ自由に", "止まってはいけません"], explanation: "丸に斜め線の標識は「禁止」を表すことが多いです。" },
    { prompt: "「止まれ」の標識の形として合うものはどれ？", correct: "赤い逆三角形", wrongs: ["青い四角", "緑の丸", "黄色い星"], explanation: "「止まれ」は赤い逆三角形の標識で表されます。" },
    { prompt: "非常口(ひじょうぐち)のマークが表すものはどれ？", correct: "災害のときなどに逃げる出口", wrongs: ["トイレの場所", "水道の場所", "電話の場所"], explanation: "非常口のマークは、緊急時に避難する出口を示しています。" },
    { prompt: "AED(自動体外式除細動器)のマークが表すものはどれ？", correct: "きゅうに心臓が止まった人を助ける機械の場所", wrongs: ["自動販売機の場所", "エレベーターの場所", "きゅうすいの場所"], explanation: "AEDは心臓が止まってしまった人を助けるための機械です。" }
  ]);

  // F9 みんなで守るきまり(best_choice, d2)
  fam({
    familyId: "soc_safety_rule",
    funMechanic: "best_choice",
    learningObjective: "地域や学校で安全のために守るきまりの意味を判断できる",
    commonMistake: "きまりを守る理由を考えず、形だけ覚える",
    estimatedSeconds: 60,
    skillTags: ["安全", "きまり"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "登下校のときに集団で歩く理由として合うものはどれ？", correct: "みんなで注意し合い、安全に登下校できるようにするため", wrongs: ["おしゃべりを楽しむためだけ", "早く着くためだけ", "特に理由はない"], explanation: "集団登下校は、みんなで気をつけ合い、安全を高めるためのきまりです。" },
    { prompt: "自転車に乗るときにヘルメットをかぶる理由として合うものはどれ？", correct: "転んだときに頭を守るため", wrongs: ["おしゃれのため", "暑さを防ぐため", "特に意味はない"], explanation: "ヘルメットは、事故のときに頭を守る大切な道具です。" },
    { prompt: "プールに入る前にシャワーをあびるきまりがある理由はどれ？", correct: "体をきれいにして、水を清潔に保つため", wrongs: ["水をたくさん使うため", "時間をかけるためだけ", "特に意味はない"], explanation: "シャワーで体をきれいにすることで、プールの水を清潔に保てます。" },
    { prompt: "運動場や体育館で走り回るとき、決められた向きやコースを守る理由はどれ？", correct: "みんなが安全にぶつからず動けるようにするため", wrongs: ["早く走るためだけ", "先生を困らせるため", "特に意味はない"], explanation: "決められたコースを守ることで、ぶつかったりする事故を防げます。" }
  ]);

  // F10 通学路の安全(inference, d3)
  fam({
    familyId: "soc_safety_route",
    funMechanic: "inference",
    learningObjective: "通学路の様子から、危険な場所を見つけて考えられる",
    commonMistake: "見た目だけで安全・危険を判断し、理由を考えない",
    estimatedSeconds: 90,
    skillTags: ["安全", "通学路", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "見通しの悪い曲がり角では、どんな危険が考えられる？", correct: "車や自転車が急に来ても気づきにくい", wrongs: ["音がうるさい", "道がせまくて歩けない", "特に危険はない"], explanation: "見通しが悪いと、車や自転車の接近に気づきにくく事故につながりやすいです。" },
    { prompt: "夜、街灯が少ない道を歩くとき、どんな危険が考えられる？", correct: "暗くて周りが見えにくく、危ないことに気づきにくい", wrongs: ["明るすぎて目が疲れる", "道が広すぎる", "特に危険はない"], explanation: "暗い道は視界が悪く、危険に気づきにくくなります。" },
    { prompt: "人通りが少ない道を一人で歩くとき、どんなことに気をつけるとよい？", correct: "できるだけ人通りの多い道を選ぶ", wrongs: ["近道なら気にしない", "急いで走りぬける", "特に気をつけなくてよい"], explanation: "人通りが少ない道は、こまったときに助けを求めにくいことがあります。" },
    { prompt: "こう配の急な坂道や、水があふれやすい場所を通学路で見つけたら、どうするとよい？", correct: "地域の危険な場所として記録し、大人や友だちと共有する", wrongs: ["だれにも言わずおぼえておくだけ", "気にしないで毎日通る", "その道を二度と使わない"], explanation: "危険な場所は記録して共有することで、みんなが気をつけられるようになります。" }
  ]);

  // F11 施設どうしの連けい(inference, d3)
  fam({
    familyId: "soc_safety_network",
    funMechanic: "inference",
    learningObjective: "消防・警察・病院などが連けいして安全を守るしくみを考えられる",
    commonMistake: "それぞれの施設がばらばらに動いていると思いこむ",
    estimatedSeconds: 90,
    skillTags: ["安全", "連けい", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "交通事故が起きたとき、警察・消防・病院が連けいする理由として考えられることはどれ？", correct: "それぞれの得意な役目を生かして、早く安全に対応するため", wrongs: ["だれか一人にまかせるため", "連けいする意味はない", "書類を増やすため"], explanation: "警察は交通整理、消防は救助、病院は治療というように、役目を分担して協力します。" },
    { prompt: "119番の通報が消防と救急の両方につながる理由として考えられることはどれ？", correct: "火事や病気・けがなど、どちらもすぐに助けが必要だから", wrongs: ["番号をおぼえやすくするためだけ", "消防と救急は同じ組織だから", "特に理由はない"], explanation: "火事も急病も命に関わることが多いため、同じ119番で対応しています。" }
  ]);

  // F12 まちの安全マップ作り(decide_then_verify, d4)
  fam({
    familyId: "soc_safety_map_decide",
    funMechanic: "decide_then_verify",
    learningObjective: "安全マップを作るとき何を調べるべきか考え、実際の視点と照らし合わせられる",
    commonMistake: "危険な場所だけを探し、安心できる場所を調べない",
    estimatedSeconds: 90,
    skillTags: ["安全", "地域", "判断"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "安全マップを作るとき、まず何を調べる？自分で考えてから、実際によく調べる内容を確かめよう。実際によく調べる内容はどれ？", correct: "危ない場所と、こまったときにかけこめる場所の両方", wrongs: ["危ない場所だけ", "きれいな場所だけ", "好きな場所だけ"], explanation: "安全マップは、危険な場所と助けを求められる場所の両方を調べて作ります。" },
    { prompt: "地域の危ない場所を見つけたら、次に何をする？自分で考えてから、実際にすることを確かめよう。実際にすることはどれ？", correct: "地図に書きこみ、みんなで情報を共有する", wrongs: ["だれにも言わない", "その場所を無視する", "一人だけでおぼえておく"], explanation: "見つけた情報は地図に書きこみ、みんなで共有することで役立てられます。" }
  ]);

  // F13 安全のまちがい直し2(find_mistake, d3)
  fam({
    familyId: "soc_safety_find_mistake2",
    funMechanic: "find_mistake",
    learningObjective: "標識やきまりについてのまちがった説明に気づける",
    commonMistake: "標識の形と意味を正しく結びつけずに覚える",
    estimatedSeconds: 75,
    skillTags: ["安全", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「丸に斜め線の標識はすすめの意味だ」と言いました。正しい説明はどれ？", correct: "丸に斜め線の標識は禁止の意味", wrongs: ["すすめの意味で正しい", "止まれの意味", "意味はない"], explanation: "丸に斜め線が入った標識は「禁止」を表すことが多いです。" },
    { prompt: "みおさんは「非常口のマークはトイレの場所を表す」と言いました。正しい説明はどれ？", correct: "非常口のマークは避難する出口を表す", wrongs: ["トイレの場所で正しい", "水道の場所を表す", "電話の場所を表す"], explanation: "非常口のマークは、緊急時に逃げる出口を示すマークです。" }
  ]);

  // F14 どっちの言い分が正しい？3(judge_claim, d3)
  fam({
    familyId: "soc_safety_judge2",
    funMechanic: "judge_claim",
    learningObjective: "通学路や地域の安全についての主張を判断できる",
    commonMistake: "自分の経験だけで、通学路全体の安全を判断してしまう",
    estimatedSeconds: 75,
    skillTags: ["安全", "通学路"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「見通しの悪い曲がり角では、いったん止まって左右を確かめるとよい」。みお「曲がり角では急いで通りぬけるとよい」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "見通しの悪い場所では、いったん止まって安全を確かめることが大切です。" },
    { prompt: "はると「集団登下校は、一人で行くより安全性が高まる」。みお「集団で行っても一人で行っても安全さは同じ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "集団で行動することで、お互いに気をつけ合い安全性が高まります。" },
    { prompt: "はると「こども110番の家は、こまったときにだれでもかけこめる」。みお「こども110番の家は大人は使えない」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "こども110番の家は主にこどもを対象としていますが、こまっている人を助けるための場所です。" }
  ]);

  // F15 安全のための工夫を考える(rule_discovery, d3)
  fam({
    familyId: "soc_safety_rule2",
    funMechanic: "rule_discovery",
    learningObjective: "地域や道路の安全のための工夫の共通点を見つけられる",
    commonMistake: "工夫の形だけを見て、共通する目的に気づかない",
    estimatedSeconds: 75,
    skillTags: ["安全", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "横断歩道、ガードレール、信号機に共通する目的はどれ？", correct: "交通事故を防ぎ、安全に道路を使えるようにする", wrongs: ["道路を美しく見せる", "車を増やす", "特に共通点はない"], explanation: "これらはどれも、交通事故を防ぎ安全を守るための工夫です。" },
    { prompt: "防犯カメラ、見守り活動、こども110番の家に共通する目的はどれ？", correct: "地域の防犯や安全を守ること", wrongs: ["観光客を増やすこと", "道路を広くすること", "特に共通点はない"], explanation: "これらはどれも、地域の防犯・安全を守るための取り組みです。" }
  ]);

  // F16 防災のじゅんび(drill, d2)
  fam({
    familyId: "soc_safety_prep",
    funMechanic: "drill",
    learningObjective: "災害に備えたじゅんびの内容がわかる",
    commonMistake: "防災グッズや避難場所の確認を「特別なとき」だけ考えればよいと思う",
    estimatedSeconds: 45,
    skillTags: ["安全", "防災"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "災害にそなえて用意しておくとよいものはどれ？", correct: "水や食料などの非常持ち出し品", wrongs: ["ゲーム機だけ", "おかしだけ", "特に何も用意しなくてよい"], explanation: "災害時にすぐ持ち出せるよう、水や食料などを用意しておくと安心です。" },
    { prompt: "災害用に用意しておくと役立つ道具はどれ？", correct: "けい帯用のラジオ", wrongs: ["ゲームソフト", "文房具だけ", "特に用意しなくてよい"], explanation: "停電時でも情報を得られるよう、電池で使えるラジオが役立ちます。" },
    { prompt: "家族で決めておくとよい防災の内容はどれ？", correct: "避難場所と連絡方法", wrongs: ["好きなテレビ番組", "夕食のメニュー", "特に決めなくてよい"], explanation: "災害時にはぐれても会えるよう、避難場所や連絡方法を決めておきます。" },
    { prompt: "避難訓練を定期的に行う理由はどれ？", correct: "実際の災害時にあわてず行動できるようにするため", wrongs: ["体力をつけるためだけ", "学校を休むためだけ", "特に理由はない"], explanation: "訓練をくり返すことで、実際の災害時に落ち着いて行動しやすくなります。" }
  ]);

  // F17 昔と今の安全のちがい(inference, d4)
  fam({
    familyId: "soc_safety_then_now",
    funMechanic: "inference",
    learningObjective: "昔と今で、安全を守るしくみがどう変わったか考えられる",
    commonMistake: "今のしくみが昔からずっと同じだったと思いこむ",
    estimatedSeconds: 90,
    skillTags: ["安全", "歴史", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "昔は防犯カメラがありませんでした。その分、地域の安全はどのように守られていたと考えられる？", correct: "近所の人どうしが、より積極的に声をかけ合っていた", wrongs: ["だれも安全に気をつけていなかった", "事故や事件はまったくなかった", "警察がいなかった"], explanation: "機械がなかった時代は、地域の人どうしのつながりがより大切にされていました。" },
    { prompt: "昔と今で、消防車の性能はどう変わってきたと考えられる？", correct: "水をより速く、多く出せるように進化してきた", wrongs: ["昔の方が性能がよかった", "まったく変わっていない", "消防車はなくなった"], explanation: "技術の進歩により、消防車の性能も向上してきました。" }
  ]);

  // F18 防災グッズを選ぶ(best_choice, d3)
  fam({
    familyId: "soc_safety_goods",
    funMechanic: "best_choice",
    learningObjective: "災害時に必要なものを、目的に合わせて選べる",
    commonMistake: "楽しさや便利さだけで防災グッズを選んでしまう",
    estimatedSeconds: 60,
    skillTags: ["安全", "防災", "道具"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "停電になったときに役立つ道具はどれ？", correct: "懐中電灯", wrongs: ["テレビ", "せんぷう機", "電気ポット"], explanation: "停電時は電気を使う道具が使えないため、電池で光る懐中電灯が役立ちます。" },
    { prompt: "避難生活で水が足りないときに役立つものはどれ？", correct: "ペットボトルの水の備蓄", wrongs: ["ゲーム機", "おもちゃ", "本"], explanation: "水は生きるために欠かせないため、あらかじめ備蓄しておくことが大切です。" },
    { prompt: "災害時、家族と連絡を取るために役立つものはどれ？", correct: "災害用伝言ダイヤルの使い方を知っておくこと", wrongs: ["新しいゲームを買うこと", "テレビを見続けること", "何も準備しないこと"], explanation: "災害時は電話がつながりにくくなることがあるため、伝言ダイヤルなどの使い方を知っておくと安心です。" }
  ]);

  // F19 交通安全のきまり(drill, d2)
  fam({
    familyId: "soc_safety_traffic",
    funMechanic: "drill",
    learningObjective: "交通安全のための基本のきまりがわかる",
    commonMistake: "信号の色の意味を取りちがえる",
    estimatedSeconds: 45,
    skillTags: ["安全", "交通"],
    axes: { knowledge: 1, info: 1, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "信号が赤のとき、するべき行動はどれ？", correct: "止まって待つ", wrongs: ["急いでわたる", "走ってわたる", "気にせずわたる"], explanation: "赤信号は「止まれ」を表します。色でルールを一目で伝える工夫です。" },
    { prompt: "自転車に乗るときの正しい交通ルールはどれ？", correct: "車道の左側を走る", wrongs: ["歩道のまん中を走る", "右側を走る", "どこを走ってもよい"], explanation: "自転車は原則として車道の左側を走ります。" },
    { prompt: "信号が青のとき、道路をわたる前にすることはどれ？", correct: "左右を確認してからわたる", wrongs: ["何も確認せずわたる", "目を閉じてわたる", "後ろだけ確認する"], explanation: "青信号でも、車が来ていないか左右を確認してからわたります。" },
    { prompt: "横断歩道のない場所で道路をわたるとき、気をつけることはどれ？", correct: "できるだけ横断歩道まで行ってわたる", wrongs: ["どこでも自由にわたってよい", "目をつぶってわたる", "走って一気にわたる"], explanation: "横断歩道は安全にわたれるよう作られた場所なので、できるだけそこを使います。" },
    { prompt: "点滅している青信号を見たときの正しい行動はどれ？", correct: "わたり始めず、次の青信号を待つ", wrongs: ["急いで走ってわたる", "止まったままその場に立つ", "気にせずゆっくりわたる"], explanation: "点滅は「まもなく赤になる」合図なので、わたり始めず次の青を待つのが安全です。" }
  ]);

  // F20 みんなで作る安全(judge_claim, d4)
  fam({
    familyId: "soc_safety_judge3",
    funMechanic: "judge_claim",
    learningObjective: "地域の安全を守るために、だれがどんな役割を果たしているか判断できる",
    commonMistake: "安全を守るのは大人だけの役目だと考え、自分たちの役割を考えない",
    estimatedSeconds: 90,
    skillTags: ["安全", "協力"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「子どもも、あいさつや周りへの注意で地域の安全に協力できる」。みお「子どもは安全に何もできない」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "あいさつを交わすことや周りに気をつけることは、子どもにもできる地域の安全への協力です。" },
    { prompt: "はると「学校、警察、消防、地域の人がそれぞれの役目で協力して安全を守っている」。みお「安全を守るのは警察だけの仕事だ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "安全は、いろいろな立場の人が協力して守っています。" }
  ]);

  // F21 きんきゅう時の判断(decide_then_verify, d4)
  fam({
    familyId: "soc_safety_emergency_decide",
    funMechanic: "decide_then_verify",
    learningObjective: "きんきゅう時にどう行動すべきか考え、正しい行動と照らし合わせられる",
    commonMistake: "あわてて行動し、まず何をすべきか考えずに動いてしまう",
    estimatedSeconds: 90,
    skillTags: ["安全", "判断"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "台所から煙が出ているのに気づきました。自分ならどうする？その後、正しい行動を確かめよう。正しい行動はどれ？", correct: "すぐに大人に知らせる", wrongs: ["自分で火を消そうとする", "見なかったことにする", "写真をとる"], explanation: "火事の疑いがあるときは、まず大人に知らせることが大切です。" },
    { prompt: "道を歩いていて、事故を目げきしました。自分ならどうする？その後、正しい行動を確かめよう。正しい行動はどれ？", correct: "近くの大人に伝え、119番か110番の連絡を頼む", wrongs: ["自分だけで対応しようとする", "そのまま通りすぎる", "写真をとって帰る"], explanation: "自分で対応しようとせず、大人に伝えて連絡してもらうことが安全です。" }
  ]);

  // F22 施設のなかまはずれ(rule_discovery, d3)
  fam({
    familyId: "soc_safety_odd",
    funMechanic: "rule_discovery",
    learningObjective: "安全を守る施設の共通点を見つけて、なかま分けできる",
    commonMistake: "建物の見た目だけで、役目のちがいに気づかない",
    estimatedSeconds: 75,
    skillTags: ["安全", "なかま分け"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "なかまはずれの施設はどれ？（消防署・警察署・病院・図書館）", correct: "図書館", wrongs: ["消防署", "警察署", "病院"], explanation: "消防署・警察署・病院は緊急時に助けてくれる施設ですが、図書館はちがいます。" },
    { prompt: "なかまはずれの数字はどれ？（119番・110番・117番・市役所の番号）", correct: "市役所の番号", wrongs: ["119番", "110番", "117番"], explanation: "119番・110番・117番は緊急連絡用の番号ですが、市役所の番号はふつうの問い合わせ用です。" }
  ]);

  // F23 交通標識ならべ(reorder, d4)
  fam({
    familyId: "soc_safety_reorder",
    funMechanic: "reorder",
    learningObjective: "道路を安全にわたる手順を順序立てて考えられる",
    commonMistake: "確認の手順を省略して、いきなり道路をわたろうとする",
    estimatedSeconds: 75,
    skillTags: ["安全", "交通", "ならべ替え"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "横断歩道をわたるときの正しい手順はどれ？", correct: "信号を確認する → 止まって左右を見る → 手をあげてわたる", wrongs: ["手をあげてわたる → 信号を確認する → 止まって左右を見る", "止まって左右を見る → 手をあげてわたる → 信号を確認する", "信号を確認する → 手をあげてわたる → 止まって左右を見る"], explanation: "信号を確認し、左右を見てから、安全にわたります。" },
    { prompt: "火事を見つけたときの正しい手順はどれ？", correct: "大人に知らせる → 119番に連絡する → 安全な場所へ避難する", wrongs: ["安全な場所へ避難する → 大人に知らせる → 119番に連絡する", "119番に連絡する → 安全な場所へ避難する → 大人に知らせる", "大人に知らせる → 安全な場所へ避難する → 119番に連絡する"], explanation: "まず大人に知らせ、消防に連絡し、その後安全な場所に避難します。" }
  ]);

  if (questions.length !== 70) throw new Error(`safety_life: expected 70, got ${questions.length}`);
  return questions;
}

// ---------------------------------------------------------------- 市と生活のうつりかわり(50)
function makeCityChange() {
  const { questions, fam } = makeFamilyBuilder("city_change");

  // F1 昔を調べる資料(drill, d2)
  fam({
    familyId: "soc_history_source",
    funMechanic: "drill",
    learningObjective: "昔のくらしを調べるための資料の種類がわかる",
    commonMistake: "資料の種類を混同する(写真と年表など)",
    estimatedSeconds: 45,
    skillTags: ["歴史", "資料"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "昔のくらしを調べる資料として合うものはどれ？", correct: "古い写真や地図、聞き取り", wrongs: ["今日の天気だけ", "新しい消しゴムだけ", "ゲームの説明だけ"], explanation: "昔のくらしは、写真・地図・道具・聞き取りなどから調べます。" },
    { prompt: "年表を使うと分かりやすいことはどれ？", correct: "できごとの順番", wrongs: ["食べ物の味", "声の大きさ", "色の明るさ"], explanation: "年表は、できごとを時間の順に整理する資料です。" },
    { prompt: "昔の道具を調べると分かることはどれ？", correct: "昔の人のくらしの工夫", wrongs: ["未来の天気だけ", "友だちの点数だけ", "今のテレビ番組だけ"], explanation: "道具には、その時代のくらしや工夫が表れます。" },
    { prompt: "古くから残る建物を大切にする理由はどれ？", correct: "地域の歴史を知る手がかりになるから", wrongs: ["必ず新しいから", "中に入れないから", "名前が短いから"], explanation: "古い建物や道具は、昔のくらしを知る資料になります。" }
  ]);

  // F2 昔と今をくらべる(drill, d2)
  fam({
    familyId: "soc_history_compare",
    funMechanic: "drill",
    learningObjective: "昔と今のくらしのちがいを比べられる",
    commonMistake: "変化の理由を考えず、変わったことだけを覚える",
    estimatedSeconds: 45,
    skillTags: ["歴史", "市の変化"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "市のうつりかわりを調べるときに比べるものはどれ？", correct: "昔と今の地図や写真", wrongs: ["同じ日の給食だけ", "一つの石だけ", "えんぴつの長さだけ"], explanation: "昔と今を比べることで、変わったことや続いていることが分かります。" },
    { prompt: "昔と今で変わったことを表すものはどれ？", correct: "交通や店、家の様子", wrongs: ["空があること", "昼と夜があること", "水がぬれること"], explanation: "くらしの道具や交通、町並みは時代とともに変わることがあります。" },
    { prompt: "今も昔も地域に必要なものとして合うものはどれ？", correct: "人々が協力してくらすこと", wrongs: ["だれとも話さないこと", "道を使わないこと", "安全を考えないこと"], explanation: "時代が変わっても、地域で協力してくらすことは大切です。" }
  ]);

  // F3 変化の理由を考える(inference, d3)
  fam({
    familyId: "soc_history_reason",
    funMechanic: "inference",
    learningObjective: "町の様子が変化した理由を考えられる",
    commonMistake: "変化には理由があることを考えず、「なんとなく」ですませる",
    estimatedSeconds: 90,
    skillTags: ["歴史", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "昔より道路が広くなった理由として考えやすいものはどれ？", correct: "車や人が通りやすくするため", wrongs: ["道を使わないため", "家を全部なくすため", "雨を止めるため"], explanation: "交通やくらしの変化に合わせて、道路が整えられることがあります。" },
    { prompt: "市の人口が増えると必要になりやすいものはどれ？", correct: "学校や店、道路などの施設", wrongs: ["何も必要ない", "地図を全部なくすこと", "信号を消すこと"], explanation: "住む人が増えると、くらしを支える施設も必要になります。" },
    { prompt: "昔は少なかった自動車が増えると、まちにどんな変化が起きやすい？", correct: "駐車場や広い道路が必要になる", wrongs: ["道路がせまくなる", "自動車を見なくなる", "何も変わらない"], explanation: "自動車が増えると、それを止める駐車場や通る道路の整備が必要になります。" }
  ]);

  // F4 まちがい直し(find_mistake, d3)
  fam({
    familyId: "soc_history_find_mistake",
    funMechanic: "find_mistake",
    learningObjective: "昔と今のくらしについてのまちがった説明に気づける",
    commonMistake: "昔のくらしを何でも「不便で悪いもの」と決めつける",
    estimatedSeconds: 75,
    skillTags: ["歴史", "たしかめ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "はるとさんは「昔もくらしも今とまったく同じだった」と言いました。正しい説明はどれ？", correct: "道具や交通など、昔と今でちがう部分がある", wrongs: ["まったく同じで正しい", "昔のことは何もわからない", "今のことは何もわからない"], explanation: "昔と今では、道具や交通などが変わってきました。" },
    { prompt: "みおさんは「古い建物や道具はすべてすてるべきだ」と言いました。正しい説明はどれ？", correct: "古い建物や道具は、歴史を知る大切な資料になる", wrongs: ["すべてすてるべきで正しい", "古いものに価値はない", "新しいものだけが大切"], explanation: "古い建物や道具は、昔のくらしを知るための大切な資料です。" }
  ]);

  // F5 どっちの言い分が正しい？(judge_claim, d3)
  fam({
    familyId: "soc_history_judge",
    funMechanic: "judge_claim",
    learningObjective: "昔と今のくらしについての主張を、資料をもとに判断できる",
    commonMistake: "変化と継続のどちらか一方だけに注目してしまう",
    estimatedSeconds: 75,
    skillTags: ["歴史"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「昔と今をくらべると、変わったことと変わらないことの両方がある」。みお「昔と今はすべてがちがう」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "交通や道具は変わっても、人々が協力してくらすことなど変わらないこともあります。" },
    { prompt: "はると「年表を使うと、できごとの順番がわかりやすい」。みお「年表がなくても順番はいつでもわかる」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "年表は、できごとを時間の順に整理して見やすくする資料です。" }
  ]);

  // F6 うつりかわりをならべる(reorder, d4)
  fam({
    familyId: "soc_history_reorder",
    funMechanic: "reorder",
    learningObjective: "市のうつりかわりを、古い順にならべられる",
    commonMistake: "できごとの前後関係を考えずに、印象で順番を決める",
    estimatedSeconds: 90,
    skillTags: ["歴史", "年表", "ならべ替え"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 2 }
  }, [
    { prompt: "市のうつりかわりとして、正しい順はどれ？", correct: "田畑が多かった → 道路が整備された → 店や住宅が増えた", wrongs: ["店や住宅が増えた → 田畑が多かった → 道路が整備された", "道路が整備された → 店や住宅が増えた → 田畑が多かった", "田畑が多かった → 店や住宅が増えた → 道路が整備された"], explanation: "多くの市では、田畑が広がっていた時代から、道路が整備され、店や住宅が増えていく順に変化しました。" },
    { prompt: "道具のうつりかわりとして、正しい順はどれ？", correct: "手で洗う → 洗たく板を使う → 洗たく機を使う", wrongs: ["洗たく機を使う → 手で洗う → 洗たく板を使う", "洗たく板を使う → 洗たく機を使う → 手で洗う", "洗たく機を使う → 洗たく板を使う → 手で洗う"], explanation: "洗たくの道具は、手洗い→洗たく板→洗たく機の順に発達してきました。" }
  ]);

  // F7 うつりかわりを学ぶ見方(rule_discovery, d3)
  fam({
    familyId: "soc_history_view",
    funMechanic: "rule_discovery",
    learningObjective: "うつりかわりを学ぶときの大切な見方に気づける",
    commonMistake: "変わったことだけに注目し、続いていることを見落とす",
    estimatedSeconds: 75,
    skillTags: ["歴史", "きまり見つけ"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "うつりかわりを学ぶときに大切な見方はどれ？", correct: "変わったことと続いていることを比べる", wrongs: ["一つだけ見て決める", "昔のことを全部忘れる", "資料を見ない"], explanation: "昔と今を比べると、変化と継続の両方に気づけます。" },
    { prompt: "市のうつりかわりを調べるとき、複数の資料を使う理由はどれ？", correct: "1つの資料だけではわからないことがあるから", wrongs: ["資料はたくさんある方が見た目がよいから", "先生に言われたから何となく", "資料の数を競うため"], explanation: "写真・地図・聞き取りなど複数の資料を組み合わせると、より正確に昔の様子がわかります。" }
  ]);

  // F8 道具のうつりかわり(drill, d2)
  fam({
    familyId: "soc_history_tool",
    funMechanic: "drill",
    learningObjective: "昔と今の生活道具のちがいがわかる",
    commonMistake: "道具の名前は知っていても、使われていた時代を混同する",
    estimatedSeconds: 45,
    skillTags: ["歴史", "道具"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "昔、冷蔵庫がなかったころに食べ物を冷やすために使われていたものはどれ？", correct: "氷", wrongs: ["電気", "ガス", "水道"], explanation: "電気の冷蔵庫がなかったころは、氷を使って食べ物を冷やしていました。" },
    { prompt: "昔、洗たく機がなかったころ、洗たくはどのように行われていた？", correct: "手や洗たく板でこすって洗っていた", wrongs: ["自動でかんそうしていた", "何もしなくてよかった", "水を使わずに洗っていた"], explanation: "洗たく機が広まる前は、手や洗たく板を使って洗たくしていました。" },
    { prompt: "昔、電気がなかったころ、夜の明かりに使われていたものはどれ？", correct: "ろうそくやランプ", wrongs: ["電球", "けい光灯", "LED"], explanation: "電気が広まる前は、ろうそくやランプで明かりをとっていました。" },
    { prompt: "昔の台所で、ごはんをたくために使われていたものはどれ？", correct: "かまど", wrongs: ["電気炊飯器", "電子レンジ", "オーブン"], explanation: "電気炊飯器が広まる前は、かまどで火を使ってごはんをたいていました。" }
  ]);

  // F9 交通のうつりかわり(drill, d2)
  fam({
    familyId: "soc_history_transport",
    funMechanic: "drill",
    learningObjective: "昔と今の交通のちがいがわかる",
    commonMistake: "交通手段が発達した順番を逆に覚える",
    estimatedSeconds: 45,
    skillTags: ["歴史", "交通"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "自動車が広まる前、人や荷物を運ぶのによく使われていたものはどれ？", correct: "馬や馬車", wrongs: ["飛行機", "新幹線", "地下鉄"], explanation: "自動車が広まる前は、馬や馬車が人や荷物を運ぶために使われていました。" },
    { prompt: "新幹線ができる前、遠くまで早く行く交通手段として使われていたものはどれ？", correct: "急行や特急の電車", wrongs: ["新幹線", "リニアモーターカー", "宇宙船"], explanation: "新幹線ができる前は、急行や特急などの電車が使われていました。" },
    { prompt: "昔と今をくらべて、道路の様子はどう変わってきた？", correct: "せまい道から広い道へと整備されてきた", wrongs: ["広い道からせまい道になった", "まったく変わっていない", "道路がなくなった"], explanation: "自動車の増加にあわせて、道路は広く整備されてきました。" }
  ]);

  // F10 くらしの変化を考える(inference, d3)
  fam({
    familyId: "soc_history_life_change",
    funMechanic: "inference",
    learningObjective: "道具や交通の変化が、人々のくらしにどう影響したか考えられる",
    commonMistake: "道具の変化と、くらしの変化のつながりを考えない",
    estimatedSeconds: 90,
    skillTags: ["歴史", "くらしの変化", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "洗たく機が広まったことで、人々のくらしはどう変わったと考えられる？", correct: "洗たくにかかる時間や手間が少なくなった", wrongs: ["洗たくがまったくできなくなった", "服がよごれやすくなった", "特に変化はなかった"], explanation: "機械化によって、家事にかかる時間や手間が減りました。" },
    { prompt: "自動車が広まったことで、人々のくらしはどう変わったと考えられる？", correct: "遠くまで早く楽に移動できるようになった", wrongs: ["どこにも行けなくなった", "移動に時間がかかるようになった", "特に変化はなかった"], explanation: "自動車の普及により、移動がより速く便利になりました。" },
    { prompt: "電気が広まったことで、人々のくらしはどう変わったと考えられる？", correct: "夜でも明るくすごせるようになった", wrongs: ["昼と夜の区別がなくなった", "明かりがまったくなくなった", "特に変化はなかった"], explanation: "電気の普及により、夜でも安全に活動できるようになりました。" }
  ]);

  // F11 まちの人口とくらし(inference, d4)
  fam({
    familyId: "soc_history_population",
    funMechanic: "inference",
    learningObjective: "人口の変化が、まちの様子にどう影響するか考えられる",
    commonMistake: "人口の増減とまちの変化を関連付けずに考える",
    estimatedSeconds: 90,
    skillTags: ["歴史", "人口", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "ある町で人口が大きく増えたとき、起こりやすい変化はどれ？", correct: "新しい学校や店が建てられる", wrongs: ["学校や店が減る", "田畑が急に増える", "何も変わらない"], explanation: "人口が増えると、それを支える施設が新たに必要になることが多いです。" },
    { prompt: "ある町で人口が減ってきているとき、起こりやすい変化はどれ？", correct: "使われなくなる建物や施設が出てくることがある", wrongs: ["建物や施設がどんどん増える", "道路がすべてなくなる", "何も変わらない"], explanation: "人口が減ると、必要とされる施設の数も変わってくることがあります。" }
  ]);

  // F12 昔と今のならべ替え(reorder, d4)
  fam({
    familyId: "soc_history_reorder2",
    funMechanic: "reorder",
    learningObjective: "道具や交通のうつりかわりを、時代の順にならべられる",
    commonMistake: "見た目の古さと、実際の年代の前後を取りちがえる",
    estimatedSeconds: 90,
    skillTags: ["歴史", "ならべ替え"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 3, choices: 2 }
  }, [
    { prompt: "明かりの道具の、古い順として正しいのはどれ？", correct: "ろうそく → 電球 → LED", wrongs: ["電球 → ろうそく → LED", "LED → 電球 → ろうそく", "ろうそく → LED → 電球"], explanation: "ろうそくから電球、そしてより省エネなLEDへとうつり変わってきました。" },
    { prompt: "洗たく道具の、古い順として正しいのはどれ？", correct: "洗たく板 → 手動の洗たく機 → 全自動の洗たく機", wrongs: ["全自動の洗たく機 → 手動の洗たく機 → 洗たく板", "手動の洗たく機 → 洗たく板 → 全自動の洗たく機", "全自動の洗たく機 → 洗たく板 → 手動の洗たく機"], explanation: "洗たく板から手動の機械、そして全自動の機械へと進化してきました。" }
  ]);

  // F13 資料からわかること(best_choice, d3)
  fam({
    familyId: "soc_history_source_use",
    funMechanic: "best_choice",
    learningObjective: "調べたいことに合わせて、適切な資料を選べる",
    commonMistake: "調べたい内容と関係のない資料を選んでしまう",
    estimatedSeconds: 60,
    skillTags: ["歴史", "資料活用"],
    axes: { knowledge: 1, info: 2, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "昔の道具の使い方を知りたいとき、いちばん役立つ資料はどれ？", correct: "昔のくらしを知っている人への聞き取り", wrongs: ["今日の天気予報", "今週の給食のメニュー", "来月のカレンダー"], explanation: "昔のくらしを知っている人に聞くことで、道具の使い方などがよくわかります。" },
    { prompt: "町の人口がどう変わってきたかを知りたいとき、いちばん役立つ資料はどれ？", correct: "昔と今の人口を表すグラフや表", wrongs: ["昔の給食のメニュー", "今日の天気", "友だちの名前"], explanation: "人口の変化を知るには、年ごとの人口をまとめたグラフや表が役立ちます。" }
  ]);

  // F14 昔の行事・くらしの知えい(drill, d2)
  fam({
    familyId: "soc_history_custom",
    funMechanic: "drill",
    learningObjective: "昔から続く行事や、地域の言い伝えについて知る",
    commonMistake: "昔の行事は今と関係ないと思いこむ",
    estimatedSeconds: 45,
    skillTags: ["歴史", "行事"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "地域の祭りが昔から今まで続けられている理由として考えやすいものはどれ？", correct: "地域の人々がその祭りを大切に思っているから", wrongs: ["だれも気にしていないから", "決まりで無理やり続けているだけ", "特に理由はない"], explanation: "地域の人が大切に思うことで、行事は世代を超えて受けつがれます。" },
    { prompt: "昔から伝わる道具や行事について、今の人が調べる意味として合うものはどれ？", correct: "地域の歴史や人々の思いを知ることができる", wrongs: ["何の意味もない", "今の生活には全く関係ない", "調べるとこまったことになる"], explanation: "昔のことを調べることで、地域の歴史や人々の思いを知ることができます。" }
  ]);

  // F15 市の移り変わりの資料を読む(inference, d3)
  fam({
    familyId: "soc_history_data_read",
    funMechanic: "inference",
    learningObjective: "グラフや表から、市の変化を読み取れる",
    commonMistake: "グラフの数字の変化を見ず、印象だけで判断する",
    estimatedSeconds: 90,
    skillTags: ["歴史", "資料の読み取り", "推理"],
    axes: { knowledge: 2, info: 3, steps: 2, format: 2, choices: 2 }
  }, [
    { prompt: "人口のグラフで、年々数字が大きくなっているとき、何がわかる？", correct: "人口が増えてきている", wrongs: ["人口が減ってきている", "人口は変わっていない", "何もわからない"], explanation: "グラフの数字が大きくなっていれば、人口が増えていることを表します。" },
    { prompt: "田畑の面積のグラフで、年々数字が小さくなっているとき、何が考えられる？", correct: "田畑が住宅地などに変わってきている可能性がある", wrongs: ["田畑がどんどん増えている", "田畑の面積は関係ない", "何もわからない"], explanation: "田畑の面積が減っているときは、ほかの土地利用に変わってきていることが考えられます。" }
  ]);

  // F16 昔のくらしの工夫(judge_claim, d3)
  fam({
    familyId: "soc_history_judge2",
    funMechanic: "judge_claim",
    learningObjective: "昔のくらしの工夫についての主張を判断できる",
    commonMistake: "昔の道具は「不便なだけ」で工夫がないと決めつける",
    estimatedSeconds: 75,
    skillTags: ["歴史", "くらしの工夫"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 1 }
  }, [
    { prompt: "はると「昔の道具にも、その時代なりの工夫がある」。みお「昔の道具は工夫がなく不便なだけだ」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "昔の道具にも、当時の材料や技術の中でよく考えられた工夫があります。" },
    { prompt: "はると「今べんりな道具も、いつかまた新しいものに変わっていくかもしれない」。みお「今の道具はこれ以上変わらない」。正しいのはどっち？", correct: "はるとだけ正しい", explanation: "道具や技術はこれからも変化を続けていくと考えられます。" }
  ]);

  // F17 うつりかわりの理由を考える(inference, d4)
  fam({
    familyId: "soc_history_change_reason",
    funMechanic: "inference",
    learningObjective: "市の様子が変わった理由を、複数の視点から考えられる",
    commonMistake: "1つの原因だけで、複雑な変化を説明しようとする",
    estimatedSeconds: 90,
    skillTags: ["歴史", "推理"],
    axes: { knowledge: 2, info: 3, steps: 3, format: 2, choices: 2 }
  }, [
    { prompt: "駅の近くにあった田畑が、今では住宅やお店に変わりました。この変化の理由として考えられることはどれ？", correct: "駅が近く交通の便がよいため、住みたい人や店を開きたい人が増えたから", wrongs: ["田畑をつくる人がいなくなったから", "駅がなくなったから", "特に理由はない"], explanation: "交通の便のよさから、住宅や店の需要が高まり、土地利用が変わることがあります。" },
    { prompt: "昔は少なかった図書館や公民館が、今ではいくつも建てられました。この変化の理由として考えられることはどれ？", correct: "学びや交流の場を求める人が増えたから", wrongs: ["本を読む人がいなくなったから", "建物を減らすため", "特に理由はない"], explanation: "住民のニーズに合わせて、学びや交流のための施設が増えることがあります。" }
  ]);

  // F18 通信のうつりかわり(drill, d2)
  fam({
    familyId: "soc_history_communication",
    funMechanic: "best_choice",
    learningObjective: "昔と今の連絡手段のちがいがわかる",
    commonMistake: "スマートフォンが昔からあったと思いこむ",
    estimatedSeconds: 45,
    skillTags: ["歴史", "通信"],
    axes: { knowledge: 1, info: 2, steps: 1, format: 1, choices: 2 }
  }, [
    { prompt: "スマートフォンが広まる前、遠くの人に連絡する方法としてよく使われていたものはどれ？", correct: "手紙や固定電話", wrongs: ["インターネット電話", "ビデオ通話", "そもそも連絡できなかった"], explanation: "スマートフォンが広まる前は、手紙や固定電話で連絡を取り合っていました。" },
    { prompt: "けい帯電話が広まる前、外出先から家に連絡するときによく使われていたものはどれ？", correct: "公衆電話", wrongs: ["スマートフォン", "テレビ電話", "インターネット"], explanation: "けい帯電話が広まる前は、街にある公衆電話がよく使われていました。" },
    { prompt: "電話が広まる前、遠くの人へ連絡する方法として主に使われていたものはどれ？", correct: "手紙", wrongs: ["ファックス", "メール", "テレビ電話"], explanation: "電話が広まる前は、手紙で連絡を取り合うことが多かったです。" },
    { prompt: "手紙よりも早く連絡できるようになった道具として、正しいものはどれ？", correct: "電話", wrongs: ["馬", "かご", "船だけ"], explanation: "電話の発明により、遠くの人ともすぐに会話できるようになりました。" },
    { prompt: "今、インターネットを使うと昔とくらべてどんなことができるようになった？", correct: "遠くはなれた人とすぐに文字や映像でやりとりできる", wrongs: ["手紙が届くのが遅くなった", "だれとも連絡できなくなった", "特に変わったことはない"], explanation: "インターネットの普及により、遠くの人ともすぐに連絡が取れるようになりました。" }
  ]);

  // F19 うつりかわりのなかまはずれ(rule_discovery, d3)
  fam({
    familyId: "soc_history_odd",
    funMechanic: "rule_discovery",
    learningObjective: "同じ時代のものどうしの共通点を見つけられる",
    commonMistake: "見た目や大きさだけで、時代の共通点を判断する",
    estimatedSeconds: 75,
    skillTags: ["歴史", "なかま分け"],
    axes: { knowledge: 2, info: 2, steps: 2, format: 3, choices: 2 }
  }, [
    { prompt: "なかまはずれの道具はどれ？（かまど・ろうそく・洗たく板・スマートフォン）", correct: "スマートフォン", wrongs: ["かまど", "ろうそく", "洗たく板"], explanation: "かまど・ろうそく・洗たく板は昔の道具ですが、スマートフォンは今の道具です。" },
    { prompt: "なかまはずれの交通手段はどれ？（馬車・かご・人力車・新幹線）", correct: "新幹線", wrongs: ["馬車", "かご", "人力車"], explanation: "馬車・かご・人力車は昔の交通手段ですが、新幹線は今の交通手段です。" },
    { prompt: "なかまはずれの通信手段はどれ？（手紙・のろし・伝書バト・スマートフォン）", correct: "スマートフォン", wrongs: ["手紙", "のろし", "伝書バト"], explanation: "手紙・のろし・伝書バトは昔から使われてきた通信手段ですが、スマートフォンは今の道具です。" }
  ]);

  if (questions.length !== 50) throw new Error(`city_change: expected 50, got ${questions.length}`);
  return questions;
}

const questions = [
  ...makeLocalCity(),
  ...makeLocalWork(),
  ...makeSafetyLife(),
  ...makeCityChange()
];

if (questions.length !== 260) {
  throw new Error(`Expected 260 social questions, got ${questions.length}`);
}

await mkdir(new URL("../src/data/questions/grade3/social/", import.meta.url), { recursive: true });
writeFileSync(outFile, `window.CHIBI_QUEST_SOCIAL_QUESTIONS = ${JSON.stringify(questions, null, 2)};\n`);
console.log(`Generated ${questions.length} social questions`);

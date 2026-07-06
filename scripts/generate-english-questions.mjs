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

function choices(correct, wrongs) {
  return [correct, ...wrongs].map(String).slice(0, 4).map((text, index) => ({
    id: String.fromCharCode(97 + index),
    text
  }));
}

function q(unit, index, difficulty, prompt, correct, wrongs, explanation, tags, familyId) {
  return {
    id: `g3_en_${unit}_${pad(index)}`,
    version: 1,
    grade: 3,
    subject: "english",
    unit,
    unitLabel: unitLabels[unit],
    curriculumArea: "外国語活動",
    difficulty: Math.max(2, difficulty),
    questionType: "multiple_choice",
    prompt,
    choices: choices(correct, wrongs),
    answer: {
      type: "choice",
      value: String(correct)
    },
    explanation,
    estimatedSeconds: 45,
    skillTags: tags,
    familyId,
    sourcePolicy: {
      basis: ["学習指導要領", "教科書目次"],
      usesTextbookText: false,
      originalContent: true
    },
    status: "active"
  };
}

function repeatUnit(unit, base, total, tags) {
  const contexts = [
    "",
    "友だちと話す場面です。 ",
    "教室で使うなら。 ",
    "先生に聞かれたら。 ",
    "ゲームの中で答えるなら。 ",
    "カードを見て考えよう。 ",
    "会話のつながりを考えよう。 ",
    "英語で自然に言うなら。 "
  ];
  const questions = [];
  let index = 1;
  while (questions.length < total) {
    const baseIndex = questions.length % base.length;
    const [prompt, correct, wrongs, explanation, difficulty] = base[baseIndex];
    const context = contexts[Math.floor(questions.length / base.length) % contexts.length];
    questions.push(q(unit, index++, difficulty, `${context}${prompt}`, correct, wrongs, explanation, tags, `${unit}_${baseIndex}`));
  }
  return questions;
}

function makeHello() {
  const base = [
    ["朝、友だちに会いました。合う英語はどれ？", "Good morning.", ["Good night.", "Goodbye.", "Thank you."], "朝のあいさつは Good morning. です。", 2],
    ["はじめて会う友だちに言う英語として合うものはどれ？", "Nice to meet you.", ["See you.", "I'm fine.", "How many?"], "はじめて会う時は Nice to meet you. が合います。", 3],
    ["名前を言うときに合う英語はどれ？", "I'm Yuta.", ["You're welcome.", "It's a cat.", "I like red."], "自分の名前を言う時は I'm ... を使います。", 2],
    ["別れるときに合う英語はどれ？", "See you.", ["Hello.", "Good morning.", "I'm happy."], "別れる時は See you. が自然です。", 2],
    ["相手に名前をたずねる英語はどれ？", "What's your name?", ["How many?", "What's this?", "Who are you?"], "名前をたずねる時は What's your name? です。", 3],
    ["A: Hello. B: ____ に入る返事はどれ？", "Hello.", ["Ten.", "Blue.", "A dog."], "Hello. には Hello. と返せます。", 2],
    ["A: Nice to meet you. B: ____", "Nice to meet you, too.", ["Good night.", "It's blue.", "Five pencils."], "はじめましてと言われたら too を付けて返せます。", 3],
    ["Thank you. と言われた時の返事はどれ？", "You're welcome.", ["I'm sleepy.", "I like pizza.", "It's an onion."], "ありがとうへの返事は You're welcome. です。", 3],
    ["夜、寝る前のあいさつはどれ？", "Good night.", ["Good afternoon.", "Hello.", "See you."], "寝る前は Good night. を使います。", 2],
    ["昼ごろに使いやすいあいさつはどれ？", "Good afternoon.", ["Good night.", "I'm sad.", "How many?"], "昼から午後のあいさつは Good afternoon. です。", 2]
  ];
  return repeatUnit("hello", base, 30, ["あいさつ", "会話"]);
}

function makeHowAreYou() {
  const base = [
    ["How are you? と聞かれました。元気ならどれ？", "I'm fine.", ["I'm a cat.", "It's red.", "This is for you."], "気分や体調を答える時は I'm ... を使います。", 2],
    ["眠いと答える英語はどれ？", "I'm sleepy.", ["I'm happy.", "I'm hungry.", "I'm fine."], "眠いは sleepy です。ねむい時に I'm sleepy. と言います。", 2],
    ["お腹がすいた時の答えはどれ？", "I'm hungry.", ["I'm sad.", "I'm sleepy.", "I'm great."], "お腹がすいたは hungry です。", 2],
    ["悲しい気持ちを表す英語はどれ？", "I'm sad.", ["I'm happy.", "I'm fine.", "I'm great."], "悲しいは sad です。反対に、うれしいは happy です。", 2],
    ["とても調子がよい時の答えはどれ？", "I'm great.", ["I'm tired.", "I'm sad.", "I'm a dog."], "とてもよい調子なら I'm great. が合います。", 3],
    ["A: How are you? B: I'm tired. Bの気分は？", "つかれている", ["うれしい", "お腹がすいた", "元気いっぱい"], "tired はつかれているという意味です。", 3],
    ["相手の調子をたずねる英語はどれ？", "How are you?", ["How many?", "What's this?", "I like blue."], "調子をたずねる時は How are you? です。", 2],
    ["A: I'm happy. に近い意味はどれ？", "うれしい", ["ねむい", "かなしい", "つかれた"], "happy はうれしいという意味です。", 2],
    ["How are you? の自然な返事ではないものはどれ？", "It's a pencil.", ["I'm fine.", "I'm sleepy.", "I'm hungry."], "It's a pencil. は物を説明する文です。", 3],
    ["A: How are you? B: ____. 「少しつかれた」と言いたい時は？", "I'm tired.", ["I'm a book.", "I like cats.", "This is red."], "つかれたは tired です。つかれた時に I'm tired. と言います。", 3]
  ];
  return repeatUnit("how_are_you", base, 30, ["気分", "体調", "会話"]);
}

function makeHowMany() {
  const base = [
    ["How many apples? と聞かれて、りんごが7こあります。答えはどれ？", "Seven.", ["Seventeen.", "Three.", "Red."], "数を答える時は Seven. のように数で答えます。", 2],
    ["How many pencils? えんぴつが12本ならどれ？", "Twelve.", ["Two.", "Twenty.", "Yellow."], "12は twelve です。eleven の次の数です。", 3],
    ["数をたずねる英語はどれ？", "How many?", ["How are you?", "What's this?", "I like blue."], "数をたずねる時は How many? を使います。", 2],
    ["nine の意味はどれ？", "9", ["5", "7", "19"], "nine は9です。eight の次、ten の前の数です。", 2],
    ["fifteen の意味はどれ？", "15", ["5", "50", "13"], "fifteen は15です。14の次の数です。", 3],
    ["20を表す英語はどれ？", "twenty", ["twelve", "two", "ten"], "20は twenty です。10が2つ分で twenty です。", 3],
    ["A: How many books? B: ____. 本が3さつなら？", "Three.", ["This is a book.", "I'm fine.", "I like books."], "数を聞かれたら、One や Two のように数で答えます。", 2],
    ["eleven, twelve, ____。次に来る数は？", "thirteen", ["three", "twenty", "ten"], "11, 12, 13 は eleven, twelve, thirteen です。", 3],
    ["five と fifteen のちがいとして正しいものはどれ？", "fiveは5、fifteenは15", ["どちらも5", "fiveは15、fifteenは50", "どちらも50"], "teen が付く数（13〜19）は、十の位がある数です。", 3],
    ["How many? の答えとして合わないものはどれ？", "I'm happy.", ["One.", "Eight.", "Ten."], "How many? は数を聞いています。", 3]
  ];
  return repeatUnit("how_many", base, 30, ["数", "How many"]);
}

function makeILikeBlue() {
  const base = [
    ["青が好きと言う英語はどれ？", "I like blue.", ["I like red.", "I am blue.", "This is blue."], "好きな色を言う時は I like ... を使います。", 2],
    ["赤が好きと言う英語はどれ？", "I like red.", ["I like blue.", "I like yellow.", "I'm red."], "赤は red です。トマトや いちごの 色です。", 2],
    ["I like yellow. の意味はどれ？", "黄色が好きです。", ["青が好きです。", "黄色です。", "黄色はいくつですか。"], "I like ... は ... が好きです、という意味です。", 2],
    ["緑が好きならどれ？", "I like green.", ["I like black.", "I like white.", "I like pink."], "緑は green です。葉っぱや 草の 色です。", 2],
    ["I like black. の black は何色？", "黒", ["白", "茶色", "紫"], "black は黒です。反対に、白は white です。", 2],
    ["白が好きと言う英語はどれ？", "I like white.", ["I like black.", "I like brown.", "I like orange."], "白は white です。反対に、黒は black です。", 2],
    ["I like purple. に近い意味はどれ？", "紫が好きです。", ["紫はいりません。", "私は紫です。", "紫は何ですか。"], "purple は紫です。赤と青を まぜた 色です。", 3],
    ["好きなものを言う形として正しいものはどれ？", "I like soccer.", ["I soccer like.", "Like I soccer.", "Soccer I."], "I like ... の順で言います。", 3],
    ["A: I like blue. B: Me, too. Bの意味に近いものは？", "私もです。", ["私はちがいます。", "それは何ですか。", "いくつありますか。"], "Me, too. は私もです、という返事です。", 3],
    ["I like blue. の返事として自然なものはどれ？", "Me, too.", ["Good night.", "Seven.", "It's an onion."], "同じなら Me, too. と返せます。", 3]
  ];
  return repeatUnit("i_like_blue", base, 30, ["色", "好きなもの"]);
}

function makeWhatDoYouLike() {
  const base = [
    ["What do you like? の意味はどれ？", "何が好きですか。", ["何個ありますか。", "これは何ですか。", "元気ですか。"], "What do you like? は、好きなものをたずねる表現です。", 2],
    ["What do you like? と聞かれて、ピザが好きならどれ？", "I like pizza.", ["It's pizza.", "I'm pizza.", "How many pizza?"], "好きなものは I like ... で答えます。", 2],
    ["サッカーが好きと答える英語はどれ？", "I like soccer.", ["I like blue.", "I am soccer.", "This is soccer."], "スポーツも I like ... で言えます。", 2],
    ["犬が好きならどれ？", "I like dogs.", ["I like cats.", "I am a dog.", "What's dogs?"], "犬が好きなら I like dogs. が自然です。", 3],
    ["相手に好きなものをたずねる英語はどれ？", "What do you like?", ["How are you?", "Who are you?", "This is for you."], "What do you like? は、好きなものをたずねる時の表現です。", 2],
    ["A: What do you like? B: I like cats. Bが好きなものは？", "ねこ", ["犬", "色", "数"], "cats はねこです。1ぴきなら cat、たくさんなら cats です。", 2],
    ["I like apples. に合う日本語はどれ？", "りんごが好きです。", ["りんごはいくつですか。", "これはりんごです。", "りんごをあげます。"], "I like apples. はりんごが好きです。", 2],
    ["What do you like? の答えとして合わないものはどれ？", "I'm sleepy.", ["I like sushi.", "I like baseball.", "I like cats."], "I'm sleepy. は気分の答えです。", 3],
    ["A: I like pizza. B: I like pizza, too. Bはどういう意味？", "Bもピザが好き", ["Bはピザがきらい", "Bは眠い", "Bは数を聞いている"], "too は「も」という意味で使えます。", 3],
    ["好きなものを2つ言う文として自然なものはどれ？", "I like dogs and cats.", ["I like dogs many cats.", "Dogs cats I like.", "How dogs and cats?"], "and で「〜と〜」のように2つのものをつなげます。", 3]
  ];
  return repeatUnit("what_do_you_like", base, 30, ["好きなもの", "質問"]);
}

function makeAlphabet() {
  const base = [
    ["大文字 A の小文字はどれ？", "a", ["b", "d", "e"], "A の小文字は a です。大文字と小文字をセットでおぼえましょう。", 2],
    ["大文字 B の小文字はどれ？", "b", ["d", "p", "q"], "B の小文字は b です。大文字と小文字をセットでおぼえましょう。", 2],
    ["cat の最初の文字はどれ？", "c", ["k", "s", "t"], "cat は c で始まります。最初の音から文字を考えます。", 2],
    ["dog の最初の文字はどれ？", "d", ["b", "g", "p"], "dog は d で始まります。最初の音から文字を考えます。", 2],
    ["A, B, C, ____。次に来る文字は？", "D", ["E", "G", "P"], "A, B, C の次は D です。アルファベットは26文字あります。", 2],
    ["M の次の文字はどれ？", "N", ["L", "O", "W"], "M の次は N です。アルファベットの順をおぼえましょう。", 3],
    ["小文字 p と形がまぎらわしい文字はどれ？", "q", ["a", "m", "t"], "p と q は向きが似ているので注意します。", 3],
    ["apple の最初の音に合う文字はどれ？", "A", ["B", "C", "D"], "apple は A/a で始まります。", 2],
    ["book の最初の音に合う文字はどれ？", "B", ["D", "P", "Q"], "book は B/b で始まります。", 2],
    ["大文字と小文字の組み合わせが正しいものはどれ？", "G - g", ["G - q", "G - p", "G - j"], "G の小文字は g です。大文字と小文字で形がちがいます。", 3]
  ];
  return repeatUnit("alphabet", base, 30, ["アルファベット", "文字"]);
}

function makeThisIsForYou() {
  const base = [
    ["カードをわたす時に合う英語はどれ？", "This is for you.", ["How many?", "I'm sleepy.", "What's this?"], "相手にものを渡す時に This is for you. と言えます。", 2],
    ["This is for you. の意味はどれ？", "これはあなたへのものです。", ["これは何ですか。", "私は元気です。", "何が好きですか。"], "for you は「あなたへ」という意味です。", 2],
    ["プレゼントをもらった時の返事はどれ？", "Thank you.", ["How many?", "I'm sad.", "It's a dog."], "もらったら Thank you. と言えます。", 2],
    ["Thank you. と言われた時の返事はどれ？", "You're welcome.", ["I'm hungry.", "What do you like?", "Twelve."], "Thank you.（ありがとう）への返事です。", 3],
    ["A: This is for you. B: ____", "Thank you.", ["Good night.", "How many?", "I'm a cat."], "ものをもらったら Thank you. が自然です。", 2],
    ["相手にカードを作ったことを伝える場面で合うものはどれ？", "This is for you.", ["Who are you?", "How are you?", "I like blue."], "This is for you. は、相手にものを渡す時の表現です。", 2],
    ["for you の意味に近いものはどれ？", "あなたへ", ["私から私へ", "いくつ", "これは何"], "for you はあなたへ、という意味です。", 3],
    ["This is for you. と言う場面として合うものはどれ？", "友だちにカードをわたす", ["数を数える", "眠いと答える", "名前を聞く"], "カードやプレゼントを渡す時に使えます。", 3],
    ["A: Thank you. B: You're welcome. この会話の流れは？", "お礼と返事", ["数の質問", "好きな色", "動物の名前"], "Thank you. と You're welcome. はお礼の会話です。", 3],
    ["カードに書く短い英語として自然なものはどれ？", "For you.", ["How many you.", "Sleepy you.", "Many this."], "カードでは For you. と短く書くことがあります。", 3]
  ];
  return repeatUnit("this_is_for_you", base, 30, ["贈り物", "お礼"]);
}

function makeWhatsThis() {
  const base = [
    ["What's this? の意味はどれ？", "これは何ですか。", ["何が好きですか。", "何個ありますか。", "元気ですか。"], "What's this? は、物の名前をたずねる表現です。", 2],
    ["A: What's this? B: It's an onion. これは何？", "玉ねぎ", ["にんじん", "ねこ", "本"], "onion は玉ねぎです。母音で始まるので an onion と言います。", 3],
    ["A: What's this? B: It's a pencil. これは何？", "えんぴつ", ["消しゴム", "犬", "りんご"], "pencil はえんぴつです。It's a pencil. のように答えます。", 2],
    ["物の名前を答える文として正しいものはどれ？", "It's a book.", ["I'm a book.", "How book?", "I like book?"], "物を説明する時は It's a ... を使えます。", 3],
    ["apple の前につける言葉として自然なのはどれ？", "an", ["a", "the many", "am"], "母音で始まる apple には an を使います。", 3],
    ["book の前につける言葉として自然なのはどれ？", "a", ["an", "am", "are"], "子音で始まる book には a を使います。", 3],
    ["What's this? の答えとして合うものはどれ？", "It's a cat.", ["I'm fine.", "Seven.", "I like red."], "これは何かを聞かれているので It's a ... で答えます。", 2],
    ["It's an egg. の意味はどれ？", "それは卵です。", ["それは犬です。", "私は卵が好きです。", "卵はいくつですか。"], "egg は卵です。母音で始まるので an egg と言います。", 3],
    ["A: What's this? B: ____ 「それは海月です」と答えるなら？", "It's a jellyfish.", ["I'm jellyfish.", "I like jellyfish.", "How many jellyfish?"], "物の名前は It's a ... で答えます。", 3],
    ["What's this? と What do you like? の違いはどれ？", "前者は物の名前、後者は好きなものを聞く", ["どちらも数を聞く", "どちらも気分を聞く", "どちらも別れのあいさつ"], "what の後の言葉で聞いていることが変わります。", 3]
  ];
  return repeatUnit("whats_this", base, 25, ["身近なもの", "What's this"]);
}

function makeWhoAreYou() {
  const base = [
    ["Who are you? の意味はどれ？", "あなたはだれですか。", ["これは何ですか。", "何個ありますか。", "何が好きですか。"], "who は「だれ」という意味で、人や正体をたずねます。", 2],
    ["A: Who are you? B: I'm a cat. Bは何？", "ねこ", ["犬", "鳥", "魚"], "cat はねこです。I'm a cat. でねこになりきって言えます。", 2],
    ["犬になりきって答えるならどれ？", "I'm a dog.", ["It's a dog.", "I like dog.", "How many dogs?"], "自分が何かを言う時は I'm a ... です。", 3],
    ["Who are you? の答えとして合うものはどれ？", "I'm a rabbit.", ["It's an onion.", "Ten.", "I like blue."], "だれかを聞かれているので I'm a ... が合います。", 2],
    ["I'm a bird. の意味はどれ？", "私は鳥です。", ["これは鳥です。", "鳥が好きです。", "鳥はいくつですか。"], "I'm a ... は私は...です、という意味です。", 2],
    ["Who と What の違いとして正しいものはどれ？", "Whoはだれ、Whatは何", ["どちらも数", "どちらも色", "どちらも気分"], "Who は人や役、What は物を聞く時に使います。", 3],
    ["A: Who are you? B: I'm a tiger. Bは何になりきっている？", "トラ", ["ねこ", "犬", "うさぎ"], "tiger はトラです。I'm a tiger. でトラになりきって言えます。", 3],
    ["自分の役を言う文として自然なものはどれ？", "I'm a teacher.", ["It's a teacher.", "How teacher?", "Teacher many."], "自分が何者かを言う時は I'm a ... です。", 3],
    ["Who are you? と聞く場面として合うものはどれ？", "相手の役や正体をたずねる", ["数を数える", "色を答える", "カードを渡す"], "Who are you? は相手がだれかをたずねます。", 3],
    ["I'm a mouse. の mouse はどれ？", "ねずみ", ["ねこ", "馬", "鳥"], "mouse はねずみです。小さな動物の名前です。", 3]
  ];
  return repeatUnit("who_are_you", base, 25, ["人物", "動物", "Who are you"]);
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

for (const question of questions) {
  const texts = question.choices.map((choice) => choice.text);
  if (texts.length !== 4 || new Set(texts).size !== 4 || !texts.includes(question.answer.value)) {
    throw new Error(`Invalid choices: ${question.id}`);
  }
}

await mkdir(new URL("../src/data/questions/grade3/english/", import.meta.url), { recursive: true });
writeFileSync(outFile, `window.CHIBI_QUEST_ENGLISH_QUESTIONS = ${JSON.stringify(questions, null, 2)};\n`);
console.log(`Generated ${questions.length} English questions`);

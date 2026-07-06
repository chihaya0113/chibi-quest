global.window = {};

await import("../src/data/questions/grade3/math/questions.js");
await import("../src/data/questions/grade3/japanese/questions.js");
await import("../src/data/questions/grade3/social/questions.js");
await import("../src/data/questions/grade3/english/questions.js");
await import("../src/data/questions/grade3/science/questions.js");

const questionSets = [
  window.CHIBI_QUEST_QUESTIONS,
  window.CHIBI_QUEST_JAPANESE_QUESTIONS,
  window.CHIBI_QUEST_SOCIAL_QUESTIONS,
  window.CHIBI_QUEST_ENGLISH_QUESTIONS,
  window.CHIBI_QUEST_SCIENCE_QUESTIONS
];

// A prompt appearing more than this many times (exact same text) is flagged as a
// real repetition problem. A pool the app draws 10-at-a-time can tolerate a few
// repeats, but seeing the identical question wording many times feels templated.
const EXACT_DUPLICATE_THRESHOLD = 3;
// A drill shape (same wording, different numbers — e.g. "7 × 8" vs "3 × 4") is
// listed for information only once it reaches this many questions. It is NOT a
// warning: repeated practice of the same skill with different numbers is the point
// of arithmetic drills.
const DRILL_SHAPE_MIN = 5;

const questions = questionSets.flat();
const failures = [];
const warnings = [];

const requiredFields = [
  "id",
  "grade",
  "subject",
  "unit",
  "unitLabel",
  "difficulty",
  "questionType",
  "prompt",
  "answer",
  "explanation",
  "status"
];

const ids = new Set();
const exactPrompts = new Map();
const shapeGroups = new Map();
const bySubject = new Map();
const byUnit = new Map();

for (const question of questions) {
  for (const field of requiredFields) {
    if (question[field] === undefined || question[field] === "") {
      failures.push(`${question.id ?? "missing-id"}: missing ${field}`);
    }
  }

  if (ids.has(question.id)) failures.push(`${question.id}: duplicate id`);
  ids.add(question.id);

  const exactKey = `${question.subject}:${question.unit}:${question.prompt}`;
  if (!exactPrompts.has(exactKey)) exactPrompts.set(exactKey, []);
  exactPrompts.get(exactKey).push(question.id);

  const shapeKey = `${question.subject}:${question.unit}:${normalize(question.prompt)}`;
  if (!shapeGroups.has(shapeKey)) shapeGroups.set(shapeKey, { count: 0, prompts: new Set() });
  const shape = shapeGroups.get(shapeKey);
  shape.count += 1;
  shape.prompts.add(question.prompt);

  bySubject.set(question.subject, (bySubject.get(question.subject) ?? 0) + 1);
  byUnit.set(`${question.subject}:${question.unit}`, (byUnit.get(`${question.subject}:${question.unit}`) ?? 0) + 1);

  if (![2, 3].includes(question.difficulty)) {
    warnings.push(`${question.id}: difficulty should usually be 2 or 3`);
  }

  if (String(question.explanation).length < 18) {
    warnings.push(`${question.id}: explanation may be too short`);
  }

  if (question.questionType === "numeric_input") {
    if (question.answer.type !== "number") {
      failures.push(`${question.id}: numeric_input answer must be number`);
    }
  } else {
    const choiceTexts = question.choices?.map((choice) => String(choice.text)) ?? [];
    const answerText = String(question.answer.value);
    if (choiceTexts.length !== 4) failures.push(`${question.id}: expected 4 choices`);
    if (new Set(choiceTexts).size !== choiceTexts.length) failures.push(`${question.id}: duplicate choices`);
    if (!choiceTexts.includes(answerText)) failures.push(`${question.id}: answer not in choices`);
    if (choiceTexts.some((text) => text.length > 42)) {
      warnings.push(`${question.id}: long choice text may be hard to scan`);
    }
  }
}

for (const [subject, count] of bySubject.entries()) {
  if (count !== 260) failures.push(`${subject}: expected 260 questions, got ${count}`);
}

// Exact-duplicate prompts (identical wording) beyond the tolerated threshold — a real
// "same question over and over" problem.
const exactDuplicates = [...exactPrompts.entries()]
  .filter(([, dupIds]) => dupIds.length > EXACT_DUPLICATE_THRESHOLD)
  .sort((a, b) => b[1].length - a[1].length);

// Drill shapes: same shape, but the actual prompts differ (numbers change). Informational.
const drillShapes = [...shapeGroups.entries()]
  .filter(([, shape]) => shape.count >= DRILL_SHAPE_MIN && shape.prompts.size > 1)
  .sort((a, b) => b[1].count - a[1].count);

const totalWarnings = warnings.length + exactDuplicates.length;

console.log("Question audit");
console.log("total", questions.length);
console.log("subjects", Object.fromEntries([...bySubject.entries()].sort()));
console.log("units", byUnit.size);
console.log("failures", failures.length);
console.log("warnings", totalWarnings);
console.log("exactDuplicatePrompts", exactDuplicates.length);
console.log("drillShapes (informational)", drillShapes.length);

if (warnings.length > 0) {
  console.log("\nWarnings");
  for (const warning of warnings.slice(0, 40)) console.log("-", warning);
  if (warnings.length > 40) console.log(`...and ${warnings.length - 40} more`);
}

if (exactDuplicates.length > 0) {
  console.log(`\nExact-duplicate prompts (same wording > ${EXACT_DUPLICATE_THRESHOLD}x)`);
  for (const [key, dupIds] of exactDuplicates.slice(0, 20)) {
    console.log("-", key, `(${dupIds.length} questions)`);
  }
  if (exactDuplicates.length > 20) console.log(`...and ${exactDuplicates.length - 20} more`);
}

if (drillShapes.length > 0) {
  console.log("\nDrill patterns (same shape, different numbers — informational, not warnings)");
  for (const [key, shape] of drillShapes.slice(0, 20)) {
    console.log("-", key, `(${shape.count} questions, ${shape.prompts.size} variations)`);
  }
  if (drillShapes.length > 20) console.log(`...and ${drillShapes.length - 20} more`);
}

if (failures.length > 0) {
  console.log("\nFailures");
  for (const failure of failures) console.log("-", failure);
  process.exit(1);
}

function normalize(value) {
  return String(value)
    .replace(/[0-9０-９]+/g, "N")
    .replace(/\s+/g, " ")
    .trim();
}

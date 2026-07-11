# 問題データのメタデータ仕様

既存実装(src/data/questions/grade3/*/questions.js、window.CHIBI_QUEST_QUESTIONS 配列)が正本。ここでは既存フィールドの意味と、chibique-question-design-core で追加するフィールドを定義する。既存フィールドの型・名前を変える変更は save-data-compat と同等の慎重さで扱い、必ず先にユーザーへ提案する。

## 既存フィールド(変更しない)

| フィールド | 型 | 内容 |
|---|---|---|
| id | string | `g3_{subject}_{unit}_{連番3桁}` 形式。既存IDは刷新後も再利用しない(answerHistoryが参照するため、刷新時は新しい連番帯を使うか status で無効化) |
| version | number | 問題の改訂番号。文言修正で+1 |
| grade | number | 3 |
| subject | string | math / japanese / social / english / science |
| unit | string | 単元ID(src/curriculum.js と一致させる) |
| unitLabel | string | 子供向け単元名 |
| curriculumArea | string | 学習指導要領の領域名 |
| difficulty | number | 総合難易度1〜5(SKILL.md §2の算出式で決める) |
| questionType | string | numeric_input / multiple_choice / expression_choice |
| prompt | string | 問題文(kids-content 表記ルール準拠) |
| choices | string[] | 4択の選択肢。numeric_input は空配列 |
| answer | object | `{ type, value, unit }` |
| explanation | string | 解説。「なぜそうなるか」を含める |
| estimatedSeconds | number | 想定解答時間(drill: 30〜45 / 文章題: 60〜90 / 推理・比較系: 90〜120 を目安) |
| skillTags | string[] | 検索用タグ |
| sourcePolicy | object | 出典ポリシー(basis / usesTextbookText / originalContent) |
| status | string | active / retired。刷新で置き換えた旧問題は削除せず retired にする |
| familyId | string | 同型ドリルのグループID(現状は英・社・理のみ。**全教科必須化する**) |

## 追加フィールド(このSkillで必須化)

| フィールド | 型 | 内容 |
|---|---|---|
| learningObjective | string | 設計シート§1-3「測る能力」を1文で。例「わり算を分ける場面と結びつけて式を立てられる」 |
| difficultyAxes | object | 5軸の内訳 `{ knowledge, info, steps, format, choices }` 各1〜3。合計とdifficultyの対応はSKILL.md §2 |
| funMechanic | string | SKILL.md §4のカタログの値(predict_check / find_mistake / best_choice / inference / reorder / rule_discovery / compare_methods / judge_claim / decide_then_verify / drill) |
| commonMistake | string | この問題で子供がしがちな間違いと理由を1文で。誤答選択肢の設計根拠になる |

## 追加フィールド(推奨・アプリ実装とセットで)

| フィールド | 型 | 内容 |
|---|---|---|
| hint | string | 答えを直接言わない1文ヒント。表示UIが未実装なので、付与する場合はUI実装を提案してから |
| prerequisite | string[] | 前提となる単元ID。つまずき分析用(現状アプリでは未使用) |

## audit との整合

- フィールドを必須化したら scripts/audit-questions.mjs に「全問題に該当フィールドが存在し、funMechanic がカタログ内の値であること」「difficultyAxes の合計と difficulty の対応が§2の表と一致すること」の検証を追加する。
- 単元ごとの分布チェック(drill 4割以下、funMechanic 3種以上、difficulty分布、サッカー文脈3割以下)も audit に入れると大量生成時の品質確認が自動化できる。サッカー文脈は `skillTags` に `soccer_context` タグを付けて判定する。

## 将来の難易度調整に使う実績データ(参考)

正答率だけに依存しないため、answerHistory(src/storage.js)側で将来取得しうる指標: 正答/誤答、解答時間、同一familyIdでの連続正解、同単元・別formatでの正答、解き直し時の正答。ほぼ満点の子への調整は「difficultyを上げる」より先に「funMechanic と形式の慣れ軸を変えた別形式で同じ learningObjective を問う」ことを試す。

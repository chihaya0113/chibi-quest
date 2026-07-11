# ちびクエ

## プロダクト概要

- 小学3年生向けの家庭内学習アプリ(PWA、完全オフライン対応)
- Phase1: 算数・国語・社会・英語・理科。固定問題DB(各260問)、1回10問、経験値・レベル制
- ゲーミフィケーション: サッカー選手カード収集(src/data/soccer/players.js)、CPUリーグ
- 実行時AIなし。ビルド工程なし(素のJS)。利用者は自分の子供とその端末

## コマンド

- 起動: `npm run serve` → http://localhost:5173
- 問題生成: `npm run generate:questions`(scripts/generate-*.mjs が正。出力ファイルを直接編集しない)
- 問題検証: `npm run audit:questions`(問題データ変更後は必須)
- test / lint / build: なし。audit:questions と手動動作確認で代替する(safe-coding §4 の報告では「audit + 手動確認で代替」と書く)

## 重要な構造

- セーブデータ: localStorage `chibiQuestState:v1`(src/storage.js、migrationVersion方式)
- Service Worker: sw.js(更新時は CACHE_VERSION と `?v=` を必ず上げる)
- 問題データ: src/data/questions/grade3

## プロジェクトSkill(必ず該当場面で使う)

- chibique-question-design-core: 問題の新規作成・刷新・難易度調整・類題作成・レビュー(設計シート、難易度5軸、funMechanic)
- kids-content: 問題・子供向け文言の追加修正(表記ルール、audit必須)
- save-data-compat: セーブデータ構造・XP・カードプールの変更(進捗を壊さない)
- release-pwa: JS・データ変更のpush前(キャッシュバージョン更新)

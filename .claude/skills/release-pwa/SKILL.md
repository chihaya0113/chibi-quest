---
name: release-pwa
description: ちびクエのJS・CSS・データファイルの変更を公開するとき(commit/push前)に必ず使うリリース手順。Service Worker のキャッシュバージョン更新、オフライン動作、旧セーブでの起動確認を定める。忘れると「更新したのに子供の端末に反映されない」事故が起きる。
---

# release-pwa — 反映とキャッシュ更新

適用: JS・CSS・データファイル(問題・選手データ含む)を変更してpushする前。auto-commit-push の手順4(commit)の前に行う。README等のドキュメントのみの変更では不要。

## 手順

1. `sw.js` の `CACHE_VERSION` の数字を+1する(例: `chibi-quest-v21` → `chibi-quest-v22`)。
2. リポジトリ内を `?v=` で grep し、すべての箇所(sw.js の PRECACHE、index.html の読み込みURL等)を同じ新番号に揃える。番号の食い違いは古いファイルと新しいファイルの混在を生む。
3. `npm run serve` で起動し、以下を確認する:
   - 変更内容が画面に反映されている
   - ブラウザのコンソールに Service Worker のエラーが出ていない
   - 既存セーブがある状態で正常に起動する(save-data-compat 参照)
4. 確認後、auto-commit-push の手順で commit / push する(CACHE_VERSION の更新も同じcommitに含める)。

## 禁止事項

- `CACHE_VERSION` を上げずにJS・データ変更をpushする(利用者の端末に反映されない)
- `CACHE_VERSION` と `?v=` の番号が食い違ったままpushする

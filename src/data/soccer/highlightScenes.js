// 試合ハイライト演出のプレー種別テンプレート定義。
// ここは「見た目のラベル」のみを決める宣言的データで、simulateMatch()の勝率・成否ロジックには一切関与しない。
// 起点(starter)・フィニッシュ(finisher)の選手は、実際の編成(placed)から rolePool 条件で事後的に選ばれる。

// attackingSide:"player"（自チーム攻撃）のときにのみ使う、起点プレーの種別プール。
// assist:true の種別だけ「起点の選手」と「決めた選手」が別人になりうる（クロス/スルーパス/コーナー）。
// それ以外（ドリブル・ミドル・カウンター・FK・PK）は同じ選手が持ち込んで決める1人プレーとして見せる。
export const START_TYPES = {
  side_cross: {
    weight: 3,
    assist: true,
    label: "クロス",
    starter: { slotPos: ["DF", "MF"], wide: true }
  },
  through_pass: {
    weight: 2,
    assist: true,
    label: "スルーパス",
    starter: { slotPos: ["MF"] }
  },
  dribble: {
    weight: 2,
    assist: false,
    label: "ドリブル突破",
    starter: { slotPos: ["FW", "MF"], statBias: "dribble" }
  },
  mid_shot: {
    weight: 2,
    assist: false,
    label: "ミドルシュート",
    starter: { slotPos: ["MF", "FW"] }
  },
  corner: {
    weight: 1,
    assist: true,
    label: "コーナーキック",
    starter: { slotPos: ["MF"] }
  },
  counter: {
    weight: 1,
    assist: false,
    label: "カウンター",
    starter: { slotPos: ["FW"], statBias: "speed" },
    tacticBoost: { attack: "counter", multiplier: 2 }
  },
  direct_fk: {
    weight: 0.4,
    assist: false,
    label: "直接FK",
    starter: { slotPos: ["MF", "FW"] }
  },
  pk: {
    weight: 0.15,
    assist: false,
    label: "PK",
    starter: { slotPos: ["FW", "MF"] }
  }
};

// outcome(simulateMatch側で確定済み)ごとの演出アートキー。画像は将来の差し替え用にキー名だけ先に決めておく。
export const OUTCOME_ART = {
  goal: "goal_net",
  save: "gk_save",
  block: "df_block",
  clear: "df_clear",
  wide: "shot_wide",
  post: "post_hit",
  crossbar: "crossbar_hit",
  intercept: "pass_cut",
  tackle: "tackle_stop"
};

// レア演出。goal確定ラインの直前にだけ「一度弾かれた」前置きコマを差し込む（結果は変えない）。
export const RARE_SEQUENCES = {
  rebound_goal: {
    triggerOn: { outcome: "goal", attackingSide: "player" },
    chance: 0.12
  }
};

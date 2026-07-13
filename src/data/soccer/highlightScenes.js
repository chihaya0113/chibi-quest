// 試合ハイライト演出のプレー種別テンプレート定義。
// ここは「見た目のラベル」のみを決める宣言的データで、simulateMatch()の勝率・成否ロジックには一切関与しない。
// 起点(starter)・フィニッシュ(finisher)の選手は、実際の編成(placed)から rolePool 条件で事後的に選ばれる。

// attackingSide:"player"（自チーム攻撃）のときにのみ使う、起点プレーの種別プール。
export const START_TYPES = {
  side_cross: {
    weight: 3,
    starter: { slotPos: ["DF", "MF"], wide: true },
    finisher: { slotPos: ["FW"] }
  },
  through_pass: {
    weight: 2,
    starter: { slotPos: ["MF"] },
    finisher: { slotPos: ["FW"] }
  },
  dribble: {
    weight: 2,
    starter: { slotPos: ["FW", "MF"], statBias: "dribble" }
  },
  mid_shot: {
    weight: 2,
    starter: { slotPos: ["MF", "FW"] }
  },
  corner: {
    weight: 1,
    starter: { slotPos: ["MF"] },
    finisher: { slotPos: ["FW", "DF"] }
  },
  counter: {
    weight: 1,
    starter: { slotPos: ["FW"], statBias: "speed" },
    tacticBoost: { attack: "counter", multiplier: 2 }
  },
  direct_fk: {
    weight: 0.4,
    starter: { slotPos: ["MF", "FW"] }
  },
  pk: {
    weight: 0.15,
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

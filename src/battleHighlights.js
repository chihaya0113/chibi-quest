// 試合ハイライト演出のデータ層（Phase 1: ロジックのみ、UIには未接続）。
// simulateMatch()が確定した lines（attackingSide/outcome付き）から、
// 1試合2〜3件のハイライトを選び、演出用のsequence/captionを組み立てる純粋関数群。
// ここでの選択・演出組み立ては、得点数やoutcomeなど既存の試合結果を一切変更しない。

import { START_TYPES, OUTCOME_ART, RARE_SEQUENCES } from "./data/soccer/highlightScenes.js?v=39";

const MAX_HIGHLIGHTS = 3;

function weightedPick(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return entries[0]?.item ?? null;
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }
  return entries[entries.length - 1]?.item ?? null;
}

// lines（simulateMatchの返り値）から2〜3件を選ぶ。得点(outcome:"goal")は必ず含める。
// 上限を超えたぶんは時系列で後ろのものから省略される（スコアボードのみ更新の対象になる）。
export function selectHighlights(lines) {
  const indexed = lines.map((line, index) => ({ line, index }));
  const goals = indexed.filter(({ line }) => line.outcome === "goal");
  const rest = indexed.filter(({ line }) => line.outcome === "save" || line.outcome === "tackle");

  const selected = [...goals];
  for (const entry of rest) {
    if (selected.length >= MAX_HIGHLIGHTS) break;
    selected.push(entry);
  }

  return selected
    .sort((a, b) => a.index - b.index)
    .slice(0, MAX_HIGHLIGHTS);
}

function pickFromRolePool(myPlaced, rolePool, excludeIds = []) {
  if (!rolePool) return null;
  let candidates = myPlaced.filter(
    (entry) => rolePool.slotPos.includes(entry.slotPos) && !excludeIds.includes(entry.player.id)
  );
  if (rolePool.wide) {
    const wideCandidates = candidates.filter((entry) => entry.wide);
    if (wideCandidates.length > 0) candidates = wideCandidates;
  }
  if (candidates.length === 0) {
    candidates = myPlaced.filter((entry) => !excludeIds.includes(entry.player.id));
  }
  if (candidates.length === 0) return null;

  if (rolePool.statBias) {
    const weighted = candidates.map((entry) => ({
      item: entry,
      weight: Math.max(1, entry.player.stats[rolePool.statBias] ?? 1)
    }));
    return weightedPick(weighted);
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function pickStartType(myTactics) {
  const entries = Object.entries(START_TYPES).map(([id, def]) => {
    const boost = def.tacticBoost && myTactics.attack === def.tacticBoost.attack ? def.tacticBoost.multiplier : 1;
    return { item: id, weight: def.weight * boost };
  });
  return weightedPick(entries);
}

function findPlacedById(myPlaced, playerId) {
  if (!playerId) return null;
  return myPlaced.find((entry) => entry.player.id === playerId) ?? null;
}

// selectHighlights()で選ばれたlineごとに、演出用のsequence/captionの元データを組み立てる。
// line.outcome / line.attackingSide / line.actor（=既に確定した得点者・GK・DF）は一切上書きしない。
export function buildHighlightScenes(selectedLines, myPlaced, myTactics, cpu) {
  return selectedLines.map(({ line, index }) => {
    const side = Math.random() < 0.5 ? "left" : "right";
    const key = `${line.attackingSide}:${line.outcome}`;
    const sequence = [];
    let startTypeId = null;

    switch (key) {
      case "player:goal":
      case "player:save": {
        startTypeId = pickStartType(myTactics);
        const startType = START_TYPES[startTypeId];
        const scorerEntry = findPlacedById(myPlaced, line.actor);
        if (startType.assist) {
          // クロス/スルーパス/コーナー: 起点の選手（別人）→決めた選手、の2人プレー
          const starterEntry = pickFromRolePool(myPlaced, startType.starter, scorerEntry ? [scorerEntry.player.id] : []);
          if (starterEntry) {
            sequence.push({ action: "start", role: "primaryAttacker", playerId: starterEntry.player.id, startType: startTypeId });
          }
        } else {
          // ドリブル/ミドル/カウンター/FK/PK: 同じ選手が持ち込んで決める1人プレー
          sequence.push({ action: "windup", role: "shooter", playerId: scorerEntry?.player.id ?? null, startType: startTypeId });
        }
        sequence.push({
          action: "finish",
          role: "shooter",
          playerId: scorerEntry?.player.id ?? null
        });
        break;
      }
      case "player:tackle": {
        sequence.push({ action: "stopped", role: "primaryAttacker", playerId: line.actor ?? null });
        break;
      }
      case "cpu:goal": {
        sequence.push({ action: "cpu_attack", role: "cpuAttacker", playerId: null });
        sequence.push({ action: "concede", role: "concede", playerId: null });
        break;
      }
      case "cpu:save": {
        sequence.push({ action: "cpu_attack", role: "cpuAttacker", playerId: null });
        sequence.push({ action: "save", role: "goalkeeper", playerId: line.actor ?? null });
        break;
      }
      case "cpu:tackle": {
        sequence.push({ action: "cpu_attack", role: "cpuAttacker", playerId: null });
        sequence.push({ action: "tackle", role: "defender", playerId: line.actor ?? null });
        break;
      }
      default: {
        sequence.push({ action: "unknown", role: null, playerId: line.actor ?? null });
      }
    }

    // レア演出: 自チームゴール確定時のみ、低確率で「一度弾かれた」前置きコマを差し込む。
    // outcomeは既にgoalで確定しているため、この分岐は見せ方を増やすだけで結果は変えない。
    const rare = RARE_SEQUENCES.rebound_goal;
    if (
      rare &&
      line.outcome === rare.triggerOn.outcome &&
      line.attackingSide === rare.triggerOn.attackingSide &&
      Math.random() < rare.chance
    ) {
      const scorerId = sequence.find((step) => step.role === "shooter")?.playerId ?? null;
      const reboundEntry = pickFromRolePool(
        myPlaced,
        { slotPos: ["FW", "MF"] },
        scorerId ? [scorerId] : []
      );
      sequence.unshift(
        { action: "parry", role: "goalkeeper", playerId: null },
        { action: "rebound", role: "reboundShooter", playerId: reboundEntry?.player.id ?? null }
      );
    }

    return {
      lineIndex: index,
      startType: startTypeId,
      attackingSide: line.attackingSide,
      side,
      outcome: line.outcome,
      art: OUTCOME_ART[line.outcome] ?? null,
      sequence,
      text: line.text
    };
  });
}

import { Battle, PlayerBattler } from "../battle";
import { Config } from "../config";
import type { GameState, Player } from "../gameState";
import { PlayerAttrChanger } from "../indicator";
import { Log, LogUtil } from "../log";

// 相席イベント
export function* generateSharingPositionEvent(
  g: GameState,
  currentPlayer: Player
): Generator<Log> {
  const others = g.players.filter(
    (p) => p !== currentPlayer && p.position === currentPlayer.position
  );
  if (others.length === 0) {
    return;
  }

  yield Log.newSection();
  const otherNames = others.map((p) => p.name).join("と");
  yield Log.description(`マスには${otherNames}がいた。`);
  switch (currentPlayer.personality) {
    case "gentle":
      yield* generateSharingPositionGentle(g, currentPlayer, others);
      break;
    case "violent":
      yield* generateSharingPositionViolent(g, currentPlayer, others);
      break;
    case "phobic":
      yield* generateSharingPositionPhobic(g, currentPlayer);
      break;
    case "smart":
      yield* generateSharingPositionSmart(g, currentPlayer, others);
      break;
  }
}

// 来た人から逃げる
function* generatePhobicEscape(
  phobic: Player,
  coming: Player
): Generator<Log, { escaped: boolean }> {
  if (phobic.position !== Config.goalPosition) {
    yield Log.description(
      `${phobic.name}は${coming.name}を嫌がって1マス進んだ。`,
      "negative"
    );
    yield Log.dialog("近い！");
    yield* LogUtil.generatePlayerAttrChange(
      phobic,
      PlayerAttrChanger.position(phobic.position + 1),
      "positive"
    );
    return { escaped: true };
  } else {
    yield Log.description(
      `${phobic.name}は${coming.name}を避けようとしたが、これ以上進めなかった。`,
      "negative"
    );
    return { escaped: false };
  }
}

function* generateSharingPositionGentle(
  _g: GameState,
  player: Player,
  others: Player[]
) {
  for (const other of others) {
    if (other.personality === "phobic") {
      const { escaped } = yield* generatePhobicEscape(other, player);
      if (escaped) {
        continue;
      }
    }
    yield Log.description(`${player.name}は${other.name}に挨拶した。`);
    yield Log.dialog(`こんにちは！`);
    switch (other.personality) {
      case "gentle":
        yield Log.dialog(`やあ`);
        break;
      case "violent":
        yield Log.dialog(`おう`);
        break;
      case "phobic":
        yield Log.dialog(`こ、こんにちは……`);
        break;
      case "smart":
        yield Log.dialog(`おや奇遇だね`);
        break;
    }
    yield Log.description("心が温かくなった。");
  }
}

function* generateSharingPositionViolent(
  g: GameState,
  player: Player,
  others: Player[]
) {
  for (const other of others) {
    if (other.personality === "phobic") {
      const { escaped } = yield* generatePhobicEscape(other, player);
      if (escaped) {
        continue;
      }
    }
    // 同席したやつを殴る
    yield Log.dialog("邪魔だー！");
    const playerBattler = new PlayerBattler(player);
    const otherBattler = new PlayerBattler(other);
    const attack1 = yield* Battle.generateAttack(
      g,
      playerBattler,
      otherBattler,
      { skipAttackVoice: true }
    );
    if (!attack1.knockedOut && other.personality === "violent") {
      // 反撃
      yield Log.dialog("何しやがる！");
      const attack2 = yield* Battle.generateAttack(
        g,
        otherBattler,
        playerBattler,
        { skipAttackVoice: true }
      );
      if (attack2.knockedOut) {
        // 反撃で倒されたら後続の人を殴れない
        break;
      }
    }
  }
}

function* generateSharingPositionPhobic(g: GameState, player: Player) {
  yield Log.dialog("ひっ");
  if (player.position !== Config.goalPosition) {
    yield Log.description(
      `${player.name}は先客を避けて1マス進んだ。`,
      "negative"
    );
    yield* LogUtil.generatePlayerAttrChange(
      player,
      PlayerAttrChanger.position(player.position + 1),
      "positive"
    );
  } else {
    yield Log.description(
      `${player.name}は先客を避けようとしたが、これ以上進めなかった。`
    );
    yield Log.description(
      `精神的な苦痛が${player.name}の体を蝕んだ。`,
      "negative"
    );
    const battler = new PlayerBattler(player);
    yield* Battle.generateHit(g, 10, battler);
  }
}

function* generateSharingPositionSmart(
  _g: GameState,
  player: Player,
  others: Player[]
) {
  for (const other of others) {
    if (other.personality === "phobic") {
      const { escaped } = yield* generatePhobicEscape(other, player);
      if (escaped) {
        continue;
      }
    }
    yield Log.description(`${player.name}は${other.name}に笑いかけた。`);
    yield Log.dialog(`フッ……`);
    switch (other.personality) {
      case "gentle":
        yield Log.dialog(`や、やあ`);
        break;
      case "violent":
        yield Log.dialog(`あ？`);
        break;
      case "phobic":
        yield Log.dialog(`ひいっ……`);
        break;
      case "smart":
        yield Log.dialog(`おや、君も中々スマートだね`);
        break;
    }
    yield Log.description("人望が高まった。");
  }
}

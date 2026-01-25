import { Battle, PlayerBattler } from "../../battle";
import { GOAL_POSITION } from "../../config";
import type { GameContext } from "../../game";
import type { Player } from "../../gameState";
import { generatePlayerAttrChange, PlayerAttrChanger } from "../../indicator";
import { Log } from "../../log";
import { generateEarnTrophy } from "../../trophy";

// 相席イベント
export function* generateSharingPositionEvent(
  g: GameContext,
  currentPlayer: Player
): Generator<Log, { playerDead: boolean }> {
  const others = g.state.players.filter(
    (p) => p !== currentPlayer && p.position === currentPlayer.position
  );
  if (others.length === 0) {
    return { playerDead: false };
  }

  yield Log.newSection();
  const otherNames = others.map((p) => p.name).join("と");
  yield Log.description(`マスには${otherNames}がいた。`);
  switch (currentPlayer.personality) {
    case "gentle":
      yield* generateSharingPositionGentle(g, currentPlayer, others);
      break;
    case "violent":
      return yield* generateSharingPositionViolent(g, currentPlayer, others);
    case "phobic":
      return yield* generateSharingPositionPhobic(g, currentPlayer);
    case "smart":
      yield* generateSharingPositionSmart(g, currentPlayer, others);
      break;
  }
  return { playerDead: false };
}

// 来た人を嫌がって逃げる
function* generatePhobicEscape(
  g: GameContext,
  phobic: Player,
  coming: Player
): Generator<Log, { escaped: boolean }> {
  const isGoal = phobic.position === GOAL_POSITION;
  if (isGoal) {
    yield Log.description(
      `${phobic.name}は${coming.name}を避けようとしたが、これ以上進めなかった。`,
      "negative"
    );
    return { escaped: false };
  }

  const peopleInNextSpace = g.state.players.filter(
    (p) => p.position === phobic.position + 1
  );
  if (peopleInNextSpace.length > 0) {
    yield Log.description(
      `${phobic.name}は${coming.name}を避けようとしたが、前に${peopleInNextSpace[0].name}がいて進めなかった。`,
      "negative"
    );
    yield* generateEarnTrophy(g, "挟み撃ち");
    return { escaped: false };
  }

  yield Log.description(
    `${phobic.name}は${coming.name}を嫌がって1マス進んだ。`,
    "negative"
  );
  yield Log.dialog("近い！");
  yield* generatePlayerAttrChange(
    phobic,
    PlayerAttrChanger.position(phobic.position + 1),
    "positive"
  );
  return { escaped: true };
}

function* generateSharingPositionGentle(
  g: GameContext,
  player: Player,
  others: Player[]
) {
  for (const other of others) {
    if (other.personality === "phobic") {
      const { escaped } = yield* generatePhobicEscape(g, other, player);
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
  g: GameContext,
  player: Player,
  others: Player[]
): Generator<Log, { playerDead: boolean }> {
  for (const other of others) {
    if (other.personality === "phobic") {
      const { escaped } = yield* generatePhobicEscape(g, other, player);
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
    if (
      !attack1.knockedOut &&
      (other.personality === "violent" || other.personality === "phobic")
    ) {
      // 反撃
      yield Log.dialog(
        {
          violent: "何しやがる！",
          phobic: "来ないで！",
        }[other.personality]
      );
      const attack2 = yield* Battle.generateAttack(
        g,
        otherBattler,
        playerBattler,
        { skipAttackVoice: true }
      );
      if (attack2.knockedOut) {
        // 反撃で倒されたら後続の人を殴れない
        yield* generateEarnTrophy(g, "因果応報");
        return { playerDead: true };
      }
    }
  }
  return { playerDead: false };
}

function* generateSharingPositionPhobic(
  g: GameContext,
  player: Player
): Generator<Log, { playerDead: boolean }> {
  yield Log.dialog("ひっ");

  let escaped = false;
  const peopleInNextSpace = g.state.players.filter(
    (p) => p.position === player.position + 1
  );
  if (player.position === GOAL_POSITION) {
    yield Log.description(
      `${player.name}は先客を避けようとしたが、これ以上進めなかった。`,
      "negative"
    );
  } else if (peopleInNextSpace.length > 0) {
    yield Log.description(
      `${player.name}は先客を避けようとしたが、前に${peopleInNextSpace[0].name}がいて進めなかった。`,
      "negative"
    );
    yield* generateEarnTrophy(g, "挟み撃ち");
  } else {
    yield Log.description(
      `${player.name}は先客を避けて1マス進んだ。`,
      "negative"
    );
    yield* generatePlayerAttrChange(
      player,
      PlayerAttrChanger.position(player.position + 1),
      "positive"
    );
    escaped = true;
  }

  if (!escaped) {
    yield Log.description(`精神的な苦痛が${player.name}を蝕んだ。`, "negative");
    const { knockedOut } = yield* PlayerBattler.generateHitPlayer(
      g,
      3,
      player,
      {
        overrideDamageVoice: "ううっ……",
      }
    );
    return { playerDead: knockedOut };
  }
  return { playerDead: false };
}

function* generateSharingPositionSmart(
  g: GameContext,
  player: Player,
  others: Player[]
) {
  for (const other of others) {
    if (other.personality === "phobic") {
      const { escaped } = yield* generatePhobicEscape(g, other, player);
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
        yield Log.dialog(`フフ……君も中々スマートだね`);
        break;
    }
    yield Log.description("人望が高まった。");
  }
}

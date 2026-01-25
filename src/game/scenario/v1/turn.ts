import { PlayerBattler } from "../../battle";
import { GOAL_POSITION } from "../../config";
import { generateDiceRoll } from "../../dice";
import type { GameContext, TurnResult } from "../../game";
import {
  generatePlayerAttrChange,
  generatePlayerAttrs,
  PlayerAttr,
  PlayerAttrChanger,
  stringifyPlayerAttrs,
} from "../../indicator";
import { Log, LogUtil } from "../../log";
import { Trophy } from "../../trophy";
import { goaledDialog } from "./goal";
import { generateHello } from "./hello";
import { generateSharingPositionEvent } from "./sharingSpace";

export function* generateTurn(g: GameContext): Generator<Log, TurnResult> {
  const player = g.state.currentPlayer();
  if (player.goaled) {
    return { skipped: true };
  }

  player.turn += 1;
  g.state.cameraStart = player.position;
  g.state.cameraPlayerIndex = g.state.currentPlayerIndex;

  // ターン開始
  yield Log.description(`${player.name}のターン${player.turn}。`);
  yield* generatePlayerAttrs(player, PlayerAttr.attrsShownInTurnStart);

  if (player.turnSkip > 0) {
    yield Log.newSection();
    yield Log.description(`${player.name}は動けない。`, "negative");
    yield* generatePlayerAttrChange(
      player,
      PlayerAttrChanger.turnSkip(player.turnSkip - 1),
      "negative"
    );
    return { skipped: false }; // falseでいい。真のskipはログを全く表示しない。つまり命名が悪いのだがもう時間がない
  } else {
    yield* generateHello(g);
  }

  // ダイス移動
  yield Log.newSection();
  const diceSides = (() => {
    switch (player.dice) {
      case "1d6":
        return 6;
      case "1d100":
        return 100;
    }
  })();
  const dice = yield* generateDiceRoll(g, player.isBot, 1, diceSides);
  yield Log.description(`${player.name}は${dice}マス進んだ。`, "positive");

  let nextPos = player.position + dice;
  let smartDamage: number | undefined = undefined;
  if (nextPos > GOAL_POSITION) {
    const power = nextPos - GOAL_POSITION;
    if (player.personality === "smart") {
      yield Log.dialog("おっと！　ここがゴールだね");
      yield Log.description(
        `${player.name}はスマートに停止した（${power}マスの余りを無視した）。`,
        "positive"
      );
      nextPos = GOAL_POSITION;
      smartDamage = power;
      if (player.hp < power) {
        const back = 1; // power - player.hp;
        yield Log.description(
          `勢いを殺しきれず、${player.name}は${back}マス跳ね返った。`,
          "negative"
        );
        nextPos = GOAL_POSITION - back;
      }
    } else {
      nextPos = GOAL_POSITION - power;
      yield Log.description(`ゴールで折り返した。`, "negative");
    }
  }

  if (nextPos < 0) {
    nextPos = -nextPos;
    yield Log.description("スタートで折り返した。", "negative");
    switch (player.personality) {
      case "gentle":
        yield Log.dialog("うわあああ！");
        break;
      case "violent":
        yield Log.dialog("止めてくれえええ！");
        break;
      case "phobic":
        yield Log.dialog("（言葉にならない悲鳴）");
        break;
      case "smart":
        // noop
        break;
    }
  }

  yield* generatePlayerAttrChange(
    player,
    PlayerAttrChanger.position(nextPos),
    nextPos > player.position ? "positive" : "negative"
  );

  let playerDead = false;
  if (smartDamage !== undefined) {
    yield Log.description(`急停止が体に負担をかけた！`, "negative");
    const { knockedOut } = yield* PlayerBattler.generateHitPlayer(
      g,
      smartDamage,
      player,
      { unblockable: true, overrideDamageVoice: "ぐはっ" }
    );
    playerDead = knockedOut;
  }

  // 相席イベント
  if (!playerDead) {
    playerDead = (yield* generateSharingPositionEvent(g, player)).playerDead;
  }

  // マスイベント
  if (!playerDead) {
    if (player.position === 1 && player.turn === 1 && !player.isBot) {
      // spaceで実装すると余計なsectionが入る
      yield Log.newSection();
      yield Log.dialog("1マスしか進めなかった");
      yield* LogUtil.generateEarnTrophy(g, "腰が重い");
    }

    const space = g.scenario.spaceMap[player.position];
    if (space?.generate) {
      yield Log.newSection();
      yield* space.generate(g);
    }
  }

  // ゴールチェック
  const justGoaledPlayers = g.state.players.filter(
    (p) => p.position === GOAL_POSITION && !p.goaled
  );
  if (justGoaledPlayers.length > 0) {
    yield Log.newSection();
    const you = g.state.players[0];
    const youGoaled = justGoaledPlayers.includes(you);
    if (youGoaled) {
      yield Log.description("おめでとう！", "positive");
    }
    const alreadyGoaled = g.state.players.filter((p) => p.goaled).length;
    const rank = alreadyGoaled + 1;
    const justGoaledNames = justGoaledPlayers.map((p) => p.name).join("と");
    yield Log.description(
      `${justGoaledNames}は${rank}位でゴールした。`,
      "positive"
    );
    for (const p of justGoaledPlayers) {
      // ゴール台詞
      const dialog = goaledDialog(p, rank);
      yield Log.dialog(dialog);
      p.goaled = true;
    }
    // ゴール系の実績
    if (justGoaledPlayers.some((p) => !p.personalityChanged)) {
      yield* LogUtil.generateEarnTrophy(g, "情緒安定");
    }
    if (
      justGoaledPlayers.includes(player) &&
      player.personality === "smart" &&
      nextPos === GOAL_POSITION &&
      smartDamage === undefined
    ) {
      yield* LogUtil.generateEarnTrophy(g, "ぴったり賞");
    }
    if (youGoaled && rank === 1) {
      switch (you.personality) {
        case "gentle":
          yield* LogUtil.generateEarnTrophy(g, "聖人君子");
          break;
        case "violent":
          yield* LogUtil.generateEarnTrophy(g, "世紀末");
          break;
        case "phobic":
          yield* LogUtil.generateEarnTrophy(g, "戦々恐々");
          break;
        case "smart":
          yield* LogUtil.generateEarnTrophy(g, "超スマート");
          break;
      }
    }
    if (youGoaled && g.state.trophies.length > 0) {
      yield Log.newSection();
      yield Log.system("<今回のトロフィー>");
      for (const trophy of g.state.trophies) {
        const detail = Trophy.detail(trophy.name);
        const firstTimeText = trophy.firstTime ? " (new)" : "";
        yield Log.system(
          `・${detail.name}: ${detail.description}${firstTimeText}`
        );
      }
    }
    if (youGoaled) {
      if (g.state.replayMode) {
        yield Log.system(
          "これはリプレイです。トロフィーは保存されません。",
          "negative"
        );
      }

      // 共有用のメッセージを返してゲーム終了
      const attrs = [
        PlayerAttr.turn,
        ...PlayerAttr.attrsShownInTurnStart.filter(
          (a) => a !== PlayerAttr.position
        ),
      ];
      const attrsText = stringifyPlayerAttrs(you, attrs);
      const dialog = goaledDialog(you, rank);
      let gameOver = `${you.name}は${rank}位でゴールした。「${dialog}」`;
      gameOver += `\n[状態] ${attrsText}`;
      if (g.state.trophies.length > 0) {
        const trophiesText = g.state.trophies.map((t) => t.name).join(", ");
        gameOver += `\n[トロフィー] ${trophiesText}`;
      }
      return { skipped: true, gameOver }; // ここのskippedは意味をなさない
    }
  }

  // ここは空行を挟まなくていい
  yield Log.description("ターンが終了した。");
  return { skipped: false };
}

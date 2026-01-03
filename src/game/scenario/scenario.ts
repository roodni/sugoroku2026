import { PlayerBattler } from "../battle";
import { GOAL_POSITION } from "../config";
import { GameState } from "../gameState";
import {
  PlayerAttr,
  PlayerAttrChanger,
  stringifyPlayerAttrs,
} from "../indicator";
import { Log, LogUtil } from "../log";
import { Trophy } from "../trophy";
import { goaledDialog } from "./goal";
import { generateHello } from "./hello";
import { generateSharingPositionEvent } from "./sharing";
import { SPACE_MAP } from "./space/space";

type TurnResult = {
  skipped: boolean;
};

export class Scenario {
  // 描画に使うのでpublic
  gameState: GameState;

  private generator: Generator<Log> | undefined;
  history: Log[];
  loadable: boolean;

  constructor() {
    this.gameState = GameState.initial();
    this.history = [];
    this.loadable = true;
  }

  // デバッグ用
  load(json: string) {
    if (this.loadable) {
      const obj = JSON.parse(json);
      this.gameState = GameState.load(obj);
    } else {
      throw new Error("ターン途中ではロード禁止");
    }
  }
  save(): string {
    const obj = GameState.save(this.gameState);
    return JSON.stringify(obj, undefined, 2);
  }

  private *generate(): Generator<Log> {
    this.loadable = false;
    while (true) {
      const g = this.gameState;
      const turnResult = yield* generateTurn(g);
      if (g.gameOverMessage) {
        // ゲーム終了
        // メッセージはgameStateじゃなくて返値で返すべきかも
        return;
      }
      g.currentPlayerIndex += 1;
      g.currentPlayerIndex %= g.players.length;
      if (!turnResult.skipped) {
        this.loadable = true;
        yield Log.turnEnd();
        // <- このタイミングでgameStateがデバッグ機能により書き変わる可能性がある
        this.loadable = false;
      }
    }
  }

  next(): Log | undefined {
    if (!this.generator) {
      this.generator = this.generate();
    }
    const result = this.generator.next();
    if (result.done) {
      return undefined;
    } else {
      this.history.push(result.value);
      return result.value;
    }
  }
}

// 1ターンを経過させる。
// ターンの切れ目に安全にセーブ&ロード（デバッグ用）できるように、
// 1ターン分を関数に切ることでターン開始時にGameState以外の状態を参照しないことを保証している。
function* generateTurn(g: GameState): Generator<Log, TurnResult> {
  const player = g.players[g.currentPlayerIndex];
  if (player.goaled) {
    return { skipped: true };
  }

  player.turn += 1;
  g.cameraStart = player.position;
  g.cameraPlayerIndex = g.currentPlayerIndex;

  // ターン開始
  yield Log.description(`${player.name}のターン${player.turn}。`);
  yield* LogUtil.generatePlayerAttrs(player, PlayerAttr.attrsShownInTurnStart);
  yield* generateHello(g);

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
  const dice = yield* LogUtil.generateDiceRoll(g, player.isBot, 1, diceSides);
  yield Log.description(`${player.name}は${dice}マス進んだ。`, "positive");

  let nextPos = player.position + dice;
  let smartDamage: number | undefined = undefined;
  if (nextPos > GOAL_POSITION) {
    const power = nextPos - GOAL_POSITION;
    if (player.personality === "smart") {
      yield Log.dialog("おっと！　ここがゴールだね");
      yield Log.description(
        `${player.name}はスマートに停止した (${power}マスの余りを無視した) 。`,
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
        yield Log.dialog(" (声にならない悲鳴) ");
        break;
      case "smart":
        // noop
        break;
    }
  }

  yield* LogUtil.generatePlayerAttrChange(
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
      { unblockable: true }
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

    const space = SPACE_MAP[player.position];
    if (space?.generate) {
      yield Log.newSection();
      yield* space.generate(g);
    }
  }

  // ゴールチェック
  const justGoaledPlayers = g.players.filter(
    (p) => p.position === GOAL_POSITION && !p.goaled
  );
  if (justGoaledPlayers.length > 0) {
    yield Log.newSection();
    const you = g.players[0];
    const youGoaled = justGoaledPlayers.includes(you);
    if (youGoaled) {
      yield Log.description("おめでとう！", "positive");
    }
    const alreadyGoaled = g.players.filter((p) => p.goaled).length;
    const rank = alreadyGoaled + 1;
    const justGoaledNames = justGoaledPlayers.map((p) => p.name).join("と");
    const goaledDescription = `${justGoaledNames}は${rank}位でゴールした。`;
    yield Log.description(goaledDescription, "positive");
    for (const p of justGoaledPlayers) {
      const dialog = goaledDialog(p, rank);
      yield Log.dialog(dialog);
      p.goaled = true;
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
    if (youGoaled && g.trophies.length > 0) {
      yield Log.newSection();
      yield Log.system("<今回のトロフィー>");
      for (const trophy of g.trophies) {
        const detail = Trophy.detail(trophy.name);
        const firstTimeText = trophy.firstTime ? " (new)" : "";
        yield Log.system(
          `・${detail.name}: ${detail.description}${firstTimeText}`
        );
      }
    }
    if (youGoaled) {
      const attrs = [
        PlayerAttr.turn,
        ...PlayerAttr.attrsShownInTurnStart.filter(
          (a) => a !== PlayerAttr.position
        ),
      ];
      const attrsText = stringifyPlayerAttrs(you, attrs);
      const dialog = goaledDialog(you, rank);
      g.gameOverMessage = `${you.name}は${rank}位でゴールした。「${dialog}」`;
      g.gameOverMessage += `\n[状態] ${attrsText}`;
      if (g.trophies.length > 0) {
        const trophiesText = g.trophies.map((t) => t.name).join(", ");
        g.gameOverMessage += `\n[トロフィー] ${trophiesText}`;
      }
      return { skipped: true }; // ゲーム終了
    }
  }

  // ここは空行を挟まなくていい
  yield Log.description("ターンが終了した。");
  return { skipped: false };
}

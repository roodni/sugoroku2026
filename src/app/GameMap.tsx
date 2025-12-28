import { Fragment, useEffect, useState, type JSX } from "react";
import type { GameState } from "../game/gameState";
import type { Observer } from "../util";
import { Config } from "../game/config";

function drawMapElements(gameState: GameState): JSX.Element[] {
  // まず描画対象のマスを決める
  const spaces: number[] = [];
  const isSpaceIncluded = (pos: number): boolean => {
    if (pos === 0 || pos === Config.goalPosition) {
      return true;
    }
    for (const player of gameState.players) {
      if (player.position === pos) {
        return true;
      }
    }

    const max = gameState.cameraStart + 6;
    let min = gameState.cameraStart;
    if (max > Config.goalPosition) {
      // 折り返す可能性があれば、最大折り返し地点まで表示する
      min = Math.min(min, Config.goalPosition - (max - Config.goalPosition));
    }
    if (min <= pos && pos <= max) {
      return true;
    }
    return false;
  };

  for (let i = 0; i <= Config.goalPosition; i++) {
    if (isSpaceIncluded(i)) {
      spaces.push(i);
    }
  }
  spaces.reverse();

  // 各マスを描画する
  const lines: JSX.Element[] = [];
  let lastPos: number | undefined = undefined;
  for (const pos of spaces) {
    if (lastPos !== undefined && Math.abs(pos - lastPos) > 1) {
      lines.push(<Fragment key={`ellipsis-${pos}`}>{"︙\n"}</Fragment>);
    }
    lastPos = pos;

    let text = `${pos}`;
    if (pos === 0) {
      text += " スタート";
    } else if (pos === Config.goalPosition) {
      text += " ゴール";
    } else if (pos % 10 === 0) {
      text += " 病院";
    }

    const players = gameState.players.filter((p) => p.position === pos);
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (players.length > 0) {
      text += " <- ";
      text += players
        .map((p) => (p === currentPlayer ? `[${p.name}]` : p.name))
        .join(" ");
    }
    lines.push(
      <span
        key={pos}
        className={currentPlayer.position === pos ? "map-line-current" : ""}
      >
        {text}
        {"\n"}
      </span>
    );
  }

  return lines;
}

// すごろくの地図を描画するコンポーネント
export const GameMap: React.FC<{
  getGameState: () => GameState;
  renderObserver: Observer<void>;
}> = ({ getGameState, renderObserver }) => {
  const [lines, setLines] = useState(() => drawMapElements(getGameState()));

  // イベント購読
  useEffect(() => {
    const unsubscribe = renderObserver.subscribe(() => {
      // console.log("マップ再描画");
      setLines(drawMapElements(getGameState()));
    });
    return () => {
      unsubscribe();
    };
  }, [renderObserver, getGameState]);

  if (lines.length === 0) {
    return undefined;
  }
  return <pre className="game-map">{lines}</pre>;
};

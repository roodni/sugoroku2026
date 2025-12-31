import { Fragment, useEffect, useState, type JSX } from "react";
import type { GameState } from "../game/gameState";
import type { Observer } from "../util";
import { Config } from "../game/config";
import { SPACE_MAP } from "../game/scenario/space";

function drawMapElements(gameState: GameState): JSX.Element[] {
  // まず描画対象のマスを決める
  const positions: number[] = [];
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
      positions.push(i);
    }
  }
  positions.reverse();

  // 各マスを描画する
  const lines: JSX.Element[] = [];
  let lastPos: number | undefined = undefined;
  for (const pos of positions) {
    if (lastPos !== undefined && Math.abs(pos - lastPos) > 1) {
      lines.push(<Fragment key={`ellipsis-${pos}`}>{"︙\n"}</Fragment>);
    }
    lastPos = pos;

    let text = `${pos}`;
    const space = SPACE_MAP[pos];
    if (space) {
      text += ` ${space.name}`;
    }

    const players = gameState.players.filter((p) => p.position === pos);
    const cameraPlayer = gameState.players[gameState.cameraPlayerIndex];
    if (players.length > 0) {
      text += " <- ";
      text += players
        .map((p) => (p === cameraPlayer ? `[${p.name}]` : p.name))
        .join(" ");
    }
    lines.push(
      <span
        key={pos}
        className={cameraPlayer.position === pos ? "map-line-current" : ""}
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

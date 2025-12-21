import { useEffect, useState } from "react";
import type { GameState } from "../game/gameState";
import type { Observer } from "../util";
import { Config } from "../game/config";

function renderMapText(gameState: GameState): string {
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
  const lines: string[] = [];
  let lastPos: number | undefined = undefined;
  for (const pos of spaces) {
    if (lastPos !== undefined && Math.abs(pos - lastPos) > 1) {
      lines.push("︙");
    }
    lastPos = pos;

    let line = `${pos}`;
    if (pos === 0) {
      line += " スタート";
    } else if (pos === Config.goalPosition) {
      line += " ゴール";
    } else if (pos % 10 === 0) {
      line += " 病院";
    }

    const players = gameState.players.filter((p) => p.position === pos);
    if (players.length > 0) {
      line += " <- ";
      line += players.map((p) => `(${p.name})`).join(" ");
    }
    lines.push(line);
  }

  return lines.join("\n");
}

// すごろくの地図を描画するコンポーネント
export const GameMap: React.FC<{
  gameState: GameState;
  renderObserver: Observer;
}> = ({ renderObserver, gameState }) => {
  const [text, setText] = useState(() => renderMapText(gameState));

  useEffect(() => {
    const unsubscribe = renderObserver.subscribe(() => {
      console.log("マップ再描画");
      setText(renderMapText(gameState));
    });
    return () => {
      unsubscribe();
    };
  }, [renderObserver, gameState]);

  return <pre className="game-map">{text}</pre>;
};

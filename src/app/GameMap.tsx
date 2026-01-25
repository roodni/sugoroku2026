import { Fragment, useEffect, useState, type JSX } from "react";
import { GOAL_POSITION } from "../game/config";
import type { GameContext } from "../game/game";
import type { Observer } from "../util";

function drawMapElements(g: GameContext, showAll: boolean): JSX.Element[] {
  // まず描画対象のマスを決める
  const positions: number[] = [];
  const isSpaceIncluded = (pos: number): boolean => {
    if (showAll) {
      return true;
    }

    if (pos === 0 || pos === GOAL_POSITION) {
      return true;
    }
    for (const player of g.state.players) {
      if (player.position === pos) {
        return true;
      }
    }

    const max = g.state.cameraStart + 6;
    let min = g.state.cameraStart;
    if (max > GOAL_POSITION) {
      // 折り返す可能性があれば、最大折り返し地点まで表示する
      min = Math.min(min, GOAL_POSITION - (max - GOAL_POSITION));
    }
    if (min <= pos && pos <= max) {
      return true;
    }
    // return true;
    return false;
  };

  for (let i = 0; i <= GOAL_POSITION; i++) {
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

    let text = `${pos}`.padStart(2, "0");
    const spaceName = g.scenario.spaceMap[pos]?.name;
    if (spaceName) {
      text += ` ${spaceName}`;
    }

    const players = g.state.players.filter((p) => p.position === pos);
    const cameraPlayer = g.state.players[g.state.cameraPlayerIndex];
    if (players.length > 0) {
      text += " <-- ";
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
  getGameContext: () => GameContext;
  renderObserver: Observer<void>;
  showAll: boolean;
}> = ({ getGameContext, renderObserver, showAll }) => {
  const [lines, setLines] = useState<JSX.Element[]>(
    drawMapElements(getGameContext(), showAll)
  ); // こうしないと出現の瞬間に一瞬空になる

  // showAllが変わった時
  useEffect(() => {
    setLines(drawMapElements(getGameContext(), showAll));
  }, [getGameContext, showAll]);

  // イベント購読
  useEffect(() => {
    const unsubscribe = renderObserver.subscribe(() => {
      // console.log("マップ再描画");
      setLines(drawMapElements(getGameContext(), showAll));
    });
    return () => {
      unsubscribe();
    };
  }, [renderObserver, getGameContext, showAll]); // showAllで作り直されるの気持ち悪いけどもういい

  if (lines.length === 0) {
    return undefined;
  }
  return (
    <div className="game-map">
      <pre className="game-map-scrollee">{lines}</pre>
    </div>
  );
};

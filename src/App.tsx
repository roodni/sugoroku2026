import { useCallback, useState } from 'react'
import './App.css'
import { Game } from './game/game'
import { ExhaustiveError } from './game/util';

function App() {
  const [game] = useState(() => new Game());
  const [logText, setLogText] = useState("");

  const mainButtonHandler = useCallback(() => {
    const turn = game.genTurn();
    let logTmp = "";

    // とりあえずターンごとに進むようにしてみよう
    // TODO: 自分だけダイス待ちする
    let iresult = turn.next();
    while (!iresult.done) {
      const log = iresult.value;
      switch (log.type) {
        case "description":
          logTmp += `${log.text}`;
          break;
        case "quote":
          logTmp += `「${log.text}」`;
          break;
        case "dicerollBefore":
          break;  // noop
        case "dicerollAfter":
          logTmp += `\n(${log.kind} -> ${log.result})\n`;
          break;
        default:
          throw new ExhaustiveError(log)
      }
      iresult = turn.next();
    }
    setLogText(logTmp);
  }, [game])

  return (
    <>
      <main>
        <p>迎春すごろく2026</p>
        <pre>{logText}</pre>
      </main>
      <footer>
        <button type="button" onClick={mainButtonHandler}>次へ</button>
      </footer>
    </>
  )
}

export default App

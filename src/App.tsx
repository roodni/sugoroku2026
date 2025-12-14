import './App.css'

function App() {
  return (
    <>
      <main>
        <p>ログ生成すごろく2026</p>
        <pre style={{border: "solid"}}>
{`\
100 ゴール
 ︙
 17 <- [CP1]
 ︙
 12 警察
 11 釣りスポット
 10 病院
  9
  8
  7
  6 コンビニ <- [あなた] [CP3]
 ︙
  4 <- [CP2]
 ︙
  0 スタート
`}
        </pre>
      </main>
      <footer>
        <button>1d6</button>
      </footer>
    </>
  )
}

export default App

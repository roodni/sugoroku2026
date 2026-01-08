const messages = [
  "あなたはサイコロの細工を試みた。「ククク……」",
  "「誠実が一番だね」",
  "「触らないでッ！」",
  "「よりスマートな方法を教えてあげよう。コンソールを閉じて @ を押してみたまえ」",
  "「愚かな人間よ……」",
  "「あらあら、ダメですよ」",
  "「君の体も改造してあげよう」",
];

const rand = Math.random;
Object.defineProperty(Math, "random", {
  set() {
    const i = Math.floor(rand() * messages.length);
    console.log(messages[i]);
  },
  get() {
    return rand;
  },
});

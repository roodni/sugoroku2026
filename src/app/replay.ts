import { REPLAY_KEY } from "./appConfig";

// リプレイURLの符号化
// 仕様
// ?replay={base64}
// base64: Uint8Array [major_version, ...diceHistory] を圧縮してbase64化した文字列

// gzipより短くて、deflate-rawにはないチェックサムがあるので、これでいいんじゃないか
const format: CompressionFormat = "deflate";

// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64
// 新しすぎてES2024には型情報がない。
declare global {
  interface Uint8Array {
    toBase64(options: { alphabet: "base64url"; omitPadding: boolean }): string;
  }
  interface Uint8ArrayConstructor {
    fromBase64(
      string: string,
      options: {
        alphabet: "base64url";
      }
    ): Uint8Array<ArrayBuffer>;
  }
}

export async function encodeReplay(diceHistory: number[]): Promise<string> {
  const data = new Uint8Array([1, ...diceHistory]);
  const compression = new CompressionStream(format);
  const stream = new Blob([data]).stream().pipeThrough(compression);
  const buffer = await new Response(stream).arrayBuffer();
  const compressed = new Uint8Array(buffer);
  const base64 = compressed.toBase64({
    alphabet: "base64url",
    omitPadding: true,
  });
  return base64;
}

export async function decodeReplay(code: string): Promise<number[]> {
  const compressed = Uint8Array.fromBase64(code, { alphabet: "base64url" });
  const decompression = new DecompressionStream(format);
  const stream = new Blob([compressed.buffer])
    .stream()
    .pipeThrough(decompression);
  const buffer = await new Response(stream).arrayBuffer();
  const data = new Uint8Array(buffer);
  const version = data.at(0);
  if (version !== 1) {
    throw new Error("バージョンが違う");
  }
  return [...data.slice(1)];
}

// URLを作るユーティリティ
// エンコードしてくれるわけではない
export function createReplayUrl(
  baseUrl: string,
  replayCode: string | undefined
): string {
  const url = new URL(baseUrl);
  if (replayCode) {
    url.search = `${REPLAY_KEY}=${replayCode}`;
  } else {
    url.search = "";
  }
  return url.href;
}

// declare global {
//   var sugorokuDebug: {
//     encodeReplay: typeof encodeReplay;
//     decodeReplay: typeof decodeReplay;
//   };
// }
// window.sugorokuDebug = {
//   encodeReplay,
//   decodeReplay,
// };

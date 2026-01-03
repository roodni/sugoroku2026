import { useState, type JSX } from "react";
import { Trophy } from "../game/trophy";

export const Start = (): JSX.Element => {
  const [trophies] = useState(Trophy.load());

  return (
    <div className="turn-logs">
      <span className="log-system-neutral">新春ログすごろく</span> ver. 1.0
      {"\n\n"}
      <span className="log-system-neutral">{"<これは何>\n"}</span>
      {"　"}
      お正月をお祝いするために作ったすごろくゲームです。サイコロを振ってゴールを目指しましょう。
      {"\n\n"}
      <span className="log-system-neutral">{"<遊び方>\n"}</span>
      {"　"}
      左下のボタンを押し続けてください。
      {
        <>
          {"\n\n"}
          <span className="log-system-neutral">{"<トロフィー>\n"}</span>
          {"　"}
          {Trophy.all.length}個中の{trophies.length}個が獲得されました。
          {"\n\n"}
          {Trophy.all.map((trophy) => {
            const earned = trophies.some((t) => t.name === trophy.name);
            const name = earned ? trophy.name : "？？？";
            const description = earned ? trophy.description : "？";
            return (
              <>
                ・
                <span
                  key={trophy.name}
                  className={
                    earned ? "log-system-positive" : "log-system-negative"
                  }
                >
                  {name.padEnd(5, "　")}
                </span>
                : {description}
                {"\n"}
              </>
            );
          })}
        </>
      }
    </div>
  );
};

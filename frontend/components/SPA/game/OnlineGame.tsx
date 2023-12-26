import React, { useState, useEffect, useCallback, memo, use } from "react";
import style from "@/styles/SPA/game/game.module.scss";
import Rectangle from "./Rectangle";

type Score = {
  player1: number;
  player2: number;
};
type RoomPositionsData = {
  ballX: number;
  ballY: number;
};

type InfoGame = {
  loser: string;
  player1Score: number;
  player2Score: number;
  winner: string;
};

export default function OnlineGame({
  map,
  socket,
}: // setShowRec,
{
  map: string;
  socket: any;
  // setShowRec: (_: boolean) => any;
}) {
  const [score, setScore] = useState<Score>({ player1: 0, player2: 0 });
  const [player1PaddleY, setPlayer1PaddleY] = useState<number>(210);
  const [EnemyPaddleY, setEnemyPaddleY] = useState<number>(210);
  const [infoGame, setInfoGame] = useState<InfoGame>({
    loser: "",
    player1Score: 0,
    player2Score: 0,
    winner: "",
  });
  const [showRec, setshowRec] = useState<boolean>(false);
  const handleKeyboardEvent = useCallback(
    (e: KeyboardEvent) => {
      if (!socket) return;
      let newPaddlePosition = player1PaddleY;
      if (e.key === "ArrowDown") {
        newPaddlePosition = player1PaddleY + 8;
      } else if (e.key === "ArrowUp") {
        newPaddlePosition = player1PaddleY - 8;
      }
      if (newPaddlePosition + 110 >= 500 || newPaddlePosition <= 0) return;
      setPlayer1PaddleY(newPaddlePosition);
      socket.emit("positionUpdate", {
        player1PaddleY: newPaddlePosition,
      });
    },
    [player1PaddleY]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyboardEvent);
    };
  }, [handleKeyboardEvent]);

  useEffect(() => {
    socket.on("enemyPositionUpdate", (data: any) => {
      setEnemyPaddleY(data.enemyY);
    });

    socket.on("changeState", (data: any) => {
      console.log("this is event on joinmatchmaking ", data);
    });

    socket.on("updateScore", (data: any) => {
      setScore(data);
    });
    socket.on("gameEnded", (data: any) => {
      setshowRec(true);

      console.log("gameEnded sure", data);
      setInfoGame(data);
    });

    return () => {
      socket.off("enemyPositionUpdate");
      socket.off("changeState");
      socket.off("updateScore");
      socket.off("gameEnded");
    };
  }, []);

  return (
    <>
      <div className={style.gameBody} tabIndex={0}>
        <p>{score.player1}</p>
        <div className={style[`${map}`]} tabIndex={0}>
          <div className={style.player} style={{ top: player1PaddleY }}></div>;
          <div className={style.ai} style={{ top: EnemyPaddleY }}></div>;
          <Ball socket={socket} />
        </div>
        <p>{score.player2}</p>
      </div>
      <Rectangle
        display={showRec}
        leftScore={infoGame.player1Score}
        rightScore={infoGame.player2Score}
      />
    </>
  );
}

// const PlayerPaddle = memo(({ player1PaddleY }: any) => {
//   return;
// });

// const EnemyPaddle = memo(({ EnemyPaddleY }: any) => {
//   return;
// });

const Ball = ({ socket }: any) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleRoomPositions = (data: RoomPositionsData) => {
      setPosition({ x: data.ballX, y: data.ballY });
    };

    socket.on("roomPostions", handleRoomPositions);

    return () => {
      socket.off("roomPostions", handleRoomPositions);
    };
  }, []);

  return (
    <div
      className={style.ball}
      style={{ top: position.y, left: position.x }}
    ></div>
  );
};

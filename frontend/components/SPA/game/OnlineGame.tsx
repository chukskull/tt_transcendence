import React, { useState, useEffect, memo, useMemo } from "react";
import style from "@/styles/SPA/game/game.module.scss";
import Rectangle from "./Rectangle";

export const PADDLESPEED = 12;

type Score = {
  player1: number;
  player2: number;
};

type RoomPositionsData = {
  ballX: number;
  ballY: number;
};

export default function OnlineGame({
  map,
  socket,
}: {
  map: string;
  socket: any;
}) {
  const [score, setScore] = useState<Score>({ player1: 0, player2: 0 });
  const [player1PaddleY, setPlayer1PaddleY] = useState<number>(210);
  const [EnemyPaddleY, setEnemyPaddleY] = useState<number>(210);
  const [infoGame, setInfoGame] = useState<any>({
    winner: "",
    loser: "",
    player1Score: 0,
    player2Score: 0,
  });

  const [showRec, setshowRec] = useState<boolean>(false);

  const handleKeyboardEvent = useMemo(() => {
    return (e: KeyboardEvent) => {
      if (!socket) return;
      if (e.key == "ArrowDown" && player1PaddleY + 110 + 8 < 500) {
        setPlayer1PaddleY((prev) => prev + 8);
      } else if (e.key == "ArrowUp" && player1PaddleY - 8 > 0) {
        setPlayer1PaddleY((prev) => prev - 8);
      }
      socket.emit("positionUpdate", {
        player1PaddleY: player1PaddleY,
      });
    };
  }, [player1PaddleY]);

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
          <PlayerPaddle player1PaddleY={player1PaddleY} />
          <EnemyPaddle EnemyPaddleY={EnemyPaddleY} />
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

const PlayerPaddle = memo(({ player1PaddleY }: any) => {
  return <div className={style.player} style={{ top: player1PaddleY }}></div>;
});

PlayerPaddle.displayName = "PlayerPaddle";

const EnemyPaddle = memo(({ EnemyPaddleY }: any) => {
  return <div className={style.ai} style={{ top: EnemyPaddleY }}></div>;
});

EnemyPaddle.displayName = "EnemyPaddle";

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

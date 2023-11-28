"use client";
import React, { useState, useEffect } from "react";
import { LiaTelegramPlane } from "react-icons/lia";
import EmojiPicker from "emoji-picker-react";
import style from "@/styles/SPA/chat/chat.module.scss";
import io from "socket.io-client";
import MsgsList from "@/components/SPA/chat/MessagesList";
import axios from "axios";

interface ChatRoomsProps {
  id: String | String[];
  isGroup: boolean;
}
interface Chat {
  id: number;
  sender: any;
  message: string;
  timestamp: Date;
}

export default function ChatRooms({ id, isGroup }: ChatRoomsProps) {
  const [socket, setSocket] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [msgs, setMsgs] = useState<Chat[]>([]);
  const [conv, setConv] = useState<any>("");
  const [receivedData, setReceivedData] = useState<any>(null);
  useEffect(() => {
    const endPoints = isGroup
      ? `/api/channels/${id}/chat`
      : `/api/users/friends/${id}/chat`;
    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}${endPoints}`, {
        withCredentials: true,
      })
      .then((res) => {
        setConv(res.data);
        setMsgs(res.data.chats);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    if (!conv) return;

    const newSocket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chatSocket`, {
      query: {
        conversationId: conv.id,
      },
    });
    newSocket.connect();
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [conv]);

  useEffect(() => {
    if (receivedData) {
      setMsgs((prevMsgs) => [...prevMsgs, receivedData]);
    }
  }, [receivedData]);
  // useEffect(() => {
    if (!socket) return;

    socket.on("messageReceived", (data: any) => setReceivedData(data));
    socket.on("connect_error", (err: any) => {
      console.error(err.message);
      socket.close();
    });
    socket.on("disconnect", setReceivedData);

    // return () => {
    //   socket.off("connect_error", setReceivedData);
    //   socket.off("disconnect", setReceivedData);
    //   socket.off("messageReceived", setReceivedData);
    // };
  // }, []);
  const handleEmojiClick = (emojiObject: any) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  const handleSend = () => {
    if (socket) {
      socket.emit("messageSent", {
        conversationId: conv.id,
        message: message,
        token: document.cookie.split("=")[1],
      });

      setMessage("");
    } else {
      console.error("WebSocket is not connected. Message not sent.");
    }
  };
  return (
    <div className={style["chat"]}>
      <div className={style["msgs"]}>
        <MsgsList chats={msgs} />
      </div>
      <div className={style["msg-input"]}>
        <button
          className={style["emoji-btn"]}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          👾
        </button>
        <input
          type="text"
          placeholder="Type your message here..."
          className={style["input"]}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
        />
        <button className={style["send-btn"]} onClick={handleSend}>
          <LiaTelegramPlane />
        </button>
      </div>
      {showEmojiPicker && (
        <div className={style["emoji-picker"]}>
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
}

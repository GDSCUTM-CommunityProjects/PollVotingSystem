import React, { useState, useEffect } from "react";
import { PollOptionButton } from "../components/PollOptionButton";
import { Header } from "../components/Header";
import Cookies from "universal-cookie";
import { Redirect, useHistory } from "react-router-dom";
import {
  mcsPollVoting,
  pollCodeCookie,
  questionStarted,
} from "../constants/constants";
import { socket } from "../socket";

export const VotePage = () => {
  const history = useHistory();
  const cookies = new Cookies();
  const [pollCode] = useState(cookies.get(pollCodeCookie));
  const [started, setStarted] = useState(false);

  const [errorCode, setErrorCode] = useState(0);
  const [selectedOption, setSelectionOption] = useState("");
  const [isFocus, setFocus] = useState(true);

  const onBlur = () => {
    setFocus(false);
  };

  const onFocus = () => {
    document.title = mcsPollVoting;
    setFocus(true);
  };

  useEffect(() => {
    socket.emit("join", pollCode);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const errorHandler = (e: any) => {
      setErrorCode(e.code);
    };

    // on error go back to join page
    socket.on("error", errorHandler);

    const pollStartedHandler = (data: any) => {
      setStarted(data);
      if (data) {
        const audio = new Audio("/newQuestion.wav");
        audio.play();
        setSelectionOption("");
        if (!isFocus) {
          document.title = questionStarted;
        }
      }
    };

    socket.on("pollStarted", pollStartedHandler);

    const pollClosedHandler = (data: any) => {
      cookies.remove(pollCodeCookie);
      history.replace("/");
    };
    socket.on("end", pollClosedHandler);

    const voteAckHandler = (data: any) => {
      setSelectionOption(String.fromCharCode(data + 64));
    };
    socket.on("ack", voteAckHandler);

    return () => {
      socket.off("error", errorHandler);
      socket.off("pollStarted", pollStartedHandler);
      socket.off("end", pollClosedHandler);
      socket.off("ack", voteAckHandler);
    };
  }, [errorCode, started, selectedOption]);

  const pollButtonHandler = (selectedOption: string) => {
    socket.emit("vote", (selectedOption.charCodeAt(0) % 65) + 1);
  };

  const optionButtons = () => {
    const pollOptionButtons = [];
    for (let i = 65; i < 70; i++) {
      const optionValue = String.fromCharCode(i);
      pollOptionButtons.push(
        <PollOptionButton
          selected={selectedOption === optionValue}
          key={i}
          onClick={() => pollButtonHandler(optionValue)}
          name={optionValue}
          disabled={!started}
        />
      );
    }
    return pollOptionButtons;
  };

  return errorCode === 1 ? (
    <Redirect to={"/"} />
  ) : (
    <div className={"flex flex-col items-center px-5"}>
      <Header text={`Poll Code: ${pollCode}`} />
      <Header
        text={`Selected Option: ${
          selectedOption.length > 0 ? selectedOption : "None"
        }`}
      />
      <div className={"flex flex-col max-w-md"}>{optionButtons()}</div>
    </div>
  );
};

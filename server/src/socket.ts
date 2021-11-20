// socket setup

import { Server, Socket } from "socket.io";
import { vote, join } from "./controllers/socketController";

const io = new Server({
  path: "/socket.io",
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
});

// log the socket id when client socket connects for the first time
io.on("connection", (socket: Socket) => {
  console.log(`connect: ${socket.id}`);

  // let the socket join rooms once connected
  socket.on("join", async (pollCode: string) => {
    await join(socket, pollCode);

    // let the socket vote in the connected room
    socket.on("vote", async (answer: number) => {
      await vote(socket, answer, socket.data.utorid);
    });
  });
});

export { io };

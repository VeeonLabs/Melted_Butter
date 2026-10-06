import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  // Store game states by roomId
  const rooms = new Map();
  const roomCreators = new Map();

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      
      const clients = io.sockets.adapter.rooms.get(roomId);
      const numClients = clients ? clients.size : 0;
      
      let isCreator = false;
      if (numClients === 1) {
        roomCreators.set(roomId, socket.id);
        isCreator = true;
      } else if (roomCreators.get(roomId) === socket.id) {
        isCreator = true;
      }
      
      // The first person is PLAYER_ONE, second is PLAYER_TWO
      const player = numClients === 1 ? "PLAYER_ONE" : "PLAYER_TWO";
      socket.emit("player-assigned", { role: player, isCreator });

      if (rooms.has(roomId)) {
        socket.emit("sync-state", rooms.get(roomId));
      }
      
      socket.to(roomId).emit("player-joined", { id: socket.id, player });
    });

    socket.on("sync-state", ({ roomId, state }) => {
      rooms.set(roomId, state);
      // broadcast to everyone else in the room
      socket.to(roomId).emit("sync-state", state);
    });

    socket.on("terminate-room", (roomId) => {
      if (roomCreators.get(roomId) === socket.id) {
        rooms.delete(roomId);
        roomCreators.delete(roomId);
        socket.to(roomId).emit("room-terminated");
        io.socketsLeave(roomId);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});

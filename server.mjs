import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev });
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

      // If room state doesn't exist yet, initialize it with a random first player
      if (!rooms.has(roomId)) {
        const randomFirst = Math.random() < 0.5 ? "PLAYER_ONE" : "PLAYER_TWO";
        rooms.set(roomId, {
          gameId: `room-${roomId}`,
          board: Array(9).fill(null),
          currentPlayer: randomFirst,
          winner: null,
          winningCells: null,
          status: "playing",
          score: { PLAYER_ONE: 0, PLAYER_TWO: 0, draws: 0 },
          streak: { player: null, count: 0 },
          lastMove: null,
          round: 1,
          version: 1,
        });
      } else if (numClients === 2) {
        // When the 2nd player connects and game is unplayed, randomly pick who goes first
        const currentRoom = rooms.get(roomId);
        if (currentRoom && currentRoom.board.every((cell) => cell === null) && currentRoom.status === "playing") {
          const randomFirst = Math.random() < 0.5 ? "PLAYER_ONE" : "PLAYER_TWO";
          currentRoom.currentPlayer = randomFirst;
          rooms.set(roomId, currentRoom);
          io.to(roomId).emit("chat-message", {
            sender: "System",
            message: `🎲 Coin toss: ${randomFirst === "PLAYER_ONE" ? "Player 1" : "Player 2"} was randomly chosen to go first!`,
            ts: Date.now(),
          });
        }
      }

      // Sync state to the joining socket
      socket.emit("sync-state", rooms.get(roomId));

      // When second player joins, broadcast to ensure both players have identical starting state
      if (numClients === 2) {
        io.to(roomId).emit("sync-state", rooms.get(roomId));
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

    socket.on("chat-message", ({ roomId, message, sender }) => {
      if (!roomId || !message) return;
      const payload = { sender, message, ts: Date.now() };
      // Send to everyone else in the room
      socket.to(roomId).emit("chat-message", payload);
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
      console.log(`> Ready on http://localhost:${port}`);
    });
});

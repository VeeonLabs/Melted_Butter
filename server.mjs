import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"],
  });

  // Store room objects: roomId -> { creatorId: string, players: { PLAYER_ONE: string | null, PLAYER_TWO: string | null }, state: object }
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", (data) => {
      const rawRoomId = typeof data === "object" && data !== null ? data.roomId : data;
      const roomId = typeof rawRoomId === "string" ? rawRoomId.trim() : String(rawRoomId || "");
      const playerId = typeof data === "object" && data !== null && data.playerId ? String(data.playerId) : socket.id;

      if (!roomId) return;
      socket.join(roomId);
      console.log(`Socket ${socket.id} (player ${playerId}) joined room ${roomId}`);

      let room = rooms.get(roomId);

      if (!room) {
        // First player creates the room
        const randomFirst = Math.random() < 0.5 ? "PLAYER_ONE" : "PLAYER_TWO";
        room = {
          creatorId: playerId,
          players: {
            PLAYER_ONE: playerId,
            PLAYER_TWO: null,
          },
          state: {
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
          },
        };
        rooms.set(roomId, room);
      }

      // Assign role based on persistent playerId
      let role = null;
      let isCreator = room.creatorId === playerId;

      if (room.players.PLAYER_ONE === playerId) {
        role = "PLAYER_ONE";
      } else if (room.players.PLAYER_TWO === playerId) {
        role = "PLAYER_TWO";
      } else if (!room.players.PLAYER_TWO) {
        // Second player claims PLAYER_TWO
        room.players.PLAYER_TWO = playerId;
        role = "PLAYER_TWO";

        // When second player connects and game has not started, do a fair coin toss
        if (room.state.board.every((cell) => cell === null) && room.state.status === "playing") {
          const randomFirst = Math.random() < 0.5 ? "PLAYER_ONE" : "PLAYER_TWO";
          room.state.currentPlayer = randomFirst;
          io.to(roomId).emit("chat-message", {
            sender: "System",
            message: `🎲 Coin toss: ${randomFirst === "PLAYER_ONE" ? "Player 1" : "Player 2"} was randomly chosen to go first!`,
            ts: Date.now(),
          });
        }
      } else {
        // Room already has two players: this socket is a spectator/observer
        role = null;
      }

      socket.emit("player-assigned", { role, isCreator });

      // Always send the latest synced state
      socket.emit("sync-state", room.state);

      // If both players are present, broadcast state so both sides start with identical board
      if (room.players.PLAYER_ONE && room.players.PLAYER_TWO) {
        io.to(roomId).emit("sync-state", room.state);
      }

      socket.to(roomId).emit("player-joined", { id: socket.id, player: role });
    });

    socket.on("sync-state", (data) => {
      const rawRoomId = typeof data === "object" && data !== null ? data.roomId : undefined;
      const cleanRoomId = typeof rawRoomId === "string" ? rawRoomId.trim() : rawRoomId;
      const state = typeof data === "object" && data !== null ? data.state : undefined;

      if (!cleanRoomId || !state) return;

      if (!socket.rooms.has(cleanRoomId)) {
        socket.join(cleanRoomId);
      }

      const room = rooms.get(cleanRoomId);
      if (room) {
        room.state = state;
      }

      // Broadcast move / new state to everyone else in the room
      socket.to(cleanRoomId).emit("sync-state", state);
    });

    socket.on("terminate-room", (data) => {
      const rawRoomId = typeof data === "object" && data !== null ? data.roomId : data;
      const cleanRoomId = typeof rawRoomId === "string" ? rawRoomId.trim() : rawRoomId;
      const playerId = typeof data === "object" && data !== null && data.playerId ? String(data.playerId) : socket.id;

      const room = rooms.get(cleanRoomId);
      if (room && (room.creatorId === playerId || room.creatorId === socket.id)) {
        rooms.delete(cleanRoomId);
        socket.to(cleanRoomId).emit("room-terminated");
        io.socketsLeave(cleanRoomId);
      }
    });

    socket.on("chat-message", (data) => {
      const rawRoomId = typeof data === "object" && data !== null ? data.roomId : undefined;
      const cleanRoomId = typeof rawRoomId === "string" ? rawRoomId.trim() : rawRoomId;
      const message = typeof data === "object" && data !== null ? data.message : undefined;
      const sender = typeof data === "object" && data !== null ? data.sender : "Observer";
      const playerId = typeof data === "object" && data !== null ? data.playerId : socket.id;
      const id = typeof data === "object" && data !== null && data.id ? data.id : "msg_" + Math.random().toString(36).substring(2, 9);

      if (!cleanRoomId || !message) return;

      if (!socket.rooms.has(cleanRoomId)) {
        socket.join(cleanRoomId);
      }

      const payload = { id, sender, message, playerId, ts: Date.now() };
      console.log(`[Chat] Room ${cleanRoomId} from ${sender} (${playerId}): ${message}`);
      io.to(cleanRoomId).emit("chat-message", payload);
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

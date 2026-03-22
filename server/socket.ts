import { Server } from "socket.io";
import http from "http";

let io: Server;

export const initSocket = (httpServer: http.Server) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        socket.on("join-room", (room) => {
            socket.join(room);
            console.log(`Socket joined room: ${room}`);
        });
    });

    return io;
};

export { io };

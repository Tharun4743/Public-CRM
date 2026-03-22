import { Server } from "socket.io";
import http from "http";

let ioInstance: Server | null = null;

export const initSocket = (httpServer: http.Server) => {
    ioInstance = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    ioInstance.on("connection", (socket) => {
        socket.on("join-room", (room) => {
            socket.join(room);
            console.log(`Socket joined room: ${room}`);
        });
    });

    return ioInstance;
};

export const getIO = (): Server => {
    if (!ioInstance) {
        throw new Error("Socket.IO not initialized! Call initSocket first.");
    }
    return ioInstance;
};

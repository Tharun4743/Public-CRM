import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";

let ioInstance: Server | null = null;
const JWT_SECRET = process.env.JWT_SECRET;

export const initSocket = (httpServer: http.Server) => {
    ioInstance = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    ioInstance.use((socket, next) => {
        if (!JWT_SECRET) return next(new Error("Auth not configured"));
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.toString().replace(/^Bearer\s+/i, "");
        if (!token) return next(new Error("Authentication required"));
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
            (socket.data as any).user = decoded;
            next();
        } catch {
            next(new Error("Invalid token"));
        }
    });

    ioInstance.on("connection", (socket) => {
        socket.on("join-room", (room) => {
            const user = (socket.data as any).user as { id: string; role: string } | undefined;
            if (!user) return;
            const isOwnUserRoom = room === user.id;
            const isAdminRoom = room === "Admin" && user.role === "Admin";
            const isComplaintRoom = room.startsWith("complaint:") && (user.role === "Admin" || user.role === "Officer");
            if (!isOwnUserRoom && !isAdminRoom && !isComplaintRoom) return;
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

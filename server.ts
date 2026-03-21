import express from "express";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { Server } from "socket.io";
import http from "http";
import complaintRoutes from "./server/routes/complaintRoutes.ts";
import userRoutes from "./server/routes/userRoutes.ts";
import aiRoutes from "./server/routes/aiRoutes.ts";
import analyticsRoutes from "./server/routes/analyticsRoutes.ts";
import notificationRoutes from "./server/routes/notificationRoutes.ts";
import feedbackRoutes from "./server/routes/feedbackRoutes.ts";
import anomalyRoutes from "./server/routes/anomalyRoutes.ts";
import auditRoutes from "./server/routes/auditRoutes.ts";
import intakeRoutes from "./server/routes/intakeRoutes.ts";
import citizenRoutes from "./server/routes/citizenRoutes.ts";
import leaderboardRoutes from "./server/routes/leaderboardRoutes.ts";
import reportsRoutes from "./server/routes/reportsRoutes.ts";
import publicRoutes from "./server/routes/publicRoutes.ts";
import slaRoutes from "./server/routes/slaRoutes.ts";
import rewardsRoutes from "./server/routes/rewardsRoutes.ts";
import dbStatsRoutes from "./server/routes/dbStatsRoutes.ts";
import { initDb } from "./server/db/database.ts";
import { auditLogger } from "./server/middleware/auditLogger.ts";
import { slaService } from "./server/services/slaService.ts";
import { emailPollingService } from "./server/services/emailPollingService.ts";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(compression());
app.use(cors());
app.use(express.static("public", {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(auditLogger);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/anomalies", anomalyRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/intake", intakeRoutes);
app.use("/api/citizens", citizenRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/settings/sla", slaRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/api/admin/db-stats", dbStatsRoutes);

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send('Server Error: could not serve frontend.');
    }
  });
});

// Socket.io
io.on("connection", (socket) => {
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`Socket joined room: ${room}`);
  });
});

// Start Server
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    initDb();
    slaService.startSlaMonitoring();
    emailPollingService.start();
});

export { io };

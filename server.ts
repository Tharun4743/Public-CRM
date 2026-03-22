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
import { connectDb } from "./server/db/database.ts";
import { auditLogger } from "./server/middleware/auditLogger.ts";
import { slaService } from "./server/services/slaService.ts";
import { emailPollingService } from "./server/services/emailPollingService.ts";

import { initSocket } from "./server/socket.ts";

const app = express();
app.set('trust proxy', 1); // For Render
app.disable('x-powered-by'); // Security + Small performance win

const httpServer = http.createServer(app);

// Keep-alive settings for highest response speed in cloud (Render)
httpServer.keepAliveTimeout = 65000;
httpServer.headersTimeout = 66000;

const io = initSocket(httpServer);


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

// Root endpoint for health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  console.log('Serving file:', indexPath);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving frontend:', err);
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

// More robust startup with error handling
const startServer = async () => {
    try {
        console.log('=== PS-CRM Server Starting ===');
        console.log(`Port: ${PORT}`);
        console.log(`Node.js version: ${process.version}`);
        console.log('Environment variables check:');
        console.log('- NODE_ENV:', process.env.NODE_ENV);
        console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
        console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
        console.log('- ADMIN_DB_KEY:', process.env.ADMIN_DB_KEY ? 'SET' : 'NOT SET');
        
        // Start HTTP server first
        const server = httpServer.listen(PORT, () => {
            console.log(`✅ HTTP Server running on port ${PORT}`);
            console.log(`✅ Server ready to accept connections`);
        });
        
        // Set server timeout for Render
        server.timeout = 30000; // 30 seconds
        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000;
        
        // Connect to database with error handling
        console.log('Connecting to database...');
        try {
            await connectDb();
            console.log('✅ Database connected');
        } catch (dbError) {
            console.error('❌ Database connection failed:', dbError.message);
            console.log('⚠️ Continuing without database - some features may not work');
        }
        
        // Start services with error handling
        try {
            slaService.startSlaMonitoring();
            console.log('✅ SLA monitoring started');
        } catch (slaError) {
            console.log('⚠️ SLA service failed to start:', slaError.message);
        }
        
        try {
            emailPollingService.start();
            console.log('✅ Email polling started');
        } catch (emailError) {
            console.log('⚠️ Email polling failed to start:', emailError.message);
        }

        // Verify Email Connectivity on Startup
        try {
            const { createTransporter } = await import('./server/services/emailService.ts');
            const transporter = createTransporter();
            if (transporter) {
                transporter.verify((error: any) => {
                    if (error) console.log('⚠️ SMTP Connection Error:', error.message);
                    else console.log('✅ SMTP Server ready');
                });
            }
        } catch (emailError) {
            console.log('⚠️ Email service initialization failed:', emailError.message);
        }
        
        console.log('=== PS-CRM Server Started Successfully ===');
        console.log('🌐 Server is ready to handle requests');
        
    } catch (error) {
        console.error('=== SERVER STARTUP FAILED ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        // Don't exit immediately, give time for logs to be captured
        setTimeout(() => {
            console.log('💀 Server shutting down due to fatal error');
            process.exit(1);
        }, 5000);
    }
};

startServer();



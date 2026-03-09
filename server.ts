import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import complaintRoutes from "./server/routes/complaintRoutes.ts";
import userRoutes from "./server/routes/userRoutes.ts";
import { initDb } from "./server/db/database.ts";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Initialize Database
  initDb();

  app.use(cors());
  app.use(express.json());


  // API Routes
  app.use("/api/complaints", complaintRoutes);
  app.use("/api/users", userRoutes);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static("dist"));
  }

  const server = app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`\n🚀 PS-CRM Server is ready!`);
    console.log(`👉 Access the app at: http://localhost:${PORT}`);
    console.log(`👉 Access Admin Portal: http://localhost:${PORT}/admin\n`);
  });

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${PORT} is already in use.`);
      console.error(`💡 Try running: npx kill-port ${PORT}`);
      console.error(`💡 Or run with a different port: PORT=3001 npm run dev\n`);
      process.exit(1);
    }
  });
}

startServer();

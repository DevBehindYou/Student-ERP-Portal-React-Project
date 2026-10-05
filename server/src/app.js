// ---- top-level crash guards ----
process.on("unhandledRejection", (e) => console.error("unhandledRejection", e));
process.on("uncaughtException",  (e) => {
  if (e.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${e.port} is already in use.`);
    console.error(`   Run this to free it:  Stop-Process -Id (Get-NetTCPConnection -LocalPort ${e.port}).OwningProcess -Force`);
    process.exit(1);
  }
  console.error("uncaughtException", e);
});

import "dotenv/config.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectMongo } from "./db/mongo.js";

// routers
import authRoutes      from "./routes/auth.js";
import adminRoutes     from "./routes/admin.js";
import teacherRoutes   from "./routes/teacher.js";
import studentRoutes   from "./routes/student.js";
import analyticsRoutes from "./routes/analytics.js";

const app = express();

// ---- core middleware (run ONCE) ----
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// ---- DB connection (cached, so serverless invocations reuse it) ----
let mongoReady;
function ensureMongo() {
  mongoReady ??= connectMongo(process.env.MONGO_URL).catch((err) => {
    mongoReady = undefined; // allow a retry on the next request
    throw err;
  });
  return mongoReady;
}

// ---- routes (mount ONCE) ----
const api = express.Router();
api.get("/health", (_req, res) => res.json({ ok: true }));

// everything below needs the database
api.use((_req, _res, next) => ensureMongo().then(() => next(), next));
api.use("/auth",      authRoutes);
api.use("/admin",     adminRoutes);
api.use("/teacher",   teacherRoutes);
api.use("/student",   studentRoutes);
api.use("/analytics", analyticsRoutes);

// Mounted at /api (local dev, Render, or Vercel passing the full path) and
// at / (in case Vercel strips the matched /api prefix before the service).
app.use("/api", api);
app.use("/", api);

// ---- global error handler (ONE instance, last) ----
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// ---- local / long-running server (not used on Vercel, which imports `app`) ----
async function start() {
  const port = process.env.PORT || 4000;
  try {
    await ensureMongo();
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB Atlas:", err.message);
    process.exit(1);
  }

  const server = app.listen(port, () =>
    console.log(`🚀 API running on http://localhost:${port}`)
  );

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${port} is already in use. Stop the existing process first.`);
      console.error(`   PowerShell: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess -Force`);
      process.exit(1);
    }
    throw err;
  });
}

if (!process.env.VERCEL) start();

export default app;

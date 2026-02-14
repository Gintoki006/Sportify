import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ── Health Check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Route Placeholders ──
// TODO: Mount route files as they are built
// app.use("/api/users", usersRouter);
// app.use("/api/sport-profiles", sportProfilesRouter);
// app.use("/api/stats", statsRouter);
// app.use("/api/goals", goalsRouter);
// app.use("/api/clubs", clubsRouter);
// app.use("/api/tournaments", tournamentsRouter);
// app.use("/api/matches", matchesRouter);

// ── Start ──
app.listen(PORT, () => {
  console.log(`🚀 Sportify API running on http://localhost:${PORT}`);
});

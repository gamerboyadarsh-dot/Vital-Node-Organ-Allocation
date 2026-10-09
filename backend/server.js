require('dotenv').config();
const express = require('express');
const http    = require('http');
const path    = require('path');
const fs      = require('fs');
const { Server } = require('socket.io');
const cors   = require('cors');

const app    = express();
const server = http.createServer(app);

// ── Dynamic CORS Configuration ────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
};

// ── Socket.io ──────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: corsOptions,
});
// Attach io to every request so routes can emit events
app.use((req, _res, next) => { req.io = io; next(); });

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.on('disconnect', () => console.log('🔌 Client disconnected:', socket.id));
});

// Export io for use in services
module.exports.io = io;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/hospitals',   require('./src/routes/hospitals'));
app.use('/api/donors',      require('./src/routes/donors'));
app.use('/api/recipients',  require('./src/routes/recipients'));
app.use('/api/matches',     require('./src/routes/matches'));
app.use('/api/transplants', require('./src/routes/transplants'));
app.use('/api/audit-log',   require('./src/routes/audit'));
app.use('/api/analytics',   require('./src/routes/analytics'));
app.use('/api/alerts',      require('./src/routes/alerts'));
app.use('/api/exchange',    require('./src/routes/exchange'));
app.use('/api/auth',        require('./src/routes/auth'));
app.use('/api/simulation',  require('./src/routes/simulation'));

// ── Initialize Autonomous Real-Time Hospital Daemon ─────────────
const liveSimulationService = require('./src/services/liveSimulationService');
liveSimulationService.init(io);

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Static Frontend Serving (Production Mode) ──────────────────────────────────
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🏥 VitalNode backend running on http://localhost:${PORT}`));

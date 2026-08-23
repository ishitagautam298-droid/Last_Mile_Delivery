const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

dotenv.config();

const NotificationService = require('./services/NotificationService');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

NotificationService.setSocketIO(io);

io.on('connection', (socket) => {
  console.log(`⚡ WebSocket client connected: ${socket.id}`);
  
  socket.on('join_order', (trackingNumber) => {
    socket.join(trackingNumber);
    console.log(`Socket ${socket.id} joined room: ${trackingNumber}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/zones', require('./routes/zoneRoutes'));
app.use('/api/rate-cards', require('./routes/rateCardRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/track', require('./routes/trackingRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Last-Mile Delivery Tracker API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lastmile_delivery_tracker';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('📦 Connected to MongoDB successfully.');
    // Pre-initialize notification transport
    await NotificationService.initializeTransporter();
    
    server.listen(PORT, () => {
      console.log(`🚀 Last-Mile Delivery Tracker Backend running on port ${PORT}`);
      console.log(`📡 API Health Check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = { app, server };

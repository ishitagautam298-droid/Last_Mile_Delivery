#!/bin/bash
echo "🛑 Stopping Last-Mile Delivery Tracker services..."
pkill -f "node src/server.js" || true
pkill -f "vite" || true
echo "✅ All services stopped."

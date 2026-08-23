#!/bin/bash
echo "🚀 Launching Last-Mile Delivery Tracker..."

# Start Backend
cd backend
npm start &
BACKEND_PID=$!
echo "Backend running (PID: $BACKEND_PID) on port 5001"

# Start Frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend running (PID: $FRONTEND_PID) on port 5173"

echo "🌟 System is live at http://localhost:5173"
echo "Press Ctrl+C or run './stop.sh' to terminate."

wait

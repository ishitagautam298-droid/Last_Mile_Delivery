#!/bin/bash
echo "🚀 Setting up Last-Mile Delivery Tracker..."

echo "📦 1/3 Installing Backend Dependencies..."
cd backend && npm install

echo "🌱 2/3 Seeding Initial Database..."
npm run seed

echo "🎨 3/3 Installing Frontend Dependencies & Building..."
cd ../frontend && npm install
npm run build

echo "✅ Setup Complete! Run './start.sh' to launch the platform."

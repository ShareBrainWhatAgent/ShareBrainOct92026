#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Navigate to app directory
cd /var/www/sharebrain

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Restart the backend server
echo "🔄 Restarting server..."
pm2 restart sharebrain-backend

echo "✅ Deployment completed successfully!"

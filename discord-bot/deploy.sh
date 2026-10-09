#!/bin/bash

# ShareBrain Discord Bot Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Deploying ShareBrain Discord Bot..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo "❌ Don't run this script as root"
  exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
  exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
  echo "📦 Installing PM2..."
  npm install -g pm2
fi

# Create application directory
APP_DIR="/home/$(whoami)/sharebrain-discord-bot"
mkdir -p "$APP_DIR"

# Copy files
echo "📁 Copying application files..."
cp -r ./* "$APP_DIR/"
cd "$APP_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "❌ .env file not found. Please create it with your Discord and ShareBrain credentials."
  echo "📋 Copy .env.example to .env and fill in the values."
  exit 1
fi

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'sharebrain-discord-bot',
    script: 'index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start with PM2
echo "🚀 Starting bot with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
echo "⚙️  Setting up PM2 startup..."
pm2 startup

echo "✅ ShareBrain Discord Bot deployed successfully!"
echo "📊 Monitor with: pm2 monit"
echo "📋 View logs with: pm2 logs sharebrain-discord-bot"
echo "🔄 Restart with: pm2 restart sharebrain-discord-bot"
echo "🛑 Stop with: pm2 stop sharebrain-discord-bot"
#!/bin/bash
set -e

echo "⚡ Starting Spark Agent..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found. Copy .env.example to .env and configure."
  exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ required. Current: $(node -v)"
  exit 1
fi

# Build if dist doesn't exist or source is newer
if [ ! -d dist ] || [ src -nt dist ]; then
  echo "🔨 Building TypeScript..."
  npm run build
fi

# Create logs directory
mkdir -p logs/trades

echo "✅ Pre-flight checks passed"
echo "🚀 Launching agent loop..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

node dist/index.js

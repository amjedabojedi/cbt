#!/bin/bash

# CBT Application Deployment Script
# This script builds and deploys the CBT application properly

echo "🚀 Starting CBT Application Deployment..."

# Navigate to project directory
cd /var/www/cbt

# Stop the current PM2 process
echo "📦 Stopping current PM2 process..."
pm2 stop cbt-backend 2>/dev/null || true
pm2 delete cbt-backend 2>/dev/null || true

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf server-dist/

# Install dependencies (if needed)
echo "📥 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist/public" ]; then
    echo "❌ Frontend build failed - dist/public directory not found"
    exit 1
fi

if [ ! -f "server-dist/index.js" ]; then
    echo "❌ Backend build failed - server-dist/index.js not found"
    exit 1
fi

# Copy frontend files to the correct location
echo "📁 Copying frontend files to server-dist/public..."
cp -r dist/public server-dist/

# Verify the copy was successful
if [ ! -d "server-dist/public" ]; then
    echo "❌ Failed to copy frontend files to server-dist/public"
    exit 1
fi

# Set proper permissions
echo "🔐 Setting proper permissions..."
chown -R Resilience:Resilience /var/www/cbt/server-dist/
chmod -R 755 /var/www/cbt/server-dist/

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start server-dist/index.js --name "cbt-backend"

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Check if the application is running
sleep 3
if pm2 list | grep -q "cbt-backend.*online"; then
    echo "✅ Application deployed successfully!"
    echo "🌐 Backend is running on port 5000"
    echo "📊 PM2 Status:"
    pm2 list | grep cbt-backend
else
    echo "❌ Application failed to start"
    echo "📋 PM2 Logs:"
    pm2 logs cbt-backend --lines 10
    exit 1
fi

echo "🎉 Deployment completed successfully!"

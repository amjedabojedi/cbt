#!/bin/bash

# Quick fix for the current deployment issue
# Run this on your server to fix the missing public directory

echo "🔧 Fixing CBT deployment issue..."

# Navigate to the project directory
cd /var/www/cbt

# Stop the current PM2 process
echo "📦 Stopping current PM2 process..."
pm2 stop cbt-backend 2>/dev/null || true

# Copy the frontend files to the correct location
echo "📁 Copying frontend files to server-dist/public..."
if [ -d "dist/public" ]; then
    cp -r dist/public server-dist/
    echo "✅ Frontend files copied successfully"
else
    echo "❌ dist/public directory not found. Please run 'npm run build' first."
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
pm2 save

# Check if the application is running
sleep 3
if pm2 list | grep -q "cbt-backend.*online"; then
    echo "✅ Application fixed and running successfully!"
    echo "🌐 Backend is running on port 5000"
    echo "📊 PM2 Status:"
    pm2 list | grep cbt-backend
else
    echo "❌ Application failed to start"
    echo "📋 PM2 Logs:"
    pm2 logs cbt-backend --lines 10
    exit 1
fi

echo "🎉 Fix completed successfully!"

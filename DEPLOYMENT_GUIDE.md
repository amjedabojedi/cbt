# CBT Application Deployment Guide

## 🚀 Quick Fix for Current Issue

If you're experiencing the "Could not find the build directory" error, run this on your server:

```bash
# Navigate to your project directory
cd /var/www/cbt

# Stop the current PM2 process
pm2 stop cbt-backend
pm2 delete cbt-backend

# Copy frontend files to the correct location
cp -r dist/public server-dist/

# Set proper permissions
chown -R Resilience:Resilience /var/www/cbt/server-dist/
chmod -R 755 /var/www/cbt/server-dist/

# Start the application
pm2 start server-dist/index.js --name "cbt-backend"
pm2 save

# Check status
pm2 status
```

## 📋 Complete Deployment Process

### 1. Prerequisites
- Node.js and npm installed
- PM2 installed globally (`npm install -g pm2`)
- Nginx configured (see your existing config)
- Environment variables set up in `.env` file

### 2. Build and Deploy

```bash
# Navigate to project directory
cd /var/www/cbt

# Pull latest changes
git pull origin a-dev

# Install dependencies
npm install

# Build the application (this now includes copying frontend files)
npm run build

# Start with PM2
pm2 start server-dist/index.js --name "cbt-backend"

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

### 3. Nginx Configuration

Your existing Nginx configuration should work perfectly. Make sure it's pointing to:
- **Frontend**: `/var/www/cbt/server-dist/public/`
- **Backend API**: `http://127.0.0.1:5000`

### 4. Environment Variables

Make sure your `.env` file contains all necessary variables:

```env
# Database
DATABASE_URL=your_neon_database_url

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Email (SparkPost)
SPARKPOST_API_KEY=your_sparkpost_api_key

# Session
SESSION_SECRET=your_session_secret

# Other configurations...
```

### 5. SSL Certificate (if needed)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Troubleshooting

### Issue: "Could not find the build directory"
**Solution**: The frontend files are not in the correct location.
```bash
cp -r dist/public server-dist/
```

### Issue: PM2 process keeps restarting
**Solution**: Check the logs for errors.
```bash
pm2 logs cbt-backend
```

### Issue: API endpoints returning 404
**Solution**: Check if the backend is running on port 5000.
```bash
curl http://127.0.0.1:5000/api/auth/login
```

### Issue: Frontend not loading
**Solution**: Check Nginx configuration and file permissions.
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 Monitoring

### Check Application Status
```bash
pm2 status
pm2 logs cbt-backend
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Check Port Usage
```bash
sudo lsof -i :5000
sudo lsof -i :80
sudo lsof -i :443
```

## 🔄 Update Process

When you need to update the application:

```bash
cd /var/www/cbt
git pull origin a-dev
npm install
npm run build
pm2 restart cbt-backend
```

## 📁 Directory Structure After Deployment

```
/var/www/cbt/
├── dist/
│   └── public/          # Frontend build files
├── server-dist/
│   ├── index.js         # Backend build file
│   └── public/          # Frontend files (copied from dist/public)
├── client/              # Source code
├── server/              # Source code
└── shared/              # Shared code
```

## 🎯 Key Points

1. **Frontend files** are built to `dist/public/` by Vite
2. **Backend files** are built to `server-dist/index.js` by esbuild
3. **Frontend files** are copied to `server-dist/public/` during build
4. **PM2** runs the backend from `server-dist/index.js`
5. **Nginx** serves static files from `server-dist/public/` and proxies API calls to port 5000

This setup ensures that both frontend and backend are properly deployed and accessible through your Nginx configuration.

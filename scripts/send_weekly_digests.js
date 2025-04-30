#!/usr/bin/env node

/**
 * Send weekly progress digest emails to all users
 * 
 * This script is designed to be run by a cron job, e.g.:
 * 0 8 * * 1 /path/to/node /path/to/send_weekly_digests.js
 * (This would run every Monday at 8:00 AM)
 */

const https = require('https');
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;  // You would need to implement API key auth

if (!ADMIN_API_KEY) {
  console.error('ADMIN_API_KEY environment variable is required');
  process.exit(1);
}

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_API_KEY}`
  }
};

const req = https.request(`${API_URL}/api/notifications/weekly-digests`, options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Weekly progress digests sent successfully:');
      console.log(responseData);
      process.exit(0);
    } else {
      console.error(`Failed to send digests. Status code: ${res.statusCode}`);
      console.error(responseData);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Error sending digests:', error);
  process.exit(1);
});

req.end();
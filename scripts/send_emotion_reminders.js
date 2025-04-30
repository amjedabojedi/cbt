#!/usr/bin/env node

/**
 * Send emotion tracking reminders to users who haven't tracked in 2 days
 * 
 * This script is designed to be run by a cron job, e.g.:
 * 0 10 * * * /path/to/node /path/to/send_emotion_reminders.js
 * (This would run daily at 10:00 AM)
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

// Default to 2 days without tracking
const data = JSON.stringify({
  daysWithoutTracking: 2
});

const req = https.request(`${API_URL}/api/notifications/emotion-reminders`, options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Emotion tracking reminders sent successfully:');
      console.log(responseData);
      process.exit(0);
    } else {
      console.error(`Failed to send reminders. Status code: ${res.statusCode}`);
      console.error(responseData);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Error sending reminders:', error);
  process.exit(1);
});

req.write(data);
req.end();
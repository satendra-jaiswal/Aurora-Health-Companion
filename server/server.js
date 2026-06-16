require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for Expo frontend (which can connect from localhost or local IP)
app.use(cors());

// Increase request limit for base64 audio uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Setup routes
app.use('/api', routes);

// Simple Status Check Endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'Aurora Health Companion Backend Server is running.',
    time: new Date()
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`  AURORA HEALTH COMPANION SERVER RUNNING`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Local status check: http://localhost:${PORT}/status`);
  console.log(`===============================================`);
});

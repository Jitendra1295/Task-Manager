const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Check server and database connectivity status
 * @access  Public (Used by CloudWatch, AWS ALB/Target Groups, Uptime Monitors)
 */
router.get('/', (req, res) => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = stateMap[mongoose.connection.readyState] || 'unknown';
  const memUsage = process.memoryUsage();

  const healthData = {
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbState,
      name: mongoose.connection.name || null,
    },
    system: {
      memoryRssMb: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
      memoryHeapUsedMb: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
    },
  };

  res.status(200).json(healthData);
});

module.exports = router;

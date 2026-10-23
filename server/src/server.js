const path = require('path');
// Load environment variables before any other module imports
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

// Catch uncaught synchronous exceptions (e.g., undefined variable reference)
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

let server;

// Start Server and Database Connection
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task_manager';
    await connectDB(mongoUri);

    server = app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(` Task Manager API is running`);
      console.log(` Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(` Port        : ${PORT}`);
      console.log(` Healthcheck : http://localhost:${PORT}/api/health`);
      console.log(`=========================================`);
    });
  } catch (err) {
    console.error('[Server] Failed to initialize server:', err.message);
    process.exit(1);
  }
};

startServer();

// Handle unhandled asynchronous promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[FATAL] Unhandled Promise Rejection:', err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown on process termination signals (SIGTERM from systemd/EC2/Docker, SIGINT from Ctrl+C)
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] ${signal} signal received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed. No longer accepting new connections.');
      await disconnectDB();
      console.log('[Server] Graceful shutdown completed.');
      process.exit(0);
    });

    // Force close if graceful shutdown takes too long (e.g. 10s timeout)
    setTimeout(() => {
      console.error('[Server] Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

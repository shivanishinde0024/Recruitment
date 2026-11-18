const app = require('./app');
const { PORT, NODE_ENV } = require('./config/env');
const prisma = require('./config/db');
const { seedDatabase } = require('../prisma/seed');

async function startServer() {
  if (process.env.USE_IN_MEMORY_DB === 'true' || NODE_ENV !== 'production') {
    try {
      await seedDatabase(prisma);
      console.log('🌱 Database initial data verified/seeded successfully');
    } catch (err) {
      console.warn('Database seed notice:', err.message);
    }
  }

  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Recruitment Portal API Server is running`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/v1/health`);
    console.log(`===============================================`);
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Closing HTTP server gracefully.');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received. Closing HTTP server gracefully.');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  });

  return server;
}

startServer();

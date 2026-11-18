const app = require('./app');
const { PORT, NODE_ENV } = require('./config/env');

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

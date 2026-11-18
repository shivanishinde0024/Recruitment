const { PrismaClient } = require('@prisma/client');
const { InMemoryPrismaClient } = require('./inMemoryPrisma');
const { USE_IN_MEMORY_DB } = require('./env');

// Global BigInt JSON serialization fix (Ruling 3.10)
BigInt.prototype.toJSON = function () {
  const n = Number(this);
  return Number.isSafeInteger(n) ? n : this.toString();
};

let prisma;

if (process.env.NODE_ENV === 'test' || USE_IN_MEMORY_DB) {
  if (!global.__inMemoryPrisma) {
    global.__inMemoryPrisma = new InMemoryPrismaClient();
  }
  prisma = global.__inMemoryPrisma;
} else if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: process.env.DEBUG_PRISMA ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;

/**
 * db/prismaClient.js
 * Singleton Prisma client instance.
 * Import this file everywhere instead of creating new PrismaClient() instances.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

module.exports = prisma;

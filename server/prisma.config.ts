// prisma.config.js

import "dotenv/config";

const user = process.env.DATABASE_USER || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const host = process.env.DATABASE_HOST || 'localhost';
const port = process.env.DATABASE_PORT || '3306';
const database = process.env.DATABASE_NAME || 'projectmanager';

const url = `mysql://${user}:${password}@${host}:${port}/${database}`;

export default {
  schema: "prisma/schema.prisma",

  migrations: {
    seed: "tsx prisma/seed.ts",
  },

  datasource: {
    url,
  },
};
// prisma.config.js

import dotenv from "dotenv";
import path from "path";

// Try loading .env from the root workspace folder first
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
// Fallback in case it's in the server folder
dotenv.config();

// Detect if we're running a local Prisma CLI command (like npm run prisma:seed)
const isLocalCLI = process.env.npm_lifecycle_event?.startsWith("prisma:") || !process.env.NODE_ENV;

const user = process.env.DATABASE_USER || 'root';
const password = process.env.DATABASE_PASSWORD || '';
// Force localhost/3307 when running CLI tools from Windows, otherwise use Docker env vars
const host = isLocalCLI ? 'localhost' : (process.env.DATABASE_HOST || 'localhost');
const port = isLocalCLI ? '3307' : (process.env.DATABASE_PORT || '3306');
const database = process.env.DATABASE_NAME || 'projectmanager';

const encodedPassword = encodeURIComponent(password);
const url = `mysql://${user}:${encodedPassword}@${host}:${port}/${database}`;

export default {
  schema: "prisma/schema.prisma",

  migrations: {
    seed: "tsx prisma/seed.ts",
  },

  datasource: {
    url,
  },
};
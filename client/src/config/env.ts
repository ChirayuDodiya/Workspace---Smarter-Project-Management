/**
 * Application environment configuration.
 *
 * In DEVELOPMENT (npm run dev):
 *   Defaults to separate localhost ports (Node: 5000, AI: 8000).
 *
 * In PRODUCTION (Docker / Nginx / EC2):
 *   Strictly disallows hardcoded localhost URLs.
 *   Uses relative paths (/api/v1, /api/v1/ai) so all requests route seamlessly
 *   through Nginx (Port 80) on any host, IP, or custom domain.
 */

const isProd = import.meta.env.PROD || import.meta.env.MODE === 'production';

function sanitizeUrl(envValue: string | undefined, defaultDev: string, defaultProd: string): string {
  // If explicitly configured
  if (envValue && envValue.trim() !== '') {
    // In production, guard against accidental localhost URLs baked into build
    if (isProd && (envValue.includes('localhost') || envValue.includes('127.0.0.1'))) {
      console.warn(
        `[Config Warning]: Ignoring localhost URL "${envValue}" in production build. Falling back to "${defaultProd}".`
      );
      return defaultProd;
    }
    return envValue;
  }

  return isProd ? defaultProd : defaultDev;
}

export const API_URL = sanitizeUrl(
  import.meta.env.VITE_API_URL,
  'http://localhost:5000/api/v1',
  '/api/v1'
);

export const AI_API_URL = sanitizeUrl(
  import.meta.env.VITE_AI_API_URL,
  'http://localhost:8000/api/v1/ai',
  '/api/v1/ai'
);

export const SOCKET_URL = sanitizeUrl(
  import.meta.env.VITE_SOCKET_URL,
  'http://localhost:5000',
  '' // In production, empty string connects Socket.io to window.location.origin
);

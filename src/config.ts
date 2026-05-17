import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

export interface AppConfig {
  databaseUrls: string[];
  cronSchedule: string;
  pingTimeoutMs: number;
  maxRetries: number;
}

export function parseConfig(): AppConfig {
  const rawUrls = process.env.DATABASE_URLS;
  if (!rawUrls) {
    throw new Error('DATABASE_URLS environment variable is required');
  }

  // Parse comma-separated database URLs and filter out empty strings
  const databaseUrls = rawUrls
    .split(',')
    .map(url => url.trim())
    .filter(url => url.length > 0);

  if (databaseUrls.length === 0) {
    throw new Error('DATABASE_URLS must contain at least one valid connection string');
  }

  // Cron schedule defaults to every 3 days at midnight: "0 0 */3 * *"
  const cronSchedule = process.env.CRON_SCHEDULE || '0 0 */3 * *';

  // Timeout defaults to 10 seconds (10000ms)
  const pingTimeoutMs = parseInt(process.env.PING_TIMEOUT_MS || '10000', 10);
  if (isNaN(pingTimeoutMs) || pingTimeoutMs <= 0) {
    throw new Error('PING_TIMEOUT_MS must be a positive integer');
  }

  // Max retries defaults to 3
  const maxRetries = parseInt(process.env.MAX_RETRIES || '3', 10);
  if (isNaN(maxRetries) || maxRetries < 0) {
    throw new Error('MAX_RETRIES must be a non-negative integer');
  }

  return {
    databaseUrls,
    cronSchedule,
    pingTimeoutMs,
    maxRetries,
  };
}

let loadedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!loadedConfig) {
    loadedConfig = parseConfig();
  }
  return loadedConfig;
}

export function resetConfig(): void {
  loadedConfig = null;
}

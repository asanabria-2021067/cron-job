import * as fs from 'fs';
import * as path from 'path';

export interface LogData {
  timestamp: string;
  instance: string;
  status: 'SUCCESS' | 'FAILURE';
  query: string;
  duration_ms: number;
  attempt: number;
  error?: {
    message: string;
    code?: string;
  };
}

const LOG_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOG_DIR, 'keepalive.log');

// Ensure log directory exists
export function ensureLogDirectory(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

// Sanitizes standard PostgreSQL connection string passwords
export function sanitizeInstanceHost(connectionString: string): string {
  try {
    // Standard connection string: postgresql://[user]:[password]@[host]:[port]/[db]
    const parsed = new URL(connectionString);
    return parsed.host; // Returns host:port, stripping out user:password and db path
  } catch (error) {
    // If not a valid URL, replace password if pattern matches
    return connectionString.replace(/:([^:@]+)@/, ':****@');
  }
}

export function logInfo(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] INFO: ${message}`);
}

export function logError(message: string, error?: unknown): void {
  const timestamp = new Date().toISOString();
  let errDetails = '';
  if (error instanceof Error) {
    errDetails = `: ${error.message}`;
  } else if (error) {
    errDetails = `: ${String(error)}`;
  }
  console.error(`[${timestamp}] ERROR: ${message}${errDetails}`);
}

export function logExecution(data: LogData): void {
  ensureLogDirectory();
  const logLine = JSON.stringify(data) + '\n';
  
  // Write to console
  const timestamp = new Date().toISOString();
  if (data.status === 'SUCCESS') {
    console.log(
      `[${timestamp}] SUCCESS: ${data.instance} (Duration: ${data.duration_ms}ms, Query: ${data.query})`
    );
  } else {
    const errMsg = data.error ? ` Error: ${data.error.message}` : '';
    console.error(
      `[${timestamp}] FAILURE: ${data.instance} (Duration: ${data.duration_ms}ms, Attempt: ${data.attempt}/${data.error ? 'max' : '?'})${errMsg}`
    );
  }

  // Append to log file with rotation (10MB limit)
  try {
    const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size > MAX_LOG_SIZE) {
        const rotationTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(LOG_DIR, `keepalive.${rotationTimestamp}.log`);
        fs.renameSync(LOG_FILE, backupPath);
        console.log(`[${timestamp}] INFO: Log file exceeded 10MB limit and was rotated to ${backupPath}`);
      }
    }
    fs.appendFileSync(LOG_FILE, logLine, 'utf8');
  } catch (err) {
    console.error(`[${timestamp}] Failed to write log to file:`, err);
  }
}

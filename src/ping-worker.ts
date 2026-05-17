import { Client } from 'pg';
import { sanitizeInstanceHost, logExecution, logInfo, logError } from './logger';

export interface PingOptions {
  timeoutMs: number;
  maxRetries: number;
  query?: string;
}

export interface PingResult {
  instanceHost: string;
  success: boolean;
  durationMs: number;
  query: string;
  attempt: number;
  error?: {
    message: string;
    code?: string;
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function pingInstance(
  connectionString: string,
  options: PingOptions
): Promise<PingResult> {
  const instanceHost = sanitizeInstanceHost(connectionString);
  const queryText = options.query || 'SELECT 1;';
  let attempt = 0;
  
  while (attempt < options.maxRetries) {
    attempt++;
    const startTime = Date.now();
    
    // Set up postgres client with timeouts
    const client = new Client({
      connectionString,
      connectionTimeoutMillis: options.timeoutMs,
      statement_timeout: options.timeoutMs,
      query_timeout: options.timeoutMs,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    try {
      logInfo(`Connecting to ${instanceHost} (Attempt ${attempt}/${options.maxRetries})...`);
      await client.connect();
      
      // Execute the keepalive check query
      await client.query(queryText);
      const durationMs = Date.now() - startTime;
      
      await client.end();
      
      const result: PingResult = {
        instanceHost,
        success: true,
        durationMs,
        query: queryText,
        attempt,
      };
      
      // Log the successful execution
      logExecution({
        timestamp: new Date().toISOString(),
        instance: instanceHost,
        status: 'SUCCESS',
        query: queryText,
        duration_ms: durationMs,
        attempt,
      });

      return result;
    } catch (err: any) {
      // Clean up the client to prevent connection leakage
      try {
        await client.end();
      } catch (_) {
        // Ignore errors during cleanup of failed connection
      }

      const durationMs = Date.now() - startTime;
      logError(`Connection or query failed on ${instanceHost} (Attempt ${attempt}/${options.maxRetries})`, err);

      if (attempt >= options.maxRetries) {
        // Log final failure outcome
        const result: PingResult = {
          instanceHost,
          success: false,
          durationMs,
          query: queryText,
          attempt,
          error: {
            message: err.message || 'Unknown connection error',
            code: err.code,
          },
        };

        logExecution({
          timestamp: new Date().toISOString(),
          instance: instanceHost,
          status: 'FAILURE',
          query: queryText,
          duration_ms: durationMs,
          attempt,
          error: {
            message: err.message || 'Unknown connection error',
            code: err.code,
          },
        });

        return result;
      }

      // Exponential backoff wait: 1s, 2s, 4s...
      const backoffMs = Math.pow(2, attempt - 1) * 1000;
      logInfo(`Retrying connection to ${instanceHost} in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }

  // Fallback (should not be reached logically due to while loop check, but TS requires return)
  return {
    instanceHost,
    success: false,
    durationMs: 0,
    query: queryText,
    attempt: options.maxRetries,
    error: { message: 'Max retries reached without connection completion' },
  };
}

export async function pingAllInstances(
  urls: string[],
  options: PingOptions
): Promise<PingResult[]> {
  logInfo(`Starting manual ping check for ${urls.length} instances...`);
  
  // Execute pings in parallel to satisfy performance goals and prevent blockage
  const pingPromises = urls.map((url) => pingInstance(url, options));
  const results = await Promise.all(pingPromises);
  
  logInfo('Finished keep-alive pings across all databases.');
  return results;
}

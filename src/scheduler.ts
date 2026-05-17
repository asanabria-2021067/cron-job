import * as cron from 'node-cron';
import { getConfig } from './config';
import { pingAllInstances } from './ping-worker';
import { logInfo, logError } from './logger';

let cronTask: cron.ScheduledTask | null = null;

export function startScheduler(): void {
  const config = getConfig();
  logInfo('Initializing background keep-alive scheduler...');
  logInfo(`Configured Cron Schedule: "${config.cronSchedule}"`);
  logInfo(`Number of target databases: ${config.databaseUrls.length}`);

  // Validate the cron expression
  if (!cron.validate(config.cronSchedule)) {
    throw new Error(`Invalid cron schedule expression: "${config.cronSchedule}"`);
  }

  // Schedule the task
  cronTask = cron.schedule(config.cronSchedule, async () => {
    logInfo('Scheduled event triggered. Executing keep-alive database pings...');
    try {
      await pingAllInstances(config.databaseUrls, {
        timeoutMs: config.pingTimeoutMs,
        maxRetries: config.maxRetries,
      });
      logInfo('Scheduled keep-alive check completed successfully.');
    } catch (err) {
      logError('Scheduled keep-alive execution encountered a critical error', err);
    }
  });

  logInfo('Supabase Keep-Alive Scheduler is running and waiting for events.');
}

export function stopScheduler(): void {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logInfo('Supabase Keep-Alive Scheduler stopped.');
  }
}

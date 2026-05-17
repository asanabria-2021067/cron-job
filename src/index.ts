import { getConfig } from './config';
import { pingAllInstances } from './ping-worker';
import { logInfo, logError } from './logger';

export async function runManualPing(): Promise<boolean> {
  try {
    const config = getConfig();
    const results = await pingAllInstances(config.databaseUrls, {
      timeoutMs: config.pingTimeoutMs,
      maxRetries: config.maxRetries,
    });

    const failedCount = results.filter((res) => !res.success).length;
    if (failedCount > 0) {
      logError(`Manual keep-alive finished with ${failedCount} failures.`);
      return false;
    }

    logInfo('All Supabase instances kept alive successfully!');
    return true;
  } catch (error) {
    logError('Critical error during manual execution', error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isPingMode = args.includes('--ping') || args.length === 0;
  const isStartMode = args.includes('--start');

  if (isStartMode) {
    logInfo('Starting background cron scheduler...');
    // In Phase 4, we will import and trigger the actual background cron coordinator here
    try {
      const { startScheduler } = require('./scheduler');
      startScheduler();
    } catch (err) {
      logError('Failed to start background scheduler (Phase 4 integration pending)', err);
      process.exit(1);
    }
  } else if (isPingMode) {
    const success = await runManualPing();
    process.exit(success ? 0 : 1);
  } else {
    logError(`Unknown argument(s): ${args.join(' ')}. Use --ping or --start.`);
    process.exit(1);
  }
}

// Only run main if file is executed directly (not imported as module in tests)
if (require.main === module) {
  main();
}

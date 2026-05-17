# CLI & Module Interface Contract: Supabase Instance Keep-Alive

## 1. CLI Commands & Arguments
The application is executed via command-line arguments using Node.js.

### Manual Run Command
Immediately triggers a keep-alive execution for all configured database instances, bypasses the cron scheduler, and outputs results.

```bash
npm run ping
```

* **Output (Success)**:
  ```text
  [2026-05-17T12:00:00.000Z] PINGING: aws-1-us-west-2.pooler.supabase.com...
  [2026-05-17T12:00:00.250Z] SUCCESS: aws-1-us-west-2.pooler.supabase.com (Duration: 250ms, Query: SELECT 1;)
  [2026-05-17T12:00:00.255Z] PINGING: aws-1-us-east-1.pooler.supabase.com...
  [2026-05-17T12:00:00.480Z] SUCCESS: aws-1-us-east-1.pooler.supabase.com (Duration: 225ms, Query: SELECT 1;)
  ```

* **Output (Failure)**:
  ```text
  [2026-05-17T12:00:00.000Z] PINGING: aws-1-us-west-2.pooler.supabase.com...
  [2026-05-17T12:00:05.000Z] ERROR: aws-1-us-west-2.pooler.supabase.com failed to connect (Attempt 1/3)
  [2026-05-17T12:00:07.000Z] ERROR: aws-1-us-west-2.pooler.supabase.com failed to connect (Attempt 2/3)
  [2026-05-17T12:00:11.000Z] ERROR: aws-1-us-west-2.pooler.supabase.com failed to connect (Attempt 3/3)
  [2026-05-17T12:00:11.005Z] FAILURE: aws-1-us-west-2.pooler.supabase.com completely failed after 3 attempts. Error: Connection timeout.
  ```

---

### Scheduler Daemon Command
Starts the continuous background cron scheduler.

```bash
npm start
```

* **Output**:
  ```text
  [2026-05-17T12:00:00.000Z] STARTING: Supabase Keep-Alive Scheduler
  [2026-05-17T12:00:00.005Z] CONFIG: Loaded 2 databases
  [2026-05-17T12:00:00.010Z] SCHEDULE: Every 3 days (0 0 */3 * *)
  ```

---

## 2. Programmatic API Contract
The main worker functionality can be imported programmatically inside other Node.js services.

### `pingInstance(connectionString: string, options?: PingOptions): Promise<PingResult>`
Executes a single keep-alive ping on the target connection string.

* **PingOptions Schema**:
  ```typescript
  interface PingOptions {
    timeoutMs?: number;
    query?: string;
  }
  ```

* **PingResult Schema**:
  ```typescript
  interface PingResult {
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
  ```

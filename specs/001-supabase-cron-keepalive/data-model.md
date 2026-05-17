# Data Model & Configuration Schema: Supabase Instance Keep-Alive

## 1. Environment Configuration Schema
The application requires the following environment variables. They must be defined in a `.env` file at the root level.

| Environment Variable | Format | Required | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URLS` | Comma-separated list of connection strings | Yes | The PostgreSQL transaction pooler URLs to ping. |
| `CRON_SCHEDULE` | Standard Crontab syntax (`* * * * *`) | No | Schedule of the check. Defaults to `0 0 */3 * *` (every 3 days). |
| `PING_TIMEOUT_MS` | Integer | No | Milliseconds to wait before database connection timeout. Defaults to `10000` (10s). |
| `MAX_RETRIES` | Integer | No | Number of connection retries. Defaults to `3`. |
| `BACKOFF_FACTOR_MS`| Integer | No | Multiplier for exponential backoff. Defaults to `1000`. |

---

## 2. Audit Execution Log (JSON Schema)
Every execution writes a structured JSON entry to `stdout` and is appended to `logs/keepalive.log`.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "KeepAliveExecutionLog",
  "type": "object",
  "properties": {
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 UTC timestamp of execution."
    },
    "instance": {
      "type": "string",
      "description": "Sanitized database host (sensitive passwords/credentials removed)."
    },
    "status": {
      "type": "string",
      "enum": ["SUCCESS", "FAILURE"],
      "description": "Result of the keep-alive check."
    },
    "query": {
      "type": "string",
      "description": "The exact SQL query executed (e.g. 'SELECT 1;')."
    },
    "duration_ms": {
      "type": "integer",
      "description": "Time elapsed in milliseconds to establish connection and run query."
    },
    "attempt": {
      "type": "integer",
      "description": "Which attempt this check represents (1 to MAX_RETRIES)."
    },
    "error": {
      "type": "object",
      "properties": {
        "message": { "type": "string" },
        "code": { "type": "string" }
      },
      "description": "Failure details if status is FAILURE."
    }
  },
  "required": ["timestamp", "instance", "status", "query", "duration_ms", "attempt"]
}
```

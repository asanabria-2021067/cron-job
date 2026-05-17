# Supabase Keep-Alive Cron Job Daemon

A lightweight, robust background scheduling daemon and CLI runner built with **Node.js, TypeScript, and node-cron** to prevent free-tier Supabase database instances from pausing due to inactivity.

---

## 🚀 Key Features

- **Multi-Instance Pinging**: Execute database connectivity keep-alive checks (`SELECT 1;`) across multiple target database instances in parallel.
- **Automated Scheduling**: Runs as a daemon in the background triggering pings periodically (defaults to every 3 days).
- **Exponential Backoff Retries**: Gracefully handles network blips by retrying failed connections up to 3 times with progressive delays.
- **Observability Audit Trail**: Appends structured JSON execution logs (duration, status, attempts, timestamp, host) to `logs/keepalive.log` with an automatic 10MB file rotation policy.
- **Credential Security**: Completely isolates credentials within local `.env` variables, preventing sensitive passwords from ever being checked into version control.

---

## 🛠️ Tech Stack

- **Core**: Node.js (v18+), TypeScript (v5+)
- **Database Connection**: `pg` (node-postgres) driver
- **Cron Engine**: `node-cron`
- **Testing**: Jest & `ts-jest`

---

## 📦 Project Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   # Comma-separated database pooler connection strings
   DATABASE_URLS=postgresql://postgres:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres,postgresql://postgres:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres

   # Cron execution interval (defaults to every 3 days at midnight: "0 0 */3 * *")
   CRON_SCHEDULE=0 0 */3 * *

   # Timeout threshold for each connection attempt (milliseconds)
   PING_TIMEOUT_MS=10000

   # Maximum connection retry attempts
   MAX_RETRIES=3
   ```

3. **Build the Application**:
   ```bash
   npm run build
   ```

---

## ⚙️ Running the Application

- **Manual Keep-Alive Ping (CLI Mode)**:
  Connects, pings all configured databases instantly, logs outcome, and exits.
  ```bash
  npm run ping
  ```

- **Scheduler Daemon (Background Service Mode)**:
  Starts the background cron coordinator daemon that remains active, scheduling pings every 3 days.
  ```bash
  npm start
  ```

---

## 🧪 Running Tests

A comprehensive suite of unit and integration tests with mocked pg connections validates configuration limits, query timeouts, backoff retry logic, and failures.

```bash
npm test
```

---

## 📁 Project Architecture

```text
├── .git/
├── .specify/            # Dev Agent Specifications
├── logs/
│   └── keepalive.log    # Structured JSON audit execution logs
├── specs/               # Requirements & Design Docs
├── src/
│   ├── config.ts        # Environment variable validator
│   ├── logger.ts        # Console & JSON rotating file logger
│   ├── ping-worker.ts   # pg Client connection & retry executor
│   ├── scheduler.ts     # node-cron task planner
│   └── index.ts         # Application entry CLI parser
├── tests/
│   ├── integration/
│   │   └── ping.test.ts # pg client retry/timeout integration tests
│   └── unit/
│       └── config.test.ts # Config validation unit tests
├── tsconfig.json
├── package.json
└── README.md
```

---

## 📄 Observability Schema Example

Every keep-alive connection attempt produces a structured record in `logs/keepalive.log`:

```json
{
  "timestamp": "2026-05-17T18:50:51.378Z",
  "instance": "aws-1-us-west-2.pooler.supabase.com:6543",
  "status": "SUCCESS",
  "query": "SELECT 1;",
  "duration_ms": 32,
  "attempt": 1
}
```

# Quickstart Guide: Supabase Instance Keep-Alive

This guide describes how to run and test the keep-alive script locally.

## Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)

---

## 1. Setup Environment
Clone the repository and install the initial dependencies:

```bash
npm install
```

Create a `.env` file in the root of the project:

```ini
# Comma-separated list of database transaction pooler URLs
# Note: Port 6543 is used for Supabase Transaction Poolers
DATABASE_URLS=postgresql://postgres.zpzhtnumrnfoyqwfirkr:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres,postgresql://postgres.qypqijwjognsmyaadgfh:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres

# Cron Schedule (Every 3 days at midnight)
CRON_SCHEDULE=0 0 */3 * *

# Timeouts & Retries
PING_TIMEOUT_MS=10000
MAX_RETRIES=3
```

---

## 2. Running Locally

### Direct Connectivity Verification
To immediately verify connection and execute the keep-alive ping on all target instances:

```bash
npm run ping
```

---

### Start Scheduler Service
To start the scheduling daemon in the background (which runs the keep-alive task according to your `CRON_SCHEDULE`):

```bash
npm start
```

---

## 3. Local Verification & Log Monitoring
When running, the scheduler appends all activities and errors into a local log file:

* **File Location**: `logs/keepalive.log`
* **Command to monitor logs in real-time (Linux/Mac)**: `tail -f logs/keepalive.log`
* **Command to monitor logs in real-time (Windows PowerShell)**: `Get-Content -Path logs/keepalive.log -Wait`

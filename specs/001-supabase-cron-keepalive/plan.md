# Implementation Plan: Supabase Instance Keep-Alive

**Branch**: `001-supabase-cron-keepalive` | **Date**: 2026-05-17 | **Spec**: [specs/001-supabase-cron-keepalive/spec.md](spec.md)

**Input**: Feature specification from `specs/001-supabase-cron-keepalive/spec.md`

---

## Summary
The goal is to build a reliable, lightweight background daemon in Node.js that connects to multiple Supabase PostgreSQL transaction pooler endpoints every 3 days and executes a standard keep-alive query (`SELECT 1;`). This counts as active traffic to the database, preventing Supabase's free-tier automatic pausing mechanism (which occurs after 7 days of inactivity).

---

## Technical Context

- **Language/Version**: Node.js (v18+ or v20+) / TypeScript
- **Primary Dependencies**: `pg` (node-postgres), `node-cron`, `dotenv`, `typescript`
- **Storage**: Structured file logging (`logs/keepalive.log`), no relational database needed for state tracking.
- **Testing**: `jest`, `ts-jest` for unit and integration testing.
- **Target Platform**: VPS Server (Linux/Windows), local service, or Docker Container.
- **Project Type**: Background utility / scheduler daemon.
- **Performance Goals**: Ping executions completed in < 3 seconds per instance.
- **Constraints**: Memory usage < 50MB, zero credential leaks, robust network timeout handling (10 seconds), 3 retries max per instance.
- **Scale/Scope**: Scales to manage 2 to 50+ Supabase database instances.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The design conforms fully to the core principles established in the **Supabase Cron Request Scheduler Constitution**:

- **I. Reliability Gate**: Integrated `node-cron` for scheduling, coupled with an explicit retry loop implementing a 10s connection timeout and exponential backoff.
- **II. Security Gate**: Strict credential isolation. All connection URIs and passwords live exclusively in local `.env` and are loaded via `dotenv`. The `.env` file is excluded from version control via `.gitignore`.
- **III. Observability Gate**: Every execution compiles a JSON log containing hostnames, query status, duration, attempts, and error objects, written directly to `stdout` and appended to `logs/keepalive.log`.
- **IV. Alerting Gate**: Connection failures do not interrupt other targets. Failures are written to the standard error stream and captured by the log auditor.
- **V. Simplicity Gate**: Zero-overhead design. Uses standard lightweight Node.js libraries (`pg` and `node-cron`), avoiding heavy dependencies like Prisma or databases.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-supabase-cron-keepalive/
├── plan.md              # This file
├── research.md          # Technology decisions and rationales
├── data-model.md        # Environment variables & JSON log schemas
├── quickstart.md        # setup & local validation instructions
├── checklists/
│   └── requirements.md  # Spec Quality Checklist (✅ PASSED)
└── contracts/
    └── cli-contract.md  # CLI and Programmatic API definition
```

### Source Code (repository root)

We select **Option 1: Single project** as it fits the simple background utility nature perfectly:

```text
src/
├── config.ts            # Environment variable validation & loading
├── logger.ts            # Structured JSON & file logger
├── ping-worker.ts       # Database connection helper & query executor
├── scheduler.ts         # Cron scheduler configuration
└── index.ts             # Application entry point (Manual run or Start scheduler)

tests/
├── unit/
│   └── config.test.ts   # Config validation testing
└── integration/
    └── ping.test.ts     # Mocked connection and query failure testing
```

**Structure Decision**: A single lightweight TypeScript Node.js project. It keeps code organization clean and easy to maintain while separating config parsing, logging, database worker execution, and cron scheduling logic into dedicated files.

---

## Complexity Tracking

No constitution check violations. The design adheres strictly to the simplicity, security, and reliability rules of the project.

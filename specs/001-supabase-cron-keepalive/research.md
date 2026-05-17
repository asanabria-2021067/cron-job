# Research & Decisions: Supabase Instance Keep-Alive

## Technical Overview
The objective is to build a reliable, lightweight cron service that connects to multiple Supabase PostgreSQL transaction poolers and executes a simple SQL check (`SELECT 1;`) at regular intervals. This keeps the free-tier Supabase instances active, preventing them from being paused due to inactivity.

---

## 1. Database Connection & Client Library
* **Decision**: Node.js `pg` (node-postgres) library.
* **Rationale**: `pg` is the standard, highly efficient, and mature driver for PostgreSQL in Node.js. It natively supports SSL connection parameters (required by Supabase), parameterized queries, and custom pool/client timeout configurations.
* **Alternatives Considered**: 
  * *Prisma ORM*: Rejected as too heavy for a simple keep-alive ping script; introduces unnecessary compilation/client generation overhead.
  * *Sequelize / TypeORM*: Overkill for single `SELECT 1;` queries.

---

## 2. Scheduling Mechanism
* **Decision**: `node-cron` package.
* **Rationale**: Simple, dependency-free in-memory cron scheduler that parses standard Unix crontab syntax. Perfect for a lightweight service running in the background without needing a massive message queue.
* **Alternatives Considered**:
  * *Agenda / BullMQ*: Rejected because they require secondary storage (MongoDB or Redis), which violates our **Principle V (Lightweight Footprint)**.
  * *Systemd Cron*: While reliable, keeping it in-app makes the Node.js application completely self-contained and cross-platform (works on Windows, Linux, Docker).

---

## 3. Secret Configuration & Isolation
* **Decision**: `dotenv` and standard `process.env` validation.
* **Rationale**: Complies with **Principle II (Supabase Isolation & Security)**. All transaction pooler connection URLs and passwords will reside in a `.env` file, which is explicitly ignored in git (`.gitignore`).
* **Alternatives Considered**:
  * *Hardcoded credentials*: Strongly rejected as a security violation.
  * *Vault/Secrets Manager*: Overkill for a simple lightweight utility, but local environment variables are fully compatible with VPS secret managers.

---

## 4. Execution Logging & Observability
* **Decision**: Structured JSON logging to console (`stdout`/`stderr`) using standard formatting, plus optionally appending to a rotating log file in `logs/keepalive.log`.
* **Rationale**: Simplifies containerization (Docker logs) and local monitoring. In the future, this can easily be piped into external logging systems without changing the source code.
* **Alternatives Considered**:
  * *Storing logs in a separate Supabase Table*: Rejected for the MVP to prevent circular dependency (if the database is paused or unreachable, we cannot write the failure log!). Local file/console logs guarantee that failures are captured even if the target Supabase instances are completely down.

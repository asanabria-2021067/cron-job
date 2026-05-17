<!--
SYNC IMPACT REPORT
==================
- Version change: 0.0.0 (Template) → 1.0.0 (Ratified)
- Modified Principles:
  - PRINCIPLE_1: [PRINCIPLE_1_NAME] → I. Schedule Execution Reliability
  - PRINCIPLE_2: [PRINCIPLE_2_NAME] → II. Supabase Isolation & Authentication Security
  - PRINCIPLE_3: [PRINCIPLE_3_NAME] → III. Audit-Log and Execution Observability
  - PRINCIPLE_4: [PRINCIPLE_4_NAME] → IV. Fail-Safe Alerting & Resiliency
  - PRINCIPLE_5: [PRINCIPLE_5_NAME] → V. Lightweight Footprint & Serverless Simplicity
- Added Sections:
  - Tech Stack & Integration Constraints
  - Development Workflow & Testing Discipline
- Removed Sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ aligned)
  - .specify/templates/spec-template.md (✅ aligned)
  - .specify/templates/tasks-template.md (✅ aligned)
  - .specify/templates/checklist-template.md (✅ aligned)
- Follow-up TODOs: None
-->

# Supabase Cron Request Scheduler Constitution

## Core Principles

### I. Schedule Execution Reliability
Every scheduled cron job MUST trigger precisely at its configured interval. In case of network drops or Supabase instance cold starts, the system MUST perform retries with exponential backoff (up to 3 times) and log execution states without duplicate triggers.

### II. Supabase Isolation & Authentication Security
All communication with Supabase instances MUST utilize secure environment-variable-backed keys (API keys, service roles). Secrets MUST NEVER be hardcoded, logged, or exposed in API payloads or client responses. Strict CORS and role-based policies MUST restrict configuration management.

### III. Audit-Log and Execution Observability
Every job execution (trigger timestamp, response payload, HTTP status code, request duration, and error traces) MUST be recorded in a dedicated audit database. Observability metrics MUST be accessible via a dashboard for real-time monitoring and debugging.

### IV. Fail-Safe Alerting & Resiliency
Persistent target instance failures (e.g., Supabase instance paused or returning 5xx status codes consecutively) MUST trigger real-time developer notifications (e.g., Discord/Slack webhooks or email alerts). The scheduler itself MUST remain fully operational if individual jobs fail.

### V. Lightweight Footprint & Serverless Simplicity
The cron service MUST maintain a lightweight, zero-maintenance architecture, easily deployable to edge environments (e.g., Supabase Edge Functions, Vercel Crons, or a lightweight Docker container). It MUST avoid unnecessary database overhead or state tracking bloat.

## Tech Stack & Integration Constraints
- **Core Environment**: Node.js (TypeScript) / Express for the core HTTP API and scheduling layer.
- **Scheduling Library**: `node-cron` or `cron` package for local execution, with compatibility for serverless cron providers (e.g., Vercel Cron, Supabase PG Cron).
- **Supabase Integration**: Supabase JavaScript client SDK (`@supabase/supabase-js`) for querying cron job definitions and inserting audit logs into Supabase PostgreSQL.
- **Database Schema**: A dedicated schema `cron` in the target Supabase instance containing a `jobs` table (id, name, schedule, target_url, method, headers, payload, active) and an `execution_logs` table (id, job_id, status, response_body, execution_time_ms, created_at).

## Development Workflow & Testing Discipline
- **TDD Requirement**: Unit tests MUST cover cron parsing logic, request construction (with headers/secrets), and backoff retry logic.
- **Integration Testing**: Integration tests MUST verify DB connection, logging queries, and HTTP requests using mocked Supabase targets.
- **Deployment Gates**: Every PR must undergo linting, formatting check, and automated tests passing before being eligible for integration.

## Governance
This constitution is the governing document for the Supabase Cron Request Scheduler. All changes or additions to the system MUST comply with these principles.
- **Governance Authority**: Amendments to this constitution require a MINOR or MAJOR version bump and updates to all templates.
- **Review Process**: All pull requests must be validated against the principles defined in this constitution, particularly regarding scheduling reliability (Principle I) and authentication security (Principle II).
- **Guidance & Documentation**: Developers MUST use the `README.md` file for local setup, development commands, and environment variable configuration.

**Version**: 1.0.0 | **Ratified**: 2026-05-17 | **Last Amended**: 2026-05-17

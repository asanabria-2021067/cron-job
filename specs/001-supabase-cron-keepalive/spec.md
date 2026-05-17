# Feature Specification: Supabase Instance Keep-Alive

**Feature Branch**: `001-supabase-cron-keepalive`

**Created**: 2026-05-17

**Status**: Draft

**Input**: User description: "Se debe de tener un cron job que cada cierto tiempo de dias realice una peticion o dos a supabase, a cada una de las instancias de supabase. Para ello yo te adjuntare los transaction pools: [SUPABASE_POOLER_URL_1], [SUPABASE_POOLER_URL_2]. Ambos comparten la misma contraseña secreta."

## User Scenarios & Testing

### User Story 1 - Configure and Execute Database Keep-Alive (Priority: P1)

As an administrator, I want to securely configure connection strings for multiple Supabase PostgreSQL transaction pooler instances and run a direct connection check so that I can immediately verify they are active.

**Why this priority**: High priority because establishing database connectivity and executing queries is the fundamental MVP of the keep-alive tool. Without this, scheduling or alerts are useless.

**Independent Test**: The administrator can run a manual ping command passing the credentials, and the system successfully connects, executes the keep-alive query on both poolers, and reports success.

**Acceptance Scenarios**:

1. **Given** valid connection credentials for the two Supabase instances (US West 2 and US East 1) and the password, **When** the administrator runs the manual ping command, **Then** the application connects to both databases, executes the keep-alive query (`SELECT 1;`), and outputs a success confirmation for both.
2. **Given** invalid database credentials (e.g., incorrect host or password), **When** the ping command is run, **Then** the application attempts to connect, handles the error gracefully, and returns a detailed failure message without crashing.

---

### User Story 2 - Automated Execution and Cron Scheduling (Priority: P2)

As an administrator, I want the keep-alive task to execute automatically on a configurable periodic schedule so that the Supabase instances are kept active and prevented from pausing without manual intervention.

**Why this priority**: Medium-high priority. While connectivity is primary, automation is the key feature that keeps the databases active indefinitely.

**Independent Test**: Setting a short schedule (e.g., every 1 minute) and observing that the keep-alive queries are triggered automatically and successfully at each interval.

**Acceptance Scenarios**:

1. **Given** the application is running in automated mode with a specified schedule (every 3 days at midnight: `0 0 */3 * *`), **When** the scheduled time arrives, **Then** the application triggers the keep-alive process for all configured Supabase instances automatically.
2. **Given** a schedule configuration change, **When** the application is reloaded, **Then** it immediately schedules the task at the new interval.

---

### User Story 3 - Detailed Audit Logging and Alerting on Failure (Priority: P3)

As an administrator, I want to record the results of all keep-alive executions and receive real-time alerts if any instance fails to connect, so that I can proactively address issues before the database is paused.

**Why this priority**: Medium priority. Provides visibility and guarantees that any network issue or password change is immediately notified to the administrator.

**Independent Test**: Simulating an execution failure (e.g., by changing the password locally to an invalid value) and verifying that an audit log entry is written with the error details, and an alert is successfully dispatched.

**Acceptance Scenarios**:

1. **Given** a finished keep-alive execution, **When** the task completes, **Then** the system creates an audit record capturing the timestamp, target instance host, execution status (success/failure), connection duration, and any error trace.
2. **Given** a connection failure during execution, **When** the failure occurs, **Then** the system writes a failure log entry and triggers a failure notification (e.g., standard error stream, file system alert, or external webhook).

---

### Edge Cases

- **Supabase Cold Start / Delayed Connection**: Supabase instances might take longer to respond if they are on the verge of pausing. The system must support configurable connection timeout thresholds (e.g., 15 seconds) and retry queries up to 3 times before declaring a failure.
- **Concurrent DB Failures**: If one instance fails to respond, it must not prevent the keep-alive request from executing on the other instance.
- **Incorrect Credentials / Password Rotation**: The application must identify authentication-related errors (e.g. FATAL: password authentication failed) and log them with high visibility.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST connect securely to the target Supabase transaction poolers using PostgreSQL connection strings.
- **FR-002**: The connection password MUST be stored securely using environment variables or a `.env` configuration file, and never hardcoded in source files.
- **FR-003**: The system MUST execute the database query `SELECT 1;` to keep the connection pooler and database instance active.
- **FR-004**: The system MUST schedule tasks using standard cron-like syntax, executing automatically at the configured intervals.
- **FR-005**: The system MUST execute keep-alive checks in isolation (failure of instance A does not block check of instance B).
- **FR-006**: The system MUST record every execution attempt in an audit log (timestamp, instance URL, status, duration, error details).

### Key Entities

- **SupabaseInstance**: Represents a target database configuration, including the connection pooler URL, target host, port, database name, and username.
- **ExecutionAuditLog**: Represents a logged attempt to connect and execute the keep-alive query on a target database, containing status, response time, and error trace.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of configured Supabase instances are queried within 5 seconds of their scheduled cron trigger.
- **SC-002**: The system completes database queries in under 3 seconds per instance under normal network conditions.
- **SC-003**: 100% of execution outcomes, whether successful or failed, are preserved in the audit logs.
- **SC-004**: The system handles and logs connection failures gracefully, recovering fully without crashing.

## Assumptions

- **A-001**: The connection credentials and password are correct and shared between both transaction pooler instances.
- **A-002**: The target instances support standard TCP/IP connections via port 6543 (Supabase Transaction Pooler).
- **A-003**: The application will run as a lightweight Node.js service using `pg` (node-postgres) to connect directly to the transaction poolers.
- **A-004**: The keep-alive process requires no administrative schema changes or custom database functions in the Supabase instances; executing standard client connection checks or simple SELECTs is sufficient.

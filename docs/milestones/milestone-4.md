# Milestone 4: Production Operations Engine

Milestone 4 moves Afyalink closer to a real operating business without building the future facility marketplace expansion or AI matching engine.

## Implemented Scope

- operational notification delivery around `notification_outbox`
- delivery attempts and retry/backoff tracking
- safe log/null email provider default
- notification worker command
- payment context fields for provider references and callbacks
- M-PESA callback endpoint with redacted payload persistence and idempotency
- facility subscription payment lifecycle linkage
- student/pre-licensure operations visibility
- admin command center counters and work queues
- admin reporting summaries
- privacy request lifecycle
- frontend routes for reports, notifications, and privacy queues

## Explicitly Deferred

- live STK push initiation
- live SMTP/ESP adapter credentials
- automatic destructive privacy deletion
- CSV/PDF report export
- full provider reconciliation jobs
- facility marketplace expansion beyond current controlled publication/access model
- recommendation engine or AI matching

## Safety Guarantees

- pre-licensure candidates are still not publishable as licensed professionals
- provider callback payloads are redacted
- M-PESA secrets are environment-only
- notification admin views mask recipient emails
- privacy request admin views mask subject emails
- backend services remain authoritative for workflow state

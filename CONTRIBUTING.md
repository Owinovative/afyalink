# Contributing

Afyalink is a private healthcare trust platform. Contributions must protect security, privacy, and auditability.

## Development Rules

- Keep domain logic testable.
- Add tests for workflow transitions, payment rules, consent rules, and document security.
- Never add public document URLs.
- Never log secrets.
- Use explicit authorization checks for admin and facility workflows.
- Keep Milestone 1 focused on credential intake and review.

## Commit Standard

Use clear, direct commit messages:

- `Add credential readiness checks`
- `Add payment state machine`
- `Document private storage policy`


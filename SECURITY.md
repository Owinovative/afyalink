# Security Policy

Afyalink handles sensitive healthcare professional documents and identity data.

## Reporting Security Issues

Do not create a public GitHub issue for vulnerabilities.

Report privately to the repository owner with:

- affected area;
- steps to reproduce;
- impact;
- suggested fix if known.

## Security Rules

- Never commit `.env` files or secrets.
- Credential documents must be stored privately.
- Document access must be audited.
- Admin accounts should use MFA when implemented.
- Payment provider secrets must never be logged.
- All sensitive workflow transitions must be server-side.


# Facility Team Collaboration

Facility collaboration supports multi-user facility operations without weakening access controls.

## Roles

- `owner`
- `admin`
- `recruiter`
- `viewer`
- `billing_manager`

Permissions map to facility profile management, subscription operations, requisitions, candidate views, placement views, recommendations, interview requests, and member invitations.

## Invitations

Facility admins can create invitations with:

- facility ID;
- invited email;
- role;
- token hash;
- status;
- expiry;
- inviter.

Raw tokens are never persisted. Invitation delivery uses the notification outbox and email provider abstraction.

## API Summary

- `POST /api/facility/team/invitations`

Invite acceptance is intentionally limited to the token-hash foundation in this milestone; complete acceptance UX can build on the existing auth/account lifecycle.

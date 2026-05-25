# Matching Engine

Milestone 5 introduces a deterministic, explainable matching engine for facility requisitions.

## Eligibility First

Candidates must pass match eligibility before scoring:

- not a student awaiting license, except for explicitly student/attachment requisition types;
- email verified;
- profile and required credentials complete;
- current consent present;
- regulatory verification passed;
- interview completed where required;
- qualification allows matching;
- candidate is published or explicitly admin-matchable;
- professional is open to work unless admin override is explicitly introduced later;
- no blocking privacy or consent withdrawal state.

Students can appear in internal future-talent reporting but must not be surfaced as licensed candidates.

## Scoring

The v1 engine scores transparent dimensions:

- profession match;
- location match;
- availability match;
- experience match;
- credential and verification readiness;
- interview recommendation strength;
- facility type preference;
- employment type preference;
- urgency fit;
- publication/readiness state.

The score writes a `score_breakdown`, `eligibility_reasons`, and `risk_flags` record. Protected characteristics are not used or inferred.

## Human Review

Generated matches are not final decisions. Admins review score explanations, shortlist candidates manually, and approve any facility-facing rationale before sharing.

## API Summary

- `POST /api/admin/requisitions/{id}/matching-runs`
- `POST /api/admin/matches/{id}/ai-draft`

## Audit Events

Matching runs, AI draft generation, shortlist sharing, and placement creation are audit logged.

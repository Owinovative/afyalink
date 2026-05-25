# AI-Assisted Recommendation Governance

Milestone 5 adds an AI-ready recommendation assistant abstraction. The default adapter is deterministic and local.

## Allowed Uses

AI or local assistance may:

- summarize candidate fit;
- draft shortlist rationale;
- highlight missing information;
- suggest interview questions;
- draft facility-facing text for admin review.

## Prohibited Uses

AI must not:

- make final hiring decisions;
- auto-reject candidates;
- override backend eligibility rules;
- use protected characteristics;
- fabricate credentials, verification facts, or interview results;
- expose private documents or internal notes to facilities.

## Human Review

Any generated rationale is a draft. Admins must review and approve before sharing.

## Audit and Logging

`ai_assistance_logs` records:

- context type and ID;
- requester;
- provider/model;
- redacted prompt/output;
- status;
- review metadata.

No API keys or raw credential documents are stored.

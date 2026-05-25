# FHIR and SMART Readiness

Afyalink is not an EHR. Milestone 5 adds interoperability foundations only for future healthcare workforce integrations.

## Current Scope

The platform includes safe metadata mapping helpers for:

- FHIR `Practitioner`-style professional profile metadata;
- FHIR `Organization`-style facility metadata;
- FHIR `Appointment`-style interview/request metadata;
- FHIR `DocumentReference`-style credential metadata without exposing storage keys or files;
- audit/provenance mapping notes.

No clinical patient data is stored or exposed.

## Integration Connections

`integration_connections` records can store owner, provider type, status, scopes, and encrypted-reference placeholders. Real tokens must not be stored until an encryption/key-management design is implemented.

## SMART Future Path

Future SMART App Launch support should use:

- OAuth-based authorization;
- least-privilege scopes;
- backend token exchange services;
- explicit facility/EHR connection ownership;
- no unnecessary clinical data replication.

This is a readiness foundation, not a claim of FHIR or SMART certification.

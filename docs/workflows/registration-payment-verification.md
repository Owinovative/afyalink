# Registration, Payment, and Verification Engine

This document outlines the architecture, state machines, and security models governing Afyalink's unified onboarding engine for Professionals, Students, and Facilities.

## 1. Architecture

The registration engine strictly relies on a backend-authoritative state machine (`RegistrationStateMachine.php`). The frontend (`RegistrationFlow.tsx`) is a dumb client that simply renders the correct UI panel based on the current `status` returned by the API.

**Core Components:**
* **Database:** `registration_records`, `registration_payments`, `registration_email_otps`, `registration_decisions`.
* **Service Layer:** `RegistrationWorkflowService.php` handles all transitions, validation, and audit logging.
* **Controller:** `RegistrationController.php` exposes the specific state-transition endpoints.
* **Frontend:** A multi-step wizard (`RegistrationFlow.tsx`) intercepting the auth routes.

## 2. Registration State Machines

Transitions are strictly linear. No shortcuts are permitted.

### Professional
`Draft` → `Payment Pending` → `Payment Verified` → `Password Created` → `Email Verification Pending` → `Active`

### Student Awaiting License
`Draft` → `Payment Pending` → `Payment Verified` → `Password Created` → `Email Verification Pending` → `Active` (Student Track)
*(Post-registration Conversion: `License Upload` → `Admin Review` → `Professional Conversion`)*

### Facility
`Draft` → `Payment Pending` → `Payment Verified` → `Password Created` → `Email Verification Pending` → `Approval Pending` → `Active`

## 3. Payments & Validation
All accounts require a registration fee (KES 2,000 Professional, KES 1,000 Student, KES 5,000 Facility).
* **STK Push:** Initiates an async M-PESA prompt. The webhook (`/api/payments/mpesa/callback`) receives the response, redacts PII, and transitions the payment to `Verified` or `Rejected`.
* **Paybill (Manual):** User inputs an existing reference. Moves to `Pending` until an Admin verifies it via the command center.
* **Duplicate Protection:** Payment references are validated against existing `registration_payments` and main `payments` tables to prevent reuse.

## 4. OTP Verification Engine
* **Generation:** Secure 6-digit code.
* **Security:** Hashed in the database (`code_hash`).
* **Lifespan:** Expires in 15 minutes (900 seconds).
* **Rate Limiting:** Maximum 5 resends per hour; maximum 5 failed attempts per code before invalidation.

## 5. Security Model & Authorizations
* **No URL Bypassing:** The API strictly checks the `RegistrationStatus` enum before allowing operations (e.g., cannot create a password if payment is not `Verified`).
* **Endpoint Dismantling:** Legacy monolithic `/api/auth/register` endpoints were removed from `ApiKernel.php` to prevent direct POST bypassing.
* **Admin Gating:** All manual review actions (`adminQueue`, `adminUpdatePayment`, `adminReviewFacility`) are wrapped in the `$this->admin()` middleware enforcing the `admin` or `super_admin` backend role.

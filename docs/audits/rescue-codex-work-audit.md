# Recovery Audit: `rescue-codex-work` Branch
**Date:** Current
**Objective:** Finish Afyalink's Registration + Payment + Verification + Approval Engine. Ensure no account receives access until required registration steps are complete.

## 1. Completed Work
* **Database & Schema:** Complete. Migrations for `registration_records`, `registration_payments`, `registration_email_otps`, and `registration_decisions` are perfectly structured.
* **Domain State Machine:** Complete. `RegistrationStateMachine.php` accurately enforces the strict transitions requested (Draft → Payment Pending → Payment Verified → Password Created → OTP Pending → Email Verified → Active/Approval Pending).
* **Service Layer:** Complete. `RegistrationWorkflowService.php` contains the full business logic for initialization, STK push initiation, manual paybill validation, password creation, OTP generation/validation, and admin approvals.
* **Pricing & Configuration:** Complete. `RegistrationPricing.php` and `pricing.php` configs are loaded and mapping correctly to KES values.
* **Frontend Shells & Security:** Complete. `ProtectedPortalGate.tsx` and the `resolveRoleGroup` login logic are securely gating workspaces. E2E visual QA scripts are robust.

## 2. Partially Completed Work
* **Admin Workspace Visibility:** The `adminQueue` logic exists in the service, but the frontend views and API routes to actually render these queues in the Admin dashboard are not wired together.
* **M-PESA Webhook:** The payload parsing and logic (`handleMpesaCallback`) exist, but the public `/api/payments/mpesa/callback` route is not mapped to a controller to receive the POST request.

## 3. Missing Work
* **API Controllers (`RegistrationController.php`):** The service layer is isolated. We need a controller to expose `start`, `initiateStkPayment`, `submitPaybillReference`, `createPassword`, `verifyOtp`, and the Admin actions.
* **API Routing (`ApiKernel.php`):** None of the new registration state machine routes exist in the kernel.
* **Frontend Registration Flow:** `AuthForms.tsx` still calls the legacy `/api/auth/register` endpoints, expecting an immediate JWT. We must build the multi-step UI to handle the Draft → Payment → Password → OTP sequence.
* **Student Conversion Workflow:** The `StudentPrelicensureService` needs to be fully wired to ensure students cannot appear as professionals until the conversion state is approved.

## 4. Security Gaps
* **Registration Bypass:** Because the old `/api/auth/register` routes are still active in `ApiKernel.php`, users can bypass the payment and OTP engine entirely. These must be locked or deleted.
* **Rate Limiting:** Controller-level rate limiting is missing for OTP generation and Paybill reference submission to prevent brute-force abuse.

## 5. Testing Gaps
* **Integration Tests:** Need tests mapping the `RegistrationController` through to the `RegistrationWorkflowService`.
* **Invalid State Transition Tests:** Ensure the API returns `422` or `400` when a user tries to POST to `/api/registration/password` before the payment is verified.

## 6. Documentation Gaps
* `docs/workflows/registration-payment-verification.md` is currently missing and needs to be drafted to map the architecture, security model, and exact approval/conversion flows.

---

## 7. Exact Completion Plan

**Step 1: The API Glue (Backend)**
* Create `RegistrationController.php` to handle HTTP requests and pass them to `RegistrationWorkflowService`.
* Register the new `/api/registration/*` routes in `ApiKernel.php`.
* Delete or heavily lock down the legacy `/api/auth/register` routes.

**Step 2: The Multi-Step UI (Frontend)**
* Refactor `AuthForms.tsx` (or create a new `RegistrationFlow.tsx`) to support the step-by-step state machine. It must handle rendering the STK Push prompt, the Paybill input, the Password creation screen, and the 6-digit OTP input based on the current registration `status`.

**Step 3: Admin Visibility & Callbacks**
* Wire the `/api/payments/mpesa/callback` endpoint.
* Expose the `/api/admin/registrations` queue to the admin portal UI.

**Step 4: Documentation & Testing**
* Write `docs/workflows/registration-payment-verification.md`.
* Run PHPUnit and Playwright suites, fixing any breakages caused by removing the legacy registration routes.

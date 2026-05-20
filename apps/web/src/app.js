const API_BASE = window.AFYA_API_BASE ?? "http://localhost:8000";
let professionalToken = localStorage.getItem("afyalink.professionalToken") ?? "";
let adminToken = localStorage.getItem("afyalink.adminToken") ?? "";
let facilityToken = localStorage.getItem("afyalink.facilityToken") ?? "";
let latestProfessionalDashboard = null;
let latestFacilityDashboard = null;

const output = document.querySelector("#output");
const dashboardSummary = document.querySelector("#dashboardSummary");
const onboardingSteps = document.querySelector("#onboardingSteps");
const credentialList = document.querySelector("#credentialList");
const replacementList = document.querySelector("#replacementList");
const applicationList = document.querySelector("#applicationList");
const applicationDetail = document.querySelector("#applicationDetail");
const auditList = document.querySelector("#auditList");
const adminCounters = document.querySelector("#adminCounters");
const verificationCounters = document.querySelector("#verificationCounters");
const verificationList = document.querySelector("#verificationList");
const interviewCounters = document.querySelector("#interviewCounters");
const interviewList = document.querySelector("#interviewList");
const milestone2Detail = document.querySelector("#milestone2Detail");
const facilityDashboard = document.querySelector("#facilityDashboard");
const facilityCandidateList = document.querySelector("#facilityCandidateList");
const facilityCandidateDetail = document.querySelector("#facilityCandidateDetail");
const facilityPackageList = document.querySelector("#facilityPackageList");
const adminFacilityCounters = document.querySelector("#adminFacilityCounters");
const adminFacilityList = document.querySelector("#adminFacilityList");
const adminFacilityDetail = document.querySelector("#adminFacilityDetail");
const adminPublicationList = document.querySelector("#adminPublicationList");
const adminFacilityRequestList = document.querySelector("#adminFacilityRequestList");
const adminRecommendationRequestList = document.querySelector("#adminRecommendationRequestList");
const adminRecommendationPackageList = document.querySelector("#adminRecommendationPackageList");
const sessionState = document.querySelector("#sessionState");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function log(message, data = null) {
  output.textContent = `${message}${data ? `\n${JSON.stringify(data, null, 2)}` : ""}`;
}

function friendlyError(payload, fallback = "Request failed") {
  const messages = [];
  if (payload?.errors && typeof payload.errors === "object") {
    for (const [field, values] of Object.entries(payload.errors)) {
      messages.push(`${field}: ${Array.isArray(values) ? values.join(", ") : values}`);
    }
  }
  return messages.length ? messages.join(" ") : payload?.message || fallback;
}

async function api(path, { method = "GET", body = null, token = professionalToken } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  });
  const payload = await response.json().catch(() => ({ ok: false, message: "The API returned an unreadable response." }));
  if (!response.ok || !payload.ok) {
    throw new Error(friendlyError(payload));
  }
  return payload.data;
}

function bindAsync(selector, eventName, handler) {
  const target = document.querySelector(selector);
  if (!target) return;
  target.addEventListener(eventName, async (event) => {
    try {
      await handler(event);
    } catch (error) {
      log(error.message || "Request failed.");
    }
  });
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  let binary = "";
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function badge(status) {
  const value = escapeHtml(status || "missing");
  const kind = ["accepted", "confirmed", "approved", "verified", "active", "published", "shared", "qualified"].includes(status)
    ? "good"
    : ["rejected", "needs_replacement", "failed", "suspended", "expired", "cancelled", "withdrawn", "not_qualified"].includes(status)
      ? "bad"
      : "warn";
  return `<span class="badge ${kind}">${value}</span>`;
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function setButtonState(selector, disabled, reason = "") {
  const button = document.querySelector(selector);
  if (!button) return;
  button.disabled = Boolean(disabled);
  button.title = disabled ? reason : "";
}

function updateSessionState() {
  document.body.classList.toggle("has-professional-session", Boolean(professionalToken));
  document.body.classList.toggle("has-facility-session", Boolean(facilityToken));
  document.body.classList.toggle("has-admin-session", Boolean(adminToken));
  if (!sessionState) return;

  const sessions = [
    ["Professional", professionalToken],
    ["Facility", facilityToken],
    ["Admin", adminToken],
  ];
  sessionState.innerHTML = sessions
    .map(([label, token]) => `<span class="session-chip ${token ? "active" : ""}">${escapeHtml(label)} ${token ? "signed in" : "not signed in"}</span>`)
    .join("");
}

function requireId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} is missing. Refresh the workbench and try again.`);
  }
  return id;
}

function csvIds(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function renderSteps(data) {
  const readiness = data.readiness;
  const profileComplete = data.profile && !readiness.missing.some((item) => item.startsWith("profile."));
  const hasRequiredCredentials = !readiness.missing.some((item) => item.startsWith("credential."));
  const currentPayment = data.payments[0] ?? null;
  const steps = [
    ["1", "Email verification", data.account?.email_verified, data.account?.email_verified ? "Verified" : "Verify email before final submission"],
    ["2", "Professional profile", profileComplete, profileComplete ? "Profile complete" : "Save profession, license, county, and contact details"],
    ["3", "Credentials", hasRequiredCredentials && !readiness.warnings.length, hasRequiredCredentials ? "Documents uploaded" : "Upload required documents"],
    ["4", "Consent", data.consent.accepted_current, data.consent.accepted_current ? data.consent.current_version : "Accept current consent"],
    ["5", "Payment", Boolean(currentPayment), currentPayment ? `${currentPayment.intent_reference} (${currentPayment.status})` : "Create payment reference"],
    ["6", "Submit", readiness.ready, readiness.ready ? "Ready to submit" : "Blocked by backend readiness checks"],
  ];

  onboardingSteps.innerHTML = steps
    .map(
      ([number, title, done, caption]) => `
        <div class="step-card ${done ? "complete" : ""}">
          <span>${number}</span>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(caption)}</p>
        </div>
      `,
    )
    .join("");
}

function renderDashboard(data) {
  latestProfessionalDashboard = data;
  const readiness = data.readiness;
  const latestPayment = data.payments[0] ?? null;
  const application = data.application;
  const visibility = data.facility_visibility ?? {};
  dashboardSummary.innerHTML = `
    <span>${data.account?.email_verified ? "Email verified" : "Email not verified"}</span>
    <strong>${readiness.ready ? "Ready to submit" : "Not ready"}</strong>
    <p>Missing: ${readiness.missing.length ? escapeHtml(readiness.missing.join(", ")) : "None"}</p>
    <p>Warnings: ${readiness.warnings.length ? escapeHtml(readiness.warnings.join(", ")) : "None"}</p>
    <p>Payment: ${latestPayment ? `${escapeHtml(latestPayment.intent_reference)} (${escapeHtml(latestPayment.status)})` : "No payment reference yet"}</p>
    <p>Application: ${application ? `${escapeHtml(application.application_number)} (${escapeHtml(application.status)})` : "Not submitted"}</p>
    <p>Facility catalogue: ${visibility.status ? `${escapeHtml(visibility.status)} / ${escapeHtml(visibility.view_count ?? 0)} view${Number(visibility.view_count ?? 0) === 1 ? "" : "s"}` : "Not published"}</p>
    <p>Verification: ${
      data.verification_cases?.length
        ? `${escapeHtml(data.verification_cases[0].regulatory_body_code)} (${escapeHtml(data.verification_cases[0].status)})`
        : "Not started"
    }</p>
    <p>Interview: ${
      data.interviews?.length
        ? `${escapeHtml(data.interviews[0].status)} ${data.interviews[0].scheduled_start_at ? `/ ${escapeHtml(data.interviews[0].scheduled_start_at)}` : ""}`
        : "Not scheduled"
    }</p>
  `;

  renderSteps(data);
  const submittedStatuses = ["submitted", "under_review", "awaiting_verification", "verification_in_progress", "verification_passed", "interview_scheduled", "interview_completed", "qualified", "approved", "rejected"];
  setButtonState("#acceptConsent", data.consent.accepted_current, "Current consent is already accepted.");
  setButtonState("#createPayment", Boolean(latestPayment && ["pending_verification", "confirmed", "awaiting_provider"].includes(latestPayment.status)), "A payment reference already exists for this submission path.");
  setButtonState("#submitApplication", !readiness.ready || (application && submittedStatuses.includes(application.status)), readiness.ready ? "This application has already been submitted." : `Blocked: ${[...readiness.missing, ...readiness.warnings].join(", ")}`);

  const replacements = data.credentials.filter((credential) => credential.review_status === "needs_replacement");
  replacementList.innerHTML = replacements.length
    ? replacements
        .map(
          (credential) => `
            <div class="notice bad">
              <strong>${escapeHtml(credential.document_type)} needs replacement</strong>
              <p>${escapeHtml(credential.review_note || "Upload a clearer replacement document.")}</p>
            </div>
          `,
        )
        .join("")
    : "";

  credentialList.innerHTML = data.credentials.length
    ? data.credentials
        .map(
          (credential) => `
            <div class="list-item">
              <strong>${escapeHtml(credential.document_type)}</strong>
              ${badge(credential.review_status)}
              <p>${escapeHtml(credential.original_name)} / ${Math.round(credential.size_bytes / 1024)} KB</p>
              ${credential.review_note ? `<p class="muted">Reviewer note: ${escapeHtml(credential.review_note)}</p>` : ""}
            </div>
          `,
        )
        .join("")
    : emptyState("No credentials uploaded.");
}

async function refreshDashboard() {
  const data = await api("/api/professional/dashboard");
  renderDashboard(data);
  log("Dashboard refreshed.", data.readiness);
}

bindAsync("#registerForm", "submit", async (event) => {
  event.preventDefault();
  const data = await api("/api/auth/register", {
    method: "POST",
    body: formData(event.currentTarget),
    token: "",
  });
  professionalToken = data.token;
  localStorage.setItem("afyalink.professionalToken", professionalToken);
  updateSessionState();
  log("Professional registered. Verification message queued.", data.email_verification);
  await refreshDashboard();
});

bindAsync("#loginForm", "submit", async (event) => {
  event.preventDefault();
  const data = await api("/api/auth/login", {
    method: "POST",
    body: formData(event.currentTarget),
    token: "",
  });
  professionalToken = data.token;
  localStorage.setItem("afyalink.professionalToken", professionalToken);
  updateSessionState();
  log("Professional signed in.", data.user);
  await refreshDashboard();
});

bindAsync("#verifyEmailForm", "submit", async (event) => {
  event.preventDefault();
  const data = await api("/api/auth/email/verify", {
    method: "POST",
    body: formData(event.currentTarget),
    token: "",
  });
  log("Email verification completed.", data);
  if (professionalToken) await refreshDashboard();
});

bindAsync("#resendVerification", "click", async () => {
  const data = await api("/api/auth/email/resend", { method: "POST", body: {} });
  log("Verification message queued.", data);
  await refreshDashboard();
});

bindAsync("#forgotPasswordForm", "submit", async (event) => {
  event.preventDefault();
  const data = await api("/api/auth/password/forgot", {
    method: "POST",
    body: formData(event.currentTarget),
    token: "",
  });
  log("Password reset request handled.", data);
});

bindAsync("#resetPasswordForm", "submit", async (event) => {
  event.preventDefault();
  const data = await api("/api/auth/password/reset", {
    method: "POST",
    body: formData(event.currentTarget),
    token: "",
  });
  professionalToken = "";
  localStorage.removeItem("afyalink.professionalToken");
  updateSessionState();
  log("Password reset completed. Sign in with the new password.", data);
});

bindAsync("#profileForm", "submit", async (event) => {
  event.preventDefault();
  const body = formData(event.currentTarget);
  body.years_experience = Number(body.years_experience || 0);
  const data = await api("/api/professional/profile", { method: "PUT", body });
  log("Profile saved.", data.profile);
  await refreshDashboard();
});

bindAsync("#credentialForm", "submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const file = data.get("file");
  const credential = await api("/api/professional/credentials", {
    method: "POST",
    body: {
      document_type: data.get("document_type"),
      original_name: file.name,
      mime_type: file.type || "application/pdf",
      content_base64: await fileToBase64(file),
    },
  });
  log("Credential uploaded.", credential);
  form.reset();
  await refreshDashboard();
});

bindAsync("#acceptConsent", "click", async () => {
  const data = await api("/api/professional/consents", { method: "POST", body: {} });
  log("Consent accepted.", data.consent);
  await refreshDashboard();
});

bindAsync("#createPayment", "click", async () => {
  if (!professionalToken) throw new Error("Sign in before creating a payment reference.");
  const data = await api("/api/professional/payments", {
    method: "POST",
    body: {
      method: "mpesa_manual_reference",
      amount_cents: 250000,
      idempotency_key: `web-${Date.now()}`,
    },
  });
  log("Payment reference created.", data.payment);
  await refreshDashboard();
});

bindAsync("#submitApplication", "click", async () => {
  if (!latestProfessionalDashboard?.readiness?.ready) {
    throw new Error(`Application is not ready: ${[...(latestProfessionalDashboard?.readiness?.missing ?? []), ...(latestProfessionalDashboard?.readiness?.warnings ?? [])].join(", ") || "refresh status first"}`);
  }
  const data = await api("/api/professional/application/submit", { method: "POST", body: {} });
  log("Application submitted.", data.application);
  await refreshDashboard();
});

bindAsync("#refreshDashboard", "click", refreshDashboard);

bindAsync("#adminLoginForm", "submit", async (event) => {
  event.preventDefault();
  const data = await api("/api/auth/login", {
    method: "POST",
    body: formData(event.currentTarget),
    token: "",
  });
  adminToken = data.token;
  localStorage.setItem("afyalink.adminToken", adminToken);
  updateSessionState();
  log("Admin signed in.", data.user);
  await loadApplications();
});

function renderAdminCounters(overview = {}) {
  const items = [
    ["Total", overview.total ?? 0],
    ["Awaiting review", overview.awaiting_review ?? 0],
    ["Needs replacement", overview.needs_replacement ?? 0],
    ["Ready", overview.ready_for_review ?? 0],
    ["Verification", overview.verification_in_progress ?? 0],
    ["Interview", overview.interview_scheduled ?? 0],
    ["Qualified", overview.qualified ?? 0],
    ["Approved", overview.approved ?? 0],
    ["Rejected", overview.rejected ?? 0],
  ];
  adminCounters.innerHTML = items
    .map(([label, value]) => `<div class="counter"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");
}

async function loadApplications(filters = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== null)),
  ).toString();
  const data = await api(`/api/admin/applications${query ? `?${query}` : ""}`, { token: adminToken });
  renderAdminCounters(data.overview);
  applicationList.innerHTML = data.applications.length
    ? data.applications
        .map(
          (application) => `
            <div class="list-item">
              <strong>${escapeHtml(application.application_number)}</strong>
              ${badge(application.status)}
              <p>${escapeHtml(application.professional.name)} / ${escapeHtml(application.professional.email)} / ${escapeHtml(application.professional.profession)} / ${escapeHtml(application.professional.county)}</p>
              <button class="mini-button secondary" data-open-application="${application.id}">Open review</button>
            </div>
          `,
        )
        .join("")
    : emptyState("No applications match the current filters.");
  log("Applications loaded.", data.overview);
}

bindAsync("#applicationSearchForm", "submit", async (event) => {
  event.preventDefault();
  await loadApplications(formData(event.currentTarget));
});

applicationList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-open-application]");
  if (!button) return;
  try {
    await openApplication(button.dataset.openApplication);
  } catch (error) {
    log(error.message || "Could not open application.");
  }
});

function timelineHtml(application) {
  const timeline = application.timeline ?? [];
  return timeline.length
    ? timeline
        .map(
          (event) => `
            <li>
              <strong>${escapeHtml(event.to)}</strong>
              <span>${escapeHtml(event.occurred_at)}</span>
              <p>${escapeHtml(event.note || "No note recorded.")}</p>
            </li>
          `,
        )
        .join("")
    : "<li>No timeline events recorded.</li>";
}

async function openApplication(id) {
  const applicationId = requireId(id, "Application ID");
  const data = await api(`/api/admin/applications/${applicationId}`, { token: adminToken });
  const { application, professional, profile, credentials, payments, consent } = data;
  const latestPayment = payments[0] ?? null;
  applicationDetail.dataset.currentApplicationId = String(application.id);
  const status = application.status;
  const actionAllowed = {
    start_review: ["submitted"].includes(status),
    request_replacement: ["submitted", "under_review", "resubmitted", "awaiting_verification", "verification_in_progress"].includes(status),
    verify: ["under_review"].includes(status),
    approve: ["verified", "verification_passed", "interview_completed", "qualified"].includes(status),
    reject: ["under_review", "verification_failed", "not_qualified"].includes(status),
    create_verification: ["submitted", "under_review"].includes(status),
    schedule_interview: ["verification_passed", "interview_scheduled"].includes(status),
  };
  const disabled = (allowed, reason) => `${allowed ? "" : "disabled"} title="${escapeHtml(allowed ? "" : reason)}"`;
  applicationDetail.innerHTML = `
    <div class="detail-grid">
      <section class="detail-section">
        <h3>Professional</h3>
        <p><strong>${escapeHtml(professional?.name ?? profile?.name ?? "-")}</strong></p>
        <p>${escapeHtml(professional?.email ?? profile?.email ?? "-")} / ${professional?.email_verified ? "verified" : "unverified"}</p>
        <p>${escapeHtml(profile?.profession ?? "-")} / ${escapeHtml(profile?.county ?? "-")}</p>
        <p>License: ${escapeHtml(profile?.regulatory_body ?? "-")} / ${escapeHtml(profile?.license_number ?? "-")}</p>
      </section>
      <section class="detail-section">
        <h3>Application</h3>
        <p>${escapeHtml(application.application_number)}</p>
        ${badge(application.status)}
        <p>Submitted: ${escapeHtml(application.submitted_at ?? "-")}</p>
        <p>Consent: ${escapeHtml(consent ? consent.version : "not accepted")}</p>
      </section>
      <section class="detail-section">
        <h3>Payment</h3>
        <p>${escapeHtml(latestPayment?.intent_reference ?? "No payment")}</p>
        ${badge(latestPayment?.status ?? "missing")}
        <p>${latestPayment ? `${escapeHtml(latestPayment.currency)} ${(latestPayment.amount_cents / 100).toFixed(2)}` : ""}</p>
      </section>
    </div>
    <div class="detail-section">
      <h3>Credentials</h3>
      ${
        credentials.length
          ? credentials
              .map(
                (credential) => `
                  <div class="list-item">
                    <strong>${escapeHtml(credential.document_type)}</strong>
                    ${badge(credential.review_status)}
                    <p>${escapeHtml(credential.original_name)} / checksum ${escapeHtml(credential.checksum.slice(0, 12))}...</p>
                    ${credential.review_note ? `<p class="muted">Note: ${escapeHtml(credential.review_note)}</p>` : ""}
                    <div class="action-row">
                      <button class="mini-button secondary" data-review-credential="${credential.id}" data-status="accepted">Accept</button>
                      <button class="mini-button secondary" data-review-credential="${credential.id}" data-status="needs_replacement">Needs replacement</button>
                      <button class="mini-button secondary" data-review-credential="${credential.id}" data-status="rejected">Reject</button>
                    </div>
                  </div>
                `,
              )
              .join("")
          : emptyState("No credentials are attached to this application.")
      }
    </div>
    <div class="detail-section">
      <h3>Timeline</h3>
      <ol class="timeline">${timelineHtml(application)}</ol>
    </div>
    <div class="review-actions">
      <button class="mini-button" data-application-action="start_review" data-application-id="${application.id}" ${disabled(actionAllowed.start_review, "Only submitted applications can enter review.")}>Start review</button>
      <button class="mini-button" data-application-action="request_replacement" data-application-id="${application.id}" ${disabled(actionAllowed.request_replacement, "Replacement requests are only valid while review or verification is open.")}>Request replacement</button>
      <button class="mini-button" data-application-action="verify" data-application-id="${application.id}" ${disabled(actionAllowed.verify, "Only under-review applications can use this legacy verify action.")}>Verify</button>
      <button class="mini-button" data-application-action="approve" data-application-id="${application.id}" ${disabled(actionAllowed.approve, "Only verified or qualified applications can be approved.")}>Approve</button>
      <button class="mini-button" data-application-action="reject" data-application-id="${application.id}" ${disabled(actionAllowed.reject, "Reject after review, verification failure, or not-qualified outcome.")}>Reject</button>
      <button class="mini-button secondary" data-create-verification="${application.id}" ${disabled(actionAllowed.create_verification, "Open verification from submitted or under-review applications.")}>Open verification case</button>
      <button class="mini-button secondary" data-schedule-interview="${application.id}" ${disabled(actionAllowed.schedule_interview, "Interviews can be scheduled only after verification passes.")}>Schedule interview</button>
    </div>
  `;
  log("Application detail loaded.", { application: application.application_number, status: application.status });
}

applicationDetail.addEventListener("click", async (event) => {
  const credentialButton = event.target.closest("[data-review-credential]");
  try {
    if (credentialButton) {
      const credentialId = requireId(credentialButton.dataset.reviewCredential, "Credential ID");
      const note = window.prompt("Review note", credentialButton.dataset.status === "needs_replacement" ? "Please upload a clearer replacement document." : "");
      await api(`/api/admin/credentials/${credentialId}/review`, {
        method: "PATCH",
        token: adminToken,
        body: {
          status: credentialButton.dataset.status,
          note,
        },
      });
      log("Credential review saved.");
      if (applicationDetail.dataset.currentApplicationId) {
        await openApplication(applicationDetail.dataset.currentApplicationId);
      }
      return;
    }

    const actionButton = event.target.closest("[data-application-action]");
    const verificationButton = event.target.closest("[data-create-verification]");
    const interviewButton = event.target.closest("[data-schedule-interview]");
    if (verificationButton) {
      const applicationId = requireId(verificationButton.dataset.createVerification, "Application ID");
      await api("/api/admin/verifications", {
        method: "POST",
        token: adminToken,
        body: {
          application_id: applicationId,
        },
      });
      await loadVerifications();
      await openApplication(applicationId);
      log("Verification case opened.");
      return;
    }
    if (interviewButton) {
      const applicationId = requireId(interviewButton.dataset.scheduleInterview, "Application ID");
      const start = window.prompt("Interview start time (ISO/local accepted)", new Date(Date.now() + 86400000).toISOString());
      const end = window.prompt("Interview end time (ISO/local accepted)", new Date(Date.now() + 90000000).toISOString());
      await api("/api/admin/interviews", {
        method: "POST",
        token: adminToken,
        body: {
          application_id: applicationId,
          scheduled_start_at: start,
          scheduled_end_at: end,
          mode: "remote",
          notes: "Scheduled from admin workbench.",
        },
      });
      await loadInterviews();
      await openApplication(applicationId);
      log("Interview scheduled.");
      return;
    }
    if (!actionButton) return;
    const applicationId = requireId(actionButton.dataset.applicationId, "Application ID");
    const note = window.prompt("Review note", `Admin action: ${actionButton.dataset.applicationAction}`);
    await api(`/api/admin/applications/${applicationId}/action`, {
      method: "PATCH",
      token: adminToken,
      body: {
        action: actionButton.dataset.applicationAction,
        note,
      },
    });
    await openApplication(applicationId);
  } catch (error) {
    log(error.message || "Admin action failed.");
  }
});

bindAsync("#loadAudit", "click", async () => {
  const data = await api("/api/admin/audit-logs", { token: adminToken });
  auditList.innerHTML = data.audit_logs.length
    ? data.audit_logs
        .map(
          (audit) => `
            <div class="list-item">
              <strong>${escapeHtml(audit.action)}</strong>
              <p>${escapeHtml(audit.entity_type)} #${escapeHtml(audit.entity_id ?? "-")} / ${escapeHtml(audit.created_at)}</p>
            </div>
          `,
        )
        .join("")
    : emptyState("No audit records loaded.");
  log("Audit logs loaded.", data.audit_logs.slice(0, 5));
});

function renderCounters(target, overview = {}) {
  target.innerHTML = Object.entries(overview)
    .map(([label, value]) => `<div class="counter"><span>${escapeHtml(label.replaceAll("_", " "))}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");
}

async function loadVerifications(filters = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== null)),
  ).toString();
  const data = await api(`/api/admin/verifications${query ? `?${query}` : ""}`, { token: adminToken });
  renderCounters(verificationCounters, data.overview);
  verificationList.innerHTML = data.verification_cases.length
    ? data.verification_cases
        .map(
          (item) => `
            <div class="list-item">
              <strong>${escapeHtml(item.regulatory_body_code)} / ${escapeHtml(item.license_number)}</strong>
              ${badge(item.status)}
              <p>${escapeHtml(item.professional.name)} / ${escapeHtml(item.professional.email)} / ${escapeHtml(item.professional.profession)}</p>
              <button class="mini-button secondary" data-open-verification="${item.id}">Open verification</button>
            </div>
          `,
        )
        .join("")
    : emptyState("No verification cases match the current filters.");
  log("Verification queue loaded.", data.overview);
}

async function openVerification(id) {
  const data = await api(`/api/admin/verifications/${id}`, { token: adminToken });
  const { case: verificationCase, application, professional, profile } = data;
  milestone2Detail.dataset.currentVerificationId = String(verificationCase.id);
  milestone2Detail.innerHTML = `
    <div class="detail-grid">
      <section class="detail-section">
        <h3>Professional</h3>
        <p><strong>${escapeHtml(professional?.name ?? profile?.name ?? "-")}</strong></p>
        <p>${escapeHtml(professional?.email ?? "-")} / ${escapeHtml(profile?.profession ?? "-")}</p>
        <p>License: ${escapeHtml(verificationCase.regulatory_body_code)} ${escapeHtml(verificationCase.license_number)}</p>
      </section>
      <section class="detail-section">
        <h3>Verification</h3>
        ${badge(verificationCase.status)}
        <p>${escapeHtml(verificationCase.regulatory_body_name)}</p>
        <p>Method: ${escapeHtml(verificationCase.verification_method)}</p>
      </section>
      <section class="detail-section">
        <h3>Application</h3>
        <p>${escapeHtml(application.application_number)}</p>
        ${badge(application.status)}
      </section>
    </div>
    <div class="detail-section">
      <h3>Evidence</h3>
      <p>Reference: ${escapeHtml(verificationCase.evidence_reference ?? "-")}</p>
      <p>${escapeHtml(verificationCase.evidence_notes ?? "No evidence notes recorded.")}</p>
      <p class="muted">${escapeHtml(verificationCase.final_decision_notes ?? "")}</p>
    </div>
    <div class="review-actions">
      <button class="mini-button secondary" data-verification-status="assigned">Assign</button>
      <button class="mini-button secondary" data-verification-status="in_progress">In progress</button>
      <button class="mini-button secondary" data-verification-status="awaiting_external_response">Await external</button>
      <button class="mini-button secondary" data-verification-status="needs_clarification">Needs clarification</button>
      <button class="mini-button" data-verification-status="verified">Verified</button>
      <button class="mini-button" data-verification-status="failed">Failed</button>
    </div>
  `;
  log("Verification detail loaded.", { id: verificationCase.id, status: verificationCase.status });
}

verificationList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-open-verification]");
  if (!button) return;
  try {
    await openVerification(button.dataset.openVerification);
  } catch (error) {
    log(error.message || "Could not open verification case.");
  }
});

bindAsync("#verificationSearchForm", "submit", async (event) => {
  event.preventDefault();
  await loadVerifications(formData(event.currentTarget));
});

async function loadInterviews(filters = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== null)),
  ).toString();
  const data = await api(`/api/admin/interviews${query ? `?${query}` : ""}`, { token: adminToken });
  renderCounters(interviewCounters, data.overview);
  interviewList.innerHTML = data.interviews.length
    ? data.interviews
        .map(
          (item) => `
            <div class="list-item">
              <strong>${escapeHtml(item.professional.name)} / ${escapeHtml(item.mode)}</strong>
              ${badge(item.status)}
              <p>${escapeHtml(item.scheduled_start_at ?? "Not scheduled")} / ${escapeHtml(item.professional.profession)}</p>
              <button class="mini-button secondary" data-open-interview="${item.id}">Open interview</button>
            </div>
          `,
        )
        .join("")
    : emptyState("No interviews match the current filters.");
  log("Interview queue loaded.", data.overview);
}

async function openInterview(id) {
  const data = await api(`/api/admin/interviews/${id}`, { token: adminToken });
  const { interview, application, professional, profile, scores, rubric } = data;
  milestone2Detail.dataset.currentInterviewId = String(interview.id);
  const scoreRows = scores.length
    ? scores.map((score) => `<li>${escapeHtml(score.category)}: ${escapeHtml(score.score)} / ${escapeHtml(score.max_score)} ${score.comment ? `- ${escapeHtml(score.comment)}` : ""}</li>`).join("")
    : "<li>No score submitted.</li>";
  milestone2Detail.innerHTML = `
    <div class="detail-grid">
      <section class="detail-section">
        <h3>Candidate</h3>
        <p><strong>${escapeHtml(professional?.name ?? profile?.name ?? "-")}</strong></p>
        <p>${escapeHtml(profile?.profession ?? "-")} / ${escapeHtml(professional?.email ?? "-")}</p>
      </section>
      <section class="detail-section">
        <h3>Interview</h3>
        ${badge(interview.status)}
        <p>${escapeHtml(interview.scheduled_start_at ?? "-")} - ${escapeHtml(interview.scheduled_end_at ?? "-")}</p>
        <p>${escapeHtml(interview.mode)} / ${escapeHtml(interview.location ?? "-")}</p>
      </section>
      <section class="detail-section">
        <h3>Application</h3>
        <p>${escapeHtml(application.application_number)}</p>
        ${badge(application.status)}
      </section>
    </div>
    <div class="detail-section">
      <h3>Rubric</h3>
      <p class="muted">${escapeHtml(rubric.join(", "))}</p>
      <ol class="timeline">${scoreRows}</ol>
    </div>
    <div class="review-actions">
      <button class="mini-button" data-complete-interview="${interview.id}" data-recommendation="recommend">Recommend</button>
      <button class="mini-button secondary" data-complete-interview="${interview.id}" data-recommendation="recommend_with_conditions">Recommend with conditions</button>
      <button class="mini-button secondary" data-complete-interview="${interview.id}" data-recommendation="do_not_recommend">Do not recommend</button>
    </div>
  `;
  log("Interview detail loaded.", { id: interview.id, status: interview.status });
}

interviewList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-open-interview]");
  if (!button) return;
  try {
    await openInterview(button.dataset.openInterview);
  } catch (error) {
    log(error.message || "Could not open interview.");
  }
});

bindAsync("#interviewSearchForm", "submit", async (event) => {
  event.preventDefault();
  await loadInterviews(formData(event.currentTarget));
});

milestone2Detail.addEventListener("click", async (event) => {
  try {
    const verificationStatus = event.target.closest("[data-verification-status]");
    if (verificationStatus && milestone2Detail.dataset.currentVerificationId) {
      const verificationId = requireId(milestone2Detail.dataset.currentVerificationId, "Verification case ID");
      const note = window.prompt("Verification note", `Move to ${verificationStatus.dataset.verificationStatus}`);
      const evidence = window.prompt("Evidence/reference", "");
      await api(`/api/admin/verifications/${verificationId}/status`, {
        method: "PATCH",
        token: adminToken,
        body: {
          status: verificationStatus.dataset.verificationStatus,
          note,
          evidence_reference: evidence,
          evidence_notes: note,
          final_decision_notes: note,
        },
      });
      await openVerification(verificationId);
      await loadVerifications();
      await loadApplications();
      return;
    }

    const completeInterview = event.target.closest("[data-complete-interview]");
    if (completeInterview) {
      const interviewId = requireId(completeInterview.dataset.completeInterview, "Interview ID");
      const notes = window.prompt("Interview notes", "Structured interview completed.");
      const defaultScores = [
        "professional_knowledge",
        "communication",
        "ethical_judgment",
        "practical_readiness",
        "role_fit",
      ].map((category) => ({ category, score: 4, max_score: 5, weight: 1, comment: "Meets milestone 2 benchmark." }));
      await api(`/api/admin/interviews/${interviewId}/complete`, {
        method: "PATCH",
        token: adminToken,
        body: {
          recommendation: completeInterview.dataset.recommendation,
          notes,
          scores: defaultScores,
        },
      });
      await openInterview(interviewId);
      await loadInterviews();
      await loadApplications();
    }
  } catch (error) {
    log(error.message || "Milestone 2 action failed.");
  }
});

bindAsync("#loadMilestone2", "click", async () => {
  await loadVerifications();
  await loadInterviews();
});

function renderFacilityDashboard(data) {
  latestFacilityDashboard = data;
  const facility = data.facility;
  const access = data.access ?? { active: false, subscriptions: [] };
  facilityDashboard.innerHTML = facility
    ? `
      <div class="detail-grid">
        <section class="detail-section">
          <h3>${escapeHtml(facility.display_name)}</h3>
          ${badge(facility.review_status)}
          <p>${escapeHtml(facility.facility_type)} / ${escapeHtml(facility.county)}</p>
          <p>${escapeHtml(facility.review_note ?? "No review note.")}</p>
        </section>
        <section class="detail-section">
          <h3>Access</h3>
          ${badge(access.active ? "active" : access.active_subscription?.status ?? "inactive")}
          <p>${access.active_subscription ? `${escapeHtml(access.active_subscription.payment_reference)} / ends ${escapeHtml(access.active_subscription.ends_at ?? "-")}` : "No active access."}</p>
        </section>
        <section class="detail-section">
          <h3>Activity</h3>
          <p>${escapeHtml(data.requests?.length ?? 0)} request(s)</p>
          <p>${escapeHtml(data.recommendation_packages?.length ?? 0)} shared package(s)</p>
        </section>
      </div>
    `
    : emptyState("Register or sign in as a facility account to begin onboarding.");

  setButtonState("#facilitySubmit", !facility || !["draft", "rejected", "clarification_requested"].includes(facility.review_status), facility ? "This facility is already submitted or approved." : "Save facility details first.");
  setButtonState("#facilityCreatePayment", !facility || facility.review_status !== "approved" || access.active, access.active ? "Facility access is already active." : "Facility must be approved before access payment.");
}

async function refreshFacilityDashboard() {
  const data = await api("/api/facility/dashboard", { token: facilityToken });
  renderFacilityDashboard(data);
  log("Facility dashboard refreshed.", data.access);
}

bindAsync("#facilityRegisterForm", "submit", async (event) => {
  event.preventDefault();
  const data = await api("/api/facility/auth/register", {
    method: "POST",
    body: formData(event.currentTarget),
    token: "",
  });
  facilityToken = data.token;
  localStorage.setItem("afyalink.facilityToken", facilityToken);
  updateSessionState();
  renderFacilityDashboard(data);
  log("Facility registered. Submit onboarding when details are ready.", data.facility);
});

bindAsync("#facilityLoginForm", "submit", async (event) => {
  event.preventDefault();
  const data = await api("/api/auth/login", {
    method: "POST",
    body: formData(event.currentTarget),
    token: "",
  });
  facilityToken = data.token;
  localStorage.setItem("afyalink.facilityToken", facilityToken);
  updateSessionState();
  log("Facility signed in.", data.user);
  await refreshFacilityDashboard();
});

bindAsync("#facilityProfileForm", "submit", async (event) => {
  event.preventDefault();
  const data = await api("/api/facility/profile", {
    method: "PUT",
    token: facilityToken,
    body: formData(event.currentTarget),
  });
  renderFacilityDashboard(data);
  log("Facility profile saved.", data.facility);
});

bindAsync("#facilitySubmit", "click", async () => {
  const data = await api("/api/facility/submit", { method: "POST", body: {}, token: facilityToken });
  renderFacilityDashboard(data);
  log("Facility submitted for Afyalink review.", data.facility);
});

bindAsync("#facilityCreatePayment", "click", async () => {
  const data = await api("/api/facility/access/payment-intents", {
    method: "POST",
    token: facilityToken,
    body: {
      idempotency_key: `facility-web-${Date.now()}`,
      amount_cents: 500000,
      plan_code: "staging_manual_access",
    },
  });
  log("Facility access payment reference created.", data.subscription);
  await refreshFacilityDashboard();
});

bindAsync("#facilityRefreshDashboard", "click", refreshFacilityDashboard);

async function loadFacilityCandidates(filters = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== null)),
  ).toString();
  const data = await api(`/api/facility/candidates${query ? `?${query}` : ""}`, { token: facilityToken });
  facilityCandidateList.innerHTML = data.candidates.length
    ? data.candidates
        .map(
          (candidate) => `
            <div class="list-item">
              <strong>${escapeHtml(candidate.candidate_code)} / ${escapeHtml(candidate.profession)}</strong>
              ${badge(candidate.qualification_status)}
              <p>${escapeHtml(candidate.county)} / ${escapeHtml(candidate.years_experience)} years / ${escapeHtml(candidate.recommendation)}</p>
              <p class="muted">${escapeHtml(candidate.headline)}</p>
              <button class="mini-button secondary" data-open-candidate="${candidate.id}">Open candidate</button>
            </div>
          `,
        )
        .join("")
    : emptyState("No published candidates match the filters or access is not active.");
  log("Facility candidates loaded.", { count: data.candidates.length });
}

bindAsync("#facilityCandidateSearchForm", "submit", async (event) => {
  event.preventDefault();
  await loadFacilityCandidates(formData(event.currentTarget));
});

facilityCandidateList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-open-candidate]");
  if (!button) return;
  try {
    const id = requireId(button.dataset.openCandidate, "Candidate publication ID");
    const data = await api(`/api/facility/candidates/${id}`, { token: facilityToken });
    facilityCandidateDetail.innerHTML = `
      <div class="watermark-panel" data-watermark="${escapeHtml(`${data.watermark.facility} / ${data.watermark.viewer_email} / ${data.watermark.candidate}`)}">
        <div class="detail-grid">
          <section class="detail-section">
            <h3>${escapeHtml(data.candidate.candidate_code)}</h3>
            <p>${escapeHtml(data.candidate.profession)} / ${escapeHtml(data.candidate.county)}</p>
            <p>${escapeHtml(data.candidate.years_experience)} years / ${escapeHtml(data.candidate.availability)}</p>
          </section>
          <section class="detail-section">
            <h3>Verification</h3>
            ${badge(data.candidate.verification_status)}
            <p>${escapeHtml(data.candidate.recommendation)} / score ${escapeHtml(data.candidate.average_score ?? "-")}</p>
          </section>
          <section class="detail-section">
            <h3>Credentials</h3>
            ${
              data.credential_metadata.length
                ? data.credential_metadata.map((item) => `<p>${escapeHtml(item.document_type)} / ${escapeHtml(item.review_status)}</p>`).join("")
                : "<p>Approved credential metadata is not available.</p>"
            }
          </section>
        </div>
        <p class="notice">${escapeHtml(data.legal_warning)}</p>
      </div>
    `;
    log("Candidate profile opened and audited.", { action: "candidate.profile_viewed", ...data.watermark });
  } catch (error) {
    log(error.message || "Could not open candidate profile.");
  }
});

bindAsync("#facilityAppointmentForm", "submit", async (event) => {
  event.preventDefault();
  const body = formData(event.currentTarget);
  body.candidate_publication_ids = csvIds(body.candidate_publication_ids);
  const data = await api("/api/facility/requests/appointments", { method: "POST", token: facilityToken, body });
  log("Facility request submitted.", data.request);
  await refreshFacilityDashboard();
});

bindAsync("#facilityRecommendationForm", "submit", async (event) => {
  event.preventDefault();
  const body = formData(event.currentTarget);
  body.candidate_publication_ids = csvIds(body.candidate_publication_ids);
  const data = await api("/api/facility/recommendation-requests", { method: "POST", token: facilityToken, body });
  log("Recommendation request submitted.", data.recommendation_request);
  await refreshFacilityDashboard();
});

bindAsync("#facilityLoadPackages", "click", async () => {
  const data = await api("/api/facility/recommendation-packages", { token: facilityToken });
  facilityPackageList.innerHTML = data.recommendation_packages.length
    ? data.recommendation_packages
        .map(
          (item) => `
            <div class="list-item">
              <strong>${escapeHtml(item.title)}</strong>
              ${badge(item.status)}
              <p>${escapeHtml(item.rationale ?? "No rationale recorded.")}</p>
              <p>${escapeHtml(item.candidates.length)} candidate(s)</p>
            </div>
          `,
        )
        .join("")
    : emptyState("No shared recommendation packages yet.");
  log("Recommendation packages loaded.", { count: data.recommendation_packages.length });
});

function renderAdminFacilityCounters(overview = {}) {
  const flat = {
    pending_facilities: overview.facilities?.pending_approval ?? 0,
    active_facilities: overview.facilities?.active_facilities ?? 0,
    active_access: overview.access?.active ?? 0,
    expired_access: overview.access?.expired ?? 0,
    published_candidates: overview.publications?.published ?? 0,
    candidate_views: overview.publications?.candidate_profile_views ?? 0,
    open_requests: overview.engagements?.open_facility_requests ?? 0,
    open_recommendations: overview.engagements?.open_recommendation_requests ?? 0,
  };
  renderCounters(adminFacilityCounters, flat);
}

async function loadAdminFacilityOperations() {
  const overview = await api("/api/admin/facility-operations/overview", { token: adminToken });
  renderAdminFacilityCounters(overview);
  await Promise.all([loadAdminFacilities(), loadAdminPublications(), loadAdminFacilityRequests(), loadAdminRecommendationRequests(), loadAdminRecommendationPackages()]);
  log("Facility operations loaded.", overview);
}

async function loadAdminFacilities(filters = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== null)),
  ).toString();
  const data = await api(`/api/admin/facilities${query ? `?${query}` : ""}`, { token: adminToken });
  adminFacilityList.innerHTML = data.facilities.length
    ? data.facilities
        .map(
          (facility) => `
            <div class="list-item">
              <strong>${escapeHtml(facility.display_name)}</strong>
              ${badge(facility.review_status)}
              <p>${escapeHtml(facility.facility_type)} / ${escapeHtml(facility.county)} / ${escapeHtml(facility.email)}</p>
              <button class="mini-button secondary" data-open-facility="${facility.id}">Open facility</button>
            </div>
          `,
        )
        .join("")
    : emptyState("No facilities match the current filters.");
}

bindAsync("#adminFacilitySearchForm", "submit", async (event) => {
  event.preventDefault();
  await loadAdminFacilities(formData(event.currentTarget));
});

adminFacilityList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-open-facility]");
  if (!button) return;
  try {
    const id = requireId(button.dataset.openFacility, "Facility ID");
    const data = await api(`/api/admin/facilities/${id}`, { token: adminToken });
    adminFacilityDetail.dataset.facilityId = String(data.facility.id);
    adminFacilityDetail.dataset.subscriptionId = String(data.access.active_subscription?.id ?? data.access.subscriptions?.[0]?.id ?? "");
    adminFacilityDetail.innerHTML = `
      <div class="detail-grid">
        <section class="detail-section">
          <h3>${escapeHtml(data.facility.display_name)}</h3>
          ${badge(data.facility.review_status)}
          <p>${escapeHtml(data.facility.legal_name)} / ${escapeHtml(data.facility.registration_number ?? "-")}</p>
          <p>${escapeHtml(data.facility.contact_person)} / ${escapeHtml(data.facility.phone)}</p>
        </section>
        <section class="detail-section">
          <h3>Access</h3>
          ${badge(data.access.active ? "active" : data.access.subscriptions?.[0]?.status ?? "inactive")}
          <p>${escapeHtml(data.access.subscriptions?.[0]?.payment_reference ?? "No subscription")}</p>
        </section>
        <section class="detail-section">
          <h3>Members</h3>
          <p>${escapeHtml(data.memberships.length)} user(s)</p>
          <p>${escapeHtml(data.facility.review_note ?? "No review note.")}</p>
        </section>
      </div>
      <div class="review-actions">
        <button class="mini-button secondary" data-facility-review="start_review">Start review</button>
        <button class="mini-button" data-facility-review="approve">Approve</button>
        <button class="mini-button secondary" data-facility-review="request_clarification">Clarification</button>
        <button class="mini-button secondary" data-facility-review="reject">Reject</button>
        <button class="mini-button" data-facility-subscription="active">Activate access</button>
        <button class="mini-button secondary" data-facility-subscription="suspended">Suspend access</button>
      </div>
    `;
    log("Facility detail loaded.", data.facility);
  } catch (error) {
    log(error.message || "Could not open facility.");
  }
});

adminFacilityDetail.addEventListener("click", async (event) => {
  try {
    const facilityId = requireId(adminFacilityDetail.dataset.facilityId, "Facility ID");
    const review = event.target.closest("[data-facility-review]");
    if (review) {
      const note = window.prompt("Facility review note", `Action: ${review.dataset.facilityReview}`);
      await api(`/api/admin/facilities/${facilityId}/review`, {
        method: "PATCH",
        token: adminToken,
        body: { action: review.dataset.facilityReview, note },
      });
      await loadAdminFacilities();
      log("Facility review saved.");
      return;
    }
    const subscription = event.target.closest("[data-facility-subscription]");
    if (subscription) {
      await api(`/api/admin/facilities/${facilityId}/subscription`, {
        method: "PATCH",
        token: adminToken,
        body: {
          subscription_id: adminFacilityDetail.dataset.subscriptionId || undefined,
          status: subscription.dataset.facilitySubscription,
          admin_override: true,
          note: "Updated from facility operations console.",
        },
      });
      await loadAdminFacilities();
      log("Facility access updated.");
    }
  } catch (error) {
    log(error.message || "Facility action failed.");
  }
});

async function loadAdminPublications(filters = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== null)),
  ).toString();
  const data = await api(`/api/admin/candidate-publications${query ? `?${query}` : ""}`, { token: adminToken });
  adminPublicationList.innerHTML = data.publications.length
    ? data.publications
        .map((item) => `<div class="list-item"><strong>${escapeHtml(item.summary.candidate_code ?? item.id)}</strong> ${badge(item.status)}<p>${escapeHtml(item.summary.name ?? "")} / ${escapeHtml(item.summary.profession ?? "")}</p></div>`)
        .join("")
    : emptyState("No candidate publications yet.");
}

bindAsync("#adminPublicationForm", "submit", async (event) => {
  event.preventDefault();
  const body = formData(event.currentTarget);
  body.application_id = Number(body.application_id);
  const data = await api("/api/admin/candidate-publications", { method: "POST", token: adminToken, body });
  log("Candidate publication saved.", data.publication);
  await loadAdminPublications();
});

async function loadAdminFacilityRequests() {
  const data = await api("/api/admin/facility-requests", { token: adminToken });
  adminFacilityRequestList.innerHTML = data.requests.length
    ? data.requests.map((item) => `<div class="list-item"><strong>${escapeHtml(item.title)}</strong> ${badge(item.status)}<p>${escapeHtml(item.facility?.display_name ?? "")} / ${escapeHtml(item.role_needed ?? "")}</p></div>`).join("")
    : emptyState("No facility requests.");
}

async function loadAdminRecommendationRequests() {
  const data = await api("/api/admin/recommendation-requests", { token: adminToken });
  adminRecommendationRequestList.innerHTML = data.recommendation_requests.length
    ? data.recommendation_requests.map((item) => `<div class="list-item"><strong>${escapeHtml(item.role_needed)}</strong> ${badge(item.status)}<p>#${escapeHtml(item.id)} / ${escapeHtml(item.facility?.display_name ?? "")} / ${escapeHtml(item.county ?? "")}</p></div>`).join("")
    : emptyState("No recommendation requests.");
}

async function loadAdminRecommendationPackages() {
  const data = await api("/api/admin/recommendation-packages", { token: adminToken });
  adminRecommendationPackageList.innerHTML = data.recommendation_packages.length
    ? data.recommendation_packages.map((item) => `<div class="list-item"><strong>${escapeHtml(item.title)}</strong> ${badge(item.status)}<p>${escapeHtml(item.facility?.display_name ?? "")}</p></div>`).join("")
    : emptyState("No recommendation packages.");
}

bindAsync("#adminRecommendationPackageForm", "submit", async (event) => {
  event.preventDefault();
  const body = formData(event.currentTarget);
  body.recommendation_request_id = Number(body.recommendation_request_id || 0) || undefined;
  body.facility_id = Number(body.facility_id || 0) || undefined;
  body.candidate_publication_ids = csvIds(body.candidate_publication_ids);
  const data = await api("/api/admin/recommendation-packages", { method: "POST", token: adminToken, body });
  log("Recommendation package saved.", data.recommendation_package);
  await loadAdminRecommendationPackages();
});

bindAsync("#loadFacilityOperations", "click", loadAdminFacilityOperations);

updateSessionState();

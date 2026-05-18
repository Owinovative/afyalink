const API_BASE = window.AFYA_API_BASE ?? "http://localhost:8000";
let professionalToken = localStorage.getItem("afyalink.professionalToken") ?? "";
let adminToken = localStorage.getItem("afyalink.adminToken") ?? "";

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

async function api(path, { method = "GET", body = null, token = professionalToken } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    const detail = payload.errors ? ` ${JSON.stringify(payload.errors)}` : "";
    throw new Error(`${payload.message ?? "Request failed"}${detail}`);
  }
  return payload.data;
}

function bindAsync(selector, eventName, handler) {
  document.querySelector(selector).addEventListener(eventName, async (event) => {
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
  const kind = ["accepted", "confirmed", "approved", "verified"].includes(status)
    ? "good"
    : ["rejected", "needs_replacement", "failed"].includes(status)
      ? "bad"
      : "warn";
  return `<span class="badge ${kind}">${value}</span>`;
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
  const readiness = data.readiness;
  const latestPayment = data.payments[0] ?? null;
  const application = data.application;
  dashboardSummary.innerHTML = `
    <span>${data.account?.email_verified ? "Email verified" : "Email not verified"}</span>
    <strong>${readiness.ready ? "Ready to submit" : "Not ready"}</strong>
    <p>Missing: ${readiness.missing.length ? escapeHtml(readiness.missing.join(", ")) : "None"}</p>
    <p>Warnings: ${readiness.warnings.length ? escapeHtml(readiness.warnings.join(", ")) : "None"}</p>
    <p>Payment: ${latestPayment ? `${escapeHtml(latestPayment.intent_reference)} (${escapeHtml(latestPayment.status)})` : "No payment reference yet"}</p>
    <p>Application: ${application ? `${escapeHtml(application.application_number)} (${escapeHtml(application.status)})` : "Not submitted"}</p>
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
    : "No credentials uploaded.";
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
    : "No applications.";
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
  const data = await api(`/api/admin/applications/${id}`, { token: adminToken });
  const { application, professional, profile, credentials, payments, consent } = data;
  const latestPayment = payments[0] ?? null;
  applicationDetail.dataset.currentApplicationId = String(application.id);
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
          : "No credentials."
      }
    </div>
    <div class="detail-section">
      <h3>Timeline</h3>
      <ol class="timeline">${timelineHtml(application)}</ol>
    </div>
    <div class="review-actions">
      <button class="mini-button" data-application-action="start_review" data-application-id="${application.id}">Start review</button>
      <button class="mini-button" data-application-action="request_replacement" data-application-id="${application.id}">Request replacement</button>
      <button class="mini-button" data-application-action="verify" data-application-id="${application.id}">Verify</button>
      <button class="mini-button" data-application-action="approve" data-application-id="${application.id}">Approve</button>
      <button class="mini-button" data-application-action="reject" data-application-id="${application.id}">Reject</button>
      <button class="mini-button secondary" data-create-verification="${application.id}">Open verification case</button>
      <button class="mini-button secondary" data-schedule-interview="${application.id}">Schedule interview</button>
    </div>
  `;
  log("Application detail loaded.", { application: application.application_number, status: application.status });
}

applicationDetail.addEventListener("click", async (event) => {
  const credentialButton = event.target.closest("[data-review-credential]");
  try {
    if (credentialButton) {
      const note = window.prompt("Review note", credentialButton.dataset.status === "needs_replacement" ? "Please upload a clearer replacement document." : "");
      await api(`/api/admin/credentials/${credentialButton.dataset.reviewCredential}/review`, {
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
      await api("/api/admin/verifications", {
        method: "POST",
        token: adminToken,
        body: {
          application_id: Number(verificationButton.dataset.createVerification),
        },
      });
      await loadVerifications();
      await openApplication(verificationButton.dataset.createVerification);
      log("Verification case opened.");
      return;
    }
    if (interviewButton) {
      const start = window.prompt("Interview start time (ISO/local accepted)", new Date(Date.now() + 86400000).toISOString());
      const end = window.prompt("Interview end time (ISO/local accepted)", new Date(Date.now() + 90000000).toISOString());
      await api("/api/admin/interviews", {
        method: "POST",
        token: adminToken,
        body: {
          application_id: Number(interviewButton.dataset.scheduleInterview),
          scheduled_start_at: start,
          scheduled_end_at: end,
          mode: "remote",
          notes: "Scheduled from admin workbench.",
        },
      });
      await loadInterviews();
      await openApplication(interviewButton.dataset.scheduleInterview);
      log("Interview scheduled.");
      return;
    }
    if (!actionButton) return;
    const note = window.prompt("Review note", `Admin action: ${actionButton.dataset.applicationAction}`);
    await api(`/api/admin/applications/${actionButton.dataset.applicationId}/action`, {
      method: "PATCH",
      token: adminToken,
      body: {
        action: actionButton.dataset.applicationAction,
        note,
      },
    });
    await openApplication(actionButton.dataset.applicationId);
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
    : "No audit records.";
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
    : "No verification cases.";
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
    : "No interviews.";
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
      const note = window.prompt("Verification note", `Move to ${verificationStatus.dataset.verificationStatus}`);
      const evidence = window.prompt("Evidence/reference", "");
      await api(`/api/admin/verifications/${milestone2Detail.dataset.currentVerificationId}/status`, {
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
      await openVerification(milestone2Detail.dataset.currentVerificationId);
      await loadVerifications();
      await loadApplications();
      return;
    }

    const completeInterview = event.target.closest("[data-complete-interview]");
    if (completeInterview) {
      const notes = window.prompt("Interview notes", "Structured interview completed.");
      const defaultScores = [
        "professional_knowledge",
        "communication",
        "ethical_judgment",
        "practical_readiness",
        "role_fit",
      ].map((category) => ({ category, score: 4, max_score: 5, weight: 1, comment: "Meets milestone 2 benchmark." }));
      await api(`/api/admin/interviews/${completeInterview.dataset.completeInterview}/complete`, {
        method: "PATCH",
        token: adminToken,
        body: {
          recommendation: completeInterview.dataset.recommendation,
          notes,
          scores: defaultScores,
        },
      });
      await openInterview(completeInterview.dataset.completeInterview);
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

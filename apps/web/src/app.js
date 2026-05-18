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

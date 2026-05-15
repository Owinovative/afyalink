const API_BASE = window.AFYA_API_BASE ?? "http://localhost:8000";
let professionalToken = localStorage.getItem("afyalink.professionalToken") ?? "";
let adminToken = localStorage.getItem("afyalink.adminToken") ?? "";

const output = document.querySelector("#output");
const dashboardSummary = document.querySelector("#dashboardSummary");
const credentialList = document.querySelector("#credentialList");
const applicationList = document.querySelector("#applicationList");
const applicationDetail = document.querySelector("#applicationDetail");
const auditList = document.querySelector("#auditList");

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
    throw new Error(payload.message ?? "Request failed");
  }
  return payload.data;
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

function renderDashboard(data) {
  const readiness = data.readiness;
  const latestPayment = data.payments[0] ?? null;
  const application = data.application;
  dashboardSummary.innerHTML = `
    <span>Readiness</span>
    <strong>${readiness.ready ? "Ready to submit" : "Not ready"}</strong>
    <p>Missing: ${readiness.missing.length ? readiness.missing.join(", ") : "None"}</p>
    <p>Warnings: ${readiness.warnings.length ? readiness.warnings.join(", ") : "None"}</p>
    <p>Payment: ${latestPayment ? `${latestPayment.intent_reference} (${latestPayment.status})` : "No payment reference yet"}</p>
    <p>Application: ${application ? `${application.application_number} (${application.status})` : "Not submitted"}</p>
  `;

  credentialList.innerHTML = data.credentials.length
    ? data.credentials
        .map(
          (credential) => `
            <div class="list-item">
              <strong>${credential.document_type}</strong>
              <span class="badge ${credential.review_status === "accepted" ? "good" : credential.review_status === "needs_replacement" ? "bad" : "warn"}">${credential.review_status}</span>
              <p>${credential.original_name} • ${Math.round(credential.size_bytes / 1024)} KB</p>
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

document.querySelector("#registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = await api("/api/auth/register", {
    method: "POST",
    body: formData(event.currentTarget),
    token: "",
  });
  professionalToken = data.token;
  localStorage.setItem("afyalink.professionalToken", professionalToken);
  log("Professional registered.", data.user);
});

document.querySelector("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = await api("/api/auth/login", {
    method: "POST",
    body: formData(event.currentTarget),
    token: "",
  });
  professionalToken = data.token;
  localStorage.setItem("afyalink.professionalToken", professionalToken);
  log("Professional signed in.", data.user);
});

document.querySelector("#profileForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = formData(event.currentTarget);
  body.years_experience = Number(body.years_experience || 0);
  const data = await api("/api/professional/profile", { method: "PUT", body });
  log("Profile saved.", data.profile);
  await refreshDashboard();
});

document.querySelector("#credentialForm").addEventListener("submit", async (event) => {
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
  await refreshDashboard();
});

document.querySelector("#acceptConsent").addEventListener("click", async () => {
  const data = await api("/api/professional/consents", { method: "POST", body: {} });
  log("Consent accepted.", data.consent);
  await refreshDashboard();
});

document.querySelector("#createPayment").addEventListener("click", async () => {
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

document.querySelector("#submitApplication").addEventListener("click", async () => {
  const data = await api("/api/professional/application/submit", { method: "POST", body: {} });
  log("Application submitted.", data.application);
  await refreshDashboard();
});

document.querySelector("#refreshDashboard").addEventListener("click", refreshDashboard);

document.querySelector("#adminLoginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = await api("/api/auth/login", {
    method: "POST",
    body: formData(event.currentTarget),
    token: "",
  });
  adminToken = data.token;
  localStorage.setItem("afyalink.adminToken", adminToken);
  log("Admin signed in.", data.user);
});

async function loadApplications(filters = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== null)),
  ).toString();
  const data = await api(`/api/admin/applications${query ? `?${query}` : ""}`, { token: adminToken });
  applicationList.innerHTML = data.applications.length
    ? data.applications
        .map(
          (application) => `
            <div class="list-item">
              <strong>${application.application_number}</strong>
              <span class="badge warn">${application.status}</span>
              <p>${application.professional.name} • ${application.professional.profession} • ${application.professional.county}</p>
              <button class="mini-button secondary" data-open-application="${application.id}">Open review</button>
            </div>
          `,
        )
        .join("")
    : "No applications.";
  log("Applications loaded.", data.applications);
}

document.querySelector("#applicationSearchForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadApplications(formData(event.currentTarget));
});

applicationList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-open-application]");
  if (!button) return;
  await openApplication(button.dataset.openApplication);
});

async function openApplication(id) {
  const data = await api(`/api/admin/applications/${id}`, { token: adminToken });
  const { application, professional, profile, credentials, payments, consent } = data;
  const latestPayment = payments[0] ?? null;
  applicationDetail.innerHTML = `
    <div class="detail-grid">
      <section class="detail-section">
        <h3>Professional</h3>
        <p><strong>${professional?.name ?? profile?.name ?? "-"}</strong></p>
        <p>${professional?.email ?? profile?.email ?? "-"}</p>
        <p>${profile?.profession ?? "-"} • ${profile?.county ?? "-"}</p>
        <p>License: ${profile?.regulatory_body ?? "-"} / ${profile?.license_number ?? "-"}</p>
      </section>
      <section class="detail-section">
        <h3>Application</h3>
        <p>${application.application_number}</p>
        <span class="badge warn">${application.status}</span>
        <p>Submitted: ${application.submitted_at ?? "-"}</p>
        <p>Consent: ${consent ? consent.version : "not accepted"}</p>
      </section>
      <section class="detail-section">
        <h3>Payment</h3>
        <p>${latestPayment?.intent_reference ?? "No payment"}</p>
        <span class="badge ${latestPayment?.status === "confirmed" ? "good" : "warn"}">${latestPayment?.status ?? "missing"}</span>
        <p>${latestPayment ? `${latestPayment.currency} ${(latestPayment.amount_cents / 100).toFixed(2)}` : ""}</p>
      </section>
    </div>
    <div class="detail-section">
      <h3>Credentials</h3>
      ${credentials.length ? credentials.map((credential) => `
        <div class="list-item">
          <strong>${credential.document_type}</strong>
          <span class="badge ${credential.review_status === "accepted" ? "good" : credential.review_status === "needs_replacement" || credential.review_status === "rejected" ? "bad" : "warn"}">${credential.review_status}</span>
          <p>${credential.original_name} • checksum ${credential.checksum.slice(0, 12)}...</p>
          <div class="action-row">
            <button class="mini-button secondary" data-review-credential="${credential.id}" data-status="accepted">Accept</button>
            <button class="mini-button secondary" data-review-credential="${credential.id}" data-status="needs_replacement">Needs replacement</button>
            <button class="mini-button secondary" data-review-credential="${credential.id}" data-status="rejected">Reject</button>
          </div>
        </div>
      `).join("") : "No credentials."}
    </div>
    <div class="review-actions">
      <button class="mini-button" data-application-action="start_review" data-application-id="${application.id}">Start review</button>
      <button class="mini-button" data-application-action="request_replacement" data-application-id="${application.id}">Request replacement</button>
      <button class="mini-button" data-application-action="verify" data-application-id="${application.id}">Verify</button>
      <button class="mini-button" data-application-action="approve" data-application-id="${application.id}">Approve</button>
      <button class="mini-button" data-application-action="reject" data-application-id="${application.id}">Reject</button>
    </div>
  `;
  log("Application detail loaded.", data);
}

applicationDetail.addEventListener("click", async (event) => {
  const credentialButton = event.target.closest("[data-review-credential]");
  if (credentialButton) {
    await api(`/api/admin/credentials/${credentialButton.dataset.reviewCredential}/review`, {
      method: "PATCH",
      token: adminToken,
      body: {
        status: credentialButton.dataset.status,
        note: `Reviewed from web console as ${credentialButton.dataset.status}`,
      },
    });
    log("Credential review saved.");
    return;
  }

  const actionButton = event.target.closest("[data-application-action]");
  if (!actionButton) return;
  await api(`/api/admin/applications/${actionButton.dataset.applicationId}/action`, {
    method: "PATCH",
    token: adminToken,
    body: {
      action: actionButton.dataset.applicationAction,
      note: `Admin action: ${actionButton.dataset.applicationAction}`,
    },
  });
  await openApplication(actionButton.dataset.applicationId);
});

document.querySelector("#loadAudit").addEventListener("click", async () => {
  const data = await api("/api/admin/audit-logs", { token: adminToken });
  auditList.innerHTML = data.audit_logs.length
    ? data.audit_logs
        .map(
          (audit) => `
            <div class="list-item">
              <strong>${audit.action}</strong>
              <p>${audit.entity_type} #${audit.entity_id ?? "-"} • ${audit.created_at}</p>
            </div>
          `,
        )
        .join("")
    : "No audit records.";
  log("Audit logs loaded.", data.audit_logs.slice(0, 5));
});

const API_BASE = window.AFYA_API_BASE ?? "http://localhost:8000";
let professionalToken = localStorage.getItem("afyalink.professionalToken") ?? "";
let adminToken = localStorage.getItem("afyalink.adminToken") ?? "";

const output = document.querySelector("#output");
const dashboardSummary = document.querySelector("#dashboardSummary");
const credentialList = document.querySelector("#credentialList");
const applicationList = document.querySelector("#applicationList");
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
  dashboardSummary.innerHTML = `
    <span>Readiness</span>
    <strong>${readiness.ready ? "Ready to submit" : "Not ready"}</strong>
    <p>Missing: ${readiness.missing.length ? readiness.missing.join(", ") : "None"}</p>
    <p>Warnings: ${readiness.warnings.length ? readiness.warnings.join(", ") : "None"}</p>
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

document.querySelector("#loadApplications").addEventListener("click", async () => {
  const data = await api("/api/admin/applications", { token: adminToken });
  applicationList.innerHTML = data.applications.length
    ? data.applications
        .map(
          (application) => `
            <div class="list-item">
              <strong>${application.application_number}</strong>
              <span class="badge warn">${application.status}</span>
              <p>${application.professional.name} • ${application.professional.profession} • ${application.professional.county}</p>
            </div>
          `,
        )
        .join("")
    : "No applications.";
  log("Applications loaded.", data.applications);
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

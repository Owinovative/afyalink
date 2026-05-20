"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { DataRow, MetaGrid, MetricGrid } from "@/components/ui/DataViews";
import { EmptyState } from "@/components/ui/EmptyState";
import { Feedback } from "@/components/ui/Feedback";
import { Field, formValues, TextArea } from "@/components/ui/Forms";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiRequest, asArray, asRecord } from "@/lib/api/client";
import { display } from "@/lib/formatters";
import { useApiResource } from "@/lib/hooks/useApiResource";

type ProfessionalSection =
  | "home"
  | "dashboard"
  | "profile"
  | "credentials"
  | "consent-payment"
  | "application"
  | "verification"
  | "interview"
  | "publication";

const documentTypes = [
  ["cv", "Curriculum vitae"],
  ["national_id_or_passport", "National ID or passport"],
  ["professional_license", "Professional license"],
  ["academic_certificate", "Academic certificate"],
  ["experience_letter", "Experience letter"],
  ["passport_photo", "Passport photo"],
  ["payment_evidence", "Payment evidence"],
  ["regulatory_evidence", "Regulatory evidence"],
];

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  let binary = "";
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function ProfessionalPage({ section }: { section: ProfessionalSection }) {
  const resource = useApiResource<Record<string, unknown>>("professional", "/api/professional/dashboard");
  const data = asRecord(resource.data);
  const profile = asRecord(data.profile);
  const readiness = asRecord(data.readiness);
  const account = asRecord(data.account);
  const consent = asRecord(data.consent);
  const credentials = asArray<Record<string, unknown>>(data.credentials);
  const payments = asArray<Record<string, unknown>>(data.payments);
  const verificationCases = asArray<Record<string, unknown>>(data.verification_cases);
  const interviews = asArray<Record<string, unknown>>(data.interviews);
  const facilityVisibility = asRecord(data.facility_visibility);

  return (
    <>
      <PageHeader
        eyebrow="Professional portal"
        title={section === "home" ? "Professional workspace" : section.replace("-", " ")}
        body="Each page maps to one professional workflow stage. The backend decides readiness and valid transitions."
        actions={<Link className="button secondary" href="/portal/professional/dashboard">Refresh view</Link>}
      />
      {resource.loading ? <div className="notice">Loading professional dashboard...</div> : null}
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      {section === "home" || section === "dashboard" ? (
        <DashboardSummary
          account={account}
          readiness={readiness}
          profile={profile}
          credentials={credentials}
          payments={payments}
          consent={consent}
          visibility={facilityVisibility}
        />
      ) : null}
      {section === "profile" ? <ProfileForm token={resource.token} profile={profile} refresh={resource.refresh} /> : null}
      {section === "credentials" ? (
        <CredentialsPanel token={resource.token} credentials={credentials} refresh={resource.refresh} />
      ) : null}
      {section === "consent-payment" ? (
        <ConsentPaymentPanel token={resource.token} consent={consent} payments={payments} refresh={resource.refresh} />
      ) : null}
      {section === "application" ? (
        <ApplicationPanel token={resource.token} readiness={readiness} application={asRecord(data.application)} refresh={resource.refresh} />
      ) : null}
      {section === "verification" ? <VerificationPanel cases={verificationCases} /> : null}
      {section === "interview" ? <InterviewPanel interviews={interviews} /> : null}
      {section === "publication" ? <PublicationPanel visibility={facilityVisibility} /> : null}
    </>
  );
}

function DashboardSummary({
  account,
  readiness,
  profile,
  credentials,
  payments,
  consent,
  visibility,
}: {
  account: Record<string, unknown>;
  readiness: Record<string, unknown>;
  profile: Record<string, unknown>;
  credentials: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  consent: Record<string, unknown>;
  visibility: Record<string, unknown>;
}) {
  const missing = asArray<string>(readiness.missing);
  const warnings = asArray<string>(readiness.warnings);

  return (
    <div className="data-list">
      <MetricGrid
        metrics={[
          { label: "Email", value: account.email_verified ? "Verified" : "Needs verification" },
          { label: "Profile", value: profile.id ? "Started" : "Not started" },
          { label: "Credentials", value: credentials.length },
          { label: "Application readiness", value: readiness.ready ? "Ready" : "Blocked" },
        ]}
      />
      <div className="grid-2">
        <div className="card">
          <h3>Next requirements</h3>
          {missing.length || warnings.length ? (
            <div className="table-lite">
              {[...missing, ...warnings].map((item) => (
                <div key={item}>
                  <span>{item}</span>
                  <span className="badge gold">Required</span>
                </div>
              ))}
            </div>
          ) : (
            <p>Backend readiness checks do not report any missing requirements.</p>
          )}
        </div>
        <div className="card">
          <h3>Facility visibility</h3>
          <MetaGrid
            items={[
              { label: "Visible", value: visibility.visible },
              { label: "Publication", value: visibility.publication_status },
              { label: "Profile views", value: visibility.profile_view_count },
              { label: "Current consent", value: consent.accepted_current },
              { label: "Latest payment", value: payments[0]?.status },
              { label: "Profession", value: profile.profession },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function ProfileForm({
  token,
  profile,
  refresh,
}: {
  token: string;
  profile: Record<string, unknown>;
  refresh: () => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const values = formValues(event);
      values.years_experience = Number(values.years_experience ?? 0);
      await apiRequest("/api/professional/profile", { method: "PUT", token, body: values });
      setMessage("Profile saved and dashboard refreshed.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save profile.");
    }
  }

  return (
    <section className="form-card">
      <h2>Profile details</h2>
      <form className="form-grid" key={String(profile.updated_at ?? profile.id ?? "new")} onSubmit={submit}>
        <Field label="Full name" name="name" required defaultValue={String(profile.name ?? "")} />
        <Field label="Phone" name="phone" required defaultValue={String(profile.phone ?? "")} />
        <Field label="Profession" name="profession" required defaultValue={String(profile.profession ?? "")} />
        <Field label="Regulatory body" name="regulatory_body" required defaultValue={String(profile.regulatory_body ?? "")} />
        <Field label="License number" name="license_number" required defaultValue={String(profile.license_number ?? "")} />
        <Field label="County" name="county" required defaultValue={String(profile.county ?? "")} />
        <Field label="Years experience" name="years_experience" type="number" defaultValue={String(profile.years_experience ?? "0")} />
        <Field label="Availability" name="availability" defaultValue={String(profile.availability ?? "")} />
        <Field label="Preferred counties" name="preferred_counties" defaultValue={String(profile.preferred_counties ?? "")} />
        <Field label="Placement type" name="placement_type" defaultValue={String(profile.placement_type ?? "")} />
        <div className="form-actions full">
          <button className="button" type="submit" disabled={!token}>
            Save profile
          </button>
        </div>
      </form>
      <div className="data-list" style={{ marginTop: 18 }}>
        {message ? <Feedback message={message} /> : null}
        {error ? <Feedback message={error} tone="error" /> : null}
      </div>
    </section>
  );
}

function CredentialsPanel({
  token,
  credentials,
  refresh,
}: {
  token: string;
  credentials: Record<string, unknown>[];
  refresh: () => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a credential document before uploading.");
      return;
    }

    try {
      await apiRequest("/api/professional/credentials", {
        method: "POST",
        token,
        body: {
          document_type: String(formData.get("document_type") ?? ""),
          original_name: file.name,
          mime_type: file.type || "application/pdf",
          content_base64: await fileToBase64(file),
        },
      });
      form.reset();
      setMessage("Credential uploaded. Review status will update after Afyalink checks it.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not upload credential.");
    }
  }

  return (
    <div className="split-panel">
      <section className="form-card">
        <h2>Upload credential</h2>
        <form className="form-grid" onSubmit={submit}>
          <label className="full">
            Document type
            <select name="document_type" required>
              {documentTypes.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="full">
            Private document
            <input name="file" type="file" required />
          </label>
          <button className="button full" type="submit" disabled={!token}>
            Upload for review
          </button>
        </form>
        <div className="data-list" style={{ marginTop: 18 }}>
          {message ? <Feedback message={message} /> : null}
          {error ? <Feedback message={error} tone="error" /> : null}
        </div>
      </section>
      <section className="card">
        <h2>Credential records</h2>
        <div className="data-list">
          {credentials.length ? (
            credentials.map((credential) => (
              <DataRow
                key={String(credential.id ?? credential.document_type)}
                title={display(credential.document_type)}
                status={credential.review_status}
                meta={[
                  { label: "File", value: credential.original_name },
                  { label: "Size", value: credential.size_bytes ? `${Math.round(Number(credential.size_bytes) / 1024)} KB` : null },
                  { label: "Review note", value: credential.review_note },
                ]}
              />
            ))
          ) : (
            <EmptyState title="No credentials uploaded" body="Upload required credential documents from this routed page." />
          )}
        </div>
      </section>
    </div>
  );
}

function ConsentPaymentPanel({
  token,
  consent,
  payments,
  refresh,
}: {
  token: string;
  consent: Record<string, unknown>;
  payments: Record<string, unknown>[];
  refresh: () => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function acceptConsent() {
    setMessage("");
    setError("");
    try {
      await apiRequest("/api/professional/consents", { method: "POST", token, body: {} });
      setMessage("Current consent accepted.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not accept consent.");
    }
  }

  async function createPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const values = formValues(event);
      await apiRequest("/api/professional/payments", {
        method: "POST",
        token,
        body: {
          method: values.method ?? "manual_reference",
          currency: values.currency ?? "KES",
          external_reference: values.external_reference ?? "",
          idempotency_key: values.idempotency_key || `web-${Date.now()}`,
        },
      });
      setMessage("Payment reference created. Admin confirmation controls remain on the backend.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create payment reference.");
    }
  }

  return (
    <div className="split-panel">
      <section className="form-card">
        <h2>Consent</h2>
        <p>{display(consent.current_text, "Accept the current Afyalink processing consent before submission.")}</p>
        <MetaGrid
          items={[
            { label: "Current version", value: consent.current_version },
            { label: "Accepted", value: consent.accepted_current },
          ]}
        />
        <div className="action-row" style={{ marginTop: 18 }}>
          <button className="button" type="button" disabled={!token || Boolean(consent.accepted_current)} onClick={acceptConsent}>
            Accept current consent
          </button>
        </div>
      </section>
      <section className="form-card">
        <h2>Payment reference</h2>
        <form className="form-grid" onSubmit={createPayment}>
          <Field label="Method" name="method" defaultValue="manual_reference" />
          <Field label="Currency" name="currency" defaultValue="KES" />
          <Field label="External reference" name="external_reference" placeholder="M-PESA or manual reference" />
          <Field label="Idempotency key" name="idempotency_key" placeholder="Optional; generated if empty" />
          <button className="button full" type="submit" disabled={!token}>
            Create payment reference
          </button>
        </form>
        <div className="data-list" style={{ marginTop: 18 }}>
          {payments.map((payment) => (
            <DataRow
              key={String(payment.id)}
              title={display(payment.intent_reference)}
              status={payment.status}
              meta={[
                { label: "Amount", value: payment.amount_cents ? `${Number(payment.amount_cents) / 100} ${payment.currency}` : null },
                { label: "Method", value: payment.method },
                { label: "External ref", value: payment.external_reference },
              ]}
            />
          ))}
        </div>
      </section>
      <div className="full data-list">
        {message ? <Feedback message={message} /> : null}
        {error ? <Feedback message={error} tone="error" /> : null}
      </div>
    </div>
  );
}

function ApplicationPanel({
  token,
  readiness,
  application,
  refresh,
}: {
  token: string;
  readiness: Record<string, unknown>;
  application: Record<string, unknown>;
  refresh: () => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const ready = Boolean(readiness.ready);

  async function submit() {
    setMessage("");
    setError("");
    try {
      await apiRequest("/api/professional/application/submit", { method: "POST", token, body: {} });
      setMessage("Application submitted. The backend accepted the current readiness state.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit application.");
    }
  }

  return (
    <section className="card">
      <h2>Application submission</h2>
      <MetaGrid
        items={[
          { label: "Application", value: application.application_number ?? application.id },
          { label: "Status", value: application.status },
          { label: "Ready", value: readiness.ready },
          { label: "Submitted at", value: application.submitted_at },
        ]}
      />
      <div className="action-row" style={{ marginTop: 18 }}>
        <button
          className="button"
          type="button"
          disabled={!token || !ready}
          title={ready ? "" : "Complete backend readiness requirements before submitting."}
          onClick={submit}
        >
          Submit application
        </button>
        <Link className="button secondary" href="/portal/professional/consent-payment">
          Review prerequisites
        </Link>
      </div>
      <div className="data-list" style={{ marginTop: 18 }}>
        {!ready ? (
          <Feedback message={`Submission is blocked by: ${asArray<string>(readiness.missing).join(", ") || "backend readiness checks"}`} tone="error" />
        ) : null}
        {message ? <Feedback message={message} /> : null}
        {error ? <Feedback message={error} tone="error" /> : null}
      </div>
    </section>
  );
}

function VerificationPanel({ cases }: { cases: Record<string, unknown>[] }) {
  return (
    <section className="card">
      <h2>Verification cases</h2>
      <div className="data-list">
        {cases.length ? (
          cases.map((item) => (
            <DataRow
              key={String(item.id)}
              title={display(item.regulatory_body_name ?? item.regulatory_body_code)}
              status={item.status}
              meta={[
                { label: "Method", value: item.verification_method },
                { label: "License", value: item.license_number },
                { label: "Assigned", value: item.assigned_to },
              ]}
            />
          ))
        ) : (
          <EmptyState title="No verification cases yet" body="Cases appear after Afyalink starts the verification workflow." />
        )}
      </div>
    </section>
  );
}

function InterviewPanel({ interviews }: { interviews: Record<string, unknown>[] }) {
  return (
    <section className="card">
      <h2>Interview schedule</h2>
      <div className="data-list">
        {interviews.length ? (
          interviews.map((item) => (
            <DataRow
              key={String(item.id)}
              title={display(item.mode ?? "Interview")}
              status={item.status}
              meta={[
                { label: "Start", value: item.scheduled_start_at },
                { label: "End", value: item.scheduled_end_at },
                { label: "Outcome", value: item.recommendation },
              ]}
            />
          ))
        ) : (
          <EmptyState title="No interview scheduled" body="Interview details appear here once Afyalink schedules them." />
        )}
      </div>
    </section>
  );
}

function PublicationPanel({ visibility }: { visibility: Record<string, unknown> }) {
  return (
    <section className="secure-profile" data-watermark="Afyalink professional visibility">
      <h2>Facility catalogue visibility</h2>
      <p>
        This page shows high-level publication status. Facility identities and sensitive view details remain protected
        unless the product explicitly permits broader disclosure later.
      </p>
      <MetaGrid
        items={[
          { label: "Visible to facilities", value: visibility.visible },
          { label: "Publication status", value: visibility.publication_status },
          { label: "Profile view count", value: visibility.profile_view_count },
          { label: "Last published", value: visibility.published_at },
          { label: "Paused or withdrawn", value: visibility.unpublished_at },
          { label: "Catalogue note", value: visibility.note },
        ]}
      />
    </section>
  );
}

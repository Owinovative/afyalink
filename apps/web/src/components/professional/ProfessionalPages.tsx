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
  | "waiting-license"
  | "consent-payment"
  | "application"
  | "verification"
  | "interview"
  | "publication"
  | "placement-preferences"
  | "opportunities"
  | "opportunity-detail";

const professionalSectionTitles: Record<ProfessionalSection, string> = {
  home: "Professional workspace",
  dashboard: "Dashboard",
  profile: "Profile",
  credentials: "Credentials",
  "waiting-license": "Waiting License",
  "consent-payment": "Consent & Payment",
  application: "Application",
  verification: "Verification",
  interview: "Interview",
  publication: "Publication",
  "placement-preferences": "Placement preferences",
  opportunities: "Opportunities",
  "opportunity-detail": "Opportunity detail",
};

const professionalSectionBodies: Record<ProfessionalSection, string> = {
  home: "Your verification workspace.",
  dashboard: "Status and next steps.",
  profile: "Keep details current.",
  credentials: "Upload private records.",
  "waiting-license": "License pending. Prepare safely.",
  "consent-payment": "Consent and payment reference.",
  application: "Submit when ready.",
  verification: "Regulatory review status.",
  interview: "Schedule and outcome.",
  publication: "Facility visibility status.",
  "placement-preferences": "Availability and preferences.",
  opportunities: "Approved placement leads.",
  "opportunity-detail": "One opportunity.",
};

const documentTypes = [
  ["cv", "Curriculum vitae"],
  ["national_id_or_passport", "National ID or passport"],
  ["professional_license", "Professional license"],
  ["academic_certificate", "Academic certificate"],
  ["student_id_or_training_proof", "Student ID or training proof"],
  ["transcript_or_completion_evidence", "Transcript or completion evidence"],
  ["internship_or_attachment_evidence", "Internship or attachment evidence"],
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

export function ProfessionalPage({ section, id }: { section: ProfessionalSection; id?: string }) {
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
  const prelicensure = asRecord(data.prelicensure);

  return (
    <>
      <PageHeader
        eyebrow="Professional portal"
        title={professionalSectionTitles[section]}
        body={professionalSectionBodies[section]}
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
          prelicensure={prelicensure}
        />
      ) : null}
      {section === "profile" ? <ProfileForm token={resource.token} profile={profile} refresh={resource.refresh} /> : null}
      {section === "waiting-license" ? (
        <WaitingLicensePanel token={resource.token} profile={profile} prelicensure={prelicensure} credentials={credentials} refresh={resource.refresh} />
      ) : null}
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
      {section === "placement-preferences" ? <PlacementPreferences /> : null}
      {section === "opportunities" ? <ProfessionalOpportunities /> : null}
      {section === "opportunity-detail" && id ? <ProfessionalOpportunityDetail id={id} /> : null}
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
  prelicensure,
}: {
  account: Record<string, unknown>;
  readiness: Record<string, unknown>;
  profile: Record<string, unknown>;
  credentials: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  consent: Record<string, unknown>;
  visibility: Record<string, unknown>;
  prelicensure: Record<string, unknown>;
}) {
  const missing = asArray<string>(readiness.missing);
  const warnings = asArray<string>(readiness.warnings);

  return (
    <div className="data-list">
      <section className="professional-portal-hero">
        <div>
          <span className="eyebrow">Readiness</span>
          <h2>{display(profile.name ?? account.email, "Your Afyalink profile")}</h2>
          <p>Status, credentials, review, publication.</p>
        </div>
        <div className="portal-step-strip" aria-label="Professional pathway">
          <span className={account.email_verified ? "complete" : ""}>Email</span>
          <span className={profile.id ? "complete" : ""}>Profile</span>
          <span className={credentials.length ? "complete" : ""}>Credentials</span>
          <span className={readiness.ready ? "complete" : ""}>Ready</span>
        </div>
      </section>
      <MetricGrid
        metrics={[
          { label: "Email", value: account.email_verified ? "Verified" : "Needs verification" },
          { label: "Profile", value: profile.id ? "Started" : "Not started" },
          { label: "Credentials", value: credentials.length },
          { label: "Application readiness", value: readiness.ready ? "Ready" : "Blocked" },
          { label: "Applicant track", value: profile.applicant_track ?? prelicensure.track ?? "licensed_professional" },
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
            <p>No missing requirements.</p>
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
        {prelicensure.active ? (
          <div className="card">
            <h3>Waiting-license track</h3>
            <p>Prepare now. Publish after conversion.</p>
            <MetaGrid
              items={[
                { label: "Status", value: prelicensure.student_status },
                { label: "Conversion", value: prelicensure.conversion_review_status },
                { label: "License pending", value: prelicensure.license_pending },
                { label: "Ready for conversion", value: prelicensure.can_request_conversion },
              ]}
            />
            <div className="action-row" style={{ marginTop: 18 }}>
              <Link className="button secondary" href="/portal/professional/waiting-license">
                Open checklist
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PlacementPreferences() {
  const resource = useApiResource<Record<string, unknown>>("professional", "/api/professional/placement");
  const preferences = asRecord(asRecord(resource.data).preferences);
  const profile = asRecord(asRecord(resource.data).profile);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest("/api/professional/placement/preferences", { method: "PUT", token: resource.token, body: formValues(event) });
      setMessage("Placement preferences saved.");
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save placement preferences.");
    }
  }

  return (
    <div className="data-list">
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      {message ? <Feedback message={message} /> : null}
      {error ? <Feedback message={error} tone="error" /> : null}
      <section className="card">
        <h2>Match readiness</h2>
        <MetaGrid
          items={[
            { label: "Applicant track", value: profile.applicant_track },
            { label: "Open to work", value: preferences.open_to_work },
            { label: "Availability", value: preferences.availability_status },
            { label: "Match ready", value: asRecord(resource.data).match_ready },
            { label: "Student notice", value: asRecord(resource.data).student_notice },
          ]}
        />
      </section>
      <section className="form-card">
        <h2>Availability and preferences</h2>
        <form className="form-grid" onSubmit={submit}>
          <label>
            Open to work
            <select name="open_to_work" defaultValue={String(preferences.open_to_work ?? "false")}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <label>
            Availability
            <select name="availability_status" defaultValue={String(preferences.availability_status ?? "not_available")}>
              <option value="available_now">Available now</option>
              <option value="available_from_date">Available from date</option>
              <option value="not_available">Not available</option>
            </select>
          </label>
          <Field label="Available from" name="available_from" type="date" defaultValue={String(preferences.available_from ?? "")} />
          <Field label="Preferred counties" name="preferred_counties" defaultValue={asArray(preferences.preferred_counties).join(", ")} />
          <Field label="Preferred facility types" name="preferred_facility_types" defaultValue={asArray(preferences.preferred_facility_types).join(", ")} />
          <Field label="Employment types" name="employment_types" defaultValue={asArray(preferences.employment_types).join(", ")} />
          <Field label="Shift preferences" name="shift_preferences" defaultValue={asArray(preferences.shift_preferences).join(", ")} />
          <Field label="Desired roles" name="desired_roles" defaultValue={asArray(preferences.desired_roles).join(", ")} />
          <Field label="Minimum rate or salary" name="minimum_rate_or_salary" defaultValue={String(preferences.minimum_rate_or_salary ?? "")} />
          <Field label="Relocation willingness" name="relocation_willingness" defaultValue={String(preferences.relocation_willingness ?? "")} />
          <label>
            Remote or telehealth interest
            <select name="remote_or_telehealth_interest" defaultValue={String(preferences.remote_or_telehealth_interest ?? "false")}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </label>
          <Field label="Available after license" name="available_after_license" defaultValue={String(preferences.available_after_license ?? "")} />
          <label>
            Internship or attachment interest
            <select name="internship_or_attachment_interest" defaultValue={String(preferences.internship_or_attachment_interest ?? "false")}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </label>
          <TextArea label="Notes" name="notes" defaultValue={String(preferences.notes ?? "")} />
          <button className="button full" type="submit" disabled={!resource.token}>
            Save preferences
          </button>
        </form>
      </section>
    </div>
  );
}

function ProfessionalOpportunities() {
  const resource = useApiResource<Record<string, unknown>>("professional", "/api/professional/opportunities");
  const opportunities = asArray<Record<string, unknown>>(asRecord(resource.data).opportunities);

  return (
    <section className="card">
      <h2>Placement opportunities</h2>
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      <div className="data-list">
        {opportunities.length ? opportunities.map((item) => (
          <DataRow key={String(item.id)} title={`Opportunity ${display(item.id)}`} status={item.status} meta={[
            { label: "Facility", value: asRecord(item.facility).display_name },
            { label: "Employment", value: item.employment_type },
            { label: "Start", value: item.start_date },
            { label: "Updated", value: item.updated_at },
          ]}>
            <Link className="button secondary" href={`/portal/professional/opportunities/${item.id}`}>
              Open
            </Link>
          </DataRow>
        )) : <EmptyState title="No opportunities yet" body="Approved placement leads appear here." />}
      </div>
    </section>
  );
}

function ProfessionalOpportunityDetail({ id }: { id: string }) {
  const resource = useApiResource<Record<string, unknown>>("professional", `/api/professional/opportunities/${id}`);
  const placement = asRecord(asRecord(resource.data).placement);
  const events = asArray<Record<string, unknown>>(asRecord(resource.data).events);

  return (
    <div className="data-list">
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      <section className="card">
        <h2>Opportunity {display(placement.id)}</h2>
        <MetaGrid
          items={[
            { label: "Status", value: placement.status },
            { label: "Facility", value: asRecord(placement.facility).display_name },
            { label: "Employment", value: placement.employment_type },
            { label: "Start", value: placement.start_date },
            { label: "End", value: placement.end_date },
            { label: "Your note", value: placement.professional_note },
          ]}
        />
      </section>
      <section className="card">
        <h2>Timeline</h2>
        <div className="data-list">
          {events.map((event) => (
            <DataRow key={String(event.id)} title={display(event.event_type)} status={event.to_status} meta={[{ label: "From", value: event.from_status }, { label: "Created", value: event.created_at }]} />
          ))}
        </div>
      </section>
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
  const isStudent = (profile.applicant_track ?? "") === "student_awaiting_license";

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
        <input type="hidden" name="applicant_track" value={isStudent ? "student_awaiting_license" : "licensed_professional"} />
        <Field label="Full name" name="name" required defaultValue={String(profile.name ?? "")} />
        <Field label="Phone" name="phone" required defaultValue={String(profile.phone ?? "")} />
        {isStudent ? (
          <>
            <label>
              Student or graduate status
              <select name="student_status" required defaultValue={String(profile.student_status ?? "completed_training_waiting_license")}>
                <option value="currently_studying">Currently studying</option>
                <option value="completed_training_waiting_license">Completed training, waiting for license</option>
                <option value="internship_or_attachment">Internship or attachment</option>
              </select>
            </label>
            <Field label="Target profession" name="target_profession" required defaultValue={String(profile.target_profession ?? profile.profession ?? "")} />
            <Field label="Institution" name="institution_name" required defaultValue={String(profile.institution_name ?? "")} />
            <Field label="Programme or course" name="programme_or_course" required defaultValue={String(profile.programme_or_course ?? "")} />
            <Field label="Graduation/completion date" name="graduation_or_completion_date" type="date" defaultValue={String(profile.graduation_or_completion_date ?? "")} />
            <Field label="Expected regulatory body" name="expected_regulatory_body" defaultValue={String(profile.expected_regulatory_body ?? profile.regulatory_body ?? "")} />
            <Field label="County" name="county" required defaultValue={String(profile.county ?? "")} />
            <Field label="License number once issued" name="license_number" defaultValue={String(profile.license_number ?? "")} />
            <Field label="Regulatory body once issued" name="regulatory_body" defaultValue={String(profile.regulatory_body ?? "")} />
            <Field label="Availability after licensure" name="availability_after_licensure" defaultValue={String(profile.availability ?? "")} />
            <Field label="Preferred counties" name="preferred_counties" defaultValue={String(profile.preferred_counties ?? "")} />
            <Field label="Placement type after license" name="placement_type" defaultValue={String(profile.placement_type ?? "")} />
            <TextArea label="Student review note" name="notes" defaultValue={String(profile.notes ?? "")} />
          </>
        ) : (
          <>
            <Field label="Profession" name="profession" required defaultValue={String(profile.profession ?? "")} />
            <Field label="Regulatory body" name="regulatory_body" required defaultValue={String(profile.regulatory_body ?? "")} />
            <Field label="License number" name="license_number" required defaultValue={String(profile.license_number ?? "")} />
            <Field label="County" name="county" required defaultValue={String(profile.county ?? "")} />
            <Field label="Years experience" name="years_experience" type="number" min="0" defaultValue={String(profile.years_experience ?? "0")} />
            <Field label="Availability" name="availability" defaultValue={String(profile.availability ?? "")} />
            <Field label="Preferred counties" name="preferred_counties" defaultValue={String(profile.preferred_counties ?? "")} />
            <Field label="Placement type" name="placement_type" defaultValue={String(profile.placement_type ?? "")} />
            <TextArea label="Work preferences" name="work_preferences" defaultValue={String(profile.work_preferences ?? "")} />
          </>
        )}
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

function WaitingLicensePanel({
  token,
  profile,
  prelicensure,
  credentials,
  refresh,
}: {
  token: string;
  profile: Record<string, unknown>;
  prelicensure: Record<string, unknown>;
  credentials: Record<string, unknown>[];
  refresh: () => Promise<void>;
}) {
  if (!prelicensure.active) {
    return (
      <section className="card">
        <h2>Waiting-license track</h2>
        <p>This page is for pre-licensure accounts.</p>
      </section>
    );
  }

  return (
    <div className="data-list">
      <section className="secure-profile" data-watermark="Afyalink waiting-license track">
        <div className="eyebrow">Pre-licensure pathway</div>
        <h2>Waiting for license.</h2>
        <p>Prepare now. Apply after conversion.</p>
        <div className="portal-step-strip student-track-strip" aria-label="Student pathway">
          <span className="complete">Early profile</span>
          <span className={credentials.length ? "complete" : ""}>Documents</span>
          <span>License pending</span>
          <span>Conversion later</span>
        </div>
        <MetaGrid
          items={[
            { label: "Target profession", value: profile.target_profession ?? profile.profession },
            { label: "Institution", value: profile.institution_name },
            { label: "Programme", value: profile.programme_or_course },
            { label: "Conversion status", value: prelicensure.conversion_review_status },
            { label: "License pending", value: prelicensure.license_pending },
            { label: "Ready for conversion", value: prelicensure.can_request_conversion },
          ]}
        />
      </section>
      <section className="card">
        <h2>Preliminary credential checklist</h2>
        <div className="data-list">
          {asArray<Record<string, unknown>>(prelicensure.required_documents).map((item) => (
            <DataRow
              key={String(item.document_type)}
              title={display(item.document_type)}
              status={item.uploaded ? item.review_status ?? "uploaded" : "missing"}
              meta={[
                { label: "Purpose", value: item.unlocks ? "Conversion" : "Readiness" },
              ]}
            />
          ))}
        </div>
        <div className="action-row" style={{ marginTop: 18 }}>
          <Link className="button secondary" href="/portal/professional/credentials">
            Upload documents
          </Link>
          <Link className="button secondary" href="/portal/professional/profile">
            Update license details
          </Link>
        </div>
      </section>
      <CredentialsPanel token={token} credentials={credentials} refresh={refresh} />
    </div>
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
      setMessage("Credential uploaded for review.");
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
            <EmptyState title="No credentials uploaded" body="Upload required documents here." />
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
      setMessage("Payment reference created.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create payment reference.");
    }
  }

  return (
    <div className="split-panel">
      <section className="form-card">
        <h2>Consent</h2>
        <p>{display(consent.current_text, "Accept consent before submission.")}</p>
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
      setMessage("Application submitted.");
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
          title={ready ? "" : "Complete readiness first."}
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
          <EmptyState title="No verification cases yet" body="Cases appear after review starts." />
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
          <EmptyState title="No interview scheduled" body="Interview details appear here." />
        )}
      </div>
    </section>
  );
}

function PublicationPanel({ visibility }: { visibility: Record<string, unknown> }) {
  return (
    <section className="secure-profile" data-watermark="Afyalink professional visibility">
      <h2>Facility catalogue visibility</h2>
      <p>High-level visibility only. Sensitive view details stay protected.</p>
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

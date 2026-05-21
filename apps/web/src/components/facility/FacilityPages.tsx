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

type FacilitySection =
  | "home"
  | "dashboard"
  | "onboarding"
  | "access"
  | "candidates"
  | "candidate-detail"
  | "appointments"
  | "recommendations"
  | "packages";

const facilitySectionTitles: Record<FacilitySection, string> = {
  home: "Facility workspace",
  dashboard: "Dashboard",
  onboarding: "Onboarding",
  access: "Access",
  candidates: "Candidates",
  "candidate-detail": "Candidate detail",
  appointments: "Appointments",
  recommendations: "Recommendations",
  packages: "Packages",
};

const facilitySectionBodies: Record<FacilitySection, string> = {
  home: "Your approved facility workspace.",
  dashboard: "Track onboarding, access, requests, and shared packages.",
  onboarding: "Keep organization details ready for Afyalink review.",
  access: "Create access references and view entitlement state.",
  candidates: "Browse published candidates after approval and active access.",
  "candidate-detail": "Open a watermarked read-only candidate profile.",
  appointments: "Request consultation or hiring support.",
  recommendations: "Ask Afyalink to recommend professionals for a role.",
  packages: "Review shared recommendation packages.",
};

function csvIds(value: unknown) {
  return String(value ?? "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export function FacilityPage({ section, publicationId }: { section: FacilitySection; publicationId?: string }) {
  const resource = useApiResource<Record<string, unknown>>("facility", "/api/facility/dashboard");
  const data = asRecord(resource.data);
  const facility = asRecord(data.facility);
  const membership = asRecord(data.membership);
  const access = asRecord(data.access);
  const requests = asArray<Record<string, unknown>>(data.requests);
  const recommendationRequests = asArray<Record<string, unknown>>(data.recommendation_requests);
  const packages = asArray<Record<string, unknown>>(data.recommendation_packages);

  return (
    <>
      <PageHeader
        eyebrow="Facility portal"
        title={facilitySectionTitles[section]}
        body={facilitySectionBodies[section]}
      />
      {resource.loading ? <div className="notice">Loading facility dashboard...</div> : null}
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      {section === "home" || section === "dashboard" ? (
        <FacilityDashboard facility={facility} membership={membership} access={access} requests={requests} recommendationRequests={recommendationRequests} packages={packages} />
      ) : null}
      {section === "onboarding" ? <FacilityOnboarding token={resource.token} facility={facility} refresh={resource.refresh} /> : null}
      {section === "access" ? <FacilityAccess token={resource.token} access={access} refresh={resource.refresh} /> : null}
      {section === "candidates" ? <CandidateMarketplace token={resource.token} /> : null}
      {section === "candidate-detail" && publicationId ? <CandidateDetail publicationId={publicationId} /> : null}
      {section === "appointments" ? <AppointmentRequests token={resource.token} requests={requests} refresh={resource.refresh} /> : null}
      {section === "recommendations" ? (
        <RecommendationRequests token={resource.token} requests={recommendationRequests} refresh={resource.refresh} />
      ) : null}
      {section === "packages" ? <SharedPackages packages={packages} /> : null}
    </>
  );
}

function FacilityDashboard({
  facility,
  membership,
  access,
  requests,
  recommendationRequests,
  packages,
}: {
  facility: Record<string, unknown>;
  membership: Record<string, unknown>;
  access: Record<string, unknown>;
  requests: Record<string, unknown>[];
  recommendationRequests: Record<string, unknown>[];
  packages: Record<string, unknown>[];
}) {
  const activeSubscription = asRecord(access.active_subscription);

  return (
    <div className="data-list">
      <MetricGrid
        metrics={[
          { label: "Facility review", value: facility.review_status ?? "Not started" },
          { label: "Access", value: access.active ? "Active" : "Blocked" },
          { label: "Open requests", value: requests.length },
          { label: "Shared packages", value: packages.length },
        ]}
      />
      <div className="grid-2">
        <div className="card">
          <h2>{display(facility.display_name, "Facility onboarding required")}</h2>
          <MetaGrid
            items={[
              { label: "Legal name", value: facility.legal_name },
              { label: "Type", value: facility.facility_type },
              { label: "County", value: facility.county },
              { label: "Member role", value: membership.role },
              { label: "Review note", value: facility.review_note },
              { label: "Submitted", value: facility.submitted_at },
            ]}
          />
        </div>
        <div className="card">
          <h2>Access status</h2>
          <MetaGrid
            items={[
              { label: "Active", value: access.active },
              { label: "Subscription", value: activeSubscription.status },
              { label: "Plan", value: activeSubscription.plan_code },
              { label: "Starts", value: activeSubscription.starts_at },
              { label: "Ends", value: activeSubscription.ends_at },
              { label: "Reference", value: activeSubscription.payment_reference },
            ]}
          />
          <div className="action-row" style={{ marginTop: 18 }}>
            <Link className="button secondary" href="/portal/facility/onboarding">
              Update onboarding
            </Link>
            <Link className="button secondary" href="/portal/facility/access">
              Manage access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FacilityOnboarding({
  token,
  facility,
  refresh,
}: {
  token: string;
  facility: Record<string, unknown>;
  refresh: () => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest("/api/facility/profile", { method: "PUT", token, body: formValues(event) });
      setMessage("Facility profile saved.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save facility.");
    }
  }

  async function submit() {
    setMessage("");
    setError("");
    try {
      await apiRequest("/api/facility/submit", { method: "POST", token, body: {} });
      setMessage("Facility submitted for Afyalink review.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit facility.");
    }
  }

  return (
    <section className="form-card">
      <h2>Facility organization details</h2>
      <form className="form-grid" key={String(facility.updated_at ?? facility.id ?? "new")} onSubmit={save}>
        <Field label="Legal name" name="legal_name" required defaultValue={String(facility.legal_name ?? "")} />
        <Field label="Display name" name="display_name" required defaultValue={String(facility.display_name ?? "")} />
        <Field label="Facility type" name="facility_type" required defaultValue={String(facility.facility_type ?? "")} />
        <Field label="Registration number" name="registration_number" defaultValue={String(facility.registration_number ?? "")} />
        <Field label="County" name="county" required defaultValue={String(facility.county ?? "")} />
        <Field label="City or town" name="location" defaultValue={String(facility.location ?? "")} />
        <Field label="Official email" name="email" type="email" required defaultValue={String(facility.email ?? "")} />
        <Field label="Phone" name="phone" required defaultValue={String(facility.phone ?? "")} />
        <Field label="Contact person" name="contact_person" required defaultValue={String(facility.contact_person ?? "")} />
        <TextArea label="Physical address" name="physical_address" defaultValue={String(facility.physical_address ?? "")} />
        <div className="form-actions full">
          <button className="button" type="submit" disabled={!token}>
            Save facility
          </button>
          <button className="button secondary" type="button" disabled={!token || !facility.id} onClick={submit}>
            Submit for review
          </button>
        </div>
      </form>
      <div className="data-list" style={{ marginTop: 18 }}>
        <MetaGrid
          items={[
            { label: "Current status", value: facility.review_status },
            { label: "Operational status", value: facility.operational_status },
            { label: "Review note", value: facility.review_note },
          ]}
        />
        {message ? <Feedback message={message} /> : null}
        {error ? <Feedback message={error} tone="error" /> : null}
      </div>
    </section>
  );
}

function FacilityAccess({ token, access, refresh }: { token: string; access: Record<string, unknown>; refresh: () => Promise<void> }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const subscriptions = asArray<Record<string, unknown>>(access.subscriptions);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const values = formValues(event);
      await apiRequest("/api/facility/access/payment-intents", {
        method: "POST",
        token,
        body: {
          ...values,
          idempotency_key: values.idempotency_key || `facility-web-${Date.now()}`,
        },
      });
      setMessage("Facility access payment reference created.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create facility access payment.");
    }
  }

  return (
    <div className="split-panel">
      <section className="form-card">
        <h2>Create access payment reference</h2>
        <form className="form-grid" onSubmit={submit}>
          <Field label="Plan code" name="plan_code" defaultValue="facility_marketplace" />
          <Field label="Billing period" name="billing_period" defaultValue="monthly" />
          <Field label="Currency" name="currency" defaultValue="KES" />
          <Field label="Payment reference" name="payment_reference" placeholder="Manual or M-PESA reference" />
          <Field label="Idempotency key" name="idempotency_key" placeholder="Optional; generated if blank" />
          <button className="button full" type="submit" disabled={!token}>
            Create access reference
          </button>
        </form>
        <div className="data-list" style={{ marginTop: 18 }}>
          {message ? <Feedback message={message} /> : null}
          {error ? <Feedback message={error} tone="error" /> : null}
        </div>
      </section>
      <section className="card">
        <h2>Access records</h2>
        <div className="data-list">
          {subscriptions.length ? (
            subscriptions.map((subscription) => (
              <DataRow
                key={String(subscription.id)}
                title={display(subscription.plan_code)}
                status={subscription.status}
                meta={[
                  { label: "Starts", value: subscription.starts_at },
                  { label: "Ends", value: subscription.ends_at },
                  { label: "Reference", value: subscription.payment_reference },
                ]}
              />
            ))
          ) : (
            <EmptyState title="No access record" body="Create a payment reference, then wait for Afyalink activation." />
          )}
        </div>
      </section>
    </div>
  );
}

function CandidateMarketplace({ token }: { token: string }) {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const submitted = event ? String(new FormData(event.currentTarget).get("search") ?? "").trim() : query;
      const suffix = submitted ? `?search=${encodeURIComponent(submitted)}` : "";
      const data = asRecord(await apiRequest(`/api/facility/candidates${suffix}`, { token }));
      setCandidates(asArray<Record<string, unknown>>(data.candidates));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load candidates.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Candidate marketplace</h2>
      <p>Only approved facilities with active access can browse published candidates.</p>
      <form className="form-grid" onSubmit={search} style={{ marginTop: 18 }}>
        <Field label="Search profession, county, or summary" name="search" defaultValue={query} />
        <label>
          Filter
          <select name="filter" onChange={(event) => setQuery(event.target.value)}>
            <option value="">All published candidates</option>
            <option value="nurse">Nurse</option>
            <option value="clinical">Clinical</option>
            <option value="nairobi">Nairobi</option>
            <option value="mombasa">Mombasa</option>
          </select>
        </label>
        <button className="button full" type="submit" disabled={!token || loading}>
          {loading ? "Loading..." : "Browse candidates"}
        </button>
      </form>
      <div className="data-list" style={{ marginTop: 18 }}>
        {error ? <Feedback message={error} tone="error" /> : null}
        {candidates.length ? (
          candidates.map((candidate) => (
            <DataRow
              key={String(candidate.id)}
              title={display(candidate.visible_profession ?? candidate.profession ?? `Candidate ${candidate.id}`)}
              status={candidate.publication_status}
              meta={[
                { label: "County", value: candidate.visible_location ?? candidate.county },
                { label: "Experience", value: candidate.visible_experience_years },
                { label: "Recommendation", value: candidate.recommendation_summary },
              ]}
            >
              <Link className="button secondary" href={`/portal/facility/candidates/${candidate.id}`}>
                Open secure profile
              </Link>
            </DataRow>
          ))
        ) : (
          <EmptyState title="No candidates loaded" body="Use Browse to request the current catalogue." />
        )}
      </div>
    </section>
  );
}

function CandidateDetail({ publicationId }: { publicationId: string }) {
  const resource = useApiResource<Record<string, unknown>>("facility", `/api/facility/candidates/${publicationId}`, Boolean(publicationId));
  const data = asRecord(resource.data);
  const publication = asRecord(data.publication);
  const profile = asRecord(data.profile);
  const watermark = asRecord(data.watermark);
  const credentials = asArray<Record<string, unknown>>(data.credential_metadata);
  const warning = display(data.legal_warning, "Access is monitored. Redistribution is prohibited.");
  const watermarkText = [
    display(watermark.facility_name, "Afyalink facility"),
    display(watermark.viewer_email, "authorized viewer"),
    `Candidate ${publicationId}`,
    display(watermark.viewed_at, new Date().toISOString()),
  ].join(" / ");

  return (
    <section className="secure-profile" data-watermark={watermarkText}>
      <div className="notice">{warning}</div>
      {resource.loading ? <div className="notice">Opening secure candidate profile and recording view audit...</div> : null}
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      <div className="split-panel" style={{ marginTop: 18 }}>
        <div>
          <h2>{display(profile.name ?? publication.public_summary, `Candidate ${publicationId}`)}</h2>
          <p>{display(publication.public_summary ?? profile.summary, "Published professional profile summary.")}</p>
          <MetaGrid
            items={[
              { label: "Profession", value: publication.visible_profession ?? profile.profession },
              { label: "Location", value: publication.visible_location ?? profile.county },
              { label: "Experience", value: publication.visible_experience_years ?? profile.years_experience },
              { label: "Qualification", value: publication.qualification_status },
              { label: "Recommendation", value: publication.recommendation_summary },
              { label: "Publication", value: publication.publication_status },
            ]}
          />
        </div>
        <div className="card">
          <h3>Approved credential metadata</h3>
          <div className="data-list">
            {credentials.length ? (
              credentials.map((item) => (
                <DataRow key={String(item.id ?? item.document_type)} title={display(item.document_type)} status={item.review_status} />
              ))
            ) : (
              <p>Approved metadata is not available. Raw private documents are not exposed.</p>
            )}
          </div>
        </div>
      </div>
      <div className="action-row" style={{ marginTop: 18 }}>
        <Link className="button secondary" href={`/portal/facility/appointments?candidate=${publicationId}`}>
          Request appointment
        </Link>
        <Link className="button secondary" href={`/portal/facility/recommendations?candidate=${publicationId}`}>
          Request recommendations
        </Link>
      </div>
    </section>
  );
}

function AppointmentRequests({
  token,
  requests,
  refresh,
}: {
  token: string;
  requests: Record<string, unknown>[];
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
      await apiRequest("/api/facility/requests/appointments", {
        method: "POST",
        token,
        body: { ...values, candidate_publication_ids: csvIds(values.candidate_publication_ids) },
      });
      setMessage("Appointment request submitted.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit appointment request.");
    }
  }

  return <RequestForm title="Appointment request" requiredField="title" token={token} submit={submit} message={message} error={error} rows={requests} />;
}

function RecommendationRequests({
  token,
  requests,
  refresh,
}: {
  token: string;
  requests: Record<string, unknown>[];
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
      await apiRequest("/api/facility/recommendation-requests", {
        method: "POST",
        token,
        body: { ...values, candidate_publication_ids: csvIds(values.candidate_publication_ids) },
      });
      setMessage("Recommendation request submitted.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit recommendation request.");
    }
  }

  return <RequestForm title="Recommendation request" requiredField="role_needed" token={token} submit={submit} message={message} error={error} rows={requests} />;
}

function RequestForm({
  title,
  requiredField,
  token,
  submit,
  message,
  error,
  rows,
}: {
  title: string;
  requiredField: "title" | "role_needed";
  token: string;
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  message: string;
  error: string;
  rows: Record<string, unknown>[];
}) {
  return (
    <div className="split-panel">
      <section className="form-card">
        <h2>{title}</h2>
        <form className="form-grid" onSubmit={submit}>
          <Field label={requiredField === "title" ? "Title" : "Role needed"} name={requiredField} required />
          <Field label="County" name="county" />
          <Field label="Urgency" name="urgency" />
          <Field label="Experience level" name="experience_level" />
          <Field label="Preferred timing" name="preferred_timing" />
          <Field label="Candidate publication IDs" name="candidate_publication_ids" placeholder="Comma-separated optional IDs" />
          <TextArea label="Notes" name="notes" />
          <button className="button full" type="submit" disabled={!token}>
            Submit request
          </button>
        </form>
        <div className="data-list" style={{ marginTop: 18 }}>
          {message ? <Feedback message={message} /> : null}
          {error ? <Feedback message={error} tone="error" /> : null}
        </div>
      </section>
      <section className="card">
        <h2>Existing requests</h2>
        <div className="data-list">
          {rows.length ? (
            rows.map((row) => (
              <DataRow
                key={String(row.id)}
                title={display(row.title ?? row.role_needed)}
                status={row.status}
                meta={[
                  { label: "County", value: row.county },
                  { label: "Urgency", value: row.urgency },
                ]}
              />
            ))
          ) : (
            <EmptyState title="No requests yet" body="Submit a request when your facility needs Afyalink support." />
          )}
        </div>
      </section>
    </div>
  );
}

function SharedPackages({ packages }: { packages: Record<string, unknown>[] }) {
  return (
    <section className="card">
      <h2>Shared recommendation packages</h2>
      <div className="data-list">
        {packages.length ? (
          packages.map((item) => (
            <DataRow
              key={String(item.id)}
              title={display(item.title)}
              status={item.status}
              meta={[
                { label: "Shared", value: item.shared_at },
                { label: "Summary", value: item.summary },
                { label: "Rationale", value: item.admin_rationale },
              ]}
            />
          ))
        ) : (
          <EmptyState title="No shared packages" body="Afyalink shared recommendation packages will appear here in read-only mode." />
        )}
      </div>
    </section>
  );
}

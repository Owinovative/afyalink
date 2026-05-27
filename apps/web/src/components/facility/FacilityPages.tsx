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
  | "packages"
  | "requisitions"
  | "requisition-new"
  | "requisition-detail"
  | "shortlists"
  | "placements"
  | "team";

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
  requisitions: "Requisitions",
  "requisition-new": "New requisition",
  "requisition-detail": "Requisition detail",
  shortlists: "Shortlists",
  placements: "Placements",
  team: "Facility team",
};

const facilitySectionBodies: Record<FacilitySection, string> = {
  home: "Your approved facility workspace.",
  dashboard: "Access, requests, packages.",
  onboarding: "Organization review details.",
  access: "Entitlement state.",
  candidates: "Published candidates only.",
  "candidate-detail": "Watermarked candidate profile.",
  appointments: "Request support.",
  recommendations: "Request curated candidates.",
  packages: "Shared packages.",
  requisitions: "Structured staffing needs.",
  "requisition-new": "Submit a staffing need.",
  "requisition-detail": "One staffing need.",
  shortlists: "Reviewed candidate lists.",
  placements: "Placement opportunities.",
  team: "Role-scoped collaborators.",
};

function csvIds(value: unknown) {
  return String(value ?? "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export function FacilityPage({ section, publicationId, id }: { section: FacilitySection; publicationId?: string; id?: string }) {
  const resource = useApiResource<Record<string, unknown>>("facility", "/api/facility/dashboard");
  const data = asRecord(resource.data);
  const facility = asRecord(data.facility);
  const membership = asRecord(data.membership);
  const access = asRecord(data.access);
  const requests = asArray<Record<string, unknown>>(data.requests);
  const recommendationRequests = asArray<Record<string, unknown>>(data.recommendation_requests);
  const packages = asArray<Record<string, unknown>>(data.recommendation_packages);
  const useEmbeddedHeader = ["home", "dashboard", "requisitions", "requisition-new", "requisition-detail"].includes(section);

  return (
    <>
      {!useEmbeddedHeader ? (
        <PageHeader
          eyebrow="Facility portal"
          title={facilitySectionTitles[section]}
          body={facilitySectionBodies[section]}
        />
      ) : null}
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
      {section === "requisitions" ? <FacilityRequisitions token={resource.token} /> : null}
      {section === "requisition-new" ? <FacilityRequisitionForm token={resource.token} /> : null}
      {section === "requisition-detail" && id ? <FacilityRequisitionDetail token={resource.token} id={id} /> : null}
      {section === "shortlists" ? <FacilityShortlists token={resource.token} /> : null}
      {section === "placements" ? <FacilityPlacements token={resource.token} /> : null}
      {section === "team" ? <FacilityTeam token={resource.token} /> : null}
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
    <div className="facility-dashboard">
      <section className="facility-portal-hero">
        <div>
          <span className="eyebrow">Facility command</span>
          <h2>{display(facility.display_name, "Complete onboarding")}</h2>
          <p>Access, needs, shortlists, placements.</p>
        </div>
        <div className="facility-hero-actions">
          <Link className="button" href="/portal/facility/requisitions/new">New requisition</Link>
          <Link className="button secondary translucent" href="/portal/facility/candidates">Browse candidates</Link>
        </div>
      </section>
      <MetricGrid
        metrics={[
          { label: "Facility review", value: facility.review_status ?? "Not started" },
          { label: "Access", value: access.active ? "Active" : "Blocked" },
          { label: "Open requests", value: requests.length },
          { label: "Shared packages", value: packages.length },
        ]}
      />
      <div className="grid-2 facility-dashboard-grid">
        <div className="card">
          <h2>Organization</h2>
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
      setMessage("Payment reference created.");
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
            <EmptyState title="No access record" body="Create a reference, then await activation." />
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
    <section className="card workspace-panel">
      <div className="workspace-panel-header">
        <div>
          <span className="eyebrow">Marketplace</span>
          <h2>Candidate marketplace</h2>
        </div>
        <span className="badge gold">Active access</span>
      </div>
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
          <EmptyState title="No candidates loaded" body="Use Browse to load catalogue." />
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
        <p>No approved metadata. Private documents stay hidden.</p>
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
            <EmptyState title="No requests yet" body="Submit a support request." />
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
          <EmptyState title="No shared packages" body="Shared packages appear here." />
        )}
      </div>
    </section>
  );
}

function FacilityRequisitions({ token }: { token: string }) {
  const resource = useApiResource<Record<string, unknown>>("facility", "/api/facility/requisitions");
  const requisitions = asArray<Record<string, unknown>>(asRecord(resource.data).requisitions);
  const submittedCount = requisitions.filter((row) => String(row.status ?? "").toLowerCase().includes("submit")).length;
  const activeCount = requisitions.filter((row) => !String(row.status ?? "").toLowerCase().includes("closed")).length;

  return (
    <section className="facility-requisition-board">
      <div className="facility-requisition-hero">
        <div>
          <span className="eyebrow">Requisitions</span>
          <h2>Staffing needs, reviewed clearly.</h2>
          <p>Create demand. Track shortlist progress.</p>
        </div>
        <Link className="button" href="/portal/facility/requisitions/new">
          New requisition
        </Link>
      </div>
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      {resource.loading ? <div className="notice">Loading requisitions...</div> : null}
      <MetricGrid
        metrics={[
          { label: "Total needs", value: requisitions.length },
          { label: "Submitted", value: submittedCount },
          { label: "Active board", value: activeCount },
          { label: "Review model", value: "Human" },
        ]}
      />
      <div className="facility-requisition-list">
        {requisitions.length ? requisitions.map((row) => (
          <article className="facility-requisition-card" key={String(row.id)}>
            <div>
              <span className="badge green">{display(row.status, "Draft")}</span>
              <h3>{display(row.title, "Untitled need")}</h3>
              <MetaGrid items={[
                { label: "Profession", value: row.profession_required },
                { label: "County", value: row.county },
                { label: "Employment", value: row.employment_type },
                { label: "Urgency", value: row.urgency },
              ]} />
            </div>
            <Link className="button secondary" href={`/portal/facility/requisitions/${row.id}`}>
              Open
            </Link>
          </article>
        )) : <EmptyState title="No staffing needs" body="Create a requisition." />}
      </div>
    </section>
  );
}

function FacilityRequisitionForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest("/api/facility/requisitions", { method: "POST", token, body: { ...formValues(event), submit: true } });
      setMessage("Requisition submitted.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit requisition.");
    }
  }

  return (
    <div className="facility-requisition-create">
      <section className="facility-requisition-hero">
        <div>
          <span className="eyebrow">New requisition</span>
          <h2>Define the need.</h2>
          <p>Afyalink reviews fit before sharing candidates.</p>
        </div>
        <Link className="button secondary translucent" href="/portal/facility/requisitions">
          Back to board
        </Link>
      </section>

      <div className="facility-requisition-form-grid">
        <section className="form-card facility-requisition-form">
          <span className="eyebrow">Staffing brief</span>
          <h2>Role details</h2>
          <form className="form-grid" onSubmit={submit}>
            <Field label="Title" name="title" required placeholder="Night shift registered nurse cover" />
            <Field label="Profession required" name="profession_required" required placeholder="Registered Nurse" />
            <Field label="Specialty" name="specialty_required" placeholder="ICU, theatre, maternity" />
            <Field label="Department" name="facility_department" placeholder="Ward, outpatient, emergency" />
            <label>
              Employment type
              <select name="employment_type" defaultValue="full_time">
                <option value="full_time">Full time</option>
                <option value="part_time">Part time</option>
                <option value="locum">Locum</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="attachment">Attachment</option>
                <option value="temporary">Temporary</option>
              </select>
            </label>
            <Field label="Positions" name="number_of_positions" type="number" defaultValue="1" />
            <Field label="County" name="county" required />
            <Field label="Facility site" name="facility_site" />
            <Field label="Required start date" name="required_start_date" type="date" />
            <Field label="End date" name="end_date" type="date" />
            <Field label="Minimum years experience" name="minimum_experience_years" type="number" />
            <label>
              Urgency
              <select name="urgency" defaultValue="normal">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <Field label="Shift pattern" name="shift_pattern" />
            <Field label="Required credentials" name="required_credentials" placeholder="License, BLS, ACLS" />
            <Field label="Preferred skills" name="preferred_skills" placeholder="ICU, triage, EMR" />
            <Field label="Language preferences" name="language_preferences" placeholder="English, Kiswahili" />
            <Field label="Salary or rate range" name="salary_or_rate_range" placeholder="KES range or negotiable" />
            <TextArea label="Notes" name="notes" />
            <button className="button full" type="submit" disabled={!token}>
              Submit requisition
            </button>
          </form>
          <div className="data-list" style={{ marginTop: 18 }}>
            {message ? <Feedback message={message} /> : null}
            {error ? <Feedback message={error} tone="error" /> : null}
          </div>
        </section>
        <aside className="facility-form-aside" aria-label="Requisition review model">
          <div>
            <span className="eyebrow">Review model</span>
            <h3>Need first. Match second.</h3>
            <p>Shortlists stay reviewed before facility sharing.</p>
          </div>
          <div className="home-chip-row">
            <span>Score</span>
            <span>Review</span>
            <span>Share</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FacilityRequisitionDetail({ token, id }: { token: string; id: string }) {
  const resource = useApiResource<Record<string, unknown>>("facility", `/api/facility/requisitions/${id}`);
  const requisition = asRecord(asRecord(resource.data).requisition);
  const shortlists = asArray<Record<string, unknown>>(asRecord(resource.data).shortlists);
  const placements = asArray<Record<string, unknown>>(asRecord(resource.data).placements);

  return (
    <div className="facility-requisition-detail">
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      <section className="facility-requisition-hero">
        <div>
          <span className="eyebrow">Requisition</span>
          <h2>{display(requisition.title, "Requisition")}</h2>
        </div>
        <MetaGrid items={[
          { label: "Status", value: requisition.status },
          { label: "Profession", value: requisition.profession_required },
          { label: "County", value: requisition.county },
          { label: "Employment", value: requisition.employment_type },
          { label: "Urgency", value: requisition.urgency },
        ]} />
      </section>
      <section className="card facility-detail-panel">
        <h2>Shared shortlists</h2>
        <div className="data-list">
          {shortlists.length ? shortlists.map((shortlist) => <DataRow key={String(shortlist.id)} title={display(shortlist.title)} status={shortlist.status} meta={[{ label: "Shared", value: shortlist.shared_at }, { label: "Candidates", value: asArray(shortlist.candidates).length }]} />) : <EmptyState title="No shortlist yet" body="Reviewed candidates appear here." />}
        </div>
      </section>
      <section className="card facility-detail-panel">
        <h2>Placements</h2>
        <div className="data-list">
          {placements.length ? placements.map((placement) => <DataRow key={String(placement.id)} title={`Placement ${display(placement.id)}`} status={placement.status} meta={[{ label: "Employment", value: placement.employment_type }, { label: "Start", value: placement.start_date }]} />) : <EmptyState title="No placements yet" body="Placement records appear here." />}
        </div>
      </section>
    </div>
  );
}

function FacilityShortlists({ token }: { token: string }) {
  const resource = useApiResource<Record<string, unknown>>("facility", "/api/facility/shortlists");
  const shortlists = asArray<Record<string, unknown>>(asRecord(resource.data).shortlists);

  return (
    <section className="card workspace-panel">
      <h2>Afyalink-reviewed shortlists</h2>
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      <div className="data-list">
        {shortlists.length ? shortlists.map((shortlist) => <DataRow key={String(shortlist.id)} title={display(shortlist.title)} status={shortlist.status} meta={[{ label: "Candidates", value: asArray(shortlist.candidates).length }, { label: "Shared", value: shortlist.shared_at }]} />) : <EmptyState title="No shared shortlists" body="Shortlists appear after review." />}
      </div>
    </section>
  );
}

function FacilityPlacements({ token }: { token: string }) {
  const resource = useApiResource<Record<string, unknown>>("facility", "/api/facility/placements");
  const placements = asArray<Record<string, unknown>>(asRecord(resource.data).placements);

  return (
    <section className="card workspace-panel">
      <h2>Placement pipeline</h2>
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      <div className="data-list">
        {placements.length ? placements.map((placement) => <DataRow key={String(placement.id)} title={`Placement ${display(placement.id)}`} status={placement.status} meta={[{ label: "Employment", value: placement.employment_type }, { label: "Start", value: placement.start_date }, { label: "Updated", value: placement.updated_at }]} />) : <EmptyState title="No placements" body="Active placement workflows appear here." />}
      </div>
    </section>
  );
}

function FacilityTeam({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest("/api/facility/team/invitations", { method: "POST", token, body: formValues(event) });
      setMessage("Invitation recorded and notification queued.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not invite member.");
    }
  }

  return (
    <section className="form-card workspace-panel">
      <h2>Invite a team member</h2>
      <form className="form-grid" onSubmit={invite}>
        <Field label="Email" name="email" type="email" required />
        <label>
          Role
          <select name="role" defaultValue="recruiter">
            <option value="admin">Admin</option>
            <option value="recruiter">Recruiter</option>
            <option value="viewer">Viewer</option>
            <option value="billing_manager">Billing manager</option>
          </select>
        </label>
        <button className="button full" type="submit" disabled={!token}>
          Send invitation
        </button>
      </form>
      <div className="data-list" style={{ marginTop: 18 }}>
        {message ? <Feedback message={message} /> : null}
        {error ? <Feedback message={error} tone="error" /> : null}
      </div>
    </section>
  );
}

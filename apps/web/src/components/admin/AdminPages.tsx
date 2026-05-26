"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DataRow, MetaGrid, MetricGrid } from "@/components/ui/DataViews";
import { EmptyState } from "@/components/ui/EmptyState";
import { Feedback } from "@/components/ui/Feedback";
import { Field, formValues, TextArea } from "@/components/ui/Forms";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiRequest, asArray, asRecord } from "@/lib/api/client";
import { display } from "@/lib/formatters";
import { useSessionToken } from "@/lib/auth/session";
import { useApiResource } from "@/lib/hooks/useApiResource";

type AdminSection =
  | "dashboard"
  | "applications"
  | "pre-licensure"
  | "application-detail"
  | "credentials"
  | "payments"
  | "verifications"
  | "verification-detail"
  | "interviews"
  | "interview-detail"
  | "facilities"
  | "facility-detail"
  | "publications"
  | "subscriptions"
  | "appointments"
  | "recommendations"
  | "requisitions"
  | "requisition-detail"
  | "matching"
  | "shortlists"
  | "placements"
  | "communications"
  | "integrations"
  | "security"
  | "reports"
  | "notifications"
  | "privacy"
  | "audit";

const adminSectionTitles: Record<AdminSection, string> = {
  dashboard: "Admin dashboard",
  applications: "Applications",
  "pre-licensure": "Pre-licensure",
  "application-detail": "Application detail",
  credentials: "Credentials",
  payments: "Payments",
  verifications: "Verifications",
  "verification-detail": "Verification detail",
  interviews: "Interviews",
  "interview-detail": "Interview detail",
  facilities: "Facilities",
  "facility-detail": "Facility detail",
  publications: "Publications",
  subscriptions: "Subscriptions",
  appointments: "Appointments",
  recommendations: "Recommendations",
  requisitions: "Requisitions",
  "requisition-detail": "Requisition detail",
  matching: "Matching",
  shortlists: "Shortlists",
  placements: "Placements",
  communications: "Communications",
  integrations: "Integrations",
  security: "Security",
  reports: "Reports",
  notifications: "Notifications",
  privacy: "Privacy requests",
  audit: "Audit",
};

const adminSectionBodies: Record<AdminSection, string> = {
  dashboard: "Queues and counters.",
  applications: "Submitted applications.",
  "pre-licensure": "Waiting-license applicants.",
  "application-detail": "One application.",
  credentials: "Credential review.",
  payments: "Payment references.",
  verifications: "Regulatory cases.",
  "verification-detail": "One verification case.",
  interviews: "Schedules and outcomes.",
  "interview-detail": "One interview.",
  facilities: "Facility onboarding.",
  "facility-detail": "One facility.",
  publications: "Catalogue entries.",
  subscriptions: "Facility access.",
  appointments: "Facility requests.",
  recommendations: "Recommendation packages.",
  requisitions: "Staffing needs.",
  "requisition-detail": "Match and shortlist.",
  matching: "Explainable matches.",
  shortlists: "Reviewed shortlists.",
  placements: "Placement pipeline.",
  communications: "Mediated threads.",
  integrations: "Integration readiness.",
  security: "Security readiness.",
  reports: "Operational reports.",
  notifications: "Delivery state.",
  privacy: "Privacy requests.",
  audit: "Sensitive activity.",
};

export function AdminPage({ section, id }: { section: AdminSection; id?: string }) {
  return (
    <>
      <PageHeader
        eyebrow="Admin operations"
        title={adminSectionTitles[section]}
        body={adminSectionBodies[section]}
      />
      {section === "dashboard" ? <AdminDashboard /> : null}
      {section === "pre-licensure" ? <PrelicensureQueue /> : null}
      {section === "applications" || section === "credentials" || section === "payments" ? (
        <ApplicationList mode={section} />
      ) : null}
      {section === "application-detail" && id ? <ApplicationDetail id={id} /> : null}
      {section === "verifications" ? <VerificationList /> : null}
      {section === "verification-detail" && id ? <VerificationDetail id={id} /> : null}
      {section === "interviews" ? <InterviewList /> : null}
      {section === "interview-detail" && id ? <InterviewDetail id={id} /> : null}
      {section === "facilities" || section === "subscriptions" ? <FacilityList mode={section} /> : null}
      {section === "facility-detail" && id ? <FacilityDetail id={id} /> : null}
      {section === "publications" ? <PublicationManager /> : null}
      {section === "appointments" ? <FacilityRequestManager /> : null}
      {section === "recommendations" ? <RecommendationManager /> : null}
      {section === "requisitions" || section === "matching" || section === "shortlists" ? <RequisitionManager /> : null}
      {section === "requisition-detail" && id ? <RequisitionDetail id={id} /> : null}
      {section === "placements" ? <PlacementManager /> : null}
      {section === "communications" ? <CommunicationManager /> : null}
      {section === "integrations" ? <IntegrationReadiness /> : null}
      {section === "security" ? <SecurityReadiness /> : null}
      {section === "reports" ? <ReportsDashboard /> : null}
      {section === "notifications" ? <NotificationOperations /> : null}
      {section === "privacy" ? <PrivacyRequests /> : null}
      {section === "audit" ? <AuditLog /> : null}
    </>
  );
}

function AdminDashboard() {
  const token = useSessionToken("admin");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const [applications, facilities, verifications, interviews, prelicensure, operations] = await Promise.all([
        apiRequest("/api/admin/applications", { token }),
        apiRequest("/api/admin/facility-operations/overview", { token }),
        apiRequest("/api/admin/verifications", { token }),
        apiRequest("/api/admin/interviews", { token }),
        apiRequest("/api/admin/pre-licensure", { token }),
        apiRequest("/api/admin/operations/dashboard", { token }),
      ]);
      const workQueues = asRecord(asRecord(asRecord(operations).operations).work_queues);
      setData({
        applications: asRecord(applications).overview,
        facilities: asRecord(facilities).facilities,
        access: asRecord(facilities).access,
        publications: asRecord(facilities).publications,
        engagements: asRecord(facilities).engagements,
        verifications: asRecord(verifications).overview,
        interviews: asRecord(interviews).overview,
        prelicensure: asRecord(prelicensure).overview,
        workQueues,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load admin dashboard.");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="data-list">
      {error ? <Feedback message={error} tone="error" /> : null}
      <MetricGrid
        metrics={[
          { label: "Applications", value: asRecord(data.applications).total },
          { label: "Pending facilities", value: asRecord(data.facilities).pending_approval },
          { label: "Published candidates", value: asRecord(data.publications).published },
          { label: "Open recommendations", value: asRecord(data.engagements).open_recommendation_requests },
          { label: "Verification cases", value: asRecord(data.verifications).total },
          { label: "Interviews", value: asRecord(data.interviews).total },
          { label: "Active access", value: asRecord(data.access).active },
          { label: "Waiting-license", value: asRecord(data.prelicensure).total },
          { label: "Payment reviews", value: asRecord(data.workQueues).payment_reviews },
          { label: "Notification failures", value: asRecord(data.workQueues).notification_failures },
        ]}
      />
      <div className="grid-3">
        <QuickLink title="Application review" href="/portal/admin/applications" body="Submissions and credentials." />
        <QuickLink title="Facility operations" href="/portal/admin/facilities" body="Approvals and access." />
        <QuickLink title="Recommendations" href="/portal/admin/recommendations" body="Curated packages." />
        <QuickLink title="Pre-licensure queue" href="/portal/admin/pre-licensure" body="Waiting-license applicants." />
        <QuickLink title="Reports" href="/portal/admin/reports" body="Funnel and delivery." />
        <QuickLink title="Notifications" href="/portal/admin/notifications" body="Pending and failed." />
      </div>
    </div>
  );
}

function QuickLink({ title, href, body }: { title: string; href: string; body: string }) {
  return (
    <article className="card">
      <h3>{title}</h3>
      <p>{body}</p>
      <div className="action-row" style={{ marginTop: 14 }}>
        <Link className="button secondary" href={href}>
          Open
        </Link>
      </div>
    </article>
  );
}

function PrelicensureQueue() {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/pre-licensure");
  const students = asArray<Record<string, unknown>>(asRecord(resource.data).students);
  const overview = asRecord(asRecord(resource.data).overview);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function convert(profileId: unknown) {
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/admin/pre-licensure/${profileId}/convert`, {
        method: "PATCH",
        token: resource.token,
        body: { note: "Converted from routed pre-licensure admin queue." },
      });
      setMessage("Applicant converted to licensed professional track.");
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not convert applicant.");
    }
  }

  return (
    <div className="data-list">
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      {message ? <Feedback message={message} /> : null}
      {error ? <Feedback message={error} tone="error" /> : null}
      <MetricGrid
        metrics={[
          { label: "Waiting-license total", value: overview.total },
          { label: "Still waiting", value: overview.waiting_for_license },
          { label: "License submitted", value: overview.license_submitted },
          { label: "Converted", value: overview.converted },
        ]}
      />
      <section className="card">
        <h2>Students and graduates awaiting license</h2>
        <div className="data-list">
          {students.length ? (
            students.map((student) => (
              <DataRow
                key={String(student.id)}
                title={display(student.name)}
                status={student.conversion_review_status}
                meta={[
                  { label: "Profession", value: student.target_profession },
                  { label: "Institution", value: student.institution_name },
                  { label: "County", value: student.county },
                  { label: "Regulatory body", value: student.expected_regulatory_body },
                  { label: "License", value: student.license_number },
                  { label: "Can convert", value: student.can_convert },
                ]}
              >
                <div className="data-list">
                  <div className="table-lite">
                    {asArray<Record<string, unknown>>(student.document_checklist).map((item) => (
                      <div key={String(item.document_type)}>
                        <span>{display(item.document_type)}</span>
                        <span className={item.uploaded ? "badge green" : "badge gold"}>{item.uploaded ? display(item.review_status) : "Missing"}</span>
                      </div>
                    ))}
                  </div>
                  <button className="button secondary" type="button" disabled={!resource.token || !student.can_convert} onClick={() => convert(student.id)}>
                    Convert to licensed track
                  </button>
                </div>
              </DataRow>
            ))
          ) : (
            <EmptyState title="No waiting-license applicants" body="Applicants appear after registration." />
          )}
        </div>
      </section>
    </div>
  );
}

function ApplicationList({ mode }: { mode: "applications" | "credentials" | "payments" }) {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/applications");
  const data = asRecord(resource.data);
  const applications = asArray<Record<string, unknown>>(data.applications);

  return (
    <section className="card">
      <h2>{mode === "applications" ? "Application queue" : mode === "credentials" ? "Credential review queue" : "Payment review queue"}</h2>
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      <div className="data-list">
        {applications.length ? (
          applications.map((application) => (
            <DataRow
              key={String(application.id)}
              title={display(application.application_number ?? `Application ${application.id}`)}
              status={application.status}
              meta={[
                { label: "Professional", value: application.professional_name ?? application.name },
                { label: "Submitted", value: application.submitted_at },
                { label: "Payment", value: application.payment_status },
              ]}
            >
              <Link className="button secondary" href={`/portal/admin/applications/${application.id}`}>
                Open detail
              </Link>
            </DataRow>
          ))
        ) : (
          <EmptyState title="No applications loaded" body="Submissions appear here." />
        )}
      </div>
    </section>
  );
}

function ApplicationDetail({ id }: { id: string }) {
  const resource = useApiResource<Record<string, unknown>>("admin", `/api/admin/applications/${id}`);
  const data = asRecord(resource.data);
  const application = asRecord(data.application);
  const professional = asRecord(data.professional);
  const profile = asRecord(data.profile);
  const credentials = asArray<Record<string, unknown>>(data.credentials);
  const payments = asArray<Record<string, unknown>>(data.payments);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function action(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/admin/applications/${id}/action`, {
        method: "POST",
        token: resource.token,
        body: formValues(event),
      });
      setMessage("Application action completed.");
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update application.");
    }
  }

  async function credentialAction(credentialId: unknown, status: string) {
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/admin/credentials/${credentialId}/review`, {
        method: "PATCH",
        token: resource.token,
        body: { status, note: "" },
      });
      setMessage(`Credential marked ${status}.`);
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not review credential.");
    }
  }

  async function paymentAction(paymentId: unknown, status: string) {
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/admin/payments/${paymentId}/status`, {
        method: "PATCH",
        token: resource.token,
        body: { status, note: "Updated from routed admin portal" },
      });
      setMessage(`Payment marked ${status}.`);
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update payment.");
    }
  }

  return (
    <div className="data-list">
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      {message ? <Feedback message={message} /> : null}
      {error ? <Feedback message={error} tone="error" /> : null}
      <section className="card">
        <h2>{display(application.application_number, `Application ${id}`)}</h2>
        <MetaGrid
          items={[
            { label: "Status", value: application.status },
            { label: "Professional", value: professional.name ?? profile.name },
            { label: "Email", value: professional.email },
            { label: "Profession", value: profile.profession },
            { label: "County", value: profile.county },
            { label: "Submitted", value: application.submitted_at },
          ]}
        />
      </section>
      <section className="form-card">
        <h2>Application action</h2>
        <form className="form-grid" onSubmit={action}>
          <label>
            Action
            <select name="action" required>
              <option value="start_review">Start review</option>
              <option value="request_replacement">Request replacement</option>
              <option value="verify">Mark verified</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
            </select>
          </label>
          <TextArea label="Review note" name="note" />
          <button className="button full" type="submit" disabled={!resource.token || !application.id}>
            Apply backend transition
          </button>
        </form>
      </section>
      <div className="grid-2">
        <section className="card">
          <h2>Credentials</h2>
          <div className="data-list">
            {credentials.map((credential) => (
              <DataRow
                key={String(credential.id)}
                title={display(credential.document_type)}
                status={credential.review_status}
                meta={[
                  { label: "File", value: credential.original_name },
                  { label: "Checksum", value: String(credential.checksum ?? "").slice(0, 16) },
                  { label: "Note", value: credential.review_note },
                ]}
              >
                <div className="action-row">
                  {["accepted", "needs_replacement", "rejected"].map((status) => (
                    <button className="button secondary" type="button" key={status} onClick={() => credentialAction(credential.id, status)}>
                      {display(status)}
                    </button>
                  ))}
                </div>
              </DataRow>
            ))}
          </div>
        </section>
        <section className="card">
          <h2>Payments</h2>
          <div className="data-list">
            {payments.map((payment) => (
              <DataRow
                key={String(payment.id)}
                title={display(payment.intent_reference)}
                status={payment.status}
                meta={[
                  { label: "Method", value: payment.method },
                  { label: "Amount", value: payment.amount_cents ? `${Number(payment.amount_cents) / 100} ${payment.currency}` : null },
                  { label: "External ref", value: payment.external_reference },
                ]}
              >
                <div className="action-row">
                  {["awaiting_provider", "confirmed", "failed"].map((status) => (
                    <button className="button secondary" type="button" key={status} onClick={() => paymentAction(payment.id, status)}>
                      {display(status)}
                    </button>
                  ))}
                </div>
              </DataRow>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function VerificationList() {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/verifications");
  const cases = asArray<Record<string, unknown>>(asRecord(resource.data).verification_cases);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const values = formValues(event);
      values.application_id = Number(values.application_id);
      await apiRequest("/api/admin/verifications", { method: "POST", token: resource.token, body: values });
      setMessage("Verification case created.");
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create verification case.");
    }
  }

  return (
    <div className="split-panel">
      <section className="form-card">
        <h2>Create verification case</h2>
        <form className="form-grid" onSubmit={create}>
          <Field label="Application ID" name="application_id" type="number" required />
          <Field label="Regulatory body code" name="regulatory_body_code" />
          <Field label="Verification method" name="verification_method" defaultValue="manual_registry_check" />
          <button className="button full" type="submit" disabled={!resource.token}>
            Create case
          </button>
        </form>
        <div className="data-list" style={{ marginTop: 18 }}>
          {message ? <Feedback message={message} /> : null}
          {error ? <Feedback message={error} tone="error" /> : null}
        </div>
      </section>
      <AdminRows title="Verification cases" rows={cases} detailBase="/portal/admin/verifications" statusKey="status" />
    </div>
  );
}

function VerificationDetail({ id }: { id: string }) {
  const resource = useApiResource<Record<string, unknown>>("admin", `/api/admin/verifications/${id}`);
  const item = asRecord(resource.data?.case);
  const profile = asRecord(resource.data?.profile);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/admin/verifications/${id}/status`, {
        method: "PATCH",
        token: resource.token,
        body: formValues(event),
      });
      setMessage("Verification status updated.");
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update verification.");
    }
  }

  return (
    <DetailWithStatus
      title={display(item.regulatory_body_name ?? `Verification ${id}`)}
      item={item}
      extra={profile}
      message={message}
      error={error || resource.error}
      form={(
        <form className="form-grid" onSubmit={update}>
          <label>
            Status
            <select name="status" required>
              {["pending", "assigned", "in_progress", "awaiting_external_response", "verified", "failed", "needs_clarification"].map((status) => (
                <option key={status} value={status}>
                  {display(status)}
                </option>
              ))}
            </select>
          </label>
          <TextArea label="Evidence note" name="evidence_note" />
          <button className="button full" type="submit" disabled={!resource.token || !item.id}>
            Update verification
          </button>
        </form>
      )}
    />
  );
}

function InterviewList() {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/interviews");
  const interviews = asArray<Record<string, unknown>>(asRecord(resource.data).interviews);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const values = formValues(event);
      values.application_id = Number(values.application_id);
      await apiRequest("/api/admin/interviews", { method: "POST", token: resource.token, body: values });
      setMessage("Interview scheduled.");
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not schedule interview.");
    }
  }

  return (
    <div className="split-panel">
      <section className="form-card">
        <h2>Schedule interview</h2>
        <form className="form-grid" onSubmit={schedule}>
          <Field label="Application ID" name="application_id" type="number" required />
          <Field label="Start time" name="scheduled_start_at" type="datetime-local" required />
          <Field label="End time" name="scheduled_end_at" type="datetime-local" required />
          <Field label="Mode" name="mode" defaultValue="video" />
          <Field label="Location or link" name="location" />
          <button className="button full" type="submit" disabled={!resource.token}>
            Schedule
          </button>
        </form>
        <div className="data-list" style={{ marginTop: 18 }}>
          {message ? <Feedback message={message} /> : null}
          {error ? <Feedback message={error} tone="error" /> : null}
        </div>
      </section>
      <AdminRows title="Interviews" rows={interviews} detailBase="/portal/admin/interviews" statusKey="status" />
    </div>
  );
}

function InterviewDetail({ id }: { id: string }) {
  const resource = useApiResource<Record<string, unknown>>("admin", `/api/admin/interviews/${id}`);
  const item = asRecord(resource.data?.interview);
  const profile = asRecord(resource.data?.profile);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/admin/interviews/${id}/complete`, {
        method: "PATCH",
        token: resource.token,
        body: formValues(event),
      });
      setMessage("Interview outcome recorded.");
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not complete interview.");
    }
  }

  return (
    <DetailWithStatus
      title={display(profile.name ?? `Interview ${id}`)}
      item={item}
      extra={profile}
      message={message}
      error={error || resource.error}
      form={(
        <form className="form-grid" onSubmit={complete}>
          <label>
            Recommendation
            <select name="recommendation" required>
              {["recommend", "recommend_with_conditions", "do_not_recommend"].map((status) => (
                <option key={status} value={status}>
                  {display(status)}
                </option>
              ))}
            </select>
          </label>
          <TextArea label="Interview note" name="note" />
          <button className="button full" type="submit" disabled={!resource.token || !item.id}>
            Record outcome
          </button>
        </form>
      )}
    />
  );
}

function FacilityList({ mode }: { mode: "facilities" | "subscriptions" }) {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/facilities");
  const facilities = asArray<Record<string, unknown>>(asRecord(resource.data).facilities);
  return (
    <AdminRows
      title={mode === "facilities" ? "Facility review queue" : "Facility subscription access"}
      rows={facilities}
      detailBase="/portal/admin/facilities"
      statusKey={mode === "facilities" ? "review_status" : "operational_status"}
    />
  );
}

function FacilityDetail({ id }: { id: string }) {
  const resource = useApiResource<Record<string, unknown>>("admin", `/api/admin/facilities/${id}`);
  const facility = asRecord(resource.data?.facility);
  const access = asRecord(resource.data?.access);
  const subscriptions = asArray<Record<string, unknown>>(access.subscriptions);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/admin/facilities/${id}/review`, {
        method: "PATCH",
        token: resource.token,
        body: formValues(event),
      });
      setMessage("Facility review updated.");
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update facility review.");
    }
  }

  async function subscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/admin/facilities/${id}/subscription`, {
        method: "PATCH",
        token: resource.token,
        body: formValues(event),
      });
      setMessage("Facility subscription updated.");
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update subscription.");
    }
  }

  return (
    <div className="data-list">
      <section className="card">
        <h2>{display(facility.display_name, `Facility ${id}`)}</h2>
        <MetaGrid
          items={[
            { label: "Legal name", value: facility.legal_name },
            { label: "Review status", value: facility.review_status },
            { label: "Operational status", value: facility.operational_status },
            { label: "County", value: facility.county },
            { label: "Email", value: facility.email },
            { label: "Review note", value: facility.review_note },
          ]}
        />
      </section>
      {message ? <Feedback message={message} /> : null}
      {error || resource.error ? <Feedback message={error || resource.error} tone="error" /> : null}
      <div className="grid-2">
        <section className="form-card">
          <h2>Review action</h2>
          <form className="form-grid" onSubmit={review}>
            <label>
              Action
              <select name="action" required>
                <option value="start_review">Start review</option>
                <option value="approve">Approve</option>
                <option value="request_clarification">Request clarification</option>
                <option value="reject">Reject</option>
              </select>
            </label>
            <TextArea label="Review note" name="note" />
            <button className="button full" type="submit" disabled={!resource.token || !facility.id}>
              Update review
            </button>
          </form>
        </section>
        <section className="form-card">
          <h2>Subscription action</h2>
          <form className="form-grid" onSubmit={subscription}>
            <label>
              Status
              <select name="status" required>
                {["pending_payment", "active", "suspended", "expired", "cancelled"].map((status) => (
                  <option key={status} value={status}>
                    {display(status)}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Plan code" name="plan_code" defaultValue="staging_manual_access" />
            <Field label="External reference" name="external_reference" />
            <Field label="Starts at" name="starts_at" type="date" />
            <Field label="Ends at" name="ends_at" type="date" />
            <TextArea label="Admin note" name="note" />
            <button className="button full" type="submit" disabled={!resource.token || !facility.id}>
              Update access
            </button>
          </form>
        </section>
      </div>
      <section className="card">
        <h2>Subscriptions</h2>
        <div className="data-list">
          {subscriptions.map((item) => (
            <DataRow key={String(item.id)} title={display(item.plan_code)} status={item.status} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PublicationManager() {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/candidate-publications");
  const rows = asArray<Record<string, unknown>>(asRecord(resource.data).publications);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const values = formValues(event);
      values.application_id = Number(values.application_id);
      await apiRequest("/api/admin/candidate-publications", { method: "POST", token: resource.token, body: values });
      setMessage("Candidate publication created or updated.");
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not publish candidate.");
    }
  }

  return (
    <div className="split-panel">
      <section className="form-card">
        <h2>Publish candidate</h2>
        <form className="form-grid" onSubmit={publish}>
          <Field label="Application ID" name="application_id" type="number" required />
          <Field label="Visible profession" name="visible_profession" />
          <Field label="Visible location" name="visible_location" />
          <Field label="Experience years" name="visible_experience_years" type="number" />
          <TextArea label="Public summary" name="public_summary" />
          <TextArea label="Recommendation summary" name="recommendation_summary" />
          <button className="button full" type="submit" disabled={!resource.token}>
            Publish through backend service
          </button>
        </form>
        <div className="data-list" style={{ marginTop: 18 }}>
          {message ? <Feedback message={message} /> : null}
          {error ? <Feedback message={error} tone="error" /> : null}
        </div>
      </section>
      <AdminRows title="Candidate publications" rows={rows} statusKey="publication_status" />
    </div>
  );
}

function FacilityRequestManager() {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/facility-requests");
  const rows = asArray<Record<string, unknown>>(asRecord(resource.data).requests);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const values = formValues(event);
      const requestId = Number(values.request_id);
      delete values.request_id;
      await apiRequest(`/api/admin/facility-requests/${requestId}`, { method: "PATCH", token: resource.token, body: values });
      setMessage("Facility request updated.");
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update facility request.");
    }
  }

  async function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const values = formValues(event);
      const requestId = Number(values.request_id);
      delete values.request_id;
      await apiRequest(`/api/admin/facility-requests/${requestId}/appointments`, {
        method: "POST",
        token: resource.token,
        body: values,
      });
      setMessage("Appointment schedule recorded.");
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not schedule appointment.");
    }
  }

  return (
    <div className="data-list">
      {message ? <Feedback message={message} /> : null}
      {error ? <Feedback message={error} tone="error" /> : null}
      <div className="grid-2">
        <section className="form-card">
          <h2>Update request</h2>
          <form className="form-grid" onSubmit={update}>
            <Field label="Request ID" name="request_id" type="number" required />
            <label>
              Status
              <select name="status" required>
                {["submitted", "acknowledged", "scheduled", "completed", "closed"].map((status) => (
                  <option key={status} value={status}>
                    {display(status)}
                  </option>
                ))}
              </select>
            </label>
            <TextArea label="Admin note" name="admin_note" />
            <button className="button full" type="submit" disabled={!resource.token}>
              Update request
            </button>
          </form>
        </section>
        <section className="form-card">
          <h2>Schedule appointment</h2>
          <form className="form-grid" onSubmit={schedule}>
            <Field label="Request ID" name="request_id" type="number" required />
            <Field label="Start time" name="scheduled_start_at" type="datetime-local" required />
            <Field label="End time" name="scheduled_end_at" type="datetime-local" required />
            <Field label="Mode" name="mode" defaultValue="video" />
            <Field label="Location or link" name="location" />
            <button className="button full" type="submit" disabled={!resource.token}>
              Schedule
            </button>
          </form>
        </section>
      </div>
      <AdminRows title="Facility appointment and hiring requests" rows={rows} statusKey="status" />
    </div>
  );
}

function RecommendationManager() {
  const requests = useApiResource<Record<string, unknown>>("admin", "/api/admin/recommendation-requests");
  const packages = useApiResource<Record<string, unknown>>("admin", "/api/admin/recommendation-packages");
  const requestRows = asArray<Record<string, unknown>>(asRecord(requests.data).recommendation_requests);
  const packageRows = asArray<Record<string, unknown>>(asRecord(packages.data).recommendation_packages);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function createPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const values = formValues(event);
      values.facility_id = Number(values.facility_id);
      values.recommendation_request_id = values.recommendation_request_id ? Number(values.recommendation_request_id) : undefined;
      values.candidate_publication_ids = String(values.candidate_publication_ids ?? "")
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isInteger(item) && item > 0);
      await apiRequest("/api/admin/recommendation-packages", { method: "POST", token: requests.token, body: values });
      setMessage("Recommendation package created.");
      await packages.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create recommendation package.");
    }
  }

  async function updateRecommendationRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const values = formValues(event);
      const requestId = Number(values.request_id);
      delete values.request_id;
      await apiRequest(`/api/admin/recommendation-requests/${requestId}`, {
        method: "PATCH",
        token: requests.token,
        body: values,
      });
      setMessage("Recommendation request updated.");
      await requests.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update recommendation request.");
    }
  }

  async function updatePackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const values = formValues(event);
      const packageId = Number(values.package_id);
      delete values.package_id;
      await apiRequest(`/api/admin/recommendation-packages/${packageId}`, {
        method: "PATCH",
        token: requests.token,
        body: values,
      });
      setMessage("Recommendation package updated.");
      await packages.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update recommendation package.");
    }
  }

  return (
    <div className="data-list">
      <section className="form-card">
        <h2>Create recommendation package</h2>
        <form className="form-grid" onSubmit={createPackage}>
          <Field label="Facility ID" name="facility_id" type="number" required />
          <Field label="Recommendation request ID" name="recommendation_request_id" type="number" />
          <Field label="Package title" name="title" required />
          <Field label="Candidate publication IDs" name="candidate_publication_ids" placeholder="Comma-separated IDs" />
          <TextArea label="Summary" name="summary" />
          <TextArea label="Admin rationale" name="admin_rationale" />
          <button className="button full" type="submit" disabled={!requests.token}>
            Create package
          </button>
        </form>
        <div className="data-list" style={{ marginTop: 18 }}>
          {message ? <Feedback message={message} /> : null}
          {error ? <Feedback message={error} tone="error" /> : null}
        </div>
      </section>
      <div className="grid-2">
        <section className="form-card">
          <h2>Update recommendation request</h2>
          <form className="form-grid" onSubmit={updateRecommendationRequest}>
            <Field label="Request ID" name="request_id" type="number" required />
            <label>
              Status
              <select name="status" required>
                {["submitted", "acknowledged", "scheduled", "completed", "closed"].map((status) => (
                  <option key={status} value={status}>
                    {display(status)}
                  </option>
                ))}
              </select>
            </label>
            <TextArea label="Admin note" name="admin_note" />
            <button className="button full" type="submit" disabled={!requests.token}>
              Update request
            </button>
          </form>
        </section>
        <section className="form-card">
          <h2>Update package</h2>
          <form className="form-grid" onSubmit={updatePackage}>
            <Field label="Package ID" name="package_id" type="number" required />
            <label>
              Status
              <select name="status" required>
                {["draft", "ready", "shared", "archived"].map((status) => (
                  <option key={status} value={status}>
                    {display(status)}
                  </option>
                ))}
              </select>
            </label>
            <TextArea label="Summary" name="summary" />
            <button className="button full" type="submit" disabled={!requests.token}>
              Update package
            </button>
          </form>
        </section>
      </div>
      <div className="grid-2">
        <AdminRows title="Recommendation requests" rows={requestRows} statusKey="status" />
        <AdminRows title="Recommendation packages" rows={packageRows} statusKey="status" />
      </div>
    </div>
  );
}

function ReportsDashboard() {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/reports");
  const reports = asRecord(asRecord(resource.data).reports);
  const cards = Object.entries(reports).map(([key, value]) => ({ key, value: asRecord(value) }));

  return (
    <div className="data-list">
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      <div className="grid-2">
        {cards.length ? (
          cards.map((card) => (
            <section className="card" key={card.key}>
              <h2>{display(card.key)}</h2>
              <div className="table-lite">
                {Object.entries(card.value).map(([metric, value]) => (
                  <div key={metric}>
                    <span>{display(metric)}</span>
                    <span className="badge">{String(value ?? 0)}</span>
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <EmptyState title="No report data" body="Reports appear after activity." />
        )}
      </div>
    </div>
  );
}

function NotificationOperations() {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/notifications");
  const data = asRecord(resource.data);
  const overview = asRecord(data.overview);
  const counts = asRecord(overview.counts);
  const failed = asArray<Record<string, unknown>>(data.failed);
  const recent = asArray<Record<string, unknown>>(data.recent);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function process() {
    setMessage("");
    setError("");
    try {
      const response = asRecord(await apiRequest("/api/admin/notifications/process", {
        method: "POST",
        token: resource.token,
        body: { limit: 25 },
      }));
      const delivery = asRecord(response.delivery);
      setMessage(`Processed ${display(delivery.processed_count, "0")} notification(s).`);
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not process notifications.");
    }
  }

  return (
    <div className="data-list">
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      {message ? <Feedback message={message} /> : null}
      {error ? <Feedback message={error} tone="error" /> : null}
      <MetricGrid
        metrics={[
          { label: "Pending", value: counts.pending },
          { label: "Retry scheduled", value: counts.retry_scheduled },
          { label: "Sent", value: counts.sent },
          { label: "Failed", value: counts.failed },
          { label: "Provider", value: overview.provider },
        ]}
      />
      <div className="action-row">
        <button className="button" type="button" disabled={!resource.token} onClick={process}>
          Process pending now
        </button>
      </div>
      <div className="grid-2">
        <AdminRows title="Failed or retrying notifications" rows={failed} statusKey="status" />
        <AdminRows title="Recent notifications" rows={recent} statusKey="status" />
      </div>
    </div>
  );
}

function PrivacyRequests() {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/privacy-requests");
  const rows = asArray<Record<string, unknown>>(asRecord(resource.data).privacy_requests);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const values = formValues(event);
      const requestId = Number(values.request_id);
      delete values.request_id;
      await apiRequest(`/api/admin/privacy-requests/${requestId}`, {
        method: "PATCH",
        token: resource.token,
        body: values,
      });
      setMessage("Privacy request updated.");
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update privacy request.");
    }
  }

  return (
    <div className="data-list">
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      {message ? <Feedback message={message} /> : null}
      {error ? <Feedback message={error} tone="error" /> : null}
      <section className="form-card">
        <h2>Update privacy request</h2>
        <form className="form-grid" onSubmit={update}>
          <Field label="Request ID" name="request_id" type="number" required />
          <label>
            Status
            <select name="status" required>
              {["submitted", "under_review", "completed", "rejected", "cancelled"].map((status) => (
                <option key={status} value={status}>
                  {display(status)}
                </option>
              ))}
            </select>
          </label>
          <TextArea label="Admin note" name="admin_note" />
          <button className="button full" type="submit" disabled={!resource.token}>
            Update request
          </button>
        </form>
      </section>
      <AdminRows title="Privacy requests" rows={rows} statusKey="status" />
    </div>
  );
}

function AuditLog() {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/audit-logs");
  const logs = asArray<Record<string, unknown>>(asRecord(resource.data).audit_logs);
  return <AdminRows title="Audit trail" rows={logs} statusKey="action" />;
}

function AdminRows({
  title,
  rows,
  detailBase,
  statusKey = "status",
}: {
  title: string;
  rows: Record<string, unknown>[];
  detailBase?: string;
  statusKey?: string;
}) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="data-list">
        {rows.length ? (
          rows.map((row, index) => (
            <DataRow
              key={String(row.id ?? index)}
              title={display(row.application_number ?? row.display_name ?? row.title ?? row.role_needed ?? row.action ?? row.id)}
              status={row[statusKey]}
              meta={[
                { label: "ID", value: row.id },
                { label: "Updated", value: row.updated_at ?? row.created_at },
                { label: "Owner", value: row.professional_name ?? row.facility_name ?? row.user_id },
              ]}
            >
              {detailBase && row.id ? (
                <Link className="button secondary" href={`${detailBase}/${row.id}`}>
                  Open detail
                </Link>
              ) : null}
            </DataRow>
          ))
        ) : (
          <EmptyState title="No records" body="No backend records returned." />
        )}
      </div>
    </section>
  );
}

function RequisitionManager() {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/requisitions");
  const requisitions = asArray<Record<string, unknown>>(asRecord(resource.data).requisitions);

  return (
    <section className="card">
      <h2>Facility staffing requisitions</h2>
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      <div className="data-list">
        {requisitions.length ? (
          requisitions.map((row) => (
            <DataRow
              key={String(row.id)}
              title={display(row.title)}
              status={row.status}
              meta={[
                { label: "Facility", value: asRecord(row.facility).display_name },
                { label: "Profession", value: row.profession_required },
                { label: "County", value: row.county },
                { label: "Urgency", value: row.urgency },
                { label: "Positions", value: row.number_of_positions },
              ]}
            >
              <Link className="button secondary" href={`/portal/admin/requisitions/${row.id}`}>
                Open matching workbench
              </Link>
            </DataRow>
          ))
        ) : (
          <EmptyState title="No requisitions" body="Staffing needs appear here." />
        )}
      </div>
    </section>
  );
}

function RequisitionDetail({ id }: { id: string }) {
  const resource = useApiResource<Record<string, unknown>>("admin", `/api/admin/requisitions/${id}`);
  const data = asRecord(resource.data);
  const requisition = asRecord(data.requisition);
  const matches = asArray<Record<string, unknown>>(data.matches);
  const shortlists = asArray<Record<string, unknown>>(data.shortlists);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function update(status: string) {
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/admin/requisitions/${id}`, { method: "PATCH", token: resource.token, body: { status } });
      setMessage(`Requisition moved to ${status}.`);
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update requisition.");
    }
  }

  async function runMatching() {
    setMessage("");
    setError("");
    try {
      const result = asRecord(await apiRequest(`/api/admin/requisitions/${id}/matching-runs`, { method: "POST", token: resource.token, body: {} }));
      setMessage(`Matching generated ${display(asRecord(result.matching).generated_count)} rows.`);
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not run matching.");
    }
  }

  async function createShortlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const values = formValues(event);
      const candidate_match_ids = String(values.candidate_match_ids ?? "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter(Boolean);
      await apiRequest("/api/admin/placement-shortlists", {
        method: "POST",
        token: resource.token,
        body: { ...values, requisition_id: Number(id), candidate_match_ids },
      });
      setMessage("Shortlist saved.");
      await resource.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create shortlist.");
    }
  }

  return (
    <div className="data-list">
      {message ? <Feedback message={message} /> : null}
      {error || resource.error ? <Feedback message={error || resource.error} tone="error" /> : null}
      <section className="card">
        <h2>{display(requisition.title, "Requisition")}</h2>
        <MetaGrid
          items={[
            { label: "Status", value: requisition.status },
            { label: "Facility", value: asRecord(requisition.facility).display_name },
            { label: "Profession", value: requisition.profession_required },
            { label: "County", value: requisition.county },
            { label: "Employment", value: requisition.employment_type },
            { label: "Urgency", value: requisition.urgency },
          ]}
        />
        <div className="action-row" style={{ marginTop: 18 }}>
          <button className="button secondary" type="button" disabled={!resource.token} onClick={() => update("under_review")}>
            Mark under review
          </button>
          <button className="button" type="button" disabled={!resource.token} onClick={runMatching}>
            Run matching
          </button>
        </div>
      </section>
      <section className="card">
        <h2>Explainable matches</h2>
        <div className="data-list">
          {matches.length ? (
            matches.map((match) => (
              <DataRow
                key={String(match.id)}
                title={`Match ${display(match.id)} - ${display(match.match_band)}`}
                status={match.status}
                meta={[
                  { label: "Score", value: match.match_score },
                  { label: "Candidate", value: asRecord(match.candidate).candidate_code },
                  { label: "Reasons", value: asArray<string>(match.eligibility_reasons).join(", ") },
                  { label: "Risk flags", value: asArray<string>(match.risk_flags).join(", ") },
                ]}
              />
            ))
          ) : (
            <EmptyState title="No matches yet" body="Run matching first." />
          )}
        </div>
      </section>
      <section className="form-card">
        <h2>Create shortlist</h2>
        <form className="form-grid" onSubmit={createShortlist}>
          <Field label="Shortlist title" name="title" required defaultValue={`Shortlist for ${display(requisition.title)}`} />
          <Field label="Candidate match IDs" name="candidate_match_ids" placeholder="1,2,3" />
          <TextArea label="Admin rationale" name="admin_rationale" />
          <label>
            Status
            <select name="status" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="under_review">Under review</option>
              <option value="shared">Shared with facility</option>
            </select>
          </label>
          <button className="button full" type="submit" disabled={!resource.token}>
            Save shortlist
          </button>
        </form>
      </section>
      <section className="card">
        <h2>Shortlists</h2>
        <div className="data-list">
          {shortlists.map((shortlist) => (
            <DataRow key={String(shortlist.id)} title={display(shortlist.title)} status={shortlist.status} meta={[{ label: "Shared", value: shortlist.shared_at }, { label: "Candidates", value: asArray(shortlist.candidates).length }]} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PlacementManager() {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/placements");
  const placements = asArray<Record<string, unknown>>(asRecord(resource.data).placements);

  return (
    <section className="card">
      <h2>Placement pipeline</h2>
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      <div className="data-list">
        {placements.length ? placements.map((placement) => (
          <DataRow key={String(placement.id)} title={`Placement ${display(placement.id)}`} status={placement.status} meta={[
            { label: "Facility", value: asRecord(placement.facility).display_name },
            { label: "Employment", value: placement.employment_type },
            { label: "Start", value: placement.start_date },
            { label: "Updated", value: placement.updated_at },
          ]} />
        )) : <EmptyState title="No placements" body="Reviewed placements appear here." />}
      </div>
    </section>
  );
}

function CommunicationManager() {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/communications");
  const threads = asArray<Record<string, unknown>>(asRecord(resource.data).threads);

  return (
    <section className="card">
      <h2>Mediated communications</h2>
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      <div className="data-list">
        {threads.length ? threads.map((thread) => (
          <DataRow key={String(thread.id)} title={display(thread.subject)} status={thread.status} meta={[
            { label: "Context", value: `${display(thread.context_type)} #${display(thread.context_id)}` },
            { label: "Facility", value: thread.facility_id },
            { label: "Professional", value: thread.professional_user_id },
          ]} />
        )) : <EmptyState title="No communication threads" body="Mediated conversations appear here." />}
      </div>
    </section>
  );
}

function IntegrationReadiness() {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/integrations");
  const readiness = asRecord(asRecord(resource.data).fhir_readiness);

  return (
    <section className="card">
      <h2>FHIR and SMART readiness</h2>
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      <MetaGrid
        items={[
          { label: "Practitioner", value: readiness.practitioner_mapping },
          { label: "Organization", value: readiness.organization_mapping },
          { label: "Appointment", value: readiness.appointment_mapping },
          { label: "DocumentReference", value: readiness.document_reference_mapping },
          { label: "SMART App Launch", value: readiness.smart_app_launch },
          { label: "Clinical data storage", value: readiness.clinical_data_storage },
        ]}
      />
    </section>
  );
}

function SecurityReadiness() {
  const resource = useApiResource<Record<string, unknown>>("admin", "/api/admin/security/asvs-readiness");
  const readiness = asRecord(asRecord(resource.data).asvs_readiness);

  return (
    <section className="card">
      <h2>ASVS-readiness foundation</h2>
      {resource.error ? <Feedback message={resource.error} tone="error" /> : null}
      <MetaGrid
        items={[
          { label: "Authentication", value: readiness.auth },
          { label: "Access control", value: readiness.access_control },
          { label: "Documents", value: readiness.documents },
          { label: "Matching", value: readiness.matching },
          { label: "AI", value: readiness.ai },
          { label: "Audit", value: readiness.audit },
        ]}
      />
    </section>
  );
}

function DetailWithStatus({
  title,
  item,
  extra,
  message,
  error,
  form,
}: {
  title: string;
  item: Record<string, unknown>;
  extra: Record<string, unknown>;
  message: string;
  error: string;
  form: React.ReactNode;
}) {
  return (
    <div className="data-list">
      {message ? <Feedback message={message} /> : null}
      {error ? <Feedback message={error} tone="error" /> : null}
      <section className="card">
        <h2>{title}</h2>
        <MetaGrid
          items={[
            { label: "ID", value: item.id },
            { label: "Status", value: item.status },
            { label: "Profession", value: extra.profession },
            { label: "County", value: extra.county },
            { label: "Start", value: item.scheduled_start_at },
            { label: "End", value: item.scheduled_end_at },
          ]}
        />
      </section>
      <section className="form-card">{form}</section>
    </div>
  );
}

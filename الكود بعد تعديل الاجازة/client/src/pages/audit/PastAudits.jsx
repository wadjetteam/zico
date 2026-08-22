import AuditList from "./AuditList";

export default function PastAudits() {
  return (
    <AuditList
      view="past"
      title="Past Audits"
      subtitle="Closed engagements with final ratings, issued reports and verified CAPAs."
    />
  );
}

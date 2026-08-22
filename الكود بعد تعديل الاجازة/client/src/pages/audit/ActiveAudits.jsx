import AuditList from "./AuditList";

export default function ActiveAudits() {
  return (
    <AuditList
      view="active"
      title="Active Audits"
      subtitle="Engagements currently in Planning, Fieldwork, Findings Review, Reporting or CAPA."
    />
  );
}

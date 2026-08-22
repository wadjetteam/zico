import AuditList from "./AuditList";

export default function ManageAudits() {
  return (
    <AuditList
      view="manage"
      title="Manage Audits"
      subtitle="Plan, scope and run the full audit lifecycle — from planning through CAPA to closure."
      showUniverse
    />
  );
}

import ResourcePage from "../../components/ResourcePage";
import { chipClass, titleCase } from "../../lib/format";

export default function AssetGroups() {
  return (
    <ResourcePage
      title="Asset Groups"
      subtitle="Logical groupings of assets carrying a shared criticality and risk rating."
      path="asset-groups"
      singular="group"
      emptyHint="Group assets by service or platform to assign shared risk ratings."
      columns={[
        { key: "name", header: "Group", render: (r) => <span className="font-medium text-neutral-100">{r.name}</span> },
        { key: "owner", header: "Owner" },
        { key: "criticality", header: "Criticality", render: (r) => <span className={chipClass(r.criticality)}>{r.criticality}</span> },
        { key: "riskRating", header: "Risk rating" },
        { key: "description", header: "Description", render: (r) => <span className="line-clamp-1 text-xs text-neutral-500">{r.description}</span> },
      ]}
      fields={[
        { name: "name", label: "Group name", required: true, span: 2 },
        { name: "owner", label: "Owner" },
        { name: "criticality", label: "Criticality", type: "select", options: ["low", "medium", "high", "critical"].map((v) => ({ value: v, label: titleCase(v) })) },
        { name: "riskRating", label: "Group risk rating (0-25)", type: "number", min: 0, max: 25 },
        { name: "description", label: "Description", type: "textarea", span: 2 },
      ]}
    />
  );
}

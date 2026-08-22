import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { LoadingState } from "../../components/States";
import { chipClass } from "../../lib/format";

const IMPL_STYLES = {
  "Not Implemented": "border-red-800/60 bg-red-950/40 text-red-300",
  "Partially Implemented": "border-amber-800/60 bg-amber-950/40 text-amber-300",
  "Largely Implemented": "border-sky-800/60 bg-sky-950/40 text-sky-300",
  "Fully Implemented": "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
};

export default function ComplianceReports() {
  const [summary, setSummary] = useState(null);
  const [frameworks, setFrameworks] = useState([]);
  const [controls, setControls] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/summary"),
      api.get("/frameworks", { params: { pageSize: 100 } }),
      api.get("/controls", { params: { pageSize: 500 } }),
    ]).then(([sum, fw, ct]) => {
      setSummary(sum.data);
      setFrameworks(fw.data.items || []);
      setControls(ct.data.items || []);
    });
  }, []);

  if (!summary) return <LoadingState label="Compiling compliance position…" />;

  const byFramework = (fwId) => controls.filter((c) => String(c.framework?._id) === String(fwId));

  return (
    <>
      <PageHeader title="Compliance Reports" subtitle="Framework-by-framework control implementation status from the live control library." />
      <div className="card p-5">
        <h3 className="heading text-sm font-semibold uppercase tracking-wider text-neutral-400">Implementation by framework</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.frameworkCompliance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#242424" vertical={false} />
              <XAxis dataKey="name" stroke="#4b5563" fontSize={11} />
              <YAxis unit="%" stroke="#4b5563" fontSize={11} />
              <Tooltip cursor={{ fill: "rgba(212,175,55,0.06)" }} contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="percent" fill="#D4AF37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-5 space-y-5">
        {frameworks.map((f) => {
          const list = byFramework(f._id);
          return (
            <div key={f._id} className="card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="heading text-base text-neutral-100">{f.name} <span className="text-xs text-neutral-500">v{f.version || ""}</span></h3>
                <span className="text-xs text-neutral-500">{list.length} control(s) in library</span>
              </div>
              {list.length ? (
                <ul className="mt-4 divide-y divide-line/60">
                  {list.map((c) => (
                    <li key={c._id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="text-neutral-300"><span className="mr-2 text-neutral-600">{c.controlId}</span>{c.name}</span>
                      <span className={`chip ${chipClass(c.implementationStatus, IMPL_STYLES)}`}>{c.implementationStatus}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-neutral-500">No controls in the library yet — add them from Compliance → Controls.</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

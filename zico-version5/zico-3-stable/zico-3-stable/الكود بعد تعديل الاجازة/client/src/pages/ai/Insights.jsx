import { useEffect, useState } from "react";
import api from "../../api/client";
import PageHeader from "../../components/PageHeader";
import { ErrorState, LoadingState } from "../../components/States";
import { fmtDate } from "../../lib/format";

export default function Insights() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    api.get("/ai/insights").then((r) => setData(r.data)).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState label="Analysing risk register…" />;

  return (
    <>
      <PageHeader title="AI Risk Insights" subtitle={`Generated ${fmtDate(data.generatedAt)} from the live risk register.`} />
      <div className="card p-6">
        <p className="heading text-lg text-neutral-100">{data.headline}</p>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(data.metrics).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-line bg-ink-deep p-4">
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">{k.replace(/([A-Z])/g, " $1")}</p>
              <p className="heading mt-1 text-2xl text-neutral-50">{v}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {data.insights.map((i) => (
          <div key={i.title} className="card p-5">
            <h3 className="heading text-sm font-semibold uppercase tracking-wider text-gold">{i.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">{i.body}</p>
            <p className="mt-4 text-[11px] text-neutral-600">Confidence {Math.round(i.confidence * 100)}%</p>
          </div>
        ))}
      </div>
    </>
  );
}

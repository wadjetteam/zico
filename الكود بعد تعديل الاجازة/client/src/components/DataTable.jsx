import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { LoadingState, EmptyState } from "./States";

/**
 * columns: [{ key, header, render?, sortable?, className? }]
 */
export default function DataTable({
  columns,
  rows,
  loading,
  emptyTitle,
  emptyHint,
  emptyAction,
  searchable = true,
  searchPlaceholder = "Search…",
  pageSize = 10,
  toolbar,
  rowKey = (r) => r._id,
  onRowClick,
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => {
        const v = r[c.key];
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [rows, query, columns]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return sort.dir === "asc" ? av - bv : bv - av;
      return sort.dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  return (
    <div className="card overflow-hidden">
      {(searchable || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {searchable ? (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
              <input
                className="input pl-9"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          ) : (
            <div />
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : sorted.length === 0 ? (
        <EmptyState
          title={emptyTitle || (query ? "No matching records" : "No records yet")}
          hint={emptyHint}
          action={emptyAction}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line bg-white/[0.02]">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 ${c.className || ""}`}
                    >
                      {c.sortable === false ? (
                        c.header
                      ) : (
                        <button
                          onClick={() => toggleSort(c.key)}
                          className="inline-flex items-center gap-1 transition hover:text-gold"
                        >
                          {c.header}
                          {sort.key === c.key &&
                            (sort.dir === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            ))}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`border-b border-line/60 transition last:border-0 hover:bg-white/[0.025] ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={`px-4 py-3 align-middle text-neutral-300 ${c.className || ""}`}>
                        {c.render ? c.render(row) : (row[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-neutral-500">
            <span>
              {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, sorted.length)} of {sorted.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                className="btn-ghost px-2 py-1"
                disabled={current <= 1}
                onClick={() => setPage(current - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2">
                Page {current} / {totalPages}
              </span>
              <button
                className="btn-ghost px-2 py-1"
                disabled={current >= totalPages}
                onClick={() => setPage(current + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

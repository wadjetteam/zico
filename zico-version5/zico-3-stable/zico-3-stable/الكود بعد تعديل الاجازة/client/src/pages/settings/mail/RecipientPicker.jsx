import { useEffect, useRef, useState } from "react";
import { Search, User, Users, X } from "lucide-react";
import api from "../../../api/client";

const ROLES = ["admin", "user", "auditor"];

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-gold/15 bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold">
      {label}
      <button type="button" onClick={onRemove} className="hover:opacity-70">
        <X size={10} />
      </button>
    </span>
  );
}

function EmailChipsInput({ label, emails, onChange, placeholder }) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  const addEmail = (val) => {
    const trimmed = val.trim();
    if (trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && !emails.includes(trimmed)) {
      onChange([...emails, trimmed]);
    }
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail(input);
    }
    if (e.key === "Backspace" && !input && emails.length > 0) {
      onChange(emails.slice(0, -1));
    }
  };

  return (
    <div className="mb-3">
      <label className="label mb-1.5">{label}</label>
      <div
        className="flex min-h-[38px] cursor-text flex-wrap gap-1.5 rounded-lg border border-line bg-ink-deep p-2"
        onClick={() => inputRef.current?.focus()}
      >
        {emails.map((e, i) => (
          <Chip key={e + i} label={e} onRemove={() => onChange(emails.filter((_, j) => j !== i))} />
        ))}
        <input
          ref={inputRef}
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input && addEmail(input)}
          placeholder={emails.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 bg-transparent text-xs text-neutral-200 outline-none"
        />
      </div>
    </div>
  );
}

export default function RecipientPicker({ value, onChange }) {
  const [tab, setTab] = useState("individuals");
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    api
      .get("/users")
      .then(({ data }) => setUsers(Array.isArray(data.items) ? data.items : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedUsers = value?.toUserIds || [];
  const selectedRoles = value?.toRoles || [];

  const filteredUsers = users.filter(
    (u) =>
      !selectedUsers.includes(u._id) &&
      ((u.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase()))
  );

  const availableRoles = ROLES.filter((r) => !selectedRoles.includes(r));

  const toggleUser = (id) => {
    onChange?.({
      ...value,
      toUserIds: selectedUsers.includes(id) ? selectedUsers.filter((x) => x !== id) : [...selectedUsers, id],
    });
  };

  const toggleRole = (role) => {
    onChange?.({
      ...value,
      toRoles: selectedRoles.includes(role) ? selectedRoles.filter((x) => x !== role) : [...selectedRoles, role],
    });
  };

  const totalRecipients = selectedUsers.length + selectedRoles.length;

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      type="button"
      onClick={() => {
        setTab(id);
        setSearch("");
      }}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${
        tab === id ? "border border-gold/15 bg-gold/10 text-gold" : "border border-transparent text-neutral-500 hover:text-neutral-300"
      }`}
    >
      <Icon size={12} />
      {label}
    </button>
  );

  return (
    <div>
      <label className="label mb-2">To</label>

      <div className="relative mb-3" ref={dropdownRef}>
        <div
          className="flex min-h-[38px] cursor-pointer flex-wrap items-center gap-1.5 rounded-lg border border-line bg-ink-deep p-2"
          onClick={() => setShowDropdown((s) => !s)}
        >
          {selectedUsers.length === 0 && selectedRoles.length === 0 ? (
            <span className="px-1 text-xs text-neutral-600">Select recipients…</span>
          ) : (
            <>
              {selectedUsers.map((id) => {
                const u = users.find((x) => x._id === id);
                return u ? (
                  <Chip key={id} label={u.fullName || u.username || u.email} onRemove={() => toggleUser(id)} />
                ) : null;
              })}
              {selectedRoles.map((r) => (
                <Chip key={r} label={`${r} role`} onRemove={() => toggleRole(r)} />
              ))}
            </>
          )}
        </div>

        {totalRecipients > 0 && (
          <p className="mt-1 text-[11px] text-gold/70">
            Will send to <span className="font-bold text-gold">{totalRecipients}</span>{" "}
            {totalRecipients === 1 ? "person" : "people"}
          </p>
        )}

        {showDropdown && (
          <div
            className="absolute left-0 right-0 z-50 mt-1 flex max-h-[280px] flex-col overflow-hidden rounded-xl border border-line bg-ink-deep shadow-2xl"
            style={{ boxShadow: "0 24px 60px -20px rgba(0,0,0,0.9)" }}
          >
            <div className="flex gap-2 border-b border-line p-2.5">
              <TabButton id="individuals" label="Individuals" icon={User} />
              <TabButton id="roles" label="Groups / Roles" icon={Users} />
            </div>

            {tab === "individuals" ? (
              <div className="flex-1 overflow-y-auto">
                <div className="px-2.5 py-1.5">
                  <div className="flex items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-2 py-1">
                    <Search size={12} className="text-neutral-600" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search users…"
                      className="flex-1 bg-transparent py-1 text-xs text-neutral-200 outline-none"
                      autoFocus
                    />
                  </div>
                </div>
                {filteredUsers.length === 0 ? (
                  <p className="py-4 text-center text-xs text-neutral-600">
                    {search ? "No matching users" : "All users selected"}
                  </p>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      type="button"
                      key={u._id}
                      onClick={() => toggleUser(u._id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gold/15 bg-gold/10 text-[9px] font-bold text-gold">
                        {(u.fullName || u.username || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-neutral-200">{u.fullName || "Unnamed"}</p>
                        <p className="truncate text-[10px] text-neutral-600">{u.email || `@${u.username}`}</p>
                      </div>
                      {selectedUsers.includes(u._id) && <span className="text-[10px] font-bold text-gold">Added</span>}
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-2">
                {availableRoles.length === 0 ? (
                  <p className="py-4 text-center text-xs text-neutral-600">All roles selected</p>
                ) : (
                  availableRoles.map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => toggleRole(r)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-white/[0.04]"
                    >
                      <Users size={12} className="text-gold" />
                      <span className="font-medium text-neutral-200">{r}</span>
                      <span className="text-[10px] text-neutral-600">all users with this role</span>
                      {selectedRoles.includes(r) && <span className="ml-auto text-[10px] font-bold text-gold">Added</span>}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <EmailChipsInput
        label="CC"
        emails={value?.ccEmails || []}
        onChange={(list) => onChange?.({ ...value, ccEmails: list })}
        placeholder="Add CC recipients…"
      />

      <EmailChipsInput
        label="BCC"
        emails={value?.bccEmails || []}
        onChange={(list) => onChange?.({ ...value, bccEmails: list })}
        placeholder="Add BCC recipients…"
      />
    </div>
  );
}

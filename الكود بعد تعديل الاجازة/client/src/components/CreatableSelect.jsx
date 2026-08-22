import { useState, useRef, useEffect } from "react";

export function CreatableSelect({ value, onChange, options = [], placeholder = "Select or type…", allowCreate = true, className = "" }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value || "");
  const ref = useRef(null);

  useEffect(() => {
    setInput(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        if (input && allowCreate && !options.some((o) => (o.value || o) === input)) {
          onChange(input);
        } else if (options.some((o) => (o.value || o) === input)) {
          onChange(input);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [input, options, onChange, allowCreate]);

  const filtered = options.filter((o) => {
    const label = typeof o === "string" ? o : o.label || "";
    return label.toLowerCase().includes(input.toLowerCase());
  });

  const handleSelect = (val) => {
    setInput(val);
    onChange(val);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (allowCreate && input.trim() && !options.some((o) => (o.value || o) === input)) {
        handleSelect(input.trim());
      } else if (filtered.length > 0) {
        handleSelect(typeof filtered[0] === "string" ? filtered[0] : filtered[0].value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <input
        className="input"
        value={input}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setInput(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-ink-deep shadow-xl">
          {filtered.length === 0 && !allowCreate && (
            <p className="px-3 py-2 text-xs text-neutral-500">No matches</p>
          )}
          {filtered.map((o) => {
            const val = typeof o === "string" ? o : o.value;
            const lbl = typeof o === "string" ? o : o.label || val;
            return (
              <button
                type="button"
                key={val}
                className={`flex w-full items-center px-3 py-2 text-left text-sm transition hover:bg-white/5 ${val === input ? "bg-gold/10 text-gold" : "text-neutral-200"}`}
                onClick={() => handleSelect(val)}
              >
                {lbl}
              </button>
            );
          })}
          {allowCreate && input.trim() && !options.some((o) => (o.value || o) === input) && (
            <button
              type="button"
              className="flex w-full items-center border-t border-line px-3 py-2 text-left text-sm text-gold transition hover:bg-white/5"
              onClick={() => handleSelect(input.trim())}
            >
              + Create "{input.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

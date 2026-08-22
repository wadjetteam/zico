export function Field({ label, children, hint, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="label mb-1.5">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-neutral-600">{hint}</span>}
    </label>
  );
}

export function TextInput(props) {
  return <input {...props} className={`input ${props.className || ""}`} />;
}

export function TextArea(props) {
  return <textarea rows={4} {...props} className={`input resize-y ${props.className || ""}`} />;
}

export function Select({ options = [], ...props }) {
  return (
    <select {...props} className={`input ${props.className || ""}`}>
      {options.map((o) => {
        const value = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        return (
          <option key={value} value={value} className="bg-ink-deep capitalize">
            {label}
          </option>
        );
      })}
    </select>
  );
}

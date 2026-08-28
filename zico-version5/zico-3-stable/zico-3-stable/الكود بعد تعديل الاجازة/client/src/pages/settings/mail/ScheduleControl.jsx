import { useState } from "react";

export default function ScheduleControl({ value, onChange }) {
  const [mode, setMode] = useState(value?.scheduledAt ? "later" : "now");

  const handleModeChange = (next) => {
    setMode(next);
    if (next === "now") {
      onChange?.({ ...value, scheduledAt: null });
    } else {
      const defaultDate = new Date(Date.now() + 86400000);
      onChange?.({ ...value, scheduledAt: defaultDate.toISOString().slice(0, 16) });
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="schedule-mode"
            checked={mode === "now"}
            onChange={() => handleModeChange("now")}
            className="h-3.5 w-3.5 accent-[#D4AF37]"
          />
          <span className="text-xs font-medium text-neutral-300">Send now</span>
        </label>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="schedule-mode"
            checked={mode === "later"}
            onChange={() => handleModeChange("later")}
            className="h-3.5 w-3.5 accent-[#D4AF37]"
          />
          <span className="text-xs font-medium text-neutral-300">Schedule for later</span>
        </label>
      </div>

      {mode === "later" && (
        <input
          type="datetime-local"
          value={value?.scheduledAt || ""}
          onChange={(e) => onChange?.({ ...value, scheduledAt: e.target.value || null })}
          min={new Date().toISOString().slice(0, 16)}
          className="input"
        />
      )}
    </div>
  );
}

import { useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import api from "../../../api/client";

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentUpload({ files = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const uploadFile = async (file) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds the 10MB limit.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/email/attachments", formData);
      onChange?.([...files, { id: data.attachmentId, name: data.filename, size: data.sizeBytes }]);
    } catch (err) {
      setError(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handlePick = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  return (
    <div className="mb-4">
      <label className="label mb-1.5">Attachments</label>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 transition-all ${
          dragOver ? "border-gold/40 bg-gold/5" : "border-line bg-ink-deep hover:border-gold/30"
        }`}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={handlePick} />
        {uploading ? (
          <Loader2 size={18} className="animate-spin text-gold" />
        ) : (
          <>
            <Upload size={18} className="text-neutral-600" />
            <p className="mt-2 text-[11px] font-medium text-neutral-500">Drop a file or click to upload</p>
            <p className="mt-0.5 text-[10px] text-neutral-700">PDF, DOC, XLS, PNG, JPG — max 10MB</p>
          </>
        )}
      </div>

      {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}

      {files.length > 0 && (
        <div className="mt-2 space-y-1">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2 rounded-lg border border-gold/10 bg-gold/[0.03] px-3 py-1.5 text-xs">
              <FileText size={12} className="text-gold" />
              <span className="flex-1 truncate text-neutral-300">{f.name}</span>
              <span className="text-[10px] text-neutral-600">{formatSize(f.size)}</span>
              <button
                type="button"
                onClick={() => onChange?.(files.filter((x) => x.id !== f.id))}
                className="rounded p-0.5 text-neutral-500 hover:text-red-300"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

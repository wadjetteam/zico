import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Loader2, Lock, User } from "lucide-react";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={location.state?.from || "/dashboard"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username, password);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-deep px-4">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative w-full max-w-md"
      >
        <div className="mb-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative"
          >
            <div className="pointer-events-none absolute inset-0 -z-10 scale-150 rounded-full bg-gold/20 blur-3xl" />
            <Logo size={170} radius="rounded-3xl" />
          </motion.div>
          <h1 className="heading gold-text mt-6 text-4xl font-semibold tracking-[0.4em]">WADJET</h1>
          <p className="mt-2 text-xs tracking-[0.2em] text-neutral-500">
            EYES ON RISK. CONTROL IN ACTION.
          </p>
        </div>

        <form onSubmit={submit} className="card p-6 sm:p-8">
          <h2 className="heading text-lg font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Access is restricted to authorised personnel.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="label mb-1.5">Username</span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
                <input
                  className="input pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="label mb-1.5">Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
                <input
                  type="password"
                  className="input pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300"
            >
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-5 text-center text-[11px] text-neutral-600">
            Contact your administrator for credentials. Accounts lock after 5 failed attempts.
          </p>
        </form>
      </motion.div>
    </div>
  );
}

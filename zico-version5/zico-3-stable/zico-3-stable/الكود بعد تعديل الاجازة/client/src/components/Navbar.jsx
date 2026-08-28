import { useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, LogOut, Menu, Search, Settings, User } from "lucide-react";
import Logo from "./Logo";
import { ALL_NAV_ITEMS } from "../lib/nav";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const matches = query
    ? ALL_NAV_ITEMS.filter((i) => i.label.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-ink-deep/95 px-4 backdrop-blur">
      <button
        onClick={onToggleSidebar}
        className="rounded-lg p-2 text-neutral-400 transition hover:bg-white/5 hover:text-gold"
        aria-label="Toggle navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block">
        <Logo size={48} withWordmark />
      </div>
      <div className="lg:hidden">
        <Logo size={40} />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search modules…"
          className="input pl-9"
          aria-label="Search modules"
        />
        <AnimatePresence>
          {matches.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="card absolute left-0 right-0 top-12 z-40 overflow-hidden p-1"
            >
              {matches.map((m) => (
                <li key={m.to}>
                  <button
                    onClick={() => {
                      navigate(m.to);
                      setQuery("");
                    }}
                    className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left hover:bg-white/5"
                  >
                    <span className="text-sm text-neutral-100">{m.label}</span>
                    <span className="text-[11px] text-neutral-500">{m.section}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1">
        <button className="hidden rounded-lg p-2 text-neutral-400 transition hover:bg-white/5 hover:text-gold sm:block" aria-label="Help">
          <HelpCircle className="h-5 w-5" />
        </button>
        <button className="hidden rounded-lg p-2 text-neutral-400 transition hover:bg-white/5 hover:text-gold sm:block" aria-label="Settings">
          <Settings className="h-5 w-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-line px-2 py-1.5 text-neutral-300 transition hover:border-gold/40"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gold-gradient text-[11px] font-semibold text-black">
              {(user?.fullName || user?.username || "?").slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden text-sm md:inline">{user?.username}</span>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="card absolute right-0 top-12 w-56 p-2"
              >
                <div className="border-b border-line px-3 pb-2">
                  <p className="text-sm text-neutral-100">{user?.fullName || user?.username}</p>
                  <p className="text-[11px] capitalize text-gold/80">{user?.role}</p>
                  <p className="truncate text-[11px] text-neutral-500">{user?.email}</p>
                </div>
                <button className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-300 hover:bg-white/5">
                  <User className="h-4 w-4" /> Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-300 hover:bg-red-950/40"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

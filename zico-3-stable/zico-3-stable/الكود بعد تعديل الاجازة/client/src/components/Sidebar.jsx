import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, LayoutDashboard } from "lucide-react";
import { NAV_SECTIONS } from "../lib/nav";
import Logo from "./Logo";

function SectionGroup({ section, open, onToggle }) {
  const Icon = section.icon;
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition
          ${open ? "bg-white/[0.03] text-gold-light" : "text-neutral-300 hover:bg-white/[0.03] hover:text-neutral-100"}`}
      >
        <Icon className="h-4 w-4 shrink-0 text-gold/80" />
        <span className="flex-1 font-medium">{section.label}</span>
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronRight className="h-4 w-4 text-neutral-500" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden pl-4"
          >
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `relative block rounded-md py-2 pl-4 pr-2 text-[13px] transition
                    ${
                      isActive
                        ? "text-gold before:absolute before:left-0 before:top-1/2 before:h-4 before:w-[2px] before:-translate-y-1/2 before:rounded-full before:bg-gold-gradient"
                        : "text-neutral-400 hover:text-neutral-100"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Sidebar({ mobileOpen, onCloseMobile, desktopOpen = true }) {
  const { pathname } = useLocation();
  const activeSection = NAV_SECTIONS.find((s) => s.items.some((i) => pathname.startsWith(i.to)));
  const [openId, setOpenId] = useState(activeSection?.id ?? "risk");

  useEffect(() => {
    if (activeSection) setOpenId(activeSection.id);
  }, [activeSection?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const content = (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-line px-4 lg:hidden">
        <Logo size={44} withWordmark />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `mb-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition
            ${isActive ? "bg-gold/10 text-gold" : "text-neutral-300 hover:bg-white/[0.03]"}`
          }
        >
          <LayoutDashboard className="h-4 w-4 text-gold/80" />
          <span className="font-medium">Dashboard</span>
        </NavLink>

        {NAV_SECTIONS.map((section) => (
          <SectionGroup
            key={section.id}
            section={section}
            open={openId === section.id}
            onToggle={() => setOpenId((cur) => (cur === section.id ? null : section.id))}
          />
        ))}
      </div>

      <div className="border-t border-line px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-neutral-600">
        Eyes on Risk. Control in Action.
      </div>
    </nav>
  );

  return (
    <>
      <aside
        className={`hidden w-72 shrink-0 border-r border-line bg-ink-deep ${desktopOpen ? "lg:block" : "lg:hidden"}`}
      >
        {content}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-black/70 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-line bg-ink-deep lg:hidden"
              onClick={(e) => {
                if (e.target.closest("a")) onCloseMobile();
              }}
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

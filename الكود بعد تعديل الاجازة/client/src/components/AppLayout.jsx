import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const { pathname } = useLocation();

  const toggle = () => {
    if (window.innerWidth < 1024) setMobileOpen((v) => !v);
    else setDesktopOpen((v) => !v);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-ink">
      <Navbar onToggleSidebar={toggle} />
      <div className="flex flex-1">
        <Sidebar
          mobileOpen={mobileOpen}
          desktopOpen={desktopOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <main className="min-w-0 flex-1">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

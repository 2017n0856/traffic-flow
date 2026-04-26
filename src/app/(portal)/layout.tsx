"use client";

import { useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { TrafficRealtimeToasts } from "@/components/notifications/TrafficRealtimeToasts";
import { Sidebar } from "@components/layout/Sidebar";

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <RequireAuth>
      <div className="flex min-h-screen w-full flex-1 bg-teal-50 dark:bg-slate-950">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-[1000] border-b border-teal-900/50 bg-gradient-to-r from-teal-900 via-teal-950 to-slate-950 px-4 py-3 backdrop-blur md:hidden dark:border-teal-800/60 dark:from-[#042f2e] dark:via-[#0f2725] dark:to-[#020617]">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-md border border-teal-300/35 bg-white/10 px-3 py-2 text-sm font-medium text-teal-50 transition hover:bg-white/20 hover:text-white dark:border-teal-400/30 dark:text-teal-100"
              aria-label="Open navigation menu"
            >
              &#9776; Menu
            </button>
          </header>
          <main className="flex-1 px-4 py-4 text-sm font-normal text-slate-800 antialiased sm:px-6 sm:py-6 md:px-8 md:py-8 dark:text-zinc-100">
            {children}
          </main>
        </div>
        <TrafficRealtimeToasts />
      </div>
    </RequireAuth>
  );
}

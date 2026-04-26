"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { getAuthUser, getUserRole } from "@/services/client/auth";

type NavRole = "admin" | "user" | null;

/** Pick the longest matching nav href so `/admin` does not stay active on `/admin/reports`. */
function getActiveNavHref(pathname: string, navHrefs: string[]): string | null {
  const path =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const matches = navHrefs.filter((href) => {
    if (href === "/") return path === "/";
    if (path === href) return true;
    return path.startsWith(`${href}/`);
  });
  if (matches.length === 0) return null;
  return matches.reduce((a, b) => (b.length > a.length ? b : a));
}

type SidebarProps = {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<NavRole>(null);

  useEffect(() => {
    void getAuthUser().then(async ({ data }) => {
      const userId = data.user?.id;
      if (!userId) {
        setRole("user");
        return;
      }

      const { data: profile } = await getUserRole(userId);

      setRole(profile?.role === "admin" ? "admin" : "user");
    });
  }, []);

  const links = useMemo(() => {
    if (role === "admin") {
      return [
        { href: "/admin", label: "Incident Report" },
        { href: "/admin/reports", label: "Pending Reports" },
        { href: "/admin/users", label: "User Management" },
      ];
    }

    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/report-incident", label: "Report Incident" },
    ];
  }, [role]);

  const homeHref = role === "admin" ? "/admin" : "/dashboard";

  const navHrefs = useMemo(() => links.map((item) => item.href), [links]);
  const activeHref = useMemo(
    () => getActiveNavHref(pathname, navHrefs),
    [pathname, navHrefs],
  );

  useEffect(() => {
    onCloseMobile?.();
    // Close mobile drawer only when route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const sharedAsideClass =
    "z-[1200] flex h-screen max-h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-teal-900/50 bg-gradient-to-b from-teal-900 via-teal-950 to-slate-950 shadow-[inset_-1px_0_0_rgba(13,148,136,0.2)] dark:border-teal-800/60 dark:from-[#042f2e] dark:via-[#0f2725] dark:to-[#020617] dark:shadow-[inset_-1px_0_0_rgba(45,212,191,0.08)]";

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-[1100] bg-black/45 md:hidden"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        className={`${sharedAsideClass} fixed left-0 top-0 transition-transform duration-200 md:sticky md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="shrink-0 border-b border-white/10 bg-black/15 px-4 py-4 backdrop-blur-sm dark:border-teal-500/15 dark:bg-black/30">
          <div className="flex items-center justify-between">
            <Link
              href={homeHref}
              className="block text-xl font-semibold tracking-tight text-white"
            >
              <span className="bg-gradient-to-r from-white via-teal-100 to-cyan-100 bg-clip-text text-transparent">
                Traffic Flow
              </span>
            </Link>
            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-md px-2 py-1 text-lg text-white/85 transition hover:bg-white/10 md:hidden"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 text-base">
            <div className="flex flex-col gap-1">
              {links.map((item) => {
                const active = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "rounded-md bg-teal-500 px-3 py-2 text-base font-medium text-white shadow-md ring-1 ring-teal-400/30 dark:bg-teal-600/90 dark:ring-teal-400/25"
                        : "rounded-md px-3 py-2 text-base font-normal text-teal-50/90 transition hover:bg-white/10 hover:text-white dark:text-teal-100/80 dark:hover:bg-teal-500/15 dark:hover:text-white"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="shrink-0 border-t border-white/10 bg-black/20 p-3 dark:border-teal-500/15 dark:bg-black/35">
            <SignOutButton />
          </div>
        </div>
      </aside>
    </>
  );
}

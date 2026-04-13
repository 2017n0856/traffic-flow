"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/layout/SignOutButton";

const links = [{ href: "/dashboard", label: "Dashboard" }];

function linkIsActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Traffic Flow
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3 text-sm">
        {links.map((item) => {
          const active = linkIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "rounded-md bg-zinc-100 px-3 py-2 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "rounded-md px-3 py-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              }
            >
              {item.label}
            </Link>
          );
        })}
        <SignOutButton />
      </nav>
    </aside>
  );
}

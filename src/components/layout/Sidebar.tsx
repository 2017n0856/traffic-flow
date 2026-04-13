import Link from "next/link";
import { SignOutButton } from "@/components/layout/SignOutButton";

const links = [{ href: "/dashboard", label: "Dashboard" }];

export function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Traffic Flow
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3 text-sm text-zinc-600 dark:text-zinc-400">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            {item.label}
          </Link>
        ))}
        <SignOutButton />
      </nav>
    </aside>
  );
}

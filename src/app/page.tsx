import Link from "next/link";

const routes = [
  { href: "/sign-in", label: "Sign in", hint: "(auth)" },
  { href: "/dashboard", label: "Dashboard", hint: "(portal)" },
  { href: "/terms", label: "Terms", hint: "(legal)" },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 dark:bg-black">
      <main className="w-full max-w-lg space-y-10 text-center">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Traffic Flow
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Next.js + Tailwind
          </h1>
          <p className="text-pretty text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            App Router layout matches{" "}
            <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
              PROJECT_STRUCTURE.md
            </code>
            : route groups, shared components, features, services, and store
            folders are ready to grow.
          </p>
        </div>
        <ul className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {routes.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex flex-col rounded-xl border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {item.label}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {item.hint}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

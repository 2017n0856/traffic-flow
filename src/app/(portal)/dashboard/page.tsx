export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
        Add feature modules under{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
          src/features
        </code>{" "}
        and wire routes from{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
          src/app/(portal)
        </code>
        .
      </p>
    </div>
  );
}

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Terms
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Placeholder legal route under the{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
          (legal)
        </code>{" "}
        group.
      </p>
      <Link
        href="/"
        className="inline-flex text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
      >
        Back to home
      </Link>
    </div>
  );
}

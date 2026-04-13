import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Auth flows live under the{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
            (auth)
          </code>{" "}
          route group.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
      >
        Back to home
      </Link>
    </div>
  );
}

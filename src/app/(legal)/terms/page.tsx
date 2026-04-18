import Link from "next/link";
import { bodyMutedClass, pageTitleClass, textLinkClass } from "@/lib/ui/form";

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <h1 className={pageTitleClass}>Terms</h1>
      <p className={bodyMutedClass}>
        Placeholder legal route under the{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          (legal)
        </code>{" "}
        group.
      </p>
      <Link href="/" className={`inline-flex ${textLinkClass}`}>
        Back to home
      </Link>
    </div>
  );
}

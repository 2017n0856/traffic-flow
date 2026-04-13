"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth/local-users";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        clearSession();
        router.push("/");
        router.refresh();
      }}
      className="mt-auto w-full rounded-md px-3 py-2 text-left text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
    >
      Sign out
    </button>
  );
}

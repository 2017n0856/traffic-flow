"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="w-full rounded-md px-3 py-2 text-left text-base font-normal text-teal-100/90 transition hover:bg-white/10 hover:text-white dark:text-teal-200/80 dark:hover:bg-teal-500/15 dark:hover:text-white"
    >
      Sign out
    </button>
  );
}

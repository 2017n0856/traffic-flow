"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAuthSession } from "@/services/client/auth";

export function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    void getAuthSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
      } else {
        router.replace("/sign-in");
      }
    });
  }, [router]);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-sm text-zinc-500 dark:bg-black dark:text-zinc-400">
      Loading…
    </div>
  );
}

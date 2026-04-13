"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth/local-users";

type Props = { children: React.ReactNode };

export function GuestOnly({ children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getSession()) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthSession } from "@/services/client/auth";

type Props = { children: React.ReactNode };

export function GuestOnly({ children }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "guest">("checking");

  useEffect(() => {
    void getAuthSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
        return;
      }
      setStatus("guest");
    });
  }, [router]);

  if (status !== "guest") {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}

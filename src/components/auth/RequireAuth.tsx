"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Props = { children: React.ReactNode };

export function RequireAuth({ children }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "authorized">("checking");

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/sign-in");
        return;
      }
      setStatus("authorized");
    });
  }, [router]);

  if (status !== "authorized") {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-black dark:text-zinc-400">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}

import { RequireAuth } from "@/components/auth/RequireAuth";
import { TrafficRealtimeToasts } from "@/components/notifications/TrafficRealtimeToasts";
import { Sidebar } from "@components/layout/Sidebar";

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireAuth>
      <div className="flex min-h-screen w-full flex-1 items-start bg-teal-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {/* <header className="border-b border-zinc-200 bg-white px-8 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Portal layout — sidebar and main content region.
          </p>
        </header> */}
          <main className="flex-1 px-8 py-8 text-sm font-normal text-slate-800 antialiased dark:text-zinc-100">
            {children}
          </main>
        </div>
        <TrafficRealtimeToasts />
      </div>
    </RequireAuth>
  );
}

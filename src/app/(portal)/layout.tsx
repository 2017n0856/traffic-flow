import { Sidebar } from "@components/layout/Sidebar";

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 bg-zinc-50 dark:bg-black">
      <Sidebar />
      <div className="flex min-h-full flex-1 flex-col">
        <header className="border-b border-zinc-200 bg-white px-8 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Portal layout — sidebar and main content region.
          </p>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}

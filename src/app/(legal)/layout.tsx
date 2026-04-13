export default function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto min-h-full flex-1 max-w-3xl px-4 py-16">
      <article className="text-zinc-800 dark:text-zinc-200">{children}</article>
    </div>
  );
}

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-8 py-24">
      <h1 className="mb-2 text-lg font-bold text-[var(--text)]">{title}</h1>
      <p className="text-center text-sm text-[var(--muted)]">Coming soon.</p>
    </div>
  );
}

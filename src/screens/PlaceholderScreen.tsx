export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#EAECEF] px-8 py-24">
      <h1 className="mb-2 text-lg font-bold text-gray-900">{title}</h1>
      <p className="text-center text-sm text-gray-400">Coming soon.</p>
    </div>
  );
}

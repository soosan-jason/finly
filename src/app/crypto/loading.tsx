export default function CryptoLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 w-40 rounded-lg bg-gray-800" />
        <div className="h-8 w-24 rounded-lg bg-gray-800" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-800" />
        ))}
      </div>
    </div>
  );
}

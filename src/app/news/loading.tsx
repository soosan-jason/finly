export default function NewsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-gray-800" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-gray-800" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-52 rounded-xl bg-gray-800" />
        ))}
      </div>
    </div>
  );
}

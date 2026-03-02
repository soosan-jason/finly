export default function PortfolioLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 w-36 rounded-lg bg-gray-800" />
        <div className="h-8 w-28 rounded-lg bg-gray-800" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-48 rounded-xl bg-gray-800" />
        <div className="h-48 rounded-xl bg-gray-800" />
      </div>
      <div className="h-64 rounded-xl bg-gray-800" />
    </div>
  );
}

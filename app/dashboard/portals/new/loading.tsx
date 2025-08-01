export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-[#F7F9FB] animate-pulse">
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
        ))}
      </div>
    </div>
  )
}

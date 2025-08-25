export default function ClientPortalLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="h-64 bg-gray-200 animate-pulse">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-48 h-12 bg-gray-300 rounded animate-pulse"></div>
              <div>
                <div className="w-64 h-8 bg-gray-300 rounded mb-2 animate-pulse"></div>
                <div className="w-48 h-4 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-24 h-9 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-10 h-10 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Quick Actions Skeleton */}
          <div className="mb-8">
            <div className="w-32 h-6 bg-gray-300 rounded mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-lg animate-pulse"></div>
                    <div className="flex-1">
                      <div className="w-32 h-4 bg-gray-300 rounded mb-2 animate-pulse"></div>
                      <div className="w-48 h-3 bg-gray-300 rounded mb-3 animate-pulse"></div>
                      <div className="w-20 h-8 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects Skeleton */}
          <div className="mb-8">
            <div className="w-32 h-6 bg-gray-300 rounded mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-32 h-5 bg-gray-300 rounded animate-pulse"></div>
                    <div className="w-20 h-6 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
                        <div className="w-12 h-3 bg-gray-300 rounded animate-pulse"></div>
                      </div>
                      <div className="w-full h-2 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-300 rounded mr-2 animate-pulse"></div>
                      <div className="w-24 h-3 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Files Skeleton */}
          <div className="mb-8">
            <div className="w-32 h-6 bg-gray-300 rounded mb-4 animate-pulse"></div>
            <div className="bg-white rounded-lg border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                    <div>
                      <div className="w-32 h-4 bg-gray-300 rounded mb-1 animate-pulse"></div>
                      <div className="w-24 h-3 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 h-6 bg-gray-300 rounded animate-pulse"></div>
                    <div className="w-24 h-8 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoices Skeleton */}
          <div className="mb-8">
            <div className="w-32 h-6 bg-gray-300 rounded mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-20 h-5 bg-gray-300 rounded animate-pulse"></div>
                    <div className="w-16 h-6 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-20 h-3 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-20 h-3 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="w-full h-8 bg-gray-300 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
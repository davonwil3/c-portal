export default function CompanyPortalLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Company Header Skeleton */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4 animate-pulse"></div>
          <div className="w-48 h-8 bg-gray-200 rounded mb-2 animate-pulse mx-auto"></div>
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
        </div>

        {/* Login Card Skeleton */}
        <div className="bg-white rounded-lg shadow-xl border-0 p-6">
          <div className="text-center pb-4">
            <div className="w-40 h-6 bg-gray-200 rounded mb-2 animate-pulse mx-auto"></div>
            <div className="w-48 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-full h-11 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="space-y-2">
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-full h-11 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="w-full h-11 bg-gray-200 rounded animate-pulse"></div>
            
            <div className="text-center">
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
            </div>
          </div>
        </div>
        
        {/* Footer Skeleton */}
        <div className="text-center mt-8">
          <div className="w-32 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
        </div>
      </div>
    </div>
  )
} 
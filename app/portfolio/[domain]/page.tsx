import { getPortfolioByDomainServer } from '@/lib/portfolio.server'
import { PublicPortfolioClient } from './PublicPortfolioClient'

export default async function PublicPortfolioPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params

  const portfolioData = await getPortfolioByDomainServer(domain)

  if (!portfolioData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portfolio Not Found</h1>
          <p className="text-gray-600">This portfolio does not exist or is not published.</p>
        </div>
      </div>
    )
  }

  return <PublicPortfolioClient domain={domain} data={portfolioData} />
}

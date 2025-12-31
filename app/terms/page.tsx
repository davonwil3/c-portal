import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import TermsContent from "@/content/terms.mdx"

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-[#3C3CFF] transition-colors" />
              <div className="flex items-center space-x-2">
                <Image
                  src="/jolixlogo.png"
                  alt="Jolix Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                  priority
                  quality={90}
                />
                <span className="text-xl font-bold text-gray-900">Jolix</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-16 lg:py-24">
        <article className="prose prose-slate prose-lg max-w-none">
          <TermsContent />
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <Image
                src="/jolixlogo.png"
                alt="Jolix Logo"
                width={32}
                height={32}
                className="w-8 h-8"
                quality={90}
              />
              <span className="text-xl font-bold">Jolix</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Jolix. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}


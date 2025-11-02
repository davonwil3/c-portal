"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

export function CTASection() {
  const router = useRouter()

  return (
    <Card className="p-8 md:p-12 bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 border-purple-200">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Ready to customize?
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Customize Your Portfolio
        </h2>
        
        <p className="text-lg text-gray-600 mb-8">
          Choose a template, edit your content, and publish instantly. 
          Create a stunning portfolio in minutes.
        </p>
        
        <Button 
          size="lg"
          onClick={() => router.push('/dashboard/portfolio/customize')}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-6 text-lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Start Customizing
        </Button>
      </div>
    </Card>
  )
}


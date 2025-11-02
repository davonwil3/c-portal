"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Sparkles, ArrowLeft } from "lucide-react"

interface TemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void
  onBack: () => void
  currentTemplate?: string
}

const templates = [
  {
    id: "aura",
    name: "Aura",
    description: "Clean, sophisticated design perfect for designers and creatives",
    features: ["Large typography", "Image-focused", "Two-column layouts", "Elegant spacing"],
    badge: "Popular"
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Simple, clean design with focus on content and readability",
    features: ["Clean navigation", "Minimal design", "Content-focused", "Professional look"],
    badge: null
  },
  {
    id: "shift",
    name: "Shift",
    description: "Bold, typographic design with editorial aesthetic for creatives",
    features: ["Bold typography", "Editorial layout", "Strong visual hierarchy", "Modern & striking"],
    badge: null
  },
  {
    id: "innovate",
    name: "Innovate",
    description: "Modern corporate design with impactful hero and clean layouts",
    features: ["Large hero section", "Stats showcase", "Professional look", "Corporate appeal"],
    badge: "New"
  },
  {
    id: "coming-soon-1",
    name: "Coming Soon",
    description: "More templates are on the way",
    features: ["New layouts", "Fresh designs", "More options", "Stay tuned"],
    badge: "Soon",
    disabled: true
  }
]

export function TemplateSelector({ onSelectTemplate, onBack, currentTemplate = 'aura' }: TemplateSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16 animate-in fade-in duration-700 relative">
          <div className="absolute top-0 left-0">
            <Button variant="ghost" onClick={onBack} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Builder
            </Button>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Choose Your Template
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Select Your Portfolio Style
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose a professionally designed template that fits your style.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {templates.map((template, index) => {
            const isActive = template.id === currentTemplate
            return (
              <div
                key={template.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card 
                  onClick={() => {
                    if (template.disabled) return
                    if (isActive) {
                      onBack()
                    } else {
                      onSelectTemplate(template.id)
                    }
                  }}
                  className={`overflow-hidden hover:shadow-2xl transition-all duration-300 group cursor-pointer border-2 h-full flex flex-col ${
                    isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'hover:border-blue-500'
                  } ${template.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {/* Preview Image - Full card */}
                  <div className="relative flex-1 overflow-hidden">
                    {template.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className={`px-3 py-1 ${
                          isActive 
                            ? 'bg-blue-600 text-white' 
                            : template.badge === 'New'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-400 text-white'
                        } text-xs font-semibold rounded-full`}>
                          {isActive ? 'Active' : template.badge}
                        </span>
                      </div>
                    )}
                    {template.id === 'coming-soon-1' ? (
                      <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🚀</div>
                          <div className="text-xs text-gray-500">Coming Soon</div>
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={`/${template.id}preview.png`}
                        alt={`${template.name} preview`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>

                  {/* Title */}
                  <div className="p-6 flex items-center justify-between bg-white border-t">
                    <h3 className="text-xl font-bold group-hover:text-blue-600 transition-colors">
                      {template.name}
                    </h3>
                    {isActive && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </Card>
              </div>
            )
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 animate-in fade-in duration-700" style={{ animationDelay: '800ms' }}>
          <p className="text-gray-500 text-sm mb-4">
            ✨ All templates are fully customizable • Change colors, fonts, layouts, and content anytime
          </p>
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}


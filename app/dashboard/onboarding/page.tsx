"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowRight, ArrowLeft, Check, Target, Users, Settings } from "lucide-react"

type Preferences = {
  services: string[]
  intentText: string
  budget: string
  remoteOnly: boolean
  region: string
}

const serviceOptions = [
  'Web Dev',
  'Design', 
  'Copywriting',
  'SEO',
  'Marketing',
  'Video'
]

const budgetOptions = ['$', '$$', '$$$']
const regionOptions = ['Global', 'US', 'EU']

const exampleIntents = [
  'SaaS startups needing web design',
  'E-commerce brands needing copywriting', 
  'Local businesses needing SEO help',
  'Tech companies needing marketing',
  'Startups needing video content'
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [preferences, setPreferences] = useState<Preferences>({
    services: [],
    intentText: '',
    budget: '$$',
    remoteOnly: true,
    region: 'Global'
  })
  const [customService, setCustomService] = useState('')

  const handleServiceToggle = (service: string) => {
    setPreferences(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }))
  }

  const handleAddCustomService = () => {
    if (customService.trim()) {
      setPreferences(prev => ({
        ...prev,
        services: [...prev.services, customService.trim()]
      }))
      setCustomService('')
    }
  }

  const handleExampleClick = (example: string) => {
    setPreferences(prev => ({
      ...prev,
      intentText: example
    }))
  }

  const handleNext = () => {
    if (step === 1 && preferences.services.length === 0) {
      toast.error('Please select at least one service')
      return
    }
    if (step === 2 && !preferences.intentText.trim()) {
      toast.error('Please describe who you want to work with')
      return
    }
    setStep(step + 1)
  }

  const handlePrevious = () => {
    setStep(step - 1)
  }

  const handleSave = () => {
    // In a real app, this would save to backend
    localStorage.setItem('userPreferences', JSON.stringify(preferences))
    toast.success('Preferences saved!')
    router.push('/dashboard/leads')
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Target className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What do you do?</h2>
        <p className="text-gray-600">Select the services you offer</p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 justify-center">
          {serviceOptions.map((service) => (
            <Button
              key={service}
              size="lg"
              variant={preferences.services.includes(service) ? "default" : "outline"}
              onClick={() => handleServiceToggle(service)}
              className={`text-sm font-medium transition-all duration-200 ${
                preferences.services.includes(service)
                  ? 'bg-[#3C3CFF] text-white shadow-md hover:bg-[#2D2DCC]'
                  : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              {preferences.services.includes(service) && (
                <Check className="h-4 w-4 mr-2" />
              )}
              {service}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2 max-w-md mx-auto">
          <Input
            placeholder="Other (type here)"
            value={customService}
            onChange={(e) => setCustomService(e.target.value)}
            className="text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomService()}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddCustomService}
            disabled={!customService.trim()}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Who do you want to work with?</h2>
        <p className="text-gray-600">Describe your ideal clients and projects</p>
      </div>

      <div className="space-y-4">
        <textarea
          className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-transparent text-lg"
          rows={4}
          placeholder="Describe the types of clients and projects you want to work with..."
          value={preferences.intentText}
          onChange={(e) => setPreferences(prev => ({ ...prev, intentText: e.target.value }))}
        />
        
        <div className="space-y-3">
          <Label className="text-sm text-gray-500">Click to insert examples:</Label>
          <div className="flex flex-wrap gap-2 justify-center">
            {exampleIntents.map((example) => (
              <Button
                key={example}
                size="sm"
                variant="ghost"
                onClick={() => handleExampleClick(example)}
                className="text-sm text-gray-600 hover:text-[#3C3CFF] hover:bg-[#3C3CFF]/10"
              >
                "{example}"
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Settings className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Preferences</h2>
        <p className="text-gray-600">Set your work preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-800">Budget</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Select
              value={preferences.budget}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, budget: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {budgetOptions.map((budget) => (
                  <SelectItem key={budget} value={budget}>
                    {budget}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Remote */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-800">Work Type</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Switch
                checked={preferences.remoteOnly}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, remoteOnly: checked }))}
                className="data-[state=checked]:bg-[#3C3CFF]"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Remote Only</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Region */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-800">Region</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Select
              value={preferences.region}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, region: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regionOptions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500">Step {step} of 3</div>
            <div className="text-sm text-gray-500">{Math.round((step / 3) * 100)}%</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={step === 1}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              {step < 3 ? (
                <Button
                  onClick={handleNext}
                  className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] hover:from-[#2D2DCC] hover:to-[#4F46E5] text-white flex items-center space-x-2"
                >
                  <span>Save & Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

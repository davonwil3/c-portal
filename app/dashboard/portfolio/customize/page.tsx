"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Eye, 
  RotateCcw, 
  Save, 
  Globe, 
  Copy, 
  CheckCircle2,
  X,
  ArrowLeft,
  Undo,
  Redo
} from "lucide-react"
import { useRouter } from "next/navigation"
import { PortfolioPreview } from "../components/PortfolioPreview"
import { ControlPanel } from "../components/ControlPanel"
import { ServiceModal } from "../components/ServiceModal"
import { ProjectModal } from "../components/ProjectModal"
import { TestimonialModal } from "../components/TestimonialModal"
import { ContactModal } from "../components/ContactModal"
import { ShareModal } from "../components/ShareModal"
import { TemplateSelector } from "../components/TemplateSelector"
import { Status, Service, Project, Testimonial, ContactItem, PortfolioData } from "../types"
import { buildAuraMockData, buildMinimalistMockData, buildShiftMockData, buildInnovateMockData } from "../data/mockData"
import { savePortfolio, getUserPortfolios, getPortfolio, getPortfolioAnalytics } from "@/lib/portfolio"

export default function PortfolioBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>("draft")
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showToast, setShowToast] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [showTemplateConfirmModal, setShowTemplateConfirmModal] = useState(false)
  const [originalTemplateFromDb, setOriginalTemplateFromDb] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Modals
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showTestimonialModal, setShowTestimonialModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [portfolioId, setPortfolioId] = useState<string | undefined>(undefined)
  const [publicUrl, setPublicUrl] = useState<string>("")

  const [portfolioData, setPortfolioData] = useState<PortfolioData>(buildAuraMockData())
  
  // Undo/Redo history
  const [history, setHistory] = useState<PortfolioData[]>([buildAuraMockData()])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Load existing portfolio data on mount
  useEffect(() => {
    const loadExistingPortfolio = async () => {
      try {
        // Check if user is coming from template selector
        const selectedTemplate = searchParams.get('template')
        
        if (selectedTemplate) {
          // User selected a template, initialize with that template
          const templates = {
            'aura': buildAuraMockData(),
            'minimalist': buildMinimalistMockData(),
            'shift': buildShiftMockData(),
            'innovate': buildInnovateMockData()
          }
          
          const templateData = templates[selectedTemplate as keyof typeof templates] || buildAuraMockData()
          setPortfolioData(templateData)
          setHistory([templateData])
          setHistoryIndex(0)
        } else {
          // Try to load existing portfolio
          const portfolios = await getUserPortfolios()
          if (portfolios && portfolios.length > 0) {
            // Load the most recent portfolio with full data
            const latestPortfolio = portfolios[0]
            const fullPortfolio = await getPortfolio(latestPortfolio.id)
            
            if (fullPortfolio) {
              setPortfolioId(latestPortfolio.id)
              setStatus(latestPortfolio.status)
              setPortfolioData(fullPortfolio)
              setHistory([fullPortfolio])
              setHistoryIndex(0)
              // Store the original template from database
              setOriginalTemplateFromDb(fullPortfolio.appearance.layoutStyle)
              
              // Load public URL from portfolio or analytics
              if (latestPortfolio.status === 'published' && latestPortfolio.id) {
                const analytics = await getPortfolioAnalytics(latestPortfolio.id)
                if (analytics && analytics.domain) {
                  setPublicUrl(`https://${analytics.domain}.jolix.io`)
                } else if (latestPortfolio.public_url) {
                  setPublicUrl(latestPortfolio.public_url)
                }
              } else if (latestPortfolio.public_url) {
                setPublicUrl(latestPortfolio.public_url)
              } else {
                setPublicUrl(`https://${fullPortfolio.hero.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-')}.jolix.io`)
              }
            } else {
              // No portfolio exists yet, set default URL
              setPublicUrl(`https://${portfolioData.hero.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-')}.jolix.io`)
            }
          }
        }
      } catch (error) {
        console.error('Error loading portfolio:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadExistingPortfolio()
  }, [searchParams])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1
          setHistoryIndex(newIndex)
          setPortfolioData(history[newIndex])
          setHasChanges(true)
        }
      }
      // Cmd/Ctrl + Shift + Z for redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1
          setHistoryIndex(newIndex)
          setPortfolioData(history[newIndex])
          setHasChanges(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [historyIndex, history])

  // Show loading state while fetching portfolio data
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3C3CFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your portfolio...</p>
        </div>
      </div>
    )
  }

  const handleDataChange = (newData: Partial<PortfolioData>) => {
    console.log('🟢 customize/page handleDataChange called with:', Object.keys(newData))
    if (newData.hero) {
      console.log('🟢 Hero update - avatar length:', newData.hero.avatar?.length || 0)
    }
    // Deep merge nested objects properly
    const updatedData = { ...portfolioData }
    
    // Handle nested object updates properly - always merge if key exists in newData
    if (newData.hasOwnProperty('hero') && newData.hero) {
      updatedData.hero = { ...portfolioData.hero, ...newData.hero }
      console.log('🟢 Updated hero, new avatar length:', updatedData.hero.avatar?.length || 0)
    }
    if (newData.hasOwnProperty('about') && newData.about) {
      updatedData.about = { ...portfolioData.about, ...newData.about }
    }
    if (newData.hasOwnProperty('contact') && newData.contact) {
      updatedData.contact = { ...portfolioData.contact, ...newData.contact }
    }
    if (newData.hasOwnProperty('appearance') && newData.appearance) {
      updatedData.appearance = { ...portfolioData.appearance, ...newData.appearance }
    }
    if (newData.hasOwnProperty('branding') && newData.branding) {
      updatedData.branding = { ...portfolioData.branding, ...newData.branding }
    }
    if (newData.hasOwnProperty('behavior') && newData.behavior) {
      updatedData.behavior = { ...portfolioData.behavior, ...newData.behavior }
    }
    if (newData.hasOwnProperty('seo') && newData.seo) {
      updatedData.seo = { ...portfolioData.seo, ...newData.seo }
    }
    if (newData.hasOwnProperty('footer') && newData.footer) {
      updatedData.footer = { ...portfolioData.footer, ...newData.footer }
    }
    if (newData.hasOwnProperty('sectionHeaders')) {
      updatedData.sectionHeaders = { ...portfolioData.sectionHeaders, ...newData.sectionHeaders }
    }
    
    // For arrays and other non-nested objects
    if (newData.hasOwnProperty('services') && newData.services) updatedData.services = newData.services
    if (newData.hasOwnProperty('projects') && newData.projects) updatedData.projects = newData.projects
    if (newData.hasOwnProperty('testimonials') && newData.testimonials) updatedData.testimonials = newData.testimonials
    if (newData.hasOwnProperty('contactItems') && newData.contactItems) updatedData.contactItems = newData.contactItems
    if (newData.hasOwnProperty('socialLinks') && newData.socialLinks) updatedData.socialLinks = newData.socialLinks
    if (newData.hasOwnProperty('modules') && newData.modules) updatedData.modules = newData.modules
    if (newData.hasOwnProperty('modulesOrder') && newData.modulesOrder) updatedData.modulesOrder = newData.modulesOrder
    
    console.log('🟢 Setting portfolio data')
    setPortfolioData(updatedData)
    setHasChanges(true)
    
    // Add to history with deep copy
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(updatedData))) // Deep copy
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    console.log('🟢 State updated successfully')
  }
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setPortfolioData(history[newIndex])
      setHasChanges(true)
    }
  }
  
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setPortfolioData(history[newIndex])
      setHasChanges(true)
    }
  }

  const handleSave = async () => {
    // Check if template has changed from the original database template
    if (originalTemplateFromDb && portfolioData.appearance.layoutStyle !== originalTemplateFromDb) {
      console.log('Template changed from', originalTemplateFromDb, 'to', portfolioData.appearance.layoutStyle)
      setShowTemplateConfirmModal(true)
      return
    }

    // Regular save - proceed immediately
    setIsSaving(true)
    try {
      const result = await savePortfolio(portfolioData, "draft", portfolioId)
      
      if (result.success) {
        if (result.portfolioId) {
          setPortfolioId(result.portfolioId)
        }
        setHasChanges(false)
        showToastMessage("Changes saved")
      } else {
        showToastMessage(result.error || "Failed to save portfolio")
      }
    } catch (error: any) {
      console.error("Error saving portfolio:", error)
      showToastMessage(error.message || "Failed to save portfolio")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    setIsSaving(true)
    try {
      const result = await savePortfolio(portfolioData, "published", portfolioId)
      
      if (result.success) {
        if (result.portfolioId) {
          setPortfolioId(result.portfolioId)
          // Update public URL after publishing
          const analytics = await getPortfolioAnalytics(result.portfolioId)
          if (analytics && analytics.domain) {
            setPublicUrl(`https://${analytics.domain}.jolix.io`)
          }
        }
        setStatus("published")
        setHasChanges(false)
        showToastMessage("Portfolio published!")
      } else {
        showToastMessage(result.error || "Failed to publish portfolio")
      }
    } catch (error: any) {
      console.error("Error publishing portfolio:", error)
      showToastMessage(error.message || "Failed to publish portfolio")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    setHasChanges(false)
    showToastMessage("Changes discarded")
  }

  const copyPublicUrl = () => {
    navigator.clipboard.writeText(publicUrl)
    showToastMessage("Link copied!")
  }

  const showToastMessage = (message: string) => {
    setShowToast(message)
    setTimeout(() => setShowToast(null), 3000)
  }

  // Show full-screen preview if requested
  if (previewMode) {
    return (
      <div className="h-screen w-full overflow-auto">
        <div className="fixed top-4 right-4 z-50">
          <Button 
            onClick={() => setPreviewMode(false)}
            className="bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
          >
            <X className="w-4 h-4 mr-2" />
            Exit Preview
          </Button>
        </div>
        <PortfolioPreview
          data={portfolioData}
          editMode={false}
          onDataChange={() => {}}
          onManageServices={() => {}}
          onManageProjects={() => {}}
          onManageTestimonials={() => {}}
        />
      </div>
    )
  }

  // Show template selector if requested
  if (showTemplateSelector) {
    return (
      <div className="min-h-screen bg-white">
        <TemplateSelector
          currentTemplate={portfolioData.appearance.layoutStyle}
          onSelectTemplate={(templateId) => {
            if (templateId === portfolioData.appearance.layoutStyle) {
              setShowTemplateSelector(false)
              return
            }
            // Immediately switch to the new template
            let newData: PortfolioData
            if (templateId === 'minimalist') {
              newData = buildMinimalistMockData()
            } else if (templateId === 'shift') {
              newData = buildShiftMockData()
            } else if (templateId === 'innovate') {
              newData = buildInnovateMockData()
            } else {
              newData = buildAuraMockData()
            }
            
            setPortfolioData(newData)
            setHistory([newData])
            setHistoryIndex(0)
            setHasChanges(true)
            setShowTemplateSelector(false)
            showToastMessage("Template applied! Click 'Save' to set as your default template.")
          }}
          onBack={() => setShowTemplateSelector(false)}
        />
      </div>
    )
  }

  // Service handlers
  const handleAddService = (service: Omit<Service, "id">) => {
    const newService = { ...service, id: Date.now().toString() }
    handleDataChange({ services: [...portfolioData.services, newService] })
    setShowServiceModal(false)
    showToastMessage("Service added")
  }

  const handleEditService = (service: Service) => {
    const updated = portfolioData.services.map((s: Service) => s.id === service.id ? service : s)
    handleDataChange({ services: updated })
    setShowServiceModal(false)
    setEditingItem(null)
    showToastMessage("Service updated")
  }

  const handleDeleteService = (id: string) => {
    const updated = portfolioData.services.filter((s: Service) => s.id !== id)
    handleDataChange({ services: updated })
    showToastMessage("Service deleted")
  }

  // Project handlers
  const handleAddProject = (project: Omit<Project, "id">) => {
    const newProject = { ...project, id: Date.now().toString() }
    handleDataChange({ projects: [...portfolioData.projects, newProject] })
    setShowProjectModal(false)
    showToastMessage("Project added")
  }

  const handleEditProject = (project: Project) => {
    const updated = portfolioData.projects.map((p: Project) => p.id === project.id ? project : p)
    handleDataChange({ projects: updated })
    setShowProjectModal(false)
    setEditingItem(null)
    showToastMessage("Project updated")
  }

  const handleDeleteProject = (id: string) => {
    const updated = portfolioData.projects.filter((p: Project) => p.id !== id)
    handleDataChange({ projects: updated })
    showToastMessage("Project deleted")
  }

  // Testimonial handlers
  const handleAddTestimonial = (testimonial: Omit<Testimonial, "id">) => {
    const newTestimonial = { ...testimonial, id: Date.now().toString() }
    handleDataChange({ testimonials: [...portfolioData.testimonials, newTestimonial] })
    setShowTestimonialModal(false)
    showToastMessage("Testimonial added")
  }

  const handleEditTestimonial = (testimonial: Testimonial) => {
    const updated = portfolioData.testimonials.map((t: Testimonial) => t.id === testimonial.id ? testimonial : t)
    handleDataChange({ testimonials: updated })
    setShowTestimonialModal(false)
    setEditingItem(null)
    showToastMessage("Testimonial updated")
  }

  const handleDeleteTestimonial = (id: string) => {
    const updated = portfolioData.testimonials.filter((t: Testimonial) => t.id !== id)
    handleDataChange({ testimonials: updated })
    showToastMessage("Testimonial deleted")
  }

  // Contact Item handlers
  const handleAddContactItem = (item: ContactItem) => {
    handleDataChange({ contactItems: [...portfolioData.contactItems, item] })
    setShowContactModal(false)
    showToastMessage("Contact item added")
  }

  const handleEditContactItem = (item: ContactItem) => {
    const updated = portfolioData.contactItems.map((c: ContactItem) => c.id === item.id ? item : c)
    handleDataChange({ contactItems: updated })
    setShowContactModal(false)
    setEditingItem(null)
    showToastMessage("Contact item updated")
  }

  const handleDeleteContactItem = (id: string) => {
    const updated = portfolioData.contactItems.filter((c: ContactItem) => c.id !== id)
    handleDataChange({ contactItems: updated })
    showToastMessage("Contact item deleted")
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Bar (Sticky) */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/portfolio')}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Portfolio Builder</h1>
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
              {portfolioData.appearance.layoutStyle === 'minimalist' 
                ? 'Minimalist' 
                : portfolioData.appearance.layoutStyle === 'shift' 
                ? 'Shift'
                : portfolioData.appearance.layoutStyle === 'innovate'
                ? 'Innovate'
                : 'Aura'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowTemplateSelector(true)}
              className="text-sm"
            >
              Change Template
            </Button>

            {/* Status Badge */}
            <Badge variant={status === "published" ? "default" : "secondary"}>
              {status === "published" ? "Published" : "Draft"}
            </Badge>

            {/* Public URL */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <Globe className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 max-w-[200px] truncate">{publicUrl || "Not published yet"}</span>
              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={copyPublicUrl}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPreviewMode(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Live Preview
            </Button>
            <Button 
              variant="outline" 
              onClick={handleUndo} 
              disabled={historyIndex === 0}
              title="Undo (Cmd/Ctrl + Z)"
            >
              <Undo className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRedo} 
              disabled={historyIndex === history.length - 1}
              title="Redo (Cmd/Ctrl + Shift + Z)"
            >
              <Redo className="w-4 h-4 mr-2" />
              Redo
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button onClick={handlePublish}>
              <Globe className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Live Preview - Full Page */}
        <div className="flex-1 overflow-y-auto relative">
          {/* Floating Edit Mode Toggle - Sticky */}
          <div className="sticky top-0 z-50 flex justify-end pr-8 py-4 pointer-events-none">
            <div className="inline-flex rounded-xl border-2 border-gray-300 bg-white shadow-xl p-1.5 pointer-events-auto">
              <Button
                variant={!editMode ? "default" : "ghost"}
                size="default"
                onClick={() => setEditMode(false)}
                className="px-6 font-semibold"
              >
                👁️ View
              </Button>
              <Button
                variant={editMode ? "default" : "ghost"}
                size="default"
                onClick={() => setEditMode(true)}
                className="px-6 font-semibold"
              >
                ✏️ Edit
              </Button>
            </div>
          </div>

          <div className="-mt-4">
            <PortfolioPreview
              data={portfolioData}
              editMode={editMode}
              onDataChange={handleDataChange}
              onManageServices={() => setShowServiceModal(true)}
              onManageProjects={() => setShowProjectModal(true)}
              onManageTestimonials={() => setShowTestimonialModal(true)}
            />
          </div>
        </div>

        {/* Right: Control Panel */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <ControlPanel
            data={portfolioData}
            onDataChange={handleDataChange}
            onOpenServiceModal={() => setShowServiceModal(true)}
            onOpenProjectModal={() => setShowProjectModal(true)}
            onOpenTestimonialModal={() => setShowTestimonialModal(true)}
            onOpenContactModal={() => setShowContactModal(true)}
            onEditService={(service: Service) => {
              setEditingItem(service)
              setShowServiceModal(true)
            }}
            onDeleteService={handleDeleteService}
            onEditProject={(project: Project) => {
              setEditingItem(project)
              setShowProjectModal(true)
            }}
            onDeleteProject={handleDeleteProject}
            onEditTestimonial={(testimonial: Testimonial) => {
              setEditingItem(testimonial)
              setShowTestimonialModal(true)
            }}
            onDeleteTestimonial={handleDeleteTestimonial}
            onEditContactItem={(item: ContactItem) => {
              setEditingItem(item)
              setShowContactModal(true)
            }}
            onDeleteContactItem={handleDeleteContactItem}
          />
        </div>
      </div>

      {/* Footer Bar (appears on change) */}
      {hasChanges && (
        <footer className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
              Unsaved changes
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleDiscard}>
                Discard
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                Save
              </Button>
              <Button onClick={handlePublish}>
                Publish
              </Button>
            </div>
          </div>
        </footer>
      )}

      {/* Toast Notifications */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>{showToast}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 ml-2 hover:bg-gray-800"
              onClick={() => setShowToast(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ServiceModal
        open={showServiceModal}
        onClose={() => {
          setShowServiceModal(false)
          setEditingItem(null)
        }}
        onSave={editingItem ? handleEditService : handleAddService}
        editingService={editingItem}
      />

      <ProjectModal
        open={showProjectModal}
        onClose={() => {
          setShowProjectModal(false)
          setEditingItem(null)
        }}
        onSave={editingItem ? handleEditProject : handleAddProject}
        editingProject={editingItem}
      />

      <TestimonialModal
        open={showTestimonialModal}
        onClose={() => {
          setShowTestimonialModal(false)
          setEditingItem(null)
        }}
        onSave={editingItem ? handleEditTestimonial : handleAddTestimonial}
        editingTestimonial={editingItem}
      />

      <ContactModal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false)
          setEditingItem(null)
        }}
        onSave={editingItem ? handleEditContactItem : handleAddContactItem}
        editingItem={editingItem}
      />

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={publicUrl}
      />

      {/* Template Confirmation Modal */}
      {showTemplateConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">Switch Your Default Template?</h3>
            <p className="text-gray-600 mb-6">
              You're switching from <strong>{originalTemplateFromDb}</strong> to <strong>{portfolioData.appearance.layoutStyle}</strong>. This will change your default portfolio template.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Your current changes will be saved and this template will become your new default.
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTemplateConfirmModal(false)
                  showToastMessage("Save cancelled")
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setShowTemplateConfirmModal(false)
                  setIsSaving(true)
                  try {
                    const result = await savePortfolio(portfolioData, "draft", portfolioId)
                    
                    if (result.success) {
                      if (result.portfolioId) {
                        setPortfolioId(result.portfolioId)
                      }
                      setHasChanges(false)
                      // Update the original template after save
                      setOriginalTemplateFromDb(portfolioData.appearance.layoutStyle)
                      showToastMessage("Template saved and set as your default!")
                    } else {
                      showToastMessage(result.error || "Failed to save portfolio")
                    }
                  } catch (error: any) {
                    console.error("Error saving portfolio:", error)
                    showToastMessage(error.message || "Failed to save portfolio")
                  } finally {
                    setIsSaving(false)
                  }
                }}
                className="flex-1"
              >
                Save & Set as Default
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


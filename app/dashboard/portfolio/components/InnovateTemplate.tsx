"use client"

import { PortfolioData } from "../types"
import { InlineText } from "./InlineText"
import { InlineImageReplace } from "./InlineImageReplace"
import { iconComponents } from "./IconPicker"
import { IconPicker } from "./IconPicker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ExternalLink, Trash2, Edit2, Send, ArrowRight, Calendar } from "lucide-react"
import { useState } from "react"

interface TemplateProps {
  data: PortfolioData
  editMode: boolean
  onDataChange: (data: Partial<PortfolioData>) => void
  onManageServices: () => void
  onManageProjects: () => void
  onManageTestimonials: () => void
}

const fontFamilyMap: Record<string, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  inter: '"Inter", sans-serif',
  roboto: '"Roboto", sans-serif',
  poppins: '"Poppins", sans-serif',
  montserrat: '"Montserrat", sans-serif',
  playfair: '"Playfair Display", serif',
  lora: '"Lora", serif',
  raleway: '"Raleway", sans-serif',
  opensans: '"Open Sans", sans-serif',
  merriweather: '"Merriweather", serif',
  nunito: '"Nunito", sans-serif',
  lato: '"Lato", sans-serif',
  worksans: '"Work Sans", sans-serif'
}

export function InnovateTemplate({
  data,
  editMode,
  onDataChange,
  onManageServices,
  onManageProjects,
  onManageTestimonials
}: TemplateProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [editingContactItemId, setEditingContactItemId] = useState<string>("")
  const [editingType, setEditingType] = useState<'contact' | 'social'>('contact')
  const [editingSocialLinkId, setEditingSocialLinkId] = useState<string>("")
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0)
  const [activeProjectIndex, setActiveProjectIndex] = useState(0)
  const [addingNewSocialLink, setAddingNewSocialLink] = useState(false)

  const fontFamily = fontFamilyMap[data.appearance.fontFamily] || fontFamilyMap.system
  const backgroundColor = data.appearance.backgroundColor || '#ffffff'
  const textColor = data.appearance.textColor || '#1a1a1a'

  const handleHeroChange = (field: string, value: string) => {
    console.log('🔴 InnovateTemplate handleHeroChange:', field, 'value length:', value?.length || 0)
    onDataChange({ hero: { ...data.hero, [field]: value } })
  }

  const handleContactChange = (field: string, value: string) => {
    onDataChange({ contact: { ...data.contact, [field]: value } })
  }

  const handleContactItemChange = (itemId: string, field: 'label' | 'value', value: string) => {
    const updatedItems = data.contactItems.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    )
    onDataChange({ contactItems: updatedItems })
  }

  const handleSectionHeaderChange = (section: string, value: string) => {
    onDataChange({ 
      sectionHeaders: { ...data.sectionHeaders, [section]: value } 
    })
  }

  const handleAboutChange = (field: string, value: string) => {
    onDataChange({ about: { ...data.about, [field]: value } })
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setFormData({ name: "", email: "", message: "" })
    alert("Message sent! We'll get back to you soon.")
  }

  const handleIconClick = (itemId: string, type: 'contact' | 'social' = 'contact') => {
    if (editMode) {
      setEditingContactItemId(itemId)
      setEditingType(type)
      setShowIconPicker(true)
    }
  }

  const handleIconSelect = (iconName: string) => {
    if (addingNewSocialLink) {
      // Add new social link with selected icon
      const newLink = {
        id: `social-${Date.now()}`,
        icon: iconName,
        url: 'https://example.com'
      }
      onDataChange({ socialLinks: [...(data.socialLinks || []), newLink] })
      setAddingNewSocialLink(false)
    } else if (editingType === 'social') {
      const updatedLinks = data.socialLinks.map(link => 
        link.id === editingContactItemId ? { ...link, icon: iconName } : link
      )
      onDataChange({ socialLinks: updatedLinks })
    } else {
      const updatedItems = data.contactItems.map(item => 
        item.id === editingContactItemId ? { ...item, icon: iconName } : item
      )
      onDataChange({ contactItems: updatedItems })
    }
    setShowIconPicker(false)
    setEditingContactItemId("")
  }

  const handleDeleteItem = (type: 'service' | 'project' | 'testimonial', id: string) => {
    if (confirm("Delete this item?")) {
      if (type === 'service') {
        onDataChange({ services: data.services.filter(s => s.id !== id) })
      } else if (type === 'project') {
        onDataChange({ projects: data.projects.filter(p => p.id !== id) })
      } else {
        onDataChange({ testimonials: data.testimonials.filter(t => t.id !== id) })
      }
    }
  }

  return (
    <div style={{ fontFamily, backgroundColor, color: textColor }}>
      {/* Hero Section - Innovate Style */}
      {data.modules.hero && (
        <section id="hero" className="relative min-h-screen bg-white">
          {/* Top Navigation Bar */}
          <nav className="absolute top-0 left-0 right-0 z-50 px-8 md:px-16 py-6 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="flex items-center justify-between max-w-[1400px] mx-auto">
              {/* Logo */}
              {!data.branding.hideLogo && (
                <a href="#hero" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={(e) => { e.preventDefault(); document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  {data.branding.logo ? (
                    <img src={data.branding.logo} alt="Logo" className="h-10 md:h-12 w-auto" />
                  ) : (
                    <div 
                      className="h-10 md:h-12 px-4 md:px-6 rounded-md flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: data.appearance.primaryColor }}
                    >
                      {data.branding.logoText || "LOGO"}
                    </div>
                  )}
                  {data.branding.logoText && data.branding.logo && (
                    <span className="text-xl font-bold" style={{ color: textColor }}>
                      {data.branding.logoText}
                    </span>
                  )}
                </a>
              )}

              {/* Navigation Links */}
              <div className="flex items-center gap-4 md:gap-6 ml-auto mr-4 md:mr-6">
                {data.modules.about && (
                  <a href="#about" className="text-sm md:text-base font-medium hover:opacity-70 transition-opacity" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }}>About</a>
                )}
                {data.modules.services && (
                  <a href="#services" className="text-sm md:text-base font-medium hover:opacity-70 transition-opacity" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) }}>Services</a>
                )}
                {data.modules.projects && (
                  <a href="#work" className="text-sm md:text-base font-medium hover:opacity-70 transition-opacity" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }) }}>Work</a>
                )}
                {data.modules.testimonials && (
                  <a href="#testimonials" className="text-sm md:text-base font-medium hover:opacity-70 transition-opacity" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }) }}>Testimonials</a>
                )}
                {data.modules.contact && (
                  <a href="#contact" className="text-sm md:text-base font-medium hover:opacity-70 transition-opacity" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}>Contact</a>
                )}
              </div>

              {/* Get In Touch Button */}
              <Button 
                className="rounded-full px-4 md:px-6 py-2 text-white font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity text-sm md:text-base"
                style={{ backgroundColor: data.appearance.primaryColor }}
                data-cta="Get In Touch"
                onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}
              >
                Get In Touch <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="pt-32 pb-12 px-8 md:px-16">
            <div className="max-w-[1400px] mx-auto">
              {/* Main Headline */}
              <div className="mb-8 max-w-3xl ml-8 md:ml-16">
                {data.about?.heading && (
                  <div className="mb-4">
                    <span 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: `${data.appearance.primaryColor}20`,
                        color: data.appearance.primaryColor 
                      }}
                    >
                      <InlineText
                        value={data.about.heading}
                        onChange={(val) => handleAboutChange('heading', val)}
                        editMode={editMode}
                        style={{ color: data.appearance.primaryColor }}
                        placeholder="Award-Winning Team"
                      />
                    </span>
                  </div>
                )}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-2" style={{ color: textColor }}>
                  <InlineText
                    value={data.hero.name}
                    onChange={(val) => handleHeroChange('name', val)}
                    editMode={editMode}
                    className="text-5xl md:text-6xl lg:text-7xl font-bold"
                    style={{ color: textColor }}
                    placeholder="Creative Brand"
                  />
                </h1>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8" style={{ color: textColor, opacity: 0.6 }}>
                  <InlineText
                    value={data.hero.tagline || "Management Studio"}
                    onChange={(val) => handleHeroChange('tagline', val)}
                    editMode={editMode}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold"
                    style={{ color: textColor, opacity: 0.6 }}
                    placeholder="Management Studio"
                  />
                </h2>
              </div>
            </div>
          </div>

          {/* Hero Image with Overlay Stats - Full Width */}
          <div className="relative overflow-hidden shadow-2xl">
            {/* Image with gradient overlay */}
            <div className="relative h-[500px] md:h-[600px]">
              <InlineImageReplace
                src={data.hero.avatar || "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&auto=format&fit=crop"}
                alt="Hero"
                className="w-full h-full object-cover"
                onReplace={(newSrc) => handleHeroChange('avatar', newSrc)}
                editMode={editMode}
                cropWidth={1400}
                cropHeight={600}
              />
              {/* Subtle gradient overlay */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(to bottom, ${data.appearance.primaryColor}15 0%, ${data.appearance.primaryColor}35 100%)`,
                  filter: 'grayscale(100%)'
                }}
              />
              {data.hero.avatar ? null : (
                <div 
                  className="w-full h-full flex items-center justify-center relative"
                  style={{
                    background: `linear-gradient(135deg, ${data.appearance.primaryColor} 0%, ${data.appearance.secondaryColor} 100%)`
                  }}
                >
                  {editMode && (
                    <div className="text-center text-white">
                      <p className="text-xl mb-4">Click to add hero image</p>
                      <Button
                        className="bg-white text-black hover:bg-gray-100"
                        onClick={() => {
                          const newUrl = prompt('Enter image URL:')
                          if (newUrl) handleHeroChange('avatar', newUrl)
                        }}
                      >
                        Add Image
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Stats Overlay - Inline Editable */}
              <div className="absolute bottom-8 left-8 md:left-16 right-8 flex flex-col sm:flex-row gap-4 sm:gap-6 z-10">
                {/* Stat 1 */}
                <div className="text-white backdrop-blur-sm bg-black/10 rounded-2xl p-6">
                  <div className="text-5xl md:text-6xl font-bold mb-2">
                    <InlineText
                      value={data.hero.bio || "15+"}
                      onChange={(val) => handleHeroChange('bio', val)}
                      editMode={editMode}
                      className="text-5xl md:text-6xl font-bold"
                      style={{ color: '#ffffff' }}
                      placeholder="15+"
                    />
                  </div>
                  <div className="text-base md:text-lg font-medium opacity-90">
                    <InlineText
                      value={data.hero.ctaLabel || "Years Experience"}
                      onChange={(val) => handleHeroChange('ctaLabel', val)}
                      editMode={editMode}
                      className="text-base md:text-lg font-medium"
                      style={{ color: '#ffffff' }}
                      placeholder="Years Experience"
                    />
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="text-white backdrop-blur-sm bg-black/10 rounded-2xl p-6">
                  <div className="text-5xl md:text-6xl font-bold mb-2">
                    <InlineText
                      value={data.hero.prefix || "85+"}
                      onChange={(val) => handleHeroChange('prefix', val)}
                      editMode={editMode}
                      className="text-5xl md:text-6xl font-bold"
                      style={{ color: '#ffffff' }}
                      placeholder="85+"
                    />
                  </div>
                  <div className="text-base md:text-lg font-medium opacity-90">
                    <InlineText
                      value={data.hero.stat2Description || "Successful Projects"}
                      onChange={(val) => handleHeroChange('stat2Description', val)}
                      editMode={editMode}
                      className="text-base md:text-lg font-medium"
                      style={{ color: '#ffffff' }}
                      placeholder="Successful Projects"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {data.modules.about && (
        <section id="about" className="py-20 md:py-32 bg-gray-50">
          <div className="max-w-[1400px] mx-auto px-8 md:px-16">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
              {/* Left Column - Headline */}
              <div>
                <div className="mb-6">
                  <span 
                    className="inline-block px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
                    style={{ 
                      backgroundColor: data.appearance.primaryColor,
                      color: '#ffffff'
                    }}
                  >
                    WHO WE ARE
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  <span style={{ color: textColor }}>
                    <InlineText
                      value={data.hero.name}
                      onChange={(val) => handleHeroChange('name', val)}
                      editMode={editMode}
                      className="text-4xl md:text-5xl lg:text-6xl font-bold"
                      style={{ color: textColor }}
                      placeholder="Creative Brand"
                    />
                  </span>
                  <br />
                  <span style={{ color: textColor, opacity: 0.3 }}>
                    <InlineText
                      value={data.hero.tagline || "Management Studio"}
                      onChange={(val) => handleHeroChange('tagline', val)}
                      editMode={editMode}
                      className="text-4xl md:text-5xl lg:text-6xl font-bold"
                      style={{ color: textColor, opacity: 0.3 }}
                      placeholder="Management Studio"
                    />
                  </span>
                </h2>
              </div>

              {/* Right Column - Description */}
              <div className="space-y-6">
                <div className="text-lg leading-relaxed" style={{ color: textColor, opacity: 0.8 }}>
                  <InlineText
                    value={data.about?.column1 || "We're a team of passionate brand strategists, designers, and creative thinkers dedicated to transforming businesses through powerful visual storytelling."}
                    onChange={(val) => handleAboutChange('column1', val)}
                    editMode={editMode}
                    className="text-lg leading-relaxed block"
                    style={{ color: textColor, opacity: 0.8 }}
                    placeholder="We're a team of passionate brand strategists..."
                  />
                </div>
                
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: textColor }} />
                    <div className="text-base leading-relaxed" style={{ color: textColor, opacity: 0.8 }}>
                      <InlineText
                        value={data.about?.column2 || "Our approach combines strategic thinking with creative excellence. We create meaningful brand experiences that drive real business growth."}
                        onChange={(val) => handleAboutChange('column2', val)}
                        editMode={editMode}
                        className="block"
                        style={{ color: textColor, opacity: 0.8 }}
                        placeholder="Our approach combines strategic thinking..."
                      />
                    </div>
                  </li>
                </ul>

                <div className="pt-4">
                  <Button 
                    className="px-8 py-6 rounded-full text-base font-semibold border-2 bg-transparent hover:bg-opacity-10 transition-all"
                    style={{ 
                      borderColor: textColor,
                      color: textColor 
                    }}
                    asChild
                  >
                    <a href="#contact" className="inline-flex items-center gap-2">
                      Get In Touch <ArrowRight className="w-5 h-5" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      {data.modules.services && (
        <section id="services" className="py-20 md:py-32 px-8 md:px-16 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-[1400px] mx-auto">
            <div className="mb-16">
              <div className="mb-4">
                <span 
                  className="inline-block px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
                  style={{ 
                    backgroundColor: data.appearance.primaryColor,
                    color: '#ffffff'
                  }}
                >
                  <InlineText
                    value="WHAT WE DO"
                    onChange={(val) => handleSectionHeaderChange('services', val)}
                    editMode={editMode}
                    style={{ color: '#ffffff' }}
                    placeholder="WHAT WE DO"
                  />
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: textColor }}>
                <InlineText
                  value={data.sectionHeaders?.services || "Our Services"}
                  onChange={(val) => handleSectionHeaderChange('services', val)}
                  editMode={editMode}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold"
                  style={{ color: textColor }}
                  placeholder="Our Services"
                />
              </h2>
              <p className="text-lg md:text-xl max-w-xl" style={{ color: textColor, opacity: 0.7 }}>
                We specialize in creating, developing, and managing solutions that help businesses stand out and connect with their audience.
              </p>
            </div>

            {data.services.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                <p className="text-gray-500 mb-4">No services added yet</p>
                {editMode && (
                  <Button 
                    variant="default"
                    onClick={onManageServices}
                    style={{ backgroundColor: data.appearance.primaryColor }}
                  >
                    ➕ Add Your First Service
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {data.services.map((service, index) => (
                  <div 
                    key={service.id} 
                    className="group relative p-8 lg:p-10 rounded-3xl bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-2 hover:border-transparent overflow-hidden"
                    style={{
                      borderColor: `${data.appearance.primaryColor}15`
                    }}
                  >
                    {editMode && (
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDeleteItem('service', service.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {/* Gradient background on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500"
                      style={{
                        background: `linear-gradient(135deg, ${data.appearance.primaryColor} 0%, ${data.appearance.secondaryColor} 100%)`
                      }}
                    />
                    
                    {/* Number badge */}
                    <div 
                      className="absolute top-8 right-8 w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl transition-all duration-500 group-hover:scale-110"
                      style={{ 
                        backgroundColor: `${data.appearance.primaryColor}10`,
                        color: data.appearance.primaryColor
                      }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    
                    <div className="relative z-10">
                      <h3 className="text-2xl md:text-3xl font-bold mb-4 pr-16" style={{ color: textColor }}>
                        {service.title}
                      </h3>
                      <p className="mb-8 leading-relaxed text-base" style={{ color: textColor, opacity: 0.7 }}>
                        {service.blurb}
                      </p>
                      <div className="flex items-center justify-end pt-6 border-t" style={{ borderColor: `${data.appearance.primaryColor}15` }}>
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                          style={{ backgroundColor: `${data.appearance.primaryColor}10` }}
                        >
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" style={{ color: data.appearance.primaryColor }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {editMode && data.services.length > 0 && (
              <div className="mt-12 text-center">
                <Button 
                  onClick={onManageServices}
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg"
                  style={{ backgroundColor: data.appearance.primaryColor }}
                >
                  + Add Service
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Projects Section - Carousel Style */}
      {data.modules.projects && (
        <section id="work" className="py-20 md:py-32 bg-white">
          <div className="max-w-[1600px] mx-auto px-8 md:px-16">
            {data.projects.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-4">No projects added yet</p>
                {editMode && (
                  <Button 
                    variant="default"
                    onClick={onManageProjects}
                    style={{ backgroundColor: data.appearance.primaryColor }}
                  >
                    ➕ Add Your First Project
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-[1fr,1.5fr] gap-8 lg:gap-12 items-center">
                {/* Left Column - Text Content */}
                <div>
                  <div className="mb-4">
                    <span 
                      className="inline-block px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
                      style={{ 
                        backgroundColor: data.appearance.primaryColor,
                        color: '#ffffff'
                      }}
                    >
                      <InlineText
                        value="WHO WE DO"
                        onChange={(val) => handleSectionHeaderChange('projects', val)}
                        editMode={editMode}
                        style={{ color: '#ffffff' }}
                        placeholder="WHO WE DO"
                      />
                    </span>
                  </div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: textColor }}>
                    <InlineText
                      value={data.sectionHeaders?.projects || "Recent Cases"}
                      onChange={(val) => handleSectionHeaderChange('projects', val)}
                      editMode={editMode}
                      className="text-4xl md:text-5xl lg:text-6xl font-bold"
                      style={{ color: textColor }}
                      placeholder="Recent Cases"
                    />
                  </h2>
                  <p className="text-lg leading-relaxed mb-8" style={{ color: textColor, opacity: 0.7 }}>
                    We specialize in creating, developing, and managing a brand's identity to help businesses stand out in the marketplace and connect with their target audience.
                  </p>

                  {editMode && (
                    <Button 
                      onClick={onManageProjects}
                      size="lg"
                      className="rounded-full px-8"
                      style={{ backgroundColor: data.appearance.primaryColor }}
                    >
                      + Add Project
                    </Button>
                  )}
                </div>

                {/* Right Column - Carousel */}
                <div className="relative">
                  {/* Projects Carousel */}
                  <div className="relative overflow-hidden rounded-3xl">
                    <div 
                      className="flex transition-transform duration-700 ease-in-out"
                      style={{ transform: `translateX(-${activeProjectIndex * 100}%)` }}
                    >
                      {data.projects.map((project, index) => (
                        <div key={project.id} className="min-w-full">
                          <div className="relative group overflow-hidden rounded-3xl shadow-2xl">
                            {editMode && (
                              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleDeleteItem('project', project.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            
                            {/* Project Image */}
                            <div className="relative h-[500px] lg:h-[550px]">
                              <div className="w-full h-full overflow-hidden">
                                <InlineImageReplace
                                src={project.coverImage || "https://images.unsplash.com/photo-1558769132-cb1aea3c75b5?q=80&w=800&auto=format&fit=crop"}
                                alt={project.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                onReplace={(newSrc) => {
                                  const updated = data.projects.map(p =>
                                    p.id === project.id ? { ...p, coverImage: newSrc } : p
                                  )
                                  onDataChange({ projects: updated })
                                }}
                                  editMode={editMode}
                                />
                              </div>
                              
                              {/* Gradient Overlay */}
                              <div 
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)'
                                }}
                              />
                              
                              {/* Project Info Overlay */}
                              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12 text-white z-10">
                                <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                                  {project.title}
                                </h3>
                                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                                  {project.tags && project.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {project.tags.map((tag, i) => (
                                        <span 
                                          key={i} 
                                          className="text-xs md:text-sm px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/20"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {project.link && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
                                    >
                                      <a href={project.link || 'https://example.com'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                                        View Project
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Arrows - Outside carousel */}
                  {data.projects.length > 1 && (
                    <div className="flex justify-center gap-4 mt-8">
                      <button
                        onClick={() => setActiveProjectIndex((prev) => (prev === 0 ? data.projects.length - 1 : prev - 1))}
                        className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-110 border-2"
                        style={{ borderColor: data.appearance.primaryColor, color: data.appearance.primaryColor }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setActiveProjectIndex((prev) => (prev === data.projects.length - 1 ? 0 : prev + 1))}
                        className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-110 border-2"
                        style={{ borderColor: data.appearance.primaryColor, color: data.appearance.primaryColor }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {data.modules.testimonials && (
        <section id="testimonials" className="py-20 md:py-32">
          <div className="max-w-[1600px] mx-auto">
            {data.testimonials.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg mx-8 md:mx-16">
                <p className="text-gray-500 mb-4">No testimonials added yet</p>
                {editMode && (
                  <Button 
                    variant="default"
                    onClick={onManageTestimonials}
                    style={{ backgroundColor: data.appearance.primaryColor }}
                  >
                    ➕ Add Your First Testimonial
                  </Button>
                )}
              </div>
            ) : (
              <div className="relative px-8 md:px-16">
                <div className="grid md:grid-cols-2 gap-8 items-stretch">
                  {/* Left Column - Image */}
                  <div className="relative h-[400px] md:h-[600px] overflow-hidden rounded-3xl shadow-xl">
                    {data.testimonials[activeTestimonialIndex] && (
                      <img 
                        src={data.hero.avatar || "https://images.unsplash.com/photo-hCb3lIB8L8E?w=1400&auto=format&fit=crop"}
                        alt="Testimonial"
                        className="w-full h-full object-cover"
                        style={{
                          filter: 'brightness(0.8) saturate(1.2)',
                        }}
                      />
                    )}
                    {/* Gradient overlay */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${data.appearance.primaryColor}60 0%, ${data.appearance.secondaryColor}40 100%)`
                      }}
                    />
                  </div>

                  {/* Right Column - Testimonial Content */}
                  <div className="bg-gray-50 p-8 md:p-16 flex flex-col justify-center relative rounded-3xl shadow-xl">
                    {editMode && data.testimonials.length > 0 && (
                      <div className="absolute top-4 right-4">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDeleteItem('testimonial', data.testimonials[activeTestimonialIndex].id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* Large Quote Marks */}
                    <div className="mb-8">
                      <svg width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.15 }}>
                        <path d="M0 30C0 13.4315 13.4315 0 30 0V10C18.9543 10 10 18.9543 10 30C10 41.0457 18.9543 50 30 50H35V60H30C13.4315 60 0 46.5685 0 30ZM50 30C50 13.4315 63.4315 0 80 0V10C68.9543 10 60 18.9543 60 30C60 41.0457 68.9543 50 80 50H85V60H80C63.4315 60 50 46.5685 50 30Z" fill="currentColor" style={{ color: textColor }} />
                      </svg>
                    </div>

                    {/* Testimonial Quote */}
                    <blockquote className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-12" style={{ color: textColor }}>
                      "{data.testimonials[activeTestimonialIndex]?.quote}"
                    </blockquote>

                    {/* Author Info */}
                    <div className="flex items-center gap-4 mb-12">
                      {(data.testimonials[activeTestimonialIndex] as any)?.avatar && (
                        <div className="relative">
                          <img 
                            src={(data.testimonials[activeTestimonialIndex] as any).avatar}
                            alt={data.testimonials[activeTestimonialIndex]?.author}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-lg" style={{ color: textColor }}>
                          {data.testimonials[activeTestimonialIndex]?.author}
                        </p>
                        <p className="text-sm uppercase tracking-wider" style={{ color: textColor, opacity: 0.6 }}>
                          {data.testimonials[activeTestimonialIndex]?.role}
                        </p>
                      </div>
                    </div>

                    {/* Dot Indicators */}
                    <div className="flex items-center gap-3">
                      {data.testimonials.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveTestimonialIndex(index)}
                          className="transition-all duration-300 rounded-full"
                          style={{
                            width: activeTestimonialIndex === index ? '32px' : '12px',
                            height: '12px',
                            backgroundColor: activeTestimonialIndex === index ? textColor : `${textColor}30`,
                          }}
                          aria-label={`Go to testimonial ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {editMode && data.testimonials.length > 0 && (
                  <div className="text-center mt-8 px-8">
                    <Button 
                      onClick={onManageTestimonials}
                      size="lg"
                      className="rounded-full"
                      style={{ backgroundColor: data.appearance.primaryColor }}
                    >
                      + Add Testimonial
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Contact Section */}
      {data.modules.contact && (
        <section id="contact" className="py-20 md:py-32 px-8 md:px-16" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="max-w-[1100px] mx-auto">
            <div className="mb-16 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: textColor }}>
                <InlineText
                  value={data.contact.title}
                  onChange={(val) => handleContactChange('title', val)}
                  editMode={editMode}
                  className="text-4xl md:text-5xl font-bold"
                  style={{ color: textColor }}
                  placeholder="Get In Touch"
                />
              </h2>
              <div className="text-lg md:text-xl" style={{ color: textColor, opacity: 0.7 }}>
                <InlineText
                  value={data.contact.note}
                  onChange={(val) => handleContactChange('note', val)}
                  editMode={editMode}
                  className="block"
                  style={{ color: textColor, opacity: 0.7 }}
                  placeholder="Let's work together on your next project"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-6">
                {data.contactItems.map((item) => {
                  const IconComponent = iconComponents[item.icon as keyof typeof iconComponents]
                  return (
                    <div 
                      key={item.id}
                      className="flex items-start gap-5 group p-6 rounded-2xl bg-white hover:shadow-lg transition-all duration-300"
                    >
                      <div 
                        className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${editMode ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
                        style={{ backgroundColor: data.appearance.primaryColor }}
                        onClick={() => handleIconClick(item.id)}
                        title={editMode ? "Click to change icon" : ""}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 pt-2">
                        <div className="text-sm mb-1 font-medium" style={{ color: textColor, opacity: 0.6 }}>
                          <InlineText
                            value={item.label}
                            onChange={(val) => handleContactItemChange(item.id, 'label', val)}
                            editMode={editMode}
                            className="text-sm font-medium"
                            style={{ color: textColor, opacity: 0.6 }}
                            placeholder="Label"
                          />
                        </div>
                        <div className="text-lg font-semibold" style={{ color: textColor }}>
                          <InlineText
                            value={item.value}
                            onChange={(val) => handleContactItemChange(item.id, 'value', val)}
                            editMode={editMode}
                            className="text-lg font-semibold"
                            style={{ color: textColor }}
                            placeholder="Value"
                          />
                        </div>
                      </div>
                      {editMode && (
                        <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Contact Form */}
              <div className="p-8 rounded-2xl bg-white shadow-lg">
                <form id="contact-form" data-form-type="contact" onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your Name"
                      required
                      className="h-14 text-base rounded-xl"
                    />
                  </div>

                  <div>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Your Email"
                      required
                      className="h-14 text-base rounded-xl"
                    />
                  </div>

                  <div>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Your Message"
                      required
                      rows={6}
                      className="resize-none text-base rounded-xl"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      className="flex-1 h-14 text-white text-base font-semibold rounded-xl hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: data.appearance.primaryColor }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                    {data.behavior.showBookMeetingButton !== false && (
                      <Button 
                        type="button"
                        variant="outline"
                        className="flex-1 h-14 text-base font-semibold rounded-xl"
                        style={{ borderColor: data.appearance.primaryColor, color: data.appearance.primaryColor }}
                        data-cta="Book a Meeting"
                        onClick={() => window.open('/book-meeting', '_blank')}
                      >
                        <Calendar className="w-5 h-5 mr-2" />
                        Book a Meeting
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      {data.modules.footer && (
        <footer className="py-12 px-8 md:px-16 border-t border-gray-200" style={{ backgroundColor }}>
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-sm" style={{ color: textColor, opacity: 0.6 }}>
                © {new Date().getFullYear()} {' '}
                <InlineText
                  value={data.footer?.companyName || data.hero.name || "Company"}
                  onChange={(val) => onDataChange({ footer: { ...data.footer, companyName: val } })}
                  editMode={editMode}
                  className="text-sm inline"
                  style={{ color: textColor, opacity: 0.6 }}
                  placeholder="Company Name"
                />
                . All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                {data.socialLinks?.map((social) => {
                  const IconComponent = iconComponents[social.icon as keyof typeof iconComponents]
                  return (
                    <div key={social.id} className="relative group">
                      <button 
                        onClick={() => {
                          if (editMode) {
                            handleIconClick(social.id, 'social')
                          } else if (social.url) {
                            window.open(social.url, '_blank')
                          }
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg"
                        style={{ backgroundColor: `${data.appearance.primaryColor}15`, color: data.appearance.primaryColor }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                      {editMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingSocialLinkId(social.id)
                          }}
                          className="absolute top-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600"
                        >
                          <ExternalLink className="w-3 h-3 text-white" />
                        </button>
                      )}
                    </div>
                  )
                })}
                {editMode && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setAddingNewSocialLink(true)
                      setEditingType('social')
                      setShowIconPicker(true)
                    }}
                    className="w-10 h-10 rounded-full"
                    style={{ backgroundColor: data.appearance.primaryColor }}
                  >
                    +
                  </Button>
                )}
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Icon Picker Modal */}
      <IconPicker
        open={showIconPicker}
        onClose={() => {
          setShowIconPicker(false)
          setEditingContactItemId("")
        }}
        onSelect={handleIconSelect}
        currentIcon={
          editingType === 'social' 
            ? data.socialLinks?.find(link => link.id === editingContactItemId)?.icon
            : data.contactItems.find(item => item.id === editingContactItemId)?.icon
        }
      />

      {/* Social Link URL Editor Modal */}
      {editingSocialLinkId && data.socialLinks?.find(s => s.id === editingSocialLinkId) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingSocialLinkId("")}>
          <div className="bg-white rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold">Edit Social Link URL</h3>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  if (confirm("Delete this social link?")) {
                    const updatedLinks = data.socialLinks.filter(s => s.id !== editingSocialLinkId)
                    onDataChange({ socialLinks: updatedLinks })
                    setEditingSocialLinkId("")
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <input
              type="text"
              value={data.socialLinks.find(s => s.id === editingSocialLinkId)?.url || ""}
              onChange={(e) => {
                const updatedLinks = data.socialLinks.map(s =>
                  s.id === editingSocialLinkId ? { ...s, url: e.target.value } : s
                )
                onDataChange({ socialLinks: updatedLinks })
              }}
              placeholder="https://example.com"
              className="w-full px-4 py-2 border rounded-lg mb-4 text-sm"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingSocialLinkId("")}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setEditingSocialLinkId("")}
                style={{ backgroundColor: data.appearance.primaryColor }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


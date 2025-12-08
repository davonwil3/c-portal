"use client"

import { PortfolioData } from "../types"
import { InlineText } from "./InlineText"
import { InlineImageReplace } from "./InlineImageReplace"
import { iconComponents } from "./IconPicker"
import { IconPicker } from "./IconPicker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ExternalLink, Trash2, Edit2, Send, ChevronDown, ArrowDown, Calendar, ArrowRight } from "lucide-react"
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

export function ShiftTemplate({
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
  const [addingNewSocialLink, setAddingNewSocialLink] = useState(false)

  const fontFamily = fontFamilyMap[data.appearance.fontFamily] || fontFamilyMap.system
  const backgroundColor = data.appearance.backgroundColor || '#d4cfc4'
  const textColor = data.appearance.textColor || '#1a1a1a'

  const handleHeroChange = (field: string, value: string) => {
    console.log('🟡 ShiftTemplate handleHeroChange:', field, 'value length:', value?.length || 0)
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
        url: ''
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
      {/* Hero Section - Editorial Style */}
      {data.modules.hero && (
        <section id="hero" className="min-h-screen relative px-6 md:px-16 py-12">
          {/* Top Navigation Bar */}
          <div className="flex justify-between items-center text-sm md:text-base mb-20">
            {/* Left: Name */}
            <a href="#hero" className="hover:opacity-80 transition-opacity" onClick={(e) => { e.preventDefault(); document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }) }}>
              <div style={{ color: textColor, fontWeight: 600 }}>
                <InlineText
                  value={data.hero.name}
                  onChange={(val) => handleHeroChange('name', val)}
                  editMode={editMode}
                  style={{ color: textColor, fontWeight: 600 }}
                  placeholder="Your Name"
                />
              </div>
            </a>

            {/* Center: Navigation Links */}
            <nav className="hidden md:flex gap-8" style={{ color: textColor }}>
              {data.modules.projects && (
                <a href="#projects" className="hover:opacity-70 transition-opacity uppercase tracking-wider font-medium" onClick={(e) => { e.preventDefault(); document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  Work
                </a>
              )}
              {data.modules.about && (
                <a href="#about" className="hover:opacity-70 transition-opacity uppercase tracking-wider font-medium" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  About
                </a>
              )}
              {data.modules.services && (
                <a href="#services" className="hover:opacity-70 transition-opacity uppercase tracking-wider font-medium" onClick={(e) => { e.preventDefault(); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  Services
                </a>
              )}
              {data.modules.testimonials && (
                <a href="#testimonials" className="hover:opacity-70 transition-opacity uppercase tracking-wider font-medium" onClick={(e) => { e.preventDefault(); document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  Testimonials
                </a>
              )}
              {data.modules.contact && (
                <a href="#contact" className="hover:opacity-70 transition-opacity uppercase tracking-wider font-medium" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  Contact
                </a>
              )}
            </nav>

            {/* Right: Logo and Logo Text */}
            {!data.branding.hideLogo && (
              <a href="#hero" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={(e) => { e.preventDefault(); document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }) }}>
                {data.branding.logo ? (
                  <img src={data.branding.logo} alt="Logo" className="h-8 md:h-10 w-auto" />
                ) : (
                  <div 
                    className="h-8 md:h-10 px-4 rounded-full flex items-center justify-center font-bold text-white text-xs md:text-sm"
                    style={{ backgroundColor: data.appearance.primaryColor }}
                  >
                    {data.branding.logoText || "LOGO"}
                  </div>
                )}
                {data.branding.logoText && data.branding.logo && (
                  <span className="text-base md:text-lg font-bold uppercase tracking-wide" style={{ color: data.appearance.primaryColor }}>
                    {data.branding.logoText}
                  </span>
                )}
              </a>
            )}
          </div>

          {/* Main Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Large Typography */}
            <div className="w-full lg:col-span-1" style={{ overflow: 'visible', minWidth: 0 }}>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-none mb-8 tracking-tight" style={{ color: textColor, width: '100%', overflow: 'visible' }}>
                <InlineText
                  value={data.hero.tagline}
                  onChange={(val) => handleHeroChange('tagline', val)}
                  editMode={editMode}
                  className="text-6xl md:text-8xl lg:text-9xl font-black leading-none block"
                  style={{ 
                    color: textColor, 
                    width: '100%', 
                    maxWidth: 'none',
                    minWidth: 0,
                    boxSizing: 'border-box', 
                    display: 'block', 
                    wordBreak: 'normal', 
                    overflowWrap: 'normal', 
                    whiteSpace: 'normal',
                    overflow: 'visible'
                  }}
                  placeholder="CREATIVE DESIGNER"
                />
              </h1>

              {/* Photo */}
              <div className="w-full max-w-md aspect-[4/5]">
                <div className="w-full h-full overflow-hidden">
                  <InlineImageReplace
                    src={data.hero.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"}
                    alt={data.hero.name || "Profile"}
                    onReplace={(url) => handleHeroChange('avatar', url)}
                    editMode={editMode}
                    className="w-full h-full object-cover"
                    cropWidth={800}
                    cropHeight={1000}
                  />
                </div>
              </div>

              {/* Arrow and Supporting Text */}
              <div className="flex items-start gap-8 mt-12">
                <ArrowDown className="w-12 h-12 flex-shrink-0" style={{ color: data.appearance.secondaryColor }} />
                <div className="max-w-sm">
                  <div className="text-lg font-medium uppercase tracking-wide mb-6" style={{ color: textColor }}>
                    <InlineText
                      value={data.hero.bio}
                      onChange={(val) => handleHeroChange('bio', val)}
                      editMode={editMode}
                      className="text-lg font-medium uppercase tracking-wide block"
                      style={{ color: textColor }}
                      placeholder="I SUPPORT DESIGNERS AND AGENCIES WITH CREATIVE DEVELOPMENT"
                    />
                  </div>
                  {data.modules.contact && (
                    <Button
                      className="h-12 px-6 text-base font-bold uppercase tracking-wide border-2"
                      style={{
                        backgroundColor: data.appearance.primaryColor,
                        color: '#ffffff',
                        borderColor: data.appearance.primaryColor
                      }}
                      data-cta="Get in Contact"
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      Get in Contact
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Large Name Display */}
            <div className="flex items-center justify-end">
              <h2 className="text-7xl md:text-8xl lg:text-9xl font-black leading-none text-right" style={{ color: textColor }}>
                <InlineText
                  value={data.hero.name.toUpperCase()}
                  onChange={(val) => handleHeroChange('name', val)}
                  editMode={editMode}
                  className="text-7xl md:text-8xl lg:text-9xl font-black leading-none"
                  style={{ color: textColor }}
                  placeholder="YOUR NAME"
                />
              </h2>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {data.modules.about && data.about && (
        <section id="about" className="py-24 px-6 md:px-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-black mb-16 uppercase tracking-tight" style={{ color: textColor }}>
              <InlineText
                value={data.about.heading || "ABOUT"}
                onChange={(val) => onDataChange({ about: { ...data.about, heading: val } })}
                editMode={editMode}
                className="text-5xl md:text-7xl font-black uppercase"
                style={{ color: textColor }}
                placeholder="ABOUT"
              />
            </h2>

            <div className="grid md:grid-cols-2 gap-16">
              <div>
                <div className="text-xl leading-relaxed" style={{ color: textColor, opacity: 0.9 }}>
                  <InlineText
                    value={data.about.column1 || ""}
                    onChange={(val) => onDataChange({ about: { ...data.about, column1: val } })}
                    editMode={editMode}
                    className="text-xl leading-relaxed block"
                    style={{ color: textColor }}
                    placeholder="Write about your background..."
                  />
                </div>
              </div>
              <div>
                <div className="text-xl leading-relaxed" style={{ color: textColor, opacity: 0.9 }}>
                  <InlineText
                    value={data.about.column2 || ""}
                    onChange={(val) => onDataChange({ about: { ...data.about, column2: val } })}
                    editMode={editMode}
                    className="text-xl leading-relaxed block"
                    style={{ color: textColor }}
                    placeholder="Continue your story..."
                  />
                </div>
              </div>
            </div>

            {/* Skills Tags */}
            {data.about?.tags && data.about.tags.length > 0 && (
              <div className="mt-16">
                <div className="flex flex-wrap gap-4">
                  {data.about.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="group relative px-6 py-3 text-sm font-bold tracking-widest uppercase border-2"
                      style={{ 
                        borderColor: data.appearance.secondaryColor, 
                        color: textColor,
                        backgroundColor: 'transparent'
                      }}
                    >
                      {tag}
                      {editMode && (
                        <button
                          onClick={() => {
                            const updatedTags = (data.about?.tags || []).filter((_, i) => i !== idx)
                            onDataChange({
                              about: {
                                ...data.about,
                                tags: updatedTags
                              }
                            })
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Services Section - Bold Cards */}
      {data.modules.services && (
        <section id="services" className="py-24 px-6 md:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16">
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tight" style={{ color: textColor }}>
                <InlineText
                  value={data.sectionHeaders.services || "SERVICES"}
                  onChange={(val) => handleSectionHeaderChange('services', val)}
                  editMode={editMode}
                  className="text-5xl md:text-7xl font-black uppercase"
                  style={{ color: textColor }}
                  placeholder="SERVICES"
                />
              </h2>
              {editMode && (
                ""
              )}
            </div>

            <div className="space-y-8">
              {data.services.map((service, idx) => (
                <div
                  key={service.id}
                  className="relative border-4 p-8 md:p-12 hover:translate-x-2 transition-transform duration-300"
                  style={{ borderColor: textColor }}
                >
                  {editMode && (
                    <button
                      onClick={() => handleDeleteItem('service', service.id)}
                      className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="flex items-start gap-8">
                    <div 
                      className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl font-black text-white flex-shrink-0"
                      style={{ backgroundColor: data.appearance.secondaryColor }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl md:text-4xl font-black mb-4 uppercase tracking-tight" style={{ color: data.appearance.primaryColor }}>
                        {service.title}
                      </h3>
                      <p className="text-lg mb-6 leading-relaxed" style={{ color: textColor, opacity: 0.8 }}>
                        {service.blurb}
                      </p>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <span className="text-2xl font-bold" style={{ color: textColor }}>
                          {service.priceLabel}
                        </span>
                        {service.tags && service.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {service.tags.map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className="px-3 py-1 text-xs font-bold uppercase tracking-wide border"
                                style={{ borderColor: data.appearance.secondaryColor, color: textColor, opacity: 0.7 }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Service Button in Edit Mode */}
            {editMode && (
              <div className="mt-12 text-center">
                <Button 
                  onClick={onManageServices}
                  size="lg"
                  variant="outline"
                  className="border-2 font-bold uppercase"
                  style={{ borderColor: data.appearance.secondaryColor }}
                >
                  + Add Service
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Projects Section - Large Format */}
      {data.modules.projects && (
        <section id="projects" className="py-24 px-6 md:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16">
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tight" style={{ color: textColor }}>
                <InlineText
                  value={data.sectionHeaders.projects || "WORK"}
                  onChange={(val) => handleSectionHeaderChange('projects', val)}
                  editMode={editMode}
                  className="text-5xl md:text-7xl font-black uppercase"
                  style={{ color: textColor }}
                  placeholder="WORK"
                />
              </h2>
              {editMode && (
                ""
              )}
            </div>

            <div className="space-y-24">
              {data.projects.map((project, idx) => (
                <div key={project.id} className="relative group">
                  {editMode && (
                    <button
                      onClick={() => handleDeleteItem('project', project.id)}
                      className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}

                  <div className={`grid ${idx % 2 === 0 ? 'md:grid-cols-[2fr,1fr]' : 'md:grid-cols-[1fr,2fr]'} gap-8 items-center`}>
                    {idx % 2 === 0 ? (
                      <>
                        <div className="aspect-[4/3] overflow-hidden">
                          <InlineImageReplace
                            src={project.coverImage || "https://images.unsplash.com/photo-1558769132-cb1aea3c75b5?q=80&w=800&auto=format&fit=crop"}
                            alt={project.title}
                            onReplace={(url) => {
                              const updated = data.projects.map(p =>
                                p.id === project.id ? { ...p, coverImage: url } : p
                              )
                              onDataChange({ projects: updated })
                            }}
                            editMode={editMode}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div>
                          <h3 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tight" style={{ color: data.appearance.primaryColor }}>
                            {project.title}
                          </h3>
                          <p className="text-lg mb-6 leading-relaxed" style={{ color: textColor, opacity: 0.8 }}>
                            {project.summary}
                          </p>
                          {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                              {project.tags.map((tag, tagIdx) => (
                                <span
                                  key={tagIdx}
                                  className="px-3 py-1 text-xs font-bold uppercase tracking-wide border"
                                  style={{ borderColor: data.appearance.secondaryColor, color: textColor, opacity: 0.7 }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {project.link && (
                            <a
                              href={project.link || 'https://example.com'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-6 py-3 border-2 font-bold uppercase text-sm transition-transform hover:translate-x-1 cursor-pointer"
                              style={{ borderColor: textColor, color: textColor }}
                            >
                              View Project <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <h3 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tight" style={{ color: data.appearance.primaryColor }}>
                            {project.title}
                          </h3>
                          <p className="text-lg mb-6 leading-relaxed" style={{ color: textColor, opacity: 0.8 }}>
                            {project.summary}
                          </p>
                          {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                              {project.tags.map((tag, tagIdx) => (
                                <span
                                  key={tagIdx}
                                  className="px-3 py-1 text-xs font-bold uppercase tracking-wide border"
                                  style={{ borderColor: data.appearance.secondaryColor, color: textColor, opacity: 0.7 }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {project.link && (
                            <a
                              href={project.link || 'https://example.com'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-6 py-3 border-2 font-bold uppercase text-sm transition-transform hover:translate-x-1 cursor-pointer"
                              style={{ borderColor: textColor, color: textColor }}
                            >
                              View Project <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <div className="aspect-[4/3]">
                          <div className="w-full h-full overflow-hidden">
                            <InlineImageReplace
                              src={project.coverImage || "https://images.unsplash.com/photo-1558769132-cb1aea3c75b5?q=80&w=800&auto=format&fit=crop"}
                              alt={project.title}
                              onReplace={(url) => {
                                const updated = data.projects.map(p =>
                                  p.id === project.id ? { ...p, coverImage: url } : p
                                )
                                onDataChange({ projects: updated })
                              }}
                              editMode={editMode}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Project Button in Edit Mode */}
            {editMode && (
              <div className="mt-16 text-center">
                <Button 
                  onClick={onManageProjects}
                  size="lg"
                  variant="outline"
                  className="border-2 font-bold uppercase"
                  style={{ borderColor: data.appearance.secondaryColor }}
                >
                  + Add Project
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Testimonials Section - Bold Editorial Design */}
      {data.modules.testimonials && (
        <section id="testimonials" className="py-24 px-6 md:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16">
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tight" style={{ color: textColor }}>
                <InlineText
                  value={data.sectionHeaders.testimonials || "TESTIMONIALS"}
                  onChange={(val) => handleSectionHeaderChange('testimonials', val)}
                  editMode={editMode}
                  className="text-5xl md:text-7xl font-black uppercase"
                  style={{ color: textColor }}
                  placeholder="TESTIMONIALS"
                />
              </h2>
              {editMode && (
                ""
              )}
            </div>

            <div className="space-y-12">
              {data.testimonials.map((testimonial, idx) => (
                <div
                  key={testimonial.id}
                  className="relative border-4 p-8 md:p-12 group hover:translate-x-2 transition-transform duration-300"
                  style={{ borderColor: data.appearance.secondaryColor }}
                >
                  {editMode && (
                    <button
                      onClick={() => handleDeleteItem('testimonial', testimonial.id)}
                      className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="flex items-start gap-8">
                    {/* Large Quote Number */}
                    <div 
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl font-black text-white flex-shrink-0"
                      style={{ backgroundColor: data.appearance.secondaryColor }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      {/* Quote */}
                      <p className="text-2xl md:text-3xl font-bold mb-8 leading-relaxed" style={{ color: textColor }}>
                        "{testimonial.quote}"
                      </p>
                      {/* Author Info */}
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-1 h-16" 
                          style={{ backgroundColor: data.appearance.primaryColor }}
                        />
                        <div>
                          <p className="text-xl font-black uppercase tracking-wide" style={{ color: data.appearance.primaryColor }}>
                            {testimonial.author}
                          </p>
                          <p className="text-sm font-medium uppercase tracking-wider" style={{ color: textColor, opacity: 0.6 }}>
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Testimonial Button in Edit Mode */}
            {editMode && (
              <div className="mt-8 text-center">
                <Button 
                  onClick={onManageTestimonials}
                  size="lg"
                  variant="outline"
                  className="border-2 font-bold uppercase"
                  style={{ borderColor: data.appearance.secondaryColor }}
                >
                  + Add Testimonial
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Contact Section */}
      {data.modules.contact && (
        <section id="contact" className="py-24 px-6 md:px-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-black mb-16 uppercase tracking-tight" style={{ color: textColor }}>
              <InlineText
                value={data.contact.title}
                onChange={(val) => handleContactChange('title', val)}
                editMode={editMode}
                className="text-5xl md:text-7xl font-black uppercase"
                style={{ color: textColor }}
                placeholder="LET'S CONNECT"
              />
            </h2>

            <div className="grid md:grid-cols-2 gap-16">
              {/* Contact Info */}
              <div>
                <div className="text-xl mb-12 leading-relaxed" style={{ color: textColor, opacity: 0.8 }}>
                  <InlineText
                    value={data.contact.note}
                    onChange={(val) => handleContactChange('note', val)}
                    editMode={editMode}
                    className="text-xl leading-relaxed block"
                    style={{ color: textColor }}
                    placeholder="Get in touch for collaborations..."
                  />
                </div>

                <div className="space-y-6">
                  {data.contactItems.map((item) => {
                    const IconComponent = iconComponents[item.icon as keyof typeof iconComponents] || iconComponents.Mail
                    return (
                      <div key={item.id} className="flex items-start gap-4">
                        <div
                          className="mt-1 cursor-pointer"
                          onClick={() => handleIconClick(item.id)}
                        >
                          <IconComponent className="w-6 h-6" style={{ color: data.appearance.primaryColor }} />
                        </div>
                        <div>
                          <div className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: textColor, opacity: 0.6 }}>
                            <InlineText
                              value={item.label}
                              onChange={(val) => handleContactItemChange(item.id, 'label', val)}
                              editMode={editMode}
                              className="text-sm font-bold uppercase tracking-wide"
                              style={{ color: textColor, opacity: 0.6 }}
                              placeholder="Label"
                            />
                          </div>
                          <div className="text-lg font-medium" style={{ color: textColor }}>
                            <InlineText
                              value={item.value}
                              onChange={(val) => handleContactItemChange(item.id, 'value', val)}
                              editMode={editMode}
                              className="text-lg font-medium"
                              style={{ color: textColor }}
                              placeholder="Value"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <form id="contact-form" data-form-type="contact" onSubmit={handleContactSubmit} className="space-y-6">
                  <Input
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-14 text-lg border-2"
                    style={{ borderColor: textColor, backgroundColor: 'transparent', color: textColor }}
                  />
                  <Input
                    type="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-14 text-lg border-2"
                    style={{ borderColor: textColor, backgroundColor: 'transparent', color: textColor }}
                  />
                  <Textarea
                    placeholder="Your Message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={6}
                    className="text-lg border-2 resize-none"
                    style={{ borderColor: textColor, backgroundColor: 'transparent', color: textColor }}
                  />
                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-14 text-lg font-bold uppercase tracking-wide border-2 hover:translate-x-1 transition-transform"
                      style={{
                        backgroundColor: data.appearance.primaryColor,
                        color: '#ffffff',
                        borderColor: data.appearance.primaryColor
                      }}
                    >
                      {isSubmitting ? "Sending..." : data.contact.ctaLabel || "Send Message"}
                      <Send className="w-5 h-5 ml-2" />
                    </Button>
                    {data.behavior.showBookMeetingButton !== false && (
                      <Button
                        type="button"
                        className="flex-1 h-14 text-lg font-bold uppercase tracking-wide border-2 hover:translate-x-1 transition-transform"
                        style={{
                          backgroundColor: 'transparent',
                          color: data.appearance.primaryColor,
                          borderColor: data.appearance.primaryColor
                        }}
                        data-cta="Book Meeting"
                        onClick={() => window.open('/book-meeting', '_blank')}
                      >
                        Book Meeting
                        <Calendar className="w-5 h-5 ml-2" />
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
        <footer className="py-12 px-8 md:px-16 border-t-2 border-black" style={{ backgroundColor }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-sm uppercase tracking-wider font-bold" style={{ color: textColor }}>
                © {new Date().getFullYear()} {' '}
                <InlineText
                  value={data.footer?.companyName || data.hero.name || "Company"}
                  onChange={(val) => onDataChange({ footer: { ...data.footer, companyName: val } })}
                  editMode={editMode}
                  className="text-sm inline uppercase tracking-wider font-bold"
                  style={{ color: textColor }}
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
                        className="w-10 h-10 flex items-center justify-center transition-all hover:scale-110 border-2 border-black"
                        style={{ color: textColor }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                      {editMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingSocialLinkId(social.id)
                          }}
                          className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600"
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
                    className="w-10 h-10 border-2 border-black bg-black text-white"
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
        onSelect={handleIconSelect}
        onClose={() => {
          setShowIconPicker(false)
          setEditingContactItemId("")
        }}
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


"use client"

import { PortfolioData } from "../types"
import { InlineText } from "./InlineText"
import { InlineImageReplace } from "./InlineImageReplace"
import { iconComponents } from "./IconPicker"
import { IconPicker } from "./IconPicker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ExternalLink, Trash2, Edit2, Send } from "lucide-react"
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

export function MinimalistTemplate({
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
  const backgroundColor = data.appearance.backgroundColor || '#f5f5f0'
  const textColor = data.appearance.textColor || '#1f2937'

  const handleHeroChange = (field: string, value: string) => {
    console.log('🟣 MinimalistTemplate handleHeroChange:', field, 'value length:', value?.length || 0)
    onDataChange({ hero: { ...data.hero, [field]: value } })
  }

  const handleContactChange = (field: string, value: string) => {
    onDataChange({ contact: { ...data.contact, [field]: value } })
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
        const updated = data.services.filter(s => s.id !== id)
        onDataChange({ services: updated })
      } else if (type === 'project') {
        const updated = data.projects.filter(p => p.id !== id)
        onDataChange({ projects: updated })
      } else if (type === 'testimonial') {
        const updated = data.testimonials.filter(t => t.id !== id)
        onDataChange({ testimonials: updated })
      }
    }
  }

  return (
    <div className="min-h-screen" style={{ fontFamily, backgroundColor }}>
      {/* Header Navigation */}
      <header>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            {!data.branding.hideLogo && (
              <a href="#hero" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={(e) => { e.preventDefault(); document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }) }}>
                {data.branding.logo ? (
                  <img src={data.branding.logo} alt="Logo" className="h-8 w-auto" />
                ) : (
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: data.appearance.primaryColor || '#000' }}
                  >
                    {data.branding.logoText?.charAt(0) || data.hero.name?.charAt(0) || "L"}
                  </div>
                )}
                {data.branding.logoText && (
                  <span className="text-lg font-semibold" style={{ color: textColor }}>
                    {data.branding.logoText}
                  </span>
                )}
              </a>
            )}

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm">
              {data.modules.about && (
                <a href="#about" className="transition-colors hover:opacity-70" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  About
                </a>
              )}
              {data.modules.services && (
                <a href="#services" className="transition-colors hover:opacity-70" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  Services
                </a>
              )}
              {data.modules.projects && (
                <a href="#work" className="transition-colors hover:opacity-70" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  Work
                </a>
              )}
              {data.modules.testimonials && (
                <a href="#testimonials" className="transition-colors hover:opacity-70" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  Testimonials
                </a>
              )}
              {data.modules.contact && (
                <a href="#contact" className="transition-colors hover:opacity-70" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  Contact
                </a>
              )}
            </nav>

            {/* CTA Button */}
            {data.modules.projects && (
              <Button 
                className="text-white text-sm px-6"
                style={{ backgroundColor: data.appearance.primaryColor || '#000' }}
                onClick={(e) => { e.preventDefault(); document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }) }}
              >
                View Work
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {data.modules.hero && (
        <section id="hero" className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left: Image */}
            <div className="order-2 md:order-1">
              <InlineImageReplace
                src={data.hero.avatar || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=600&fit=crop"}
                alt={data.hero.name || "Profile"}
                className="w-full aspect-[3/4] object-cover rounded-2xl"
                onReplace={(newSrc) => handleHeroChange('avatar', newSrc)}
                editMode={editMode}
                cropWidth={800}
                cropHeight={1066}
              />
            </div>

            {/* Right: Content */}
            <div className="order-1 md:order-2">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ color: '#000' }}>
                <InlineText
                  value={data.hero.tagline}
                  onChange={(val) => handleHeroChange('tagline', val)}
                  editMode={editMode}
                  className="text-4xl md:text-5xl font-bold"
                  style={{ color: '#000' }}
                  placeholder="Hi there!"
                />
              </h1>
              <p className="text-base leading-relaxed mb-8" style={{ color: textColor }}>
                <InlineText
                  value={data.hero.bio}
                  onChange={(val) => handleHeroChange('bio', val)}
                  editMode={editMode}
                  className="text-base"
                  style={{ color: textColor }}
                  placeholder="Fuelled by a passion for designing compelling products..."
                />
              </p>
            </div>
          </div>
        </section>
      )}

      {/* About / Career Section */}
      {data.modules.about && (
        <section id="about" className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16">
              {/* Left: Heading */}
              <div>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: '#000' }}>
                  <InlineText
                    value={data.about?.heading || "My Career So Far"}
                    onChange={(val) => onDataChange({ about: { ...data.about, heading: val } })}
                    editMode={editMode}
                    className="text-3xl md:text-4xl font-bold"
                    style={{ color: '#000' }}
                    placeholder="My Career So Far"
                  />
                </h2>
              </div>

              {/* Right: Content */}
              <div className="space-y-6">
                <p className="leading-relaxed" style={{ color: textColor }}>
                  <InlineText
                    value={data.about?.column1 || "Always up for a challenge, I have worked for lean start-ups and was a member of the first New Zealand start-up to attend Y Combinator."}
                    onChange={(val) => onDataChange({ about: { ...data.about, column1: val } })}
                    editMode={editMode}
                    style={{ color: textColor }}
                    placeholder="Your career story..."
                  />
                </p>
                <p className="leading-relaxed" style={{ color: textColor }}>
                  <InlineText
                    value={data.about?.column2 || "Currently, I lead UI/UX design at SaaS start-up."}
                    onChange={(val) => onDataChange({ about: { ...data.about, column2: val } })}
                    editMode={editMode}
                    style={{ color: textColor }}
                    placeholder="Current role..."
                  />
                </p>

                {/* Skills Tags */}
                {data.about?.tags && data.about.tags.length > 0 && (
                  <div className="pt-6">
                    <div className="flex flex-wrap gap-2">
                      {data.about.tags.map((tag, idx) => (
                        <span 
                          key={idx}
                          className="group relative px-3 py-1.5 text-xs font-medium tracking-wide uppercase cursor-default"
                          style={{ border: '1px solid rgba(0,0,0,0.15)', color: textColor }}
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
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
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
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      {data.modules.services && (
        <section id="services" className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#000' }}>
                <InlineText
                  value={data.sectionHeaders?.services || "What I Do"}
                  onChange={(val) => handleSectionHeaderChange('services', val)}
                  editMode={editMode}
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: '#000' }}
                  placeholder="What I Do"
                />
              </h2>
            </div>

            {data.services.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-4">No services added yet</p>
                {editMode && (
                  <Button 
                    variant="default"
                    onClick={onManageServices}
                  >
                    ➕ Add Your First Service
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                {data.services.map((service) => (
                  <div key={service.id} className="group relative p-6 hover:shadow-md transition-shadow" style={{ border: '1px solid rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.3)' }}>
                    {editMode && (
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#000' }}>{service.title}</h3>
                    <p className="mb-4 text-sm leading-relaxed" style={{ color: textColor }}>{service.blurb}</p>
                    <p className="text-sm font-bold" style={{ color: data.appearance.primaryColor || '#000' }}>
                      {service.priceLabel}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {editMode && data.services.length > 0 && (
              <div className="mt-8 text-center">
                <Button 
                  onClick={onManageServices}
                  size="lg"
                  variant="outline"
                  className="border-2 font-bold uppercase"
                  style={{ borderColor: data.appearance.primaryColor, color: data.appearance.primaryColor }}
                >
                  + Add Service
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Projects Section */}
      {data.modules.projects && (
        <section id="work" className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#000' }}>
                <InlineText
                  value={data.sectionHeaders?.projects || "Selected Work"}
                  onChange={(val) => handleSectionHeaderChange('projects', val)}
                  editMode={editMode}
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: '#000' }}
                  placeholder="Selected Work"
                />
              </h2>
            </div>

            {data.projects.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-4">No projects added yet</p>
                {editMode && (
                  <Button 
                    variant="default"
                    onClick={onManageProjects}
                  >
                    ➕ Add Your First Project
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {data.projects.map((project) => (
                  <div key={project.id} className="group relative hover:shadow-lg transition-shadow" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
                    {editMode && (
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
                    <div className="overflow-hidden">
                      <InlineImageReplace
                        src={project.coverImage || "https://images.unsplash.com/photo-1558769132-cb1aea3c75b5?q=80&w=800&auto=format&fit=crop"}
                        alt={project.title}
                        className="w-full h-64 object-cover"
                        onReplace={(newSrc) => {
                        const updated = data.projects.map(p =>
                          p.id === project.id ? { ...p, coverImage: newSrc } : p
                        )
                          onDataChange({ projects: updated })
                        }}
                        editMode={editMode}
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-2xl font-bold mb-3" style={{ color: '#000' }}>{project.title}</h3>
                      <p className="mb-4 leading-relaxed" style={{ color: textColor }}>{project.summary}</p>
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.tags.map((tag, i) => (
                            <span key={i} className="text-xs px-3 py-1" style={{ border: '1px solid rgba(0,0,0,0.15)', color: textColor }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {project.link && (
                        <Button 
                          variant="link"
                          asChild
                          className="p-0 h-auto font-semibold"
                          style={{ color: data.appearance.primaryColor || '#000' }}
                        >
                          <a href={project.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                            View Project
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {editMode && data.projects.length > 0 && (
              <div className="mt-8 text-center">
                <Button 
                  onClick={onManageProjects}
                  size="lg"
                  variant="outline"
                  className="border-2 font-bold uppercase"
                  style={{ borderColor: data.appearance.primaryColor, color: data.appearance.primaryColor }}
                >
                  + Add Project
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {data.modules.testimonials && (
        <section id="testimonials" className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#000' }}>
                <InlineText
                  value={data.sectionHeaders?.testimonials || "What Clients Say"}
                  onChange={(val) => handleSectionHeaderChange('testimonials', val)}
                  editMode={editMode}
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: '#000' }}
                  placeholder="What Clients Say"
                />
              </h2>
            </div>

            {data.testimonials.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-4">No testimonials added yet</p>
                {editMode && (
                  <Button 
                    variant="default"
                    onClick={onManageTestimonials}
                  >
                    ➕ Add Your First Testimonial
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-12">
                {data.testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="relative group border-l-4 pl-6" style={{ borderColor: data.appearance.primaryColor || '#000' }}>
                    {editMode && (
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDeleteItem('testimonial', testimonial.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <p className="text-lg mb-6 leading-relaxed italic" style={{ color: textColor }}>
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <p className="font-bold" style={{ color: '#000' }}>{testimonial.author}</p>
                      <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>{testimonial.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {editMode && data.testimonials.length > 0 && (
              <div className="mt-8 text-center">
                <Button 
                  onClick={onManageTestimonials}
                  size="lg"
                  variant="outline"
                  className="border-2 font-bold uppercase"
                  style={{ borderColor: data.appearance.primaryColor, color: data.appearance.primaryColor }}
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
        <section id="contact" className="py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#000' }}>
                <InlineText
                  value={data.contact.title}
                  onChange={(val) => handleContactChange('title', val)}
                  editMode={editMode}
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: '#000' }}
                  placeholder="Get In Touch"
                />
              </h2>
              <p style={{ color: textColor }}>
                <InlineText
                  value={data.contact.note}
                  onChange={(val) => handleContactChange('note', val)}
                  editMode={editMode}
                  style={{ color: textColor }}
                  placeholder="Let's work together on your next project"
                />
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-6">
                {data.contactItems.map((item) => {
                  const IconComponent = iconComponents[item.icon as keyof typeof iconComponents]
                  return (
                    <div 
                      key={item.id}
                      className="flex items-start gap-4 group"
                    >
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${editMode ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
                        style={{ backgroundColor: data.appearance.primaryColor || '#000' }}
                        onClick={() => handleIconClick(item.id)}
                        title={editMode ? "Click to change icon" : ""}
                      >
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1" style={{ color: textColor, opacity: 0.6 }}>{item.label}</p>
                        <p style={{ color: '#000' }}>{item.value}</p>
                      </div>
                      {editMode && (
                        <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Contact Form */}
              <div>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your Name"
                      required
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Your Email"
                      required
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Your Message"
                      required
                      rows={5}
                      className="resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-white"
                    style={{ backgroundColor: data.appearance.primaryColor || '#000' }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      {data.modules.footer && (
        <footer className="py-12 px-8 md:px-16 border-t border-gray-200" style={{ backgroundColor }}>
          <div className="max-w-7xl mx-auto">
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


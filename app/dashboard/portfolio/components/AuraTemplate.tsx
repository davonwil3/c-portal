"use client"

import { PortfolioData } from "../types"
import { InlineText } from "./InlineText"
import { InlineImageReplace } from "./InlineImageReplace"
import { iconComponents } from "./IconPicker"
import { IconPicker } from "./IconPicker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, Mail, Phone, MapPin, Send, ExternalLink, Trash2, Edit2, X, RotateCcw, Calendar } from "lucide-react"
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

export function AuraTemplate({
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
  const [isHoveringPrefix, setIsHoveringPrefix] = useState(false)
  const [addingNewSocialLink, setAddingNewSocialLink] = useState(false)

  const fontFamily = fontFamilyMap[data.appearance.fontFamily] || fontFamilyMap.system
  const textColor = data.appearance.textColor || '#1f2937'
  const backgroundColor = data.appearance.backgroundColor || '#ffffff'

  const handleHeroChange = (field: string, value: string) => {
    console.log('🔵 AuraTemplate handleHeroChange:', field, 'value length:', value?.length || 0)
    onDataChange({ hero: { ...data.hero, [field]: value } })
    console.log('🔵 AuraTemplate onDataChange called')
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

  const handleDeletePrefix = () => {
    handleHeroChange('prefix', '')
  }

  const handleRestorePrefix = () => {
    handleHeroChange('prefix', 'About me,')
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
    <div className="bg-white min-h-screen relative" style={{ fontFamily }}>
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-8 md:px-16 lg:px-24 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            {!data.branding.hideLogo && (
              <a href="#hero" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={(e) => { e.preventDefault(); document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }) }}>
                {data.branding.logo ? (
                  <img src={data.branding.logo} alt="Logo" className="h-10 md:h-12 w-auto" />
                ) : (
                  <div 
                    className="h-10 md:h-12 px-4 md:px-6 rounded-full flex items-center justify-center font-bold text-white shadow-lg text-sm"
                    style={{ backgroundColor: data.appearance.primaryColor }}
                  >
                    {data.branding.logoText || "LOGO"}
                  </div>
                )}
                {data.branding.logoText && data.branding.logo && (
                  <span className="text-xl font-bold" style={{ color: data.appearance.primaryColor }}>
                    {data.branding.logoText}
                  </span>
                )}
              </a>
            )}

            {/* Navigation Links */}
            <div className="flex items-center gap-6 md:gap-8">
              {data.modules.about && (
                <a href="#about" className="text-sm md:text-base font-medium hover:opacity-70 transition-opacity" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }}>About</a>
              )}
              {data.modules.services && (
                <a href="#services" className="text-sm md:text-base font-medium hover:opacity-70 transition-opacity" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) }}>Services</a>
              )}
              {data.modules.projects && (
                <a href="#projects" className="text-sm md:text-base font-medium hover:opacity-70 transition-opacity" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }) }}>Projects</a>
              )}
              {data.modules.testimonials && (
                <a href="#testimonials" className="text-sm md:text-base font-medium hover:opacity-70 transition-opacity" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }) }}>Testimonials</a>
              )}
              {data.modules.contact && (
                <a href="#contact" className="text-sm md:text-base font-medium hover:opacity-70 transition-opacity" style={{ color: textColor }} onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}>Contact</a>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {data.modules.hero && (
        <section id="hero" className="container mx-auto px-8 md:px-16 lg:px-24 py-20">
          <div className="mb-16 pt-16">
            <div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-8">
                <div 
                  className="relative inline-block mb-2"
                  onMouseEnter={() => setIsHoveringPrefix(true)}
                  onMouseLeave={() => setIsHoveringPrefix(false)}
                >
                  {data.hero.prefix && data.hero.prefix.trim() !== '' ? (
                    <>
                      <span className="text-5xl md:text-7xl lg:text-8xl font-bold" style={{ color: data.appearance.secondaryColor || '#9CA3AF' }}>
                        <InlineText
                          value={data.hero.prefix}
                          onChange={(val) => handleHeroChange('prefix', val)}
                          editMode={editMode}
                          style={{ color: data.appearance.secondaryColor || '#9CA3AF' }}
                          placeholder="About me,"
                        />
                      </span>
                      {editMode && isHoveringPrefix && (
                        <button
                          onClick={handleDeletePrefix}
                          className="absolute -top-2 -right-6 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-all shadow-lg z-10"
                          title="Delete special headline"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : editMode ? (
                    <button
                      onClick={handleRestorePrefix}
                      className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full transition-all text-gray-600"
                      title="Restore special headline"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
                {data.hero.prefix && data.hero.prefix.trim() !== '' && <br />}
                <InlineText
                  value={data.hero.tagline}
                  onChange={(val) => handleHeroChange('tagline', val)}
                  editMode={editMode}
                  className="text-black block"
                  placeholder="a Visual Designer living in Munich"
                />
              </h1>
              <div className="text-xl md:text-2xl max-w-4xl mb-8" style={{ color: textColor, marginLeft: 0, paddingLeft: 0 }}>
                <InlineText
                  value={data.hero.bio}
                  onChange={(val) => handleHeroChange('bio', val)}
                  editMode={editMode}
                  className="text-xl md:text-2xl block"
                  style={{ color: textColor }}
                  placeholder="As a Senior Designer with over 10 years of experience..."
                />
              </div>
            </div>
            {data.modules.contact && (
              <Button
                size="lg"
                className="h-14 px-8 text-base font-semibold"
                style={{ backgroundColor: data.appearance.primaryColor }}
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

          <div className="mb-20">
            <InlineImageReplace
              src={data.hero.avatar || "/uiuxdesigner.jpg"}
              alt={data.hero.name || "Profile"}
              className="w-full h-[600px] object-cover rounded-3xl"
              onReplace={(newSrc) => handleHeroChange('avatar', newSrc)}
              editMode={editMode}
              cropWidth={1200}
              cropHeight={600}
            />
          </div>
        </section>
      )}

      {/* About Me Section */}
      {data.modules.about && (
        <section id="about" className="container mx-auto px-8 md:px-16 lg:px-24 py-16">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
              <InlineText
                value={data.about?.heading || "I'm the UI/UX and brand designer you need to take your digital presence to the next level"}
                onChange={(val) => onDataChange({ about: { ...data.about, heading: val } })}
                editMode={editMode}
                className="text-black block"
                placeholder="Your value proposition..."
              />
              <span 
                className="inline-block w-20 h-2 rounded-full mt-4"
                style={{ backgroundColor: data.appearance.primaryColor }}
              />
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 text-lg leading-relaxed" style={{ color: textColor }}>
            <div>
              <InlineText
                value={data.about?.column1 || "With a collaborative mindset and a dedication to their craft, I work closely with clients to understand their goals and objectives, providing tailored design solutions that meet their unique needs and exceed their expectations."}
                onChange={(val) => onDataChange({ about: { ...data.about, column1: val } })}
                editMode={editMode}
                className="text-lg leading-relaxed block"
                style={{ color: textColor }}
                placeholder="First column content..."
              />
            </div>
            <div>
              <InlineText
                value={data.about?.column2 || "Outside of work, you can find me exploring the latest design trends, attending design conferences, or working on personal projects that allow me to experiment with new techniques and technologies."}
                onChange={(val) => onDataChange({ about: { ...data.about, column2: val } })}
                editMode={editMode}
                className="text-lg leading-relaxed block"
                style={{ color: textColor }}
                placeholder="Second column content..."
              />
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      {data.modules.services && (
        <section id="services" className="py-24">
          <div className="container mx-auto px-8 md:px-16 lg:px-24">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <InlineText
                value={data.sectionHeaders?.services || "What I Do"}
                onChange={(val) => handleSectionHeaderChange('services', val)}
                editMode={editMode}
                className="text-4xl md:text-5xl font-bold"
                placeholder="What I Do"
              />
            </h2>
            <div 
              className="w-20 h-1 rounded-full mb-16"
              style={{ backgroundColor: data.appearance.primaryColor }}
            />
            {data.services.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                <p className="text-gray-500 mb-4 text-lg">No services added yet</p>
                {editMode && (
                  <Button 
                    variant="default" 
                    size="lg"
                    onClick={onManageServices}
                    className="shadow-lg"
                  >
                    ➕ Add Your First Service
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {data.services.map((service, idx) => (
                  <div 
                    key={service.id} 
                    className="group relative rounded-3xl p-10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
                    style={{ 
                      background: idx % 2 === 0 
                        ? `linear-gradient(135deg, ${data.appearance.primaryColor}15, ${data.appearance.secondaryColor}15)` 
                        : `linear-gradient(135deg, ${data.appearance.secondaryColor}15, ${data.appearance.primaryColor}15)`,
                      border: `2px solid ${data.appearance.primaryColor}30`
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
                    
                    {/* Big Number Badge */}
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg mb-6"
                      style={{ backgroundColor: data.appearance.primaryColor }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </div>

                    <div>
                      <h3 className="text-3xl md:text-4xl font-black mb-4">
                        <span style={{ color: data.appearance.primaryColor }}>{service.title}</span>
                      </h3>
                      <p className="text-lg mb-6 leading-relaxed" style={{ color: textColor }}>{service.blurb}</p>
                      
                      {service.tags && service.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {service.tags.map((tag, tagIdx) => (
                            <span 
                              key={tagIdx} 
                              className="text-xs px-4 py-2 rounded-full font-semibold"
                              style={{ 
                                backgroundColor: `${data.appearance.primaryColor}20`,
                                color: data.appearance.primaryColor
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t-2" style={{ borderColor: `${data.appearance.primaryColor}20` }}>
                        <span className="text-2xl font-bold" style={{ color: data.appearance.primaryColor }}>
                          {service.priceLabel}
                        </span>
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
        <section id="projects" className="py-24">
          <div className="container mx-auto px-8 md:px-16 lg:px-24">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <InlineText
                value={data.sectionHeaders?.projects || "Selected Work"}
                onChange={(val) => handleSectionHeaderChange('projects', val)}
                editMode={editMode}
                className="text-4xl md:text-5xl font-bold"
                placeholder="Selected Work"
              />
            </h2>
            <div 
              className="w-20 h-1 rounded-full mb-16"
              style={{ backgroundColor: data.appearance.primaryColor }}
            />
            {data.projects.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-4 text-lg">No projects added yet</p>
                {editMode && (
                  <Button 
                    variant="default" 
                    size="lg"
                    onClick={onManageProjects}
                    className="shadow-lg"
                  >
                    ➕ Add Your First Project
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-24">
                {data.projects.map((project, idx) => (
                  <div key={project.id} className={`grid md:grid-cols-2 gap-12 items-center ${idx % 2 === 1 ? 'md:grid-flow-dense' : ''} relative group`}>
                    {editMode && (
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
                    <div className={idx % 2 === 1 ? 'md:col-start-2' : ''}>
                      <InlineImageReplace
                        src={project.coverImage || "https://images.unsplash.com/photo-1558769132-cb1aea3c75b5?q=80&w=800&auto=format&fit=crop"}
                        alt={project.title}
                        className="w-full h-[400px] object-cover rounded-2xl"
                        onReplace={(newSrc) => {
                          const updated = data.projects.map(p =>
                            p.id === project.id ? { ...p, coverImage: newSrc } : p
                          )
                          onDataChange({ projects: updated })
                        }}
                        editMode={editMode}
                      />
                    </div>
                    <div className={idx % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''}>
                      <h3 className="text-3xl font-bold mb-4">
                        <span style={{ color: data.appearance.primaryColor }}>{project.title}</span>
                      </h3>
                      <p className="text-lg mb-6 leading-relaxed" style={{ color: textColor }}>{project.summary}</p>
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {project.tags.map((tag, i) => (
                            <span key={i} className="text-sm px-3 py-1 bg-gray-100 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {project.link && (
                        <Button 
                          variant="outline" 
                          size="lg" 
                          asChild
                          className="group"
                          style={{ 
                            borderColor: data.appearance.primaryColor,
                            color: data.appearance.primaryColor
                          }}
                        >
                          <a href={project.link || 'https://example.com'} target="_blank" rel="noopener noreferrer">
                            View Project
                            <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {editMode && data.projects.length > 0 && (
              <div className="mt-12 text-center">
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
        <section 
          id="testimonials"
          className="text-white py-24" 
          style={{ backgroundColor: data.appearance.primaryColor }}
        >
          <div className="container mx-auto px-8 md:px-16 lg:px-24">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <InlineText
                value={data.sectionHeaders?.testimonials || "Client Testimonials"}
                onChange={(val) => handleSectionHeaderChange('testimonials', val)}
                editMode={editMode}
                className="text-4xl md:text-5xl font-bold text-white"
                placeholder="Client Testimonials"
              />
            </h2>
            <div className="w-20 h-1 rounded-full mb-16 bg-white opacity-50" />
            {data.testimonials.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-white border-opacity-30 rounded-lg">
                <p className="text-white opacity-80 mb-4 text-lg">No testimonials added yet</p>
                {editMode && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={onManageTestimonials} 
                    className="border-2 border-white text-white hover:bg-white hover:text-black shadow-lg"
                  >
                    ➕ Add Your First Testimonial
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-12">
                {data.testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="space-y-6 relative group">
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
                    <p className="text-xl md:text-2xl leading-relaxed italic text-white">
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <p className="font-bold text-lg text-white">{testimonial.author}</p>
                      <p className="text-white opacity-70">{testimonial.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {editMode && data.testimonials.length > 0 && (
              <div className="mt-12 text-center">
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
        <section id="contact" className="py-24">
          <div className="container mx-auto px-8 md:px-16 lg:px-24">
            <div className="grid md:grid-cols-2 gap-16">
              <div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  <InlineText
                    value={data.contact.title}
                    onChange={(val) => handleContactChange('title', val)}
                    editMode={editMode}
                    className="text-black"
                    placeholder="Let's Work Together"
                  />
                </h2>
                <div className="text-xl mb-12 leading-relaxed" style={{ color: textColor }}>
                  <InlineText
                    value={data.contact.note}
                    onChange={(val) => handleContactChange('note', val)}
                    editMode={editMode}
                    className="text-xl block"
                    style={{ color: textColor }}
                    placeholder="Ready to start your next project?"
                  />
                </div>

                <div className="space-y-6">
                  {data.contactItems.map((item) => {
                    const IconComponent = iconComponents[item.icon as keyof typeof iconComponents] || Mail
                    return (
                      <div 
                        key={item.id}
                        className="flex items-center gap-4 group"
                      >
                        <div 
                          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all group-hover:scale-110 bg-gray-100 ${editMode ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
                          onClick={() => handleIconClick(item.id)}
                          title={editMode ? "Click to change icon" : ""}
                        >
                          <IconComponent className="w-6 h-6" style={{ color: data.appearance.primaryColor }} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-500">
                            <InlineText
                              value={item.label}
                              onChange={(val) => handleContactItemChange(item.id, 'label', val)}
                              editMode={editMode}
                              className="text-sm text-gray-500"
                              placeholder="Label"
                            />
                          </div>
                          <div className="text-lg font-medium">
                            <InlineText
                              value={item.value}
                              onChange={(val) => handleContactItemChange(item.id, 'value', val)}
                              editMode={editMode}
                              className="text-lg font-medium"
                              placeholder="Value"
                            />
                          </div>
                        </div>
                        {editMode && (
                          <Edit2 className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <form id="contact-form" data-form-type="contact" onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      required
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell me about your project..."
                      required
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="flex-1 h-12 text-base"
                      style={{ backgroundColor: data.appearance.primaryColor }}
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
                    {data.behavior.showBookMeetingButton !== false && (
                      <Button 
                        type="button"
                        size="lg" 
                        variant="outline"
                        className="flex-1 h-12 text-base"
                        style={{ borderColor: data.appearance.primaryColor, color: data.appearance.primaryColor }}
                        data-cta="Book a Meeting"
                        onClick={() => window.open('/book-meeting', '_blank')}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
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
          <div className="max-w-[1200px] mx-auto">
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

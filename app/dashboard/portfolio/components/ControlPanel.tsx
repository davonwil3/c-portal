"use client"

import { PortfolioData, Service, Project, Testimonial, ContactItem } from "../types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Edit2, GripVertical, Eye, EyeOff, Upload } from "lucide-react"

interface ControlPanelProps {
  data: PortfolioData
  onDataChange: (data: Partial<PortfolioData>) => void
  onOpenServiceModal: () => void
  onOpenProjectModal: () => void
  onOpenTestimonialModal: () => void
  onOpenContactModal: () => void
  onEditService: (service: Service) => void
  onDeleteService: (id: string) => void
  onEditProject: (project: Project) => void
  onDeleteProject: (id: string) => void
  onEditTestimonial: (testimonial: Testimonial) => void
  onDeleteTestimonial: (id: string) => void
  onEditContactItem: (item: ContactItem) => void
  onDeleteContactItem: (id: string) => void
}

export function ControlPanel({
  data,
  onDataChange,
  onOpenServiceModal,
  onOpenProjectModal,
  onOpenTestimonialModal,
  onOpenContactModal,
  onEditService,
  onDeleteService,
  onEditProject,
  onDeleteProject,
  onEditTestimonial,
  onDeleteTestimonial,
  onEditContactItem,
  onDeleteContactItem
}: ControlPanelProps) {
  const handleAppearanceChange = (field: string, value: any) => {
    onDataChange({
      appearance: { ...data.appearance, [field]: value }
    })
  }

  const handleModuleToggle = (module: keyof typeof data.modules) => {
    onDataChange({
      modules: { ...data.modules, [module]: !data.modules[module] }
    })
  }

  const handleBehaviorChange = (field: string, value: any) => {
    onDataChange({
      behavior: { ...data.behavior, [field]: value }
    })
  }

  const handleSeoChange = (field: string, value: string) => {
    onDataChange({
      seo: { ...data.seo, [field]: value }
    })
  }

  const handleImageUpload = (field: string, file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (field.startsWith('branding.')) {
        const brandingField = field.split('.')[1]
        onDataChange({
          branding: { ...data.branding, [brandingField]: reader.result as string }
        })
      } else {
        onDataChange({
          seo: { ...data.seo, [field]: reader.result as string }
        })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="p-6">
      <Accordion type="multiple" defaultValue={["appearance", "modules"]} className="space-y-2">
        {/* Appearance */}
        <AccordionItem value="appearance" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-semibold">Appearance</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={data.appearance.primaryColor}
                  onChange={(e) => handleAppearanceChange('primaryColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={data.appearance.primaryColor}
                  onChange={(e) => handleAppearanceChange('primaryColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={data.appearance.secondaryColor}
                  onChange={(e) => handleAppearanceChange('secondaryColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={data.appearance.secondaryColor}
                  onChange={(e) => handleAppearanceChange('secondaryColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Text Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={data.appearance.textColor || '#1f2937'}
                  onChange={(e) => handleAppearanceChange('textColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={data.appearance.textColor || '#1f2937'}
                  onChange={(e) => handleAppearanceChange('textColor', e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Base text color (not primary/secondary)</p>
            </div>
            {/* Background Color - For Minimalist and Shift Templates */}
            {(data.appearance.layoutStyle === 'minimalist' || data.appearance.layoutStyle === 'shift') && (
              <div>
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={data.appearance.backgroundColor || (data.appearance.layoutStyle === 'shift' ? '#d4cfc4' : '#f5f5f0')}
                    onChange={(e) => handleAppearanceChange('backgroundColor', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={data.appearance.backgroundColor || (data.appearance.layoutStyle === 'shift' ? '#d4cfc4' : '#f5f5f0')}
                    onChange={(e) => handleAppearanceChange('backgroundColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Page background color</p>
              </div>
            )}
            <div>
              <Label>Font Family</Label>
              <Select value={data.appearance.fontFamily} onValueChange={(value) => handleAppearanceChange('fontFamily', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System (Default)</SelectItem>
                  <SelectItem value="inter">Inter</SelectItem>
                  <SelectItem value="roboto">Roboto</SelectItem>
                  <SelectItem value="poppins">Poppins</SelectItem>
                  <SelectItem value="montserrat">Montserrat</SelectItem>
                  <SelectItem value="playfair">Playfair Display</SelectItem>
                  <SelectItem value="lora">Lora</SelectItem>
                  <SelectItem value="raleway">Raleway</SelectItem>
                  <SelectItem value="opensans">Open Sans</SelectItem>
                  <SelectItem value="merriweather">Merriweather</SelectItem>
                  <SelectItem value="nunito">Nunito</SelectItem>
                  <SelectItem value="lato">Lato</SelectItem>
                  <SelectItem value="worksans">Work Sans</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Modules */}
        <AccordionItem value="modules" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-semibold">Modules (Show/Hide)</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-4">
            {Object.entries(data.modules).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                  <span className="capitalize font-medium">{key}</span>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={() => handleModuleToggle(key as keyof typeof data.modules)}
                />
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Content */}
        <AccordionItem value="content" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-semibold">Content</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {/* Services */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Services</Label>
                <Button size="sm" variant="outline" onClick={onOpenServiceModal}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              {data.services.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No services yet</p>
              ) : (
                <div className="space-y-2">
                  {data.services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{service.title}</p>
                        <p className="text-xs text-gray-500">{service.priceLabel}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEditService(service)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onDeleteService(service.id)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* About Me Tags - For Minimalist and Shift Templates */}
            {(data.appearance.layoutStyle === 'minimalist' || data.appearance.layoutStyle === 'shift') && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">About Me - Skills/Tags</Label>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Add a skill tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const newTag = e.currentTarget.value.trim().toUpperCase()
                        const currentTags = data.about?.tags || []
                        onDataChange({
                          about: {
                            ...data.about,
                            tags: [...currentTags, newTag]
                          }
                        })
                        e.currentTarget.value = ''
                      }
                    }}
                    className="text-sm"
                  />
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {(data.about?.tags || []).map((tag, idx) => (
                      <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                        <span>{tag}</span>
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
                          className="hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {(!data.about?.tags || data.about.tags.length === 0) && (
                    <p className="text-xs text-gray-500 italic">Press Enter to add skills</p>
                  )}
                </div>
              </div>
            )}

            {/* Projects */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Projects</Label>
                <Button size="sm" variant="outline" onClick={onOpenProjectModal}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              {data.projects.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No projects yet</p>
              ) : (
                <div className="space-y-2">
                  {data.projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{project.title}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEditProject(project)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onDeleteProject(project.id)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Testimonials */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Testimonials</Label>
                <Button size="sm" variant="outline" onClick={onOpenTestimonialModal}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              {data.testimonials.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No testimonials yet</p>
              ) : (
                <div className="space-y-2">
                  {data.testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{testimonial.author}</p>
                        <p className="text-xs text-gray-500">{testimonial.role}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEditTestimonial(testimonial)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onDeleteTestimonial(testimonial.id)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Contact Items</Label>
                <Button size="sm" variant="outline" onClick={onOpenContactModal}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              {data.contactItems.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No contact items yet</p>
              ) : (
                <div className="space-y-2">
                  {data.contactItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <p className="text-xs text-gray-500 truncate">{item.value}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEditContactItem(item)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onDeleteContactItem(item.id)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Branding */}
        <AccordionItem value="branding" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-semibold">Branding</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Label>Hide Logo</Label>
              <Switch
                checked={data.branding.hideLogo || false}
                onCheckedChange={(checked) => onDataChange({ branding: { ...data.branding, hideLogo: checked } })}
              />
            </div>
            <div>
              <Label>Logo</Label>
              <div className="mt-2">
                {data.branding.logo && (
                  <img src={data.branding.logo} alt="Logo" className="h-12 mb-2" />
                )}
                <label>
                  <Button size="sm" variant="outline" className="cursor-pointer" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload('branding.logo', e.target.files[0])}
                  />
                </label>
              </div>
            </div>
            <div>
              <Label>Brand Text (optional)</Label>
              <Input
                value={data.branding.logoText || ""}
                onChange={(e) => onDataChange({ branding: { ...data.branding, logoText: e.target.value } })}
                placeholder="Company Name"
              />
              <p className="text-xs text-gray-500 mt-1">Displays next to logo (optional)</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Behavior */}
        <AccordionItem value="behavior" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-semibold">Behavior</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <Label className="mb-2 block">Primary CTAs</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={data.behavior.enableHireMe}
                    onCheckedChange={(checked) => handleBehaviorChange('enableHireMe', checked)}
                  />
                  <span className="text-sm">Hire Me</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={data.behavior.enableBookCall}
                    onCheckedChange={(checked) => handleBehaviorChange('enableBookCall', checked)}
                  />
                  <span className="text-sm">Book a Call</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={data.behavior.enableViewServices}
                    onCheckedChange={(checked) => handleBehaviorChange('enableViewServices', checked)}
                  />
                  <span className="text-sm">View Services</span>
                </div>
              </div>
            </div>
            <div>
              <Label>Contact Form Destination</Label>
              <Select value={data.behavior.contactDestination} onValueChange={(value) => handleBehaviorChange('contactDestination', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads">Leads Pipeline</SelectItem>
                  <SelectItem value="email">Email Copy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEO */}
        <AccordionItem value="seo" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-semibold">SEO</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <Label>Meta Title</Label>
              <Input
                value={data.seo.metaTitle}
                onChange={(e) => handleSeoChange('metaTitle', e.target.value)}
                placeholder="Portfolio Title"
              />
            </div>
            <div>
              <Label>Meta Description</Label>
              <Textarea
                value={data.seo.metaDescription}
                onChange={(e) => handleSeoChange('metaDescription', e.target.value)}
                placeholder="Brief description of your portfolio"
                rows={3}
              />
            </div>
            <div>
              <Label>Social Share Image</Label>
              <div className="mt-2">
                {data.seo.socialImage && (
                  <img src={data.seo.socialImage} alt="Social" className="h-32 w-full object-cover rounded mb-2" />
                )}
                <label>
                  <Button size="sm" variant="outline" className="cursor-pointer" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload('socialImage', e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}


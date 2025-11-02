export type Status = "draft" | "published"

export interface Service {
  id: string
  title: string
  blurb: string
  priceLabel: string
  tags?: string[]
  ctaLabel?: string
}

export interface Project {
  id: string
  title: string
  summary: string
  coverImage?: string
  tags?: string[]
  link?: string
}

export interface Testimonial {
  id: string
  author: string
  role: string
  quote: string
}

export interface ContactItem {
  id: string
  icon: string
  label: string
  value: string
}

export interface SocialLink {
  id: string
  icon: string
  url: string
}

export interface PortfolioData {
  hero: {
    avatar?: string
    name: string
    tagline: string
    bio: string
    ctaLabel: string
    prefix?: string
    stat2Description?: string
  }
  about?: {
    heading?: string
    column1?: string
    column2?: string
    tags?: string[]
  }
  services: Service[]
  projects: Project[]
  testimonials: Testimonial[]
  contact: {
    title: string
    ctaLabel: string
    note: string
  }
  contactItems: ContactItem[]
  footer?: {
    companyName: string
    copyrightText?: string
  }
  socialLinks: SocialLink[]
  sectionHeaders: {
    services?: string
    projects?: string
    testimonials?: string
  }
  appearance: {
    primaryColor: string
    secondaryColor: string
    textColor?: string
    fontFamily: string
    layoutStyle: string
    spacing: string
    backgroundColor?: string
  }
  modules: {
    hero: boolean
    about: boolean
    services: boolean
    projects: boolean
    testimonials: boolean
    contact: boolean
    footer: boolean
  }
  modulesOrder: string[]
  branding: {
    logo?: string
    logoText?: string
    banner?: string
    hideLogo?: boolean
  }
  behavior: {
    isPublic: boolean
    enableHireMe: boolean
    enableBookCall: boolean
    enableViewServices: boolean
    contactDestination: string
  }
  seo: {
    metaTitle: string
    metaDescription: string
    socialImage?: string
  }
}


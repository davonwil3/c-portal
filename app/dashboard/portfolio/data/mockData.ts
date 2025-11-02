import { PortfolioData } from "../types"

export function buildAuraMockData(): PortfolioData {
  return {
    hero: {
      name: "Your Name",
      tagline: "a Visual Designer living in Munich",
      bio: "As a Senior Designer with over 10 years of experience, I specialize in creating intuitive and user-centered interfaces for a wide range of digital products and experiences.",
      ctaLabel: "Get In Touch",
      prefix: "About me,",
      avatar: "/uiuxdesigner.jpg"
    },
    about: {
      heading: "I'm the UI/UX and brand designer you need to take your digital presence to the next level",
      column1: "With a collaborative mindset and a dedication to their craft, I work closely with clients to understand their goals and objectives, providing tailored design solutions that meet their unique needs and exceed their expectations.",
      column2: "Outside of work, you can find me exploring the latest design trends, attending design conferences, or working on personal projects that allow me to experiment with new techniques and technologies.",
      tags: [
        "UI DESIGN", "UX DESIGN", "PROTOTYPING", "BRANDING", "HTML/CSS", "WIREFRAMING",
        "INFORMATION ARCHITECTURE", "USER RESEARCH", "USER INTERVIEWS", "LEADERSHIP", "SKETCH", "ADOBE SUITE"
      ]
    },
    services: [
      { id: "sample-1", title: "UI/UX Design", blurb: "Creating beautiful and intuitive user interfaces that delight users and drive engagement.", priceLabel: "Starting at $2,500", tags: ["Web Design", "Mobile", "Prototyping"], ctaLabel: "Learn More" },
      { id: "sample-2", title: "Brand Identity", blurb: "Developing cohesive brand identities that tell your story and resonate with your audience.", priceLabel: "Starting at $3,500", tags: ["Branding", "Logo Design", "Style Guide"], ctaLabel: "Learn More" },
      { id: "sample-3", title: "Web Development", blurb: "Building responsive and performant websites with modern technologies and best practices.", priceLabel: "Starting at $5,000", tags: ["React", "Next.js", "Tailwind"], ctaLabel: "Learn More" }
    ],
    projects: [
      { id: "project-1", title: "E-Commerce Platform", summary: "A modern e-commerce platform with seamless user experience and powerful admin tools.", coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop", tags: ["E-commerce", "React", "Design"] },
      { id: "project-2", title: "Mobile Banking App", summary: "Intuitive mobile banking application with focus on security and user experience.", coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop", tags: ["Mobile", "Fintech", "UI/UX"] }
    ],
    testimonials: [
      { id: "testimonial-1", author: "Sarah Johnson", role: "CEO, TechStart Inc", quote: "Working with this designer was an absolute pleasure. They delivered exceptional results that exceeded our expectations." },
      { id: "testimonial-2", author: "Michael Chen", role: "Product Manager, InnovateCo", quote: "The attention to detail and creative approach brought our vision to life. Highly recommend for any design project." }
    ],
    contact: { title: "Let's Work Together", ctaLabel: "Send Message", note: "I'm always open to new opportunities and collaborations. Let's create something amazing together." },
    contactItems: [
      { id: "contact-1", icon: "Mail", label: "Email", value: "hello@example.com" },
      { id: "contact-2", icon: "Phone", label: "Phone", value: "+1 (555) 123-4567" },
      { id: "contact-3", icon: "MapPin", label: "Location", value: "New York, NY" }
    ],
    footer: {
      companyName: "My Company",
      copyrightText: "All rights reserved"
    },
    socialLinks: [
      { id: "social-1", icon: "Twitter", url: "https://twitter.com" },
      { id: "social-2", icon: "Linkedin", url: "https://linkedin.com" },
      { id: "social-3", icon: "Instagram", url: "https://instagram.com" }
    ],
    sectionHeaders: { services: "What I Do", projects: "Selected Work", testimonials: "Client Testimonials" },
    appearance: { primaryColor: "#000000", secondaryColor: "#8b5cf6", textColor: "#1f2937", fontFamily: "system", layoutStyle: "aura", spacing: "comfy", backgroundColor: "#ffffff" },
    modules: { hero: true, about: true, services: true, projects: true, testimonials: true, contact: true, footer: true },
    modulesOrder: ["hero", "about", "services", "projects", "testimonials", "contact", "footer"],
    branding: {},
    behavior: { isPublic: false, enableHireMe: true, enableBookCall: false, enableViewServices: true, contactDestination: "leads" },
    seo: { metaTitle: "My Portfolio - Aura", metaDescription: "Explore my work and services" }
  }
}

export function buildMinimalistMockData(): PortfolioData {
  return {
    hero: {
      name: "Your Name",
      tagline: "Full-Stack Developer & Tech Enthusiast",
      bio: "Building scalable web applications and elegant solutions. Passionate about clean code, modern frameworks, and creating exceptional user experiences through technology.",
      ctaLabel: "Get In Touch",
      prefix: "Hi, I'm",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop"
    },
    about: {
      heading: "My Journey in Software Development",
      column1: "I started coding at 16 and haven't stopped since. After graduating with a Computer Science degree, I've spent the last 8 years building production-ready applications for startups and enterprises alike. I specialize in modern JavaScript frameworks and scalable backend systems.",
      column2: "Currently working as a Senior Full-Stack Developer, I lead development on cloud-native applications. When I'm not coding, you'll find me contributing to open-source projects, writing technical blog posts, or experimenting with emerging technologies.",
      tags: ["REACT", "NODE.JS", "TYPESCRIPT", "NEXT.JS", "PYTHON", "AWS", "DOCKER", "POSTGRESQL", "MONGODB", "REST API", "GRAPHQL", "CI/CD"]
    },
    services: [
      { id: "sample-1", title: "Full-Stack Web Apps", blurb: "Custom web applications built with React, Node.js, and modern cloud infrastructure. Scalable, secure, and maintainable.", priceLabel: "Starting at $8,000", tags: ["React", "Node.js", "PostgreSQL", "AWS"], ctaLabel: "Learn More" },
      { id: "sample-2", title: "API Development", blurb: "RESTful and GraphQL APIs designed for performance and scalability. Complete with documentation and testing.", priceLabel: "Starting at $4,500", tags: ["REST API", "GraphQL", "Documentation", "Testing"], ctaLabel: "Learn More" },
      { id: "sample-3", title: "Technical Consulting", blurb: "Architecture reviews, code audits, and technical strategy. Help your team make the right technology decisions.", priceLabel: "Starting at $200/hour", tags: ["Architecture", "Code Review", "Strategy", "Mentoring"], ctaLabel: "Learn More" }
    ],
    projects: [
      { id: "project-1", title: "SaaS Analytics Platform", summary: "Real-time analytics dashboard processing millions of events daily. Built with React, Node.js, and TimescaleDB for time-series data.", coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop", tags: ["React", "Node.js", "TimescaleDB", "Real-time"], link: "https://example.com" },
      { id: "project-2", title: "Healthcare API Gateway", summary: "HIPAA-compliant API gateway handling 10M+ requests/day. Microservices architecture with automated testing and deployment.", coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop", tags: ["Microservices", "AWS", "Docker", "API"], link: "https://example.com" },
      { id: "project-3", title: "Open Source Component Library", summary: "Accessible React component library with 50+ components. Used by 10K+ developers worldwide with extensive documentation.", coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop", tags: ["React", "TypeScript", "Open Source", "Accessibility"], link: "https://github.com" }
    ],
    testimonials: [
      { id: "testimonial-1", author: "Jennifer Martinez", role: "CTO, HealthTech Solutions", quote: "Exceptional technical skills combined with clear communication. Delivered a complex healthcare platform on time and under budget. The code quality was outstanding." },
      { id: "testimonial-2", author: "David Thompson", role: "VP Engineering, DataFlow Inc", quote: "One of the best developers I've worked with. Strong architecture skills, clean code, and great problem-solving abilities. A true full-stack professional." },
      { id: "testimonial-3", author: "Lisa Chen", role: "Founder, StartupLab", quote: "Took our MVP from concept to production in 8 weeks. The technical expertise and attention to scalability were impressive. Highly recommended." }
    ],
    contact: { title: "Let's Build Something", ctaLabel: "Send Message", note: "Available for freelance projects and technical consulting. Let's discuss how I can help bring your ideas to life." },
    contactItems: [
      { id: "contact-1", icon: "Mail", label: "Email", value: "dev@example.com" },
      { id: "contact-2", icon: "Github", label: "GitHub", value: "github.com/username" },
      { id: "contact-3", icon: "MapPin", label: "Location", value: "San Francisco, CA" },
      { id: "contact-4", icon: "Linkedin", label: "LinkedIn", value: "linkedin.com/in/username" }
    ],
    footer: {
      companyName: "My Portfolio",
      copyrightText: "All rights reserved"
    },
    socialLinks: [
      { id: "social-1", icon: "Github", url: "https://github.com" },
      { id: "social-2", icon: "Linkedin", url: "https://linkedin.com" },
      { id: "social-3", icon: "Twitter", url: "https://twitter.com" }
    ],
    sectionHeaders: { services: "Services & Expertise", projects: "Featured Projects", testimonials: "Client Feedback" },
    appearance: { primaryColor: "#000000", secondaryColor: "#8b5cf6", textColor: "#1f2937", fontFamily: "system", layoutStyle: "minimalist", spacing: "comfy", backgroundColor: "#f5f5f0" },
    modules: { hero: true, about: true, services: true, projects: true, testimonials: true, contact: true, footer: true },
    modulesOrder: ["hero", "about", "services", "projects", "testimonials", "contact", "footer"],
    branding: {},
    behavior: { isPublic: false, enableHireMe: true, enableBookCall: false, enableViewServices: true, contactDestination: "leads" },
    seo: { metaTitle: "My Portfolio - Minimalist", metaDescription: "Explore my work and services" }
  }
}

export function buildShiftMockData(): PortfolioData {
  return {
    hero: {
      name: "Alex Rivera",
      tagline: "CREATIVE DESIGNER",
      bio: "I SUPPORT BRANDS AND AGENCIES WITH CREATIVE DESIGN AND ART DIRECTION",
      ctaLabel: "Get In Touch",
      prefix: "Currently freelancing",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"
    },
    about: {
      heading: "ABOUT ME",
      column1: "I'm a graphic designer with a passion for creating bold, impactful visual identities. With over 7 years of experience working with brands across fashion, lifestyle, and tech, I specialize in bringing concepts to life through compelling design.",
      column2: "My approach combines strategic thinking with creative execution. I believe great design isn't just beautiful—it solves problems, tells stories, and creates memorable experiences that resonate with audiences.",
      tags: [
        "GRAPHIC DESIGN", "BRANDING", "ART DIRECTION", "TYPOGRAPHY", "PRINT DESIGN", 
        "DIGITAL DESIGN", "PACKAGING", "LOGO DESIGN", "ADOBE CREATIVE SUITE", 
        "ILLUSTRATION", "CONCEPT DEVELOPMENT", "EDITORIAL DESIGN"
      ]
    },
    services: [
      { 
        id: "sample-1", 
        title: "Brand Identity Design", 
        blurb: "Complete brand identity systems including logo design, typography, color palettes, and brand guidelines that establish your unique visual language.", 
        priceLabel: "Starting at $5,000", 
        tags: ["Logo Design", "Brand Guidelines", "Typography", "Color Systems"], 
        ctaLabel: "Learn More" 
      },
      { 
        id: "sample-2", 
        title: "Art Direction & Creative Strategy", 
        blurb: "Strategic creative direction for campaigns, photoshoots, and visual content. Ensuring cohesive and impactful visual storytelling across all touchpoints.", 
        priceLabel: "Starting at $3,500", 
        tags: ["Art Direction", "Campaign Design", "Visual Strategy", "Photoshoot Direction"], 
        ctaLabel: "Learn More" 
      },
      { 
        id: "sample-3", 
        title: "Print & Editorial Design", 
        blurb: "Design for print media including magazines, books, packaging, posters, and promotional materials. From concept to print-ready files.", 
        priceLabel: "Starting at $2,000", 
        tags: ["Print Design", "Editorial", "Packaging", "Poster Design"], 
        ctaLabel: "Learn More" 
      }
    ],
    projects: [
      { 
        id: "project-1", 
        title: "LUXE Fashion Brand Identity", 
        summary: "Complete rebrand for a luxury fashion startup including logo, packaging, and seasonal campaign design. Created a bold visual identity that stands out in the competitive fashion market.", 
        coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80", 
        tags: ["Fashion", "Branding", "Luxury", "Print"], 
        link: "https://example.com" 
      },
      { 
        id: "project-2", 
        title: "NOVO Tech Rebrand", 
        summary: "Art direction and brand identity for a B2B tech platform. Developed a modern, professional visual system that communicates innovation and reliability.", 
        coverImage: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop", 
        tags: ["Tech", "B2B", "Corporate Identity", "Digital"], 
        link: "https://example.com" 
      },
      { 
        id: "project-3", 
        title: "TERRA Editorial Magazine", 
        summary: "Creative direction and layout design for quarterly lifestyle magazine. Bold typography and innovative layouts that push editorial design boundaries.", 
        coverImage: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=800&auto=format&fit=crop", 
        tags: ["Editorial", "Magazine", "Print", "Typography"], 
        link: "https://example.com" 
      }
    ],
    testimonials: [
      { 
        id: "testimonial-1", 
        author: "Emma Rodriguez", 
        role: "Creative Director, Vogue House", 
        quote: "An incredibly talented designer with a keen eye for detail and innovation. The brand identity they created for us exceeded all expectations and has been pivotal to our success." 
      },
      { 
        id: "testimonial-2", 
        author: "Marcus Kim", 
        role: "Founder, StartupX", 
        quote: "Working with this designer transformed our brand. They understood our vision perfectly and delivered designs that are both beautiful and strategically sound." 
      },
      { 
        id: "testimonial-3", 
        author: "Sophie Laurent", 
        role: "Brand Manager, LUXE Collective", 
        quote: "A true creative professional. The art direction for our campaigns was outstanding, and the attention to every detail made all the difference." 
      }
    ],
    contact: { 
      title: "LET'S CONNECT", 
      ctaLabel: "Send Message", 
      note: "Available for freelance projects, creative consulting, and long-term collaborations. Let's create something bold together." 
    },
    contactItems: [
      { id: "contact-1", icon: "Mail", label: "Email", value: "hello@designer.com" },
      { id: "contact-2", icon: "Instagram", label: "Instagram", value: "@yourdesignstudio" },
      { id: "contact-3", icon: "MapPin", label: "Location", value: "London, United Kingdom" },
      { id: "contact-4", icon: "Linkedin", label: "LinkedIn", value: "linkedin.com/in/designer" }
    ],
    footer: {
      companyName: "Design Studio",
      copyrightText: "All rights reserved"
    },
    socialLinks: [
      { id: "social-1", icon: "Instagram", url: "https://instagram.com" },
      { id: "social-2", icon: "Twitter", url: "https://twitter.com" },
      { id: "social-3", icon: "Linkedin", url: "https://linkedin.com" }
    ],
    sectionHeaders: { 
      services: "WHAT I DO", 
      projects: "SELECTED WORK", 
      testimonials: "CLIENT WORDS" 
    },
    appearance: { 
      primaryColor: "#1a1a1a", 
      secondaryColor: "#8b5cf6", 
      textColor: "#1a1a1a", 
      fontFamily: "system", 
      layoutStyle: "shift", 
      spacing: "comfy", 
      backgroundColor: "#d4cfc4" 
    },
    modules: { hero: true, about: true, services: true, projects: true, testimonials: true, contact: true, footer: true },
    modulesOrder: ["hero", "about", "services", "projects", "testimonials", "contact", "footer"],
    branding: {},
    behavior: { isPublic: false, enableHireMe: true, enableBookCall: false, enableViewServices: true, contactDestination: "leads" },
    seo: { metaTitle: "My Portfolio - Shift", metaDescription: "Creative designer portfolio" }
  }
}

export function buildInnovateMockData(): PortfolioData {
  return {
    hero: {
      name: "Creative Brand",
      tagline: "Management Studio",
      bio: "15+",
      ctaLabel: "Years Experience",
      prefix: "85+",
      stat2Description: "Successful Projects",
      avatar: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&auto=format&fit=crop"
    },
    about: {
      heading: "Award-Winning Team",
      column1: "We're a team of passionate brand strategists, designers, and creative thinkers dedicated to transforming businesses through powerful visual storytelling. With over 15 years of experience, we've helped countless brands discover their unique voice and connect authentically with their audiences.",
      column2: "Our approach combines strategic thinking with creative excellence. We don't just design pretty things—we create meaningful brand experiences that drive real business growth and build lasting connections with your customers.",
      tags: [
        "BRAND STRATEGY", "LOGO DESIGN", "VISUAL IDENTITY", 
        "SOCIAL MEDIA", "CONTENT CREATION", "MARKETING CAMPAIGNS", 
        "WEB DESIGN", "PACKAGING", "UI/UX DESIGN", "BRAND GUIDELINES", 
        "CREATIVE DIRECTION", "DIGITAL BRANDING"
      ]
    },
    services: [
      {
        id: "sample-1",
        title: "Brand Strategy & Positioning",
        blurb: "We craft compelling brand strategies that define your unique position in the market. From brand audits to competitive analysis, we help you stand out and connect with your audience.",
        priceLabel: "",
        tags: ["Brand Audit", "Market Research", "Positioning"],
        ctaLabel: "Learn More"
      },
      {
        id: "sample-2",
        title: "Visual Identity Design",
        blurb: "Create a memorable visual identity that captures your brand's essence. From logos to complete brand systems, we design with purpose and precision.",
        priceLabel: "",
        tags: ["Logo Design", "Brand Guidelines", "Typography"],
        ctaLabel: "Learn More"
      },
      {
        id: "sample-3",
        title: "Digital Marketing & Content",
        blurb: "Engage your audience with strategic digital campaigns and creative content. We manage your social media, create stunning visuals, and drive measurable results.",
        priceLabel: "",
        tags: ["Social Media", "Content Strategy", "Campaign Management"],
        ctaLabel: "Learn More"
      }
    ],
    projects: [
      {
        id: "project-1",
        title: "Color Clash Listening Mode",
        summary: "Complete brand identity redesign for a music streaming startup. Created a vibrant, youthful brand system that captures the energy of discovering new music.",
        coverImage: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=1200&auto=format&fit=crop",
        tags: ["AI", "Creative", "Design", "Web dev"],
        link: "https://example.com"
      },
      {
        id: "project-2",
        title: "Whispers Behind Paint",
        summary: "Art gallery rebrand and marketing campaign. Developed a sophisticated visual language that balances contemporary art with timeless elegance.",
        coverImage: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&auto=format&fit=crop",
        tags: ["AI", "Creative", "Design", "Web dev"],
        link: "https://example.com"
      },
      {
        id: "project-3",
        title: "Urban Essence Collection",
        summary: "Fashion brand launch with complete visual identity, packaging, and digital presence. Modern streetwear meets minimalist design philosophy.",
        coverImage: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop",
        tags: ["Fashion", "Branding", "Packaging", "E-commerce"],
        link: "https://example.com"
      },
      {
        id: "project-4",
        title: "Bloom Wellness Studio",
        summary: "Complete brand system for a wellness and yoga studio. Created a calm, organic identity that reflects their holistic approach to health.",
        coverImage: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=1200&auto=format&fit=crop",
        tags: ["Wellness", "Logo Design", "Brand Guidelines", "Digital"],
        link: "https://example.com"
      }
    ],
    testimonials: [
      { 
        id: "testimonial-1", 
        author: "Sarah Mitchell", 
        role: "Founder, Bloom Wellness", 
        quote: "Working with this team transformed our brand completely. They understood our vision and created an identity that truly resonates with our community. The attention to detail and creative expertise exceeded all expectations." 
      },
      { 
        id: "testimonial-2", 
        author: "James Chen", 
        role: "Marketing Director, Urban Apparel", 
        quote: "Their brand strategy helped us stand out in a crowded market. The visual identity they created is not just beautiful—it's strategic and drives real business results. Best investment we've made." 
      },
      { 
        id: "testimonial-3", 
        author: "Maria Rodriguez", 
        role: "CEO, Color Clash Music", 
        quote: "From concept to execution, this team brought our brand to life in ways we never imagined. Their creativity, professionalism, and understanding of our audience made all the difference." 
      }
    ],
    contact: { 
      title: "Let's Create Something Amazing", 
      ctaLabel: "Send Message", 
      note: "Ready to elevate your brand? Let's discuss your vision and create a brand identity that truly stands out." 
    },
    contactItems: [
      { id: "contact-1", icon: "Mail", label: "Email", value: "hello@creativestudio.com" },
      { id: "contact-2", icon: "Phone", label: "Phone", value: "+1 (555) 987-6543" },
      { id: "contact-3", icon: "MapPin", label: "Location", value: "New York, NY" },
      { id: "contact-4", icon: "Linkedin", label: "LinkedIn", value: "linkedin.com/company/creativestudio" }
    ],
    footer: {
      companyName: "Creative Brand Studio",
      copyrightText: "All rights reserved"
    },
    socialLinks: [
      { id: "social-1", icon: "Instagram", url: "https://instagram.com/creativestudio" },
      { id: "social-2", icon: "Twitter", url: "https://twitter.com/creativestudio" },
      { id: "social-3", icon: "Linkedin", url: "https://linkedin.com/company/creativestudio" },
      { id: "social-4", icon: "Facebook", url: "https://facebook.com/creativestudio" }
    ],
    sectionHeaders: { 
      services: "Our Services", 
      projects: "Recent Cases", 
      testimonials: "What Clients Say" 
    },
    appearance: { 
      primaryColor: "#6366f1", 
      secondaryColor: "#8b5cf6", 
      textColor: "#1a1a1a", 
      fontFamily: "system", 
      layoutStyle: "innovate", 
      spacing: "comfy", 
      backgroundColor: "#ffffff" 
    },
    modules: { hero: true, about: true, services: true, projects: true, testimonials: true, contact: true, footer: true },
    modulesOrder: ["hero", "about", "services", "projects", "testimonials", "contact", "footer"],
    branding: {},
    behavior: { isPublic: false, enableHireMe: true, enableBookCall: true, enableViewServices: true, contactDestination: "leads" },
    seo: { metaTitle: "Creative Brand Management Studio - Transform Your Brand", metaDescription: "Award-winning brand strategy and creative design studio specializing in visual identity and digital marketing" }
  }
}


import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  ArrowRight,
  Search,
  TrendingUp,
  Calendar,
  FileText,
  CreditCard,
  FolderOpen,
  MessageSquare,
  BarChart3,
  Clock,
  Zap,
  Users,
  Sparkles,
  Globe,
  ChevronRight,
  Bell,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import WaitlistForm from "@/components/WaitlistForm"
import JoinWaitlistModalButton from "@/components/JoinWaitlistModalButton"
import LoomVideoEmbed from "@/components/LoomVideoEmbed"

export default function JolixLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/jolixlogo.png"
                alt="Jolix Logo"
                width={60}
                height={60}
                className="w-14 h-14"
                priority
                quality={90}
              />
              <span className="text-3xl font-bold text-gray-900">Jolix</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-[#3C3CFF] transition-colors">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-[#3C3CFF] transition-colors">Pricing</a>
              <a href="#faq" className="text-gray-700 hover:text-[#3C3CFF] transition-colors">FAQ</a>
              {/* <Link href="/auth">
                <Button variant="ghost" className="text-gray-700">Sign In</Button>
              </Link> */}
              {/* <Link href="/auth">
                <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">
                  Start For Free
              </Button>
              </Link> */}
              <JoinWaitlistModalButton className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white" />
            </nav>
          </div>
        </div>
      </header>

      {/* 1️⃣ HERO SECTION */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-blue-50 via-blue-50/50 to-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center w-full">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-7">
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight tracking-tight m-0">
                  Your entire freelance business,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3C3CFF] via-purple-600 to-pink-600">
                    in one place
                  </span>
                </h1>
                <p className="text-lg lg:text-xl xl:text-2xl text-gray-600 leading-relaxed">
                  Find clients, manage projects, and grow your brand — all inside Jolix.
                </p>
              </div>

              <div className="m-0">
                <WaitlistForm />
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-5 w-5 text-[#3C3CFF]" />
                  <span>No credit card required</span>
              </div>
              
                  </div>
                  </div>

            {/* Right Column - Product Mockup */}
            <div className="relative flex items-center justify-center lg:min-h-[700px] w-full">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-purple-50/30 to-pink-100/50 rounded-3xl blur-3xl"></div>

              {/* Main Image */}
              <div className="relative w-full aspect-square" style={{ maxWidth: '700px' }}>
                <div className="relative w-full h-full rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
                <Image
                    src="/womanoncomp.jpeg"
                    alt="Woman working on computer"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 800px, 800px"
                    quality={85}
                />
              </div>
              </div>

              {/* Floating Lead Card */}
              <div className="absolute top-16 w-64 bg-white rounded-xl shadow-lg border border-gray-200/60 p-4 hidden xl:block" style={{ left: 'calc(50% + 140px)' }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#3C3CFF] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Search className="h-5 w-5 text-white" />
            </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">New Lead</h4>
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs px-1.5 py-0.5">Match</Badge>
          </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      UX designer needed for e-commerce redesign
              </p>
            </div>
                  </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button size="sm" className="flex-1 bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white h-8 text-xs">
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-gray-300">
                    Save
                  </Button>
                  </div>
                  </div>

              {/* Floating Project Card */}
              <div className="absolute bottom-16 w-56 bg-white rounded-xl shadow-lg border border-gray-200/60 p-4 hidden xl:block" style={{ left: 'calc(50% - 280px - 110px)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-semibold text-gray-900">Active Project</span>
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#3C3CFF] to-purple-600 flex items-center justify-center">
                    <FileText className="h-3 w-3 text-white" />
                  </div>
                  </div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Brand Redesign</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-bold text-gray-900">75%</span>
                  </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#3C3CFF] h-1.5 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500">Due Date</div>
                      <div className="text-xs font-semibold text-gray-900">Jan 28</div>
                  </div>
                    <div>
                      <div className="text-xs text-gray-500">Budget</div>
                      <div className="text-xs font-semibold text-[#3C3CFF]">$8,500</div>
            </div>
          </div>
        </div>
              </div>

              {/* Floating Follower Count Card */}
              <div className="absolute -bottom-6 w-60 bg-white rounded-xl shadow-lg border border-gray-200/60 p-4 hidden xl:block" style={{ left: 'calc(50% + 140px)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
              </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-semibold">+12%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Social Followers</div>
                    <div className="text-2xl font-bold text-gray-900">2.4K</div>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-gray-500">Twitter</div>
                        <div className="font-semibold text-gray-900">1.2K</div>
                </div>
                      <div>
                        <div className="text-gray-500">LinkedIn</div>
                        <div className="font-semibold text-gray-900">850</div>
                  </div>
                      <div>
                        <div className="text-gray-500">Other</div>
                        <div className="font-semibold text-gray-900">350</div>
                </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2️⃣ WHY JOLIX EXISTS - The Problem */}
      <section className="py-20 lg:py-24 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Side - Visual Storytelling */}
            <div className="relative flex items-center justify-center lg:min-h-[600px]">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 via-blue-50/30 to-pink-100/40 rounded-3xl blur-3xl"></div>
              
              {/* Main Image */}
              <div className="relative w-full aspect-square" style={{ maxWidth: '600px' }}>
                <div className="relative w-full h-full rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                    <Image
                    src="/manoncomp.jpeg"
                    alt="Freelancer working"
                    fill
                    className="object-cover opacity-90"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 600px, 600px"
                    quality={85}
                  />
                </div>
                </div>

              {/* Floating Tweet Card */}
              <div className="absolute top-8 -left-4 w-72 bg-white rounded-xl shadow-lg border border-gray-200/60 p-4 hidden lg:block" style={{ boxShadow: '0 10px 40px rgba(59, 130, 246, 0.15)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-white" />
              </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-2">
                      Just landed a new client 🎉
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Scheduled for 10:00 AM</span>
            </div>
              </div>
                </div>
              </div>

              {/* Floating Lead Card */}
              <div className="absolute top-1/3 -right-4 w-72 bg-white rounded-xl shadow-lg border border-gray-200/60 p-4 hidden lg:block" style={{ boxShadow: '0 10px 40px rgba(34, 197, 94, 0.15)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">New Lead</span>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-1.5 py-0.5">Match</Badge>
                    </div>
                    <p className="text-xs text-gray-600">
                      Designer needed for new logo design
                    </p>
                </div>
                </div>
                </div>

              {/* Floating Payment Card */}
              <div className="absolute bottom-8 left-8 w-64 bg-white rounded-xl shadow-lg border border-gray-200/60 p-4 hidden lg:block" style={{ boxShadow: '0 10px 40px rgba(168, 85, 247, 0.15)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="h-5 w-5 text-white" />
                </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Invoice Paid</p>
                    <p className="text-2xl font-bold text-[#3C3CFF]">$1,200</p>
              </div>
            </div>
          </div>
        </div>

            {/* Right Side - Text Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
                  You're not just freelancing — you're{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3C3CFF] via-purple-600 to-pink-600">
                    building your name
                  </span>
              </h2>
                <p className="text-lg lg:text-xl text-gray-600 leading-relaxed">
                  Jolix helps you manage clients 
                  and grow your brand in one calm workspace — so you can focus on what matters.
                </p>
              </div>

              {/* Value Lines */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 flex-shrink-0 text-[#3C3CFF]">
                    <FileText className="w-6 h-6" />
                </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Structure your business</p>
                    <p className="text-gray-600">Proposals, contracts, invoices, time tracking, client portal, and more.</p>
                </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 flex-shrink-0 text-emerald-600">
                    <TrendingUp className="w-6 h-6" />
                </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Grow your reach</p>
                    <p className="text-gray-600">Schedule posts, showcase your portfolio, Find new leads.</p>
              </div>
            </div>
            </div>

            
            </div>

          </div>
        </div>
      </section>

      {/* 3️⃣ GROW SECTION */}
      <section id="features" className="py-20 lg:py-28 bg-gradient-to-br from-blue-50 via-blue-100/60 to-blue-50/80">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          
          {/* Section Header */}
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-[#3C3CFF]/10 text-[#3C3CFF] border-[#3C3CFF]/20">
              <TrendingUp className="h-3 w-3 mr-1" />
              Growth Tools
                </Badge>
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Growth shouldn't depend on luck.
              </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-2">
              Jolix helps you attract clients, grow your brand, and show off your work — all in one place.
              </p>
           
                </div>

          {/* Subsection 1: Find Clients Effortlessly */}
          <div className="relative mb-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left - Content */}
              <div className="space-y-6">
                <h3 className="text-4xl lg:text-5xl font-bold text-gray-900">
                  Real projects matching your skills, delivered daily.
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Jolix scans Reddit, Twitter, and niche communities to find real projects matching your skills.
                  Start warm conversations instead of cold pitching.
                </p>
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-emerald-600" />
                </div>
                    <p className="text-gray-700">Smart lead matching based on your niche</p>
                </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-emerald-600" />
                </div>
                    <p className="text-gray-700">Verified posts and budget fit</p>
              </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-emerald-600" />
            </div>
                    <p className="text-gray-700">Fresh leads every day</p>
          </div>
        </div>
              </div>

              {/* Right - Visual */}
              <div className="relative h-[550px] flex items-center justify-center">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/40 to-blue-100/40 rounded-3xl blur-2xl"></div>
                
                {/* Lead Card */}
                <div className="relative w-[450px] bg-white rounded-xl shadow-xl border border-gray-200/60 p-7" style={{ boxShadow: '0 20px 60px rgba(16, 185, 129, 0.2)' }}>
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Search className="h-7 w-7 text-white" />
              </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-gray-900">New Lead Matched</span>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">High Match</Badge>
                      </div>
                      <p className="text-base text-gray-600">
                        Logo redesign for SaaS dashboard 💼
                      </p>
                </div>
                </div>
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-base">
                      <span className="text-gray-500">Budget</span>
                      <span className="font-semibold text-gray-900">$2,500 - $4,000</span>
                </div>
                    <div className="flex items-center justify-between text-base">
                      <span className="text-gray-500">Source</span>
                      <span className="font-semibold text-gray-900">Reddit</span>
                </div>
              </div>
            </div>

                {/* Small Reddit icon */}
                <div className="absolute top-8 right-12 w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🔍</span>
            </div>
          </div>
        </div>
            </div>
              </div>

          {/* Subsection 2: Build a Brand That Attracts Work */}
          <div className="relative mb-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left - Visual */}
              <div className="relative h-[600px] flex items-center justify-center lg:order-1">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 to-purple-100/40 rounded-3xl blur-2xl"></div>
                
                {/* Tweet Card */}
                <div className="relative w-96 bg-white rounded-xl shadow-xl border border-gray-200/60 p-6 mb-8" style={{ boxShadow: '0 20px 60px rgba(59, 130, 246, 0.2)' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">𝕏</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-2">
                        Just wrapped a project for a SaaS founder 🚀 #FreelanceLife
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Scheduled for tomorrow, 9:30 AM</span>
                </div>
                </div>
                </div>
                </div>

                {/* Analytics Card */}
                <div className="absolute top-0 right-0 w-72 bg-white rounded-xl shadow-lg border border-gray-200/60 p-5" style={{ boxShadow: '0 10px 40px rgba(168, 85, 247, 0.15)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-semibold text-gray-900">Profile Reach</span>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-base font-bold">+45%</span>
              </div>
            </div>
                  <p className="text-sm text-gray-500">this week</p>
          </div>

                {/* LinkedIn Card */}
                <div className="absolute bottom-8 left-8 w-96 bg-white rounded-xl shadow-xl border border-gray-200/60 p-6" style={{ boxShadow: '0 20px 60px rgba(14, 118, 168, 0.2)' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-700 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xl">in</span>
        </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-2 leading-relaxed">
                        Excited to share that I've completed another successful brand redesign project. Consistency and attention to detail make all the difference.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Scheduled for tomorrow, 2:00 PM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - Content */}
              <div className="space-y-6 lg:order-2">
                <h3 className="text-4xl lg:text-5xl font-bold text-gray-900">
                  Build a brand that attracts work while you sleep.
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Build a brand that quietly sells for you — schedule posts, track engagement, and grow your presence without burning hours on content.
                </p>
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-blue-600" />
              </div>
                    <p className="text-gray-700">AI-assisted tweet scheduling</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-gray-700">Growth analytics and engagement tracking</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-gray-700">Brand visibility insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subsection 3: Show Off Your Work - Full Width */}
          <div className="relative mb-16">
            <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
              <h3 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Showcase your best work with a professional portfolio.
              </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                Modern templates, personalized in minutes. Every project becomes a magnet for new ones.
              </p>
              <div className="flex flex-wrap justify-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center">
                    <Check className="h-3 w-3 text-pink-600" />
                </div>
                  <span className="text-gray-700">Professional templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center">
                    <Check className="h-3 w-3 text-pink-600" />
                </div>
                  <span className="text-gray-700">One-click sharing</span>
                </div>
               
              </div>
            </div>

            {/* Portfolio Preview Visual */}
            <div className="relative max-w-6xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/60 p-10 relative overflow-hidden" style={{ boxShadow: '0 25px 80px rgba(168, 85, 247, 0.15)' }}>
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
                
            <div className="relative">
                  {/* Mock Portfolio Header */}
                  <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-200">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
              <Image
                        src="/alexrivera.png"
                        alt="Alex Rivera"
                        fill
                        className="object-cover"
                        sizes="80px"
                        quality={90}
              />
            </div>
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900">Alex Rivera</h4>
                      <p className="text-lg text-gray-600">UX Designer & Brand Strategist</p>
          </div>
        </div>

                  {/* Portfolio Preview - Loom Embed */}
                  <LoomVideoEmbed />
            </div>
              </div>
            </div>
          </div>

          {/* Closing CTA */}
          <div className="text-center space-y-8 pt-8">
            <p className="text-2xl font-semibold text-gray-900">
              Growth happens when you're consistently visible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* <Link href="/auth">
                <Button size="lg" className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white text-base px-8 py-6 rounded-lg shadow-sm hover:shadow-md transition-all">
                  Start For Free
                </Button>
              </Link> */}
              <JoinWaitlistModalButton size="lg" className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white text-base px-8 py-6 rounded-lg shadow-sm hover:shadow-md transition-all" />
            </div>
          </div>

        </div>
      </section>

      {/* 4️⃣ MANAGE SECTION */}
      <section className="py-28 lg:py-36 bg-gradient-to-br from-white via-gray-50/30 to-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          
          {/* Header */}
          <div className="text-center mb-24 lg:mb-32">
            <Badge className="mb-4 bg-[#3C3CFF]/10 text-[#3C3CFF] border-[#3C3CFF]/20">
              <Users className="h-3 w-3 mr-1" />
              Client Management
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything you need to deliver like a pro.
              </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Handle every client, project, and payment with confidence — without the chaos.
              </p>
                </div>

          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 mb-16 lg:mb-20 w-full mx-auto">
            
            {/* Client Portal & Projects */}
            <div className="group">
              <div className="flex flex-col lg:flex-row items-start gap-10">
                <div className="w-full lg:w-80 space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ boxShadow: '0 8px 30px rgba(16, 185, 129, 0.25)' }}>
                    <Users className="h-8 w-8 text-white" />
                </div>
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Client Portal & Projects</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Branded portals where clients view projects, share feedback, and track progress.
                    </p>
                </div>
                </div>
                <div className="w-full lg:w-80 flex-shrink-0">
                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all" style={{ boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">IN PROGRESS</span>
                      <span className="text-xs text-gray-500">3 active</span>
              </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">Website Redesign</p>
                          <p className="text-xs text-gray-500">Sarah Chen</p>
            </div>
          </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: '75%' }}></div>
        </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">75%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contracts & Proposals */}
            <div className="group">
              <div className="flex flex-col lg:flex-row items-start gap-10">
                <div className="w-full lg:w-80 space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ boxShadow: '0 8px 30px rgba(59, 130, 246, 0.25)' }}>
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                    <div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Contracts & Proposals</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Professional, signable documents sent in minutes with included templates.
                    </p>
                    </div>
                  </div>
                <div className="w-full lg:w-80 flex-shrink-0">
                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all" style={{ boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Check className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">Proposal Accepted ✅</p>
                        <p className="text-xs text-gray-500">Sarah Chen</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-20 h-1 bg-blue-600 rounded-full"></div>
                        <span className="text-xs text-gray-600">Signed digitally</span>
                      </div>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

                  </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 w-full mx-auto">
            
            {/* Invoices & Payments */}
            <div className="group">
              <div className="flex flex-col lg:flex-row items-start gap-10">
                <div className="w-full lg:w-80 space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ boxShadow: '0 8px 30px rgba(168, 85, 247, 0.25)' }}>
                    <CreditCard className="h-8 w-8 text-white" />
                  </div>
                    <div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Invoices & Payments</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Simple, branded invoices that get you paid faster.
                    </p>
                    </div>
                  </div>
                <div className="w-full lg:w-80 flex-shrink-0">
                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all" style={{ boxShadow: '0 10px 40px rgba(34, 197, 94, 0.12)' }}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">Invoice Paid</p>
                        <p className="text-xs text-gray-500">Invoice #1847</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-3xl font-bold text-green-600 mb-1">$1,200</p>
                      <p className="text-xs text-gray-500">Received today</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* File Sharing & Forms */}
            <div className="group">
              <div className="flex flex-col lg:flex-row items-start gap-10">
                <div className="w-full lg:w-80 space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ boxShadow: '0 8px 30px rgba(236, 72, 153, 0.25)' }}>
                    <FolderOpen className="h-8 w-8 text-white" />
                  </div>
                    <div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">File Sharing & Forms</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Share files and collect project details in one organized place.
                    </p>
                    </div>
                  </div>
                <div className="w-full lg:w-80 flex-shrink-0">
                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all" style={{ boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-pink-600" />
            </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">Client Submitted Form</p>
                        <p className="text-xs text-gray-500">Project Brief</p>
          </div>
        </div>
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-pink-600" />
                          <span className="text-xs text-gray-600">3 files attached</span>
                        </div>
                        <span className="text-xs text-gray-500">Just now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            </div>

          {/* Ending CTA */}
          <div className="text-center space-y-8 pt-20 lg:pt-28">
            <p className="text-2xl font-semibold text-gray-900">
              Work smarter, not busier.
            </p>
            <div className="flex justify-center">
              {/* <Link href="/auth">
                <Button size="lg" className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white text-base px-10 py-6 rounded-lg shadow-sm hover:shadow-md transition-all">
                  Start for Free
                </Button>
              </Link> */}
              <JoinWaitlistModalButton size="lg" className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white text-base px-10 py-6 rounded-lg shadow-sm hover:shadow-md transition-all" />
                  </div>
                    </div>

                    </div>
      </section>

      {/* 5️⃣ UTILITIES SECTION */}
      <section className="pt-16 pb-24 lg:pt-20 lg:pb-32 bg-gradient-to-br from-[#F9FAFB] via-white to-blue-50/30">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-20">
              <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 px-4 py-1.5">
                <Zap className="h-3 w-3 mr-1.5" />
                Power Tools
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Everything you need to run smoothly
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                From tracking time to scheduling meetings — all the essentials in one place.
              </p>
                    </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              
              {/* Analytics Dashboard Card */}
              <div className="group relative">
                {/* Floating Icon */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-8 w-8 text-white group-hover:animate-pulse" />
                    </div>
                
                <Card className="bg-white rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-2xl transition-all duration-300 pt-12 pb-8 px-6 mt-6 group-hover:-translate-y-1" style={{ boxShadow: '0 10px 40px rgba(139, 92, 246, 0.08)' }}>
                  <CardContent className="p-0 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Analytics Dashboard</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Understand revenue and project health at a glance with beautiful, interactive charts.
                    </p>
                  </CardContent>
                </Card>
                  </div>

              {/* Time Tracking Card */}
              <div className="group relative">
                {/* Floating Icon */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full shadow-lg border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="h-8 w-8 text-white group-hover:animate-pulse" />
                </div>
                
                <Card className="bg-white rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-2xl transition-all duration-300 pt-12 pb-8 px-6 mt-6 group-hover:-translate-y-1" style={{ boxShadow: '0 10px 40px rgba(59, 130, 246, 0.08)' }}>
                  <CardContent className="p-0 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Time Tracking</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Log hours accurately, bill confidently, and see exactly where your time goes.
                    </p>
                </CardContent>
              </Card>
              </div>

              {/* Scheduler Card */}
              <div className="group relative">
                {/* Floating Icon */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="h-8 w-8 text-white group-hover:animate-pulse" />
                </div>
                
                <Card className="bg-white rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-2xl transition-all duration-300 pt-12 pb-8 px-6 mt-6 group-hover:-translate-y-1" style={{ boxShadow: '0 10px 40px rgba(168, 85, 247, 0.08)' }}>
                  <CardContent className="p-0 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Scheduler</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Keep meetings and deadlines in sync automatically — never miss an important date.
                    </p>
                  </CardContent>
                </Card>
                  </div>

                    </div>
                    </div>
                    </div>
      </section>

      {/* 6️⃣ AI SECTION */}
      <section className="py-20 bg-gradient-to-r from-[#3C3CFF] to-purple-600 text-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mb-8 mx-auto">
              <Sparkles className="h-10 w-10 text-white" />
                    </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Built with AI to save you time
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              From smart lead matching to instant proposal drafts, Jolix uses AI to handle the busywork
              so you can focus on what you do best.
            </p>
                    </div>
                  </div>
      </section>

      {/* 7️⃣ PRICING SECTION */}
      <section id="pricing" className="py-20 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-xl text-gray-600">
                Every plan includes the full Jolix toolkit —  Upgrade for more power and growth.
              </p>
                  </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free */}
              <Card className="border-2 border-gray-200 hover:border-[#3C3CFF] transition-all">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                  <p className="text-gray-600 mb-6">For freelancers building their first momentum</p>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">$0</span>
                    <span className="text-gray-600">/month</span>
                    </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Full access to core tools</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">3 active clients/projects per month</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">3 contracts, proposals, and invoices</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">3 forms</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Scheduler + time tracking</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Client Portal with Jolix branding</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">1 editable portfolio (with Jolix branding)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">10 lead credits / month (AI-sourced warm leads)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">10 scheduled posts / month (X only)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Brand Growth Chatbot — 5 prompts / day</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Basic analytics dashboard</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">1 automation rule</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">1 GB file storage</span></li>
                  </ul>
                  {/* <Link href="/auth">
                    <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                      Start for Free
                    </Button>
                  </Link> */}
                  <JoinWaitlistModalButton className="w-full bg-gray-900 hover:bg-gray-800 text-white" />
                </CardContent>
              </Card>

              {/* Pro - Featured */}
              <Card className="border-4 border-[#3C3CFF] relative shadow-xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#3C3CFF] text-white px-6 py-1">Most Popular</Badge>
                    </div>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                  <p className="text-gray-600 mb-6">Best for growing freelancers</p>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">$19</span>
                    <span className="text-gray-600">/month</span>
                    </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Everything in Free</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">20 active clients/projects per month</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited contracts, proposals, and invoices</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">3 forms</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Client Portal (no Jolix branding)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">1 editable portfolio (custom domain support)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">100 lead credits / month</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">100 scheduled posts / month (X + LinkedIn)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Brand Growth Chatbot — 20 prompts / day</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Full analytics dashboard (revenue + engagement)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">5 automation rules</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">10 GB file storage</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Priority email support</span></li>
                  </ul>
                  {/* <Link href="/auth">
                    <Button className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">
                      Upgrade to Pro
                    </Button>
                  </Link> */}
                  <JoinWaitlistModalButton className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white" />
                </CardContent>
              </Card>

              {/* Studio */}
              <Card className="border-2 border-gray-200 hover:border-[#3C3CFF] transition-all">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Studio</h3>
                  <p className="text-gray-600 mb-6">For freelancers ready to grow into a brand</p>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">$39</span>
                    <span className="text-gray-600">/month</span>
                    </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Everything in Pro</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited clients & projects</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited lead credits</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Up to 5 team members</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited scheduled posts (X + LinkedIn)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited contracts, proposals & invoices</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Client Portal (custom domain + no branding)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Brand Growth Chatbot (unlimited prompts)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Advanced analytics + brand performance insights</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Portfolio analytics + engagement tracking</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited automations</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">100 GB file storage</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Early access to automation tools (coming soon)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Priority support</span></li>
                  </ul>
                  {/* <Link href="/auth">
                    <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                      Go Studio
                    </Button>
                  </Link> */}
                  <JoinWaitlistModalButton className="w-full bg-gray-900 hover:bg-gray-800 text-white" />
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-gray-600 mt-8">
              No credit card required • Cancel anytime • 14-day free trial
            </p>
          </div>
        </div>
      </section>

      {/* 8️⃣ FAQ SECTION */}
      <section id="faq" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Frequently asked questions
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to know about Jolix
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-white rounded-lg border-2 border-gray-200 px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900">
                  Is Jolix for freelancers or studios?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Jolix is designed for both. The Free and Pro plans are perfect for independent freelancers, while the Studio plan is built for growing teams that need collaboration tools, extra seats, and unlimited scale.
                </AccordionContent>
              </AccordionItem>


              <AccordionItem value="item-3" className="bg-white rounded-lg border-2 border-gray-200 px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900">
                  Does Jolix charge transaction fees?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Nope. You keep 100% of what you earn. Jolix doesn't take a cut from your payments — ever.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white rounded-lg border-2 border-gray-200 px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900">
                  How does lead generation work?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Jolix uses AI to match you with warm leads based on your skills, industry, and ideal project type. You'll get daily matches sourced from platforms like Reddit, Twitter (X), and more — ready for outreach. Your plan determines how many lead credits you receive per month.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white rounded-lg border-2 border-gray-200 px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900">
                  What's included in the client portal?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Every user gets a beautiful client portal to manage projects, proposals, invoices, and shared files. Free users will see subtle Jolix branding, while Pro and Studio users can remove it or connect their own custom domain for a fully white-labeled experience.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-white rounded-lg border-2 border-gray-200 px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900">
                  What makes Jolix different from Bonsai or HoneyBook?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Jolix isn't just a management tool — it's a growth system. While others focus on admin tasks, Jolix helps you find new clients, grow your brand, and stay organized in one simple platform. From AI lead matching to social scheduling, analytics, and automations — Jolix is built for freelancers who want to scale like studios.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="bg-white rounded-lg border-2 border-gray-200 px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900">
                  Can I post to social media from Jolix?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Yes! You can schedule and publish posts directly from Jolix. Free users can post to X (Twitter), while Pro and Studio plans also unlock LinkedIn scheduling — perfect for building your audience and showcasing your portfolio.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* 🔟 FINAL CTA */}
      <section className="py-20 bg-gradient-to-r from-[#3C3CFF] to-purple-600 text-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-6xl font-bold mb-6">
              Take control of your freelance business today
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              No setup headaches. Just results. Join now to start growing your business.
            </p>
            {/* <Link href="/auth">
              <Button size="lg" className="bg-white text-[#3C3CFF] hover:bg-gray-100 text-lg px-10 py-6 rounded-xl shadow-xl">
                Start Free Trial
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link> */}
            <JoinWaitlistModalButton size="lg" className="bg-white text-[#3C3CFF] hover:bg-gray-100 text-lg px-10 py-6 rounded-xl shadow-xl" />
            <p className="text-sm text-white/80 mt-6">
              14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <Image
                src="/jolixlogo.png"
                alt="Jolix Logo"
                width={32}
                height={32}
                className="w-8 h-8"
                quality={90}
              />
              <span className="text-xl font-bold">Jolix</span>
                </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; 2025 Jolix. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

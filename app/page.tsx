"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  Info,
  Rocket,
  Layout,
  Trophy,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import WaitlistForm from "@/components/WaitlistForm"
import JoinWaitlistModalButton from "@/components/JoinWaitlistModalButton"
import LoomVideoEmbed from "@/components/LoomVideoEmbed"

export default function JolixLanding() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  
  // Enable smooth scrolling
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-3 items-center py-4">
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
            {/* Announcement Pill - Center */}
            <div className="hidden lg:flex justify-center flex-1 min-w-0 px-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100/50 shadow-sm text-sm font-medium text-blue-900 transition-all hover:bg-blue-100/50 cursor-pointer group whitespace-nowrap">
                  <span className="flex items-center gap-1.5">
                      <Badge className="bg-blue-600 text-white hover:bg-blue-700 border-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold flex-shrink-0">New</Badge>
                      <span>Jolix XP Levels are live — turn freelancing into a game.</span>
                  </span>
                  <span className="flex items-center text-blue-600 ml-1 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                      <ArrowRight className="w-3 h-3 ml-1" />
                  </span>
              </div>
            </div>
            <nav className="hidden md:flex items-center justify-end space-x-8">
              <a href="#features" className="text-gray-700 hover:text-[#3C3CFF] transition-colors scroll-smooth">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-[#3C3CFF] transition-colors scroll-smooth">Pricing</a>
              <a href="#faq" className="text-gray-700 hover:text-[#3C3CFF] transition-colors scroll-smooth">FAQ</a>
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
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-50 to-blue-50/30">
        {/* Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-purple-100/40 rounded-full blur-3xl opacity-60"></div>
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto flex flex-col items-center lg:block">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-start">
              {/* LEFT SIDE */}
              <div className="flex flex-col gap-8 text-center lg:text-left pt-4 lg:pt-8 max-w-2xl mx-auto lg:mx-0">
                  {/* Label Pill */}
                  <div className="flex justify-center lg:justify-start">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold tracking-wide uppercase">
                          Freelancer Growth Platform
                      </span>
                  </div>

                  {/* Headline */}
                  <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                      Get clients. Run your business. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Level up.</span>
                  </h1>

                  {/* Subheadline */}
                  <p className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Daily leads, client portals, smart automations—plus everything else your freelance business has been missing.
                  </p>

                  {/* Primary CTAs */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                      <JoinWaitlistModalButton className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-105 font-semibold w-full sm:w-auto" />
                      
                      <Button variant="ghost" className="px-6 py-6 rounded-xl text-slate-700 hover:bg-white/50 hover:text-blue-700 text-lg font-medium group w-full sm:w-auto">
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-3 shadow-sm group-hover:border-blue-200 group-hover:shadow-md transition-all">
                              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-blue-600 border-b-[5px] border-b-transparent ml-0.5"></div>
                          </div>
                          Watch how Jolix works
                      </Button>
                  </div>
                  
                  {/* Reassurance */}
                  <p className="text-sm text-slate-500 font-medium mt-4">
                      Built for freelancers · Setup in under 5 minutes
                  </p>

                
              </div>

              {/* RIGHT SIDE - VISUALS */}
              <div className="relative w-full h-[600px] lg:h-[650px] mt-12 lg:mt-0 perspective-1000 hidden lg:block">
                  
                  {/* Card 1: Lead Engine (Primary - Front & Center) */}
                  <div className="absolute top-8 left-0 z-30 w-[360px] bg-white rounded-2xl shadow-xl border border-slate-100 p-6 transform transition-all hover:scale-[1.02] hover:shadow-2xl duration-500 animate-float-slow">
                     <div className="flex justify-between items-center mb-5">
                         <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Search className="w-4 h-4 text-blue-600" />
                             </div>
                             Today's Leads
                         </h3>
                         <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 shadow-none animate-pulse px-2.5 py-1">+3 new</Badge>
                     </div>
                     <div className="space-y-3">
                         {[
                             { title: "Website redesign", source: "From X", status: "Match", style: "bg-green-50 text-green-700 border-green-200" },
                             { title: "Brand refresh", source: "From Reddit", status: "Match", style: "bg-green-50 text-green-700 border-green-200" }
                         ].map((item, i) => (
                             <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group hover:bg-white hover:shadow-sm">
                                 <div className="flex justify-between items-start mb-2">
                                     <span className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors">{item.title}</span>
                                 </div>
                                 <div className="flex gap-2">
                                     <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1">
                                         <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> {item.source}
                                     </span>
                                     <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${item.style}`}>{item.status}</span>
                                 </div>
                             </div>
                         ))}
                     </div>
                     <div className="mt-5 pt-3 border-t border-slate-100 text-center">
                         <span className="text-xs font-semibold text-blue-600 flex items-center justify-center gap-1 cursor-pointer hover:underline transition-all">
                             Use 1 lead credit to unlock <ArrowRight className="w-3 h-3" />
                         </span>
                     </div>
                  </div>

                  {/* Card 2: Projects & Tasks (Secondary - Slightly Behind Leads Card) */}
                  <div className="absolute top-12 left-[350px] z-20 w-[280px] bg-white rounded-2xl shadow-xl border border-slate-100 p-5 transform rotate-[-2deg] hover:rotate-0 transition-all duration-500 origin-bottom-left group hover:z-40">
                      {/* Top Section */}
                      <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-xs font-semibold text-slate-900">Active Project</span>
                          </div>
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#4647E0] to-[#5757FF] flex items-center justify-center">
                              <FileText className="h-3 w-3 text-white" />
                          </div>
                      </div>

                      {/* Project Title */}
                      <h4 className="text-lg font-bold text-slate-900 mb-4">Brand Redesign</h4>

                      {/* Progress Section */}
                      <div className="mb-4">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-slate-500">Progress</span>
                              <span className="font-semibold text-slate-900">75%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div className="bg-gradient-to-r from-[#4647E0] to-[#5757FF] h-1.5 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                      </div>

                      {/* Bottom Section - Due Date and Budget */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                          <div>
                              <div className="text-xs text-slate-500 mb-1">Due Date</div>
                              <div className="text-xs font-semibold text-slate-900">Jan 28</div>
                          </div>
                          <div>
                              <div className="text-xs text-slate-500 mb-1">Budget</div>
                              <div className="text-xs font-bold text-[#4647E0]">$8,500</div>
                          </div>
                      </div>
                  </div>

                  {/* Card 3: XP System (Restored to Full Card) */}
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[380px] bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 p-5 z-30 transform hover:-translate-y-1 transition-all duration-300">
                      <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm animate-bounce">
                          +20 XP
                      </div>
                      <div className="flex justify-between items-end mb-2">
                          <div>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Level</span>
                              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                  Level 4 <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Serious Builder</span>
                              </h3>
                          </div>
                          <div className="text-right">
                              <span className="text-xs font-bold text-blue-600">700 / 1000 XP</span>
                          </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4 relative">
                          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 w-[70%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                      </div>

                      <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                  <Check className="w-3 h-3" />
                              </div>
                              <span className="line-through text-slate-400">Sent 3 proposals</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                  <Check className="w-3 h-3" />
                              </div>
                              <span className="line-through text-slate-400">Applied to 5 leads</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                              <div className="w-5 h-5 rounded-md border border-slate-300 flex items-center justify-center">
                              </div>
                              <span>Post 3 social updates (+20 XP)</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Bottom Transition Strip */}
          <div className="mt-16 pt-8 border-t border-blue-100/50 flex flex-col md:flex-row items-center justify-between gap-6 opacity-80 hover:opacity-100 transition-opacity">
              <p className="text-slate-500 font-medium text-lg">
                  Jolix isn't just a CRM. It's a <span className="text-blue-600 font-bold">growth system</span>.
              </p>
              <div className="flex flex-col items-center md:items-end gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                      <span>Find Work</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>Run Business</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>Master Craft</span>
                  </div>
                  <a href="#features" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 group">
                      See everything included <ChevronRight className="w-3 h-3 group-hover:translate-y-0.5 transition-transform rotate-90" />
                  </a>
              </div>
          </div>

        </div>
      </section>

      {/* 2️⃣ WEEK IN THE LIFE SECTION */}
      <section className="py-20 lg:py-24 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Side - Visual Card */}
            <div className="relative">
              {/* Background soft gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-3xl blur-3xl transform -rotate-1 scale-105"></div>
              
              {/* Card Container */}
              <div className="relative bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10 overflow-hidden transform transition-all hover:scale-[1.01] duration-500">
                  {/* Floating XP Chip */}
                  <div className="absolute -top--4 -right-0 z-20 mr-4">
                       <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 border-0 px-3 py-1 rounded-full shadow-sm text-xs font-bold flex items-center gap-1 ">
                           +20 XP
                       </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 mb-8">This week in your freelance business</h3>
                  
                  <div className="space-y-6">
                      {/* Row 1 */}
                      <div className="flex items-start gap-4 group">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                          <div>
                              <p className="font-bold text-slate-900 text-lg">+3 new leads added</p>
                              <p className="text-slate-500 text-sm">Lead Engine</p>
                          </div>
                      </div>

                      {/* Row 2 */}
                      <div className="flex items-start gap-4 group">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                          <div>
                              <p className="font-bold text-slate-900 text-lg">1 proposal accepted</p>
                              <p className="text-slate-500 text-sm">Client portal & documents</p>
                          </div>
                      </div>

                      {/* Row 3 */}
                      <div className="flex items-start gap-4 group">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                          <div>
                              <p className="font-bold text-slate-900 text-lg">2 invoices paid</p>
                              <p className="text-slate-500 text-sm">Payments</p>
                          </div>
                      </div>

                      {/* Row 4 */}
                      <div className="flex items-start gap-4 group">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                          <div>
                              <p className="font-bold text-slate-900 text-lg">5 social posts scheduled</p>
                              <p className="text-slate-500 text-sm">Brand growth tools</p>
                          </div>
                      </div>

                      {/* Row 5 */}
                      <div className="flex items-start gap-4 group">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                          <div>
                              <p className="font-bold text-slate-900 text-lg">+120 XP earned</p>
                              <p className="text-slate-500 text-sm">Levels & challenges</p>
                          </div>
                      </div>
                  </div>

                  {/* Bottom Status Line */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                      <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                          You’re building a consistent freelance business. Keep going <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                      </p>
                  </div>
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="space-y-12 text-left">
              <div className="space-y-6 text-left">
                  <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">WHY JOLIX</span>
                  <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                    Why ambitious freelancers choose Jolix.
                  </h2>
                  <p className="text-lg text-slate-600 leading-relaxed max-w-full">
                  Most tools make you choose between getting work and managing it. Jolix does both: leads, client management, social growth, and a gamified leveling system in one platform
                  </p>
              </div>

              {/* Three Outcome Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Col 1 */}
                  <div className="space-y-4">
                      <div className="flex justify-center">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                              <Rocket className="w-5 h-5 text-blue-600" />
                          </div>
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg text-center">More opportunities</h4>
                      <p className="text-slate-600 text-sm leading-relaxed text-left">Daily curated leads and simple social tools to keep work coming in.</p>
                  </div>

                  {/* Col 2 */}
                  <div className="space-y-4">
                      <div className="flex justify-center">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                              <Layout className="w-5 h-5 text-indigo-600" />
                          </div>
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg text-center">Less chaos</h4>
                      <p className="text-slate-600 text-sm leading-relaxed text-left">Clients, projects, invoices, and files organized in one workspace.</p>
                  </div>

                  {/* Col 3 */}
                  <div className="space-y-4">
                      <div className="flex justify-center">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                              <Trophy className="w-5 h-5 text-purple-600" />
                          </div>
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg text-center">Real progress</h4>
                      <p className="text-slate-600 text-sm leading-relaxed text-left">XP levels and challenges that turn freelancing into a game you can win.</p>
                  </div>
              </div>

             
            </div>

          </div>
        </div>
      </section>

      {/* 3️⃣ JOLIX OS SECTION */}
      <section id="features" className="py-20 lg:py-28 bg-white overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Left Side - Text + Flows */}
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">PRODUCT</span>
                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                  Everything your freelance business needs, in one simple OS.
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Jolix replaces your CRM, proposal tool, invoicing app, scheduler, social planner, and tax spreadsheet with one focused workspace built for freelancers.
                </p>
              </div>

              <div className="space-y-10">
                {/* Flow 1 */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-1">
                      <Rocket className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-900">Get clients</h3>
                      <p className="text-slate-600">Turn your skills into a steady stream of opportunities.</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {["Lead Engine", "Marketplace", "Portfolio", "Social scheduler", "AI post ideas"].map((chip) => (
                          <span key={chip} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow 2 */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-1">
                      <Layout className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-900">Run projects</h3>
                      <p className="text-slate-600">Keep every client, project, and file in one place.</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {["Clients & projects", "Client portal", "Proposals & contracts", "Tasks & files", "Forms", "Automations", "Scheduling", "Time tracking"].map((chip) => (
                          <span key={chip} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100">
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow 3 */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 mt-1">
                      <Trophy className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-900">Get paid & grow</h3>
                      <p className="text-slate-600">Stay on top of money, taxes, and your own progress.</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {["Invoices & payments", "Tax tools", "Business analytics", "Brand analytics", "XP levels", "Challenges & milestones"].map((chip) => (
                          <span key={chip} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100">
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            
            </div>

            {/* Right Side - Jolix OS Card */}
            <div className="relative">
              {/* Optional outer labels */}
              <div className="absolute top-[15%] -right-12 lg:-right-16 text-[10px] font-bold text-blue-300 uppercase tracking-widest rotate-90 origin-left hidden xl:block">Get clients</div>
              <div className="absolute top-[50%] -right-12 lg:-right-16 text-[10px] font-bold text-indigo-300 uppercase tracking-widest rotate-90 origin-left hidden xl:block">Run projects</div>
              <div className="absolute bottom-[15%] -right-12 lg:-right-16 text-[10px] font-bold text-purple-300 uppercase tracking-widest rotate-90 origin-left hidden xl:block">Get paid & grow</div>

              <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform hover:scale-[1.01] transition-all duration-500 relative z-10">
                {/* Internal gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 pointer-events-none"></div>
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="ml-2 text-sm font-bold text-slate-700">Jolix OS</span>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase tracking-wide">This week</span>
                </div>

                <div className="p-6 space-y-8 bg-white/80">
                  {/* Top Stats */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="text-sm font-bold text-slate-900">3 new leads</span>
                    </div>
                    <div className="w-px h-4 bg-slate-200"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">$4,200 invoiced</span>
                    </div>
                    <div className="w-px h-4 bg-slate-200"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Level 4</span>
                    </div>
                  </div>

                  {/* Middle Area */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Active Projects */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active projects</h4>
                      
                      <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                        <div className="font-bold text-slate-800 text-sm mb-1">Brand refresh</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          In progress · Due Thu
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm opacity-80">
                        <div className="font-bold text-slate-800 text-sm mb-1">Website redesign</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Proposal sent · 3 days left
                        </div>
                      </div>
                    </div>

                    {/* Next Up */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next up</h4>
                      
                      <div className="flex items-center gap-3 p-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">Call with Luna Studio</div>
                          <div className="text-[10px] text-slate-500">Tomorrow 2 PM</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">Send tax summary</div>
                          <div className="text-[10px] text-slate-500">Friday</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Strip */}
                <div className="px-6 py-3 bg-blue-50/50 border-t border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">Today's Focus</span>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <span className="text-[10px] font-medium text-slate-600 bg-white px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-slate-400"></div> Apply to 1 lead
                    </span>
                    <span className="text-[10px] font-medium text-slate-600 bg-white px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-slate-400"></div> Send 1 proposal
                    </span>
                    <span className="text-[10px] font-medium text-slate-600 bg-white px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-slate-400"></div> Post 1 social update
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4️⃣ WHO IT’S FOR SECTION */}
      <section className="py-20 lg:py-28 bg-gray-50/50">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="max-w-5xl mx-auto">
            
            {/* Top Text */}
            <div className="text-center space-y-4 mb-10">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">WHO IT’S FOR</span>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                Built for ambitious solo freelancers.
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                You’re serious about your craft and ready to treat freelancing like a real business—not a random collection of gigs.
              </p>
            </div>

            {/* Role Chips */}
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {["Designers", "Developers", "Copywriters", "Marketers", "Brand & web studios", "Consultants & strategists"].map((role) => (
                <span key={role} className="px-4 py-2 bg-white text-slate-700 font-medium rounded-full border border-slate-200 shadow-sm hover:border-blue-200 hover:text-blue-700 transition-all cursor-default">
                  {role}
                </span>
              ))}
            </div>

            {/* Two Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Card - It's for you if... */}
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm h-full">
                <h3 className="text-xl font-bold text-slate-900 mb-6">It’s for you if…</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-slate-600 text-sm leading-relaxed">You’re done juggling 5–10 different tools just to run simple projects.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-slate-600 text-sm leading-relaxed">You want more leads, more clarity, and a system that keeps you on track.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-slate-600 text-sm leading-relaxed">You care about looking professional when clients see your portal, emails, and invoices.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-slate-600 text-sm leading-relaxed">You like the idea of tracking your progress and actually feeling yourself grow over time.</span>
                  </li>
                </ul>
              </div>

              {/* Right Card - Not the best fit if... */}
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm h-full">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Jolix might not be the best fit if…</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-slate-400 font-bold text-xs">×</span>
                    </div>
                    <span className="text-slate-500 text-sm leading-relaxed">You’re a large agency with complex teams and custom approval chains.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-slate-400 font-bold text-xs">×</span>
                    </div>
                    <span className="text-slate-500 text-sm leading-relaxed">You need heavy enterprise CRMs, advanced permissions, or deep custom reporting.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-slate-400 font-bold text-xs">×</span>
                    </div>
                    <span className="text-slate-500 text-sm leading-relaxed">You mainly want a bare-bones invoicing tool and don’t care about leads or growth.</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 5️⃣ BRAND GROWTH SECTION */}
      <section className="py-20 lg:py-28 bg-[#0F172A] text-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Left Side - Text & CTA */}
            <div className="space-y-9">
              <div className="space-y-10">
                <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">BRAND GROWTH</span>
                <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight max-w-full">
                  Your brand keeps growing, even when you’re deep in client work.
                </h2>
                <p className="text-lg text-slate-300 leading-relaxed max-w-full">
                  Jolix quietly feeds your pipeline with new leads, portfolio views, and scheduled social posts—without adding more tabs to your day.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <JoinWaitlistModalButton 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg shadow-lg shadow-blue-900/20 font-semibold w-full sm:w-auto transition-all hover:scale-105" 
                  label="Get started for Free"
                />
              </div>
              
           
            </div>

            {/* Right Side - Brand Growth Card */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 lg:p-10 max-w-md mx-auto lg:ml-auto text-slate-900">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-lg text-slate-900">Brand growth this week</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Live</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-8">
                  {/* Row 1 - Leads */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Search className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">7 qualified leads</p>
                      <p className="text-sm text-slate-500">From Lead Engine</p>
                    </div>
                  </div>

                  {/* Row 2 - Portfolio */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">143 portfolio views</p>
                      <p className="text-sm text-slate-500">From your Jolix portfolio</p>
                    </div>
                  </div>

                  {/* Row 3 - Social */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">9 posts scheduled</p>
                      <p className="text-sm text-slate-500">Via social scheduler</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-sm text-slate-400">
                    Your brand doesn’t pause just because you’re working on a project.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6️⃣ JOLIX AI SECTION */}
      <section className="py-20 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-[2.5rem] p-8 lg:p-16 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              
              {/* Left Side - Content */}
              <div className="space-y-8">
                <div className="space-y-8">
                  <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">JOLIX AI CO-PILOT</span>
                  <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                    Jolix AI does the heavy lifting,<br className="hidden lg:block" /> so you can stay in flow.
                  </h2>
                  <p className="text-lg text-slate-600 leading-relaxed max-w-full">
                    While you focus on client work, Jolix AI filters the best leads, drafts social posts, and helps you write proposals and client messages in a few clicks.
                  </p>
                </div>

                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-slate-700 font-medium">Smart lead matching — See the leads most likely to hire you.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-slate-700 font-medium">One-click social drafts — Turn your wins into posts for X & LinkedIn.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-slate-700 font-medium">Proposal & reply writer — Get first drafts you can send or edit in seconds.</span>
                  </li>
                </ul>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                  <JoinWaitlistModalButton 
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 rounded-xl text-lg shadow-lg shadow-slate-900/10 font-semibold w-full sm:w-auto transition-all hover:scale-105" 
                    label="See what Jolix AI can do"
                  />
                </div>
                
                <a href="#features" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors group">
                  Watch Jolix AI in action <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              {/* Right Side - Photo with AI Badges */}
              <div className="relative h-[600px] w-full rounded-2xl overflow-hidden shadow-2xl group">
                <Image
                  src="/manoncomp.jpeg"
                  alt="Freelancer working with Jolix AI"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  quality={90}
                />
                
                {/* Overlay Pills */}
                <div className="absolute top-8 right-8 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-white/50 flex items-center gap-2 animate-float-slow">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-700">AI matched 3 new leads</span>
                </div>

                <div className="absolute bottom-8 right-8 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-white/50 flex items-center gap-2 animate-float-slow delay-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-bold text-slate-700">Social post draft ready</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      
      {/* 🔟 PRICING SECTION */}
      <section id="pricing" className="py-20 lg:py-32 bg-gradient-to-br from-[#F5F7FF] to-[#EEF2FF]">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16 space-y-4">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">PRICING</span>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                Simple plans for serious freelancers.
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Every plan includes the full Jolix Growth Platform. Start free, then level up when you’re ready for more power and leads.
              </p>
            </div>

            {/* Billing Period Toggle */}
            <div className="flex justify-center mb-16">
              <div className="inline-flex items-center p-1 bg-white border border-slate-200 rounded-full shadow-sm">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    billingPeriod === "monthly"
                      ? "bg-[#3C3CFF] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all relative ${
                    billingPeriod === "yearly"
                      ? "bg-[#3C3CFF] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Yearly — save 2 months
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Free Plan */}
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
                  <p className="text-slate-500 text-sm mb-6 min-h-[40px]">For freelancers building their first momentum.</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-5xl font-bold text-slate-900">$0</span>
                    <span className="text-slate-500 font-medium">/month</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Start building your freelance system with core tools and built-in growth.
                  </p>
                </div>

                <div className="mb-8">
                  <JoinWaitlistModalButton
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-6 rounded-xl shadow-lg shadow-slate-900/10"
                    label="Get started free"
                  />
                </div>

                <div className="border-t border-slate-100 pt-8 flex-1">
                  <ul className="space-y-4">
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Full access to core tools</span></li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600 text-sm">2 active clients/projects per month</span>
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Archived clients and completed projects don't count toward your limit.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Unlimited contracts, proposals, and invoices</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">2 live forms</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Scheduler + time tracking</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Client Portal with Jolix branding</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">1 editable portfolio (with Jolix branding)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">10 lead credits / month (AI-sourced warm leads)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">10 scheduled posts / month (X only)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">AI (for social posts and lead filtering)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">1 automation rule</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">1 GB file storage</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Tax tools (basic)</span></li>
                  </ul>
                </div>
              </div>

              {/* Pro Plan - Featured */}
              <div className="relative bg-white rounded-2xl p-8 border-2 border-[#3C3CFF] shadow-xl flex flex-col h-full transform lg:-translate-y-4 z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-[#3C3CFF] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">Most Popular</span>
                </div>
                
                <div className="mb-8 mt-2">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
                  <p className="text-slate-500 text-sm mb-6 min-h-[40px]">Best for growing freelancers.</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    {billingPeriod === "monthly" ? (
                      <>
                        <span className="text-5xl font-bold text-slate-900">$29</span>
                        <span className="text-slate-500 font-medium">/month</span>
                      </>
                    ) : (
                      <>
                        <span className="text-5xl font-bold text-slate-900">$25</span>
                        <span className="text-slate-500 font-medium">/mo billed yearly</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    Add more clients, more leads, and more automation—without more chaos.
                  </p>
                </div>

                <div className="mb-8">
                  <JoinWaitlistModalButton
                    className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white font-semibold py-6 rounded-xl shadow-lg shadow-blue-600/20"
                    label="Level up to Pro"
                  />
                </div>

                <div className="border-t border-slate-100 pt-8 flex-1">
                  <ul className="space-y-4">
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm font-semibold">Everything in Free</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm font-semibold">Jolix AI</span></li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600 text-sm font-semibold">Manage up to 20 active clients/projects simultaneously</span>
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Archived clients and completed projects don't count toward your limit.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Unlimited contracts, proposals, and invoices</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">10 live forms</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Client Portal with custom domain (with Jolix branding)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">1 editable portfolio (custom domain support)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">100 lead credits / month</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">100 scheduled posts / month (X + LinkedIn)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Full analytics dashboard (revenue + engagement)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">5 automation rules</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">10 GB file storage</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">QuickBooks integration</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Tax tools (pro)</span></li>
                  </ul>
                </div>
              </div>

              {/* Premium Plan */}
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Premium</h3>
                  <p className="text-slate-500 text-sm mb-6 min-h-[40px]">For pros building a standout brand.</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    {billingPeriod === "monthly" ? (
                      <>
                        <span className="text-5xl font-bold text-slate-900">$39</span>
                        <span className="text-slate-500 font-medium">/month</span>
                      </>
                    ) : (
                      <>
                        <span className="text-5xl font-bold text-slate-900">$33</span>
                        <span className="text-slate-500 font-medium">/mo billed yearly</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    Everything in Pro, more leads, remove Jolix branding and advanced insights.
                  </p>
                </div>

                <div className="mb-8">
                  <JoinWaitlistModalButton
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-6 rounded-xl shadow-lg shadow-slate-900/10"
                    label="Scale with Premium"
                  />
                </div>

                <div className="border-t border-slate-100 pt-8 flex-1">
                  <ul className="space-y-4">
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm font-semibold">Everything in Pro</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm font-semibold">Jolix AI</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Unlimited clients & projects</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">300 lead credits / month</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Up to 5 team members</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Unlimited scheduled posts (X + LinkedIn)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Unlimited contracts, proposals & invoices</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Unlimited forms</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">White label Client Portal with custom domain</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Remove "powered by Jolix" branding</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Advanced analytics + brand performance insights</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Portfolio analytics + engagement tracking</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Unlimited automations</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">100 GB file storage</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">QuickBooks integration</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Tax tools (premium)</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-[#3C3CFF] mr-3 flex-shrink-0" /><span className="text-slate-600 text-sm">Priority support</span></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Helper Text */}
            <div className="text-center mt-16 space-y-3">
              <p className="text-slate-500">
                Cancel or downgrade any time. Your clients and data stay with you.
              </p>
             
            </div>
          </div>
        </div>
      </section>

      {/* 1️⃣1️⃣ FAQ SECTION */}
      <section id="faq" className="py-20 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">FAQ</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mt-4 mb-4">
              Questions about Jolix? We’ve got you.
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Clear answers on pricing, leads, client portals, and more—so you know exactly what you’re signing up for.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              <p className="text-lg text-slate-600 leading-relaxed">
                Still unsure? Jolix is built to grow with you—from first client to fully booked.
              </p>
              <a href="mailto:support@jolix.io" className="inline-flex items-center text-[#3C3CFF] font-medium hover:text-[#2D2DCC] transition-colors group">
                Didn’t see your question? Contact support <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Right Column - Accordions */}
            <div className="lg:col-span-8">
              <Accordion type="single" collapsible className="space-y-4">
                
                <AccordionItem value="item-1" className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-2">
                  <AccordionTrigger className="text-left font-bold text-slate-900 text-lg hover:no-underline">
                    Who is Jolix really for?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-base leading-relaxed pb-4">
                    Jolix is built for solo freelancers and small studios who want more than a CRM. If you’re tired of duct-taping tools together, want steady leads, and care about looking professional with clients, Jolix is for you—whether you’re just getting started or already fully booked.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-2">
                  <AccordionTrigger className="text-left font-bold text-slate-900 text-lg hover:no-underline">
                    How does lead generation work?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-base leading-relaxed pb-4">
                    Jolix pulls in freelance opportunities from multiple sources, then uses AI to filter them based on your skills, budget preferences, and services. You’ll see a daily list of “matched” leads inside the Lead Engine. You spend credits to unlock full details, apply, and track each opportunity—no endless scrolling through job boards.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-2">
                  <AccordionTrigger className="text-left font-bold text-slate-900 text-lg hover:no-underline">
                    What are lead credits and how many do I get?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-base leading-relaxed pb-4">
                    <div className="space-y-4">
                      <p>Lead credits are what you use to unlock full details for a lead and add it to your pipeline.</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Free:</strong> a small number of credits each month so you can test the Lead Engine.</li>
                        <li><strong>Pro:</strong> a healthy pool of credits for regular outreach.</li>
                        <li><strong>Premium:</strong> a much larger pool of leads.</li>
                      </ul>
                      <p>You can also buy lead packs if you ever need more, without upgrading your plan.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-2">
                  <AccordionTrigger className="text-left font-bold text-slate-900 text-lg hover:no-underline">
                    Does Jolix charge transaction or platform fees?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-base leading-relaxed pb-4">
                    No. Jolix doesn’t take a cut of your client payments. You’ll only pay the standard fees from Stripe or PayPal when your clients pay invoices. Our job is to help you make more, not skim off the top.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-2">
                  <AccordionTrigger className="text-left font-bold text-slate-900 text-lg hover:no-underline">
                    What’s included in the client portal?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-base leading-relaxed pb-4">
                    Your client portal gives every project a polished home base. Clients can view proposals, contracts, invoices, files, messages, and project status in one place. On paid plans you can customize the portal with your own domain and branding so it feels like your studio, not ours.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-2">
                  <AccordionTrigger className="text-left font-bold text-slate-900 text-lg hover:no-underline">
                    How is Jolix different from Bonsai, HoneyBook, or generic CRMs?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-base leading-relaxed pb-4">
                    <p className="mb-4">Most tools focus on admin: contracts, invoices, forms. Jolix does that too—but it also helps you get work and grow your brand.</p>
                    <p>You get daily leads, a portfolio builder, social scheduling, and a gamified XP system that rewards consistent outreach. It’s not just a system of record. It’s a Freelancer Growth Platform.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-2">
                  <AccordionTrigger className="text-left font-bold text-slate-900 text-lg hover:no-underline">
                    Can Jolix help with social media and brand growth?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-base leading-relaxed pb-4">
                    Yes. Jolix includes a simple scheduler for X and LinkedIn, plus AI-generated post ideas based on your projects and wins. You can line up posts for the week, track basic engagement, and see your brand activity alongside your client work.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8" className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-2">
                  <AccordionTrigger className="text-left font-bold text-slate-900 text-lg hover:no-underline">
                    Do I need my own website to use Jolix?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-base leading-relaxed pb-4">
                    No. Jolix includes a portfolio builder so you can launch a clean, on-brand portfolio at yourname.jolix.io in minutes. When you’re ready, paid plans let you connect your own custom domain—no separate website platform required.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9" className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-2">
                  <AccordionTrigger className="text-left font-bold text-slate-900 text-lg hover:no-underline">
                    Can I cancel or switch plans anytime?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-base leading-relaxed pb-4">
                    Absolutely. You can upgrade, downgrade, or cancel your plan whenever you need. Your clients, projects, and data stay in your account—you won’t lose your history just because you change plans.
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* 1️⃣2️⃣ FINAL CTA */}
      <section className="relative pt-20 lg:pt-32 bg-gradient-to-br from-[#3C3CFF] to-purple-600 text-white overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto text-center relative z-10">
          
          <div className="max-w-4xl mx-auto mb-16 space-y-8">
            <span className="text-xs font-bold text-blue-200 tracking-wider uppercase bg-white/10 px-3 py-1 rounded-full">BUILT FOR FREELANCERS</span>
            
            <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
              Run your freelance business like a pro.
            </h2>
            
            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              In under 5 minutes, Jolix gives you daily leads, client portals, and a clear system to grow—without duct-taping tools together.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <JoinWaitlistModalButton 
                className="bg-white text-[#3C3CFF] hover:bg-blue-50 text-lg px-8 py-6 rounded-xl shadow-xl font-bold w-full sm:w-auto" 
                label="Start free"
              />
              <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white text-lg px-8 py-6 rounded-xl font-medium w-full sm:w-auto border border-white/20">
                Watch how Jolix works
              </Button>
            </div>

            <p className="text-sm text-blue-200/80 font-medium">
              14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="relative w-full max-w-5xl mx-auto -mb-1 shadow-2xl rounded-t-2xl overflow-hidden border-t border-x border-white/20 bg-white/5 backdrop-blur-sm">
            <Image
              src="/dashboard.png"
              alt="Jolix Dashboard"
              width={1200}
              height={800}
              className="w-full h-auto rounded-t-lg"
              quality={90}
              priority
            />
          </div>

        </div>
        
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl mix-blend-overlay"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl mix-blend-overlay"></div>
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

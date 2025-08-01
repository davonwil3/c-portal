import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  ArrowRight,
  Star,
  Zap,
  Palette,
  FolderOpen,
  FileText,
  CreditCard,
  MessageCircle,
  Bot,
  Smartphone,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ClientPortalHQLanding() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#3C3CFF] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-[#1A1A1A]">ClientPortalHQ</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-[#3C3CFF] transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-[#3C3CFF] transition-colors">
                Pricing
              </Link>
              <Link href="#faq" className="text-gray-600 hover:text-[#3C3CFF] transition-colors">
                FAQ
              </Link>
              <Button
                variant="outline"
                className="border-[#3C3CFF] text-[#3C3CFF] hover:bg-[#3C3CFF] hover:text-white bg-transparent"
              >
                Sign In
              </Button>
              <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">Try Free</Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A1A1A] leading-tight">
                  A branded client portal your clients will <span className="text-[#3C3CFF]">actually love</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Launch a custom client portal in under 2 minutes — share files, send invoices, onboard smoothly, and
                  keep everything in one professional space.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white px-8 py-4 text-lg">
                  Create Your Free Portal
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-300 text-gray-700 px-8 py-4 text-lg bg-transparent"
                >
                  Watch Demo
                </Button>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200 inline-block">
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-400"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-500"></div>
                  </div>
                  <p className="text-sm text-gray-600 italic">"My client thought I had a whole team."</p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <Image
                  src="/placeholder.svg?height=600&width=800"
                  alt="ClientPortalHQ Dashboard"
                  width={800}
                  height={600}
                  className="rounded-2xl shadow-2xl"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 z-0">
                <Image
                  src="/placeholder.svg?height=300&width=200"
                  alt="Mobile Portal"
                  width={200}
                  height={300}
                  className="rounded-xl shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Framing */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A]">
                Still sending files, updates, and invoices across <span className="text-red-500">five tools?</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                You're a pro. But your client experience feels patched together:
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6 border-red-200 bg-red-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-red-700 text-lg">The Scattered Approach</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Files in Google Drive</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Contracts in DocuSign</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Updates via email</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Invoices in Stripe</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Messages in Slack</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 border-[#3C3CFF] bg-[#F4EFFE]">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[#3C3CFF] text-lg">The ClientPortalHQ Way</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Check className="w-5 h-5 text-[#3C3CFF]" />
                    <span>Everything in one branded portal</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Check className="w-5 h-5 text-[#3C3CFF]" />
                    <span>Professional client experience</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Check className="w-5 h-5 text-[#3C3CFF]" />
                    <span>Streamlined communication</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Check className="w-5 h-5 text-[#3C3CFF]" />
                    <span>Faster payments</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Check className="w-5 h-5 text-[#3C3CFF]" />
                    <span>Better organization</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <p className="text-2xl font-semibold text-[#1A1A1A]">That's not streamlined. It's scattered.</p>
            <p className="text-xl text-[#3C3CFF] font-medium">
              ClientPortalHQ replaces all of it — in one beautiful, branded link.
            </p>
          </div>
        </div>
      </section>

      {/* Lightning-Fast Setup */}
      <section id="features" className="py-20 bg-[#F9FAFB]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-center space-x-3">
                <Zap className="w-8 h-8 text-[#3C3CFF]" />
                <Badge variant="secondary" className="bg-[#F4EFFE] text-[#3C3CFF] border-[#3C3CFF]">
                  Lightning-Fast Setup
                </Badge>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A]">
                From idea to live portal in <span className="text-[#3C3CFF]">under 2 minutes</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                No setup headache. Just enter your logo, pick your colors, and your branded client portal is ready to go
                — before your coffee cools.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-[#3C3CFF] text-white rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <span className="text-lg text-gray-700">Step-by-step onboarding</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-[#3C3CFF] text-white rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <span className="text-lg text-gray-700">Add custom welcome message</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-[#3C3CFF] text-white rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <span className="text-lg text-gray-700">Upload logo, select color theme</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-[#3C3CFF] text-white rounded-full flex items-center justify-center font-semibold">
                    4
                  </div>
                  <span className="text-lg text-gray-700">Custom portal link (yourdomain.clientportalhq.com)</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Setup Process"
                width={600}
                height={500}
                className="rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Fully Branded Experience */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Card className="p-4 border-gray-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-500">Before (Generic)</CardTitle>
                    </CardHeader>
                    <Image
                      src="/placeholder.svg?height=200&width=300"
                      alt="Generic Portal"
                      width={300}
                      height={200}
                      className="rounded-lg"
                    />
                  </Card>
                </div>
                <div className="space-y-4 mt-8">
                  <Card className="p-4 border-[#3C3CFF] bg-[#F4EFFE]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-[#3C3CFF]">After (Branded)</CardTitle>
                    </CardHeader>
                    <Image
                      src="/placeholder.svg?height=200&width=300"
                      alt="Branded Portal"
                      width={300}
                      height={200}
                      className="rounded-lg"
                    />
                  </Card>
                </div>
              </div>
            </div>
            <div className="space-y-8 order-1 lg:order-2">
              <div className="flex items-center space-x-3">
                <Palette className="w-8 h-8 text-[#3C3CFF]" />
                <Badge variant="secondary" className="bg-[#F4EFFE] text-[#3C3CFF] border-[#3C3CFF]">
                  Fully Branded
                </Badge>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A]">
                Your portal. Your brand. <span className="text-[#3C3CFF]">No compromises</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Everything feels like <em>you</em>. Custom colors, your logo, your voice. Clients log in and feel like
                they've entered <em>your</em> software.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Your logo & color scheme</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Personalized portal subdomain</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Branded welcome message</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Clean UI that reflects your professionalism</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organized File Sharing */}
      <section className="py-20 bg-[#F9FAFB]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-center space-x-3">
                <FolderOpen className="w-8 h-8 text-[#3C3CFF]" />
                <Badge variant="secondary" className="bg-[#F4EFFE] text-[#3C3CFF] border-[#3C3CFF]">
                  File Management
                </Badge>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A]">
                Send files, <span className="text-[#3C3CFF]">not confusion</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                No more broken links or email attachments. Share files in an elegant, organized space your clients can
                access anytime.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Drag & drop uploads</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Auto-organized folders</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Preview or download directly</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Unlimited client access</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="File Management Dashboard"
                width={600}
                height={500}
                className="rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Forms, Docs, and Client Intake */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Client Intake Forms"
                width={600}
                height={500}
                className="rounded-2xl shadow-xl"
              />
            </div>
            <div className="space-y-8 order-1 lg:order-2">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-[#3C3CFF]" />
                <Badge variant="secondary" className="bg-[#F4EFFE] text-[#3C3CFF] border-[#3C3CFF]">
                  Forms & Intake
                </Badge>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A]">
                Onboarding that feels <span className="text-[#3C3CFF]">effortless</span>
                <br />
                <span className="text-gray-500 text-2xl">(for you and your client)</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Send contracts, briefs, or intake forms right inside the portal — and track completion without chasing
                emails.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Upload PDFs or use built-in form templates</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Embed intake questionnaires</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">See response status at a glance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Everything stored in one spot</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Invoices & Payments */}
      <section className="py-20 bg-[#F9FAFB]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-8 h-8 text-[#3C3CFF]" />
                <Badge variant="secondary" className="bg-[#F4EFFE] text-[#3C3CFF] border-[#3C3CFF]">
                  Invoices & Payments
                </Badge>
                <Badge className="bg-green-100 text-green-700 border-green-300">NEW</Badge>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A]">
                Send invoices. Get paid. <span className="text-[#3C3CFF]">All in one place</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Skip the back-and-forth. Create branded invoices and let your client pay right through the portal.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Create and send invoices in seconds</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Accept payments via Stripe</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Track payment status & due dates</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Clients pay without logging in</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Invoice Management"
                width={600}
                height={500}
                className="rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Updates and Messaging */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Messaging Interface"
                width={600}
                height={500}
                className="rounded-2xl shadow-xl"
              />
            </div>
            <div className="space-y-8 order-1 lg:order-2">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-8 h-8 text-[#3C3CFF]" />
                <Badge variant="secondary" className="bg-[#F4EFFE] text-[#3C3CFF] border-[#3C3CFF]">
                  Communication
                </Badge>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A]">
                Clear communication, <span className="text-[#3C3CFF]">in context</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Keep your client in the loop — without blowing up their inbox. Post project updates, send quick
                messages, and let them reply inside the portal.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Update threads grouped by project</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Optional email notifications</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Clients can reply inline</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">All conversation history saved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant */}
      <section className="py-20 bg-[#F9FAFB]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-center space-x-3">
                <Bot className="w-8 h-8 text-[#3C3CFF]" />
                <Badge variant="secondary" className="bg-[#F4EFFE] text-[#3C3CFF] border-[#3C3CFF]">
                  AI Assistant
                </Badge>
                <Badge className="bg-orange-100 text-orange-700 border-orange-300">Coming Soon</Badge>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A]">
                Let your portal <span className="text-[#3C3CFF]">answer common questions</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Clients can ask about invoices, deadlines, or project files — and your AI assistant will handle it,
                based on your content and files.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Built-in client Q&A</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Summarizes files & schedules</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Smart reminders</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Works behind the scenes so you don't have to</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="AI Assistant Interface"
                width={600}
                height={500}
                className="rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile View */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="flex justify-center">
                <Image
                  src="/placeholder.svg?height=600&width=300"
                  alt="Mobile Portal Interface"
                  width={300}
                  height={600}
                  className="rounded-3xl shadow-2xl"
                />
              </div>
            </div>
            <div className="space-y-8 order-1 lg:order-2">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-8 h-8 text-[#3C3CFF]" />
                <Badge variant="secondary" className="bg-[#F4EFFE] text-[#3C3CFF] border-[#3C3CFF]">
                  Mobile Optimized
                </Badge>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A]">
                Looks perfect on <span className="text-[#3C3CFF]">every device</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Whether your client is at a desk or on the go, your portal looks clean, professional, and functional.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Mobile-responsive layout</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Tap-to-preview files</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Easy form filling & messages</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#3C3CFF]" />
                  <span className="text-lg text-gray-700">Fast and lightweight</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-[#F9FAFB]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-12">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A]">
                Real freelancers. <span className="text-[#3C3CFF]">Real results</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6 bg-white border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 italic">
                    "My client literally paid faster because everything was so clean."
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-900">Sarah Chen</p>
                      <p className="text-sm text-gray-500">UX Designer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 bg-white border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 italic">
                    "I finally look like the professional I've always been."
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-900">Marcus Rodriguez</p>
                      <p className="text-sm text-gray-500">Marketing Consultant</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 bg-white border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 italic">
                    "ClientPortalHQ saved me 10 hours a week on client management."
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-900">Emma Thompson</p>
                      <p className="text-sm text-gray-500">Web Developer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-12">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A]">
                Simple pricing that <span className="text-[#3C3CFF]">pays for itself</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="p-8 border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center space-y-4">
                  <CardTitle className="text-2xl font-bold">Starter</CardTitle>
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-[#3C3CFF]">
                      $19<span className="text-lg text-gray-500">/mo</span>
                    </p>
                    <p className="text-gray-600">Solo freelancers or creators</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#3C3CFF]" />
                      <span>Up to 3 clients</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#3C3CFF]" />
                      <span>Branded portal</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#3C3CFF]" />
                      <span>File sharing</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#3C3CFF]" />
                      <span>Basic invoicing</span>
                    </div>
                  </div>
                  <Button className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">Start Free Trial</Button>
                </CardContent>
              </Card>

              <Card className="p-8 border-[#3C3CFF] bg-[#F4EFFE] hover:shadow-xl transition-shadow relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-[#3C3CFF] text-white">Most Popular</Badge>
                </div>
                <CardHeader className="text-center space-y-4">
                  <CardTitle className="text-2xl font-bold">Pro</CardTitle>
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-[#3C3CFF]">
                      $49<span className="text-lg text-gray-500">/mo</span>
                    </p>
                    <p className="text-gray-600">Consultants and growing teams</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#3C3CFF]" />
                      <span>Up to 15 clients</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#3C3CFF]" />
                      <span>Everything in Starter</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#3C3CFF]" />
                      <span>Advanced forms</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#3C3CFF]" />
                      <span>Payment processing</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#3C3CFF]" />
                      <span>Priority support</span>
                    </div>
                  </div>
                  <Button className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">Start Free Trial</Button>
                </CardContent>
              </Card>

              <Card className="p-8 border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center space-y-4">
                  <CardTitle className="text-2xl font-bold">Agency</CardTitle>
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-[#3C3CFF]">
                      $99<span className="text-lg text-gray-500">/mo</span>
                    </p>
                    <p className="text-gray-600">Full customization & unlimited clients</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#3C3CFF]" />
                      <span>Unlimited clients</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#3C3CFF]" />
                      <span>Everything in Pro</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#3C3CFF]" />
                      <span>Custom domain</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#3C3CFF]" />
                      <span>White-label options</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#3C3CFF]" />
                      <span>Dedicated support</span>
                    </div>
                  </div>
                  <Button className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">Start Free Trial</Button>
                </CardContent>
              </Card>
            </div>

            <p className="text-gray-600">Start free. No contracts. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-[#F9FAFB]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A]">Frequently asked questions</h2>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-white rounded-lg border border-gray-200">
                <AccordionTrigger className="px-6 py-4 text-left font-semibold">
                  Do my clients need to log in?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  No! Your clients can access their portal with just a link. No passwords, no account creation required.
                  They can bookmark their portal URL and access it anytime.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-white rounded-lg border border-gray-200">
                <AccordionTrigger className="px-6 py-4 text-left font-semibold">How secure is it?</AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  Very secure. We use enterprise-grade encryption, secure file storage, and regular security audits.
                  Your data is protected with the same standards used by major financial institutions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-white rounded-lg border border-gray-200">
                <AccordionTrigger className="px-6 py-4 text-left font-semibold">
                  Can I use my own domain?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  Yes! Pro and Agency plans include custom domain support. You can use something like
                  portal.yourbusiness.com instead of the default ClientPortalHQ subdomain.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white rounded-lg border border-gray-200">
                <AccordionTrigger className="px-6 py-4 text-left font-semibold">
                  What if I'm not tech-savvy?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  ClientPortalHQ is designed for non-technical users. Setup takes under 2 minutes, and our support team
                  is always ready to help. Plus, we have video tutorials for everything.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white rounded-lg border border-gray-200">
                <AccordionTrigger className="px-6 py-4 text-left font-semibold">How do payments work?</AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  We integrate with Stripe for secure payment processing. You can create invoices directly in the
                  portal, and clients can pay with credit cards, bank transfers, or other payment methods.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-white rounded-lg border border-gray-200">
                <AccordionTrigger className="px-6 py-4 text-left font-semibold">
                  Can I try it before I buy?
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  We offer a 14-day free trial with full access to all features. No credit card required. You can set up
                  your portal and test it with real clients before deciding.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-[#3C3CFF] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Look pro. Get paid. Stay organized.</h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              Stop duct-taping your client experience together. Upgrade to a portal that does it all — under your brand.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-[#3C3CFF] hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
                Create Your Free Client Portal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <p className="text-blue-200 text-sm">No credit card. Ready in minutes.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#3C3CFF] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-xl font-bold text-[#1A1A1A]">ClientPortalHQ</span>
              </div>
              <p className="text-gray-600">
                The branded client portal tool made for freelancers, consultants, and small agencies.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-[#1A1A1A]">Product</h4>
              <div className="space-y-2">
                <Link href="#" className="block text-gray-600 hover:text-[#3C3CFF] transition-colors">
                  Features
                </Link>
                <Link href="#" className="block text-gray-600 hover:text-[#3C3CFF] transition-colors">
                  Pricing
                </Link>
                <Link href="#" className="block text-gray-600 hover:text-[#3C3CFF] transition-colors">
                  Templates
                </Link>
                <Link href="#" className="block text-gray-600 hover:text-[#3C3CFF] transition-colors">
                  Integrations
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-[#1A1A1A]">Resources</h4>
              <div className="space-y-2">
                <Link href="#" className="block text-gray-600 hover:text-[#3C3CFF] transition-colors">
                  Help Center
                </Link>
                <Link href="#" className="block text-gray-600 hover:text-[#3C3CFF] transition-colors">
                  Blog
                </Link>
                <Link href="#" className="block text-gray-600 hover:text-[#3C3CFF] transition-colors">
                  Tutorials
                </Link>
                <Link href="#" className="block text-gray-600 hover:text-[#3C3CFF] transition-colors">
                  API Docs
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-[#1A1A1A]">Company</h4>
              <div className="space-y-2">
                <Link href="#" className="block text-gray-600 hover:text-[#3C3CFF] transition-colors">
                  About
                </Link>
                <Link href="#" className="block text-gray-600 hover:text-[#3C3CFF] transition-colors">
                  Contact
                </Link>
                <Link href="#" className="block text-gray-600 hover:text-[#3C3CFF] transition-colors">
                  Privacy
                </Link>
                <Link href="#" className="block text-gray-600 hover:text-[#3C3CFF] transition-colors">
                  Terms
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">© {new Date().getFullYear()} ClientPortalHQ. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <Link href="#" className="text-gray-400 hover:text-[#3C3CFF] transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-[#3C3CFF] transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

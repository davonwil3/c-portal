"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard/layout"
import { ArrowLeft, Plus, Globe } from "lucide-react"
import { toast } from "sonner"
import { createClient } from '@/lib/supabase/client'

interface Client {
  id: string
  first_name: string
  last_name: string
  company: string
  email?: string
}

export default function CreatePortalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [companyName, setCompanyName] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    clientId: "",
    status: "draft"
  })

  // Fetch clients on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Get user's account_id and profile info
          const { data: profile } = await supabase
            .from('profiles')
            .select('account_id, first_name, last_name, role')
            .eq('user_id', user.id)
            .single()

          if (profile?.account_id) {
            // Fetch account info to get company name
            const { data: account } = await supabase
              .from('accounts')
              .select('company_name')
              .eq('id', profile.account_id)
              .single()

            // Use company name from account, or fallback to owner's full name
            if (account?.company_name) {
              setCompanyName(account.company_name)
            } else if (profile.role === 'owner' && profile.first_name && profile.last_name) {
              setCompanyName(`${profile.first_name} ${profile.last_name}`)
            }

            // Fetch clients for this account
            const { data: clientsData } = await supabase
              .from('clients')
              .select('id, first_name, last_name, company, email')
              .eq('account_id', profile.account_id)
              .order('company', { ascending: true })

            if (clientsData) {
              setClients(clientsData)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.clientId) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)
      
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User session not found")
        return
      }

      // Get user's account_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('user_id', user.id)
        .single()

      if (!profile?.account_id) {
        toast.error("Account not found")
        return
      }

      // Get account owner's company name or user name for the slug
      const { data: account } = await supabase
        .from('accounts')
        .select('company_name')
        .eq('id', profile.account_id)
        .single()

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single()
      
      // Generate slug from account owner's company name or user name
      let portalSlug = ''
      if (account?.company_name) {
        portalSlug = account.company_name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      } else if (userProfile?.first_name || userProfile?.last_name) {
        const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
        portalSlug = fullName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      } else {
        portalSlug = 'portal'
      }
      
      // Store just the slug (not the full URL) - URL will be generated dynamically
      const portalUrl = portalSlug

      // Get selected client data
      const selectedClient = clients.find(c => c.id === formData.clientId)
      if (!selectedClient) {
        toast.error("Selected client not found")
        return
      }

      // Generate client slug from client name/company
      const clientSlug = selectedClient.company
        ? selectedClient.company.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
        : `${selectedClient.first_name}-${selectedClient.last_name}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').trim()

      // Check if a portal already exists for this client
      const { data: existingPortal } = await supabase
        .from('portals')
        .select('id, name')
        .eq('client_id', formData.clientId)
        .eq('account_id', profile.account_id)
        .single()

      if (existingPortal) {
        toast.error(`A portal already exists for this client: "${existingPortal.name}". Only one portal per client is allowed.`)
        setLoading(false)
        return
      }

             // Create portal
       const { data: portal, error: portalError } = await supabase
         .from('portals')
         .insert({
           account_id: profile.account_id,
           client_id: formData.clientId,
           name: formData.name,
           description: formData.description,
           url: portalUrl,
           status: formData.status,
           brand_color: "#4647E0", // Default Jolix purple
           access_type: "invite" // Portals are only accessible via magic links
         })
         .select()
         .single()

      if (portalError) {
        throw portalError
      }

      // Add client to allowlist for this portal (if not already exists)
      const { data: existingAllowlist } = await supabase
        .from('client_allowlist')
        .select('id')
        .eq('account_id', profile.account_id)
        .eq('client_id', formData.clientId)
        .single()

      if (!existingAllowlist) {
        const { error: allowlistError } = await supabase
          .from('client_allowlist')
          .insert({
            account_id: profile.account_id,
            client_id: formData.clientId,
            email: selectedClient.email || `${selectedClient.first_name?.toLowerCase()}.${selectedClient.last_name?.toLowerCase()}@example.com`,
            name: selectedClient.first_name && selectedClient.last_name
              ? `${selectedClient.first_name} ${selectedClient.last_name}`
              : selectedClient.company || 'Client',
            company_name: selectedClient.company || `${selectedClient.first_name} ${selectedClient.last_name}` || 'Client Company',
            client_slug: clientSlug,
            is_active: true,
            role: 'client'
          })

        if (allowlistError) {
          console.error('Error adding client to allowlist:', allowlistError)
          // Continue anyway as the portal was created
        } else {
          console.log('Client added to allowlist successfully')
        }
      } else {
        console.log('Client already exists in allowlist')
      }

      // Create default portal modules
      const defaultModules = ['timeline', 'files', 'invoices', 'messages', 'forms']
      const moduleInserts = defaultModules.map(module => ({
        portal_id: portal.id,
        module_name: module,
        is_enabled: true,
        settings: {}
      }))

      const { error: modulesError } = await supabase
        .from('portal_modules')
        .insert(moduleInserts)

      if (modulesError) {
        console.error('Error creating portal modules:', modulesError)
        // Continue anyway as the portal was created
      }

      toast.success("Portal created successfully!")
      router.push("/dashboard/workflow?active=portals")
      
    } catch (error) {
      console.error('Error creating portal:', error)
      toast.error("Failed to create portal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 -m-6 p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Portal</h1>
              <p className="text-gray-600 mt-1">Set up a new client portal</p>
            </div>
          </div>
        </div>

        {/* One Portal Per Client Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-5xl">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">i</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">One Portal Per Client</h3>
              <p className="text-sm text-blue-700 mt-1">
                Each client can only have one portal. If you need to create a new portal for a client who already has one,
                you'll need to delete the existing portal first.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Wider */}
        <div className="max-w-5xl">
          <Card className="bg-white border-0 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-[#3C3CFF]" />
                <span>Portal Details</span>
              </CardTitle>
            </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Portal Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Portal Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Acme Corp Portal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                  placeholder="Describe what this portal is for..."
                value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                />
              </div>

              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company || `${client.first_name} ${client.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clients.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No clients found. <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/dashboard/clients')}>Create a client first</Button>
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
            </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Portal
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

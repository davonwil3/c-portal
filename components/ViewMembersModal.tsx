"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Users, Mail, Calendar, Crown, User } from "lucide-react"
import { toast } from "sonner"

interface Member {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  created_at: string
  is_main_client: boolean
  portal_access: string
}

interface Portal {
  id: string
  name: string
  url: string
}

interface MainClient {
  id: string
  name: string
  email: string
  company: string
}

interface ViewMembersModalProps {
  isOpen: boolean
  onClose: () => void
  portalId: string
  portalName: string
}

export default function ViewMembersModal({ 
  isOpen, 
  onClose, 
  portalId, 
  portalName 
}: ViewMembersModalProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [mainClient, setMainClient] = useState<MainClient | null>(null)
  const [portal, setPortal] = useState<Portal | null>(null)
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    if (isOpen && portalId) {
      fetchMembers()
    }
  }, [isOpen, portalId])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/portals/${portalId}/members`)
      const result = await response.json()

      if (result.success) {
        setMembers(result.data.members)
        setMainClient(result.data.main_client)
        setPortal(result.data.portal)
        setTotalCount(result.data.total_count)
      } else {
        toast.error(result.message || 'Failed to fetch members')
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to fetch members')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadgeColor = (role: string, isMainClient: boolean) => {
    if (isMainClient) {
      return "bg-purple-100 text-purple-700 border-purple-200"
    }
    switch (role.toLowerCase()) {
      case 'admin':
        return "bg-red-100 text-red-700 border-red-200"
      case 'manager':
        return "bg-blue-100 text-blue-700 border-blue-200"
      case 'client':
        return "bg-green-100 text-green-700 border-green-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Portal Members - {portalName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF] mx-auto mb-4" />
                <p className="text-gray-600">Loading members...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Portal Info */}
              {portal && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">{portal.name}</h3>
                        <p className="text-sm text-blue-700">Portal URL: {portal.url}</p>
                      </div>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                        {totalCount} member{totalCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Main Client Info */}
              {mainClient && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Crown className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-purple-900">Main Client</h4>
                        <p className="text-sm text-purple-700">{mainClient.name}</p>
                        <p className="text-xs text-purple-600">{mainClient.email}</p>
                        {mainClient.company && (
                          <p className="text-xs text-purple-600">{mainClient.company}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Members List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  All Members ({members.length})
                </h4>
                
                {members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No members found for this portal</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <Card key={member.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] font-medium">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium text-gray-900">{member.name}</h5>
                                  {member.is_main_client && (
                                    <Crown className="h-4 w-4 text-purple-600" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="h-3 w-3" />
                                  {member.email}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  Added {formatDate(member.created_at)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={getRoleBadgeColor(member.role, member.is_main_client)}
                              >
                                {member.is_main_client ? 'Main Client' : member.role}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={member.is_active ? 
                                  "bg-green-100 text-green-700 border-green-200" : 
                                  "bg-gray-100 text-gray-700 border-gray-200"
                                }
                              >
                                {member.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

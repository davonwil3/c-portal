"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, X, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface AddMembersModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName: string
  accountId: string
}

interface MemberData {
  email: string
  name: string
  role: string
}

export default function AddMembersModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  accountId,
}: AddMembersModalProps) {
  const [members, setMembers] = useState<MemberData[]>([
    { email: "", name: "", role: "view only" }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const addMemberRow = () => {
    setMembers([...members, { email: "", name: "", role: "" }])
  }

  const removeMemberRow = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index))
    }
  }

  const updateMember = (index: number, field: keyof MemberData, value: string) => {
    const newMembers = [...members]
    newMembers[index][field] = value
    setMembers(newMembers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const validMembers = members.filter(member => 
      member.email.trim() && member.name.trim()
    )

    if (validMembers.length === 0) {
      setError("Please add at least one member with email and name")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Add members to allowlist
      const response = await fetch('/api/client-portal/add-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          clientId, // Pass the clientId to the API
          members: validMembers
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Added ${validMembers.length} member(s) to ${clientName}`)
        onClose()
        setMembers([{ email: "", name: "", role: "view only" }])
        setError("")
      } else {
        setError(result.message || "Failed to add members")
        toast.error(result.message || "Failed to add members")
      }
    } catch (error) {
      setError("Failed to add members. Please try again.")
      toast.error("Failed to add members")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setMembers([{ email: "", name: "", role: "" }])
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Add Members to {clientName}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Add team members who can access the client portal
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {members.map((member, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 p-4 border border-gray-200 rounded-lg">
                <div className="col-span-5">
                  <Label htmlFor={`email-${index}`} className="text-sm font-medium">
                    Email *
                  </Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    placeholder="member@company.com"
                    value={member.email}
                    onChange={(e) => updateMember(index, 'email', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div className="col-span-4">
                  <Label htmlFor={`name-${index}`} className="text-sm font-medium">
                    Name *
                  </Label>
                  <Input
                    id={`name-${index}`}
                    type="text"
                    placeholder="Full Name"
                    value={member.name}
                    onChange={(e) => updateMember(index, 'name', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor={`role-${index}`} className="text-sm font-medium">
                    Role
                  </Label>
                  <Select
                    value={member.role || "view only"}
                    onValueChange={(value) => updateMember(index, 'role', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="view only">View Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMemberRow(index)}
                    disabled={members.length === 1}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addMemberRow}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Member
          </Button>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Members...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Members
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
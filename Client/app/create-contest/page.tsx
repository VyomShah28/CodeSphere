"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, Clock, Users, Plus, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Footer } from "@/components/footer"

export default function CreateContest() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    maxEntries: "",
    isPublic: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required field validations
    if (!formData.name.trim()) {
      newErrors.name = "Contest name is required"
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required"
    }
    if (!formData.startTime) {
      newErrors.startTime = "Start time is required"
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required"
    }
    if (!formData.endTime) {
      newErrors.endTime = "End time is required"
    }

    // Date/time validation
    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)

      if (endDateTime <= startDateTime) {
        newErrors.endTime = "End time must be after start time"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      router.push("/challenge-editor")
    }, 1500)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Create Contest</h1>
            <p className="text-slate-600">Set up your coding competition</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-6 w-6 text-emerald-600" />
              <span>Contest Details</span>
            </CardTitle>
            <CardDescription>Fill in the basic information about your contest</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contest Name */}
              <div className="space-y-2">
                <Label htmlFor="contest-name">Contest Name *</Label>
                <Input
                  id="contest-name"
                  placeholder="e.g., Weekly Algorithm Challenge #43"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <div className="flex items-center space-x-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your contest..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-medium">Start Date & Time</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="start-date">Date *</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange("startDate", e.target.value)}
                        className={errors.startDate ? "border-red-500" : ""}
                      />
                      {errors.startDate && (
                        <div className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.startDate}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="start-time">Time *</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange("startTime", e.target.value)}
                        className={errors.startTime ? "border-red-500" : ""}
                      />
                      {errors.startTime && (
                        <div className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.startTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="h-5 w-5 text-rose-600" />
                    <h3 className="font-medium">End Date & Time</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="end-date">Date *</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange("endDate", e.target.value)}
                        className={errors.endDate ? "border-red-500" : ""}
                      />
                      {errors.endDate && (
                        <div className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.endDate}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="end-time">Time *</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => handleInputChange("endTime", e.target.value)}
                        className={errors.endTime ? "border-red-500" : ""}
                      />
                      {errors.endTime && (
                        <div className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.endTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Contest Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="max-entries">Maximum Participants</Label>
                  <Input
                    id="max-entries"
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={formData.maxEntries}
                    onChange={(e) => handleInputChange("maxEntries", e.target.value)}
                  />
                  <p className="text-sm text-slate-500">Optional: Set a limit on the number of participants</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Contest Visibility</Label>
                  <Select defaultValue="public">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Public - Anyone can join</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Private - Invite only</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Continue to Challenge Editor"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}

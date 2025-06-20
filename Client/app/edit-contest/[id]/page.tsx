"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, Clock, Users, Save, AlertCircle } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { Footer } from "@/components/footer"
import axios from "axios"
import { Form } from "react-hook-form"

export default function EditContest() {
  const router = useRouter()
  const params = useParams()
  const [formData, setFormData] = useState({
    contest_name: "",
    description: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    number_of_entries: "",
    isPublic: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchContestDetails = async () => {
      setIsLoading(true)
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/contest_details?contestId=' + params.id)
        if (response.status !== 200) {
          console.error("Failed to fetch contest details")
        }
        console.log("Contest details fetched successfully:", response.data)
        setFormData(response.data)
        setIsLoading(false)
      }
      catch (error) {
        console.error("Error fetching contest details:", error)
        setIsLoading(false)
      }
    }
    fetchContestDetails()
  }, [params.id])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.contest_name.trim()) {
      newErrors.name = "Contest name is required"
    }
    if (!formData.start_date) {
      newErrors.startDate = "Start date is required"
    }
    if (!formData.start_time) {
      newErrors.startTime = "Start time is required"
    }
    if (!formData.end_date) {
      newErrors.endDate = "End date is required"
    }
    if (!formData.end_time) {
      newErrors.endTime = "End time is required"
    }

    if (formData.start_date && formData.start_time && formData.end_date && formData.end_time) {
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`)
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`)

      if (endDateTime <= startDateTime) {
        newErrors.endTime = "End time must be after start time"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      console.error("Form validation failed with errors:", errors)
      return
    }
    setIsSaving(true)
    await axios.put('http://127.0.0.1:8000/api/create-contest/?contestId='+params.id, {
      editedData : formData
    })
    setIsSaving(false);
    console.log("Submitting form with data:", formData);
    router.push("/challenge-editor?contestId=" + params.id+'&&edited='+true)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading contest details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/contests")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Edit Contest</h1>
            <p className="text-slate-600">Update your contest details</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Save className="h-6 w-6 text-emerald-600" />
              <span>Contest Details</span>
            </CardTitle>
            <CardDescription>Update the information about your contest</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="contest-name">Contest Name *</Label>
                <Input
                  id="contest-name"
                  placeholder="e.g., Weekly Algorithm Challenge #43"
                  value={formData.contest_name}
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
                        value={formData.start_date}
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
                        value={formData.start_time}
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
                        value={formData.end_date}
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
                        value={formData.end_time}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="max-entries">Maximum Participants</Label>
                  <Input
                    id="max-entries"
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={Number(formData.number_of_entries) === 2147483647 ? "" : formData.number_of_entries}
                    onChange={(e) => handleInputChange("maxEntries", e.target.value)}
                  />
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

              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={() => router.push("/contests")}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSaving} onClick={handleSubmit}>
                  {isSaving ? "Saving..." : "Save Changes"}
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

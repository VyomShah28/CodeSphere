"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Edit, Trash2, Upload, FileText, Star, CheckCircle, Sparkles, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Footer } from "@/components/footer"

interface Challenge {
  id: string
  name: string
  difficulty: "Easy" | "Medium" | "Hard"
  score: number
  description: string
  constraints: string
  inputFormat: string
  outputFormat: string
  sampleInput: string
  sampleOutput: string
}

export default function ChallengeEditor() {
  const router = useRouter()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isAddingChallenge, setIsAddingChallenge] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<string | null>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentChallenge, setCurrentChallenge] = useState({
    name: "",
    difficulty: "Medium" as const,
    score: 100,
    description: "",
    constraints: "",
    inputFormat: "",
    outputFormat: "",
    sampleInput: "",
    sampleOutput: "",
  })

  const validateChallenge = () => {
    const newErrors: Record<string, string> = {}

    if (!currentChallenge.name.trim()) {
      newErrors.name = "Challenge name is required"
    }
    if (!currentChallenge.description.trim()) {
      newErrors.description = "Problem description is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddChallenge = () => {
    if (!validateChallenge()) {
      return
    }

    const newChallenge: Challenge = {
      id: Date.now().toString(),
      ...currentChallenge,
    }
    setChallenges([...challenges, newChallenge])
    setCurrentChallenge({
      name: "",
      difficulty: "Medium",
      score: 100,
      description: "",
      constraints: "",
      inputFormat: "",
      outputFormat: "",
      sampleInput: "",
      sampleOutput: "",
    })
    setIsAddingChallenge(false)
    setErrors({})
  }

  const handleGenerateAI = () => {
    setIsGeneratingAI(true)
    // Simulate AI generation
    setTimeout(() => {
      setCurrentChallenge({
        ...currentChallenge,
        name: "Two Sum Problem",
        description:
          "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
        constraints:
          "• 2 ≤ nums.length ≤ 10^4\n• -10^9 ≤ nums[i] ≤ 10^9\n• -10^9 ≤ target ≤ 10^9\n• Only one valid answer exists.",
        inputFormat:
          "The first line contains an integer n, the length of the array.\nThe second line contains n space-separated integers representing the array.\nThe third line contains the target integer.",
        outputFormat: "Return two space-separated integers representing the indices of the two numbers.",
        sampleInput: "4\n2 7 11 15\n9",
        sampleOutput: "0 1",
      })
      setIsGeneratingAI(false)
    }, 2000)
  }

  const handleDeleteChallenge = (id: string) => {
    setChallenges(challenges.filter((c) => c.id !== id))
  }

  const handleSubmitContest = () => {
    if (challenges.length > 0) {
      router.push("/contests")
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setCurrentChallenge((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/create-contest")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Challenge Editor</h1>
              <p className="text-slate-600">Add coding challenges to your contest</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{challenges.length} Challenges</Badge>
            {challenges.length > 0 && (
              <Button onClick={handleSubmitContest} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Contest
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Challenges List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Challenges</span>
                  <Button
                    size="sm"
                    onClick={() => setIsAddingChallenge(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {challenges.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No challenges added yet</p>
                    <p className="text-sm">Click "Add" to create your first challenge</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {challenges.map((challenge) => (
                      <div key={challenge.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{challenge.name}</h4>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost" onClick={() => setEditingChallenge(challenge.id)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteChallenge(challenge.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className={getDifficultyColor(challenge.difficulty)}>{challenge.difficulty}</Badge>
                          <span className="text-sm text-slate-500">{challenge.score} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Challenge Form */}
          <div className="lg:col-span-2">
            {isAddingChallenge || editingChallenge ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{editingChallenge ? "Edit Challenge" : "Add New Challenge"}</CardTitle>
                      <CardDescription>Create a comprehensive coding challenge for participants</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI}
                      className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:from-violet-100 hover:to-purple-100"
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-violet-600" />
                      {isGeneratingAI ? "Generating..." : "Generate with AI"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="challenge-name">Challenge Name *</Label>
                      <Input
                        id="challenge-name"
                        placeholder="e.g., Two Sum Problem"
                        value={currentChallenge.name}
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
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select
                        value={currentChallenge.difficulty}
                        onValueChange={(value: "Easy" | "Medium" | "Hard") => handleInputChange("difficulty", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-green-500" />
                              <span>Easy</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Medium">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span>Medium</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Hard">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-red-500" />
                              <span>Hard</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="score">Score per Challenge</Label>
                    <Input
                      id="score"
                      type="number"
                      value={currentChallenge.score}
                      onChange={(e) => handleInputChange("score", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>

                  {/* Problem Description - Simulated TinyMCE */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Problem Description *</Label>
                    <div className="border rounded-lg">
                      <div className="border-b bg-slate-50 p-2 flex items-center space-x-2 text-sm">
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          B
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          I
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          U
                        </Button>
                        <div className="w-px h-4 bg-slate-300" />
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          Code
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          Link
                        </Button>
                      </div>
                      <Textarea
                        id="description"
                        placeholder="Describe the problem statement in detail..."
                        rows={4}
                        value={currentChallenge.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        className={`border-0 resize-none focus:ring-0 ${errors.description ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.description && (
                      <div className="flex items-center space-x-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.description}</span>
                      </div>
                    )}
                  </div>

                  {/* Constraints - Simulated TinyMCE */}
                  <div className="space-y-2">
                    <Label htmlFor="constraints">Constraints</Label>
                    <div className="border rounded-lg">
                      <div className="border-b bg-slate-50 p-2 flex items-center space-x-2 text-sm">
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          B
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          I
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          List
                        </Button>
                      </div>
                      <Textarea
                        id="constraints"
                        placeholder="e.g., 1 ≤ n ≤ 10^5, 1 ≤ arr[i] ≤ 10^9"
                        rows={2}
                        value={currentChallenge.constraints}
                        onChange={(e) => handleInputChange("constraints", e.target.value)}
                        className="border-0 resize-none focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* Input/Output Format */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="input-format">Input Format</Label>
                      <div className="border rounded-lg">
                        <div className="border-b bg-slate-50 p-2 flex items-center space-x-2 text-sm">
                          <Button size="sm" variant="ghost" className="h-6 px-2">
                            Code
                          </Button>
                        </div>
                        <Textarea
                          id="input-format"
                          placeholder="Describe the input format..."
                          rows={3}
                          value={currentChallenge.inputFormat}
                          onChange={(e) => handleInputChange("inputFormat", e.target.value)}
                          className="border-0 resize-none focus:ring-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="output-format">Output Format</Label>
                      <div className="border rounded-lg">
                        <div className="border-b bg-slate-50 p-2 flex items-center space-x-2 text-sm">
                          <Button size="sm" variant="ghost" className="h-6 px-2">
                            Code
                          </Button>
                        </div>
                        <Textarea
                          id="output-format"
                          placeholder="Describe the expected output format..."
                          rows={3}
                          value={currentChallenge.outputFormat}
                          onChange={(e) => handleInputChange("outputFormat", e.target.value)}
                          className="border-0 resize-none focus:ring-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sample Test Case */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sample-input">Sample Input</Label>
                      <Textarea
                        id="sample-input"
                        placeholder="Provide sample input..."
                        rows={3}
                        value={currentChallenge.sampleInput}
                        onChange={(e) => handleInputChange("sampleInput", e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sample-output">Sample Output</Label>
                      <Textarea
                        id="sample-output"
                        placeholder="Expected output for sample input..."
                        rows={3}
                        value={currentChallenge.sampleOutput}
                        onChange={(e) => handleInputChange("sampleOutput", e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-4">
                    <Label>Test Case Files</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-emerald-300 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm text-slate-600 mb-2">Upload Input File</p>
                        <Button variant="outline" size="sm">
                          Choose File
                        </Button>
                      </div>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-emerald-300 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm text-slate-600 mb-2">Upload Output File</p>
                        <Button variant="outline" size="sm">
                          Choose File
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingChallenge(false)
                        setEditingChallenge(null)
                        setErrors({})
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddChallenge} className="bg-emerald-600 hover:bg-emerald-700">
                      Add Challenge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Plus className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">Ready to add challenges?</h3>
                  <p className="text-slate-500 mb-4">Click "Add" to create your first coding challenge</p>
                  <Button onClick={() => setIsAddingChallenge(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Challenge
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

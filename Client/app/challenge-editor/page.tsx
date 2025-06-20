"use client"

import { useEffect, useState } from "react"
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
import { useSearchParams } from "next/navigation"
import axios from "axios"
import { useRef } from "react"

interface Challenge {
  id: string
  challenge_name: string
  difficulty_level: "Easy" | "Medium" | "Hard"
  max_score: number
  problem_statement: string
  constraints: string
  input_form: string
  output_form: string
  sample_testcase: string
  sample_output: string
  input_testcase : File
  output_testcase : File
}

export default function ChallengeEditor() {
  const router = useRouter()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isAddingChallenge, setIsAddingChallenge] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<string | null>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const searchParams = useSearchParams()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const input = useRef<HTMLInputElement | null>(null);
  const output = useRef<HTMLInputElement | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState({
    challenge_name: "",
    difficulty_level: "Easy" as "Easy" | "Medium" | "Hard",
    max_score: 100,
    problem_statement: "",
    constraints: "",
    input_form: "",
    output_form: "",
    sample_testcase: "",
    sample_output: "",
    input_testcase: null as unknown as File,
    output_testcase: null as unknown as File,
  })

  const validateChallenge = () => {
    const newErrors: Record<string, string> = {}

    if (!currentChallenge.challenge_name.trim()) {
      newErrors.challenge_name = "Challenge name is required"
    }
    if (!currentChallenge.problem_statement.trim()) {
      newErrors.problem_statement = "Problem description is required"
    }

    if (!currentChallenge.constraints.trim()) {
      newErrors.constraints = "Constraints are required"
    }

    if (!currentChallenge.input_form.trim()) {
      newErrors.input_form = "Input format is required"
    }

    if (!currentChallenge.output_form.trim()) {
      newErrors.output_form = "Output format is required"
    }

    if (!currentChallenge.sample_testcase.trim()) {
      newErrors.sample_testcase = "Sample input is required"
    }

    if (!currentChallenge.sample_output.trim()) {
      newErrors.sample_output = "Sample output is required"
    }

    if (!currentChallenge.input_testcase || !currentChallenge.output_testcase) {        
      newErrors.files = "Both input and output files must be uploaded"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddChallenge = () => {
    if (!validateChallenge()) {
      return
    }

    if (editingChallenge) {
      const updatedChallenges = challenges.map((challenge) =>
        challenge.id === editingChallenge ? { ...challenge, ...currentChallenge } : challenge
      )
      setChallenges(updatedChallenges)
      setEditingChallenge(null)
    }
    else {
      const newChallenge: Challenge = {
        id: Date.now().toString(),
        ...currentChallenge,
      }
      console.log(challenges)
      setChallenges([...challenges, newChallenge])
      console.log(newChallenge)
    }
    setCurrentChallenge({
      challenge_name: "",
      difficulty_level: "Easy",
      max_score: 100,
      problem_statement: "",
      constraints: "",
      input_form: "",
      output_form: "",
      sample_testcase: "",
      sample_output: "",
      input_testcase: null as unknown as File,
      output_testcase: null as unknown as File,
    })
    setIsAddingChallenge(false)
    setErrors({})
  }

  const handleEditChallenge = (id: string) => {
    const challengeToEdit = challenges.find((c) => c.id === id)
    if (challengeToEdit) {
      setCurrentChallenge({
        challenge_name: challengeToEdit.challenge_name,
        difficulty_level: challengeToEdit.difficulty_level,
        max_score: challengeToEdit.max_score,
        problem_statement: challengeToEdit.problem_statement,
        constraints: challengeToEdit.constraints,
        input_form: challengeToEdit.input_form,
        output_form: challengeToEdit.output_form,
        sample_testcase: challengeToEdit.sample_testcase,
        sample_output: challengeToEdit.sample_output,
        input_testcase: challengeToEdit.input_testcase,
        output_testcase: challengeToEdit.output_testcase,
      })
      setEditingChallenge(id)
      setIsAddingChallenge(true)
    }
  }

  const handleGenerateAI = () => {
    setIsGeneratingAI(true)
    setTimeout(() => {
      setCurrentChallenge({
        ...currentChallenge,
        challenge_name: "Two Sum Problem",
        problem_statement:
          "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
        constraints:
          "• 2 ≤ nums.length ≤ 10^4\n• -10^9 ≤ nums[i] ≤ 10^9\n• -10^9 ≤ target ≤ 10^9\n• Only one valid answer exists.",
        input_form:
          "The first line contains an integer n, the length of the array.\nThe second line contains n space-separated integers representing the array.\nThe third line contains the target integer.",
        output_form: "Return two space-separated integers representing the indices of the two numbers.",
        sample_testcase: "4\n2 7 11 15\n9",
        sample_output: "0 1",
      })
      setIsGeneratingAI(false)
    }, 2000)
  }

  const handleDeleteChallenge = (id: string) => {
    setChallenges(challenges.filter((c) => c.id !== id))
  }

  const handleSubmitContest = async () => {
    if (challenges.length > 0) {
      const formData = new FormData();
  
      challenges.forEach((challenge, idx) => {
        formData.append(`challenges[${idx}][id]`,challenge.id)
        formData.append(`challenges[${idx}][challenge_name]`, challenge.challenge_name);
        formData.append(`challenges[${idx}][difficulty_level]`, challenge.difficulty_level);
        formData.append(`challenges[${idx}][max_score]`, challenge.max_score.toString());
        formData.append(`challenges[${idx}][problem_statement]`, challenge.problem_statement);
        formData.append(`challenges[${idx}][constraints]`, challenge.constraints);
        formData.append(`challenges[${idx}][input_form]`, challenge.input_form);
        formData.append(`challenges[${idx}][output_form]`, challenge.output_form);
        formData.append(`challenges[${idx}][sample_testcase]`, challenge.sample_testcase);
        formData.append(`challenges[${idx}][sample_output]`, challenge.sample_output);
        if (challenge.input_testcase) {
          formData.append(`challenges[${idx}][input_testcase]`, challenge.input_testcase);
        }
        if (challenge.output_testcase) {
          formData.append(`challenges[${idx}][output_testcase]`, challenge.output_testcase);
        }
      });
  
      formData.append("contest_id", searchParams.get('contestId')!);
  
      try {
        const response = await axios.post('http://127.0.1:8000/api/challenge-editor/', formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
  
        if (response.status !== 201) throw new Error("Failed to submit contest");
  
        console.log("Contest submitted successfully:", response.data);
        router.push("/contests");
  
      } catch (error) {
        console.error("Error submitting challenge:", error);
      }
    }
  };
  

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
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleButtonClick = (type: "input" | "output") => () => {
    if (type === "input") {
      input.current?.click();
    } else {
      output.current?.click();
    }
  };

  const handleFileChange = (type: "input" | "output") => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log(`${type} file selected:`, file.name);
      if (type === "input") {
        setCurrentChallenge((prev) => ({ ...prev, input_testcase: file }));
      } else {
        setCurrentChallenge((prev) => ({ ...prev, output_testcase: file }));
      }
    }
  };

  useEffect(() => { 
    console.log("Hello")
    const contestId = searchParams.get('contestId');
    const EditChallenge = async () => {
      const response = await axios.get('http://127.0.0.1:8000/api/get-challenges/?contestId='+contestId)
      if (response.status === 200) {
        const data = response.data;
        console.log(data);
        setChallenges(response.data)
      }
    }
    EditChallenge();
  }, [searchParams.get('edited')])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/edit-contest/${searchParams.get('contestId')}`)}>
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
                          <h4 className="font-medium text-sm">{challenge.challenge_name}</h4>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEditChallenge(challenge.id)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteChallenge(challenge.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className={getDifficultyColor(challenge.difficulty_level)}>{challenge.difficulty_level}</Badge>
                          <span className="text-sm text-slate-500">{challenge.max_score} pts</span>
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
                        value={currentChallenge.challenge_name}
                        onChange={(e) => handleInputChange("challenge_name", e.target.value)}
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
                        value={currentChallenge.difficulty_level}
                        onValueChange={(value: "Easy" | "Medium" | "Hard") => handleInputChange("difficulty_level", value)}
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
                      value={currentChallenge.max_score}
                      onChange={(e) => handleInputChange("max_score", Number.parseInt(e.target.value) || 0)}
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
                        value={currentChallenge.problem_statement}
                        onChange={(e) => handleInputChange("problem_statement", e.target.value)}
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
                          value={currentChallenge.input_form}
                          onChange={(e) => handleInputChange("input_form", e.target.value)}
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
                          value={currentChallenge.output_form}
                          onChange={(e) => handleInputChange("output_form", e.target.value)}
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
                        value={currentChallenge.sample_testcase}
                        onChange={(e) => handleInputChange("sample_testcase", e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sample-output">Sample Output</Label>
                      <Textarea
                        id="sample-output"
                        placeholder="Expected output for sample input..."
                        rows={3}
                        value={currentChallenge.sample_output}
                        onChange={(e) => handleInputChange("sample_output", e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-4">
                    <Label>Test Case Files</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-emerald-300 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600 mb-2 text-center">Upload Input File</p>
                    <div className="text-center">
                      <input type="file" ref={input} onChange={handleFileChange("input")} className="hidden" />
                          <Button variant="outline" size="sm" onClick={handleButtonClick("input")}>
                        Choose File
                      </Button>
                    </div>
                  </div>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-emerald-300 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm text-slate-600 mb-2">Upload Output File</p>
                        <input type="file" ref={output} onChange={handleFileChange("output")} className="hidden" />
                        <Button variant="outline" size="sm" onClick={handleButtonClick("output")}>
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

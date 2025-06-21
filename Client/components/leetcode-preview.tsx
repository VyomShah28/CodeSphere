"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Brain, CheckCircle, Loader2, AlertCircle, Lock } from "lucide-react"

interface LeetCodePreviewProps {
  problemData: {
    title: string
    description: string
    difficulty: string
    constraints: string
    sampleInput: string
    sampleOutput: string
    solutions: {
      cpp: string
      java: string
      python: string
    }
  }
  onGenerateTestCases: () => void
  onVerifyTestCases: () => void
  onAddChallenge: () => void
  testCases?: {
    input: string
    output: string
  }
  isGenerating: boolean
  isVerifying: boolean
  verificationResult?: {
    success: boolean
    message: string
  }
}

export function LeetCodePreview({
  problemData,
  onGenerateTestCases,
  onVerifyTestCases,
  onAddChallenge,
  testCases,
  isGenerating,
  isVerifying,
  verificationResult,
}: LeetCodePreviewProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Problem Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center space-x-2">
                <span>{problemData.title}</span>
                <Lock className="h-5 w-5 text-slate-400" />
              </CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <span>Imported from LeetCode</span>
                <Badge variant="outline" className="text-xs">
                  Read-only
                </Badge>
              </CardDescription>
            </div>
            <Badge className={getDifficultyColor(problemData.difficulty)}>{problemData.difficulty}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Read-only Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-blue-600" />
          <div>
            <h4 className="font-medium text-blue-900">Read-Only Problem</h4>
            <p className="text-sm text-blue-700">
              This problem is imported from LeetCode and cannot be edited. You can only view the content and generate
              test cases.
            </p>
          </div>
        </div>
      </div>

      {/* Problem Details */}
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="constraints">Constraints</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Problem Description</span>
                <Badge variant="secondary" className="text-xs">
                  Read-only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="bg-slate-50 border rounded-lg p-4">
                  <pre className="whitespace-pre-wrap bg-slate-50 text-sm text-slate-700">{problemData?.description}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="constraints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Constraints</span>
                <Badge variant="secondary" className="text-xs">
                  Read-only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 border rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-slate-700">{problemData.constraints}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Sample Input</span>
                  <Badge variant="secondary" className="text-xs">
                    Read-only
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 border rounded-lg p-4">
                  <pre className="text-sm text-slate-700 font-mono">{problemData.sampleInput}</pre>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Sample Output</span>
                  <Badge variant="secondary" className="text-xs">
                    Read-only
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 border rounded-lg p-4">
                  <pre className="text-sm text-slate-700 font-mono">{problemData.sampleOutput}</pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="solutions" className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-amber-600" />
              <div>
                <h4 className="font-medium text-amber-900">Reference Solutions</h4>
                <p className="text-sm text-amber-700">
                  These are reference solutions from LeetCode. They cannot be modified.
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="cpp" className="w-full">
            <TabsList>
              <TabsTrigger value="cpp">C++</TabsTrigger>
              <TabsTrigger value="java">Java</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>
            <TabsContent value="cpp">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>C++ Solution</span>
                    <Badge variant="secondary" className="text-xs">
                      Read-only
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-slate-100">
                      <code>{problemData.solutions.cpp}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="java">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Java Solution</span>
                    <Badge variant="secondary" className="text-xs">
                      Read-only
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-slate-100">
                      <code>{problemData.solutions.java}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="python">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Python Solution</span>
                    <Badge variant="secondary" className="text-xs">
                      Read-only
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-slate-100">
                      <code>{problemData.solutions.python}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Test Case Generation - Only Editable Part */}
      <Card className="border-2 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-emerald-600" />
            <span>Test Case Generation</span>
          </CardTitle>
          <CardDescription>Generate and verify test cases for this problem</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={onGenerateTestCases} disabled={isGenerating} className="bg-violet-600 hover:bg-violet-700">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Test Cases...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Test Cases with AI
              </>
            )}
          </Button>

          {testCases && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Generated Input</h4>
                  <Textarea value={testCases.input} readOnly rows={6} className="font-mono text-sm bg-slate-50" />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Expected Output</h4>
                  <Textarea value={testCases.output} readOnly rows={6} className="font-mono text-sm bg-slate-50" />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={onVerifyTestCases} disabled={isVerifying} variant="outline">
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Test Cases"
                  )}
                </Button>

                {verificationResult && (
                  <div
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                      verificationResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {verificationResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="text-sm">{verificationResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Challenge Button */}
      <div className="flex justify-end">
        <Button
          onClick={onAddChallenge}
          disabled={!testCases || !verificationResult?.success}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Add Challenge to Contest
        </Button>
      </div>
    </div>
  )
}

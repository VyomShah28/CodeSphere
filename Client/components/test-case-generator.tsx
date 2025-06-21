"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Brain, Download, FileText, Loader2, CheckCircle } from "lucide-react"

interface TestCaseGeneratorProps {
  problemDescription: string
  constraints: string
  sampleInput: string
  sampleOutput: string
  onGenerate: (testCases: { input: string; output: string; count: number }) => void
  isGenerating: boolean
}

export function TestCaseGenerator({
  problemDescription,
  constraints,
  sampleInput,
  sampleOutput,
  onGenerate,
  isGenerating,
}: TestCaseGeneratorProps) {
  const [generatedTestCases, setGeneratedTestCases] = useState<{
    input: string
    output: string
    count: number
  } | null>(null)

  const handleGenerate = async () => {
    // Simulate AI generation of comprehensive test cases
    setTimeout(() => {
      const testCases = {
        input: `// Test Case 1: Basic example
4
2 7 11 15
9

// Test Case 2: Edge case - minimum values
2
1 2
3

// Test Case 3: Edge case - maximum values
4
1000000000 999999999 999999998 999999997
1999999999

// Test Case 4: No solution case
3
1 2 3
10

// Test Case 5: Multiple valid pairs
5
3 3 2 4 5
6

// Test Case 6: Large array
10
1 5 3 7 9 2 8 4 6 10
11

// Test Case 7: Negative numbers
4
-1 -2 -3 0
-3

// Test Case 8: Same number twice
4
5 5 10 15
10

// Test Case 9: Zero target
3
0 1 -1
0

// Test Case 10: Single valid solution
6
2 15 11 7 6 8
13`,
        output: `// Test Case 1: Basic example
0 1

// Test Case 2: Edge case - minimum values
0 1

// Test Case 3: Edge case - maximum values
0 1

// Test Case 4: No solution case
-1 -1

// Test Case 5: Multiple valid pairs
0 1

// Test Case 6: Large array
3 7

// Test Case 7: Negative numbers
0 2

// Test Case 8: Same number twice
0 1

// Test Case 9: Zero target
0 2

// Test Case 10: Single valid solution
1 3`,
        count: 10,
      }
      setGeneratedTestCases(testCases)
      onGenerate(testCases)
    }, 3000)
  }

  const downloadTestCase = (type: "input" | "output") => {
    if (!generatedTestCases) return

    const content = type === "input" ? generatedTestCases.input : generatedTestCases.output
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `test_cases_${type}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="border-2 border-violet-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-violet-600" />
          <span>AI Test Case Generator</span>
          <Badge className="bg-violet-100 text-violet-800">Full Test Suite</Badge>
        </CardTitle>
        <CardDescription>Generate comprehensive test cases including edge cases and corner cases</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
          <h4 className="font-medium text-violet-900 mb-2">What will be generated:</h4>
          <ul className="text-sm text-violet-700 space-y-1">
            <li>• Basic test cases covering normal scenarios</li>
            <li>• Edge cases (minimum/maximum values, empty inputs)</li>
            <li>• Corner cases (special conditions, boundary values)</li>
            <li>• Stress tests (large inputs within constraints)</li>
            <li>• Invalid cases (if applicable)</li>
          </ul>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-violet-600 hover:bg-violet-700">
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Full Test Suite...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Generate Full Test Cases with AI
            </>
          )}
        </Button>

        {generatedTestCases && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Generated {generatedTestCases.count} test cases</span>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => downloadTestCase("input")}>
                  <Download className="h-4 w-4 mr-1" />
                  Download Input
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadTestCase("output")}>
                  <Download className="h-4 w-4 mr-1" />
                  Download Output
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Input File Preview</span>
                </h4>
                <Textarea
                  value={generatedTestCases.input}
                  readOnly
                  rows={8}
                  className="font-mono text-xs bg-slate-50"
                />
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Output File Preview</span>
                </h4>
                <Textarea
                  value={generatedTestCases.output}
                  readOnly
                  rows={8}
                  className="font-mono text-xs bg-slate-50"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

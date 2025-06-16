"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Clock,
  Play,
  Send,
  CheckCircle,
  XCircle,
  Terminal,
  Sun,
  Moon,
  List,
  Settings,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { CodeEditor } from "@/components/code-editor"

export default function ContestLive() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const problemId = searchParams.get("problem")

  const [selectedLanguage, setSelectedLanguage] = useState("python")
  const [code, setCode] = useState(`# Write your solution here
def solution():
    # Your code goes here
    pass

if __name__ == "__main__":
    solution()`)
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 30 })
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const currentProblem = {
    id: 1,
    title: "A. Binary Tree Maximum Path Sum",
    difficulty: "Hard",
    points: 300,
    description: `Given a non-empty binary tree, find the maximum path sum. For this problem, a path is defined as any sequence of nodes from some starting node to any node in the tree along the parent-child connections. The path must contain at least one node and does not need to go through the root.`,
    constraints: `• The number of nodes in the tree is in the range [1, 3 * 10^4]
• -1000 ≤ Node.val ≤ 1000`,
    inputFormat: `The input consists of a binary tree represented as an array where null values represent missing nodes.`,
    outputFormat: `Return the maximum path sum as an integer.`,
    sampleInput: `[1,2,3]`,
    sampleOutput: `6`,
    explanation: `The optimal path is 2 -> 1 -> 3 with a path sum of 2 + 1 + 3 = 6.`,
  }

  const languageTemplates = {
    python: `# Write your solution here
def solution():
    # Your code goes here
    pass

if __name__ == "__main__":
    solution()`,
    java: `public class Solution {
    public static void main(String[] args) {
        // Your code goes here
        
    }
    
    public static int solve() {
        // Implement your solution here
        return 0;
    }
}`,
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // Your code goes here
    
    return 0;
}`,
    javascript: `// Write your solution here
function solution() {
    // Your code goes here
    
}

// Test your solution
console.log(solution());`,
    typescript: `// Write your solution here
function solution(): number {
    // Your code goes here
    return 0;
}

// Test your solution
console.log(solution());`,
    c: `#include <stdio.h>
#include <stdlib.h>

int main() {
    // Your code goes here
    
    return 0;
}`,
    go: `package main

import "fmt"

func main() {
    // Your code goes here
    
}

func solution() int {
    // Implement your solution here
    return 0
}`,
    rust: `fn main() {
    // Your code goes here
    
}

fn solution() -> i32 {
    // Implement your solution here
    0
}`,
  }

  const languages = [
    { id: "python", name: "Python 3", color: "bg-blue-500" },
    { id: "java", name: "Java", color: "bg-orange-500" },
    { id: "cpp", name: "C++", color: "bg-purple-500" },
    { id: "javascript", name: "JavaScript", color: "bg-yellow-500" },
    { id: "typescript", name: "TypeScript", color: "bg-blue-600" },
    { id: "c", name: "C", color: "bg-gray-500" },
    { id: "go", name: "Go", color: "bg-cyan-500" },
    { id: "rust", name: "Rust", color: "bg-orange-600" },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          return prev
        }

        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language)
    setCode(languageTemplates[language as keyof typeof languageTemplates] || "")
  }

  const handleCodeChange = (value: string | undefined) => {
    setCode(value || "")
  }

  const handleRunCode = () => {
    setIsRunning(true)
    setTimeout(() => {
      setTestResults([
        { id: 1, input: "[1,2,3]", expected: "6", actual: "6", status: "passed", time: "12ms", memory: "2.1MB" },
        {
          id: 2,
          input: "[-10,9,20,null,null,15,7]",
          expected: "42",
          actual: "42",
          status: "passed",
          time: "8ms",
          memory: "2.3MB",
        },
        { id: 3, input: "[1]", expected: "1", actual: "1", status: "passed", time: "5ms", memory: "1.8MB" },
        { id: 4, input: "[-3]", expected: "-3", actual: "-3", status: "passed", time: "3ms", memory: "1.9MB" },
      ])
      setIsRunning(false)
    }, 2000)
  }

  const handleSubmit = () => {
    router.push("/final-leaderboard")
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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark bg-slate-900" : "bg-slate-50"}`}>
      {/* Header */}
      <header
        className={`border-b ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"} ${isFullscreen ? "block" : ""}`}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!isFullscreen && (
              <>
                <Button variant="ghost" size="icon" onClick={() => router.push("/contest-waiting")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => router.push("/contest-waiting")}>
                  <List className="h-5 w-5" />
                </Button>
              </>
            )}
            <div>
              <h1 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                {isFullscreen ? "Code Editor - " : ""}
                {currentProblem.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isFullscreen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className={`${isDarkMode ? "hover:bg-slate-700 text-slate-300 hover:text-white" : "hover:bg-slate-100"}`}
                title="Exit Fullscreen"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={`${isDarkMode ? "hover:bg-slate-700 text-slate-300 hover:text-white" : "hover:bg-slate-100"}`}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className={`flex items-center space-x-2 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono">
                {timeLeft.hours.toString().padStart(2, "0")}:{timeLeft.minutes.toString().padStart(2, "0")}:
                {timeLeft.seconds.toString().padStart(2, "0")}
              </span>
            </div>
            <Badge
              variant="secondary"
              className={`${isDarkMode ? "bg-slate-700 text-slate-200 border-slate-600" : "bg-slate-100 text-slate-800"}`}
            >
              Live Contest
            </Badge>
          </div>
        </div>
      </header>

      <div className={`flex ${isFullscreen ? "h-screen" : "h-[calc(100vh-73px)]"}`}>
        {/* Problem Statement */}
        <div
          className={`${isFullscreen ? "w-0 overflow-hidden" : "w-1/2"} border-r overflow-auto transition-all duration-300 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"}`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                {currentProblem.title}
              </h2>
              <div className="flex items-center space-x-2">
                <Badge className={getDifficultyColor(currentProblem.difficulty)}>{currentProblem.difficulty}</Badge>
                <Badge variant="outline">{currentProblem.points}</Badge>
              </div>
            </div>

            <Tabs defaultValue="problem" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="problem">Problem</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
                <TabsTrigger value="constraints">Constraints</TabsTrigger>
              </TabsList>

              <TabsContent value="problem" className="space-y-4">
                <div>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>Description</h3>
                  <p className={`leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    {currentProblem.description}
                  </p>
                </div>

                <div>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>Input Format</h3>
                  <p className={isDarkMode ? "text-slate-300" : "text-slate-700"}>{currentProblem.inputFormat}</p>
                </div>

                <div>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>Output Format</h3>
                  <p className={isDarkMode ? "text-slate-300" : "text-slate-700"}>{currentProblem.outputFormat}</p>
                </div>
              </TabsContent>

              <TabsContent value="examples" className="space-y-4">
                <div>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>Sample Input</h3>
                  <pre
                    className={`p-3 rounded text-sm font-mono ${isDarkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100"}`}
                  >
                    {currentProblem.sampleInput}
                  </pre>
                </div>

                <div>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>Sample Output</h3>
                  <pre
                    className={`p-3 rounded text-sm font-mono ${isDarkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100"}`}
                  >
                    {currentProblem.sampleOutput}
                  </pre>
                </div>

                <div>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>Explanation</h3>
                  <p className={isDarkMode ? "text-slate-300" : "text-slate-700"}>{currentProblem.explanation}</p>
                </div>
              </TabsContent>

              <TabsContent value="constraints">
                <div>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>Constraints</h3>
                  <div className={`whitespace-pre-line ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    {currentProblem.constraints}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Monaco Editor Section */}
        <div className={`${isFullscreen ? "w-full" : "w-1/2"} flex flex-col transition-all duration-300`}>
          {/* Editor Header */}
          <div
            className={`border-b p-4 flex items-center justify-between ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center space-x-4">
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger
                  className={`w-48 ${
                    isDarkMode
                      ? "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 focus:ring-slate-400 focus:border-slate-500"
                      : "bg-white border-slate-300 hover:bg-slate-50 focus:ring-slate-400 focus:border-slate-400"
                  }`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className={`${
                    isDarkMode ? "bg-slate-800 border-slate-700 shadow-xl" : "bg-white border-slate-200 shadow-lg"
                  }`}
                >
                  {languages.map((lang) => (
                    <SelectItem
                      key={lang.id}
                      value={lang.id}
                      className={`${
                        isDarkMode
                          ? "text-slate-200 hover:bg-slate-700 focus:bg-slate-700 data-[highlighted]:bg-slate-700"
                          : "text-slate-800 hover:bg-slate-100 focus:bg-slate-100 data-[highlighted]:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 ${lang.color} rounded-full`}></div>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div
                className={`flex items-center space-x-2 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
              >
                <Settings className="h-4 w-4" />
                <span>Monaco Editor</span>
              </div>
            </div>

            <div className="flex space-x-2">
              {!isFullscreen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className={`${isDarkMode ? "hover:bg-slate-700 text-slate-300 hover:text-white" : "hover:bg-slate-100"}`}
                  title="Fullscreen Editor"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleRunCode}
                disabled={isRunning}
                className={`${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:text-white hover:border-slate-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700"
                    : "bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
                }`}
              >
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? "Running..." : "Run Code"}
              </Button>
              <Button
                onClick={handleSubmit}
                className={`${
                  isDarkMode
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                } shadow-sm`}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Solution
              </Button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className={`flex-1 relative ${isDarkMode ? "bg-slate-900" : "bg-white"}`}>
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              language={selectedLanguage}
              theme={isDarkMode ? "vs-dark" : "vs-light"}
              height="100%"
              className="h-full"
            />
          </div>

          {/* Console */}
          <div
            className={`${isFullscreen ? "h-64" : "h-48"} border-t ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"}`}
          >
            <div className={`p-3 border-b ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50"}`}>
              <h3 className={`font-semibold flex items-center ${isDarkMode ? "text-white" : ""}`}>
                <Terminal className="h-4 w-4 mr-2" />
                Test Results
                {testResults.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {testResults.filter((r) => r.status === "passed").length}/{testResults.length} Passed
                  </Badge>
                )}
              </h3>
            </div>
            <div className={`p-3 overflow-auto ${isFullscreen ? "h-52" : "h-40"}`}>
              {testResults.length > 0 ? (
                <div className="space-y-3">
                  {testResults.map((result) => (
                    <div
                      key={result.id}
                      className={`p-3 rounded-lg border ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {result.status === "passed" ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className={`font-medium ${isDarkMode ? "text-slate-300" : ""}`}>
                            Test Case {result.id}
                          </span>
                          <Badge variant={result.status === "passed" ? "default" : "destructive"} className="text-xs">
                            {result.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-xs">
                          <span className={`${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{result.time}</span>
                          <span className={`${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{result.memory}</span>
                        </div>
                      </div>
                      <div className="text-xs space-y-1">
                        <div className={`${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                          <span className="font-medium">Input:</span>{" "}
                          <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">{result.input}</code>
                        </div>
                        <div className={`${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                          <span className="font-medium">Expected:</span>{" "}
                          <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">{result.expected}</code>
                        </div>
                        <div className={`${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                          <span className="font-medium">Output:</span>{" "}
                          <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">{result.actual}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Terminal
                      className={`h-12 w-12 mx-auto mb-3 ${isDarkMode ? "text-slate-600" : "text-slate-400"}`}
                    />
                    <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Click "Run Code" to test your solution
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                      Your code will be tested against sample and hidden test cases
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

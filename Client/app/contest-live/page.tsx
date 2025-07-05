"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Settings,
  Grid3X3,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { CodeEditor } from "@/components/code-editor";
import { useContestFullscreen } from "@/hooks/use-contest-fullscreen";
import { ContestExitModal } from "@/components/contest-exit-modal";
import { useTabViolations } from "@/hooks/use-tab-violations";
import { InitialContestNotice } from "@/components/initial-contest-notice";
import { TabViolationWarning } from "@/components/tab-violation-warning";
import { AutoSubmitNotification } from "@/components/auto-submit-notification";
import axios from "axios";

interface Challenge {
  id: number;
  challenge_name: string;
  difficulty_level: "Easy" | "Medium" | "Hard";
  max_score: number;
  problem_statement: string;
  constraints: string;
  input_form: string;
  output_form: string;
  sample_testcase: string;
  sample_output: string;
  input_testcase: File;
  output_testcase: File;
  isLeetCode?: boolean;
  cpp_code?: string;
  java_code?: string;
  python_code?: string;
  solved?: boolean;
}

export default function ContestLive() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeId = searchParams.get("challenge");
  const contestId = searchParams.get("contestId");
  console.log("Contest ID:", contestId);

  const [currentProblem, setCurrentProblem] = useState<Challenge>(
    {} as Challenge
  );

  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [code, setCode] = useState(`# Write your solution here
def solution():
    # Your code goes here
    pass

if __name__ == "__main__":
    solution()`);
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 45,
    seconds: 30,
  });
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);

  const { isFullscreen, shouldEnforceFullscreen } = useContestFullscreen();

  const {
    violationCount,
    showWarning,
    showInitialNotice,
    isTabActive,
    dismissWarning,
    dismissInitialNotice,
    resumeViolationDetection,
  } = useTabViolations();

  // Resume violation detection when component mounts
  useEffect(() => {
    resumeViolationDetection();
  }, [resumeViolationDetection]);


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
  };

  const languages = [
    { id: "python", name: "Python 3", color: "bg-blue-500" },
    { id: "java", name: "Java", color: "bg-orange-500" },
    { id: "cpp", name: "C++", color: "bg-purple-500" },
    { id: "javascript", name: "JavaScript", color: "bg-yellow-500" },
  ];

  const fetchChallenge = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/get-challenge-by-id?challengeId=${challengeId}`
      );
      setCurrentProblem(response.data);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      // Handle error appropriately
    }
  };

  useEffect(() => {
    fetchChallenge();
  }, [challengeId]);

  // Contest duration countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          router.push("/final-leaderboard");
          return prev;
        }

        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  // Auto-enable fullscreen and security measures
  useEffect(() => {
    if (!shouldEnforceFullscreen) return;

    // Auto-enable fullscreen on page load - no modal, just do it
    const enableFullscreenOnLoad = async () => {
      if (document.fullscreenElement === null) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (error) {
          console.warn("Failed to enter fullscreen:", error);
          // Don't show modal, just continue
        }
      }
    };

    // Disable right-click
    window.oncontextmenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Enhanced keyboard blocking
    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = [
        { key: "F12" },
        { key: "I", ctrlKey: true, shiftKey: true },
        { key: "J", ctrlKey: true, shiftKey: true },
        { key: "C", ctrlKey: true, shiftKey: true },
        { key: "U", ctrlKey: true },
        { key: "T", ctrlKey: true },
        { key: "N", ctrlKey: true },
        { key: "W", ctrlKey: true },
        { key: "R", ctrlKey: true },
        { key: "F5" },
        { key: "Tab", altKey: true },
      ];

      const isBlocked = blockedKeys.some(
        (blocked) =>
          e.key === blocked.key &&
          !!e.ctrlKey === !!blocked.ctrlKey &&
          !!e.shiftKey === !!blocked.shiftKey &&
          !!e.altKey === !!blocked.altKey
      );

      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Initialize security measures
    enableFullscreenOnLoad();

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown, true);

    // Cleanup
    return () => {
      window.oncontextmenu = null;
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [shouldEnforceFullscreen]);

  // Disable text selection and copying
  useEffect(() => {
    if (!shouldEnforceFullscreen) return;

    // Disable text selection and copying
    const disableSelection = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const disableCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.clipboardData?.setData("text/plain", "");
      return false;
    };

    const disableDrag = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Add CSS to disable text selection
    const style = document.createElement("style");
    style.textContent = `
    .contest-problem-area {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    .contest-problem-area::selection {
      background: transparent !important;
    }
    .contest-problem-area::-moz-selection {
      background: transparent !important;
    }
  `;
    document.head.appendChild(style);

    // Add event listeners
    document.addEventListener("selectstart", disableSelection);
    document.addEventListener("copy", disableCopy);
    document.addEventListener("cut", disableCopy);
    document.addEventListener("dragstart", disableDrag);

    return () => {
      document.removeEventListener("selectstart", disableSelection);
      document.removeEventListener("copy", disableCopy);
      document.removeEventListener("cut", disableCopy);
      document.removeEventListener("dragstart", disableDrag);
      document.head.removeChild(style);
    };
  }, [shouldEnforceFullscreen]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setCode(
      languageTemplates[language as keyof typeof languageTemplates] || ""
    );
  };

  const handleCodeChange = (value: string | undefined) => {
    setCode(value || "");
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setTestResults([
        {
          id: 1,
          input: "[1,2,3]",
          expected: "6",
          actual: "6",
          status: "passed",
          time: "12ms",
          memory: "2.1MB",
        },
        {
          id: 2,
          input: "[-10,9,20,null,null,15,7]",
          expected: "42",
          actual: "42",
          status: "passed",
          time: "8ms",
          memory: "2.3MB",
        },
        {
          id: 3,
          input: "[1]",
          expected: "1",
          actual: "1",
          status: "passed",
          time: "5ms",
          memory: "1.8MB",
        },
        {
          id: 4,
          input: "[-3]",
          expected: "-3",
          actual: "[-3]",
          status: "passed",
          time: "3ms",
          memory: "1.9MB",
        },
      ]);
      setIsRunning(false);
    }, 2000);
  };

  const handleSubmit = () => {
    // Mark challenge as solved and return to contest waiting
    router.push("/contest-waiting?contestId=" + contestId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "dark bg-slate-900" : "bg-slate-50"
      }`}
    >
      {/* Header */}
      <header
        className={`border-b ${
          isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"
        }`}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowExitModal(true)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                router.push("/contest-waiting?contestId=" + contestId)
              }
            >
              <Grid3X3 className="h-5 w-5" />
            </Button>
            <div>
              <h1
                className={`text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-slate-800"
                }`}
              >
                {currentProblem.challenge_name}
              </h1>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Challenge {currentProblem.id} of 6
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={`${
                isDarkMode
                  ? "hover:bg-slate-700 text-slate-300 hover:text-white"
                  : "hover:bg-slate-100"
              }`}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <div
              className={`flex items-center space-x-2 ${
                isDarkMode ? "text-slate-300" : "text-slate-600"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span className="text-xs mr-1">Time Remaining:</span>
              <span className="font-mono">
                {timeLeft.hours.toString().padStart(2, "0")}:
                {timeLeft.minutes.toString().padStart(2, "0")}:
                {timeLeft.seconds.toString().padStart(2, "0")}
              </span>
            </div>
            <Badge
              variant="secondary"
              className={`${
                isDarkMode
                  ? "bg-slate-700 text-slate-200 border-slate-600"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              Live Contest
            </Badge>
            {violationCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                Violations: {violationCount}/3
              </Badge>
            )}
            {!isTabActive && (
              <Badge variant="destructive" className="animate-pulse">
                Tab Inactive
              </Badge>
            )}
            {!isFullscreen && shouldEnforceFullscreen && (
              <Badge
                variant="outline"
                className="text-orange-600 border-orange-300"
              >
                Entering Fullscreen...
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Problem Statement */}
        <div
          className={`w-1/2 border-r overflow-auto contest-problem-area ${
            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-slate-800"
                }`}
              >
                {currentProblem.challenge_name}
              </h2>
              <div className="flex items-center space-x-2">
                <Badge
                  className={getDifficultyColor(
                    currentProblem.difficulty_level
                  )}
                >
                  {currentProblem.difficulty_level}
                </Badge>
                <Badge variant="outline">{currentProblem.max_score} pts</Badge>
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
                  <h3
                    className={`font-semibold mb-2 ${
                      isDarkMode ? "text-white" : ""
                    }`}
                  >
                    Description
                  </h3>
                  <p
                    className={`leading-relaxed ${
                      isDarkMode ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    {currentProblem.problem_statement}
                  </p>
                </div>

                <div>
                  <h3
                    className={`font-semibold mb-2 ${
                      isDarkMode ? "text-white" : ""
                    }`}
                  >
                    Input Format
                  </h3>
                  <p
                    className={isDarkMode ? "text-slate-300" : "text-slate-700"}
                  >
                    {currentProblem.input_form}
                  </p>
                </div>

                <div>
                  <h3
                    className={`font-semibold mb-2 ${
                      isDarkMode ? "text-white" : ""
                    }`}
                  >
                    Output Format
                  </h3>
                  <p
                    className={isDarkMode ? "text-slate-300" : "text-slate-700"}
                  >
                    {currentProblem.output_form}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="examples" className="space-y-4">
                <div>
                  <h3
                    className={`font-semibold mb-2 ${
                      isDarkMode ? "text-white" : ""
                    }`}
                  >
                    Sample Input
                  </h3>
                  <pre
                    className={`p-3 rounded text-sm font-mono ${
                      isDarkMode
                        ? "bg-slate-700 text-slate-200"
                        : "bg-slate-100"
                    }`}
                  >
                    {currentProblem.sample_testcase}
                  </pre>
                </div>

                <div>
                  <h3
                    className={`font-semibold mb-2 ${
                      isDarkMode ? "text-white" : ""
                    }`}
                  >
                    Sample Output
                  </h3>
                  <pre
                    className={`p-3 rounded text-sm font-mono ${
                      isDarkMode
                        ? "bg-slate-700 text-slate-200"
                        : "bg-slate-100"
                    }`}
                  >
                    {currentProblem.sample_output}
                  </pre>
                </div>

                {/* <div>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>Explanation</h3>
                  <p className={isDarkMode ? "text-slate-300" : "text-slate-700"}>{currentProblem.explanation}</p>
                </div> */}
              </TabsContent>

              <TabsContent value="constraints">
                <div>
                  <h3
                    className={`font-semibold mb-2 ${
                      isDarkMode ? "text-white" : ""
                    }`}
                  >
                    Constraints
                  </h3>
                  <div
                    className={`whitespace-pre-line ${
                      isDarkMode ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    {currentProblem.constraints}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Monaco Editor Section */}
        <div className="w-1/2 flex flex-col">
          {/* Editor Header */}
          <div
            className={`border-b p-4 flex items-center justify-between ${
              isDarkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center space-x-4">
              <Select
                value={selectedLanguage}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger
                  className={`w-48 ${
                    isDarkMode
                      ? "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
                      : "bg-white border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className={`${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700 shadow-xl"
                      : "bg-white border-slate-200 shadow-lg"
                  }`}
                >
                  {languages.map((lang) => (
                    <SelectItem
                      key={lang.id}
                      value={lang.id}
                      className={`${
                        isDarkMode
                          ? "text-slate-200 hover:bg-slate-700 focus:bg-slate-700"
                          : "text-slate-800 hover:bg-slate-100 focus:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 ${lang.color} rounded-full`}
                        ></div>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div
                className={`flex items-center space-x-2 text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Monaco Editor</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleRunCode}
                disabled={isRunning}
                className={`${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:text-white"
                    : "bg-white border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? "Running..." : "Run Code"}
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Solution
              </Button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div
            className={`flex-1 relative ${
              isDarkMode ? "bg-slate-900" : "bg-white"
            }`}
          >
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
            className={`h-48 border-t ${
              isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"
            }`}
          >
            <div
              className={`p-3 border-b ${
                isDarkMode ? "bg-slate-700 border-slate-600" : "bg-slate-50"
              }`}
            >
              <h3
                className={`font-semibold flex items-center ${
                  isDarkMode ? "text-white" : ""
                }`}
              >
                <Terminal className="h-4 w-4 mr-2" />
                Test Results
                {testResults.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {testResults.filter((r) => r.status === "passed").length}/
                    {testResults.length} Passed
                  </Badge>
                )}
              </h3>
            </div>
            <div className="p-3 overflow-auto h-40">
              {testResults.length > 0 ? (
                <div className="space-y-3">
                  {testResults.map((result) => (
                    <div
                      key={result.id}
                      className={`p-3 rounded-lg border ${
                        isDarkMode
                          ? "bg-slate-700 border-slate-600"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {result.status === "passed" ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span
                            className={`font-medium ${
                              isDarkMode ? "text-slate-300" : ""
                            }`}
                          >
                            Test Case {result.id}
                          </span>
                          <Badge
                            variant={
                              result.status === "passed"
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {result.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-xs">
                          <span
                            className={`${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {result.time}
                          </span>
                          <span
                            className={`${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {result.memory}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs space-y-1">
                        <div
                          className={`${
                            isDarkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          <span className="font-medium">Input:</span>{" "}
                          <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">
                            {result.input}
                          </code>
                        </div>
                        <div
                          className={`${
                            isDarkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          <span className="font-medium">Expected:</span>{" "}
                          <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">
                            {result.expected}
                          </code>
                        </div>
                        <div
                          className={`${
                            isDarkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          <span className="font-medium">Output:</span>{" "}
                          <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">
                            {result.actual}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Terminal
                      className={`h-12 w-12 mx-auto mb-3 ${
                        isDarkMode ? "text-slate-600" : "text-slate-400"
                      }`}
                    />
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Click "Run Code" to test your solution
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Your code will be tested against sample and hidden test
                      cases
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ContestExitModal
        isOpen={showExitModal}
        onStay={() => setShowExitModal(false)}
        onExit={() => router.push("/contest-waiting?contestId=" + contestId)}
        contestName="Advanced Algorithms Championship"
      />

      {/* Initial Contest Notice */}
      <InitialContestNotice
        isOpen={showInitialNotice}
        onAccept={dismissInitialNotice}
        contestName="Advanced Algorithms Championship"
      />

      {/* Tab Violation Warning */}
      <TabViolationWarning
        isVisible={showWarning}
        violationCount={violationCount}
        onDismiss={dismissWarning}
      />

      {/* Auto-Submit Notification */}
      <AutoSubmitNotification
        isVisible={violationCount >= 3}
        onComplete={() => router.push("/final-leaderboard")}
      />
    </div>
  );
}

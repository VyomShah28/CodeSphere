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
  Send,
  CheckCircle,
  XCircle,
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
import { ResizablePane } from "@/components/resizable-pane";
import { TestcaseRunner } from "@/components/testcase-runner";

interface Challenge {
  id: number;
  challenge_name: string;
  difficulty_level: "Easy" | "Medium" | "Hard";
  max_score: number;
  problem_statement: string;
  constraints: string;
  input_form: string;
  output_form: string;
  input_formate: string;
  sample_testcase: string;
  sample_output: string;
  input_testcase: File;
  output_testcase: File;
  input_leetcode_testcase?: string;
  output_leetcode_testcase?: string;
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
    minutes: 5,
    seconds: 55,
  });
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [sampleTestCase, setSampleTestCase] = useState<{
    input: [string];
    output: [string];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  ];

  const fetchChallenge = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8000/api/get-challenge-by-id?challengeId=${challengeId}`
      );

      setCurrentProblem(response.data);
      console.log("Fetched challenge:", response.data);

      const leetcode_input = response.data.input_leetcode_testcase;
      const leetcode_output = response.data.output_leetcode_testcase;

      const d1 = new Date(
        `${response.data.start_date}T${response.data.start_time}`
      );
      const d2 = new Date(
        `${response.data.end_date}T${response.data.end_time}`
      );

      const today = new Date();

      const hour = (d2.getTime() - today.getTime()) / (1000 * 60 * 60);
      const minites = (d2.getTime() - today.getTime()) / (1000 * 60);
      const seconds = (d2.getTime() - today.getTime()) / 1000;

      const newTimeLeft = {
        hours: Math.floor(hour),
        minutes: Math.floor(minites % 60),
        seconds: Math.floor(seconds % 60),
      };

      setTimeLeft(newTimeLeft);

      console.log("Time left:", newTimeLeft);

      setSampleTestCase({
        input: leetcode_input.split("\n").slice(0, 3),
        output: leetcode_output.split("\n").slice(0, 3),
      });
    } catch (error) {
      console.error("Error fetching challenge:", error);
      // Handle error appropriately
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchChallenge();
  }, [challengeId]);

  // Contest duration countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          router.push("/final-leaderboard?contestId" + contestId);
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

  const handleTestComplete = (results: any[]) => {
    setTestResults(results);
  };

  const handleSubmitReady = (ready: boolean) => {
    setCanSubmit(ready);
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      console.log("Hello" + timeLeft);
      const response = await fetch("http://localhost:8000/api/submitContest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contestId,
          challengeId,
          userId: sessionStorage.getItem("userId"),
          total_mark: currentProblem.max_score,
          timeLeft: timeLeft,
          code,
          inputs: currentProblem.input_leetcode_testcase,
          outputs: currentProblem.output_leetcode_testcase,
          language: selectedLanguage,
        }),
      });

      const data = await response.json();

      console.log(data);

      if (data.success) {
        setSubmissionResult(data.result);
        setTimeout(() => {
          router.push("/contest-waiting?contestId=" + contestId);
        }, 8000);
      } else {
        console.error("Submission failed:", data.error);
        setSubmissionResult(data)
      }
    } catch (error) {
      console.error("Error submitting:", error);
      
    } finally {
      setIsSubmitting(false);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen flex flex-col overflow-hidden ${
        isDarkMode ? "dark bg-slate-900" : "bg-slate-50"
      }`}
    >
      {/* Header */}
      <header
        className={`border-b flex-shrink-0 ${
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

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Problem Statement */}
        <ResizablePane
          direction="horizontal"
          initialSize={45}
          minSize={25}
          maxSize={65}
          className="flex flex-col"
        >
          <div
            className={`flex-1 overflow-auto contest-problem-area ${
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
                  <Badge variant="outline">
                    {currentProblem.max_score} pts
                  </Badge>
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
                      className={
                        isDarkMode ? "text-slate-300" : "text-slate-700"
                      }
                    >
                      {currentProblem.input_formate}
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
                      className={
                        isDarkMode ? "text-slate-300" : "text-slate-700"
                      }
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
        </ResizablePane>

        {/* Code Editor and Terminal */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Editor Header */}
          <div
            className={`border-b p-4 flex items-center justify-between flex-shrink-0 ${
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
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className={`${
                  canSubmit && !isSubmitting
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    : "bg-slate-400 text-slate-600 cursor-not-allowed"
                }`}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Solution"}
              </Button>
            </div>
          </div>

          {/* Resizable Editor and Terminal */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <ResizablePane
              direction="vertical"
              initialSize={60}
              minSize={30}
              maxSize={80}
              className="flex flex-col"
            >
              <div
                className={`flex-1 relative overflow-hidden ${
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
            </ResizablePane>

            {/* Terminal */}
            <div
              className={`flex flex-col flex-1 min-h-0 overflow-hidden ${
                isDarkMode
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-slate-200"
              } border-t`}
            >
              <div className="flex-1 p-3 min-h-0 overflow-hidden">
                <TestcaseRunner
                  code={code}
                  language={selectedLanguage}
                  challengeId={challengeId || "1"}
                  total_mark={currentProblem.max_score}
                  onRunComplete={handleTestComplete}
                  onSubmitReady={handleSubmitReady}
                  isDarkMode={isDarkMode}
                  sampleTestCase={sampleTestCase}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Result Modal */}
      {submissionResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-lg max-w-md w-full mx-4 ${
              isDarkMode ? "bg-slate-800 text-white" : "bg-white"
            }`}
          >
            <div className="text-center">
              <div
                className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  submissionResult.success
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {submissionResult.success ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <XCircle className="h-6 w-6" />
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {submissionResult.success
                  ? "Solution Accepted!"
                  : "Error Occurred"}
              </h3>

              {submissionResult.success ? (
                <div className="space-y-2 text-sm">
                  <p>
                    Score: {submissionResult.score}/{submissionResult.maxScore}
                  </p>
                  <p>
                    Test Cases: {submissionResult.testcasesPassed}/
                    {submissionResult.totalTestcases}
                  </p>
                  <p>Execution Time: {submissionResult.executionTime}</p>
                  <p>Memory Used: {submissionResult.memoryUsed}</p>
                </div>
              ) : (
                <div className="text-left text-sm bg-red-50 text-red-700 p-3 rounded mt-4 whitespace-pre-wrap">
                  <strong>Error:</strong>
                  <br />
                  {submissionResult.error}
                </div>
              )}

              <button
                onClick={() => setSubmissionResult(null)}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Close
              </button>

              {submissionResult.success && (
                <p className="text-xs mt-4 text-slate-500">
                  Redirecting to contest page...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
        onComplete={() =>
          router.push("/final-leaderboard?constesId" + contestId)
        }
      />
    </div>
  );
}

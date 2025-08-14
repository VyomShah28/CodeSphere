"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface TestCase {
  id: number;
  input: string;
  expected: string;
  actual?: string;
  status: "pending" | "running" | "passed" | "failed" | "error";
  time?: string;
  memory?: string;
  error?: string;
}

interface TestcaseRunnerProps {
  code: string;
  language: string;
  challengeId: string;
  total_mark: number;
  onRunComplete: (results: TestCase[]) => void;
  onSubmitReady: (ready: boolean) => void;
  isDarkMode: boolean;
  sampleTestCase?: {
    input: string[];
    output: string[];
  } | null;
}

export function TestcaseRunner({
  code,
  language,
  challengeId,
  total_mark,
  onRunComplete,
  onSubmitReady,
  isDarkMode,
  sampleTestCase,
}: TestcaseRunnerProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentRunning, setCurrentRunning] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLoadingTestCases, setIsLoadingTestCases] = useState(false);

  // Fetch test cases from Django backend
  const fetchTestCases = async () => {
    setIsLoadingTestCases(true);
    try {
      if (sampleTestCase?.input && sampleTestCase?.output) {
        const fallbackTestCases = sampleTestCase.input.map((input, index) => ({
          id: index + 1,
          input: input.trim(),
          expected: sampleTestCase.output[index]?.trim() || "",
          status: "pending" as const,
        }));
        setTestCases(fallbackTestCases);
      }
    } catch (error) {
      console.error("Error fetching test cases:", error);

      if (sampleTestCase?.input && sampleTestCase?.output) {
        const fallbackTestCases = sampleTestCase.input.map((input, index) => ({
          id: index + 1,
          input: input.trim(),
          expected: sampleTestCase.output[index]?.trim() || "",
          status: "pending" as const,
        }));
        setTestCases(fallbackTestCases);
      }
    } finally {
      setIsLoadingTestCases(false);
    }
  };

  useEffect(() => {
    if (challengeId) {
      fetchTestCases();
    }
  }, [challengeId, sampleTestCase]);

  const runAllTests = async () => {
    if (isRunning || testCases.length === 0) return;

    setIsRunning(true);
    setProgress(0);
    onSubmitReady(false);

    // Reset all test cases
    const resetTests = testCases.map((tc) => ({
      ...tc,
      status: "pending" as const,
      actual: undefined,
      time: undefined,
      memory: undefined,
      error: undefined,
    }));
    setTestCases(resetTests);

    // Run tests sequentially
    for (let i = 0; i < resetTests.length; i++) {
      setCurrentRunning(i + 1);

      // Update status to running
      setTestCases((prev) =>
        prev.map((tc) =>
          tc.id === i + 1 ? { ...tc, status: "running" as const } : tc
        )
      );

      try {
        const response = await fetch(
          "https://codesphere-4hd5.onrender.com/api/runcode",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              language,
              input: resetTests[i].input,
              expected_output: resetTests[i].expected,
              challenge_id: challengeId,
            }),
          }
        );

        const result = await response.json();

        if (result.success) {
          const testResult = result.result;
          setTestCases((prev) =>
            prev.map((tc) =>
              tc.id === i + 1
                ? {
                    ...tc,
                    status:
                      testResult.status === "passed"
                        ? "passed"
                        : testResult.status === "failed"
                        ? "failed"
                        : "error",
                    actual: testResult.output || testResult.actual_output,
                    time: testResult.execution_time,
                    memory: testResult.memory_used,
                    error: testResult.error,
                  }
                : tc
            )
          );
        } else {
          setTestCases((prev) =>
            prev.map((tc) =>
              tc.id === i + 1
                ? {
                    ...tc,
                    status: "error" as const,
                    error: result.error || "Unknown error occurred",
                  }
                : tc
            )
          );
        }
      } catch (error) {
        console.error("Error running test case:", error);
        setTestCases((prev) =>
          prev.map((tc) =>
            tc.id === i + 1
              ? {
                  ...tc,
                  status: "error" as const,
                  error: "Network error - Unable to connect to server",
                }
              : tc
          )
        );
      }

      // Update progress
      setProgress(((i + 1) / resetTests.length) * 100);

      // Small delay between tests for better UX
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setCurrentRunning(null);
    setIsRunning(false);

    // Check if all tests passed and notify parent
    setTimeout(() => {
      setTestCases((current) => {
        const allPassed = current.every((tc) => tc.status === "passed");
        onSubmitReady(allPassed);
        onRunComplete(current);
        return current;
      });
    }, 100);
  };

  const getStatusIcon = (status: TestCase["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-slate-400" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: TestCase["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-xs">
            PENDING
          </Badge>
        );
      case "running":
        return (
          <Badge
            variant="secondary"
            className="text-blue-600 bg-blue-100 text-xs"
          >
            RUNNING
          </Badge>
        );
      case "passed":
        return (
          <Badge
            variant="secondary"
            className="text-green-600 bg-green-100 text-xs"
          >
            PASSED
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="text-xs">
            FAILED
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="secondary"
            className="text-orange-600 bg-orange-100 text-xs"
          >
            ERROR
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            PENDING
          </Badge>
        );
    }
  };

  const passedCount = testCases.filter((tc) => tc.status === "passed").length;
  const totalCount = testCases.length;

  if (isLoadingTestCases) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2
            className={`h-8 w-8 mx-auto mb-3 animate-spin ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          />
          <p
            className={`text-sm ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Loading test cases...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Button
            onClick={runAllTests}
            disabled={isRunning || testCases.length === 0}
            className={`${
              isRunning || testCases.length === 0
                ? "bg-slate-400 text-slate-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? "Running Tests..." : "Run All Tests"}
          </Button>

          {totalCount > 0 && (
            <Badge variant="secondary" className="text-sm">
              {passedCount}/{totalCount} Test Cases
            </Badge>
          )}

          {passedCount > 0 && passedCount === totalCount && (
            <Badge
              variant="secondary"
              className="text-green-600 bg-green-100 text-sm"
            >
              All Passed ✓
            </Badge>
          )}
        </div>

        {isRunning && (
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <span>Running Test {currentRunning}</span>
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-slate-500 mt-1">
            Progress: {Math.round(progress)}% (
            {Math.ceil(progress / (100 / totalCount))}/{totalCount} tests
            completed)
          </p>
        </div>
      )}

      {/* Test Cases */}
      <div className="flex-1 overflow-auto space-y-3">
        {testCases.length > 0 ? (
          testCases.map((testCase) => (
            <div
              key={testCase.id}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                isDarkMode
                  ? "bg-slate-700 border-slate-600 hover:bg-slate-600/50"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/50"
              } ${
                testCase.status === "running" ? "ring-2 ring-blue-500/50" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(testCase.status)}
                  <span
                    className={`font-medium ${
                      isDarkMode ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Test Case {testCase.id}
                  </span>
                  {getStatusBadge(testCase.status)}
                </div>

                {(testCase.time || testCase.memory) && (
                  <div className="flex items-center space-x-4 text-xs">
                    {testCase.time && (
                      <span
                        className={`${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {testCase.time}
                      </span>
                    )}
                    {testCase.memory && (
                      <span
                        className={`${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {testCase.memory}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div
                  className={`${
                    isDarkMode ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  <span className="font-medium">Input:</span>{" "}
                  <code
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      isDarkMode
                        ? "bg-slate-600 text-slate-200"
                        : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {testCase.input}
                  </code>
                </div>

                <div
                  className={`${
                    isDarkMode ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  <span className="font-medium">Expected:</span>{" "}
                  <code
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      isDarkMode
                        ? "bg-slate-600 text-slate-200"
                        : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {testCase.expected}
                  </code>
                </div>

                {testCase.actual !== undefined && (
                  <div
                    className={`${
                      isDarkMode ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    <span className="font-medium">Output:</span>{" "}
                    <code
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        testCase.status === "passed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : testCase.status === "failed"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : isDarkMode
                          ? "bg-slate-600 text-slate-200"
                          : "bg-slate-200 text-slate-800"
                      }`}
                    >
                      {testCase.actual}
                    </code>
                  </div>
                )}

                {testCase.error && (
                  <div className="text-red-600 dark:text-red-400 text-xs">
                    <span className="font-medium">Error:</span> {testCase.error}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle
                className={`h-12 w-12 mx-auto mb-3 ${
                  isDarkMode ? "text-slate-600" : "text-slate-400"
                }`}
              />
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                No test cases available
              </p>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Test cases will be loaded from the challenge
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

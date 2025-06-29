"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Upload,
  FileText,
  Star,
  CheckCircle,
  Sparkles,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/footer";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { AddChallengeModal } from "@/components/add-challenge-modal";
import { LeetCodePreview } from "@/components/leetcode-preview";
import { TestCasePreview } from "@/components/test-case-preview";
import { LeetCodeViewModal } from "@/components/leetcode-view-modal";
import { TestCaseGenerator } from "@/components/test-case-generator";
import { SafePreview } from "@/components/safePreview";

interface Challenge {
  id: string;
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
}

interface TestCaseFile {
  name: string;
  content: string;
  type: "input" | "output";
  error?: string;
}

export default function ChallengeEditor() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isAddingChallenge, setIsAddingChallenge] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<string | null>(null);
  const [viewingChallenge, setViewingChallenge] = useState<Challenge | null>(
    null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [challengeMode, setChallengeMode] = useState<
    "manual" | "leetcode" | null
  >(null);
  const [leetcodeData, setLeetcodeData] = useState<any>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingTestCase, setIsGeneratingTestCase] = useState(false);
  const [isGeneratingLeetCodeTestCases, setIsGeneratingLeetCodeTestCases] =
    useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  // const [verificationResult, setVerificationResult] = useState<any>(null);
  const [leetcodeTestCases, setLeetcodeTestCases] = useState<any>(null);
  const [generatedTestCases, setGeneratedTestCases] = useState<any>(null);
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testCaseFiles, setTestCaseFiles] = useState<TestCaseFile[]>([]);
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
  });

  const validateChallenge = () => {
    const newErrors: Record<string, string> = {};

    if (!currentChallenge.challenge_name.trim()) {
      newErrors.challenge_name = "Challenge name is required";
    }
    if (!currentChallenge.problem_statement.trim()) {
      newErrors.problem_statement = "Problem description is required";
    }
    if (!currentChallenge.constraints.trim()) {
      newErrors.constraints = "Constraints are required";
    }
    if (!currentChallenge.input_form.trim()) {
      newErrors.input_form = "Input format is required";
    }
    if (!currentChallenge.output_form.trim()) {
      newErrors.output_form = "Output format is required";
    }
    if (!currentChallenge.sample_testcase.trim()) {
      newErrors.sample_testcase = "Sample input is required";
    }
    if (!currentChallenge.sample_output.trim()) {
      newErrors.sample_output = "Sample output is required";
    }
    if (!currentChallenge.input_testcase || !currentChallenge.output_testcase) {
      newErrors.files = "Both input and output files must be uploaded";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddChallenge = async () => {
    let challengeData: Challenge;

    if (challengeMode === "leetcode" && leetcodeData) {
      // Add LeetCode challenge
      challengeData = {
        id: Date.now().toString(),
        challenge_name: leetcodeData.title,
        difficulty_level: leetcodeData.difficulty,
        max_score:
          leetcodeData.difficulty === "Easy"
            ? 100
            : leetcodeData.difficulty === "Medium"
            ? 200
            : 300,
        problem_statement: leetcodeData.description,
        constraints: leetcodeData.constraints,
        input_form: "Standard LeetCode format",
        output_form: "Standard LeetCode format",
        sample_testcase: leetcodeData.sampleInput,
        sample_output: leetcodeData.sampleOutput,
        input_testcase: new File([""], "leetcode_input.txt"),
        output_testcase: new File([""], "leetcode_output.txt"),
        isLeetCode: true,
        cpp_code: leetcodeData.solutions.cpp,
        java_code: leetcodeData.solutions.java,
        python_code: leetcodeData.solutions.python,
      };
    } else {
      if (!validateChallenge()) {
        return;
      }
      challengeData = {
        id: Date.now().toString(),
        ...currentChallenge,
      };
    }
    try {
      const formData = new FormData();
      formData.append("contest_id", searchParams.get("contestId") || "");
      formData.append("challenge_name", challengeData.challenge_name);
      formData.append("difficulty_level", challengeData.difficulty_level);
      formData.append("max_score", challengeData.max_score.toString());
      formData.append("problem_statement", challengeData.problem_statement);
      formData.append("constraints", challengeData.constraints);
      formData.append("input_form", challengeData.input_form);
      formData.append("output_form", challengeData.output_form);
      formData.append("sample_testcase", challengeData.sample_testcase);
      formData.append("sample_output", challengeData.sample_output);
      formData.append("input_testcase", challengeData.input_testcase);
      formData.append("output_testcase", challengeData.output_testcase);
      if (challengeData.isLeetCode) {
        formData.append("isLeetCode", true as unknown as string);
        formData.append("cpp_code", challengeData.cpp_code || "");
        formData.append("java_code", challengeData.java_code || "");
        formData.append("python_code", challengeData.python_code || "");
      } else {
        formData.append("isLeetCode", false as unknown as string);
      }
      const response = await axios.post(
        "http://127.0.0.1:8000/api/add-challenge/",
        formData
      );
      console.log(response);

      console.log("Adding new challenge:", challengeData);
      setChallenges([...challenges, challengeData]);
      resetForm();
    } catch (error) {
      console.error("Error while preparing challenge data:", error);
      return;
    }
  };

  const resetForm = () => {
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
    });
    setIsAddingChallenge(false);
    setChallengeMode(null);
    setLeetcodeData(null);
    setTestCaseFiles([]);
    setErrors({});
    setLeetcodeTestCases(null);
    setGeneratedTestCases(null);
    setEditingChallenge(null);
  };

  const handleUpdateChallenge = () => {
    if (!editingChallenge || !validateChallenge()) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("challenge_name", currentChallenge.challenge_name);
      formData.append("difficulty_level", currentChallenge.difficulty_level);
      formData.append("max_score", currentChallenge.max_score.toString());
      formData.append("problem_statement", currentChallenge.problem_statement);
      formData.append("constraints", currentChallenge.constraints);
      formData.append("input_form", currentChallenge.input_form);
      formData.append("output_form", currentChallenge.output_form);
      formData.append("sample_testcase", currentChallenge.sample_testcase);
      formData.append("sample_output", currentChallenge.sample_output);
      formData.append("input_testcase", currentChallenge.input_testcase);
      formData.append("output_testcase", currentChallenge.output_testcase);
      formData.append("challenge_id",editingChallenge);

      console.log(currentChallenge);
      
      const response = axios.put(
        `http://127.0.0.1:8000/api/update-challenge/`,
        formData
      );
      console.log(response);

      const updatedChallenges = challenges.map((challenge) =>
        challenge.id === editingChallenge
          ? { ...challenge, ...currentChallenge }
          : challenge
      );
      setChallenges(updatedChallenges);
      console.log("Challenge updated successfully");
      resetForm();
    } catch (error) {
      console.error("Error while preparing challenge data for update:", error);
      return;
    }
  };

  const handleEditChallenge = (id: string) => {
    const challengeToEdit = challenges.find((c) => c.id === id);
    if (challengeToEdit && !challengeToEdit.isLeetCode) {
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
      });
      console.log(currentChallenge);

      setEditingChallenge(id);
      setIsAddingChallenge(true);
      setChallengeMode("manual"); // Set mode for editing
    }
  };
  const handleViewChallenge = (challenge: Challenge) => {
    setViewingChallenge(challenge);
  };

  const handleGenerateFullTestCases = (testCases: {
    input: string;
    output: string;
    count: number;
  }) => {
    setGeneratedTestCases(testCases);
  };

  const handleGenerateLeetCodeTestCases = async () => {
    setIsGeneratingLeetCodeTestCases(true);
    setTimeout(() => {
      setLeetcodeTestCases({
        input:
          "10\n[2,7,11,15]\n9\n[3,2,4]\n6\n[3,3]\n6\n[1,2,3,4,5]\n8\n[5,5,5,5]\n10",
        output: "[0,1]\n[1,2]\n[0,1]\n[2,3]\n[0,3]",
      });
      setIsGeneratingLeetCodeTestCases(false);
    }, 3000);
  };

  // const handleVerifyTestCases = async () => {
  //   setIsVerifying(true);
  //   setTimeout(() => {
  //     setVerificationResult({
  //       success: true,
  //       message: "All test cases verified successfully!",
  //     });
  //     setIsVerifying(false);
  //   }, 2000);
  // };

  const handleDeleteChallenge = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this challenge?"
    );
    if (!confirmed) return;
    try {
      console.log("Deleting challenge with ID:", id);
      const response = await axios.post(
        "http://127.0.0.1:8000/api/delete-challenge/",
        { challenge_id: id }
      );
      setChallenges(challenges.filter((c) => c.id !== id));
      console.log(`Challenge with ID ${id} deleted successfully`);
      console.log(response);
    } catch (error) {
      console.error("Error deleting challenge:", error);
      return;
    }
  };

  const handleSubmitContest = async () => {
    router.push("/contests");
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

  const handleInputChange = (field: string, value: string | number) => {
    setCurrentChallenge((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleButtonClick = (type: "input" | "output") => () => {
    if (type === "input") {
      input.current?.click();
    } else {
      output.current?.click();
    }
  };

  const handleFileChange =
    (type: "input" | "output") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "input" | "output"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      const errorFile: TestCaseFile = {
        name: file.name,
        content: "",
        type,
        error: "File size must be less than 1MB",
      };
      setTestCaseFiles((prev) => [
        ...prev.filter((f) => f.type !== type),
        errorFile,
      ]);
      return;
    }

    // Validate file type
    const allowedTypes = [".txt", ".in", ".out", ".json"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      const errorFile: TestCaseFile = {
        name: file.name,
        content: "",
        type,
        error: "Only .txt, .in, .out, and .json files are allowed",
      };
      setTestCaseFiles((prev) => [
        ...prev.filter((f) => f.type !== type),
        errorFile,
      ]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newFile: TestCaseFile = {
        name: file.name,
        content,
        type,
      };
      setTestCaseFiles((prev) => [
        ...prev.filter((f) => f.type !== type),
        newFile,
      ]);
    };
    reader.readAsText(file);

    // Also set the file for API submission
    handleFileChange(type)(event);
  };

  const handleAddChallengeClick = () => {
    setShowAddModal(true);
  };

  const handleModeSelect = (mode: "manual" | "leetcode", data?: any) => {
    setChallengeMode(mode);
    if (mode === "leetcode" && data) {
      setLeetcodeData(data);
    } else {
      setIsAddingChallenge(true);
    }
  };

  useEffect(() => {
    const contestId = searchParams.get("contestId");
    const EditChallenge = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/api/get-challenges/?contestId=" + contestId
        );
        if (response.status === 200) {
          setChallenges(response.data);
          console.log("Fetched challenges:", response.data);
        }
      } catch (error) {
        console.error("Error fetching challenges:", error);
      }
    };
    if (contestId) {
      EditChallenge();
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                router.push(`/edit-contest/${searchParams.get("contestId")}`)
              }
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Challenge Editor
              </h1>
              <p className="text-slate-600">
                Add coding challenges to your contest
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{challenges.length} Challenges</Badge>
            {challenges.length > 0 && (
              <Button
                onClick={handleSubmitContest}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
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
                    onClick={handleAddChallengeClick}
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
                    <p className="text-sm">
                      Click "Add" to create your first challenge
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {challenges.map((challenge) => (
                      <div key={challenge.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">
                              {challenge.challenge_name}
                            </h4>
                            {challenge.isLeetCode && (
                              <Badge variant="outline" className="text-xs mt-1">
                                LeetCode
                              </Badge>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            {challenge.isLeetCode ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewChallenge(challenge)}
                                title="View LeetCode Problem"
                              >
                                <Eye className="h-3 w-3 text-blue-600" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleEditChallenge(challenge.id)
                                }
                                title="Edit Challenge"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleDeleteChallenge(challenge.id)
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge
                            className={getDifficultyColor(
                              challenge.difficulty_level
                            )}
                          >
                            {challenge.difficulty_level}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {challenge.max_score} pts
                          </span>
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
            {challengeMode === "leetcode" && leetcodeData ? (
              <LeetCodePreview
                problemData={leetcodeData}
                onGenerateTestCases={handleGenerateLeetCodeTestCases}
                onAddChallenge={handleAddChallenge}
                testCases={leetcodeTestCases}
                isGenerating={isGeneratingLeetCodeTestCases}
              />
            ) : isAddingChallenge || editingChallenge ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>
                          {editingChallenge
                            ? "Edit Challenge"
                            : "Add New Challenge"}
                        </CardTitle>
                        <CardDescription>
                          Create a comprehensive coding challenge for
                          participants
                        </CardDescription>
                      </div>
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
                          onChange={(e) =>
                            handleInputChange("challenge_name", e.target.value)
                          }
                          className={
                            errors.challenge_name ? "border-red-500" : ""
                          }
                        />
                        {errors.challenge_name && (
                          <div className="flex items-center space-x-1 text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.challenge_name}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty Level</Label>
                        <Select
                          value={currentChallenge.difficulty_level}
                          onValueChange={(value: "Easy" | "Medium" | "Hard") =>
                            handleInputChange("difficulty_level", value)
                          }
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
                        onChange={(e) =>
                          handleInputChange(
                            "max_score",
                            Number.parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    {/* Problem Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Problem Description *</Label>
                      <div className="border rounded-lg">
                        <div className="border-b bg-slate-50 p-2 flex items-center space-x-2 text-sm">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                          >
                            B
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                          >
                            I
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                          >
                            U
                          </Button>
                          <div className="w-px h-4 bg-slate-300" />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                          >
                            Code
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                          >
                            Link
                          </Button>
                        </div>
                        <Textarea
                          id="description"
                          placeholder="Describe the problem statement in detail..."
                          rows={4}
                          value={currentChallenge.problem_statement}
                          onChange={(e) =>
                            handleInputChange(
                              "problem_statement",
                              e.target.value
                            )
                          }
                          className={`border-0 resize-none focus:ring-0 ${
                            errors.problem_statement ? "border-red-500" : ""
                          }`}
                        />
                      </div>
                      {errors.problem_statement && (
                        <div className="flex items-center space-x-1 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.problem_statement}</span>
                        </div>
                      )}
                    </div>

                    {/* Constraints */}
                    <div className="space-y-2">
                      <Label htmlFor="constraints">Constraints *</Label>
                      <div className="border rounded-lg">
                        <div className="border-b bg-slate-50 p-2 flex items-center space-x-2 text-sm">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                          >
                            B
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                          >
                            I
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                          >
                            List
                          </Button>
                        </div>
                        <Textarea
                          id="constraints"
                          placeholder="e.g., 1 ≤ n ≤ 10^5, 1 ≤ arr[i] ≤ 10^9"
                          rows={2}
                          value={currentChallenge.constraints}
                          onChange={(e) =>
                            handleInputChange("constraints", e.target.value)
                          }
                          className={`border-0 resize-none focus:ring-0 ${
                            errors.constraints ? "border-red-500" : ""
                          }`}
                        />
                      </div>
                      {errors.constraints && (
                        <div className="flex items-center space-x-1 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.constraints}</span>
                        </div>
                      )}
                    </div>

                    {/* Input/Output Format */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="input-format">Input Format *</Label>
                        <div className="border rounded-lg">
                          <div className="border-b bg-slate-50 p-2 flex items-center space-x-2 text-sm">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2"
                            >
                              Code
                            </Button>
                          </div>
                          <Textarea
                            id="input-format"
                            placeholder="Describe the input format..."
                            rows={3}
                            value={currentChallenge.input_form}
                            onChange={(e) =>
                              handleInputChange("input_form", e.target.value)
                            }
                            className={`border-0 resize-none focus:ring-0 ${
                              errors.input_form ? "border-red-500" : ""
                            }`}
                          />
                        </div>
                        {errors.input_form && (
                          <div className="flex items-center space-x-1 text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.input_form}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="output-format">Output Format *</Label>
                        <div className="border rounded-lg">
                          <div className="border-b bg-slate-50 p-2 flex items-center space-x-2 text-sm">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2"
                            >
                              Code
                            </Button>
                          </div>
                          <Textarea
                            id="output-format"
                            placeholder="Describe the expected output format..."
                            rows={3}
                            value={currentChallenge.output_form}
                            onChange={(e) =>
                              handleInputChange("output_form", e.target.value)
                            }
                            className={`border-0 resize-none focus:ring-0 ${
                              errors.output_form ? "border-red-500" : ""
                            }`}
                          />
                        </div>
                        {errors.output_form && (
                          <div className="flex items-center space-x-1 text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.output_form}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sample Test Case */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sample-input">Sample Input *</Label>
                        <Textarea
                          id="sample-input"
                          placeholder="Provide sample input..."
                          rows={3}
                          value={currentChallenge.sample_testcase}
                          onChange={(e) =>
                            handleInputChange("sample_testcase", e.target.value)
                          }
                          className={`font-mono text-sm ${
                            errors.sample_testcase ? "border-red-500" : ""
                          }`}
                        />
                        {errors.sample_testcase && (
                          <div className="flex items-center space-x-1 text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.sample_testcase}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sample-output">Sample Output *</Label>
                        <Textarea
                          id="sample-output"
                          placeholder="Expected output for sample input..."
                          rows={3}
                          value={currentChallenge.sample_output}
                          onChange={(e) =>
                            handleInputChange("sample_output", e.target.value)
                          }
                          className={`font-mono text-sm ${
                            errors.sample_output ? "border-red-500" : ""
                          }`}
                        />
                        {errors.sample_output && (
                          <div className="flex items-center space-x-1 text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.sample_output}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-4">
                      <Label>Test Case Files *</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-emerald-300 transition-colors">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                            <p className="text-sm text-slate-600 mb-2 text-center">
                              Upload Input File
                            </p>
                            <div className="text-center">
                              <input
                                type="file"
                                ref={input}
                                onChange={(e) => handleFileUpload(e, "input")}
                                className="hidden"
                                accept=".txt,.in,.out,.json"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleButtonClick("input")}
                              >
                                Choose File
                              </Button>
                            </div>
                            {currentChallenge.input_testcase &&
                              (typeof currentChallenge.input_testcase ===
                              "string" ? (
                                <p className="text-xs text-green-600 mt-2 text-center">
                                  ✓{" "}
                                  {(currentChallenge.input_testcase as string)
                                    .split("/")
                                    .pop()}
                                </p>
                              ) : (
                                <p className="text-xs text-green-600 mt-2 text-center">
                                  ✓ {currentChallenge.input_testcase.name}
                                </p>
                              ))}
                          </div>
                          <SafePreview
                            type="input"
                            file={currentChallenge.input_testcase}
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-emerald-300 transition-colors">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                            <p className="text-sm text-slate-600 mb-2">
                              Upload Output File
                            </p>
                            <input
                              type="file"
                              ref={output}
                              onChange={(e) => handleFileUpload(e, "output")}
                              className="hidden"
                              accept=".txt,.in,.out,.json"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleButtonClick("output")}
                            >
                              Choose File
                            </Button>
                            {currentChallenge.output_testcase &&
                              (typeof currentChallenge.output_testcase ===
                              "string" ? (
                                <p className="text-xs text-green-600 mt-2 text-center">
                                  ✓{" "}
                                  {(currentChallenge.output_testcase as string)
                                    .split("/")
                                    .pop()}
                                </p>
                              ) : (
                                <p className="text-xs text-green-600 mt-2 text-center">
                                  ✓ {currentChallenge.output_testcase.name}
                                </p>
                              ))}
                          </div>
                          <SafePreview
                            type="output"
                            file={currentChallenge.output_testcase}
                          />
                        </div>
                      </div>
                      {errors.files && (
                        <div className="flex items-center space-x-1 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.files}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                      <Button
                        onClick={
                          editingChallenge
                            ? handleUpdateChallenge
                            : handleAddChallenge
                        }
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {editingChallenge
                          ? "Update Challenge"
                          : "Add Challenge"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Full Test Case Generator */}
                {(currentChallenge.problem_statement ||
                  currentChallenge.constraints) && (
                  <TestCaseGenerator
                    problemDescription={currentChallenge.problem_statement}
                    constraints={currentChallenge.constraints}
                    sampleInput={currentChallenge.sample_testcase}
                    sampleOutput={currentChallenge.sample_output}
                    onGenerate={handleGenerateFullTestCases}
                    isGenerating={isGeneratingTestCase}
                  />
                )}
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Plus className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">
                    Ready to add challenges?
                  </h3>
                  <p className="text-slate-500 mb-4">
                    Click "Add" to create your first coding challenge
                  </p>
                  <Button
                    onClick={handleAddChallengeClick}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Challenge
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add Challenge Modal */}
      <AddChallengeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelectMode={handleModeSelect}
      />

      {/* LeetCode View Modal */}
      {viewingChallenge && (
        <LeetCodeViewModal
          isOpen={!!viewingChallenge}
          onClose={() => setViewingChallenge(null)}
          challenge={viewingChallenge}
        />
      )}

      <Footer />
    </div>
  );
}

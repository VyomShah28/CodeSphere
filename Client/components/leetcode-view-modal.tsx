"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye } from "lucide-react";

interface LeetCodeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: {
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
    isLeetCode?: boolean;
    cpp_code?: string;
    java_code?: string;
    python_code?: string;
  };
}

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

export function LeetCodeViewModal({
  isOpen,
  onClose,
  challenge,
}: LeetCodeViewModalProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <span>{challenge.challenge_name}</span>
            {challenge.isLeetCode && (
              <Badge variant="outline" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                LeetCode
              </Badge>
            )}
            <Badge className={getDifficultyColor(challenge.difficulty_level)}>
              {challenge.difficulty_level}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {challenge.isLeetCode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">
                    LeetCode Problem
                  </h4>
                  <p className="text-sm text-blue-700">
                    This problem was imported from LeetCode and is read-only.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="constraints">Constraints</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
              {challenge.isLeetCode && (
                <TabsTrigger value="solutions">Solutions</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="description" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Problem Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 border rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-slate-700">
                      {challenge?.problem_statement}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="constraints" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Constraints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 border rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-slate-700">
                      {challenge.constraints}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Input</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-50 border rounded-lg p-4">
                      <pre className="text-sm text-slate-700 font-mono">
                        {challenge.sample_testcase}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Output</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-50 border rounded-lg p-4">
                      <pre className="text-sm text-slate-700 font-mono">
                        {challenge.sample_output}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="solutions" className="space-y-4">
              <Tabs defaultValue="cpp" className="w-full">
                <TabsList>
                  <TabsTrigger value="cpp">C++</TabsTrigger>
                  <TabsTrigger value="java">Java</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                </TabsList>
                <TabsContent value="cpp">
                  <Card>
                    <CardHeader>
                      <CardTitle>C++ Solution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-slate-100">
                          <code>{challenge.cpp_code}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="java">
                  <Card>
                    <CardHeader>
                      <CardTitle>Java Solution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-slate-100">
                          <code>{challenge.java_code}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="python">
                  <Card>
                    <CardHeader>
                      <CardTitle>Python Solution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-slate-100">
                          <code>{challenge.python_code}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

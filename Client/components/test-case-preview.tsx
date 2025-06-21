"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertCircle } from "lucide-react"

interface TestCasePreviewProps {
  name: string
  content: string
  type: "input" | "output"
  error?: string
}

export function TestCasePreview({ name, content, type, error }: TestCasePreviewProps) {
  const getFileSize = (content: string) => {
    const bytes = new Blob([content]).size
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getLineCount = (content: string) => {
    return content.split("\n").length
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>{name}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {type === "input" ? "Input" : "Output"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getFileSize(content)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getLineCount(content)} lines
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <pre className="text-xs bg-slate-50 p-3 rounded-md overflow-x-auto max-h-40 border font-mono">
            {content.length > 1000 ? (
              <>
                {content.substring(0, 1000)}
                <div className="text-slate-500 italic mt-2">... ({content.length - 1000} more characters)</div>
              </>
            ) : (
              content
            )}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Eye, Monitor } from "lucide-react"

interface SecurityWarningProps {
  type: "fullscreen-exit" | "tab-switch" | "multiple-violations"
  isVisible: boolean
  onDismiss: () => void
  onReturnToFullscreen?: () => void
  violationCount?: number
}

export function SecurityWarning({
  type,
  isVisible,
  onDismiss,
  onReturnToFullscreen,
  violationCount = 0,
}: SecurityWarningProps) {
  if (!isVisible) return null

  const getWarningContent = () => {
    switch (type) {
      case "fullscreen-exit":
        return {
          icon: <Monitor className="h-6 w-6 text-red-600" />,
          title: "Full-Screen Mode Required",
          description: "Full screen is required. Exiting will automatically submit your contest.",
          severity: "danger" as const,
          action: "Return to Full-Screen",
        }
      case "tab-switch":
        return {
          icon: <Eye className="h-6 w-6 text-orange-600" />,
          title: "Tab Switch Detected",
          description: "You switched tabs or windows. This activity has been recorded.",
          severity: "caution" as const,
          action: "Continue Contest",
        }
      case "multiple-violations":
        return {
          icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
          title: "Multiple Security Violations",
          description: `You have ${violationCount} security violations. Further violations may result in disqualification.`,
          severity: "danger" as const,
          action: "Acknowledge Warning",
        }
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
          title: "Security Warning",
          description: "Please follow contest security guidelines.",
          severity: "warning" as const,
          action: "Continue",
        }
    }
  }

  const content = getWarningContent()

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "danger":
        return "border-red-300 bg-gradient-to-br from-red-50 to-red-100"
      case "warning":
        return "border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100"
      case "caution":
        return "border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-100"
      default:
        return "border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-md ${getSeverityStyles(content.severity)}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div
              className={`p-3 rounded-full ${
                content.severity === "danger"
                  ? "bg-red-100"
                  : content.severity === "warning"
                    ? "bg-orange-100"
                    : "bg-yellow-100"
              }`}
            >
              {content.icon}
            </div>
          </div>
          <CardTitle
            className={`text-xl ${
              content.severity === "danger"
                ? "text-red-800"
                : content.severity === "warning"
                  ? "text-orange-800"
                  : "text-yellow-800"
            }`}
          >
            {content.title}
          </CardTitle>
          <CardDescription
            className={`${
              content.severity === "danger"
                ? "text-red-700"
                : content.severity === "warning"
                  ? "text-orange-700"
                  : "text-yellow-700"
            }`}
          >
            {content.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {violationCount > 0 && (
            <div className="flex justify-center">
              <Badge variant="destructive" className="text-sm">
                {violationCount} Violation{violationCount !== 1 ? "s" : ""} Recorded
              </Badge>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {type === "fullscreen-exit" && onReturnToFullscreen && (
              <Button onClick={onReturnToFullscreen} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                <Monitor className="h-4 w-4 mr-2" />
                {content.action}
              </Button>
            )}
            {type !== "fullscreen-exit" && (
              <Button
                onClick={onDismiss}
                className={`w-full ${
                  content.severity === "danger"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : content.severity === "warning"
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-yellow-600 hover:bg-yellow-700 text-white"
                }`}
              >
                {content.action}
              </Button>
            )}
          </div>

          {content.severity === "danger" && (
            <p className="text-xs text-center text-red-600 font-medium">
              ⚠️ Warning: Further violations may result in automatic disqualification
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

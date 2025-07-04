"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Eye, Shield } from "lucide-react"

interface TabViolationWarningProps {
  isVisible: boolean
  violationCount: number
  onDismiss: () => void
}

export function TabViolationWarning({ isVisible, violationCount, onDismiss }: TabViolationWarningProps) {
  if (!isVisible) return null

  const remainingChances = 3 - violationCount
  const isLastChance = violationCount === 2

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card
        className={`w-full max-w-lg border-2 ${isLastChance ? "border-red-300 bg-gradient-to-br from-red-50 to-orange-50" : "border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50"}`}
      >
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${isLastChance ? "bg-red-100" : "bg-orange-100"}`}>
              <AlertTriangle className={`h-8 w-8 ${isLastChance ? "text-red-600" : "text-orange-600"}`} />
            </div>
          </div>
          <CardTitle className={`text-2xl ${isLastChance ? "text-red-800" : "text-orange-800"}`}>
            {isLastChance ? "⚠️ FINAL WARNING!" : "⚠️ Contest Rule Violation"}
          </CardTitle>
          <CardDescription className={`${isLastChance ? "text-red-700" : "text-orange-700"}`}>
            {isLastChance
              ? "This is your last chance before auto-submission!"
              : "You cannot switch tabs or do other activities during the contest"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Violation Counter */}
          <div
            className={`text-center p-4 rounded-lg ${isLastChance ? "bg-red-100 border border-red-200" : "bg-orange-100 border border-orange-200"}`}
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className={`h-5 w-5 ${isLastChance ? "text-red-600" : "text-orange-600"}`} />
              <span className={`font-bold text-lg ${isLastChance ? "text-red-800" : "text-orange-800"}`}>
                Violation {violationCount} of 3
              </span>
            </div>
            <p className={`text-sm ${isLastChance ? "text-red-700" : "text-orange-700"}`}>
              {isLastChance
                ? "One more violation will automatically submit your contest!"
                : `You have ${remainingChances} chance${remainingChances === 1 ? "" : "s"} remaining`}
            </p>
          </div>

          {/* Warning Message */}
          <div
            className={`p-4 rounded-lg border ${isLastChance ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}
          >
            <div className="flex items-start space-x-3">
              <Eye className={`h-5 w-5 mt-0.5 ${isLastChance ? "text-red-600" : "text-yellow-600"}`} />
              <div>
                <h4 className={`font-semibold mb-2 ${isLastChance ? "text-red-800" : "text-yellow-800"}`}>
                  Monitored Activities:
                </h4>
                <ul className={`text-sm space-y-1 ${isLastChance ? "text-red-700" : "text-yellow-700"}`}>
                  <li>• Switching browser tabs</li>
                  <li>• Minimizing the window</li>
                  <li>• Clicking outside the browser</li>
                  <li>• Using Alt+Tab or Cmd+Tab</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={onDismiss}
              className={`px-8 py-3 text-lg font-semibold ${
                isLastChance ? "bg-red-600 hover:bg-red-700 text-white" : "bg-orange-600 hover:bg-orange-700 text-white"
              }`}
            >
              I Understand - Continue Contest
            </Button>
          </div>

          <p className={`text-xs text-center font-medium ${isLastChance ? "text-red-600" : "text-orange-600"}`}>
            {isLastChance
              ? "Stay focused! Your contest depends on it."
              : "Please stay focused on the contest to avoid further violations."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

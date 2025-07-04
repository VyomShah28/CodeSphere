"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Clock } from "lucide-react"

interface AutoSubmitNotificationProps {
  isVisible: boolean
  onComplete: () => void
}

export function AutoSubmitNotification({ isVisible, onComplete }: AutoSubmitNotificationProps) {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (!isVisible) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 100)

    return () => clearInterval(timer)
  }, [isVisible, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-300 bg-gradient-to-br from-red-50 to-red-100">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full animate-pulse">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-800">⛔ Contest Auto-Submitted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          {/* Main Message */}
          <div className="bg-red-100 border border-red-200 rounded-lg p-4">
            <h4 className="font-bold text-red-800 mb-2">Rule Violation Detected</h4>
            <p className="text-red-700">
              You violated contest rules by switching tabs or losing focus 3 times. Your contest has been automatically
              submitted.
            </p>
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center space-x-3">
            <Clock className="h-6 w-6 text-red-600" />
            <div>
              <p className="text-red-800 font-semibold">Redirecting to results in:</p>
              <div className="text-3xl font-bold text-red-600 animate-pulse">{countdown}</div>
            </div>
          </div>

          <p className="text-sm text-red-600 font-medium">Please review the contest rules for future participation.</p>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, LogOut, Shield } from "lucide-react"

interface ContestExitModalProps {
  isOpen: boolean
  onStay: () => void
  onExit: () => void
  contestName: string
}

export function ContestExitModal({ isOpen, onStay, onExit, contestName }: ContestExitModalProps) {
  if (!isOpen) return null

  const handleExit = async () => {
    // Exit fullscreen before navigating away
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch (error) {
        console.warn("Failed to exit fullscreen:", error)
      }
    }
    onExit()
  }

  const handleStay = () => {
    onStay()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-800">Leaving Contest</CardTitle>
          <CardDescription className="text-red-700">You are about to leave {contestName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning Notice */}
          <div className="bg-red-100 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 mb-2">Warning:</h4>
                <p className="text-sm text-red-700">
                  Leaving the contest will automatically submit your current progress and end your participation.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button onClick={handleStay} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              <Shield className="h-4 w-4 mr-2" />
              Stay in Contest
            </Button>
            <Button
              onClick={handleExit}
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-100"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Exit and Submit Contest
            </Button>
          </div>

          <p className="text-xs text-center text-red-600">
            This action cannot be undone. Your current progress will be submitted.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

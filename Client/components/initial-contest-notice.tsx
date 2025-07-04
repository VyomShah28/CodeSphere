"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Eye, Shield, Clock } from "lucide-react"

interface InitialContestNoticeProps {
  isOpen: boolean
  onAccept: () => void
  contestName: string
}

export function InitialContestNotice({ isOpen, onAccept, contestName }: InitialContestNoticeProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-orange-800">🚫 Contest Rules & Monitoring</CardTitle>
          <CardDescription className="text-orange-700">Important guidelines for {contestName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Warning */}
          <div className="bg-red-100 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-800 mb-2 text-lg">⚠️ IMPORTANT WARNING</h4>
                <p className="text-red-700 font-medium">
                  You <strong>CANNOT</strong> switch tabs or leave this page during the contest. You will be given{" "}
                  <strong>3 chances</strong>. After that, your contest will be
                  <strong> automatically submitted</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Monitored Activities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg border border-orange-200">
              <Eye className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Tab Switching</p>
                <p className="text-sm text-orange-600">Switching to other browser tabs</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg border border-orange-200">
              <Shield className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Window Focus</p>
                <p className="text-sm text-orange-600">Clicking outside the browser</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg border border-orange-200">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Window Minimizing</p>
                <p className="text-sm text-orange-600">Minimizing the browser window</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg border border-orange-200">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Alt+Tab Usage</p>
                <p className="text-sm text-orange-600">Switching between applications</p>
              </div>
            </div>
          </div>

          {/* Violation Process */}
          <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-3">📋 Violation Process:</h4>
            <div className="space-y-2 text-sm text-yellow-700">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>
                  <strong>First Violation:</strong> Warning message displayed
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>
                  <strong>Second Violation:</strong> Final warning message
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>
                  <strong>Third Violation:</strong> Contest automatically submitted
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={onAccept} className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-3">
              I Understand - Start Contest
            </Button>
          </div>

          <p className="text-xs text-center text-orange-600 font-medium">
            By proceeding, you acknowledge that you understand and agree to follow these contest rules.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

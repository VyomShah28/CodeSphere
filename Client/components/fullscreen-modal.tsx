"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Monitor, Shield, Eye, Lock } from "lucide-react"

interface FullscreenModalProps {
  isOpen: boolean
  onAccept: () => void
  contestName: string
  onModalOpen?: () => void
  onModalClose?: () => void
}

export function FullscreenModal({ isOpen, onAccept, contestName, onModalOpen, onModalClose }: FullscreenModalProps) {
  const [hasAccepted, setHasAccepted] = useState(false)

  useEffect(() => {
    if (isOpen && onModalOpen) {
      onModalOpen()
    } else if (!isOpen && onModalClose) {
      onModalClose()
    }
  }, [isOpen, onModalOpen, onModalClose])

  if (!isOpen) return null

  const handleAccept = () => {
    setHasAccepted(true)
    onAccept()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-orange-800">Contest Security Mode Required</CardTitle>
          <CardDescription className="text-orange-700">
            {contestName} requires full-screen mode and security restrictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
              <Monitor className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Full-Screen Mode</p>
                <p className="text-sm text-orange-600">Required for contest participation</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
              <Shield className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Keyboard Restrictions</p>
                <p className="text-sm text-orange-600">Common shortcuts will be disabled</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
              <Eye className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Tab Monitoring</p>
                <p className="text-sm text-orange-600">Tab switches will be tracked</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
              <Lock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Right-Click Disabled</p>
                <p className="text-sm text-orange-600">Context menu will be blocked</p>
              </div>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="bg-orange-100 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-800 mb-2">Important Notice:</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Exiting full-screen mode will trigger warnings</li>
                  <li>• Multiple violations may result in contest disqualification</li>
                  <li>• Tab switching and window changes are monitored</li>
                  <li>• Use only the provided coding environment</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleAccept}
              disabled={hasAccepted}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {hasAccepted ? "Entering Contest..." : "Accept & Enter Contest"}
            </Button>
          </div>

          <div className="bg-red-100 border border-red-200 rounded-lg p-4 mt-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 mb-2">Important:</h4>
                <p className="text-sm text-red-700">
                  Full screen is required. Exiting will automatically submit your contest.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-orange-600">
            By proceeding, you agree to the contest security requirements and monitoring policies.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

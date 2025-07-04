"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"

interface UseTabViolationsReturn {
  violationCount: number
  showWarning: boolean
  showInitialNotice: boolean
  isTabActive: boolean
  dismissWarning: () => void
  dismissInitialNotice: () => void
  pauseViolationDetection: () => void
  resumeViolationDetection: () => void
}

export function useTabViolations(): UseTabViolationsReturn {
  const [violationCount, setViolationCount] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [showInitialNotice, setShowInitialNotice] = useState(false)
  const [isTabActive, setIsTabActive] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const pathname = usePathname()

  // Only track violations on contest pages
  const shouldTrackViolations = pathname === "/contest-waiting" || pathname === "/contest-live"

  // Load violation count from sessionStorage on mount
  useEffect(() => {
    if (shouldTrackViolations) {
      const savedCount = sessionStorage.getItem("contest_violations")
      if (savedCount) {
        setViolationCount(Number.parseInt(savedCount, 10))
      }

      // Show initial notice only once per session
      const hasSeenNotice = sessionStorage.getItem("contest_notice_seen")
      if (!hasSeenNotice) {
        setShowInitialNotice(true)
      }
    }
  }, [shouldTrackViolations])

  // Save violation count to sessionStorage whenever it changes
  useEffect(() => {
    if (shouldTrackViolations && violationCount > 0) {
      sessionStorage.setItem("contest_violations", violationCount.toString())
    }
  }, [violationCount, shouldTrackViolations])

  // Tab visibility detection
  useEffect(() => {
    if (!shouldTrackViolations || isPaused) return

    const handleVisibilityChange = () => {
      const isActive = document.visibilityState === "visible"
      setIsTabActive(isActive)

      if (!isActive) {
        setViolationCount((prev) => {
          const newCount = prev + 1
          setShowWarning(true)
          return newCount
        })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [shouldTrackViolations, isPaused])

  // Clear session storage when leaving contest pages
  useEffect(() => {
    return () => {
      if (!shouldTrackViolations) {
        sessionStorage.removeItem("contest_violations")
        sessionStorage.removeItem("contest_notice_seen")
      }
    }
  }, [shouldTrackViolations])

  const dismissWarning = useCallback(() => {
    setShowWarning(false)
  }, [])

  const dismissInitialNotice = useCallback(() => {
    setShowInitialNotice(false)
    sessionStorage.setItem("contest_notice_seen", "true")
  }, [])

  const pauseViolationDetection = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resumeViolationDetection = useCallback(() => {
    setIsPaused(false)
  }, [])

  return {
    violationCount,
    showWarning,
    showInitialNotice,
    isTabActive,
    dismissWarning,
    dismissInitialNotice,
    pauseViolationDetection,
    resumeViolationDetection,
  }
}

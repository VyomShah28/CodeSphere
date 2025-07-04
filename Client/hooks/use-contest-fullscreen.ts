"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"

interface UseContestFullscreenReturn {
  isFullscreen: boolean
  enterFullscreen: () => Promise<void>
  exitFullscreen: () => Promise<void>
  isSupported: boolean
  exitCount: number
  shouldEnforceFullscreen: boolean
}

export function useContestFullscreen(): UseContestFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [exitCount, setExitCount] = useState(0)
  const pathname = usePathname()

  // Only enforce fullscreen on contest pages
  const shouldEnforceFullscreen = pathname === "/contest-waiting" || pathname === "/contest-live"

  const enterFullscreen = useCallback(async () => {
    if (!document.documentElement.requestFullscreen) return

    try {
      await document.documentElement.requestFullscreen()
    } catch (error) {
      console.warn("Failed to enter fullscreen:", error)
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    if (!document.exitFullscreen) return

    try {
      await document.exitFullscreen()
    } catch (error) {
      console.warn("Failed to exit fullscreen:", error)
    }
  }, [])

  useEffect(() => {
    // Check if fullscreen is supported
    setIsSupported(!!document.documentElement.requestFullscreen)

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFullscreen)

      // Track exits from fullscreen only on contest pages
      if (!isCurrentlyFullscreen && isFullscreen && shouldEnforceFullscreen) {
        setExitCount((prev) => prev + 1)
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [isFullscreen, shouldEnforceFullscreen])

  // Auto-exit fullscreen when leaving contest pages
  useEffect(() => {
    return () => {
      // Cleanup: exit fullscreen when component unmounts or path changes away from contest pages
      if (!shouldEnforceFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          console.warn("Failed to exit fullscreen on cleanup")
        })
      }
    }
  }, [shouldEnforceFullscreen])

  // Also add immediate exit when shouldEnforceFullscreen becomes false
  useEffect(() => {
    if (!shouldEnforceFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        console.warn("Failed to exit fullscreen when leaving contest page")
      })
    }
  }, [shouldEnforceFullscreen])

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    isSupported,
    exitCount,
    shouldEnforceFullscreen,
  }
}

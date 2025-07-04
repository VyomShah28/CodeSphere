"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"

interface UseFullscreenReturn {
  isFullscreen: boolean
  enterFullscreen: () => Promise<void>
  exitFullscreen: () => Promise<void>
  isSupported: boolean
  exitCount: number
}

export function useFullscreen(): UseFullscreenReturn {
  const pathname = usePathname()
  const shouldEnforceFullscreen = pathname === "/contest-waiting" || pathname === "/contest-live"

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [exitCount, setExitCount] = useState(0)

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
    if (!shouldEnforceFullscreen) return

    // Check if fullscreen is supported
    setIsSupported(!!document.documentElement.requestFullscreen)

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFullscreen)

      // Track exits from fullscreen
      if (!isCurrentlyFullscreen && isFullscreen) {
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

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    isSupported,
    exitCount,
  }
}

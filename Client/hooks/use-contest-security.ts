"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"

interface UseContestSecurityReturn {
  isTabActive: boolean
  tabSwitchCount: number
  isSecurityEnabled: boolean
  enableSecurity: () => void
  disableSecurity: () => void
}

export function useContestSecurity(): UseContestSecurityReturn {
  const pathname = usePathname()
  const shouldEnforceFullscreen = pathname === "/contest-waiting" || pathname === "/contest-live"

  const [isTabActive, setIsTabActive] = useState(true)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(false)

  const handleVisibilityChange = useCallback(() => {
    const isActive = !document.hidden
    setIsTabActive(isActive)

    if (!isActive && isSecurityEnabled) {
      setTabSwitchCount((prev) => prev + 1)
    }
  }, [isSecurityEnabled])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isSecurityEnabled) return

      // Block common shortcuts
      const blockedCombinations = [
        // Developer tools
        { key: "F12" },
        { key: "I", ctrlKey: true, shiftKey: true },
        { key: "J", ctrlKey: true, shiftKey: true },
        { key: "C", ctrlKey: true, shiftKey: true },
        { key: "U", ctrlKey: true },

        // Navigation
        { key: "T", ctrlKey: true },
        { key: "N", ctrlKey: true },
        { key: "W", ctrlKey: true },
        { key: "R", ctrlKey: true },
        { key: "F5" },

        // Alt+Tab (limited effectiveness)
        { key: "Tab", altKey: true },

        // Window switching
        { key: "Tab", ctrlKey: true },
        { key: "Tab", ctrlKey: true, shiftKey: true },
      ]

      const isBlocked = blockedCombinations.some((combo) => {
        return (
          e.key === combo.key &&
          !!e.ctrlKey === !!combo.ctrlKey &&
          !!e.shiftKey === !!combo.shiftKey &&
          !!e.altKey === !!combo.altKey
        )
      })

      if (isBlocked) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    },
    [isSecurityEnabled],
  )

  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      if (isSecurityEnabled) {
        e.preventDefault()
        return false
      }
    },
    [isSecurityEnabled],
  )

  const enableSecurity = useCallback(() => {
    setIsSecurityEnabled(true)
  }, [])

  const disableSecurity = useCallback(() => {
    setIsSecurityEnabled(false)
  }, [])

  useEffect(() => {
    if (!shouldEnforceFullscreen) return

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("keydown", handleKeyDown, true)
    document.addEventListener("contextmenu", handleContextMenu)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [handleVisibilityChange, handleKeyDown, handleContextMenu, shouldEnforceFullscreen])

  return {
    isTabActive,
    tabSwitchCount,
    isSecurityEnabled,
    enableSecurity,
    disableSecurity,
  }
}

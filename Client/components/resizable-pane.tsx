"use client"

import type React from "react"

import { useState, useRef, useEffect, type ReactNode } from "react"

interface ResizablePaneProps {
  children: ReactNode
  direction: "horizontal" | "vertical"
  initialSize?: number
  minSize?: number
  maxSize?: number
  className?: string
}

export function ResizablePane({
  children,
  direction,
  initialSize = 50,
  minSize = 20,
  maxSize = 80,
  className = "",
}: ResizablePaneProps) {
  const [size, setSize] = useState(initialSize)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const startSize = useRef<number>(initialSize)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const container = containerRef.current.parentElement
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      let newSize: number

      if (direction === "horizontal") {
        const deltaX = e.clientX - startPos.current.x
        const deltaPercent = (deltaX / containerRect.width) * 100
        newSize = startSize.current + deltaPercent
      } else {
        const deltaY = e.clientY - startPos.current.y
        const deltaPercent = (deltaY / containerRect.height) * 100
        newSize = startSize.current + deltaPercent
      }

      // Enforce min/max constraints
      newSize = Math.max(minSize, Math.min(maxSize, newSize))
      setSize(newSize)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize"
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, direction, minSize, maxSize])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    startPos.current = { x: e.clientX, y: e.clientY }
    startSize.current = size
    setIsResizing(true)
  }

  const sizeStyle = direction === "horizontal" ? { width: `${size}%` } : { height: `${size}%` }

  return (
    <>
      <div ref={containerRef} className={`${className}`} style={sizeStyle}>
        {children}
      </div>

      {/* Resize Handle */}
      <div
        className={`
          ${
            direction === "horizontal"
              ? "w-1 cursor-col-resize hover:w-2 hover:bg-blue-500/30"
              : "h-1 cursor-row-resize hover:h-2 hover:bg-blue-500/30"
          }
          bg-slate-300 dark:bg-slate-600 transition-all duration-150 flex-shrink-0 relative group
          ${isResizing ? "bg-blue-500 dark:bg-blue-400" : ""}
        `}
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator */}
        <div
          className={`
          ${
            direction === "horizontal"
              ? "w-full h-8 top-1/2 -translate-y-1/2 left-0"
              : "h-full w-8 left-1/2 -translate-x-1/2 top-0"
          }
          absolute bg-slate-400 dark:bg-slate-500 rounded opacity-0 group-hover:opacity-100 transition-opacity
          flex items-center justify-center
        `}
        >
          <div className={`${direction === "horizontal" ? "w-0.5 h-4" : "h-0.5 w-4"} bg-white rounded`} />
        </div>
      </div>
    </>
  )
}

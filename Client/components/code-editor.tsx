"use client"

import { Editor } from "@monaco-editor/react"
import { useRef, useEffect, useState } from "react"

interface CodeEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  language: string
  theme?: "vs-dark" | "vs-light"
  height?: string
  readOnly?: boolean
  className?: string
}

export function CodeEditor({
  value,
  onChange,
  language,
  theme = "vs-dark",
  height = "500px",
  readOnly = false,
  className = "",
}: CodeEditorProps) {
  const editorRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [editorDimensions, setEditorDimensions] = useState({ width: 0, height: 0 })

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setEditorDimensions({ width: rect.width, height: rect.height })

        // Trigger editor layout update
        if (editorRef.current && isEditorReady) {
          setTimeout(() => {
            editorRef.current.layout()
          }, 100)
        }
      }
    }

    // Initial size calculation
    handleResize()

    // Listen for window resize
    window.addEventListener("resize", handleResize)

    // Use ResizeObserver for more accurate container size tracking
    let resizeObserver: ResizeObserver | null = null
    if (containerRef.current && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener("resize", handleResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [isEditorReady])

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    setIsEditorReady(true)

    // Configure Monaco themes
    monaco.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        { token: "keyword", foreground: "569CD6" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "type", foreground: "4EC9B0" },
        { token: "function", foreground: "DCDCAA" },
      ],
      colors: {
        "editor.background": "#0f172a",
        "editor.foreground": "#e2e8f0",
        "editorLineNumber.foreground": "#64748b",
        "editorLineNumber.activeForeground": "#f1f5f9",
        "editor.selectionBackground": "#334155",
        "editor.lineHighlightBackground": "#1e293b",
        "editorCursor.foreground": "#10b981",
        "editor.findMatchBackground": "#065f46",
        "editor.findMatchHighlightBackground": "#064e3b",
      },
    })

    monaco.editor.defineTheme("custom-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "008000", fontStyle: "italic" },
        { token: "keyword", foreground: "0000FF" },
        { token: "string", foreground: "A31515" },
        { token: "number", foreground: "098658" },
        { token: "type", foreground: "267F99" },
        { token: "function", foreground: "795E26" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#000000",
        "editorLineNumber.foreground": "#237893",
        "editor.selectionBackground": "#ADD6FF",
        "editor.lineHighlightBackground": "#f3f4f6",
        "editorCursor.foreground": "#000000",
      },
    })

    // Set the custom theme
    monaco.editor.setTheme(theme === "vs-dark" ? "custom-dark" : "custom-light")

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', monospace",
      fontLigatures: true,
      lineHeight: 1.6,
      letterSpacing: 0.5,
      minimap: { enabled: false },
      automaticLayout: true,
      autoClosingBrackets: "always",
      autoClosingQuotes: "always",
      autoIndent: "full",
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true,
      },
      wordWrap: "on",
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: "smooth",
      renderLineHighlight: "all",
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: readOnly,
      cursorStyle: "line",
      mouseWheelZoom: true,
      folding: true,
      foldingStrategy: "indentation",
      showFoldingControls: "always",
      contextmenu: true,
      copyWithSyntaxHighlighting: true,
      tabSize: 4,
      insertSpaces: true,
      detectIndentation: true,
      trimAutoWhitespace: true,
      formatOnPaste: true,
      formatOnType: true,
      scrollbar: {
        vertical: "visible",
        horizontal: "visible",
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      renderWhitespace: "selection",
      renderControlCharacters: false,
      renderIndentGuides: true,
      highlightActiveIndentGuide: true,
    })

    // Add custom key bindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      console.log("Save shortcut intercepted in contest mode")
    })

    // Force initial layout
    setTimeout(() => {
      editor.layout()
      editor.focus()
    }, 100)
  }

  const handleEditorChange = (value: string | undefined) => {
    onChange(value)
  }

  // Map language names to Monaco language identifiers
  const getMonacoLanguage = (lang: string) => {
    const languageMap: Record<string, string> = {
      python: "python",
      java: "java",
      cpp: "cpp",
      "c++": "cpp",
      javascript: "javascript",
      js: "javascript",
      typescript: "typescript",
      ts: "typescript",
      c: "c",
      csharp: "csharp",
      "c#": "csharp",
      go: "go",
      rust: "rust",
      php: "php",
      ruby: "ruby",
      swift: "swift",
      kotlin: "kotlin",
    }
    return languageMap[lang.toLowerCase()] || "plaintext"
  }

  const editorOptions = {
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', monospace",
    fontLigatures: true,
    lineHeight: 1.6,
    letterSpacing: 0.5,
    minimap: { enabled: false },
    automaticLayout: true,
    autoClosingBrackets: "always" as const,
    autoClosingQuotes: "always" as const,
    autoIndent: "full" as const,
    suggestOnTriggerCharacters: true,
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true,
    },
    wordWrap: "on" as const,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: "smooth" as const,
    renderLineHighlight: "all" as const,
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: readOnly,
    cursorStyle: "line" as const,
    mouseWheelZoom: true,
    folding: true,
    foldingStrategy: "indentation" as const,
    showFoldingControls: "always" as const,
    contextmenu: true,
    copyWithSyntaxHighlighting: true,
    tabSize: 4,
    insertSpaces: true,
    detectIndentation: true,
    trimAutoWhitespace: true,
    formatOnPaste: true,
    formatOnType: true,
    scrollbar: {
      vertical: "visible" as const,
      horizontal: "visible" as const,
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    renderWhitespace: "selection" as const,
    renderControlCharacters: false,
    renderIndentGuides: true,
    highlightActiveIndentGuide: true,
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: height === "100%" ? "100%" : height }}
    >
      {/* Loading overlay */}
      {!isEditorReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-400 z-10">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
            <span className="text-sm">Loading Monaco Editor...</span>
          </div>
        </div>
      )}

      {/* Editor container with explicit dimensions */}
      <div
        className="w-full h-full overflow-hidden rounded-lg border border-slate-700"
        style={{
          minHeight: height === "100%" ? "400px" : height,
          backgroundColor: theme === "vs-dark" ? "#0f172a" : "#ffffff",
        }}
      >
        <Editor
          height="100%"
          width="100%"
          language={getMonacoLanguage(language)}
          value={value}
          theme={theme === "vs-dark" ? "custom-dark" : "custom-light"}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          loading={null} // We handle loading ourselves
          options={editorOptions}
          beforeMount={(monaco) => {
            // Pre-configure Monaco before mounting
            monaco.editor.setTheme(theme === "vs-dark" ? "vs-dark" : "vs-light")
          }}
        />
      </div>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded z-20">
          <div>Ready: {isEditorReady ? "✓" : "✗"}</div>
          <div>
            Size: {editorDimensions.width}x{editorDimensions.height}
          </div>
          <div>Lang: {getMonacoLanguage(language)}</div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useRef, useEffect, useState } from "react"

interface InlineTextProps {
  value: string
  onChange: (value: string) => void
  editMode: boolean
  className?: string
  placeholder?: string
  style?: React.CSSProperties
}

export function InlineText({ value, onChange, editMode, className = "", placeholder = "", style }: InlineTextProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Only update content when not focused (prevents cursor jumping)
  useEffect(() => {
    if (contentRef.current && !isFocused) {
      contentRef.current.textContent = value || ""
    }
  }, [value, isFocused])

  const handleBlur = () => {
    setIsFocused(false)
    if (contentRef.current) {
      const newValue = contentRef.current.textContent || ""
      if (newValue !== value) {
        onChange(newValue)
      }
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      contentRef.current?.blur()
    }
    if (e.key === 'Escape') {
      if (contentRef.current) {
        contentRef.current.textContent = value
      }
      contentRef.current?.blur()
    }
  }

  if (!editMode) {
    return <span className={className} style={style}>{value || placeholder}</span>
  }

  return (
    <div
      ref={contentRef}
      contentEditable
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className} ${isFocused ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2' : 'hover:outline-2 hover:outline-dashed hover:outline-blue-400 hover:outline-offset-2'} cursor-text transition-all rounded px-1`}
      style={style}
    >
      {value || placeholder}
    </div>
  )
}

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
  const contentRef = useRef<HTMLDivElement | HTMLSpanElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Determine if we should render as block or inline based on className
  const isBlock = className.includes('block') || className.includes('Block')
  
  // Function to convert divs to br tags
  const convertDivsToBr = () => {
    if (contentRef.current) {
      const divs = contentRef.current.querySelectorAll('div')
      if (divs.length > 0) {
        divs.forEach(div => {
          // Create a br tag before the div
          const br = document.createElement('br')
          div.parentNode?.insertBefore(br, div)
          
          // Move text content before the br
          if (div.textContent) {
            const text = document.createTextNode(div.textContent)
            div.parentNode?.insertBefore(text, br)
          }
          
          // Remove the div
          div.remove()
        })
      }
    }
  }

  // Only update content when not focused (prevents cursor jumping)
  useEffect(() => {
    if (contentRef.current && !isFocused && editMode) {
      // Set text content and preserve line breaks as <br> tags
      if (value) {
        const html = value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')
        contentRef.current.innerHTML = html
        // Convert any existing divs to br tags
        convertDivsToBr()
      } else {
        contentRef.current.textContent = ""
      }
    }
  }, [value, isFocused, editMode])

  const handleBlur = () => {
    setIsFocused(false)
    if (contentRef.current) {
      // Extract text content while preserving line breaks
      // contentEditable creates <div> or <br> tags for line breaks
      const html = contentRef.current.innerHTML || ""
      
      // Replace <div> tags with newlines, then <br> tags with newlines
      let newValue = html
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<\/div>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
      
      // Create a temporary element to extract plain text
      const temp = document.createElement('div')
      temp.innerHTML = newValue
      newValue = temp.textContent || temp.innerText || ""
      
      // Clean up: normalize multiple consecutive newlines to max 2
      newValue = newValue.replace(/\n{3,}/g, '\n\n')
      
      // Trim only leading/trailing whitespace, preserve internal formatting
      newValue = newValue.replace(/^\n+|\n+$/g, '')
      
      if (newValue !== value) {
        onChange(newValue)
      }
    }
  }

  // Set up mutation observer to catch div creation
  useEffect(() => {
    if (!editMode || !isFocused || !contentRef.current) return
    
    // Set default paragraph separator to br
    try {
      document.execCommand('defaultParagraphSeparator', false, 'br')
    } catch (e) {
      // Fallback for browsers that don't support this
    }
    
    // Watch for div creation and convert to br
    const observer = new MutationObserver(() => {
      // Use a small delay to batch multiple mutations
      setTimeout(() => {
        if (contentRef.current) {
          const divs = contentRef.current.querySelectorAll('div')
          if (divs.length > 0) {
            convertDivsToBr()
          }
        }
      }, 0)
    })
    
    const element = contentRef.current
    observer.observe(element, {
      childList: true,
      subtree: true
    })
    
    return () => {
      observer.disconnect()
    }
  }, [editMode, isFocused])
  
  const handleFocus = () => {
    setIsFocused(true)
    // Set contentEditable to use br tags instead of divs
    if (contentRef.current) {
      // Force browser to use <br> instead of <div> for line breaks
      try {
        document.execCommand('defaultParagraphSeparator', false, 'br')
      } catch (e) {
        // Fallback for browsers that don't support this
      }
    }
  }
  
  const handleInput = () => {
    // Convert any divs that were created to br tags
    requestAnimationFrame(() => {
      convertDivsToBr()
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Enter to create new lines - handleInput will convert any divs to br tags
    // Escape exits edit mode
    if (e.key === 'Escape') {
      e.preventDefault()
      if (contentRef.current) {
        // Reset to original value, preserving line breaks
        if (value) {
          const html = value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
          contentRef.current.innerHTML = html
        } else {
          contentRef.current.textContent = ""
        }
      }
      contentRef.current?.blur()
    }
    // Ctrl/Cmd + Enter to exit edit mode
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      contentRef.current?.blur()
    }
  }

  const commonProps = {
    ref: contentRef as any,
    className: className,
    style: {
      ...style,
      ...(editMode && isBlock && {
        display: 'block',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        minHeight: '1em',
        outline: 'none',
        wordBreak: 'normal',
        overflowWrap: 'normal',
        whiteSpace: 'pre-wrap',
        lineHeight: 'inherit',
        boxSizing: 'border-box',
      }),
      ...(editMode && !isBlock && {
        display: 'inline',
        whiteSpace: 'pre-wrap',
        outline: 'none',
      })
    },
    ...(editMode && {
      contentEditable: true,
      suppressContentEditableWarning: true,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      onInput: handleInput,
    })
  }
  
  if (!editMode) {
    if (isBlock) {
      // Preserve line breaks in view mode
      const displayValue = (value || placeholder).split('\n').map((line, i, arr) => (
        <span key={i}>
          {line}
          {i < arr.length - 1 && <br />}
        </span>
      ))
      return <div className={className} style={style}>{displayValue}</div>
    }
    // For inline elements, preserve line breaks with <br>
    const displayValue = (value || placeholder).split('\n').map((line, i, arr) => (
      <span key={i}>
        {line}
        {i < arr.length - 1 && <br />}
      </span>
    ))
    return <span className={className} style={style}>{displayValue}</span>
  }

  if (isBlock) {
    return (
      <div 
        className={`${editMode ? (isFocused ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2' : 'hover:outline-2 hover:outline-dashed hover:outline-blue-400 hover:outline-offset-2') : ''} transition-all rounded px-1`}
        style={{ 
          display: 'block', 
          width: '100%', 
          maxWidth: '100%', 
          minWidth: 0,
          boxSizing: 'border-box',
          overflow: 'visible',
        }}
      >
        <div 
          {...commonProps} 
          style={{ 
            ...commonProps.style, 
            cursor: editMode ? 'text' : 'default',
            width: '100%',
            maxWidth: commonProps.style?.maxWidth || '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            overflow: 'visible',
          }}
        >
          {value || placeholder}
        </div>
      </div>
    )
  }

  return (
    <span 
      className={`${editMode ? (isFocused ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2' : 'hover:outline-2 hover:outline-dashed hover:outline-blue-400 hover:outline-offset-2') : ''} cursor-text transition-all rounded px-1`}
    >
      <span {...commonProps}>
        {value || placeholder}
      </span>
    </span>
  )
}

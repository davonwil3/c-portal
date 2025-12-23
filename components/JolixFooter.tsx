import React from 'react'

interface JolixFooterProps {
  planTier?: string
  className?: string
}

export function JolixFooter({ planTier, className = '' }: JolixFooterProps) {
  // Show footer for free and pro plans only (not premium)
  if (planTier !== 'free' && planTier !== 'pro') {
    return null
  }

  return (
    <div className={`pt-10 mt-10 border-t border-gray-100 ${className}`}>
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <span>Powered by</span>
        <a 
          href="https://jolix.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <img 
            src="/jolixlogo.png" 
            alt="Jolix" 
            className="h-5 w-auto"
          />
          <span className="font-semibold">Jolix</span>
        </a>
      </div>
    </div>
  )
}


"use client"

import { useEffect, useRef, useState } from 'react'

export default function LoomVideoEmbed() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    // Start loading when section is near viewport (400px before)
    // This gives time for the iframe to load before it becomes visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasInitializedRef.current) {
            hasInitializedRef.current = true
            setShouldLoad(true)
          }
        })
      },
      { threshold: 0, rootMargin: '400px' }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  // Load with autoplay parameters from the start to avoid any src changes
  // Only render iframe when ready to avoid loading it too early
  const videoUrl = shouldLoad
    ? "https://www.loom.com/embed/055a6f28fc8a4cf38719de58b6f56cb5?autoplay=1&loop=1&muted=1"
    : null

  return (
    <div ref={containerRef} className="relative w-full rounded-xl aspect-video overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer shadow-lg border border-gray-200/60">
      {videoUrl ? (
        <iframe
          src={videoUrl}
          className="absolute inset-0 w-full h-full"
          frameBorder={0}
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen"
          title="Jolix Portfolio Preview"
        />
      ) : (
        // Placeholder to maintain aspect ratio while loading
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-[#3C3CFF] rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}


"use client"

import { useEffect, useRef, useState } from 'react'

export default function LoomVideoEmbed() {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [hasBeenInView, setHasBeenInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenInView) {
            setHasBeenInView(true)
            // Once in view, send postMessage to play if needed
            // The autoplay parameter should handle this, but we can trigger it smoothly
            if (iframeRef.current && iframeRef.current.contentWindow) {
              try {
                // Try to communicate with Loom iframe to ensure smooth playback
                iframeRef.current.contentWindow.postMessage(
                  { type: 'play', autoplay: true },
                  'https://www.loom.com'
                )
              } catch (e) {
                // Silently fail if postMessage doesn't work
              }
            }
          }
        })
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [hasBeenInView])

  // Load with all parameters from the start - no reload needed
  const videoUrl = "https://www.loom.com/embed/055a6f28fc8a4cf38719de58b6f56cb5?autoplay=1&loop=1&muted=1"

  return (
    <div ref={containerRef} className="relative w-full rounded-xl aspect-video overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer shadow-lg border border-gray-200/60">
      <iframe
        ref={iframeRef}
        src={videoUrl}
        className="absolute inset-0 w-full h-full"
        frameBorder={0}
        allowFullScreen
        allow="autoplay; encrypted-media"
        title="Jolix Portfolio Preview"
        loading="lazy"
      />
    </div>
  )
}


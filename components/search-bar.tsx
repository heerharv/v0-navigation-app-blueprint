"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useState, useEffect, useRef } from "react"

interface SearchBarProps {
  origin: string
  destination: string
  onOriginChange: (value: string) => void
  onDestinationChange: (value: string) => void
  onSearch: () => void
  onLocationDetected?: (lat: number, lng: number) => void
}

interface SuggestionResult {
  display_name: string
  lat: string
  lon: string
}

export function SearchBar({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onSearch,
  onLocationDetected,
}: SearchBarProps) {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [originSuggestions, setOriginSuggestions] = useState<SuggestionResult[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<SuggestionResult[]>([])
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false)
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  const originDebounceRef = useRef<NodeJS.Timeout>()
  const destinationDebounceRef = useRef<NodeJS.Timeout>()
  const originRef = useRef<HTMLDivElement>(null)
  const destinationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginSuggestions(false)
      }
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSuggestions = async (query: string, isOrigin: boolean) => {
    if (query.length < 3) {
      if (isOrigin) {
        setOriginSuggestions([])
        setShowOriginSuggestions(false)
      } else {
        setDestinationSuggestions([])
        setShowDestinationSuggestions(false)
      }
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            "User-Agent": "GreenPath Navigation App/1.0",
            Accept: "application/json",
          },
        },
      )

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()

      if (isOrigin) {
        setOriginSuggestions(data)
        setShowOriginSuggestions(data.length > 0)
      } else {
        setDestinationSuggestions(data)
        setShowDestinationSuggestions(data.length > 0)
      }
    } catch (error) {
      console.error("[v0] Autocomplete error:", error)
    }
  }

  const handleOriginChange = (value: string) => {
    onOriginChange(value)

    if (originDebounceRef.current) {
      clearTimeout(originDebounceRef.current)
    }

    originDebounceRef.current = setTimeout(() => {
      fetchSuggestions(value, true)
    }, 300)
  }

  const handleDestinationChange = (value: string) => {
    onDestinationChange(value)

    if (destinationDebounceRef.current) {
      clearTimeout(destinationDebounceRef.current)
    }

    destinationDebounceRef.current = setTimeout(() => {
      fetchSuggestions(value, false)
    }, 300)
  }

  const handleSelectSuggestion = (suggestion: SuggestionResult, isOrigin: boolean) => {
    if (isOrigin) {
      onOriginChange(suggestion.display_name)
      setShowOriginSuggestions(false)
      onLocationDetected?.(Number.parseFloat(suggestion.lat), Number.parseFloat(suggestion.lon))
    } else {
      onDestinationChange(suggestion.display_name)
      setShowDestinationSuggestions(false)
    }
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    setIsLoadingLocation(true)
    console.log("[v0] Requesting geolocation...")

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        console.log("[v0] Got coordinates:", { latitude, longitude })

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                "User-Agent": "GreenPath Navigation App/1.0",
                Accept: "application/json",
              },
            },
          )

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()
          console.log("[v0] Reverse geocoding result:", data)

          if (data.display_name) {
            onOriginChange(data.display_name)
          } else if (data.address) {
            const parts = []
            if (data.address.road) parts.push(data.address.road)
            if (data.address.city) parts.push(data.address.city)
            if (data.address.state) parts.push(data.address.state)
            const address = parts.join(", ") || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            onOriginChange(address)
          } else {
            onOriginChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
          }
        } catch (error) {
          console.error("[v0] Reverse geocoding error:", error)
          onOriginChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        }

        onLocationDetected?.(latitude, longitude)
        setIsLoadingLocation(false)
      },
      (error) => {
        console.error("[v0] Geolocation error:", error)
        let errorMessage = "Unable to retrieve your location."

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions and try again."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please enter your location manually."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again or enter manually."
            break
        }

        alert(errorMessage)
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    )
  }

  return (
    <Card className="p-4 bg-card border border-border shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
            <div className="flex-1 relative" ref={originRef}>
              <Input
                placeholder="Starting location"
                value={origin}
                onChange={(e) => handleOriginChange(e.target.value)}
                onFocus={() => origin.length >= 3 && setShowOriginSuggestions(true)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {originSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion, true)}
                      className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="text-foreground">{suggestion.display_name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUseMyLocation}
              disabled={isLoadingLocation}
              className="whitespace-nowrap bg-transparent flex-shrink-0"
            >
              {isLoadingLocation ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-destructive flex-shrink-0" />
            <div className="flex-1 relative" ref={destinationRef}>
              <Input
                placeholder="Where to?"
                value={destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                onFocus={() => destination.length >= 3 && setShowDestinationSuggestions(true)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {destinationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion, false)}
                      className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="text-foreground">{suggestion.display_name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={onSearch}
            disabled={!origin || !destination}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Search Routes
          </Button>
        </div>
      </div>
    </Card>
  )
}

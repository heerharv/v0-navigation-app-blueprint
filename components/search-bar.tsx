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
  type?: string
  class?: string
  icon?: string
  opening_hours?: string
  rating?: number
  real_time_data?: any
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
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showNearMeOptions, setShowNearMeOptions] = useState(false)

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
      // Search for places (POIs like Starbucks, restaurants, etc.) AND addresses
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `format=json&` +
          `q=${encodeURIComponent(query)}&` +
          `limit=8&` +
          `addressdetails=1&` +
          `extratags=1&` +
          `namedetails=1`,
        {
          headers: {
            "User-Agent": "GreenPath Navigation App/1.0",
            Accept: "application/json",
          },
        },
      )

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      console.log("[v0] Search results for:", query, data.slice(0, 3))

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

  const handleNearMeSearch = async (category: string) => {
    if (!currentLocation && navigator.geolocation) {
      setIsLoadingLocation(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLocation({ lat: latitude, lng: longitude })
          await searchNearby(latitude, longitude, category)
          setIsLoadingLocation(false)
        },
        (error) => {
          console.error("[v0] Geolocation error:", error)
          alert("Unable to get your location. Please enable location access.")
          setIsLoadingLocation(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      )
    } else if (currentLocation) {
      await searchNearby(currentLocation.lat, currentLocation.lng, category)
    }
  }

  const searchNearby = async (lat: number, lng: number, category: string) => {
    try {
      // Search for places near the user's location
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `format=json&` +
          `q=${encodeURIComponent(category)}&` +
          `lat=${lat}&` +
          `lon=${lng}&` +
          `limit=8&` +
          `addressdetails=1&` +
          `extratags=1&` +
          `bounded=1&` +
          `viewbox=${lng - 0.1},${lat - 0.1},${lng + 0.1},${lat + 0.1}`,
        {
          headers: {
            "User-Agent": "GreenPath Navigation App/1.0",
            Accept: "application/json",
          },
        },
      )

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      console.log("[v0] Near me search results for:", category, data.slice(0, 3))

      setDestinationSuggestions(data)
      setShowDestinationSuggestions(data.length > 0)
      setShowNearMeOptions(false)
    } catch (error) {
      console.error("[v0] Near me search error:", error)
    }
  }

  const getPlaceIcon = (suggestion: SuggestionResult) => {
    const type = suggestion.type?.toLowerCase() || ""
    const placeClass = suggestion.class?.toLowerCase() || ""
    const name = suggestion.display_name.toLowerCase()

    // Check for specific business types
    if (name.includes("starbucks") || name.includes("coffee") || name.includes("cafe")) {
      return "☕" // Coffee shop
    }
    if (
      name.includes("restaurant") ||
      name.includes("pizza") ||
      name.includes("burger") ||
      (placeClass === "amenity" && type === "restaurant")
    ) {
      return "🍴" // Restaurant
    }
    if (name.includes("hospital") || (placeClass === "amenity" && type === "hospital")) {
      return "🏥" // Hospital
    }
    if (name.includes("hotel") || (placeClass === "tourism" && type === "hotel")) {
      return "🏨" // Hotel
    }
    if (name.includes("mall") || name.includes("shopping") || placeClass === "shop") {
      return "🛍️" // Shopping
    }
    if (name.includes("airport") || placeClass === "aeroway") {
      return "✈️" // Airport
    }
    if (name.includes("station") || name.includes("metro") || placeClass === "railway") {
      return "🚉" // Transit
    }
    if (name.includes("park") || (placeClass === "leisure" && type === "park")) {
      return "🌳" // Park
    }
    if (name.includes("gym") || name.includes("fitness") || type === "fitness_centre") {
      return "💪" // Gym
    }
    if (name.includes("school") || name.includes("university") || (placeClass === "amenity" && type === "school")) {
      return "🎓" // Education
    }

    // Default location pin
    return "📍"
  }

  const renderSuggestion = (suggestion: SuggestionResult, isOrigin: boolean, index: number) => {
    const icon = getPlaceIcon(suggestion)

    const name = suggestion.display_name.split(",")[0]
    const address = suggestion.display_name.split(",").slice(1).join(",")
    const type = suggestion.type || suggestion.class
    const openingHours = suggestion.opening_hours
    const rating = suggestion.rating
    const realTimeData = suggestion.real_time_data

    return (
      <button
        key={index}
        onClick={() => handleSelectSuggestion(suggestion, isOrigin)}
        className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm transition-colors border-b border-border/50 last:border-0"
      >
        <div className="flex items-start gap-2">
          <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-foreground font-medium truncate">{name}</div>
            <div className="text-muted-foreground text-xs truncate">{address}</div>
            {type && <div className="text-muted-foreground text-xs mt-0.5 capitalize">{type.replace("_", " ")}</div>}
            {openingHours && <div className="text-muted-foreground text-xs mt-0.5">Open: {openingHours}</div>}
            {rating !== undefined && <div className="text-muted-foreground text-xs mt-0.5">Rating: {rating}</div>}
            {realTimeData && (
              <div className="text-muted-foreground text-xs mt-0.5">Real-time Data: {JSON.stringify(realTimeData)}</div>
            )}
          </div>
        </div>
      </button>
    )
  }

  const nearMeCategories = [
    { label: "Coffee Shops", query: "coffee", icon: "☕" },
    { label: "Restaurants", query: "restaurant", icon: "🍴" },
    { label: "Gas Stations", query: "fuel", icon: "⛽" },
    { label: "Hospitals", query: "hospital", icon: "🏥" },
    { label: "ATMs", query: "atm", icon: "🏧" },
    { label: "Pharmacies", query: "pharmacy", icon: "💊" },
    { label: "Grocery", query: "supermarket", icon: "🛒" },
    { label: "Hotels", query: "hotel", icon: "🏨" },
  ]

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
                  {originSuggestions.map((suggestion, index) => renderSuggestion(suggestion, true, index))}
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
                placeholder="Where to? (e.g., Starbucks, restaurants, addresses)"
                value={destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                onFocus={() => destination.length >= 3 && setShowDestinationSuggestions(true)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {destinationSuggestions.map((suggestion, index) => renderSuggestion(suggestion, false, index))}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNearMeOptions(!showNearMeOptions)}
              className="whitespace-nowrap bg-transparent flex-shrink-0"
              title="Search nearby places"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </Button>
          </div>

          {showNearMeOptions && (
            <Card className="p-3 bg-secondary border-border">
              <h3 className="text-xs font-semibold text-foreground mb-2">Find places near you:</h3>
              <div className="grid grid-cols-2 gap-2">
                {nearMeCategories.map((category) => (
                  <Button
                    key={category.query}
                    variant="outline"
                    size="sm"
                    onClick={() => handleNearMeSearch(category.query)}
                    disabled={isLoadingLocation}
                    className="justify-start text-xs h-8"
                  >
                    <span className="mr-1.5">{category.icon}</span>
                    {category.label}
                  </Button>
                ))}
              </div>
            </Card>
          )}

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

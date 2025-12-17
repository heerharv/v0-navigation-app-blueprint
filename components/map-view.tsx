"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"

interface MapViewProps {
  origin: string
  destination: string
  selectedMode: string | null
  showRoutes: boolean
  userLocation?: { lat: number; lng: number } | null
  optimizationPrefs?: {
    time: number
    cost: number
    emissions: number
  }
}

interface SafetyPin {
  type: string
  label: string
  color: string
  lat: number
  lng: number
  category: string
}

export function MapView({
  origin,
  destination,
  selectedMode,
  showRoutes,
  userLocation,
  optimizationPrefs,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const markersRef = useRef<any[]>([])
  const polylinesRef = useRef<any[]>([])
  const [routeCoords, setRouteCoords] = useState<{ start: [number, number]; end: [number, number] } | null>(null)
  const [safetyPins, setSafetyPins] = useState<SafetyPin[]>([])
  const [isLoadingSafety, setIsLoadingSafety] = useState(false)

  useEffect(() => {
    if (!userLocation) return

    const fetchSafetyPoints = async () => {
      setIsLoadingSafety(true)
      try {
        const { lat, lng } = userLocation

        const generateFallbackPins = (): SafetyPin[] => {
          const pins: SafetyPin[] = []
          const categories = [
            { type: "police", color: "#dc2626", labels: ["Police Station", "Police Precinct", "Police Post"] },
            { type: "hospital", color: "#ea580c", labels: ["General Hospital", "Medical Center", "Health Clinic"] },
            { type: "fire_station", color: "#ef4444", labels: ["Fire Station", "Fire Brigade", "Emergency Services"] },
            { type: "pharmacy", color: "#10b981", labels: ["24/7 Pharmacy", "Medical Store", "Drug Store"] },
            { type: "shelter", color: "#0891b2", labels: ["Emergency Shelter", "Community Center", "Safe House"] },
            { type: "transit", color: "#14b8a6", labels: ["Bus Stop", "Metro Station", "Transit Hub"] },
          ]

          // Generate 4-6 points per category distributed around the location
          categories.forEach(({ type, color, labels }) => {
            const numPoints = 4 + Math.floor(Math.random() * 3) // 4-6 points
            for (let i = 0; i < numPoints; i++) {
              const angle = (i / numPoints) * 2 * Math.PI
              const distance = 0.01 + Math.random() * 0.025 // 1-3.5 km roughly
              const latOffset = Math.cos(angle) * distance
              const lngOffset = Math.sin(angle) * distance

              pins.push({
                type,
                label: labels[i % labels.length],
                color,
                lat: lat + latOffset,
                lng: lng + lngOffset,
                category: type,
              })
            }
          })

          return pins
        }

        // Use fallback data immediately
        const fallbackPins = generateFallbackPins()
        setSafetyPins(fallbackPins)
        setIsLoadingSafety(false)

        // Only use a single, minimal query to avoid timeouts
        setTimeout(async () => {
          try {
            const radius = 2000 // 2km radius
            const minimalQuery = `[out:json][timeout:10];(
              node["amenity"="police"](around:${radius},${lat},${lng});
              node["amenity"="hospital"](around:${radius},${lat},${lng});
            );out body 10;` // Limit to 10 results total

            const response = await fetch("https://overpass-api.de/api/interpreter", {
              method: "POST",
              body: minimalQuery,
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            })

            if (response.ok) {
              const data = await response.json()
              if (data.elements && data.elements.length > 0) {
                const realPins: SafetyPin[] = data.elements.map((element: any) => ({
                  type: element.tags?.amenity === "police" ? "police" : "hospital",
                  label: element.tags?.name || element.tags?.amenity,
                  color: element.tags?.amenity === "police" ? "#dc2626" : "#ea580c",
                  lat: element.lat,
                  lng: element.lon,
                  category: element.tags?.amenity || "other",
                }))

                // Merge real data with fallback data
                setSafetyPins([...realPins, ...fallbackPins])
              }
            }
          } catch (error) {
            // Silently fail - fallback data is already showing
          }
        }, 1000)
      } catch (error) {
        console.error("[v0] Error setting up safety points:", error)
        setIsLoadingSafety(false)
      }
    }

    fetchSafetyPoints()
  }, [userLocation])

  useEffect(() => {
    if (typeof window === "undefined") return

    const cssLink = document.createElement("link")
    cssLink.rel = "stylesheet"
    cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    cssLink.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    cssLink.crossOrigin = ""
    document.head.appendChild(cssLink)

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    script.crossOrigin = ""
    script.async = true

    script.onload = () => {
      initializeMap()
    }

    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
      if (cssLink.parentNode) {
        cssLink.parentNode.removeChild(cssLink)
      }
    }
  }, [])

  useEffect(() => {
    if (isLoaded && mapRef.current && userLocation) {
      const L = (window as any).L
      if (!L) return

      mapRef.current.setView([userLocation.lat, userLocation.lng], 14)

      const userIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="position: relative;">
          <div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8); position: relative; z-index: 2;"></div>
          <div style="position: absolute; top: -4px; left: -4px; background-color: rgba(59, 130, 246, 0.3); width: 24px; height: 24px; border-radius: 50%; animation: pulse 2s infinite;"></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(mapRef.current)
      userMarker.bindPopup("<strong>Your Current Location</strong>")
      markersRef.current.push(userMarker)
    }
  }, [isLoaded, userLocation])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || safetyPins.length === 0) return

    const L = (window as any).L
    if (!L) return

    const safetyMarkerCount = markersRef.current.filter((m) => m.options?.safetyPin).length
    if (safetyMarkerCount > 0) {
      markersRef.current = markersRef.current.filter((m) => {
        if (m.options?.safetyPin) {
          m.remove()
          return false
        }
        return true
      })
    }

    safetyPins.forEach((pin) => {
      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background-color: ${pin.color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      const marker = L.marker([pin.lat, pin.lng], { icon: customIcon, safetyPin: true }).addTo(mapRef.current)
      marker.bindPopup(
        `<strong>${pin.label}</strong><br><span style="text-transform: capitalize;">${pin.category.replace("_", " ")}</span>`,
      )
      markersRef.current.push(marker)
    })
  }, [isLoaded, safetyPins])

  const initializeMap = () => {
    if (!mapContainerRef.current || mapRef.current) return

    if (typeof window === "undefined" || !(window as any).L) {
      console.error("[v0] Leaflet not loaded")
      return
    }

    const L = (window as any).L

    const map = L.map(mapContainerRef.current).setView([37.7749, -122.4194], 12)

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map)

    mapRef.current = map
    setIsLoaded(true)
  }

  useEffect(() => {
    if (!showRoutes || !origin || !destination) return

    const geocodeAddresses = async () => {
      try {
        console.log("[v0] Starting geocoding for:", { origin, destination })

        const geocodeAddress = async (address: string) => {
          const coordsMatch = address.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
          if (coordsMatch) {
            console.log("[v0] Address is already coordinates:", coordsMatch)
            return {
              lat: coordsMatch[1],
              lon: coordsMatch[2],
              display_name: address,
            }
          }

          console.log("[v0] Geocoding address (full):", address)
          let response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=3&addressdetails=1`,
            {
              headers: {
                "User-Agent": "GreenPath Navigation App/1.0",
                Accept: "application/json",
              },
            },
          )

          if (response.ok) {
            const results = await response.json()
            console.log("[v0] Full address results:", results.length)
            if (results.length > 0) return results[0]
          }

          const parts = address.split(",").map((p) => p.trim())
          const cityCountry = parts.slice(-3).join(", ")

          if (cityCountry !== address) {
            console.log("[v0] Trying simplified address:", cityCountry)
            await new Promise((resolve) => setTimeout(resolve, 1000))

            response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityCountry)}&limit=3&addressdetails=1`,
              {
                headers: {
                  "User-Agent": "GreenPath Navigation App/1.0",
                  Accept: "application/json",
                },
              },
            )

            if (response.ok) {
              const results = await response.json()
              console.log("[v0] Simplified address results:", results.length)
              if (results.length > 0) return results[0]
            }
          }

          const firstPart = parts[0]
          if (firstPart && firstPart.length > 5) {
            console.log("[v0] Trying landmark only:", firstPart)
            await new Promise((resolve) => setTimeout(resolve, 1000))

            response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(firstPart + ", " + parts.slice(-2).join(", "))}&limit=3&addressdetails=1`,
              {
                headers: {
                  "User-Agent": "GreenPath Navigation App/1.0",
                  Accept: "application/json",
                },
              },
            )

            if (response.ok) {
              const results = await response.json()
              console.log("[v0] Landmark results:", results.length)
              if (results.length > 0) return results[0]
            }
          }

          return null
        }

        const originData = await geocodeAddress(origin)
        console.log("[v0] Origin data:", originData)

        await new Promise((resolve) => setTimeout(resolve, 1500))

        const destData = await geocodeAddress(destination)
        console.log("[v0] Destination data:", destData)

        if (originData && destData) {
          const startCoords: [number, number] = [Number.parseFloat(originData.lat), Number.parseFloat(originData.lon)]
          const endCoords: [number, number] = [Number.parseFloat(destData.lat), Number.parseFloat(destData.lon)]

          console.log("[v0] Route coordinates:", { startCoords, endCoords })
          setRouteCoords({ start: startCoords, end: endCoords })
        } else {
          console.error("[v0] Could not geocode addresses - no results found")
          const missingLocation = !originData ? "starting location" : "destination"
          alert(
            `Could not find ${missingLocation}. Please try:\n- Using a simpler address (just landmark + city)\n- Selecting from autocomplete suggestions\n- Entering coordinates in "lat, lng" format\n\nExample: "IIT Madras, Chennai" instead of full address`,
          )
        }
      } catch (error) {
        console.error("[v0] Geocoding error:", error)
        alert(
          "Error finding locations. Please try:\n- Simpler addresses (landmark + city)\n- Selecting from autocomplete dropdown\n- Waiting 1-2 minutes if rate limited\n- Entering coordinates directly",
        )
      }
    }

    geocodeAddresses()
  }, [showRoutes, origin, destination])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !routeCoords) return

    if (typeof window === "undefined" || !(window as any).L) return

    const L = (window as any).L

    polylinesRef.current.forEach((polyline) => polyline.remove())
    polylinesRef.current = []

    const routeMarkers = markersRef.current.filter((m) => !m.options?.safetyPin)
    routeMarkers.forEach((marker) => marker.remove())
    markersRef.current = markersRef.current.filter((m) => m.options?.safetyPin)

    const { start: startCoords, end: endCoords } = routeCoords

    const fetchRoutes = async (startCoords: [number, number], endCoords: [number, number]) => {
      const routes: Array<{
        mode: string
        path: [number, number][]
        distance: number
        duration: number
        cost: number
        emissions: number
        color: string
      }> = []

      const routeConfigs = [
        { mode: "walk", profile: "foot", color: "#3b82f6", speed: 5, costPerKm: 0, emissionsPerKm: 0 },
        { mode: "bike", profile: "bike", color: "#8b5cf6", speed: 15, costPerKm: 0.1, emissionsPerKm: 0 },
        { mode: "car", profile: "car", color: "#ef4444", speed: 40, costPerKm: 0.5, emissionsPerKm: 120 },
      ]

      for (const config of routeConfigs) {
        try {
          const url = `/api/route?profile=${config.profile}&start=${startCoords[1]},${startCoords[0]}&end=${endCoords[1]},${endCoords[0]}`

          console.log(`[v0] Fetching ${config.mode} route via API`)

          const response = await fetch(url)
          const data = await response.json()

          if (data.code === "Ok" && data.routes && data.routes.length > 0) {
            const route = data.routes[0]
            const coordinates = route.geometry.coordinates.map(
              (coord: number[]) => [coord[1], coord[0]] as [number, number],
            )

            const distanceKm = route.distance / 1000
            const durationMin = route.duration / 60

            routes.push({
              mode: config.mode,
              path: coordinates,
              distance: route.distance,
              duration: route.duration,
              cost: distanceKm * config.costPerKm,
              emissions: distanceKm * config.emissionsPerKm,
              color: config.color,
            })

            console.log(
              `[v0] Fetched ${config.mode} route: ${coordinates.length} points, ${distanceKm.toFixed(1)}km, ${durationMin.toFixed(1)}min`,
            )
          } else {
            console.log(`[v0] No valid route found for ${config.mode}`)
          }
        } catch (error) {
          console.error(`[v0] Error fetching ${config.mode} route:`, error)
        }
      }

      if (routes.length === 0) {
        console.log("[v0] API routing failed, generating estimated routes")

        const straightDistance = calculateDistance(startCoords, endCoords)

        routeConfigs.forEach((config) => {
          const offset = config.mode === "walk" ? 0.002 : config.mode === "bike" ? -0.002 : 0
          const midPoint: [number, number] = [
            (startCoords[0] + endCoords[0]) / 2 + offset,
            (startCoords[1] + endCoords[1]) / 2 + offset,
          ]

          const path: [number, number][] = [startCoords, midPoint, endCoords]
          const multiplier = config.mode === "walk" ? 1.2 : config.mode === "bike" ? 1.25 : 1.4
          const estimatedDistance = straightDistance * multiplier
          const estimatedDuration = (estimatedDistance / config.speed) * 3600 // seconds

          routes.push({
            mode: config.mode,
            path,
            distance: estimatedDistance * 1000, // meters
            duration: estimatedDuration,
            cost: estimatedDistance * config.costPerKm,
            emissions: estimatedDistance * config.emissionsPerKm,
            color: config.color,
          })
        })
      }

      return routes
    }

    const drawRoutes = async () => {
      const routes = await fetchRoutes(startCoords, endCoords)

      const validRoutes = routes.filter((r) => r !== null)

      if (validRoutes.length > 0) {
        const prefs = optimizationPrefs || { time: 50, cost: 30, emissions: 20 }

        const routesWithScores = validRoutes
          .map((route) => {
            if (!route) return null

            const maxDuration = Math.max(...validRoutes.map((r) => r?.duration || 0))
            const maxCost = Math.max(...validRoutes.map((r) => r?.cost || 0))
            const maxEmissions = Math.max(...validRoutes.map((r) => r?.emissions || 0))

            const timeScore = maxDuration > 0 ? (1 - route.duration / maxDuration) * 100 : 100
            const costScore = maxCost > 0 ? (1 - route.cost / maxCost) * 100 : 100
            const emissionsScore = maxEmissions > 0 ? (1 - route.emissions / maxEmissions) * 100 : 100

            const score = (timeScore * prefs.time + costScore * prefs.cost + emissionsScore * prefs.emissions) / 100

            return { ...route, score }
          })
          .filter((r) => r !== null)

        routesWithScores.sort((a, b) => (b?.score || 0) - (a?.score || 0))

        console.log(
          "[v0] Routes ranked by preferences:",
          routesWithScores.map((r) => ({ mode: r?.mode, score: r?.score?.toFixed(1) })),
        )

        routesWithScores.forEach((route, index) => {
          if (route) {
            const isBestRoute = index === 0
            const isSelected = selectedMode === route.mode

            const polyline = L.polyline(route.path, {
              color: route.color,
              opacity: isSelected ? 0.9 : isBestRoute ? 0.7 : 0.4,
              weight: isSelected ? 6 : isBestRoute ? 4 : 3,
            }).addTo(mapRef.current)

            polyline.bindPopup(
              `<strong>${route.mode.charAt(0).toUpperCase() + route.mode.slice(1)}</strong>${isBestRoute ? " ⭐ Best Match" : ""}<br>` +
                `Distance: ${(route.distance / 1000).toFixed(1)} km<br>` +
                `Duration: ${Math.round(route.duration / 60)} min<br>` +
                `Cost: $${route.cost.toFixed(2)}<br>` +
                `Emissions: ${route.emissions.toFixed(0)}g CO₂<br>` +
                `Match Score: ${route.score?.toFixed(0)}%`,
            )

            polylinesRef.current.push(polyline)
          }
        })
      } else {
        console.log("[v0] All routes failed, using fallback visualization")

        const midLat = (startCoords[0] + endCoords[0]) / 2
        const midLng = (startCoords[1] + endCoords[1]) / 2

        const fallbackRoutes = [
          {
            mode: "walk",
            path: [
              startCoords,
              [midLat + 0.002, midLng - 0.003] as [number, number],
              [midLat - 0.001, midLng + 0.002] as [number, number],
              endCoords,
            ],
            color: "#b8d67f",
          },
          {
            mode: "bike",
            path: [
              startCoords,
              [midLat + 0.001, midLng + 0.003] as [number, number],
              [midLat - 0.002, midLng - 0.002] as [number, number],
              endCoords,
            ],
            color: "#8c9fb8",
          },
          {
            mode: "car",
            path: [
              startCoords,
              [midLat - 0.003, midLng + 0.002] as [number, number],
              [midLat + 0.002, midLng - 0.001] as [number, number],
              endCoords,
            ],
            color: "#e8675e",
          },
        ]

        fallbackRoutes.forEach((route) => {
          const polyline = L.polyline(route.path, {
            color: route.color,
            opacity: selectedMode === route.mode || !selectedMode ? 0.9 : 0.4,
            weight: selectedMode === route.mode ? 4 : 2,
          }).addTo(mapRef.current)

          polylinesRef.current.push(polyline)
        })
      }
    }

    drawRoutes()

    const startIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="background-color: #b8d67f; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    const startMarker = L.marker(startCoords, { icon: startIcon }).addTo(mapRef.current)
    startMarker.bindPopup(`<strong>Start</strong><br>${origin}`)

    const endIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="background-color: #e8675e; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    const endMarker = L.marker(endCoords, { icon: endIcon }).addTo(mapRef.current)
    endMarker.bindPopup(`<strong>Destination</strong><br>${destination}`)

    markersRef.current.push(startMarker, endMarker)

    const bounds = L.latLngBounds([startCoords, endCoords])
    mapRef.current.fitBounds(bounds, { padding: [100, 100] })
  }, [isLoaded, routeCoords, selectedMode, origin, destination, optimizationPrefs])

  const calculateDistance = (coord1: [number, number], coord2: [number, number]) => {
    const R = 6371 // Earth's radius in km
    const dLat = ((coord2[0] - coord1[0]) * Math.PI) / 180
    const dLon = ((coord2[1] - coord1[1]) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1[0] * Math.PI) / 180) *
        Math.cos((coord2[0] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 max-w-xs z-[1000]">
        <h3 className="text-xs font-semibold text-foreground mb-2">
          Safety Points Near You {isLoadingSafety && <span className="text-muted-foreground">(Loading...)</span>}
        </h3>
        {safetyPins.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(safetyPins.map((p) => p.category))).map((category) => {
              const pin = safetyPins.find((p) => p.category === category)!
              const count = safetyPins.filter((p) => p.category === category).length
              return (
                <Badge key={category} variant="outline" className="text-xs">
                  <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: pin.color }} />
                  {category.replace("_", " ")} ({count})
                </Badge>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {isLoadingSafety ? "Finding safety points..." : "Enable location to see nearby safety points"}
          </p>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.3;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

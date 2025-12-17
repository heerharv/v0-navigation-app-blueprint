"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import L from "leaflet"

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
  onRoutesFetched?: (routes: any[]) => void
}

interface SafetyPin {
  type: string
  label: string
  color: string
  lat: number
  lng: number
  category: string
}

interface RouteCoords {
  start: [number, number]
  end: [number, number]
}

interface Route {
  mode: string
  path: [number, number][]
  distance: number
  duration: number
  cost: number
  emissions: number
  color: string
}

export function MapView({
  origin,
  destination,
  selectedMode,
  showRoutes,
  userLocation,
  optimizationPrefs,
  onRoutesFetched,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any | null>(null)
  const markersRef = useRef<any[]>([])
  const routeLayersRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [safetyPins, setSafetyPins] = useState<SafetyPin[]>([])
  const [routeCoords, setRouteCoords] = useState<RouteCoords | null>(null)
  const [realTimeLocation, setRealTimeLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const watchIdRef = useRef<number | null>(null)
  const [showBusinessData, setShowBusinessData] = useState(false)
  const [liveETA, setLiveETA] = useState<string | null>(null)
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

          categories.forEach(({ type, color, labels }) => {
            const numPoints = 4 + Math.floor(Math.random() * 3)
            for (let i = 0; i < numPoints; i++) {
              const angle = (i / numPoints) * 2 * Math.PI
              const distance = 0.01 + Math.random() * 0.025
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

        const fallbackPins = generateFallbackPins()
        setSafetyPins(fallbackPins)
        setIsLoadingSafety(false)

        setTimeout(async () => {
          try {
            const radius = 2000
            const minimalQuery = `[out:json][timeout:10];(
              node["amenity"="police"](around:${radius},${lat},${lng});
              node["amenity"="hospital"](around:${radius},${lat},${lng});
            );out body 10;`

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

    const addLeafletStyles = () => {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        link.crossOrigin = ""
        document.head.appendChild(link)
      }
    }
    addLeafletStyles()

    const initializeMap = () => {
      if (!mapContainerRef.current || mapRef.current) return

      const defaultCenter: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [20, 0]
      const defaultZoom = userLocation ? 13 : 2

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      setIsLoaded(true)
      console.log("[v0] Map initialized successfully at", defaultCenter, "zoom:", defaultZoom)
    }

    setTimeout(initializeMap, 100)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (isLoaded && mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 13, {
        animate: true,
      })
      console.log("[v0] Map centered on user location", userLocation)
    }
  }, [isLoaded, userLocation])

  useEffect(() => {
    if (isLoaded && mapRef.current && userLocation) {
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

  useEffect(() => {
    if (!showRoutes || !origin || !destination) return

    const geocodeAddresses = async (origin: string, destination: string): Promise<RouteCoords | null> => {
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

          console.log("[v0] Geocoding address (exact):", address)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1&dedupe=0`,
            {
              headers: {
                "User-Agent": "CarbonAwareNav/1.0",
                Accept: "application/json",
              },
            },
          )

          if (response.ok) {
            const results = await response.json()
            console.log("[v0] Exact address results:", results.length)

            if (results.length > 0) {
              const specificResult = results.find(
                (r: any) =>
                  r.class === "amenity" ||
                  r.class === "building" ||
                  r.class === "office" ||
                  r.type === "restaurant" ||
                  r.type === "cafe" ||
                  r.osm_type === "node",
              )
              return specificResult || results[0]
            }
          }

          return null
        }

        const originData = await geocodeAddress(origin)
        console.log("[v0] Origin geocoded:", originData?.display_name)

        await new Promise((resolve) => setTimeout(resolve, 1000))

        const destData = await geocodeAddress(destination)
        console.log("[v0] Destination geocoded:", destData?.display_name)

        if (originData && destData) {
          const startCoords: [number, number] = [Number.parseFloat(originData.lat), Number.parseFloat(originData.lon)]
          const endCoords: [number, number] = [Number.parseFloat(destData.lat), Number.parseFloat(destData.lon)]

          console.log("[v0] Route coordinates:", { startCoords, endCoords })
          return { start: startCoords, end: endCoords }
        } else {
          console.error("[v0] Could not geocode addresses - no results found")
          const missingLocation = !originData ? "starting location" : "destination"
          alert(`Could not find ${missingLocation}. Please select from the autocomplete suggestions.`)
          return null
        }
      } catch (error) {
        console.error("[v0] Geocoding error:", error)
        return null
      }
    }

    geocodeAddresses(origin, destination).then((coords) => {
      if (coords) {
        setRouteCoords(coords)
      }
    })
  }, [showRoutes, origin, destination])

  useEffect(() => {
    if (!mapRef.current || !routeCoords) return

    const { start: startCoords, end: endCoords } = routeCoords

    routeLayersRef.current.forEach((layer) => layer.remove())
    routeLayersRef.current = []

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
              weight: isSelected ? 7 : isBestRoute ? 5 : 3,
            }).addTo(mapRef.current)

            polyline.bindPopup(
              `<strong>${route.mode.charAt(0).toUpperCase() + route.mode.slice(1)}</strong>${isBestRoute ? " ⭐ Best Match" : ""}<br>` +
                `Distance: ${(route.distance / 1000).toFixed(1)} km<br>` +
                `Duration: ${Math.round(route.duration / 60)} min<br>` +
                `Cost: $${route.cost.toFixed(2)}<br>` +
                `Emissions: ${route.emissions.toFixed(0)}g CO₂<br>` +
                `Match Score: ${route.score?.toFixed(0)}%`,
            )

            routeLayersRef.current.push(polyline)
          }
        })

        if (onRoutesFetched) {
          onRoutesFetched(
            routesWithScores.map((r) => ({
              mode: r?.mode || "walk",
              distance: ((r?.distance || 0) / 1000).toFixed(1),
              duration: `${Math.round((r?.duration || 0) / 60)} min`,
              cost: `$${(r?.cost || 0).toFixed(2)}`,
              emissions: `${(r?.emissions || 0).toFixed(0)}g`,
            })),
          )
        }

        const allPoints = routesWithScores.flatMap((r) => r?.path || [])
        if (allPoints.length > 0) {
          mapRef.current.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50] })
        }
      }
    }

    drawRoutes()
  }, [routeCoords, selectedMode, optimizationPrefs, onRoutesFetched])

  const fetchRoutes = async (startCoords: [number, number], endCoords: [number, number]): Promise<Route[]> => {
    const routes: Route[] = []

    const routeConfigs = [
      { mode: "walk", profile: "foot", speed: 5, costPerKm: 0, emissionsPerKm: 0, color: "#10b981" },
      { mode: "bike", profile: "bike", speed: 15, costPerKm: 0.1, emissionsPerKm: 0, color: "#3b82f6" },
      { mode: "bus", profile: "car", speed: 25, costPerKm: 0.15, emissionsPerKm: 89, color: "#f59e0b" },
      { mode: "train", profile: "car", speed: 60, costPerKm: 0.12, emissionsPerKm: 41, color: "#8b5cf6" },
      { mode: "car", profile: "car", speed: 40, costPerKm: 0.58, emissionsPerKm: 192, color: "#ef4444" },
      { mode: "rideshare", profile: "car", speed: 35, costPerKm: 1.2, emissionsPerKm: 96, color: "#ec4899" },
    ]

    for (const config of routeConfigs) {
      try {
        console.log(`[v0] Fetching ${config.mode} route via API`)

        const response = await fetch(
          `/api/route?profile=${config.profile}&start=${endCoords[1]},${endCoords[0]}&end=${startCoords[1]},${startCoords[0]}`,
        )

        if (response.ok) {
          const data = await response.json()

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0]
            const coords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number])
            const distance = route.distance
            const duration = route.duration

            console.log(
              `[v0] Fetched ${config.mode} route: ${coords.length} points, ${(distance / 1000).toFixed(1)}km, ${(duration / 60).toFixed(1)}min`,
            )

            routes.push({
              mode: config.mode,
              path: coords,
              distance: distance,
              duration: duration,
              cost: (distance / 1000) * config.costPerKm,
              emissions: (distance / 1000) * config.emissionsPerKm,
              color: config.color,
            })
          } else {
            console.log(`[v0] No valid route found for ${config.mode}`)
          }
        }
      } catch (error) {
        console.error(`[v0] Error fetching ${config.mode} route:`, error)
      }
    }

    if (routes.length === 0) {
      console.log("[v0] API routing failed, generating estimated routes")

      const straightDistance = calculateDistance(startCoords, endCoords)

      routeConfigs.forEach((config) => {
        const offset =
          config.mode === "walk" ? 0.003 : config.mode === "bike" ? -0.003 : config.mode === "car" ? 0.002 : -0.001
        const midPoint1: [number, number] = [
          startCoords[0] * 0.7 + endCoords[0] * 0.3 + offset,
          startCoords[1] * 0.7 + endCoords[1] * 0.3 - offset,
        ]
        const midPoint2: [number, number] = [
          startCoords[0] * 0.3 + endCoords[0] * 0.7 - offset,
          startCoords[1] * 0.3 + endCoords[1] * 0.7 + offset,
        ]

        const path: [number, number][] = [startCoords, midPoint1, midPoint2, endCoords]

        const multiplier =
          config.mode === "walk"
            ? 1.3
            : config.mode === "bike"
              ? 1.25
              : config.mode === "bus"
                ? 1.5
                : config.mode === "train"
                  ? 1.1
                  : config.mode === "car"
                    ? 1.4
                    : 1.45
        const estimatedDistance = straightDistance * multiplier
        const estimatedDuration = (estimatedDistance / config.speed) * 3600

        routes.push({
          mode: config.mode,
          path,
          distance: estimatedDistance * 1000,
          duration: estimatedDuration,
          cost: estimatedDistance * config.costPerKm,
          emissions: estimatedDistance * config.emissionsPerKm,
          color: config.color,
        })
      })
    }

    return routes
  }

  useEffect(() => {
    if (!isTracking || !navigator.geolocation) return

    console.log("[v0] Starting real-time location tracking")

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setRealTimeLocation({ lat: latitude, lng: longitude })
        console.log("[v0] Location updated:", { latitude, longitude })

        if (mapRef.current && isLoaded) {
          const userIcon = L.divIcon({
            className: "custom-marker",
            html: `<div style="position: relative;">
              <div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8); position: relative; z-index: 2;"></div>
              <div style="position: absolute; top: -4px; left: -4px; background-color: rgba(59, 130, 246, 0.3); width: 24px; height: 24px; border-radius: 50%; animation: pulse 2s infinite;"></div>
            </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })

          if (userMarkerRef.current) {
            userMarkerRef.current.remove()
          }

          userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon }).addTo(mapRef.current)
          userMarkerRef.current.bindPopup("<strong>Your Live Location</strong><br>Tracking in real-time")

          mapRef.current.setView([latitude, longitude], mapRef.current.getZoom())

          if (routeCoords) {
            calculateLiveETA(latitude, longitude)
          }
        }
      },
      (error) => {
        console.error("[v0] Real-time tracking error:", error)
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      },
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        console.log("[v0] Stopped real-time tracking")
      }
    }
  }, [isTracking, isLoaded, routeCoords])

  const calculateLiveETA = (currentLat: number, currentLng: number) => {
    if (!routeCoords) return

    const distance = calculateDistance(currentLat, currentLng, routeCoords.end[0], routeCoords.end[1])

    const speeds = {
      walk: 5,
      bike: 15,
      bus: 30,
      train: 50,
      rideshare: 40,
      car: 50,
    }

    const speed = speeds[selectedMode as keyof typeof speeds] || speeds.car
    const timeInHours = distance / speed
    const timeInMinutes = Math.round(timeInHours * 60)

    setLiveETA(`${timeInMinutes} min`)
    console.log("[v0] Live ETA updated:", timeInMinutes, "minutes")
  }

  const calculateDistance = (lat1: number, lon1: number, lat2?: number, lon2?: number) => {
    const R = 6371
    const dLat = (((lat2 || 0) - lat1) * Math.PI) / 180
    const dLon = (((lon2 || 0) - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos(((lat2 || 0) * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const toggleTracking = () => {
    setIsTracking(!isTracking)
  }

  const toggleBusinessData = () => {
    setShowBusinessData(!showBusinessData)
  }

  const fetchBusinessData = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1`,
      )
      const data = await response.json()

      if (data.extratags) {
        const businessInfo = {
          name: data.name || "Unknown",
          type: data.type || "Location",
          phone: data.extratags["contact:phone"] || data.extratags.phone,
          website: data.extratags["contact:website"] || data.extratags.website,
          hours: data.extratags.opening_hours,
          address: data.display_name,
        }

        return businessInfo
      }
    } catch (error) {
      console.error("[v0] Error fetching business data:", error)
    }
    return null
  }

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <Button
          onClick={toggleTracking}
          size="sm"
          variant={isTracking ? "default" : "outline"}
          className="bg-card border-border shadow-lg"
          title={isTracking ? "Stop live tracking" : "Start live tracking"}
        >
          <svg
            className="w-4 h-4"
            fill={isTracking ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Button>

        {isTracking && liveETA && (
          <Card className="px-3 py-2 bg-card border-border shadow-lg">
            <div className="text-xs font-semibold text-foreground">ETA: {liveETA}</div>
          </Card>
        )}

        <Card className="p-1 bg-card border-border shadow-lg">
          <div className="flex flex-col gap-1">
            <Button
              onClick={toggleBusinessData}
              size="sm"
              variant={showBusinessData ? "default" : "ghost"}
              className="text-xs h-7"
            >
              Business Data
            </Button>
          </div>
        </Card>
      </div>

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

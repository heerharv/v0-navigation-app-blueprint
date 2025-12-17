"use client"

import { useState, useEffect } from "react"
import { MapView } from "@/components/map-view"
import { RouteComparison } from "@/components/route-comparison"
import { SearchBar } from "@/components/search-bar"
import { SafetyButton } from "@/components/safety-button"
import { RouteOptimizer } from "@/components/route-optimizer"
import { ShipmentCalculator } from "@/components/shipment-calculator"
import { CommuteTracker } from "@/components/commute-tracker"
import { EmissionTips } from "@/components/emission-tips"
import { CarbonCredits } from "@/components/carbon-credits"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function NavigationApp() {
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [showRoutes, setShowRoutes] = useState(false)
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [optimizationPrefs, setOptimizationPrefs] = useState({
    time: 50,
    cost: 30,
    emissions: 20,
  })
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })

          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            )
            const data = await response.json()

            if (data.display_name) {
              setOrigin(data.display_name)
            } else {
              setOrigin(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
            }
          } catch (error) {
            console.error("Reverse geocoding error:", error)
            setOrigin(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
          }
        },
        (error) => {
          console.error("Geolocation error:", error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    }
  }, [])

  const handleSearch = () => {
    if (origin && destination) {
      setShowRoutes(true)
    }
  }

  const handleLocationDetected = (lat: number, lng: number) => {
    setUserLocation({ lat, lng })
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-foreground">EmissioNavi</h1>
        </div>
        <SafetyButton />
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Map - takes remaining space */}
        <div className="flex-1 relative">
          <MapView
            origin={origin}
            destination={destination}
            selectedMode={selectedMode}
            showRoutes={showRoutes}
            userLocation={userLocation}
            optimizationPrefs={optimizationPrefs}
          />

          {/* Route Comparison Panel */}
          {showRoutes && (
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <RouteComparison
                origin={origin}
                destination={destination}
                selectedMode={selectedMode}
                onSelectMode={setSelectedMode}
                optimizationPrefs={optimizationPrefs}
              />
            </div>
          )}
        </div>

        <div className="w-96 border-l border-border bg-card flex flex-col h-full">
          <Tabs defaultValue="navigate" className="flex-1 flex flex-col h-full">
            <TabsList className="w-full rounded-none border-b border-border bg-card p-1 flex-shrink-0">
              <TabsTrigger value="navigate" className="flex-1 text-xs">
                Navigate
              </TabsTrigger>
              <TabsTrigger value="shipment" className="flex-1 text-xs">
                Shipment
              </TabsTrigger>
              <TabsTrigger value="track" className="flex-1 text-xs">
                Track
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex-1 text-xs">
                Rewards
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="navigate" className="p-4 space-y-4 m-0 h-full">
                <SearchBar
                  origin={origin}
                  destination={destination}
                  onOriginChange={setOrigin}
                  onDestinationChange={setDestination}
                  onSearch={handleSearch}
                  onLocationDetected={handleLocationDetected}
                />

                {showRoutes && (
                  <RouteOptimizer preferences={optimizationPrefs} onPreferencesChange={setOptimizationPrefs} />
                )}

                <EmissionTips />
              </TabsContent>

              <TabsContent value="shipment" className="p-4 space-y-4 m-0 h-full">
                <ShipmentCalculator />
                <EmissionTips />
              </TabsContent>

              <TabsContent value="track" className="p-4 space-y-4 m-0 h-full">
                <CommuteTracker />
              </TabsContent>

              <TabsContent value="rewards" className="p-4 space-y-4 m-0 h-full">
                <CarbonCredits />
                <EmissionTips />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

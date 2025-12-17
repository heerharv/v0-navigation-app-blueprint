"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  calculateEmissions,
  calculateTravelTime,
  calculateCost,
  calculateCalories,
  formatEmissions,
} from "@/lib/emissions-calculator"

interface RouteComparisonProps {
  origin: string
  destination: string
  selectedMode: string | null
  onSelectMode: (mode: string) => void
  optimizationPrefs: {
    time: number
    cost: number
    emissions: number
  }
  distanceKm?: number // Added actual distance from routing
}

export function RouteComparison({
  selectedMode,
  onSelectMode,
  optimizationPrefs,
  distanceKm = 5.0, // Default if no route calculated yet
}: RouteComparisonProps) {
  const isPeakHour =
    (new Date().getHours() >= 7 && new Date().getHours() <= 9) ||
    (new Date().getHours() >= 17 && new Date().getHours() <= 19)

  const routes = [
    {
      mode: "walk",
      icon: "🚶",
      name: "Walking",
      duration: `${Math.round(calculateTravelTime("walk", distanceKm))} min`,
      cost: `$${calculateCost("walk", distanceKm).toFixed(2)}`,
      emissions: calculateEmissions("walk", distanceKm),
      emissionsLabel: formatEmissions(calculateEmissions("walk", distanceKm)),
      difficulty: "Easy",
      calories: Math.round(calculateCalories("walk", distanceKm)),
      accessibility: "High",
      color: "bg-chart-1",
    },
    {
      mode: "bike",
      icon: "🚴",
      name: "Bike",
      duration: `${Math.round(calculateTravelTime("bike", distanceKm))} min`,
      cost: `$${calculateCost("bike", distanceKm).toFixed(2)}`,
      emissions: calculateEmissions("bike", distanceKm),
      emissionsLabel: formatEmissions(calculateEmissions("bike", distanceKm)),
      difficulty: "Moderate",
      calories: Math.round(calculateCalories("bike", distanceKm)),
      accessibility: "Medium",
      color: "bg-chart-5",
      note: distanceKm < 2 ? "Bike share available" : undefined,
    },
    {
      mode: "transit",
      icon: "🚌",
      name: "Public Transit",
      duration: `${Math.round(calculateTravelTime("bus", distanceKm) + 5)} min`, // +5 for wait time
      cost: `$${calculateCost("bus", distanceKm).toFixed(2)}`,
      emissions: calculateEmissions("bus", distanceKm),
      emissionsLabel: formatEmissions(calculateEmissions("bus", distanceKm)),
      difficulty: "Easy",
      provider: "Metro Transit",
      peakHour: isPeakHour,
      accessibility: "High",
      color: "bg-chart-2",
    },
    {
      mode: "train",
      icon: "🚆",
      name: "Train",
      duration: `${Math.round(calculateTravelTime("train", distanceKm) + 8)} min`, // +8 for station access
      cost: `$${calculateCost("train", distanceKm).toFixed(2)}`,
      emissions: calculateEmissions("train", distanceKm),
      emissionsLabel: formatEmissions(calculateEmissions("train", distanceKm)),
      difficulty: "Easy",
      provider: "City Rail",
      accessibility: "High",
      color: "bg-chart-4",
    },
    {
      mode: "rideshare",
      icon: "🚗",
      name: "Rideshare",
      duration: `${Math.round(calculateTravelTime("rideshare", distanceKm) + 3)} min`, // +3 for pickup
      cost: `$${calculateCost("rideshare", distanceKm, isPeakHour).toFixed(2)}`,
      emissions: calculateEmissions("rideshare", distanceKm),
      emissionsLabel: formatEmissions(calculateEmissions("rideshare", distanceKm)),
      difficulty: "Easy",
      provider: "Multiple providers",
      peakHour: isPeakHour,
      accessibility: "High",
      color: "bg-chart-3",
      note: isPeakHour ? "Surge pricing active" : undefined,
    },
    {
      mode: "car",
      icon: "🚙",
      name: "Personal Car",
      duration: `${Math.round(calculateTravelTime("car", distanceKm))} min`,
      cost: `$${calculateCost("car", distanceKm).toFixed(2)}`,
      emissions: calculateEmissions("car", distanceKm),
      emissionsLabel: formatEmissions(calculateEmissions("car", distanceKm)),
      difficulty: "Easy",
      note: "Parking + fuel estimate",
      accessibility: "Medium",
      color: "bg-destructive",
    },
  ]

  const calculateScore = (route: (typeof routes)[0]) => {
    const timeMinutes = Number.parseInt(route.duration)
    const costDollars = Number.parseFloat(route.cost.replace("$", ""))

    // Normalize to 0-1 scale
    const maxTime = Math.max(...routes.map((r) => Number.parseInt(r.duration)))
    const maxCost = Math.max(...routes.map((r) => Number.parseFloat(r.cost.replace("$", ""))))
    const maxEmissions = Math.max(...routes.map((r) => r.emissions))

    const timeScore = (1 - timeMinutes / maxTime) * optimizationPrefs.time
    const costScore = (1 - costDollars / maxCost) * optimizationPrefs.cost
    const emissionsScore = (1 - route.emissions / maxEmissions) * optimizationPrefs.emissions

    return (timeScore + costScore + emissionsScore) / 3
  }

  const sortedRoutes = [...routes].sort((a, b) => calculateScore(b) - calculateScore(a))
  const recommendedMode = sortedRoutes[0].mode

  const bestEcoRoute = routes.reduce((best, route) => (route.emissions < best.emissions ? route : best))
  const carRoute = routes.find((r) => r.mode === "car")!
  const savingsGrams = carRoute.emissions - bestEcoRoute.emissions
  const phoneCharges = Math.round(savingsGrams / 8.2) // 8.2g CO2 per phone charge

  return (
    <Card className="bg-card/98 backdrop-blur-sm border-t-2 border-border rounded-t-2xl rounded-b-none max-h-[60vh] md:max-h-[50vh]">
      <ScrollArea className="h-full">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Compare Routes</h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Best Match: {sortedRoutes[0].name}
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sortedRoutes.map((route) => {
              const isSelected = selectedMode === route.mode
              const isRecommended = route.mode === recommendedMode

              return (
                <Button
                  key={route.mode}
                  onClick={() => onSelectMode(route.mode)}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-start gap-3 text-left relative overflow-hidden transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/50 hover:bg-secondary/50"
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </div>
                  )}

                  <div className="flex items-center gap-3 w-full">
                    <div className="text-2xl">{route.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{route.name}</div>
                      {route.provider && <div className="text-xs text-muted-foreground">{route.provider}</div>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 w-full text-xs">
                    <div>
                      <div className="text-muted-foreground">Time</div>
                      <div className="font-semibold text-foreground">{route.duration}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Cost</div>
                      <div className="font-semibold text-foreground">{route.cost}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">CO₂</div>
                      <div
                        className={`font-semibold ${route.emissions === 0 ? "text-primary" : route.emissions > 100 ? "text-destructive" : "text-accent"}`}
                      >
                        {route.emissionsLabel}
                      </div>
                    </div>
                  </div>

                  {/* Carbon indicator bar */}
                  <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${route.color} transition-all`}
                      style={{ width: `${Math.min((route.emissions / 250) * 100, 100)}%` }}
                    />
                  </div>

                  {route.peakHour && (
                    <Badge variant="secondary" className="text-xs">
                      ⚠️ Peak hours
                    </Badge>
                  )}

                  {route.note && <div className="text-xs text-muted-foreground italic">{route.note}</div>}
                </Button>
              )
            })}
          </div>

          {/* Carbon Impact Summary */}
          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-foreground mb-1">Your Environmental Impact</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Choosing {bestEcoRoute.name.toLowerCase()} saves {formatEmissions(savingsGrams)} compared to driving.
                  That's equivalent to charging your phone {phoneCharges} times or saving{" "}
                  {(savingsGrams / 411).toFixed(1)} miles of driving!
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  )
}

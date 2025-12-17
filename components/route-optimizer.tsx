"use client"

import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

interface RouteOptimizerProps {
  preferences: {
    time: number
    cost: number
    emissions: number
  }
  onPreferencesChange: (preferences: { time: number; cost: number; emissions: number }) => void
}

export function RouteOptimizer({ preferences, onPreferencesChange }: RouteOptimizerProps) {
  const handleChange = (key: "time" | "cost" | "emissions", value: number) => {
    const remaining = 100 - value
    const otherKeys = (["time", "cost", "emissions"] as const).filter((k) => k !== key)
    const otherTotal = otherKeys.reduce((sum, k) => sum + preferences[k], 0)

    const newPrefs = { ...preferences, [key]: value }

    // Redistribute remaining percentage proportionally
    if (otherTotal > 0) {
      otherKeys.forEach((k) => {
        newPrefs[k] = Math.round((preferences[k] / otherTotal) * remaining)
      })
    } else {
      otherKeys.forEach((k) => {
        newPrefs[k] = Math.round(remaining / otherKeys.length)
      })
    }

    onPreferencesChange(newPrefs)
  }

  return (
    <Card className="w-72 p-4 bg-card/95 backdrop-blur-sm border-border shadow-lg">
      <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        Route Priorities
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground">Fastest Time</label>
            <span className="text-xs font-medium text-foreground">{preferences.time}%</span>
          </div>
          <Slider
            value={[preferences.time]}
            onValueChange={([value]) => handleChange("time", value)}
            max={100}
            step={5}
            className="[&_[role=slider]]:bg-chart-4"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground">Lowest Cost</label>
            <span className="text-xs font-medium text-foreground">{preferences.cost}%</span>
          </div>
          <Slider
            value={[preferences.cost]}
            onValueChange={([value]) => handleChange("cost", value)}
            max={100}
            step={5}
            className="[&_[role=slider]]:bg-accent"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground">Lowest Emissions</label>
            <span className="text-xs font-medium text-foreground">{preferences.emissions}%</span>
          </div>
          <Slider
            value={[preferences.emissions]}
            onValueChange={([value]) => handleChange("emissions", value)}
            max={100}
            step={5}
            className="[&_[role=slider]]:bg-primary"
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Adjust sliders to see routes that match your priorities. Routes are ranked by your preferences.
        </p>
      </div>
    </Card>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { calculateEmissions, formatEmissions } from "@/lib/emissions-calculator"

interface CommuteEntry {
  date: string
  mode: string
  distance: number
  emissions: number
}

export function CommuteTracker() {
  const [entries, setEntries] = useState<CommuteEntry[]>([])
  const [totalEmissions, setTotalEmissions] = useState(0)
  const [totalSavings, setTotalSavings] = useState(0)

  useEffect(() => {
    // Simulate loading saved commutes from localStorage
    const savedEntries = localStorage.getItem("commute_entries")
    if (savedEntries) {
      const parsed = JSON.parse(savedEntries)
      setEntries(parsed)
      calculateTotals(parsed)
    } else {
      // Sample data for demonstration
      const sampleEntries: CommuteEntry[] = [
        { date: "2024-01-15", mode: "bike", distance: 5.2, emissions: 0 },
        { date: "2024-01-14", mode: "transit", distance: 8.3, emissions: 37 },
        { date: "2024-01-13", mode: "walk", distance: 2.1, emissions: 0 },
        { date: "2024-01-12", mode: "car", distance: 8.3, emissions: 183 },
        { date: "2024-01-11", mode: "bike", distance: 5.2, emissions: 0 },
      ]
      setEntries(sampleEntries)
      calculateTotals(sampleEntries)
    }
  }, [])

  const calculateTotals = (data: CommuteEntry[]) => {
    const total = data.reduce((sum, entry) => {
      const modeMap: Record<string, any> = {
        walk: "walk",
        bike: "bike",
        transit: "bus",
        train: "train",
        car: "car",
        rideshare: "rideshare",
      }
      const emissionMode = modeMap[entry.mode] || "car"
      return sum + calculateEmissions(emissionMode as any, entry.distance)
    }, 0)
    setTotalEmissions(total)

    const potentialEmissions = data.reduce((sum, entry) => {
      return sum + calculateEmissions("car", entry.distance)
    }, 0)
    setTotalSavings(potentialEmissions - total)
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "walk":
        return "🚶"
      case "bike":
        return "🚴"
      case "transit":
        return "🚌"
      case "train":
        return "🚆"
      case "car":
        return "🚙"
      case "rideshare":
        return "🚗"
      default:
        return "📍"
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="font-semibold text-foreground">Commute Tracker</h3>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Total Emissions</div>
          <div className="text-xl font-bold text-foreground">{formatEmissions(totalEmissions)}</div>
          <div className="text-xs text-muted-foreground">this week</div>
        </div>
        <div className="p-3 bg-primary border border-primary rounded-lg">
          <div className="text-xs text-primary-foreground/80 mb-1">CO₂ Saved</div>
          <div className="text-xl font-bold text-primary-foreground">{formatEmissions(totalSavings)}</div>
          <div className="text-xs text-primary-foreground/80">vs. driving</div>
        </div>
      </div>

      {/* Recent Trips */}
      <div>
        <Label className="text-sm text-muted-foreground mb-2 block">Recent Commutes</Label>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {entries.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-xl">{getModeIcon(entry.mode)}</div>
                  <div>
                    <div className="text-sm font-medium text-foreground capitalize">{entry.mode}</div>
                    <div className="text-xs text-muted-foreground">{entry.date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">{entry.distance.toFixed(1)} km</div>
                  <div className={`text-xs ${entry.emissions === 0 ? "text-primary" : "text-muted-foreground"}`}>
                    {formatEmissions(entry.emissions)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Weekly Goal */}
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Weekly Goal</span>
          <Badge variant="default" className="bg-primary">
            73%
          </Badge>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: "73%" }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Keep up the great work! You've saved {formatEmissions(totalSavings)} this week.
        </p>
      </div>
    </Card>
  )
}

function Label({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={className} {...props}>
      {children}
    </label>
  )
}

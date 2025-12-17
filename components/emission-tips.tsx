"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Tip {
  title: string
  description: string
  impact: "high" | "medium" | "low"
  icon: string
  savings: string
}

const tips: Tip[] = [
  {
    title: "Bike Short Distances",
    description: "For trips under 5km, biking is faster than driving in urban areas and produces zero emissions.",
    impact: "high",
    icon: "🚴",
    savings: "Up to 1.1kg CO₂ per trip",
  },
  {
    title: "Carpool When Possible",
    description: "Share rides with colleagues or friends to reduce per-person emissions by up to 50%.",
    impact: "high",
    icon: "👥",
    savings: "550g CO₂ per 10km",
  },
  {
    title: "Use Public Transit",
    description: "Buses and trains produce 45-95% less CO₂ per passenger compared to single-occupancy vehicles.",
    impact: "high",
    icon: "🚌",
    savings: "175g CO₂ per 10km",
  },
  {
    title: "Walk When You Can",
    description: "Walking is the healthiest and greenest option for short trips. Aim for 10,000 steps daily!",
    impact: "medium",
    icon: "🚶",
    savings: "100% emissions free",
  },
  {
    title: "Plan Combined Trips",
    description: "Combine multiple errands into one trip to reduce total distance traveled.",
    impact: "medium",
    icon: "🗺️",
    savings: "20-30% fuel reduction",
  },
  {
    title: "Choose Electric Transit",
    description: "Electric buses and trains have 70% lower emissions than diesel equivalents.",
    impact: "medium",
    icon: "⚡",
    savings: "25g CO₂ per 10km",
  },
  {
    title: "Avoid Peak Hours",
    description: "Traffic congestion increases fuel consumption by 20-40%. Travel during off-peak times when possible.",
    impact: "low",
    icon: "⏰",
    savings: "80g CO₂ per trip",
  },
  {
    title: "Use Route Optimization",
    description: "Plan the most efficient route to minimize distance and avoid traffic delays.",
    impact: "low",
    icon: "🎯",
    savings: "10-15% fuel savings",
  },
]

export function EmissionTips() {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-primary text-primary-foreground"
      case "medium":
        return "bg-chart-4 text-chart-4-foreground"
      case "low":
        return "bg-chart-2 text-chart-2-foreground"
      default:
        return "bg-secondary"
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-chart-5/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-chart-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h3 className="font-semibold text-foreground">Emission Reduction Tips</h3>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-3 pr-4">
          {tips.map((tip, idx) => (
            <div key={idx} className="p-4 bg-secondary/50 rounded-lg space-y-2 hover:bg-secondary/70 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tip.icon}</span>
                  <h4 className="font-semibold text-sm text-foreground">{tip.title}</h4>
                </div>
                <Badge variant="secondary" className={getImpactColor(tip.impact)}>
                  {tip.impact}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{tip.description}</p>
              <div className="flex items-center gap-2 pt-2">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-medium text-primary">{tip.savings}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}

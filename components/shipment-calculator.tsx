"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { calculateFreightEmissions, formatEmissions } from "@/lib/emissions-calculator"

export function ShipmentCalculator() {
  const [weight, setWeight] = useState("")
  const [distance, setDistance] = useState("")
  const [method, setMethod] = useState<"freightAir" | "freightTruck" | "freightRail" | "freightShip">("freightTruck")
  const [emissions, setEmissions] = useState<number | null>(null)

  const calculateEmissions = () => {
    const w = Number.parseFloat(weight)
    const d = Number.parseFloat(distance)
    if (!isNaN(w) && !isNaN(d)) {
      const total = calculateFreightEmissions(method, w, d)
      setEmissions(total)
    }
  }

  const getMethodColor = (m: string) => {
    switch (m) {
      case "freightAir":
        return "bg-destructive"
      case "freightTruck":
        return "bg-chart-3"
      case "freightRail":
        return "bg-chart-4"
      case "freightShip":
        return "bg-primary"
      default:
        return "bg-secondary"
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-chart-3/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-chart-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 className="font-semibold text-foreground">Shipment CO₂ Calculator</h3>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="weight" className="text-sm text-muted-foreground">
            Package Weight (kg)
          </Label>
          <Input
            id="weight"
            type="number"
            placeholder="Enter weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="distance" className="text-sm text-muted-foreground">
            Shipping Distance (km)
          </Label>
          <Input
            id="distance"
            type="number"
            placeholder="Enter distance"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Transportation Method</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["freightAir", "freightTruck", "freightRail", "freightShip"] as const).map((m) => (
              <Button
                key={m}
                variant={method === m ? "default" : "outline"}
                size="sm"
                onClick={() => setMethod(m)}
                className="capitalize"
              >
                {m === "freightAir" && "✈️"}
                {m === "freightTruck" && "🚚"}
                {m === "freightRail" && "🚂"}
                {m === "freightShip" && "🚢"} {m}
              </Button>
            ))}
          </div>
        </div>

        <Button onClick={calculateEmissions} className="w-full">
          Calculate Emissions
        </Button>

        {emissions !== null && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{formatEmissions(emissions)}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {(Number.parseFloat(weight) * Number.parseFloat(distance)).toFixed(0)} ton-km
              </div>
            </div>

            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full ${getMethodColor(method)} transition-all`}
                style={{ width: `${Math.min((emissions / 1000) * 100, 100)}%` }}
              />
            </div>

            <div className="text-xs text-center text-muted-foreground">
              Equivalent to driving {(emissions / 192).toFixed(0)} km in a car
            </div>

            {method === "freightAir" && emissions > 0 && (
              <Badge variant="destructive" className="w-full justify-center">
                💡 Ship or rail transport could reduce emissions by up to 98%
              </Badge>
            )}
            {method === "freightTruck" && emissions > 0 && (
              <Badge variant="secondary" className="w-full justify-center">
                💡 Rail transport could reduce emissions by {Math.round(((62 - 22) / 62) * 100)}%
              </Badge>
            )}
            {(method === "freightRail" || method === "freightShip") && (
              <Badge variant="default" className="w-full justify-center bg-primary">
                ✅ Great choice! This is one of the most eco-friendly options
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

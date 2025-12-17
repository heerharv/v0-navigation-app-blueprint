"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { calculateCarbonCredits } from "@/lib/emissions-calculator"

export function CarbonCredits() {
  const [credits, setCredits] = useState(0)
  const [level, setLevel] = useState(1)
  const [nextLevelCredits, setNextLevelCredits] = useState(100)
  const [totalSavedGrams, setTotalSavedGrams] = useState(0)

  useEffect(() => {
    // Load saved credits
    const savedCredits = localStorage.getItem("carbon_credits")
    const savedGrams = localStorage.getItem("total_saved_grams")

    if (savedCredits && savedGrams) {
      const c = Number.parseInt(savedCredits)
      const g = Number.parseInt(savedGrams)
      setCredits(c)
      setTotalSavedGrams(g)
      calculateLevel(c)
    } else {
      const demoSavedGrams = 24700
      const demoCredits = calculateCarbonCredits(demoSavedGrams)
      setCredits(demoCredits)
      setTotalSavedGrams(demoSavedGrams)
      calculateLevel(demoCredits)
    }
  }, [])

  const calculateLevel = (c: number) => {
    const lvl = Math.floor(c / 100) + 1
    setLevel(lvl)
    setNextLevelCredits(lvl * 100)
  }

  const progress = ((credits % 100) / 100) * 100

  const achievements = [
    { name: "Green Beginner", credits: 100, unlocked: credits >= 100, icon: "🌱" },
    { name: "Eco Warrior", credits: 250, unlocked: credits >= 250, icon: "🌿" },
    { name: "Carbon Champion", credits: 500, unlocked: credits >= 500, icon: "🏆" },
    { name: "Planet Protector", credits: 1000, unlocked: credits >= 1000, icon: "🌍" },
  ]

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-chart-5/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-chart-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="font-semibold text-foreground">Carbon Credits</h3>
        <Badge variant="default" className="ml-auto bg-primary">
          Level {level}
        </Badge>
      </div>

      {/* Credits Display */}
      <div className="p-6 bg-gradient-to-br from-primary/20 to-chart-5/20 rounded-lg text-center space-y-2">
        <div className="text-4xl font-bold text-foreground">{credits}</div>
        <div className="text-sm text-muted-foreground">Total Carbon Credits Earned</div>
        <div className="text-xs text-muted-foreground">
          1 credit = 100g CO₂ saved
          <br />
          You've saved {(totalSavedGrams / 1000).toFixed(2)}kg total
        </div>
      </div>

      {/* Progress to Next Level */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress to Level {level + 1}</span>
          <span className="font-semibold text-foreground">
            {credits % 100}/{100}
          </span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Achievements */}
      <div>
        <div className="text-sm font-medium text-foreground mb-3">Achievements</div>
        <div className="grid grid-cols-2 gap-2">
          {achievements.map((achievement, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-center transition-all ${
                achievement.unlocked ? "bg-primary/10 border-primary/30" : "bg-secondary/30 border-border opacity-50"
              }`}
            >
              <div className="text-2xl mb-1">{achievement.icon}</div>
              <div className="text-xs font-medium text-foreground">{achievement.name}</div>
              <div className="text-xs text-muted-foreground">{achievement.credits} credits</div>
              {achievement.unlocked && (
                <Badge variant="default" className="mt-1 bg-primary text-[10px] py-0">
                  Unlocked
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rewards Info */}
      <div className="p-3 bg-chart-5/5 border border-chart-5/20 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-chart-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-xs text-muted-foreground leading-relaxed">
            Earn credits by choosing eco-friendly transport. Each credit represents real CO₂ savings. Redeem 50 credits
            for bike share discounts, 100 for transit passes, and more!
          </div>
        </div>
      </div>

      <Button variant="outline" className="w-full bg-transparent">
        View Rewards Catalog
      </Button>
    </Card>
  )
}

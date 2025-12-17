/**
 * Accurate Carbon Emissions Calculator
 * Based on research from EPA, DEFRA, and transport emission databases
 */

// Emission factors in grams of CO2 per passenger-kilometer
export const EMISSION_FACTORS = {
  // Zero-emission modes
  walk: 0,
  bike: 0,

  // Public transport (per passenger-km)
  bus: 89, // Average diesel bus
  busElectric: 30, // Electric bus
  train: 41, // Commuter/regional train
  trainElectric: 35, // Electric train
  subway: 28, // Metro/underground
  tram: 29, // Light rail/tram

  // Personal vehicles (assumes single occupancy)
  car: 192, // Average gasoline car (single occupancy)
  carDiesel: 171, // Diesel car
  carElectric: 53, // Electric car (grid average)
  carHybrid: 120, // Hybrid car

  // Ride services (single passenger)
  rideshare: 192, // Same as car (single occupancy)
  ridesharePool: 96, // Shared ride (assumes 2 passengers)
  taxi: 211, // Taxi (typically less efficient)

  // Shipping/freight (per ton-km)
  freightTruck: 62, // Road freight
  freightRail: 22, // Rail freight
  freightShip: 10, // Sea freight
  freightAir: 500, // Air freight
} as const

// Average speeds in km/h for time calculations
export const AVERAGE_SPEEDS = {
  walk: 5,
  bike: 15,
  bus: 20,
  train: 60,
  subway: 35,
  tram: 25,
  car: 40,
  rideshare: 40,
  taxi: 35,
} as const

// Cost calculations (USD per km + base fare)
export const COST_FACTORS = {
  walk: { perKm: 0, baseFare: 0 },
  bike: { perKm: 0.15, baseFare: 0 }, // Wear and tear, bike share
  bus: { perKm: 0, baseFare: 2.75 }, // Flat fare
  train: { perKm: 0.25, baseFare: 3.0 },
  subway: { perKm: 0, baseFare: 2.75 },
  car: { perKm: 0.58, baseFare: 0 }, // IRS standard mileage rate (fuel, maintenance, depreciation)
  rideshare: { perKm: 2.5, baseFare: 2.5 }, // Base + per km
  taxi: { perKm: 2.0, baseFare: 3.5 },
} as const

// Calories burned per km
export const CALORIES_PER_KM = {
  walk: 65,
  bike: 40,
} as const

/**
 * Calculate emissions for a route
 */
export function calculateEmissions(mode: keyof typeof EMISSION_FACTORS, distanceKm: number): number {
  return EMISSION_FACTORS[mode] * distanceKm
}

/**
 * Calculate estimated travel time
 */
export function calculateTravelTime(mode: keyof typeof AVERAGE_SPEEDS, distanceKm: number): number {
  const hours = distanceKm / AVERAGE_SPEEDS[mode]
  return hours * 60 // Return minutes
}

/**
 * Calculate trip cost
 */
export function calculateCost(
  mode: keyof typeof COST_FACTORS,
  distanceKm: number,
  peakHour = false,
  passengers = 1,
): number {
  const factors = COST_FACTORS[mode]
  let cost = factors.baseFare + factors.perKm * distanceKm

  // Apply peak hour surge for rideshare/taxi
  if (peakHour && (mode === "rideshare" || mode === "taxi")) {
    cost *= 1.5
  }

  // Divide by passengers if carpooling
  if (passengers > 1 && (mode === "car" || mode === "rideshare")) {
    cost /= passengers
  }

  return cost
}

/**
 * Calculate calories burned for active transport
 */
export function calculateCalories(
  mode: "walk" | "bike",
  distanceKm: number,
  weightKg = 70, // Average adult weight
): number {
  const baseCalories = CALORIES_PER_KM[mode] * distanceKm
  // Adjust for body weight (heavier people burn more calories)
  return baseCalories * (weightKg / 70)
}

/**
 * Calculate freight shipping emissions
 */
export function calculateFreightEmissions(
  method: "freightTruck" | "freightRail" | "freightShip" | "freightAir",
  weightKg: number,
  distanceKm: number,
): number {
  const weightTons = weightKg / 1000
  return EMISSION_FACTORS[method] * weightTons * distanceKm
}

/**
 * Calculate carbon credits earned (1 credit = 100g CO2 saved)
 */
export function calculateCarbonCredits(savedEmissionsGrams: number): number {
  return Math.floor(savedEmissionsGrams / 100)
}

/**
 * Calculate emissions savings compared to baseline (car)
 */
export function calculateSavings(
  actualMode: keyof typeof EMISSION_FACTORS,
  distanceKm: number,
  baseline: keyof typeof EMISSION_FACTORS = "car",
): number {
  const actualEmissions = calculateEmissions(actualMode, distanceKm)
  const baselineEmissions = calculateEmissions(baseline, distanceKm)
  return Math.max(0, baselineEmissions - actualEmissions)
}

/**
 * Format emissions for display with appropriate units
 */
export function formatEmissions(gramsC02: number): string {
  if (gramsC02 >= 1000) {
    return `${(gramsC02 / 1000).toFixed(2)} kg CO₂`
  }
  return `${Math.round(gramsC02)}g CO₂`
}

/**
 * Get emissions category for color coding
 */
export function getEmissionsCategory(gramsC02: number): "zero" | "low" | "medium" | "high" {
  if (gramsC02 === 0) return "zero"
  if (gramsC02 < 50) return "low"
  if (gramsC02 < 150) return "medium"
  return "high"
}

/**
 * Calculate real-world distance multiplier based on terrain and traffic
 */
export function applyRealWorldFactor(
  straightLineDistanceKm: number,
  mode: keyof typeof AVERAGE_SPEEDS,
  terrain: "urban" | "suburban" | "highway" = "urban",
): number {
  const terrainMultipliers = {
    urban: 1.3, // City streets with turns
    suburban: 1.2, // Mix of straight and curved roads
    highway: 1.1, // More direct routes
  }

  return straightLineDistanceKm * terrainMultipliers[terrain]
}

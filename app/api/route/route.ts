import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const profile = searchParams.get("profile") || "car"
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  if (!start || !end) {
    return NextResponse.json({ error: "Missing start or end coordinates" }, { status: 400 })
  }

  try {
    const osrmProfile = profile === "foot" ? "foot" : profile === "bike" ? "bike" : "driving"
    const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${start};${end}?overview=full&geometries=geojson&steps=true`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "CarbonAwareNavigationApp/1.0",
      },
    })

    if (!response.ok) {
      console.error("[v0] OSRM API error:", response.status)
      return NextResponse.json({ error: "OSRM API error", code: "Error" }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Server-side routing error:", error)
    return NextResponse.json({ error: "Failed to fetch route", code: "Error" }, { status: 500 })
  }
}

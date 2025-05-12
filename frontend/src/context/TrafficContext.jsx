"use client"

import { createContext, useState, useEffect, useCallback } from "react"
import { API_URL } from "../config"

export const TrafficContext = createContext()

export const TrafficProvider = ({ children }) => {
  const [cityMap, setCityMap] = useState({ nodes: [], edges: [], trafficLights: {} })
  const [trafficData, setTrafficData] = useState({
    vehiclePositions: {},
    trafficDensity: {},
    incidents: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1) // seconds per step

  // Fetch city map data
  const fetchCityMap = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/city-map`)
      if (!response.ok) {
        throw new Error("Failed to fetch city map")
      }
      const data = await response.json()
      setCityMap(data)
    } catch (err) {
      setError(err.message)
      console.error("Error fetching city map:", err)
    }
  }, [])

  // Fetch traffic data
  const fetchTrafficData = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/traffic-data`)
      if (!response.ok) {
        throw new Error("Failed to fetch traffic data")
      }
      const data = await response.json()
      setTrafficData(data)
    } catch (err) {
      setError(err.message)
      console.error("Error fetching traffic data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Optimize traffic lights
  const optimizeTrafficLights = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/optimize-lights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to optimize traffic lights")
      }

      const data = await response.json()

      // Update city map with new timings
      setCityMap((prevMap) => ({
        ...prevMap,
        trafficLights: {
          ...prevMap.trafficLights,
          ...data.newTimings,
        },
      }))

      return data
    } catch (err) {
      setError(err.message)
      console.error("Error optimizing traffic lights:", err)
      return null
    }
  }, [])

  // Calculate route
  const calculateRoute = useCallback(async (startNode, endNode) => {
    try {
      const response = await fetch(`${API_URL}/api/route`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ start: startNode, end: endNode }),
      })

      if (!response.ok) {
        throw new Error("Failed to calculate route")
      }

      return await response.json()
    } catch (err) {
      setError(err.message)
      console.error("Error calculating route:", err)
      return null
    }
  }, [])

  // Reroute vehicles
  const rerouteVehicles = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/reroute-vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to reroute vehicles")
      }

      return await response.json()
    } catch (err) {
      setError(err.message)
      console.error("Error rerouting vehicles:", err)
      return null
    }
  }, [])

  // Run simulation
  const runSimulation = useCallback(
    async (steps = 1) => {
      try {
        const response = await fetch(`${API_URL}/api/simulate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ steps }),
        })

        if (!response.ok) {
          throw new Error("Failed to run simulation")
        }

        await fetchTrafficData()
        return true
      } catch (err) {
        setError(err.message)
        console.error("Error running simulation:", err)
        return false
      }
    },
    [fetchTrafficData],
  )

  // Reset simulation
  const resetSimulation = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/reset-simulation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to reset simulation")
      }

      await fetchTrafficData()
      return true
    } catch (err) {
      setError(err.message)
      console.error("Error resetting simulation:", err)
      return false
    }
  }, [fetchTrafficData])

  // Add incident
  const addIncident = useCallback(
    async (location, type = "accident", duration = 10) => {
      try {
        const response = await fetch(`${API_URL}/api/add-incident`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ location, type, duration }),
        })

        if (!response.ok) {
          throw new Error("Failed to add incident")
        }

        await fetchTrafficData()
        return true
      } catch (err) {
        setError(err.message)
        console.error("Error adding incident:", err)
        return false
      }
    },
    [fetchTrafficData],
  )

  // Start/stop continuous simulation
  const toggleSimulation = useCallback(() => {
    setSimulationRunning((prev) => !prev)
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchCityMap()
    fetchTrafficData()
  }, [fetchCityMap, fetchTrafficData])

  // Continuous simulation loop
  useEffect(() => {
    let intervalId

    if (simulationRunning) {
      intervalId = setInterval(() => {
        runSimulation(1)
      }, simulationSpeed * 1000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [simulationRunning, simulationSpeed, runSimulation])

  return (
    <TrafficContext.Provider
      value={{
        cityMap,
        trafficData,
        loading,
        error,
        simulationRunning,
        simulationSpeed,
        setSimulationSpeed,
        fetchCityMap,
        fetchTrafficData,
        optimizeTrafficLights,
        calculateRoute,
        rerouteVehicles,
        runSimulation,
        resetSimulation,
        addIncident,
        toggleSimulation,
      }}
    >
      {children}
    </TrafficContext.Provider>
  )
}
